/* 应用配色对比度审计（WCAG 2.1 相对亮度）
 *
 * 背景：应用市场自检要求「图标/标题文字与背景对比度 > 3:1；正文文字 > 4.5:1」。
 * 2026-09-10 自检在浅色模式下报出某 Text 控件对比度 1.83（Index.ets 毕法赋卡下方合规提示，
 * 前景 #5A4F3D 叠在 8% 金底的深色面板上，实测 1.82），故补此工具做全量排查与回归门禁。
 *
 * 判定方式：
 *   1) 逐条取 `fontColor('...')`；
 *   2) 先看**同一元素**自身修饰符链上的背景（chip 常见写法）；
 *   3) 否则沿「最近的容器开括号」逐层向外找容器背景（backgroundColor / linearGradient 色停）；
 *   4) 背景是 rgba 时，向外找父背景做 alpha 合成；
 *   5) 背景写成 `this.roleColor(...)` 这类辅助函数时，解析该函数的全部 return 色值；
 *   6) 浅色底（亮度 > 0.5）区块内的文字按该浅色底判定；被调 @Builder 若其所有调用点都在浅色
 *      区块内（案例鉴赏的 reasoningItem 即如此），其内部文字同样按浅色底判定；
 *   7) 完全推不出底色时，用最保守的「深底最亮参考值」DARK_WORST 判定。
 *
 * 用法：node _tools/contrast_audit.js [--json] [--file <关键字>] [--trace <文件名:行号>]
 * 退出码：存在低于 4.5:1 的文字时返回 1（图标/标题另需 > 3:1，此处按更严的正文阈值卡）；
 *   **2026-09-19 起：无法解析的跨文件传色同样返回 1**（不再只是提示）—— 见文件末尾的说明。
 * 覆盖边界（知道它看不见什么，才不会误以为"通过=全查过"）：
 *   ① 只扫声明式 UI 的 `fontColor(...)`／有语义的 border·divider·`.color()`；
 *   ② **Canvas 绘制的内容完全不在扫描面内**（天地盘 `ctx.fillStyle = tok(res,'令牌')`）——
 *      那块由 `_tools/panlayer_contrast.js` 单独出报告（层间可分辨性阈值待定，尚未入门禁）。
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ETS_ROOT = path.join(ROOT, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'ets');
const PAGE_FALLBACK_BG = '#14120F';
/* 深底最亮参考值：12% 金底叠在深色卡上（Index 抓用神入口那一档），保守用于「推不出底色」时 */
const DARK_WORST = { r: 53, g: 47, b: 34, a: 1, hex: '#352F22' };

/* ---------- 主题与令牌解析（2026-09-18 补） ----------
 * 为什么必须补：本工具原先**只认字符串字面量**色值。令牌化之后站点写成 $r('app.color.*')，
 * `fontColor\(\s*'…'` 一个都匹配不上 → 扫描面塌掉，**门禁被悄悄卸了械**（这是我自己造成的，
 * 见 commit dab82ed/580d0da）。现在：
 *   ① 按主题加载 base / dark 两套 color.json；
 *   ② 在取色值**之前**把 $r('app.color.X') 还原成 '<色值>'，后面的解析/合成逻辑一行不改；
 *   ③ 同一套审计跑两遍（深色、浅色），各自判定 —— 浅色值落地后即自动生效。
 * 用法新增：--theme dark|base|both（默认 both）
 */
const THEME_ARG = (() => { const i = process.argv.indexOf('--theme'); return i >= 0 ? process.argv[i + 1] : 'both'; })();
function loadTokens(theme) {
  const p = path.join(ROOT, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'resources', theme, 'element', 'color.json');
  const m = new Map();
  try { for (const t of JSON.parse(fs.readFileSync(p, 'utf-8')).color) m.set(t.name, String(t.value).toUpperCase()); }
  catch (e) { /* 缺该主题目录：留空，$r 保持原样并自然跳过 */ }
  return m;
}
const TOKENS = { dark: loadTokens('dark'), base: loadTokens('base') };
let THEME = 'dark';
let TOK = TOKENS.dark;
/** 把 $r('app.color.X') 还原成 '<色值>'；未知令牌保持原样 */
function substTokens(s) {
  return String(s).replace(/\$r\('app\.color\.([A-Za-z0-9_]+)'\)/g, (all, n) => (TOK.has(n) ? "'" + TOK.get(n) + "'" : all));
}
/* 推不出底色时的保守参考：深色主题取「深底最亮值」，浅色主题取浅底值 */
const WORST = { dark: DARK_WORST, base: { r: 242, g: 240, b: 235, a: 1, hex: '#F2F0EB' } };

function walk(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name.endsWith('.ets')) out.push(p);
  }
  return out;
}

/* ---------- 跨文件 prop 追溯（2026-09-18 补） ----------
 * 解析 `fontColor(this.color)` 这类"父级传进来的颜色"。原先只解析 字面量 / $r() /
 * 帮助函数 return / 本文件变量 ⇒ **跨文件传值是个静默盲点**（"初传干支看不清"就是这么漏掉的：
 * Index 里 chuanRows() 算出 color 字段 → 当 color prop 传给 ChuanCard）。
 * 定位交给 prop_trace.js，颜色提取仍在本文件（只有这里知道令牌表与主题）。 */
const propTrace = require('./prop_trace');
const FILE_TEXTS = walk(ETS_ROOT, []).map((f) => ({
  rel: path.relative(ROOT, f).replace(/\\/g, '/'),
  text: fs.readFileSync(f, 'utf-8')
}));
const PROP_CACHE = new Map();
/* 无法解析的跨文件传色：记 **站点位置**（2026-09-19 起由"提示"升级为"判否"，理由见文件末尾） */
const PROP_UNRESOLVED = [];
let PROP_RESOLVED = 0;

/* 豁免：确实无法静态解析时，在该站点行（或其上一行）写 `contrast-ok: 理由` 放行（理由必填）。
 * 与 _test_ui_layout.js 的 `layout-ok: 理由` 同一约定 —— 豁免必须留下"为什么可以不管"。 */
function hasContrastOk(lines, i) {
  const one = (s) => /contrast-ok\s*[:：]\s*\S/.test(String(s || ''));
  return one(lines[i]) || one(lines[i - 1]);
}

/** 把"父级传入的 prop 表达式"解析成具体颜色（分层：直接值 → 帮助函数 → 数据对象字段 → 多一跳字段） */
function propColors(rel, fileText, propName, site) {
  const at = site || { line: 0, exempt: false };
  /* 缓存键**必须含主题**：令牌值随主题变，第一版只按 文件|prop 缓存，
   * 于是深色那遍的结果被浅色那遍复用（干支显示成 #E9C878 而不是浅色的 #7E5F1A）✗ */
  const key = THEME + '|' + rel + '|' + propName;
  if (PROP_CACHE.has(key)) return PROP_CACHE.get(key);
  const out = [];
  const comp = propTrace.componentNameOf(fileText);
  if (comp) {
    for (const e of propTrace.propExprs({ files: FILE_TEXTS, selfRel: rel, componentName: comp, propName })) {
      let got = candidatesOf(e.expr).map(parseColor).filter(Boolean);
      if (!got.length) {
        /* L3：this.helper(...) 的 return 值（在被调用方文件里找） */
        got = helperReturnColors(e.fileText.split(/\r?\n/), e.expr).map(parseColor).filter(Boolean);
      }
      if (!got.length) {
        /* L4b：this.fn()[i].field.sub —— 多一跳（2026-09-19 补，对应 §11 B 类"prop 追溯深度"） */
        const m2 = e.expr.match(/this\.([A-Za-z_$][\w$]*)\s*\([\s\S]*?\)[\s\S]*?\.([A-Za-z_$][\w$]*)\s*\.\s*([A-Za-z_$][\w$]*)/);
        if (m2) {
          for (const v of propTrace.fieldSubValues(e.fileText, m2[1], m2[2], m2[3])) {
            got = got.concat(candidatesOf(v).map(parseColor).filter(Boolean));
          }
        }
      }
      if (!got.length) {
        /* L4：this.fn()[i].field → 进 fn 体内找 field 的赋值 */
        const m = e.expr.match(/this\.([A-Za-z_$][\w$]*)\s*\([\s\S]*?\)[\s\S]*?\.([A-Za-z_$][\w$]*)/);
        if (m) {
          for (const v of propTrace.fieldValues(e.fileText, m[1], m[2])) {
            got = got.concat(candidatesOf(v).map(parseColor).filter(Boolean));
          }
        }
      }
      if (got.length) { out.push(...got); PROP_RESOLVED++; }
      else PROP_UNRESOLVED.push({
        siteRel: rel, siteLine: at.line, propName: propName,
        fromRel: e.fileRel, expr: e.expr.slice(0, 60), exempt: !!at.exempt
      });
    }
  }
  PROP_CACHE.set(key, out);
  return out;
}

/* ---------- 颜色计算 ---------- */
function parseColor(s) {
  const v = String(s).trim();
  /* 8 位 ARGB（HarmonyOS color.json 的半透明写法，如 #1AE9C878）——
   * 原先不认这个格式，于是所有半透明令牌都解析成 null、**被静默跳过** ✗ */
  let m = v.match(/^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{6})$/);
  if (m) return { r: parseInt(m[2].substr(0, 2), 16), g: parseInt(m[2].substr(2, 2), 16), b: parseInt(m[2].substr(4, 2), 16), a: parseInt(m[1], 16) / 255, hex: '#' + m[2].toUpperCase() };
  m = v.match(/^#([0-9A-Fa-f]{6})$/);
  if (m) return { r: parseInt(m[1].substr(0, 2), 16), g: parseInt(m[1].substr(2, 2), 16), b: parseInt(m[1].substr(4, 2), 16), a: 1, hex: '#' + m[1].toUpperCase() };
  m = v.match(/^#([0-9A-Fa-f]{3})$/);
  if (m) {
    const c = m[1];
    return { r: parseInt(c[0] + c[0], 16), g: parseInt(c[1] + c[1], 16), b: parseInt(c[2] + c[2], 16), a: 1, hex: '#' + (c[0] + c[0] + c[1] + c[1] + c[2] + c[2]).toUpperCase() };
  }
  m = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+)\s*)?\)$/);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4], hex: null };
  return null;
}
function toHex(c) {
  const h = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return ('#' + h(c.r) + h(c.g) + h(c.b)).toUpperCase();
}
function linear(v) { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }
function luminance(c) { return 0.2126 * linear(c.r) + 0.7152 * linear(c.g) + 0.0722 * linear(c.b); }
function contrast(a, b) { const la = luminance(a), lb = luminance(b), hi = Math.max(la, lb), lo = Math.min(la, lb); return (hi + 0.05) / (lo + 0.05); }
function composite(fg, bg) { return { r: fg.a * fg.r + (1 - fg.a) * bg.r, g: fg.a * fg.g + (1 - fg.a) * bg.g, b: fg.a * fg.b + (1 - fg.a) * bg.b, a: 1, hex: null }; }

/* ---------- 源码结构 ---------- */
const indentOf = (l) => (l.match(/^\s*/) || [''])[0].length;

function matchingClose(lines, openIdx) {
  let depth = 0;
  for (let j = openIdx; j < lines.length; j++) {
    depth += (lines[j].match(/\{/g) || []).length - (lines[j].match(/\}/g) || []).length;
    if (depth <= 0 && j > openIdx) return j;
    if (depth <= 0) return j;
  }
  return -1;
}
function matchingOpen(lines, closeIdx) {
  let depth = 0;
  for (let j = closeIdx; j >= 0; j--) {
    const s = lines[j];
    for (let k = s.length - 1; k >= 0; k--) {
      if (s[k] === '}') depth++;
      else if (s[k] === '{') { depth--; if (depth === 0) return j; }
    }
  }
  return -1;
}

/** 收集某缩进层修饰符链上的背景表达式（跳过闭合括号行本身） */
function bgExprsAt(lines, from, indent) {
  const out = [];
  for (let j = from; j < lines.length; j++) {
    const l = lines[j];
    if (l.trim() === '') continue;
    /* 注释行**不打断**修饰符链（2026-09-26 修）：原遇注释即 break，链上注释之后的
       backgroundColor 会被整段跳过 —— 底色随之推错或推不出，站点**静默失去覆盖**。
       实证：ChuanCard 三传行 `.justifyContent` 上方的一句注释，让它读不到 `ink_surface`。*/
    if (l.trim().startsWith('/*') || l.trim().startsWith('//')) continue;
    const ind = indentOf(l);
    if (ind < indent) break;
    if (ind > indent) continue;
    if (!l.trim().startsWith('.')) break;
    const mb = l.match(/\.backgroundColor\((.*)\)\s*$/);
    if (mb) { out.push(mb[1]); continue; }
    if (/\.linearGradient\(\{/.test(l)) {
      let depth = 0, buf = '';
      for (let k = j; k < lines.length; k++) {
        buf += lines[k];
        depth += (lines[k].match(/\{/g) || []).length - (lines[k].match(/\}/g) || []).length;
        if (depth <= 0) break;
      }
      out.push(buf);
    }
  }
  return out;
}

/** 同一元素自身修饰符链上的背景 */
function sameElementBgExprs(lines, i, textIndent) {
  const out = [];
  for (let j = i + 1; j < lines.length; j++) {
    const l = lines[j];
    if (l.trim() === '') continue;
    /* 同 bgExprsAt：注释不打断修饰符链 */
    if (l.trim().startsWith('/*') || l.trim().startsWith('//')) continue;
    if (indentOf(l) !== textIndent) break;
    if (!l.trim().startsWith('.')) break;
    const mb = l.match(/\.backgroundColor\((.*)\)\s*$/);
    if (mb) out.push(mb[1]);
    if (/\.linearGradient\(\{/.test(l)) {
      let depth = 0, buf = '';
      for (let k = j; k < lines.length; k++) {
        buf += lines[k];
        depth += (lines[k].match(/\{/g) || []).length - (lines[k].match(/\}/g) || []).length;
        if (depth <= 0) break;
      }
      out.push(buf);
    }
  }
  return out;
}

/** 沿「最近的容器开括号」逐层向外找背景 */
function enclosingBgExprs(lines, i) {
  let cur = i;
  for (let level = 0; level < 10; level++) {
    const ind = indentOf(lines[cur]);
    let op = -1;
    for (let j = cur - 1; j >= 0; j--) {
      const l = lines[j];
      if (l.trim() === '') continue;
      if (indentOf(l) < ind && /\{\s*$/.test(l)) {
        const cl = matchingClose(lines, j);
        if (cl >= cur) { op = j; break; }   /* 必须真的包住当前行；已闭合的兄弟块要跳过 */
      }
    }
    if (op < 0) break;
    const close = matchingClose(lines, op);
    if (close < 0) break;
    const exprs = bgExprsAt(lines, close + 1, indentOf(lines[op]));
    if (exprs.length) return exprs;
    cur = op;
  }
  return [];
}

function candidatesOf(expr) {
  const out = [];
  /* 先把 $r('app.color.X') 还原成色值字面量，再照原逻辑提取 */
  const re = /'(#[0-9A-Fa-f]{3,6}|rgba?\([^']*\))'/g;
  let m;
  const s = substTokens(expr);
  while ((m = re.exec(s))) out.push(m[1]);
  return out;
}

/** 解析 `this.helper(...)` 型底色的全部 return 值（字面量**或** $r 令牌） */
function helperReturnColors(lines, expr) {
  const hm = String(expr).match(/this\.([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
  if (!hm) return [];
  const name = hm[1];
  const openRe = new RegExp('(?:private|public|protected)?\\s*' + name + '\\s*\\([^)]*\\)\\s*(?::\\s*[^\\{]+)?\\{');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (!openRe.test(lines[i])) continue;
    const close = matchingClose(lines, i);
    if (close < 0) continue;
    for (let j = i; j <= close; j++) {
      /* 帮助函数升级为 ResourceColor 后，return 的是 $r('app.color.X')，也要能取到 */
      const rm = lines[j].match(/return\s+(?:'(#[0-9A-Fa-f]{3,6}|rgba?\([^']*\))'|\$r\('app\.color\.([A-Za-z0-9_]+)'\))/g);
      if (!rm) continue;
      for (const r of rm) {
        const lit = r.match(/'([^']+)'/);
        if (!lit) continue;
        if (/^#[0-9A-Fa-f]{3,6}$/.test(lit[1]) || /^rgba?\(/i.test(lit[1])) out.push(lit[1]);
        else if (TOK.has(lit[1])) out.push(TOK.get(lit[1]));
      }
    }
    break;
  }
  return out;
}

/** 展开表达式为具体颜色（含 rgba 合成父底、辅助函数 return 值） */
function expandExpr(lines, expr, parent) {
  const out = [];
  const raws = candidatesOf(expr);
  if (!raws.length) {
    for (const c of helperReturnColors(lines, expr)) {
      const col = parseColor(c);
      if (col) out.push(col);
    }
    return out;
  }
  for (const raw of raws) {
    const bg = parseColor(raw);
    if (!bg) continue;
    out.push(bg.a < 1 ? composite(bg, parent) : bg);
  }
  return out;
}

function resolveBg(lines, i, textIndent) {
  const same = sameElementBgExprs(lines, i, textIndent);
  const outer = enclosingBgExprs(lines, i);
  let parent = null;
  for (const oe of outer.concat(["'" + PAGE_FALLBACK_BG + "'"])) {
    for (const oraw of candidatesOf(oe)) {
      const p = parseColor(oraw);
      if (p && p.a === 1) { parent = p; break; }
    }
    if (parent) break;
  }
  if (!parent) parent = parseColor(PAGE_FALLBACK_BG);
  const exprs = same.length ? same : outer;
  const out = [];
  for (const expr of exprs) out.push(...expandExpr(lines, expr, parent));
  return { colors: out, resolved: out.length > 0, self: same.length > 0 };
}

/* ---------- 浅色区块 / @Builder ---------- */
function lightBlocks(lines) {
  const spans = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/\.backgroundColor\(/.test(lines[i])) continue;
    const cols = candidatesOf(lines[i]).map(parseColor).filter(Boolean).filter((c) => c.a === 1 && luminance(c) > 0.5);
    if (!cols.length) continue;
    let c = i - 1;
    while (c >= 0 && (lines[c].trim() === '' || lines[c].trim().startsWith('.'))) c--;
    if (c < 0 || lines[c].trim() !== '}') continue;
    const open = matchingOpen(lines, c);
    if (open < 0) continue;
    spans.push({ from: open + 1, to: c + 1, color: cols[0] });
  }
  return spans;
}

function builderIndex(lines, blocks) {
  const map = new Map();
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*(?:@Builder\s*)?(?:private|public)?\s*([A-Za-z_][A-Za-z0-9_]*)\s*\([^)]*\)\s*(?::\s*[^\{]+)?\{/);
    if (!m) continue;
    const close = matchingClose(lines, i);
    if (close < 0) continue;
    map.set(m[1], { from: i + 1, to: close + 1, calls: [], allCallsLight: false, lightColor: null });
  }
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/this\.([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
    if (!m) continue;
    const info = map.get(m[1]);
    if (info && !(i + 1 >= info.from && i + 1 <= info.to)) info.calls.push(i + 1);
  }
  for (const info of map.values()) {
    if (!info.calls.length) continue;
    const colors = info.calls.map((ln) => { for (const b of blocks) if (ln >= b.from && ln <= b.to) return b.color; return null; });
    if (colors.every((c) => c !== null)) { info.allCallsLight = true; info.lightColor = colors[0]; }
  }
  return map;
}

function lightColorAt(blocks, builders, lineNo) {
  for (const b of blocks) if (lineNo >= b.from && lineNo <= b.to) return b.color;
  for (const info of builders.values()) {
    if (lineNo >= info.from && lineNo <= info.to && info.allCallsLight) return info.lightColor;
  }
  return null;
}

/* ---------- 主流程 ---------- */
const fileFilter = (() => { const i = process.argv.indexOf('--file'); return i >= 0 ? process.argv[i + 1] : null; })();
const trace = (() => { const i = process.argv.indexOf('--trace'); return i >= 0 ? process.argv[i + 1] : null; })();
const files = walk(ETS_ROOT, []).filter((f) => !fileFilter || f.indexOf(fileFilter) >= 0);
const asJson = process.argv.includes('--json');
const THEMES_TO_RUN = THEME_ARG === 'both' ? ['dark', 'base'] : [THEME_ARG];

/* 前景色候选：字面量 / 令牌 / 帮助函数 return / **`this.<prop>`（跨文件追溯）**
 * 顺序要紧：`this.fn(` 这种带括号的要排在裸 `this.x` 前面，否则会被前者吃掉一半。 */
const FG_RE = /fontColor\(\s*(?:'(#[0-9A-Fa-f]{3,8}|rgba?\([^']*\))'|\$r\('app\.color\.([A-Za-z0-9_]+)'\)|(this\.[A-Za-z_][A-Za-z0-9_]*\s*\([^)]*\))|(this\.[A-Za-z_][A-Za-z0-9_]*))/;
function fgColorsOfLine(lines, line, ctx) {
  const m = line.match(FG_RE);
  if (!m) return [];
  if (m[1]) { const c = parseColor(m[1]); return c ? [c] : []; }
  if (m[2]) { const v = TOK.get(m[2]); const c = v ? parseColor(v) : null; return c ? [c] : []; }
  if (m[3]) return helperReturnColors(lines, m[3]).map(parseColor).filter(Boolean);
  if (m[4] && ctx) {
    /* 只有**参数整体就是** `this.<name>` 时才当作"跨文件传入的颜色"去追溯。
     * 第一版没这个限制：`fontColor(this.highlight ? $r(A) : $r(B))` 里的 this.highlight 被当成
     * 整个参数、于是去追溯一个**布尔** prop，得到 10 条"无法解析"的噪音（highlight/active/…）✗ */
    if (/fontColor\(\s*this\.[A-Za-z_][A-Za-z0-9_]*\s*\)/.test(line)) {
      return propColors(ctx.rel, ctx.text, m[4].replace(/^this\./, ''), { line: ctx.line, exempt: ctx.exempt });
    }
    /* 更长的表达式（三元等）：按表达式取色值并集 —— 保守（取最差对比度），也比跳过强 */
    const arg = (line.match(/fontColor\(([^)]*)\)/) || [])[1] || '';
    return candidatesOf(arg).map(parseColor).filter(Boolean);
  }
  return [];
}

/* 非文字站点（用户 2026-09-18 决策：**只卡"有语义的边界与状态"**）
 *   卡 3:1：状态相关（含三元的）border / borderColor / backgroundColor（选中态等就是靠三元切值的）
 *           divider({color}) 与 .color(...)（显式分隔线与指示器，本身就是语义）
 *   不卡  ：shadow / 渐变 / 常量 border（装饰性发丝线）/ 常量淡底 —— 只计数，便于人复核分类是否合理 */
function nonTextSitesOfLine(line) {
  const out = [];
  let m = line.match(/\.border\(\s*\{[^}]*?color:\s*([^,}]+)/);
  if (m) out.push({ attr: 'border', expr: m[1], semantic: /\?/.test(m[1]) });
  m = line.match(/\.borderColor\(\s*([^)]+)\)/);
  if (m) out.push({ attr: 'borderColor', expr: m[1], semantic: /\?/.test(m[1]) });
  m = line.match(/\.divider\(\s*\{[^}]*?color:\s*([^,}]+)/);
  if (m) out.push({ attr: 'divider', expr: m[1], semantic: true });
  m = line.match(/\.color\(\s*([^)]+)\)/);
  if (m) out.push({ attr: 'color', expr: m[1], semantic: true });
  /* 背景填充**一律不按 3:1 卡**（用户 2026-09-18 决策「不卡纯装饰」的落地口径）：
   * 本 App 的"选中"是靠金色边框 + 文字色表达，backgroundColor 多为卡面/淡底色调区分；
   * 而且 10% 的淡底在数学上不可能达到 3:1 —— 那本来就不是靠底色对比来传达的。 */
  m = line.match(/\.backgroundColor\(\s*([^)]+)\)/);
  if (m) out.push({ attr: 'backgroundColor', expr: m[1], semantic: false });
  return out;
}

/** 半透明前景必须先合成到底色上再算对比度（否则等于把 12% 的金当成纯金） */
function worstWith(fgList, bgList) {
  let worst = null;
  for (const fg0 of fgList) {
    for (const bg of bgList) {
      const fg = fg0.a < 1 ? composite(fg0, bg) : fg0;
      const c = contrast(fg, bg);
      if (!worst || c < worst.contrast) worst = { contrast: c, bgHex: bg.hex || toHex(bg), fgHex: fg0.hex || toHex(fg0) };
    }
  }
  return worst;
}

/* 字号令牌表（供"大字阈值"判定）：float.json 里 name → fp 数值 */
const FLOAT = (() => {
  const m = new Map();
  try {
    const p = path.join(ROOT, 'APP/LiurenFocusDiviner/entry/src/main/resources/base/element/float.json');
    for (const t of JSON.parse(fs.readFileSync(p, 'utf-8')).float) {
      const v = String(t.value).match(/^([\d.]+)fp$/);
      if (v) m.set(t.name, Number(v[1]));
    }
  } catch (e) { /* 缺文件则不判大字，一律按正文阈值（更严） */ }
  return m;
})();

/** 该文字站点是否"大字号"（WCAG：≥24fp；或 ≥18.66fp 且粗体）⇒ 阈值 3:1 而非 4.5:1 */
function isLargeText(lines, i, indent) {
  let size = 0, bold = false;
  for (let j = i; j < lines.length; j++) {
    const l = lines[j];
    if (l.trim() === '') continue;
    if (indentOf(l) !== indent || !l.trim().startsWith('.')) break;
    const ms = l.match(/fontSize\((\d+(?:\.\d+)?)\)/);
    if (ms) size = Number(ms[1]);
    const mt = l.match(/fontSize\(\$r\('app\.float\.([A-Za-z0-9_]+)'\)\)/);
    if (mt && FLOAT.has(mt[1])) size = FLOAT.get(mt[1]);
    if (/fontWeight\(\s*FontWeight\.(Bold|Bolder|Medium|Heavy)\s*\)/.test(l)) bold = true;
    if (/fontWeight\(\s*FontWeight\.(Normal|Regular|Lighter)\s*\)/.test(l)) bold = false;
  }
  return size >= 24 || (bold && size >= 18.66);
}

const perTheme = new Map();
for (const theme of THEMES_TO_RUN) {
  THEME = theme; TOK = TOKENS[theme];
  const findings = [], nonText = [], decoration = [];
  for (const f of files) {
    const lines = fs.readFileSync(f, 'utf-8').split(/\r?\n/);
    const ctx = { rel: path.relative(ROOT, f).replace(/\\/g, '/'), text: lines.join('\n'), line: 0, exempt: false };
    const blocks = lightBlocks(lines);
    const builders = builderIndex(lines, blocks);
    for (let i = 0; i < lines.length; i++) {
      /* ---- 文字（4.5:1） ---- */
      ctx.line = i + 1;
      ctx.exempt = hasContrastOk(lines, i);
      const fgs = fgColorsOfLine(lines, lines[i], ctx);
      if (fgs.length) {
        const ind = indentOf(lines[i]);
        if (trace && path.basename(f) + ':' + (i + 1) === trace) {
          console.log('--- trace ' + path.basename(f) + ':' + (i + 1) + ' 前景 ' + fgs.map((c) => c.hex || toHex(c)).join('/') + ' 缩进 ' + ind);
          console.log('    同行修饰符背景: ' + JSON.stringify(sameElementBgExprs(lines, i, ind)));
          console.log('    外层容器背景  : ' + JSON.stringify(enclosingBgExprs(lines, i)));
          console.log('    内层解析      : ' + JSON.stringify(resolveBg(lines, i, ind).colors.map((c) => c.hex || toHex(c))));
        }
        const light = lightColorAt(blocks, builders, i + 1);
        const res = resolveBg(lines, i, ind);
        /* 优先级：元素自带底色 > 浅色区块底 > 解析到的外层底 > 该主题的保守参考值 */
        const cands = res.self ? res.colors
          : (light ? [light] : (res.resolved ? res.colors : [WORST[theme]]));
        const worst = worstWith(fgs, cands);
        if (!worst) continue;
        /* 阈值按字号分档（与项目规范一致：**正文 ≥4.5:1、图标/标题 ≥3:1**）。
         * 不区分大小字会把"干支"这种 fs_title 粗体的大字误判违规 —— 本工具第一版就一律按 4.5 卡，
         * 追溯能力一上线就报出一条假阳性（ChuanCard 干支 4.26:1，其实按大字 3:1 是达标的）。 */
        const big = isLargeText(lines, i, ind);
        const need = big ? 3 : 4.5;
        findings.push({
          file: path.basename(f), line: i + 1, fg: worst.fgHex,
          context: (res.self ? '元素自身' : (light ? '浅底' : (res.resolved ? '深底' : '深底-推断'))) + (big ? '（大字）' : ''),
          need,
          below45: worst.contrast < need, below3: worst.contrast < 3, worst
        });
      }
      /* ---- 非文字（3:1，只卡有语义的） ---- */
      for (const s of nonTextSitesOfLine(lines[i])) {
        const cols = candidatesOf(s.expr).map(parseColor).filter(Boolean);
        if (!cols.length) continue;
        if (!s.semantic) { decoration.push({ file: path.basename(f), line: i + 1, attr: s.attr }); continue; }
        const res = resolveBg(lines, i, indentOf(lines[i]));
        const worst = worstWith(cols, res.resolved ? res.colors : [WORST[theme]]);
        if (!worst) continue;
        nonText.push({ file: path.basename(f), line: i + 1, attr: s.attr, fg: worst.fgHex, below3: worst.contrast < 3, worst });
      }
    }
  }
  perTheme.set(theme, { findings, nonText, decoration });
}

if (asJson) {
  const out = {};
  for (const [t, r] of perTheme) out[t] = { findings: r.findings, nonText: r.nonText, decorationCount: r.decoration.length };
  /* 无法解析的跨文件传色也进 JSON（函数声明会提升，故此处可用） */
  out.propTraceUnresolved = unresolvedUnique().map((u) => ({
    site: u.siteRel + ':' + u.siteLine, prop: u.propName, from: u.fromRel, expr: u.expr, exempt: u.exempt
  }));
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

let anyBad = 0;
for (const theme of THEMES_TO_RUN) {
  const r = perTheme.get(theme);
  r.findings.sort((a, b) => a.worst.contrast - b.worst.contrast);
  r.nonText.sort((a, b) => a.worst.contrast - b.worst.contrast);
  const bad = r.findings.filter((x) => x.below45);
  const badNt = r.nonText.filter((x) => x.below3);
  anyBad += bad.length + badNt.length;
  /* 注意：这里必须用 TOKENS[theme].size —— TOK 在报告阶段还停在"最后跑过的主题"上，
   * 直接用 TOK.size 会把 base 的数量当成 dark 的数量打印出来（我自己被它误导过一次）。 */
  console.log('\n=== 主题 ' + theme + '（令牌取自 ' + theme + '/element/color.json，共 ' + TOKENS[theme].size + ' 个） ===');
  console.log('文字：扫描 fontColor ' + r.findings.length + ' 处；低于 4.5:1 的 ' + bad.length + ' 处'
    + '（其中低于 3:1 的 ' + r.findings.filter((x) => x.below3).length + ' 处）');
  console.log('非文字：扫描有语义的边界/状态 ' + r.nonText.length + ' 处；低于 3:1 的 ' + badNt.length + ' 处'
    + '；装饰性常量边界/淡底 ' + r.decoration.length + ' 处按决策不入门禁（只计数，供复核分类）');
  console.log('推不出底色时按该主题保守参考值 ' + WORST[theme].hex + ' 判定');
  if (bad.length) {
    console.log('\n  [文字 <4.5:1]  对比度  底色(推断)  前景      上下文      位置');
    for (const x of bad) {
      console.log('  ' + x.worst.contrast.toFixed(2).padStart(6) + '  ' + x.worst.bgHex.padEnd(9) + ' ' + x.fg.padEnd(9) + ' ' + x.context.padEnd(10) + '  ' + x.file + ':' + x.line);
    }
    const byColor = new Map();
    for (const x of bad) {
      if (!byColor.has(x.fg)) byColor.set(x.fg, { n: 0, min: x.worst.contrast, files: new Set(), ctx: new Set() });
      const q = byColor.get(x.fg);
      q.n++; q.min = Math.min(q.min, x.worst.contrast); q.files.add(x.file); q.ctx.add(x.context);
    }
    console.log('  按前景色汇总（需改的色值）：');
    [...byColor.entries()].sort((a, b) => a[1].min - b[1].min).forEach(([c, q]) => {
      console.log('    ' + c + '  ' + String(q.n).padStart(3) + ' 处  最低 ' + q.min.toFixed(2) + '  ' + [...q.ctx].join('/') + '  ' + [...q.files].join(','));
    });
  }
  if (badNt.length) {
    console.log('\n  [边界/状态 <3:1]  对比度  底色(推断)  颜色      属性            位置');
    for (const x of badNt) {
      console.log('  ' + x.worst.contrast.toFixed(2).padStart(6) + '  ' + x.worst.bgHex.padEnd(9) + ' ' + x.fg.padEnd(9) + ' ' + x.attr.padEnd(14) + '  ' + x.file + ':' + x.line);
    }
  }
}

/* 跨文件 prop 传色的追溯情况（2026-09-19 起**从提示升级为判否**）：
 * 留成提示的话，将来写法深一层（例如本工具 L4b 之外的形态）就会**静默失去覆盖，而报告照样 PASS** ——
 * 这正是 §3.3 第 4 条"门禁会过期失效"的翻版（令牌化那次已经把本工具卸过一次械）。
 * 处理方式二选一：让解析器认得该写法（prop_trace.js L1–L4b，必要时补一层），
 * 或在该站点行写 `contrast-ok: 理由` 显式豁免（理由必填）。 */
function unresolvedUnique() {
  const m = new Map();
  for (const u of PROP_UNRESOLVED) m.set(u.siteRel + ':' + u.siteLine + ':' + u.propName, u);
  return [...m.values()];
}
const unresolved = unresolvedUnique();
const unresolvedHard = unresolved.filter((u) => !u.exempt);
console.log('\n跨文件 prop 传色：解析成功 ' + PROP_RESOLVED + ' 处（双主题合计，已计入上面判定）'
  + '；无法解析 ' + unresolved.length + ' 处'
  + (unresolved.length ? '（其中豁免 ' + (unresolved.length - unresolvedHard.length) + ' 处）' : ''));
for (const u of unresolvedHard.slice(0, 10)) {
  console.log('  ✗ 无法解析：' + u.siteRel + ':' + u.siteLine + ' 的 ' + u.propName
    + ' ← ' + u.fromRel + ' 传 ' + u.expr);
}
for (const u of unresolved.filter((x) => x.exempt).slice(0, 10)) {
  console.log('  · 已豁免：' + u.siteRel + ':' + u.siteLine + ' 的 ' + u.propName);
}
if (unresolvedHard.length) {
  console.log('  → 判否：请让解析器认得该写法（prop_trace.js L1–L4b），或在该站点行写 `contrast-ok: 理由`。');
}

process.exit((anyBad || unresolvedHard.length) ? 1 : 0);

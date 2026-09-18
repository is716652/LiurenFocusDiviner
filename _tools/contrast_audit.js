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
 * 退出码：存在低于 4.5:1 的文字时返回 1（图标/标题另需 > 3:1，此处按更严的正文阈值卡）。
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

/* 前景色候选：字面量 **或** 令牌 **或** 帮助函数（升级后帮助函数 return 的也是令牌） */
const FG_RE = /fontColor\(\s*(?:'(#[0-9A-Fa-f]{3,8}|rgba?\([^']*\))'|\$r\('app\.color\.([A-Za-z0-9_]+)'\)|(this\.[A-Za-z_][A-Za-z0-9_]*\s*\([^)]*\)))/;
function fgColorsOfLine(lines, line) {
  const m = line.match(FG_RE);
  if (!m) return [];
  if (m[1]) { const c = parseColor(m[1]); return c ? [c] : []; }
  if (m[2]) { const v = TOK.get(m[2]); const c = v ? parseColor(v) : null; return c ? [c] : []; }
  if (m[3]) return helperReturnColors(lines, m[3]).map(parseColor).filter(Boolean);
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

const perTheme = new Map();
for (const theme of THEMES_TO_RUN) {
  THEME = theme; TOK = TOKENS[theme];
  const findings = [], nonText = [], decoration = [];
  for (const f of files) {
    const lines = fs.readFileSync(f, 'utf-8').split(/\r?\n/);
    const blocks = lightBlocks(lines);
    const builders = builderIndex(lines, blocks);
    for (let i = 0; i < lines.length; i++) {
      /* ---- 文字（4.5:1） ---- */
      const fgs = fgColorsOfLine(lines, lines[i]);
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
        findings.push({
          file: path.basename(f), line: i + 1, fg: worst.fgHex,
          context: res.self ? '元素自身' : (light ? '浅底' : (res.resolved ? '深底' : '深底-推断')),
          below45: worst.contrast < 4.5, below3: worst.contrast < 3, worst
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

process.exit(anyBad ? 1 : 0);

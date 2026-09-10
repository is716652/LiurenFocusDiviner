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
  let m = v.match(/^#([0-9A-Fa-f]{6})$/);
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
  const re = /'(#[0-9A-Fa-f]{3,6}|rgba?\([^']*\))'/g;
  let m;
  while ((m = re.exec(expr))) out.push(m[1]);
  return out;
}

/** 解析 `this.helper(...)` 型底色的全部 return 字面量 */
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
      const rm = lines[j].match(/return\s+'(#[0-9A-Fa-f]{3,6}|rgba?\([^']*\))'/g);
      if (rm) rm.forEach((r) => out.push(r.match(/'([^']+)'/)[1]));
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
const findings = [];

for (const f of files) {
  const lines = fs.readFileSync(f, 'utf-8').split(/\r?\n/);
  const blocks = lightBlocks(lines);
  const builders = builderIndex(lines, blocks);
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/fontColor\(\s*'(#[0-9A-Fa-f]{3,6}|rgba?\([^']*\))'/);
    if (!m) continue;
    const fg = parseColor(m[1]);
    if (!fg) continue;
    const ind = indentOf(lines[i]);
    if (trace && path.basename(f) + ':' + (i + 1) === trace) {
      console.log('--- trace ' + path.basename(f) + ':' + (i + 1) + ' 前景 ' + m[1] + ' 缩进 ' + ind);
      console.log('    同行修饰符背景: ' + JSON.stringify(sameElementBgExprs(lines, i, ind)));
      console.log('    外层容器背景  : ' + JSON.stringify(enclosingBgExprs(lines, i)));
      console.log('    内层解析      : ' + JSON.stringify(resolveBg(lines, i, ind).colors.map((c) => c.hex || toHex(c))));
    }
    const light = lightColorAt(blocks, builders, i + 1);
    const res = resolveBg(lines, i, ind);
    /* 优先级：元素自带底色 > 浅色区块底 > 解析到的外层深底 > 最保守 DARK_WORST */
    const cands = res.self ? res.colors
      : (light ? [light] : (res.resolved ? res.colors : [DARK_WORST]));
    let worst = null;
    for (const bg of cands) {
      const c = contrast(fg, bg);
      if (!worst || c < worst.contrast) worst = { contrast: c, bgHex: bg.hex || toHex(bg) };
    }
    if (!worst) continue;
    findings.push({
      file: path.basename(f), line: i + 1, fg: fg.hex || m[1],
      context: res.self ? '元素自身' : (light ? '浅底' : (res.resolved ? '深底' : '深底-推断')),
      below45: worst.contrast < 4.5, below3: worst.contrast < 3, worst: worst
    });
  }
}

if (process.argv.includes('--json')) { console.log(JSON.stringify(findings, null, 2)); process.exit(0); }

findings.sort((a, b) => a.worst.contrast - b.worst.contrast);
const bad = findings.filter((x) => x.below45);
console.log('扫描 fontColor ' + findings.length + ' 处；低于 4.5:1 的 ' + bad.length + ' 处'
  + '（其中低于 3:1 的 ' + findings.filter((x) => x.below3).length + ' 处）');
console.log('推不出底色时按 ' + DARK_WORST.hex + ' 保守判定\n');
console.log('  对比度  底色(推断)  前景      上下文      位置');
for (const x of bad) {
  console.log('  ' + x.worst.contrast.toFixed(2).padStart(6) + '  ' + x.worst.bgHex.padEnd(9) + ' ' + x.fg.padEnd(9) + ' ' + x.context.padEnd(10) + '  ' + x.file + ':' + x.line);
}
console.log('\n按前景色汇总（需改的色值）：');
const byColor = new Map();
for (const x of bad) {
  if (!byColor.has(x.fg)) byColor.set(x.fg, { n: 0, min: x.worst.contrast, files: new Set(), ctx: new Set() });
  const r = byColor.get(x.fg);
  r.n++; r.min = Math.min(r.min, x.worst.contrast); r.files.add(x.file); r.ctx.add(x.context);
}
[...byColor.entries()].sort((a, b) => a[1].min - b[1].min).forEach(([c, r]) => {
  console.log('  ' + c + '  ' + String(r.n).padStart(3) + ' 处  最低 ' + r.min.toFixed(2) + '  ' + [...r.ctx].join('/') + '  ' + [...r.files].join(','));
});

process.exit(bad.length ? 1 : 0);

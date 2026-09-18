/* ============================================================================
 * color_helper_audit.js —— 找出"返回类型是 string 的颜色帮助函数"（只报告，不改码）
 * ----------------------------------------------------------------------------
 * 为什么需要它：浅色主题要能生效，颜色必须走资源令牌。但有一类位置令牌换不了 ——
 *   private bgColor(): string { return 'rgba(233,200,120,0.14)'; }
 * 调用处 `.backgroundColor(this.bgColor())` 是颜色属性（接受 ResourceColor），
 * **但函数自己声明返回 string**，所以里面的色值既换不成 $r(...)、也拿不到浅色值。
 * 这类函数就是浅色主题的"漏光点"，必须先逐个升级返回类型为 ResourceColor。
 *
 * 判据（能否安全升级）：
 *   该函数**所有**调用点都落在颜色属性实参位（证法 A 白名单）→ 可以升级为 ResourceColor
 *   只要有一个调用点是"当字符串用"（局部量、返回、链式 .xxx()、canvas ctx）→ 不能升级，
 *   画布那类要走运行时取色 getColorSync($r('app.color.x').id) 的路线
 *
 * 用法：node _tools/color_helper_audit.js
 * ==========================================================================*/
'use strict';
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');
const ETS = path.join(ROOT, 'APP/LiurenFocusDiviner/entry/src/main/ets');
const API_OK = new Set(['fontColor', 'backgroundColor', 'borderColor', 'color', 'selectedColor',
  'caretColor', 'placeholderColor', 'symbolColor', 'dividerColor', 'shadow', 'border', 'divider',
  'outline', 'linearGradient', 'radialGradient', 'sweepGradient']);

function walk(d, out = []) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else if (/\.ets$/.test(e.name)) out.push(p); } return out; }
function matchBrace(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') { depth--; if (depth === 0) return i; }
  }
  return -1;
}
function enclosingCall(text, idx) {
  let depth = 0;
  for (let i = idx - 1; i >= 0; i--) {
    const ch = text[i];
    if (ch === ')') depth++;
    else if (ch === '(') { if (depth === 0) { const m = /([A-Za-z_$][\w$]*)\s*$/.exec(text.slice(0, i)); return m ? m[1] : ''; } depth--; }
  }
  return '';
}

const files = walk(ETS);
const helpers = [];
for (const f of files) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/').replace('APP/LiurenFocusDiviner/entry/src/main/ets/', '');
  const text = fs.readFileSync(f, 'utf-8');
  const re = /(?:private|public|protected)?\s*(?:static\s+)?([A-Za-z_$][\w$]*)\s*\(([^()]*)\)\s*:\s*string\s*\{/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = m[1];
    if (name === 'if' || name === 'for' || name === 'while' || name === 'switch') continue;
    const open = text.indexOf('{', m.index + m[0].length - 1);
    const close = matchBrace(text, open);
    if (close < 0) continue;
    const body = text.slice(open, close);
    const lits = (body.match(/'#[0-9A-Fa-f]{6,8}'|'rgba?\([^)'"]*\)'/g) || []);
    const toks = (body.match(/\$r\(\s*'app\.color\./g) || []);
    const canvas = /\bctx\.|CanvasRenderingContext2D/.test(body);
    if (!lits.length && !toks.length && !canvas) continue;
    helpers.push({ file: rel, name, filePath: f, lits: lits.length, toks: toks.length, canvas, sites: [] });
  }
}
/* 调用点 */
for (const h of helpers) {
  for (const f of files) {
    const rel = path.relative(ROOT, f).replace(/\\/g, '/').replace('APP/LiurenFocusDiviner/entry/src/main/ets/', '');
    const text = fs.readFileSync(f, 'utf-8');
    const re = new RegExp('\\b' + h.name + '\\s*\\(', 'g');
    let m;
    while ((m = re.exec(text)) !== null) {
      /* 只跳过**定义行**：靠"名字(...): string"这个形状判断即可。
       * 曾经还用 `Math.abs(m.index - text.indexOf(name+'(')) < 2` 来认定义，
       * 但 TagBadge 里调用（第 14 行）比定义（第 30 行）更靠前，indexOf 命中的是调用，
       * 于是真正的调用点被当成定义跳过 → 报"调用点 0"。已删除这条错误启发式。 */
      if (new RegExp('^\\s*' + h.name + '\\s*\\([^()]*\\)\\s*:\\s*string').test(text.slice(m.index))) continue; /* 定义行 */
      const before = text.slice(Math.max(0, m.index - 60), m.index);
      const callee = enclosingCall(text, m.index + h.name.length);
      /* 注意：`this.xxx()` 里的那个 `.` 是接收者 this，不是"链式调用结果"——
       * 第一版把 prev==='.' 一律当链式使用，结果把 .fontColor(this.valueColor()) 误判成"当字符串用"，
       * 14 个函数全被误判为不可升级。故要先排除 `this.` 前缀。 */
      const bt = before.replace(/\s+$/, '');
      const chained = !/\bthis\.$/.test(bt) && /\.$/.test(bt);
      let verdict;
      if (chained) verdict = '链式使用（当字符串）';
      else if (API_OK.has(callee)) verdict = 'API:' + callee;
      else if (callee) verdict = '非颜色属性:' + callee + '()';
      else verdict = '局部量/返回（当字符串）';
      h.sites.push({ rel, ln: text.slice(0, m.index).split('\n').length, verdict });
    }
  }
}
let upgradeable = 0, blocked = 0, canvasBlocked = 0;
for (const h of helpers) {
  const allApi = h.sites.length > 0 && h.sites.every((s) => s.verdict.startsWith('API:'));
  const tag = h.canvas ? '画布（需 getColorSync）' : (allApi ? '✅ 可升级 ResourceColor' : '⛔ 有非颜色调用点');
  if (h.canvas) canvasBlocked++; else if (allApi) upgradeable++; else blocked++;
  console.log(tag + '  ' + h.file + '  ' + h.name + '()   色值' + h.lits + ' 令牌' + h.toks + ' 调用点' + h.sites.length);
  for (const s of h.sites) console.log('      ' + (s.verdict.startsWith('API:') ? '· ' : '! ') + s.rel + ':' + s.ln + '  ' + s.verdict);
}
console.log('\n合计：返回类型为 string 的颜色帮助函数 ' + helpers.length + ' 个');
console.log('  ✅ 可升级：' + upgradeable + ' 个（所有调用点都在颜色属性实参位）');
console.log('  ⛔ 有非颜色调用点：' + blocked + ' 个');
console.log('  🖌 画布：' + canvasBlocked + ' 个（走 getColorSync 运行时取色）');

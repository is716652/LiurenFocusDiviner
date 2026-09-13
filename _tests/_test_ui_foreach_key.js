/* ============================================================================
 * _test_ui_foreach_key.js —— ForEach 键生成器门禁（2026-09-13 真机缺陷后新增）
 * ----------------------------------------------------------------------------
 * 缺陷原型（真机实测）：点宫速查卡的行键只用了「索引 + 行标签」，而同一卡片在不同宫位下
 *   行标签集与顺序恒定 → ArkUI 判定为同一批子组件，**复用且不更新其内容**。
 *   现象：卡片标题（@Prop title）在变，正文却停在上一次装配的内容；收起卡片再点才正确。
 * 规则（本门禁判据）：键表达式必须引用**条目自身的参数**（内容或 id），不得只用索引 ± 字面量。
 *   索引 + 内容（如 'dline' + li + '|' + line）合格：索引在前保证键唯一，内容在后保证刷新。
 *   只用索引（'dline' + li）不合格：内容变化时键不变 → 复用旧 UI。
 * 用法：node _tests/_test_ui_foreach_key.js
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ROOTS = [
  path.join(ROOT, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'ets'),
  path.join(ROOT, 'APP', 'LiurenFocusDivinerFree', 'entry', 'src', 'main', 'ets')
];

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.ets$/.test(e.name)) out.push(p);
  }
  return out;
}
/* 去注释（保留字符串内容，避免字符串里的 // 被误删） */
function stripComments(src) {
  let out = '', q = '';
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q !== '') { out += c; if (c === '\\') { out += src[i + 1] || ''; i++; continue; } if (c === q) q = ''; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; out += c; continue; }
    if (c === '/' && src[i + 1] === '/') { const j = src.indexOf('\n', i); i = j < 0 ? src.length : j; out += '\n'; continue; }
    if (c === '/' && src[i + 1] === '*') { const j = src.indexOf('*/', i + 2); i = j < 0 ? src.length : j + 1; continue; }
    out += c;
  }
  return out;
}
/* 按顶层逗号切分（尊重 <>、()、[] 嵌套，避免 Record<string, string> 被切坏） */
function splitTop(s) {
  const out = [];
  let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '<' || ch === '(' || ch === '[') depth++;
    else if (ch === '>' || ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim() !== '') out.push(cur);
  return out.map((x) => x.trim()).filter((x) => x !== '');
}
/* 解析键生成器： }, (a: T, i: number) => EXPR)   —— 手工配平，不靠贪婪正则 */
function parseKeyGen(text) {
  const iClose = text.indexOf('},');
  if (iClose < 0) return null;
  const iOpen = text.indexOf('(', iClose);
  if (iOpen < 0) return null;
  let depth = 0, j = iOpen;
  for (; j < text.length; j++) {
    if (text[j] === '(') depth++;
    else if (text[j] === ')') { depth--; if (depth === 0) break; }
  }
  if (j >= text.length) return null;
  const paramsText = text.slice(iOpen + 1, j);
  const rest = text.slice(j + 1);
  const arrow = rest.indexOf('=>');
  if (arrow < 0) return null;
  let expr = rest.slice(arrow + 2).trim();
  expr = expr.replace(/\)\s*$/, '').trim();
  if (expr === '') return null;
  return { paramsText: paramsText, expr: expr };
}

let inspected = 0, candLines = 0, parseFail = 0, noItemParam = 0;
const bad = [];
const seen = new Map();

for (const root of ROOTS) {
  if (!fs.existsSync(root)) continue;
  for (const f of walk(root)) {
    const rel = path.relative(ROOT, f).replace(/\\/g, '/');
    const lines = stripComments(fs.readFileSync(f, 'utf-8')).split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (!/^\s*\},\s*\(/.test(lines[i])) continue;
      candLines++;
      let text = lines[i], k = i;
      /* 键可能跨行：拼到括号配平为止（最多再看 3 行） */
      for (let guard = 0; guard < 3 && k + 1 < lines.length; guard++) {
        const open = (text.match(/\(/g) || []).length, close = (text.match(/\)/g) || []).length;
        if (close >= open) break;
        k++; text += ' ' + lines[k];
      }
      const g = parseKeyGen(text);
      if (!g) { parseFail++; continue; }
      const items = [], idxs = [];
      for (const p of splitTop(g.paramsText)) {
        const pm = /^([A-Za-z_][\w]*)\s*:\s*(.+)$/.exec(p);
        if (!pm) continue;
        if (pm[2].trim() === 'number') idxs.push(pm[1]); else items.push(pm[1]);
      }
      if (items.length === 0) { noItemParam++; continue; }   /* 纯索引回调：本门禁不判 */
      inspected++;
      seen.set(rel, (seen.get(rel) || 0) + 1);
      const usedItem = items.some((n) => new RegExp('\\b' + n + '\\b').test(g.expr));
      if (!usedItem) {
        bad.push(rel + ':' + (i + 1) + '  键「' + g.expr + '」只用到索引/字面量'
          + '（条目参数 ' + items.join('/') + ' 未被引用）→ 内容变化时键不变，UI 会复用旧内容');
      }
    }
  }
}

const diag = '（候选行 ' + candLines + ' / 解析失败 ' + parseFail + ' / 无条目参数 ' + noItemParam
  + ' / 判定 ' + inspected + '）';
if (inspected === 0) {
  console.log('FAIL  ForEach 键门禁：未判定任何键生成器，解析器可能已失效 ' + diag);
  process.exit(1);
}
if (bad.length === 0) {
  console.log('PASS  ForEach 键门禁：' + inspected + ' 个键生成器全部引用条目自身（' + seen.size + ' 个文件）' + diag);
  process.exit(0);
}
console.log('FAIL  ForEach 键门禁：' + bad.length + '/' + inspected + ' 个键只用到索引/字面量 ' + diag);
for (const b of bad) console.log('  ✗ ' + b);
if (bad.some((b) => b.indexOf('/LiurenFocusDivinerFree/') >= 0)) {
  console.log('  提示：命中免费版文件 —— 免费版由主版同步生成，先跑 node _tools/_ets_pipeline.js 再复跑本门禁');
}
process.exit(1);

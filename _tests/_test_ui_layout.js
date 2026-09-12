/* ============================================================================
 * _test_ui_layout.js —— UI 排版门禁：Row + Blank() 里的数据驱动 Text 必须有宽度约束
 * ----------------------------------------------------------------------------
 * 由来（2026-09-12 用户报障）：「排盘 → 毕法格局 → 展开」后文字**溢出到右边界之外、
 * 且不是左对齐**。根因是 components/InfoRow.ets 旧写法：
 *     Row() { Text(this.label)  Blank()  Text(this.value).textAlign(TextAlign.End) }
 *   value 既无 width 也无 layoutWeight → 长文案（毕法五层的定性/定象/定时/定策/定级）
 *   顶出父容器右边界；textAlign(End) 又让它不左对齐。短值（「旬空/无」）看不出来，
 *   所以问题只在长文案处暴露。
 *
 * 本门禁的判据（窄而准，避免误报）：
 *   ① 该 Text 与 `Blank()` 处在**同一个 Row 的 `{}` 块内**（花括号配平判定）；
 *   ② 该 Text 的属性链里**没有**任何宽度约束（width / layoutWeight / constraintSize /
 *      maxLines / flexShrink）；
 *   ③ 该 Text 的参数**不是纯字符串字面量**（即长度不可控：`this.x`、`'前缀' + 表达式`、
 *      `c.title` 之类）——纯字面量短标签无风险，不报。
 *   三条同时成立才报。已人工确认安全的长文本，可在该 Text 行或属性链上写
 *   块注释标记「layout-ok: 理由」（理由必填），门禁放行并计入【豁免计数】供人工过目。
 *
 * 用法：node _tests/_test_ui_layout.js
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIRS = [
  'APP/LiurenFocusDiviner/entry/src/main/ets',
  'APP/LiurenFocusDivinerFree/entry/src/main/ets',
];
const CONSTRAINED = /layoutWeight\(|\.width\(|constraintSize\(|maxLines\(|flexShrink\(/;
const LAYOUT_CONTAINER = /^(Row|Column|Flex|Stack|Grid|GridItem|List|ListItem|Scroll|Swiper|RelativeContainer|WaterFlow|Tabs|TabContent|Navigator)$/;

function walk(dir, out) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return out;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const p = path.join(abs, e.name);
    if (e.isDirectory()) walk(path.relative(ROOT, p).replace(/\\/g, '/'), out);
    else if (/\.ets$/.test(e.name)) out.push(path.relative(ROOT, p).replace(/\\/g, '/'));
  }
  return out;
}

/* 从 Row( 所在行向下找它的 `{`，再花括号配平找到块尾（不含链式属性行） */
function rowBlock(lines, rowLine) {
  let i = rowLine;
  let depth = 0;
  let seen = false;
  for (; i < lines.length; i++) {
    const s = lines[i];
    for (const c of s) {
      if (c === '{') { depth++; seen = true; }
      else if (c === '}') { depth--; }
    }
    if (seen && depth <= 0) return { start: rowLine, end: i };
  }
  return { start: rowLine, end: lines.length - 1 };
}

/* Text(...) 的完整参数（括号配平，支持跨行） */
function argsOf(lines, k) {
  let s = lines[k];
  const open = s.indexOf('Text(');
  if (open < 0) return null;
  let depth = 0, out = '';
  for (let i = k; i < lines.length; i++) {
    const seg = i === k ? lines[i].slice(open + 5) : lines[i];   /* 'Text(' 共 5 个字符 */
    for (const c of seg) {
      if (c === '(') { depth++; out += c; continue; }
      if (c === ')') { depth--; if (depth < 0) return out; out += c; continue; }
      out += c;
    }
    out += ' ';
  }
  return out;
}

function chainOf(lines, k) {
  let j = k, chain = lines[k];
  while (j + 1 < lines.length && /^\s*\./.test(lines[j + 1])) { j++; chain += lines[j]; }
  return chain;
}

let FAIL = 0, waived = 0;
const files = [];
DIRS.forEach((d) => walk(d, files));

for (const rel of files) {
  const lines = fs.readFileSync(path.join(ROOT, rel), 'utf-8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*Blank\(\)\s*$/.test(lines[i])) continue;
    /* 向上找最近的 Row( 行，并确认 Blank 落在它的块内 */
    let rowLine = -1;
    for (let u = i; u >= 0 && i - u <= 60; u--) {
      if (/\bRow\s*\(/.test(lines[u])) {
        const b = rowBlock(lines, u);
        if (i > b.start && i <= b.end) { rowLine = u; break; }
      }
    }
    if (rowLine < 0) continue;
    const blk = rowBlock(lines, rowLine);
    /* 只把**直接子节点**算作 Blank 的兄弟：Row 块内若再嵌一层布局容器
       （Column/Row/Flex/Stack/Grid/…），那层里的 Text 与 Blank 不是兄弟关系，
       不会互相挤压 —— 早期版本没做这一步，报了一堆误报。
       控制流包装（if / ForEach）不算布局容器：里头的 Text 仍是 Row 的直接子节点。
       注意：花括号必须只在**括号深度 0** 时才算块级 —— `Row({ space: 8 }) {` 里
       参数对象的花括号曾被误当成块级，导致归属判断错乱（漏报/误报都出现过）。 */
    const stack = [];
    for (let k = rowLine; k <= blk.end; k++) {
      const line = lines[k];
      const opens = [];
      let paren = 0;
      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        if (ch === '(') { paren++; continue; }
        if (ch === ')') { paren--; continue; }
        if (paren > 0) continue;                       /* 参数表内的括号/花括号：不是块级 */
        if (ch === '{') {
          /* 往前跳过空白与整段 (...) 参数表，再读关键字 */
          let b = c - 1;
          for (;;) {
            while (b >= 0 && /\s/.test(line[b])) b--;
            if (b >= 0 && line[b] === ')') {
              let d = 0;
              while (b >= 0) {
                if (line[b] === ')') d++;
                else if (line[b] === '(') { d--; if (d === 0) { b--; break; } }
                b--;
              }
              continue;
            }
            break;
          }
          const m = b >= 0 ? line.slice(0, b + 1).match(/(\w+)\s*$/) : null;
          opens.push(m ? m[1] : '');
        } else if (ch === '}') {
          stack.pop();
        }
      }
      opens.forEach((kw) => stack.push(kw));
      if (stack.length === 0) continue;
      if (!/^\s*Text\(/.test(line)) continue;
      /* stack[0] 是 Row 自身；其后若出现布局容器，说明该 Text 不是 Row 的直接子节点 */
      const nestedLayout = stack.slice(1).some((kw) => LAYOUT_CONTAINER.test(kw));
      if (nestedLayout) continue;
      const chain = chainOf(lines, k);
      if (CONSTRAINED.test(chain)) continue;
      const arg = argsOf(lines, k);
      if (arg === null) continue;
      const trimmed = arg.trim();
      if (/^'[^']*'$/.test(trimmed) || /^"[^"]*"$/.test(trimmed)) continue;   /* 纯字面量：长度可控 */
      const reason = (chain.match(/layout-ok:\s*([^*\n]{4,})/) || [])[1];
      if (reason) { waived++; console.log('  · 豁免（人工确认）' + rel + ':' + (k + 1) + ' —— ' + reason.trim()); continue; }
      FAIL++;
      console.log('  ✗ ' + rel + ':' + (k + 1)
        + '  同一 Row 内有 Blank()，此 Text 无宽度约束且长度不可控：Text(' + trimmed.slice(0, 48) + ')');
      console.log('      → 修法：给该 Text 加 .layoutWeight(1)（或 .width(...)），'
        + '长文案另可用 components/InfoRow.ets 的 stack 模式（标签在上、左对齐）');
    }
  }
}

console.log('');
console.log('扫描 UI 文件 ' + files.length + ' 个；豁免 ' + waived + ' 处；违规 ' + FAIL + ' 处');
if (FAIL > 0) {
  console.log('UI 排版门禁：不通过 ✗（长文案会顶出右边界）');
  process.exit(1);
}
console.log('UI 排版门禁：通过 ✓（Row+Blank 内的长文本均有宽度约束）');

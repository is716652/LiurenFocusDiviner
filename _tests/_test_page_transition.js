/**
 * _test_page_transition.js —— 页面转场门禁（应用市场自检要求）
 * ----------------------------------------------------------------------------
 * 自检原文：「建议使用系统转场，页面转场采用淡入淡出的运动方式，不应单帧直接切换，
 *   左右平移或者上下位移切换，曲线优先使用弹簧曲线。」
 * 现状依据：7 个 `@Entry` 页面原先都没声明 `pageTransition` ⇒ 走系统默认（左右平移）被点名。
 * 判定（逐个 @Entry 页面）：
 *   ① 必须声明 `pageTransition()`（否则就是"没做转场"，退化为系统默认/单帧直切）
 *   ② 必须用 `opacity` 做淡入淡出
 *   ③ **不得**在转场里出现 slide / translate / move / scale（那就会产生位移）
 *   ④ 曲线必须是弹簧曲线（springCurve / springMotion / interpolatingSpring）
 * 已知边界（诚实声明）：这是**词法**判定，不解析表达式；但它卡的是"有没有做、做的方向对不对"，
 *   对回归足够灵敏（变异测试验证过）。
 * 用法：node _tests/_test_page_transition.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const PAGES_DIR = path.join(ROOT, 'APP/LiurenFocusDiviner/entry/src/main/ets/pages');

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.ets$/.test(e.name)) out.push(p);
  }
  return out;
}
const SPRING = /springCurve|springMotion|interpolatingSpring/;
const MOVE = /\.(slide|translate|move|scale)\s*\(/;
const bad = [];
let n = 0;
for (const f of walk(PAGES_DIR)) {
  const text = fs.readFileSync(f, 'utf-8');
  if (!/@Entry/.test(text)) continue;
  n++;
  const rel = path.relative(ROOT, f).replace(/\\/g, '/').replace('APP/LiurenFocusDiviner/entry/src/main/ets/pages/', '');
  const at = text.indexOf('pageTransition()');
  if (at < 0) { bad.push(rel + '：未声明 pageTransition()（转场缺失 ⇒ 退化为系统默认）'); continue; }
  /* 取转场块：从 pageTransition() 起，到该块结束（下一个顶层 build( 或 文件尾） */
  const rest = text.slice(at);
  const end = rest.search(/\n\s*build\(\)\s*\{/);
  const block = end > 0 ? rest.slice(0, end) : rest;
  if (!/\.opacity\s*\(/.test(block)) bad.push(rel + '：转场未使用 opacity（要求淡入淡出）');
  if (MOVE.test(block)) bad.push(rel + '：转场里出现位移/缩放（' + (block.match(MOVE) || [])[0].trim() + '）—— 自检要求不得左右平移或上下位移');
  if (!SPRING.test(block)) bad.push(rel + '：转场曲线不是弹簧曲线（应为 curves.springCurve / springMotion）');
}
console.log('页面转场门禁：扫描 ' + n + ' 个 @Entry 页面');
if (bad.length) {
  console.log('✗ ' + bad.length + ' 项不合格：');
  for (const b of bad) console.log('   ' + b);
} else {
  console.log('✓ 全部页面：系统转场 + 淡入淡出（仅 opacity）+ 弹簧曲线，且无位移');
}
process.exit(bad.length ? 1 : 0);

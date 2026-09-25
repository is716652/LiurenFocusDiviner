/* 修正知县案 drama 的三处盘面事实错误（扩展审计抓出）
 *   1) 太常乘酉，不是乘子（entry yi、route yi 的 step、conclusion 各一处）
 *   2) 本旬空亡在寅、卯；huagai 第 3 步原写「末传戌落旬空」——末传是未，且未不空
 *   3) 煞名以盘面为准：「旬癸(闭口)」，不是「闭口」
 *
 * 注意：case_story.json 是**混合行尾**（既有 CRLF 也有孤立 LF），
 * 所以不能整文件探测 EOL 后拼多行串 —— 必须逐行改、逐行保留原行尾。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, '..', 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'resources', 'rawfile', 'ancient', 'case_story.json');
const raw = fs.readFileSync(F, 'utf-8');
/* split 保留分隔符：偶数下标是行内容，奇数下标是行尾 */
const chunks = raw.split(/(\r?\n)/);
const count = Math.ceil(chunks.length / 2);
const ci = (n) => chunks[n * 2];
const set = (n, v) => { chunks[n * 2] = v; };

let total = 0;
let bad = 0;
const t = (s) => String(s === undefined ? '' : s).trim();

function findLine(pred, tag) {
  for (let i = 0; i < count; i++) {
    if (pred(ci(i), i)) return i;
  }
  console.log('!! 未找到行 [' + tag + ']');
  bad++;
  return -1;
}
function subLine(n, from, to, tag) {
  if (n < 0) return;
  const c = ci(n);
  if (c === undefined || c.indexOf(from) < 0) { console.log('!! 第 ' + (n + 1) + ' 行未含待替换文本 [' + tag + ']'); bad++; return; }
  set(n, c.split(from).join(to));
  total++;
}

/* 1) 太常乘酉 —— entry yi 与 route yi 的 step 各一处 */
let c1 = 0;
for (let i = 0; i < count; i++) {
  const c = ci(i);
  if (c !== undefined && t(c) === '"ref": "子/太常"') {
    set(i, c.split('子/太常').join('酉/太常'));
    c1++;
  }
}
if (c1 !== 2) { console.log('!! 子/太常 命中 ' + c1 + ' 次（期望 2）'); bad++; } else { total += 2; }

subLine(findLine((c) => String(c).indexOf('主这一类的是太常，而本课太常乘子。') >= 0, 'entry yi reply'),
  '主这一类的是太常，而本课太常乘子。', '主这一类的是太常，而本课太常乘酉。', 'entry yi reply');

subLine(findLine((c) => String(c).indexOf('主之者太常 —— 本课太常乘子。') >= 0, 'route yi step reply'),
  '主之者太常 —— 本课太常乘子。衣物与银物未必同处，此象另指一处。',
  '主之者太常 —— 本课太常乘酉。酉是金乡，与银物所乘之戌各占一支，衣物与银物未必同处，此象另指一处。', 'route yi step reply');

subLine(findLine((c) => String(c).indexOf('衣物另有一处所指（太常乘子）') >= 0, 'route yi conclusion'),
  '衣物另有一处所指（太常乘子）', '衣物另有一处所指（太常乘酉）', 'route yi conclusion');

/* 2) huagai 第 3 步：空亡落在寅、卯（占时正是卯）*/
const XK_REPLY = '而末传所归的那一支（戌）正落旬空';
let xkHits = 0;
for (let i = 0; i < count; i++) {
  if (String(ci(i)).indexOf(XK_REPLY) >= 0) { xkHits++; console.log('  含该 reply 的行: ' + (i + 1)); }
}
console.log('  「xunkong + 戌」候选行数: ' + (() => { let n = 0; for (let i = 0; i < count; i++) { if (t(ci(i)) === '"ref": "戌"' && t(ci(i - 1)) === '"kind": "xunkong",') n++; } return n; })());
const nXk = findLine((c, i) => t(c) === '"ref": "戌"' && t(ci(i - 1)) === '"kind": "xunkong",'
  && [1, 2, 3].some((k) => String(ci(i + k)).indexOf(XK_REPLY) >= 0), 'huagai step anchor');
if (nXk >= 0) {
  console.log('  命中行 ' + (nXk + 1) + ' :: ' + JSON.stringify(ci(nXk)));
  let nr = -1;
  for (const k of [nXk + 1, nXk + 2, nXk + 3]) {
    if (String(ci(k)).indexOf(XK_REPLY) >= 0) { nr = k; break; }
  }
  if (nr < 0) {
    console.log('!! huagai 第 3 步的 reply 与预期不符，未改');
    bad++;
  } else {
    set(nXk, ci(nXk).split('"ref": "戌"').join('"ref": "卯"'));
    total++;
    subLine(nr,
      '而末传所归的那一支（戌）正落旬空 —— 空主「有其位而不见其形」。覆盖之象与空亡之象落在同一处。',
      '而占时卯正落旬空 —— 空主「有其位而不见其形」。华盖主覆盖、空亡主不显形，两处合看，故所覆之物虽在，形却不显。', 'huagai step reply');
  }
}

/* 3) 煞名以盘面为准 */
subLine(findLine((c) => t(c) === '"ref": "丑/闭口"', 'shuoming step anchor'),
  '"丑/闭口"', '"丑/旬癸(闭口)"', 'shuoming step anchor');
subLine(findLine((c) => String(c).indexOf('初传丑又带闭口 —— 闭口主事不外扬、声不外泄。') >= 0, 'shuoming step reply'),
  '初传丑又带闭口 —— 闭口主事不外扬、声不外泄。', '初传丑带旬癸（闭口）—— 闭口主事不外扬、声不外泄。', 'shuoming step reply');

if (bad > 0) {
  console.log('有 ' + bad + ' 处未按预期命中，未写回');
  process.exit(1);
}
const out = chunks.join('');
JSON.parse(out);
console.log('JSON 合法 ✓  共修 ' + total + ' 处');
fs.writeFileSync(F, out);
console.log('已写回');

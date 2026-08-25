/* 中黄五变经 · 天干两遁算法验证
   验证核心：
   1) 日干遁：以日干起五鼠遁，十二宫配干（"体"）
   2) 时干 = 日干遁到占时支的干（六壬通用时干）
   3) 时干遁（复建）：以时干再起五鼠遁，十二宫配干（"用"/中黄盘）
   用经文课例的明确标注反验算法正确性
*/
'use strict';

const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/* 五鼠遁：日干 → 子宫起始干（甲己还加甲，乙庚丙作初，丙辛从戊起，丁壬庚子居，戊癸起壬子） */
function wushuStart(gan) {
  const m = { '甲': '甲', '己': '甲', '乙': '丙', '庚': '丙', '丙': '戊', '辛': '戊', '丁': '庚', '壬': '庚', '戊': '壬', '癸': '壬' };
  return m[gan];
}

/* 日干遁：全盘十二宫配干 */
function dunAll(gan) {
  const s = wushuStart(gan);
  const startIdx = GAN.indexOf(s);
  const map = {};
  for (let i = 0; i < 12; i++) {
    map[ZHI[i]] = GAN[(startIdx + i) % 10];
  }
  return map;
}

/* 时干 = 日干遁到占时支 */
function shiGan(dayGan, shiZhi) {
  return dunAll(dayGan)[shiZhi];
}

/* 时干遁（复建）：以时干再起五鼠遁，全盘 */
function shiDun(shiGanVal) {
  return dunAll(shiGanVal);
}

let pass = 0, fail = 0;
function check(name, got, expect) {
  const ok = got === expect;
  console.log((ok ? 'OK  ' : 'FAIL') + ' ' + name + '  得:' + got + ' 期望:' + expect);
  ok ? pass++ : fail++;
}

/* ============ 课例 1：庚辰日未时（释吉凶实意）============
   经文："日遁之鬼得丙戌、丙子，初传见丙子" "时遁壬，子中亦有壬" */
console.log('\n=== 课例1 庚辰日未时 ===');
{
  const dayGan = '庚', shiZhi = '未';
  const riDun = dunAll(dayGan);
  const sg = shiGan(dayGan, shiZhi);
  const shiD = shiDun(sg);
  check('日干遁 子宫', riDun['子'], '丙');   // 庚日子起丙
  check('日干遁 戌宫', riDun['戌'], '丙');   // 庚日戌=丙（庚起丙子：子丙丑丁寅戊卯己辰庚巳辛午壬未癸申甲酉乙戌丙）
  check('时干(庚日未时)', sg, '癸');          // 庚日未=癸
  check('时遁 子宫(=时干癸起)', shiD['子'], '壬'); // 癸起壬子 → 子壬
}

/* ============ 课例 2：庚子日申时（释复建真鬼）============
   经文："五子元遁庚起丙子，故谓得庚辰乙酉" */
console.log('\n=== 课例2 庚子日申时 ===');
{
  const dayGan = '庚', shiZhi = '申';
  const riDun = dunAll(dayGan);
  check('日干遁 辰宫', riDun['辰'], '庚');   // 庚日子丙丑丁寅戊卯己辰庚
  check('日干遁 酉宫', riDun['酉'], '乙');   // …酉乙
  const sg = shiGan(dayGan, shiZhi);
  check('时干(庚日申时)', sg, '甲');          // 庚日申=甲（子丙…申甲）
}

/* ============ 课例 3：己未日巳时（释复建真鬼）============
   经文："日遁干在己巳" */
console.log('\n=== 课例3 己未日巳时 ===');
{
  const dayGan = '己', shiZhi = '巳';
  const riDun = dunAll(dayGan);
  check('日干遁 巳宫', riDun['巳'], '己');   // 己日同甲：子甲丑乙寅丙卯丁辰戊巳己
  const sg = shiGan(dayGan, shiZhi);
  check('时干(己日巳时)', sg, '己');          // 己日巳=己
}

/* ============ 课例 4：戊戌日未时（释复建真鬼）============
   经文："今日天上遁戊临地下午"（午宫日遁=戊 ✓）
   时干(戊日未时)：戊起壬子 → 子壬 丑癸 寅甲 卯乙 辰丙 巳丁 午戊 未己 → 未=己
   时遁(以己起)：己同甲 → 子甲 … */
console.log('\n=== 课例4 戊戌日未时 ===');
{
  const dayGan = '戊', shiZhi = '未';
  const riDun = dunAll(dayGan);
  check('日干遁 午宫', riDun['午'], '戊');   // 戊日起壬子：子壬丑癸寅甲卯乙辰丙巳丁午戊
  const sg = shiGan(dayGan, shiZhi);
  check('时干(戊日未时)', sg, '己');          // 戊日未=己
  const shiD = shiDun(sg);
  check('时遁 子宫(=时干己起同甲)', shiD['子'], '甲'); // 己起甲子
}

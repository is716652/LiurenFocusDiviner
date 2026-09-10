/* 十二天将布列 · 传本锚点校验
   规则出处：
     · 大六壬文档/排盘/十二天神与昼贵夜贵说明.md          —— 昼夜贵人表、昼夜分界（卯~申昼）
     · 大六壬文档/中黄五变经/天将顺逆排布核心规则.md      —— 顺逆判据（贵人落宫分野）
     · 大六壬文档/排盘/大六壬指南的四课三传的三传排法.md  —— 九宗门取用（昴星等）
   本测试用「传本原句」当锚点，而不是拿实现反证实现：
     · 中黄经文13/18/20 的课例与断语/天盘环列图
     · 《壬占汇选》丁卯日 046/047/048/049 四张课式图（六亲·干支·将）
   历史坑（2026-09-10 修正）：旧实现把「逆序表」与「逆方向」叠加使用，二者互相抵消
   → 恒顺布，导致所有应逆布的盘十二天将整体镜像。 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.join(__dirname, '..');
const coreSrc = fs.readFileSync(path.join(root, 'core', 'liuren-core.js'), 'utf-8');
vm.runInThisContext(coreSrc, { filename: 'liuren-core.js' });

const R = path.join(root, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'resources', 'rawfile', 'rule');
const load = (f) => JSON.parse(fs.readFileSync(path.join(R, f), 'utf-8'));
LiurenCore.init({
  duxiang: {
    '旺衰休囚死': { '旺衰': load('旺衰休囚死.json')['旺衰'] },
    '十二宫气机点': load('十二宫气机点.json'),
    '空亡规则': load('空亡规则.json'),
    '助日规则': load('助日规则.json'),
    '基础关系': load('基础关系.json')
  },
  shensha: { '神煞': load('神煞起法.json')['神煞'] },
  bifa: { '一百法': load('毕法赋一百法.json')['一百法'] }
});

let fail = 0;
const check = (name, cond, extra) => {
  if (!cond) { fail++; console.log('FAIL:', name, extra || ''); } else { console.log('OK  :', name); }
};
const gongOf = (c, z) => LiurenCore.gongOf(c.tp, z);

/* ---------- 1. 规则常量 ---------- */
check('十二将次序恒定（贵人→螣蛇→…→天后）',
  JSON.stringify(LiurenCore.JIANG_ORDER) === JSON.stringify(
    ['贵人', '螣蛇', '朱雀', '六合', '勾陈', '青龙', '天空', '白虎', '太常', '玄武', '太阴', '天后']));
check('昼夜分界 = 卯辰巳午未申（昼）',
  JSON.stringify(LiurenCore.JIANG_DAY_HOURS) === JSON.stringify(['卯', '辰', '巳', '午', '未', '申']));
check('顺布宫 = 亥子丑寅卯辰',
  JSON.stringify(LiurenCore.JIANG_SHUN_GONGS) === JSON.stringify(['亥', '子', '丑', '寅', '卯', '辰']));
check('逆序表已移除（不再有 JIANG_NI 常量）', LiurenCore.JIANG_NI === undefined);

/* ---------- 2. 布列方向：只改方向，不改将序 ---------- */
const jiangMapOf = (dg, tp, hourZhi) => LiurenCore.buildJiang(dg, tp, hourZhi).jiangMap;
{
  // 造一个「天盘贵人落于逆布区间」的盘：甲日昼占（贵人丑），令天盘丑落于地盘巳宫（巳属巳午未申酉戌）
  const tp = {};
  LiurenCore.ZHI.forEach((z, i) => { tp[z] = LiurenCore.ZHI[(i + 8) % 12]; });
  const jm = jiangMapOf('甲', tp, '卯'); // 贵人丑 → 落宫 = 天盘丑所在之地盘宫
  const guiGong = LiurenCore.gongOf(tp, '丑');
  check('逆布：贵人落宫（' + guiGong + '）为贵人', jm[guiGong] === '贵人');
  check('逆布：贵人宫逆一位为螣蛇（方向翻转、将序不改）',
    jm[LiurenCore.ZHI[(LiurenCore.ZHI.indexOf(guiGong) + 11) % 12]] === '螣蛇',
    '实际=' + jm[LiurenCore.ZHI[(LiurenCore.ZHI.indexOf(guiGong) + 11) % 12]]);
  check('逆布：贵人宫顺一位为天后（镜像位不再是螣蛇）',
    jm[LiurenCore.ZHI[(LiurenCore.ZHI.indexOf(guiGong) + 1) % 12]] === '天后',
    '实际=' + jm[LiurenCore.ZHI[(LiurenCore.ZHI.indexOf(guiGong) + 1) % 12]]);
}
{
  // 顺布对照：贵人落宫属亥子丑寅卯辰
  const tp = {};
  LiurenCore.ZHI.forEach((z, i) => { tp[z] = LiurenCore.ZHI[i]; });
  const jm = jiangMapOf('甲', tp, '卯');
  const guiGong = LiurenCore.gongOf(tp, '丑'); // 丑落丑宫（伏吟式天地盘）
  check('顺布：贵人落宫（' + guiGong + '）为贵人', jm[guiGong] === '贵人');
  check('顺布：贵人宫顺一位为螣蛇',
    jm[LiurenCore.ZHI[(LiurenCore.ZHI.indexOf(guiGong) + 1) % 12]] === '螣蛇');
}

/* ---------- 3. 传本锚点（经文 / 壬占汇选课式图） ---------- */
const ANCHORS = [
  { name: '经文13 庚子日申时 丑将（断语「初传太常，中传六合」）', mj: '丑', dg: '庚', dz: '子', hour: '申',
    chuan: '巳戌卯', jiang: ['太常', '六合', '太阴'] },
  { name: '经文18 乙未日卯时 丑将（天盘环列 亥天后·寅朱雀·巳青龙）', mj: '丑', dg: '乙', dz: '未', hour: '卯',
    chuan: '亥寅巳', jiang: ['天后', '朱雀', '青龙'] },
  { name: '经文20 甲午日寅时 丑将（按语 未贵人·申天后·酉太阴·戌玄武）', mj: '丑', dg: '甲', dz: '午', hour: '寅',
    chuan: '子亥戌', jiang: ['白虎', '太常', '玄武'] },
  { name: '汇选046 丁卯日戌时 卯将（课式图 巳常·戌蛇·卯空）', mj: '卯', dg: '丁', dz: '卯', hour: '戌',
    chuan: '巳戌卯', jiang: ['太常', '螣蛇', '天空'] },
  { name: '汇选047 丁卯日丑时 未将（课式图 卯空·酉贵·卯空）', mj: '未', dg: '丁', dz: '卯', hour: '丑',
    chuan: '卯酉卯', jiang: ['天空', '贵人', '天空'] },
  { name: '汇选048 丁卯日卯时 子将（课式图 子蛇·酉阴·午虎）', mj: '子', dg: '丁', dz: '卯', hour: '卯',
    chuan: '子酉午', jiang: ['螣蛇', '太阴', '白虎'] },
  { name: '汇选049 丁卯日丑时 辰将（课式图 酉贵·子玄·卯空）', mj: '辰', dg: '丁', dz: '卯', hour: '丑',
    chuan: '酉子卯', jiang: ['贵人', '玄武', '天空'] }
];
console.log('\n--- 传本锚点（三传乘将）---');
for (const a of ANCHORS) {
  const c = LiurenCore.buildChartAncient(a.mj, a.dg, a.dz, a.hour, '', '', '');
  const cz = c.sanchuan.chuans.map((x) => x.z).join('');
  const jiang = c.sanchuan.chuans.map((x) => c.jiangMap[gongOf(c, x.z)]);
  check(a.name + ' → ' + cz + ' / ' + jiang.join('·'),
    cz === a.chuan && JSON.stringify(jiang) === JSON.stringify(a.jiang),
    '实际 ' + cz + ' / ' + jiang.join('·'));
}

/* ---------- 4. 昴星取用（阳日取地盘酉上神·阴日取天盘酉下神） ---------- */
console.log('\n--- 昴星取用 ---');
{
  const c = LiurenCore.buildChartAncient('丑', '乙', '未', '卯', '', '', '');
  const cz = c.sanchuan.chuans.map((x) => x.z).join('');
  let under = '';
  for (const z of LiurenCore.ZHI) { if (c.tp[z] === '酉') { under = z; } }
  check('柔日昴星（乙未日卯时丑将）课体=冬蛇掩目', c.sanchuan.keti === '昴星·冬蛇掩目', c.sanchuan.keti);
  check('柔日昴星初传 = 天盘酉下神（' + under + '）', c.sanchuan.chuans[0].z === under, '实际初传=' + c.sanchuan.chuans[0].z);
  check('柔日昴星三传 = 亥寅巳（经文18 同课）', cz === '亥寅巳', '实际=' + cz);
}
{
  // 找一个刚日昴星样本，验证初传 = 地盘酉上神
  let found = null;
  for (const dg of ['甲', '丙', '戊', '庚', '壬']) {
    for (const dz of LiurenCore.ZHI) {
      for (const hour of LiurenCore.ZHI) {
        for (const mj of LiurenCore.ZHI) {
          const c = LiurenCore.buildChartAncient(mj, dg, dz, hour, '', '', '');
          if (c && c.sanchuan.method === '昴星') { found = c; break; }
        }
        if (found) { break; }
      }
      if (found) { break; }
    }
    if (found) { break; }
  }
  check('刚日昴星取地盘酉上神', !!found && found.sanchuan.chuans[0].z === found.tp['酉'],
    found ? '实际初传=' + found.sanchuan.chuans[0].z + ' 地盘酉上神=' + found.tp['酉'] : '未找到样本');
}

console.log(fail === 0 ? '\nALL PASS' : '\nFAILED: ' + fail);
process.exit(fail === 0 ? 0 : 1);

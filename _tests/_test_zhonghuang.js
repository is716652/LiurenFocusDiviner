/* 中黄五变经 · 核心 zhonghuangDun 回归验证
   用经文课例反验：庚辰日未时/庚子日申时/己未日巳时/戊戌日未时 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const coreSrc = fs.readFileSync(path.join(__dirname, '..', 'core', 'liuren-core.js'), 'utf-8');
vm.runInThisContext(coreSrc, { filename: 'liuren-core.js' });

const R = 'D:/nutstore/HarmonyOS/GuoXue_Research/LargeLiuRen-Design/APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/rule';
const load = (f) => JSON.parse(fs.readFileSync(R + '/' + f, 'utf-8'));
LiurenCore.init({
  duxiang: { '旺衰休囚死': { '旺衰': load('旺衰休囚死.json')['旺衰'] }, '基础关系': load('基础关系.json') },
  shensha: { '神煞': load('神煞起法.json')['神煞'] },
  bifa: { '一百法': load('毕法赋一百法.json')['一百法'] }
});
const cal = JSON.parse(fs.readFileSync('D:/nutstore/HarmonyOS/GuoXue_Research/LargeLiuRen-Design/APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/cal/cal_2020.json', 'utf-8'));
const yjAll = JSON.parse(fs.readFileSync('D:/nutstore/HarmonyOS/GuoXue_Research/LargeLiuRen-Design/APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/cal/yj_all.json', 'utf-8'));
const calData = { '2026': cal['2026'] };

let fail = 0;
const check = (name, cond, extra) => {
  if (!cond) { fail++; console.log('FAIL:', name, extra || ''); } else { console.log('OK  :', name); }
};

/* 造盘辅助：直接构造 ChartCore 供 zhonghuangDun 测试（不依赖完整 buildChart） */
function mkCore(dg, hz) {
  const c = LiurenCore.buildChart({ date: '2026-08-18', hourZhi: '午', calData: calData, yjAll: yjAll });
  // 覆写日干与时干（模拟任意日/时）
  c.r.dg = dg;
  c.hourGan = LiurenCore.hourGan(dg, hz);
  return c;
}

console.log('=== 课例1：庚辰日未时（释吉凶实意）===');
{
  const z = LiurenCore.zhonghuangDun(mkCore('庚', '未'), '未');
  check('时干=癸', z.shiGan === '癸', z.shiGan);
  check('日遁 子宫=丙', z.riDun['子'] === '丙');
  check('日遁 戌宫=丙', z.riDun['戌'] === '丙');
  check('时遁 子宫=壬（经文"时遁壬"）', z.shiDun['子'] === '壬');
  check('变干(未宫)=己', z.bianGan === '己', z.bianGan);
}

console.log('=== 课例2：庚子日申时（释复建真鬼）===');
{
  const z = LiurenCore.zhonghuangDun(mkCore('庚', '申'), '申');
  check('时干=甲', z.shiGan === '甲');
  check('日遁 辰宫=庚（经文"得庚辰"）', z.riDun['辰'] === '庚');
  check('日遁 酉宫=乙（经文"乙酉"）', z.riDun['酉'] === '乙');
}

console.log('=== 课例3：己未日巳时（释复建真鬼）===');
{
  const z = LiurenCore.zhonghuangDun(mkCore('己', '巳'), '巳');
  check('日遁 巳宫=己（经文"日遁干在己巳"）', z.riDun['巳'] === '己');
  check('时干=己', z.shiGan === '己');
}

console.log('=== 课例4：戊戌日未时（释复建真鬼）===');
{
  const z = LiurenCore.zhonghuangDun(mkCore('戊', '未'), '未');
  check('日遁 午宫=戊（经文"天上遁戊临下午"）', z.riDun['午'] === '戊');
  check('时干=己', z.shiGan === '己');
}

/* 附加：验证 hourGan 独立正确（与速查表1一致） */
console.log('=== 时干速查抽样（与表1一致）===');
check('丙日午时→甲', LiurenCore.hourGan('丙', '午') === '甲');
check('壬日酉时→己', LiurenCore.hourGan('壬', '酉') === '己');
check('甲日子时→甲', LiurenCore.hourGan('甲', '子') === '甲');

console.log(fail === 0 ? '\nALL PASS' : '\nFAILED: ' + fail);
process.exit(fail === 0 ? 0 : 1);

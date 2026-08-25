/* 毕法教练升级验证：分组解读 + 年命适配建议 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const coreSrc = fs.readFileSync(path.join(__dirname, '..', 'core', 'liuren-core.js'), 'utf-8');
vm.runInThisContext(coreSrc, { filename: 'liuren-core.js' });

const R = 'D:/nutstore/HarmonyOS/GuoXue_Research/LargeLiuRen-Design/APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/rule';
const load = (f) => JSON.parse(fs.readFileSync(R + '/' + f, 'utf-8'));
const duxiang = load('旺衰休囚死.json');
const shensha = load('神煞起法.json');
const bifa = load('毕法赋一百法.json');
const jc = load('基础关系.json');
LiurenCore.init({
  duxiang: { '旺衰休囚死': { '旺衰': duxiang['旺衰'] }, '基础关系': jc },
  shensha: { '神煞': shensha['神煞'] },
  bifa: { '一百法': bifa['一百法'] }
});
const coachData = load('毕法教练.json');
const cal = JSON.parse(fs.readFileSync('D:/nutstore/HarmonyOS/GuoXue_Research/LargeLiuRen-Design/APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/cal/cal_2020.json', 'utf-8'));
const yjAll = JSON.parse(fs.readFileSync('D:/nutstore/HarmonyOS/GuoXue_Research/LargeLiuRen-Design/APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/cal/yj_all.json', 'utf-8'));
const calData = { '2026': cal['2026'] };

let fail = 0;
const check = (name, cond, extra) => {
  if (!cond) { fail++; console.log('FAIL:', name, extra || ''); } else { console.log('OK  :', name); }
};

// 多格局样本（2026-01-08 寅时：18/70/82/4）
const c = LiurenCore.buildChart({ date: '2026-01-08', hourZhi: '寅', calData: calData, yjAll: yjAll });
const coach = LiurenCore.bifaCoach(c.dx.bifa, coachData);
console.log('=== 组合断 ===');
console.log(coach.summary);
console.log('=== 分组解读 ===');
coach.groups.forEach(g => console.log(' ·', g));
console.log('=== 建议 ===');
console.log(coach.advice.join('；'));
check('分组解读非空', coach.groups.length > 0);
check('分组含课体/空亡/官鬼类', coach.groups.some(g => g.indexOf('空亡') >= 0) || coach.groups.length >= 2);

// 年命适配：同一盘不同年命
console.log('\n=== 年命适配（2026-01-08 寅时）===');
for (const nz of ['子', '午', '卯', '申']) {
  const na = LiurenCore.nianmingAdvice(c, nz);
  console.log(` 年命${nz}: 上神${na.shangShen}(${na.liuqin}) ${na.kong ? '空' : ''} ${na.wangShuai} → ${na.advice}`);
  check('年命建议非空', na.advice.length > 0);
}
// 年命上神 = 天盘加临
check('年命上神正确', LiurenCore.nianmingAdvice(c, '子').shangShen === c.tp['子']);

console.log(fail === 0 ? '\nALL PASS' : '\nFAILED: ' + fail);
process.exit(fail === 0 ? 0 : 1);

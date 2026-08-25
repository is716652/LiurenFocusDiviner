/* 毕法教练层验证：bifaCoach 组合断 + 吉凶汇总 + 建议 */
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

// 已知命中格局样本
const samples = [
  ['2026-01-04', '卯', '干支皆败'],      // 36
  ['2026-01-02', '丑', '任信丁马+白虎遁鬼+官鬼三四'],  // 89,69,70
  ['2026-01-08', '寅', '逆连茹+官鬼三四+不行传+催官']  // 18,70,82,4
];
for (const [date, hz, label] of samples) {
  const c = LiurenCore.buildChart({ date: date, hourZhi: hz, calData: calData, yjAll: yjAll });
  if (!c) { console.log('null', date); continue; }
  const coach = LiurenCore.bifaCoach(c.dx.bifa, coachData);
  console.log('\n=== ' + date + ' ' + hz + '时 [' + label + '] ===');
  console.log('组合断:', coach.summary);
  coach.items.forEach(it => console.log(`  ${it['序']} ${it['法名']} [${it['吉凶']}] ${it['倾向']} → ${it['建议']}`));
  if (coach.advice.length) console.log('建议汇总:', coach.advice.join('；'));
  check('教练条目非空', coach.items.length > 0);
}

// 全量扫描：所有命中格局都应能在教练数据中找到
let miss = 0, totalHit = 0;
const hours = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
for (const rec of cal['2026']) {
  for (const hz of hours) {
    const c = LiurenCore.buildChart({ date: rec.d, hourZhi: hz, calData: calData, yjAll: yjAll });
    if (!c) continue;
    const coach = LiurenCore.bifaCoach(c.dx.bifa, coachData);
    totalHit += coach.items.length;
    // 检查每个命中是否有倾向/建议
    coach.items.forEach(it => {
      if (it['倾向'] === '' || it['建议'] === '') miss++;
    });
  }
}
console.log('\n2026 扫描命中格局总次:', totalHit, '缺倾向/建议:', miss);
check('所有命中格局都有教练数据', miss === 0);

console.log(fail === 0 ? '\nALL PASS' : '\nFAILED: ' + fail);
process.exit(fail === 0 ? 0 : 1);

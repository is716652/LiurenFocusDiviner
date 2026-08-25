/* 年命与用神互动断验证 */
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
const cal = JSON.parse(fs.readFileSync('D:/nutstore/HarmonyOS/GuoXue_Research/LargeLiuRen-Design/APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/cal/cal_2020.json', 'utf-8'));
const yjAll = JSON.parse(fs.readFileSync('D:/nutstore/HarmonyOS/GuoXue_Research/LargeLiuRen-Design/APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/cal/yj_all.json', 'utf-8'));
const calData = { '2026': cal['2026'] };

let fail = 0;
const check = (name, cond, extra) => {
  if (!cond) { fail++; console.log('FAIL:', name, extra || ''); } else { console.log('OK  :', name); }
};

const c = LiurenCore.buildChart({ date: '2026-01-02', hourZhi: '丑', calData: calData, yjAll: yjAll });
console.log('日柱:', c.r.dg + c.r.dz, '| 天盘:', JSON.stringify(c.tp));

// 用神 = 初传（如丙子日丑时初传）
const yongshen = c.sanchuan.chuans[0].z;
console.log('用神(初传):', yongshen);

// 多年命看互动
for (const nz of ['子', '丑', '寅', '卯', '午', '酉']) {
  const na = LiurenCore.nianmingAdvice(c, nz, yongshen);
  console.log(` 年命${nz} 上神${na.shangShen}(${na.liuqin}) 与用神${yongshen}: ${na.rel}`);
  console.log(`   → ${na.advice}`);
  check('互动关系非空', na.rel !== '');
  check('互动断语非空', na.interact !== '');
}

// 无用时（用神空）互动为空但建议仍在
const na0 = LiurenCore.nianmingAdvice(c, '子', '');
check('无用神时 rel 为空', na0.rel === '');
check('无用神时建议仍有效', na0.advice.length > 0);

console.log(fail === 0 ? '\nALL PASS' : '\nFAILED: ' + fail);
process.exit(fail === 0 ? 0 : 1);

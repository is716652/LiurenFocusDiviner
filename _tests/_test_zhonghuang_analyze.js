/* 中黄完整分析验证：双视角对比 + 变干主线 + 建合检测 */
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

const c = LiurenCore.buildChart({ date: '2026-08-18', hourZhi: '午', calData: calData, yjAll: yjAll });

console.log('盘: ' + c.r.dg + c.r.dz + '日 ' + c.hourGan + '午时（' + c.yj.zhi + '将）');

const a = LiurenCore.zhonghuangAnalyze(c, '午');

console.log('\n--- 双视角六亲对比（12宫）---');
a.cmp.forEach(it => {
  const mark = it.changed ? ' ★变' : '';
  console.log('  ' + it.gong + '宫: 旬遁' + it.xunGan + '(' + it.xunLq + ') → 中黄' + it.zhGan + '(' + it.zhLq + ')' + mark);
});
check('对比项=12', a.cmp.length === 12);
check('变化宫位记录', a.changed.length > 0, 'changed=' + a.changed.join(','));
// 验证：变化宫位的六亲确实不同
let chkChanged = true;
a.changed.forEach(g => {
  const it = a.cmp.find(x => x.gong === g);
  if (!it || it.xunLq === it.zhLq) chkChanged = false;
});
check('changed 宫六亲确实变', chkChanged);

console.log('\n--- 变干主线 ---');
console.log('  时干' + a.dun.shiGan + ' · 变干' + a.dun.bianGan + '(' + a.bianGong + '宫) 乘' + (a.bianJiang || '无将') + ' 为日干' + c.r.dg + '之' + a.bianLq +
  (a.bianInChuan ? ' · 入' + a.bianInChuan : ' · 不入三传'));
check('变干=时遁盘中占时支干', a.dun.bianGan === a.dun.shiDun['午']);
check('变干六亲非空', a.bianLq !== '');

console.log('\n--- 建合检测 ---');
if (a.jianhe.length === 0) {
  console.log('  本盘无建合');
} else {
  a.jianhe.forEach(j => console.log('  ' + j.pos + '(' + j.gong + '宫): 日遁' + j.riGan + '×时遁' + j.shiGan + ' → ' + j.type));
}
check('建合检测结构完整', Array.isArray(a.jianhe));

console.log(fail === 0 ? '\nALL PASS' : '\nFAILED: ' + fail);
process.exit(fail === 0 ? 0 : 1);

/* 课体毕法验证：第89法(任信丁马·伏吟逢丁马)、第54法(虎视逢虎·昴星乘白虎) */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const coreSrc = fs.readFileSync(path.join(__dirname, '..', 'core', 'liuren-core.js'), 'utf-8');
vm.runInThisContext(coreSrc, { filename: 'liuren-core.js' });

const R = 'D:/nutstore/HarmonyOS/GuoXue_Research/LargeLiuRen-Design/APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/rule';
const load = (f) => JSON.parse(fs.readFileSync(R + '/' + f, 'utf-8'));
/* 规则数据必须 init，否则 rules.bifa 为空 */
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

/* 扫描 2026 找伏吟课，检查 89 法命中 */
console.log('=== 扫描伏吟课（2026）===');
const hours = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
let fuyinCount = 0;
let fuyin89 = 0;
let fuyinNo89 = 0;
for (const rec of cal['2026']) {
  for (const hz of hours) {
    const c = LiurenCore.buildChart({ date: rec.d, hourZhi: hz, calData: calData, yjAll: yjAll });
    if (!c) continue;
    if (c.sanchuan.keti === '伏吟') {
      fuyinCount++;
      const hit89 = c.dx.bifa.some(h => h['序'] === 89);
      if (hit89) { fuyin89++; } else { fuyinNo89++; }
      if (fuyinCount <= 3) {
        console.log(`  ${rec.d} ${hz}时 ${rec.dg}${rec.dz}日 伏吟 三传[${c.sanchuan.chuans.map(x=>x.gz).join('→')}] 89法:${hit89 ? '命中' : '未中'} 毕法[${c.dx.bifa.map(h=>h['序']).join(',')}]`);
      }
    }
  }
}
console.log(`伏吟课总数: ${fuyinCount} | 89法命中: ${fuyin89} | 未命中: ${fuyinNo89}`);
check('存在伏吟课', fuyinCount > 0);
check('89法至少命中一次', fuyin89 > 0);

/* 扫描昴星课，检查 54 法 */
console.log('\n=== 扫描昴星课（2026）===');
let maoxingCount = 0;
let maoxing54 = 0;
for (const rec of cal['2026']) {
  for (const hz of hours) {
    const c = LiurenCore.buildChart({ date: rec.d, hourZhi: hz, calData: calData, yjAll: yjAll });
    if (!c) continue;
    if (c.sanchuan.keti.indexOf('昴星') >= 0) {
      maoxingCount++;
      const hit54 = c.dx.bifa.some(h => h['序'] === 54);
      if (hit54) { maoxing54++; }
      if (maoxingCount <= 3) {
        console.log(`  ${rec.d} ${hz}时 ${rec.dg}${rec.dz}日 ${c.sanchuan.keti} 54法:${hit54 ? '命中' : '未中'} 干将[${c.jiangMap[LiurenCore.gongOf(c.tp, c.kegs[0].x)]}]支将[${c.jiangMap[LiurenCore.gongOf(c.tp, c.kegs[2].x)]}]`);
      }
    }
  }
}
console.log(`昴星课总数: ${maoxingCount} | 54法命中: ${maoxing54}`);
check('存在昴星课', maoxingCount > 0);

/* 22法 上下皆合（干支上神六合）—— 伏吟课中最常见 */
console.log('\n=== 第22法 上下皆合 ===');
let hit22 = 0;
for (const rec of cal['2026']) {
  for (const hz of hours) {
    const c = LiurenCore.buildChart({ date: rec.d, hourZhi: hz, calData: calData, yjAll: yjAll });
    if (!c) continue;
    if (c.dx.bifa.some(h => h['序'] === 22)) {
      hit22++;
      if (hit22 <= 3) {
        console.log(`  ${rec.d} ${hz}时 ${rec.dg}${rec.dz}日 22法命中 干上${c.kegs[0].x} 支上${c.kegs[2].x} 毕法[${c.dx.bifa.map(h=>h['序']).join(',')}]`);
      }
    }
  }
}
console.log(`22法命中: ${hit22}`);
check('22法至少命中一次', hit22 > 0);

/* 82法 不行传者（中末空亡考初传） */
console.log('\n=== 第82法 不行传者 ===');
let hit82 = 0;
for (const rec of cal['2026']) {
  for (const hz of hours) {
    const c = LiurenCore.buildChart({ date: rec.d, hourZhi: hz, calData: calData, yjAll: yjAll });
    if (!c) continue;
    if (c.dx.bifa.some(h => h['序'] === 82)) {
      hit82++;
      if (hit82 <= 3) {
        console.log(`  ${rec.d} ${hz}时 ${rec.dg}${rec.dz}日 82法命中 三传[${c.sanchuan.chuans.map(x=>x.gz).join('→')}] 空亡[${c.dx.xunkong.join('')}]`);
      }
    }
  }
}
console.log(`82法命中: ${hit82}`);
check('82法至少命中一次', hit82 > 0);

/* 复合格局：4催官使者 / 11众鬼虽彰 / 31三传递生 / 33有始无终 */
console.log('\n=== 复合格局扫描 ===');
const targets = { 4: '催官使者', 11: '众鬼虽彰', 31: '三传递生', 33: '有始无终' };
const counts = { 4: 0, 11: 0, 31: 0, 33: 0 };
for (const rec of cal['2026']) {
  for (const hz of hours) {
    const c = LiurenCore.buildChart({ date: rec.d, hourZhi: hz, calData: calData, yjAll: yjAll });
    if (!c) continue;
    for (const no of Object.keys(targets)) {
      if (c.dx.bifa.some(h => h['序'] === Number(no))) {
        counts[no]++;
        if (counts[no] <= 2) {
          console.log(`  ${rec.d} ${hz}时 ${rec.dg}${rec.dz}日 第${no}法[${targets[no]}]命中 三传[${c.sanchuan.chuans.map(x=>x.gz).join('→')}]`);
        }
      }
    }
  }
}
for (const no of Object.keys(targets)) {
  console.log(`第${no}法[${targets[no]}]命中: ${counts[no]}`);
  check(`第${no}法至少命中一次`, counts[no] > 0);
}

/* 脱败逃生组：9避难逃生 / 15脱上逢脱 / 35人宅受脱 / 36干上逢败 */
console.log('\n=== 脱败逃生组扫描 ===');
const targets2 = { 9: '避难逃生', 15: '脱上逢脱', 35: '人宅受脱', 36: '干上逢败' };
const counts2 = { 9: 0, 15: 0, 35: 0, 36: 0 };
for (const rec of cal['2026']) {
  for (const hz of hours) {
    const c = LiurenCore.buildChart({ date: rec.d, hourZhi: hz, calData: calData, yjAll: yjAll });
    if (!c) continue;
    for (const no of Object.keys(targets2)) {
      if (c.dx.bifa.some(h => h['序'] === Number(no))) {
        counts2[no]++;
        if (counts2[no] <= 2) {
          console.log(`  ${rec.d} ${hz}时 ${rec.dg}${rec.dz}日 第${no}法[${targets2[no]}]命中 干上${c.kegs[0].x} 支上${c.kegs[2].x} 三传[${c.sanchuan.chuans.map(x=>x.gz).join('→')}]`);
        }
      }
    }
  }
}
for (const no of Object.keys(targets2)) {
  console.log(`第${no}法[${targets2[no]}]命中: ${counts2[no]}`);
  check(`第${no}法至少命中一次`, counts2[no] > 0);
}

console.log(fail === 0 ? '\nALL PASS' : '\nFAILED: ' + fail);
process.exit(fail === 0 ? 0 : 1);

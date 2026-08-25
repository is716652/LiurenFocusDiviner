/* 真实历法扫描：找出伏吟/返吟/八专/别责/昴星课体实例并验证三传
   用 buildChart 完整排盘（含天盘/四课），核对 keti 识别 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const coreSrc = fs.readFileSync(path.join(__dirname, '..', 'core', 'liuren-core.js'), 'utf-8');
vm.runInThisContext(coreSrc, { filename: 'liuren-core.js' });

const ZHI = LiurenCore.ZHI;
let fail = 0;
const check = (name, cond, extra) => {
  if (!cond) { fail++; console.log('FAIL:', name, extra || ''); } else { console.log('OK  :', name); }
};

// 加载 2020s 历法（含 2026）+ yj_all
const cal = JSON.parse(fs.readFileSync('D:/nutstore/HarmonyOS/GuoXue_Research/LargeLiuRen-Design/APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/cal/cal_2020.json', 'utf-8'));
const yjAll = JSON.parse(fs.readFileSync('D:/nutstore/HarmonyOS/GuoXue_Research/LargeLiuRen-Design/APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/cal/yj_all.json', 'utf-8'));
const calData = { '2026': cal['2026'], '2027': cal['2027'], '2028': cal['2028'], '2029': cal['2029'] };

// 扫描 2026-2029 全日期 × 4 个时辰，收集各课体实例
const hours = ['子', '卯', '午', '酉'];
const found = { '伏吟': [], '返吟': [], '八专': [], '别责': [], '昴星': [] };
let total = 0;
for (const y of ['2026', '2027', '2028', '2029']) {
  const days = cal[y];
  if (!days) continue;
  for (const rec of days) {
    for (const hz of hours) {
      const c = LiurenCore.buildChart({ date: rec.d, hourZhi: hz, calData: calData, yjAll: yjAll });
      if (!c) continue;
      total++;
      const k = c.sanchuan.keti;
      if (k && found[k] !== undefined && found[k].length < 3) {
        found[k].push({ date: rec.d, hz: hz, dg: rec.dg, dz: rec.dz, method: c.sanchuan.method,
          chuans: c.sanchuan.chuans.map(x => x.gz).join('→') });
      }
    }
  }
}
console.log('扫描样本数:', total);
for (const k of Object.keys(found)) {
  console.log('\n=== ' + k + ' (' + found[k].length + ' 例) ===');
  for (const s of found[k]) {
    console.log(`  ${s.date} ${s.hz}时 ${s.dg}${s.dz}日 [${s.method}] ${s.chuans}`);
  }
}

// 验证：找到的课体必须 keti 非空且三传 3 个
const anyFound = Object.values(found).some(a => a.length > 0);
check('扫描到课体实例', anyFound);
for (const k of Object.keys(found)) {
  for (const s of found[k]) {
    check(k + ' 三传完整', s.chuans.split('→').length === 3, s.chuans);
  }
}

console.log(fail === 0 ? '\nALL PASS' : '\nFAILED: ' + fail);
process.exit(fail === 0 ? 0 : 1);

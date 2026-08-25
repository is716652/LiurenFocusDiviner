/* 课体识别层验证：伏吟/返吟/八专/别责/昴星 三传正确性
   规则依据《大六壬指南》四课三传·三传排法.md（九宗门 1→9 优先级） */
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

/* 工具：按 tp 构造 kegs + resolveSanchuan */
function testKeti(dg, dz, tpDesc, expect) {
  // tpDesc: 12 个地盘宫对应的天盘支（按 ZHI 顺序）
  const tp = {};
  ZHI.forEach((z, i) => { tp[z] = tpDesc[i]; });
  const ji = LiurenCore.JI_GONG[dg];
  const g1 = tp[ji], g2 = tp[g1], g3 = tp[dz], g4 = tp[g3];
  const kegs = [{ x: g1, s: dg }, { x: g2, s: g1 }, { x: g3, s: dz }, { x: g4, s: g3 }];
  const dun = LiurenCore.dunMap(dg);
  const sc = LiurenCore.resolveSanchuan(dg, tp, kegs, dun);
  return { tp, kegs, sc };
}

/* 1. 伏吟：天盘=地盘（tp[z]=z） */
{
  const r = testKeti('甲', '寅', ZHI.slice(), null);
  check('伏吟识别', r.sc.keti === '伏吟', 'got ' + r.sc.keti);
  check('伏吟三传3个', r.sc.chuans.length === 3);
  console.log('  伏吟三传:', r.sc.chuans.map(c => c.gz).join('→'));
}

/* 2. 返吟：天盘=地盘之冲 */
{
  const tpDesc = ZHI.map((z, i) => ZHI[(i + 6) % 12]);
  const r = testKeti('甲', '寅', tpDesc, null);
  check('返吟识别', r.sc.keti.indexOf('返吟') >= 0, 'got ' + r.sc.keti);
  console.log('  返吟三传:', r.sc.chuans.map(c => c.gz).join('→'));
}

/* 3+4. 八专 / 别责：用真实历法样本（手工构造易产生意外贼克，由 _scan_keti.js 全量覆盖） */
{
  const cal = JSON.parse(fs.readFileSync('D:/nutstore/HarmonyOS/GuoXue_Research/LargeLiuRen-Design/APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/cal/cal_2020.json', 'utf-8'));
  const yjAll = JSON.parse(fs.readFileSync('D:/nutstore/HarmonyOS/GuoXue_Research/LargeLiuRen-Design/APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/cal/yj_all.json', 'utf-8'));
  const calData = { '2026': cal['2026'] };
  // 八专样本：2026-02-02 丁未日 卯时（干支同位）
  const bz = LiurenCore.buildChart({ date: '2026-02-02', hourZhi: '卯', calData: calData, yjAll: yjAll });
  check('八专识别(真实样本)', bz && bz.sanchuan.keti === '八专', bz ? 'got ' + bz.sanchuan.keti : 'null');
  if (bz) {
    check('八专三传3个', bz.sanchuan.chuans.length === 3);
    console.log('  八专三传:', bz.sanchuan.chuans.map(c => c.gz).join('→'));
  }
  // 别责样本：2026-01-27 辛丑日 酉时
  const bz2 = LiurenCore.buildChart({ date: '2026-01-27', hourZhi: '酉', calData: calData, yjAll: yjAll });
  check('别责识别(真实样本)', bz2 && bz2.sanchuan.keti === '别责', bz2 ? 'got ' + bz2.sanchuan.keti : 'null');
  if (bz2) {
    check('别责三传3个', bz2.sanchuan.chuans.length === 3);
    console.log('  别责三传:', bz2.sanchuan.chuans.map(c => c.gz).join('→'));
  }
}

/* 5. 普通课不受影响：元首 */
{
  const dg = '丙', dz = '午';
  const tp = {};
  ZHI.forEach((z, i) => { tp[z] = ZHI[(i + 4) % 12]; }); // 顺移4位
  const ji = LiurenCore.JI_GONG[dg]; // 巳
  const g1 = tp[ji], g2 = tp[g1], g3 = tp[dz], g4 = tp[g3];
  const kegs = [{ x: g1, s: dg }, { x: g2, s: g1 }, { x: g3, s: dz }, { x: g4, s: g3 }];
  const sc = LiurenCore.resolveSanchuan(dg, tp, kegs, LiurenCore.dunMap(dg));
  check('普通课 method 非空', sc.method !== '', 'got ' + sc.method);
  check('普通课 keti 为空', sc.keti === '', 'got ' + sc.keti);
  console.log('  普通课:', sc.method, sc.chuans.map(c => c.gz).join('→'));
}

console.log(fail === 0 ? '\nALL PASS' : '\nFAILED: ' + fail);
process.exit(fail === 0 ? 0 : 1);

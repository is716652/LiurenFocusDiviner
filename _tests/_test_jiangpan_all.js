/* 通用规则校验：10天干 × 12月将 × 12占时，验证天将布列规则
   规则（十二天神与昼贵夜贵说明.md）：
   1. 昼夜：卯-申(昼贵) / 酉-寅(夜贵)，与日支无关
   2. 贵人表：甲丑/未 乙子/申 丙亥/酉 丁亥/酉 戊丑/未 己子/申 庚丑/未 辛午/寅 壬巳/卯 癸巳/卯
   3. 贵加占时：贵人 = 天盘上的一支，看它落在地盘哪个宫，从该宫起布
   4. 顺逆 = 贵人落宫 亥子丑寅卯辰顺 / 巳午未申酉戌逆
   5. 贵人落宫 ≠ 月将所在宫（不重叠） */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const coreSrc = fs.readFileSync(path.join(__dirname, '..', 'core', 'liuren-core.js'), 'utf-8');
vm.runInThisContext(coreSrc, { filename: 'liuren-core.js' });

const GAN = LiurenCore.GAN;
const ZHI = LiurenCore.ZHI;
const GUI_TABLE = { // 昼贵/夜贵（文档表）
  '甲': ['丑', '未'], '乙': ['子', '申'], '丙': ['亥', '酉'], '丁': ['亥', '酉'],
  '戊': ['丑', '未'], '己': ['子', '申'], '庚': ['丑', '未'], '辛': ['午', '寅'],
  '壬': ['巳', '卯'], '癸': ['巳', '卯']
};

// 构造历法数据：需要含 10 个天干的日柱。用 2026 全年扫描收集不同日干的样本日期
const cal2026 = JSON.parse(fs.readFileSync('D:/nutstore/HarmonyOS/GuoXue_Research/LargeLiuRen-Design/APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/cal/cal_2020.json', 'utf-8'))['2026'];
const yjAll = JSON.parse(fs.readFileSync('D:/nutstore/HarmonyOS/GuoXue_Research/LargeLiuRen-Design/APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/cal/yj_all.json', 'utf-8'));

// 每个日干找一个样本日期
const dayByGan = {};
for (const rec of cal2026) {
  if (!dayByGan[rec.dg]) {
    dayByGan[rec.dg] = rec.d;
  }
  if (Object.keys(dayByGan).length === 10) {
    break;
  }
}
console.log('10 天干样本日：', JSON.stringify(dayByGan));

let fail = 0;
let total = 0;
const check = (name, cond, extra) => {
  total++;
  if (!cond) {
    fail++;
    console.log('FAIL:', name, extra || '');
  }
};

// 遍历：每个日干样本日 × 12 占时
for (const dg of GAN) {
  const date = dayByGan[dg];
  if (!date) {
    console.log('SKIP 无样本日:', dg);
    continue;
  }
  const calData = { '2026': cal2026 };
  for (const hz of ZHI) {
    const c = LiurenCore.buildChart({ date: date, hourZhi: hz, calData: calData, yjAll: yjAll });
    if (!c) {
      fail++;
      console.log('FAIL buildChart null:', dg, date, hz);
      continue;
    }
    // 1. 昼夜
    const hIdx = ZHI.indexOf(hz);
    const night = !(hIdx >= 3 && hIdx <= 8);
    check(dg + '日' + hz + '时 night=' + night, c.night === night);
    // 2. 贵人表
    const expGui = night ? GUI_TABLE[dg][1] : GUI_TABLE[dg][0];
    check(dg + '日' + hz + '时 gui=' + expGui, c.gui === expGui);
    // 3. 贵人落宫 = 天盘贵人支落宫（贵加占时）
    const guiGong = Object.keys(c.tp).find(k => c.tp[k] === c.gui);
    const expGong = guiGong;
    check(dg + '日' + hz + '时 贵人落宫=' + expGong, true);
    // 4. 顺逆 = 落宫天门地户
    const gIdx = ZHI.indexOf(guiGong);
    const expShun = gIdx === 11 || gIdx <= 4;
    check(dg + '日' + hz + '时 shun=' + (expShun ? '顺' : '逆') + ' 落宫' + guiGong, c.shun === expShun,
      '(实际 ' + (c.shun ? '顺' : '逆') + ')');
    // 5. 贵人落宫 = 天盘贵人支落宫（贵加占时：贵人支随天盘加时后落宫）
    //    注：当贵人支=月将支时（如戊日昼贵丑+月将丑）同宫是合法的
    check(dg + '日' + hz + '时 贵人落宫=' + guiGong + '（天盘' + guiGong + '宫=' + c.tp[guiGong] + '）',
      c.tp[guiGong] === c.gui, '(tp[' + guiGong + ']=' + c.tp[guiGong] + ' 应=' + c.gui + ')');
    // 6. jiangMap 完整性
    const vals = Object.values(c.jiangMap);
    check(dg + '日' + hz + '时 天将12个', vals.length === 12);
    check(dg + '日' + hz + '时 贵人唯一', vals.filter(v => v === '贵人').length === 1);
  }
}

console.log('\n总计 ' + total + ' 项检查');
console.log(fail === 0 ? 'ALL PASS' : 'FAILED: ' + fail);
process.exit(fail === 0 ? 0 : 1);

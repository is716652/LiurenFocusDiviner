/* 行年（小运）功能验证 */
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

const c = LiurenCore.buildChart({ date: '2026-08-18', hourZhi: '巳', calData: calData, yjAll: yjAll });
console.log('盘: 2026-08-18 巳时', c.r.dg + c.r.dz, '日 | 今年太岁', LiurenCore.yearZhiOf(c.r));

// 测试用例：
// 1984 甲子年（阳干）男：顺行，虚岁 = 2026-1984+1 = 43
// 本命子(0)，顺行 42 步 → 0+42=42%12=6 → 午
const m84 = LiurenCore.xingNian(c, 1984, 2026, '男', '巳');
console.log('\n1984 甲子 男 2026:', m84.benMingGan + m84.benMingZhi, '顺:', m84.shun, '行年:', m84.xingNianZhi);
check('1984男 本命子', m84.benMingZhi === '子');
check('1984男 阳干顺行', m84.shun === true);
check('1984男 行年午', m84.xingNianZhi === '午');

// 1984 甲子年（阳干）女：逆行，本命子(0)，逆 42 步 → 0-42=-42%12=-6→6 → 午？-42 mod 12 = -42+48=6 → 午
const f84 = LiurenCore.xingNian(c, 1984, 2026, '女', '');
console.log('1984 甲子 女 2026:', f84.benMingZhi, '顺:', f84.shun, '行年:', f84.xingNianZhi);
check('1984女 阴年女逆行(阳干女=逆)', f84.shun === false);

// 1985 乙丑年（阴干）男：逆行
const m85 = LiurenCore.xingNian(c, 1985, 2026, '男', '');
console.log('1985 乙丑 男 2026:', m85.benMingGan + m85.benMingZhi, '顺:', m85.shun, '行年:', m85.xingNianZhi);
check('1985男 本命丑', m85.benMingZhi === '丑');
check('1985男 阴干逆行', m85.shun === false);
// 丑(1)，逆 41 步 → 1-41=-40%12 → -40+48=8 → 申
check('1985男 行年申', m85.xingNianZhi === '申');

// 1990 庚午年（阳干）女：逆行
const f90 = LiurenCore.xingNian(c, 1990, 2026, '女', '');
console.log('1990 庚午 女 2026:', f90.benMingZhi, '顺:', f90.shun, '行年:', f90.xingNianZhi);
check('1990女 本命午', f90.benMingZhi === '午');
check('1990女 阳干逆行', f90.shun === false);

// 建议与上神
console.log('\n1984男 行年上神:', m84.shangShen, '(', m84.liuqin, ')', m84.kong ? '空' : '', m84.wangShuai);
console.log('建议:', m84.advice);
check('行年建议非空', m84.advice.length > 0);
check('行年上神正确', m84.shangShen === c.tp[m84.xingNianZhi]);

// —— 行年与用神互动断 ——
console.log('\n用神巳（' + m84.rel + '）:', m84.interact);
check('互动关系非空', m84.rel !== '');
check('互动断语非空', m84.interact !== '');
check('互动断语含用神', m84.interact.indexOf('巳') >= 0);
const m84NoYs = LiurenCore.xingNian(c, 1984, 2026, '男', '');
check('无用神时 rel 空', m84NoYs.rel === '');
check('无用神时 interact 空', m84NoYs.interact === '');

// —— 行年断流年细化：太岁关系 + 乘将 ——
console.log('\n今年太岁:', m84.taiSui, '| 与太岁:', m84.tsRel, '|', m84.tsNote);
console.log('行年上神乘将:', m84.jiang, '(', m84.jiangJx, ')', m84.jiangNote);
check('太岁支=丙午年支', m84.taiSui === '午');
check('太岁关系非空', m84.tsRel !== '');
check('太岁断语非空', m84.tsNote !== '');
check('乘将非空', m84.jiang !== '');
check('乘将吉凶已判', m84.jiangJx === '吉' || m84.jiangJx === '凶');
check('乘将断语非空', m84.jiangNote !== '');

// —— 行年吉凶量化：1984甲子男 = 妻财+2 + 休0 + 合太岁+2 + 天空-2 = 2 → 吉 ——
console.log('\n吉凶分:', m84.score, '| 档位:', m84.band);
check('评分=2', m84.score === 2);
check('档位=吉', m84.band === '吉');
// 打分表数据驱动：注入自定义规则 → 分数随之变化（改JSON不改码）
LiurenCore.init({
  duxiang: { '旺衰休囚死': { '旺衰': duxiang['旺衰'] }, '基础关系': jc },
  shensha: { '神煞': shensha['神煞'] },
  bifa: { '一百法': bifa['一百法'] },
  xingnian: {
    liuQin: { '官鬼': -5, '妻财': 5, '子孙': 5, '父母': 1, '兄弟': 0 },
    kong: -2,
    wangShuai: { '旺': 1, '相': 1, '休': 0, '囚': -1, '死': -1 },
    taiSui: { '值太岁': -1, '冲太岁': -2, '合太岁': 2, '生太岁': 0, '太岁生': 1, '克太岁': -1, '太岁克': -2, '比和': 0 },
    jiangJx: { '吉': 2, '凶': -2, '': 0 },
    bands: [{ min: 4, label: '大吉' }, { min: 1, label: '吉' }, { min: -2, label: '平' }, { min: -5, label: '凶' }, { min: -99, label: '大凶' }]
  }
});
const m84b = LiurenCore.xingNian(c, 1984, 2026, '男', '巳');
console.log('自定义表 妻财+5 → 分', m84b.score);
check('自定义表分数变化', m84b.score === 5);
LiurenCore.init({
  duxiang: { '旺衰休囚死': { '旺衰': duxiang['旺衰'] }, '基础关系': jc },
  shensha: { '神煞': shensha['神煞'] },
  bifa: { '一百法': bifa['一百法'] }
});
const m84c = LiurenCore.xingNian(c, 1984, 2026, '男', '巳');
check('恢复默认表分数=2', m84c.score === 2);

console.log(fail === 0 ? '\nALL PASS' : '\nFAILED: ' + fail);
process.exit(fail === 0 ? 0 : 1);

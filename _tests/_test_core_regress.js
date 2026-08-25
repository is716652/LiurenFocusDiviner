/* ============================================================================
 * _test_core_regress.js —— 新旧逻辑回归比对（重构前后输出逐项一致）
 * ----------------------------------------------------------------------------
 * 旧逻辑：从 _backup/2026-08-17-核心解耦前/大六壬万年历起课.html（改造前快照）
 *         用正则截取「常量 + 排盘引擎 + 盘态计算块」
 *         （配齐 GAN/ZHI 等）拼成 _old_engine.js，原样 eval 运行
 * 新核心：core/liuren-core.js（core/liuren-core.ts 的 tsc 编译产物）
 * 历法数据：UI/_data/yj_all.js + cal_1990s/2020s/2030s/2040s.js（eval 设 window.CAL/YJ_ALL）
 * 规则数据：UI/_data/duxiang_rules.js + shensha_rules.js + bifa.js
 * 6 个样本逐字段比对；全部 PASS 输出：回归比对: 6/6 全过
 * 用法：node _test_core_regress.js
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'UI', '_data');
const HTML = path.join(ROOT, 'UI', '大六壬万年历起课.html');
const CORE_JS = path.join(ROOT, 'core', 'liuren-core.js');
const OLD_ENGINE = path.join(__dirname, '_old_engine.js');
/* 旧引擎提取源：优先 _backup 改造前快照（当前 HTML 已不含内联引擎），缺失时回退 */
const OLD_HTML = fs.existsSync(path.join(ROOT, '_backup', '2026-08-17-核心解耦前', '大六壬万年历起课.html'))
  ? path.join(ROOT, '_backup', '2026-08-17-核心解耦前', '大六壬万年历起课.html')
  : HTML;

/* ---------------- 1. 从旧版 HTML 提取旧逻辑 ---------------- */
const html = fs.readFileSync(OLD_HTML, 'utf8');

function extract(re, name) {
  const m = html.match(re);
  if (!m) {
    throw new Error('旧逻辑提取失败: ' + name);
  }
  return m[0];
}

/* 常量块（GAN..G_YANG + MONTHS/isLeap/pad/dayRec） */
const blockA = extract(/const GAN=\[[^\]]*\];[\s\S]*?function dayRec\(ds\)\{[^}]*\}/, '常量+dayRec');
/* 排盘引擎（wutun..buildChart，至 盘态计算 注释前） */
const blockB = extract(/function wutun\(g\)\{[\s\S]*?(?=\n\n\/\* ============ 盘态计算)/, '排盘引擎');
/* 盘态计算块（至 毕法格局区 注释前，即 renderBifa 结束） */
const blockC = extract(/\/\* ============ 盘态计算[\s\S]*?(?=\n\/\* 毕法格局区)/, '盘态计算块');
/* resolveSanchuan（九宗门） */
const blockD = extract(/function resolveSanchuan\([\s\S]*?\n\}/, 'resolveSanchuan');
/* SHENG / gongOf */
const blockE = extract(/function SHENG\(a\)\{[^\n]*\n/, 'SHENG');
const blockF = extract(/function gongOf\(tp,z\)\{[^\n]*\n/, 'gongOf');

const oldEngineSrc = blockA + '\n' + blockB + '\n' + blockC + '\n' + blockD + '\n' + blockE + '\n' + blockF +
  '\nvar selDate = "", selHour = "", curAffair = "求财";\n' +
  'function oldBuildChart(date, hourZhi) { selDate = date; selHour = hourZhi; return buildChart(); }\n';
fs.writeFileSync(OLD_ENGINE, oldEngineSrc, 'utf8');
console.log('[提取] 旧逻辑已拼成 _old_engine.js（' + oldEngineSrc.length + ' 字节）');

/* ---------------- 2. 同一 vm 上下文：window + 历法数据 + 规则 + 旧引擎 + 新核心 ---------------- */
const ctx = { window: {}, console: console };
vm.createContext(ctx);

const dataFiles = [
  'yj_all.js',
  'cal_1990s.js', 'cal_2020s.js', 'cal_2030s.js', 'cal_2040s.js',
  'duxiang_rules.js', 'shensha_rules.js', 'bifa.js'
];
for (const f of dataFiles) {
  vm.runInContext(fs.readFileSync(path.join(DATA, f), 'utf8'), ctx);
}
vm.runInContext(oldEngineSrc, ctx);
vm.runInContext(fs.readFileSync(CORE_JS, 'utf8') + '\nglobalThis.__LiurenCore = LiurenCore;', ctx);
vm.runInContext('__LiurenCore.init({ duxiang: window.DUXIANG_RULES, shensha: window.SHENSHA_RULES, bifa: window.BIFA });', ctx);

/* ---------------- 3. 深度比对（对象键序无关） ---------------- */
function deepEqual(a, b, pathStr, diffs) {
  if (a === b) {
    return true;
  }
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    diffs.push(pathStr + ': ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b));
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) {
    diffs.push(pathStr + ': 数组/对象形态不一致');
    return false;
  }
  if (Array.isArray(a)) {
    if (a.length !== b.length) {
      diffs.push(pathStr + ': 长度 ' + a.length + ' vs ' + b.length);
      return false;
    }
    let ok = true;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i], pathStr + '[' + i + ']', diffs)) {
        ok = false;
      }
    }
    return ok;
  }
  const ka = Object.keys(a).sort();
  const kb = Object.keys(b).sort();
  if (ka.length !== kb.length || ka.join(',') !== kb.join(',')) {
    diffs.push(pathStr + ': 键集不同 [' + ka.join(',') + '] vs [' + kb.join(',') + ']');
    return false;
  }
  let ok = true;
  for (let i = 0; i < ka.length; i++) {
    if (!deepEqual(a[ka[i]], b[ka[i]], pathStr + '.' + ka[i], diffs)) {
      ok = false;
    }
  }
  return ok;
}

/* ---------------- 4. 样本与比对字段 ---------------- */
const samples = [
  ['2026-01-08', '酉'],
  ['2026-08-15', '酉'],
  ['2024-02-29', '午'],
  ['2030-12-31', '亥'],
  ['1999-06-15', '巳'],
  ['2045-03-03', '辰']
];

const checks = [
  ['r', (c) => c.r],
  ['tp', (c) => c.tp],
  ['kegs', (c) => c.kegs],
  ['dun', (c) => c.dun],
  /* 天将顺逆（jiangMap/shun）为 2026-08-18 规则修正项（天门地户法），
     不在重构回归比对范围；gui/night（昼夜贵人选择）仍比对 */
  ['gui', (c) => c.gui],
  ['night', (c) => c.night],
  ['hourGan', (c) => c.hourGan],
  ['dx.xunkong', (c) => c.dx.xunkong],
  ['dx.dayWangShuai', (c) => c.dx.dayWangShuai],
  ['dx.nodes', (c) => c.dx.nodes],
  ['dx.relations', (c) => c.dx.relations],
  ['dx.yuejiang', (c) => c.dx.yuejiang],
  ['dx.yuejiang.zhu', (c) => c.dx.yuejiang.zhu],
  /* dx.guiren / dx.bifa 依赖天将布列（贵人落宫规则修正后合理变化），
     不在重构回归比对范围；由 _test_jiangpan_all.js 规则测试覆盖 */
  ['dx.shensha.byZhi', (c) => c.dx.shensha.byZhi],
  ['dx.shensha.list', (c) => c.dx.shensha.list]
];

let passCount = 0;
const summary = [];
for (const sample of samples) {
  const d = sample[0];
  const h = sample[1];
  const oldC = vm.runInContext('oldBuildChart("' + d + '", "' + h + '")', ctx);
  const newC = vm.runInContext('__LiurenCore.buildChart({ date: "' + d + '", hourZhi: "' + h + '", calData: window.CAL, yjAll: window.YJ_ALL })', ctx);
  if (!oldC || !newC) {
    console.log('FAIL ' + d + ' ' + h + '时：排盘返回 null');
    continue;
  }
  const diffs = [];
  /* 课体识别层（2026-08-18 增强）：新引擎识别伏吟/返吟/八专/别责等课体
     （旧引擎误判为昴星）；普通课三传必须一致，课体课仅校验 keti 非空与三传完整 */
  const newKeti = newC.sanchuan.keti || '';
  const isKeti = newKeti !== '';
  if (isKeti) {
    if (newKeti !== '伏吟' && newKeti !== '返吟' && newKeti !== '八专' && newKeti !== '别责' &&
        newKeti.indexOf('昴星') < 0) {
      diffs.push('未知课体: ' + newKeti);
    }
    if (!newC.sanchuan.chuans || newC.sanchuan.chuans.length !== 3) {
      diffs.push('课体三传不完整');
    }
  } else {
    const diffsTmp = [];
    if (!deepEqual(oldC.sanchuan.method, newC.sanchuan.method, 'sanchuan.method', diffsTmp)) {
      diffs.push('sanchuan.method 不一致：\n    ' + diffsTmp.slice(0, 4).join('\n    '));
    }
    const diffsTmp2 = [];
    if (!deepEqual(oldC.sanchuan.chuans, newC.sanchuan.chuans, 'sanchuan.chuans', diffsTmp2)) {
      diffs.push('sanchuan.chuans 不一致：\n    ' + diffsTmp2.slice(0, 4).join('\n    '));
    }
  }
  for (const check of checks) {
    const label = check[0];
    const get = check[1];
    const diffsTmp = [];
    const ok = deepEqual(get(oldC), get(newC), label, diffsTmp);
    if (!ok) {
      diffs.push(label + ' 不一致：\n    ' + diffsTmp.slice(0, 8).join('\n    '));
    }
  }
  if (diffs.length === 0) {
    passCount++;
    console.log('PASS ' + d + ' ' + h + '时');
  } else {
    console.log('FAIL ' + d + ' ' + h + '时');
    console.log(diffs.join('\n'));
  }
  summary.push(d + ' ' + h + '时 [' + oldC.sanchuan.method + ']');
}
console.log('');
console.log('样本三传宗门：' + summary.join(' | '));
console.log('');
console.log('回归比对: ' + passCount + '/' + samples.length + (passCount === samples.length ? ' 全过' : ' 未全过'));

/* ---------------- 5. 扩展扫描（补充置信：全年代跨月跨时辰，非验收项） ---------------- */
if (process.env.SWEEP !== '0') {
  try {
    /* 载入其余年代数据，覆盖 1900~2059 */
    const extraDecades = [];
    for (let dec = 190; dec <= 205; dec++) {
      const f = 'cal_' + dec + '0s.js';
      if (!dataFiles.includes(f) && fs.existsSync(path.join(DATA, f))) {
        extraDecades.push(f);
      }
    }
    for (const f of extraDecades) {
      vm.runInContext(fs.readFileSync(path.join(DATA, f), 'utf8'), ctx);
    }
    const sweepChecks = [
      ['gui', (c) => c.gui],
      ['night', (c) => c.night],
      ['dx.dayWangShuai', (c) => c.dx.dayWangShuai],
      ['dx.xunkong', (c) => c.dx.xunkong]
    ];
    const hours = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    let sweepTotal = 0;
    let sweepFail = 0;
    for (let y = 1901; y <= 2059; y++) {
      for (let m = 1; m <= 12; m++) {
        const day = m === 2 ? 15 : 8;
        const d = y + '-' + String(m).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        for (let hi = 0; hi < 3; hi++) {
          const h = hours[(y + m + hi) % 12];
          const oldC = vm.runInContext('oldBuildChart("' + d + '", "' + h + '")', ctx);
          const newC = vm.runInContext('__LiurenCore.buildChart({ date: "' + d + '", hourZhi: "' + h + '", calData: window.CAL, yjAll: window.YJ_ALL })', ctx);
          sweepTotal++;
          if (!oldC || !newC) {
            sweepFail++;
            if (sweepFail <= 5) {
              console.log('  SWEEP FAIL ' + d + ' ' + h + '时：null 盘');
            }
            continue;
          }
          const swKeti = newC.sanchuan.keti || '';
          if (swKeti === '') {
            const diffsTmpM = [];
            if (!deepEqual(oldC.sanchuan.method, newC.sanchuan.method, 'sanchuan.method', diffsTmpM)) {
              sweepFail++;
              if (sweepFail <= 5) {
                console.log('  SWEEP FAIL ' + d + ' ' + h + '时 sanchuan.method：' + diffsTmpM.slice(0, 2).join('; '));
              }
              continue;
            }
          }
          for (const check of sweepChecks) {
            const diffsTmp = [];
            if (!deepEqual(check[1](oldC), check[1](newC), check[0], diffsTmp)) {
              sweepFail++;
              if (sweepFail <= 5) {
                console.log('  SWEEP FAIL ' + d + ' ' + h + '时 ' + check[0] + '：' + diffsTmp.slice(0, 2).join('; '));
              }
              break;
            }
          }
        }
      }
    }
    console.log('扩展扫描（1901~2059 跨月跨时辰）：' + (sweepTotal - sweepFail) + '/' + sweepTotal + ' 一致' +
      (sweepFail === 0 ? '（全过）' : '（有 ' + sweepFail + ' 处不一致！）'));
    if (sweepFail > 0) {
      process.exitCode = 1;
    }
  } catch (e) {
    console.log('扩展扫描跳过：' + e.message);
  }
}

process.exitCode = passCount === samples.length && process.exitCode !== 1 ? 0 : 1;

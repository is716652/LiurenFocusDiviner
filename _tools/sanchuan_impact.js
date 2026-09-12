/* 涉害「复等→见机/察微」口径修正（判所临地盘宫，原判上神自身）的影响面量化
 * ----------------------------------------------------------------------------
 * 旧口径 = git HEAD 版 core/liuren-core.js（工作区未改动前）；新口径 = 当前 core/liuren-core.js
 * 做法：两个引擎各在独立 vm context 里跑全枚举（10 日干 × 12 日支 × 12 月将 × 12 占时 = 17280 盘），
 *       逐盘比「宗门 / 初传 / 中传 / 末传」。
 * 用法：node _tools/sanchuan_impact.js
 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const R = path.join(ROOT, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'resources', 'rawfile', 'rule');
const load = (f) => JSON.parse(fs.readFileSync(path.join(R, f), 'utf-8'));
const RULES = {
  duxiang: {
    '旺衰休囚死': { '旺衰': load('旺衰休囚死.json')['旺衰'] },
    '十二宫气机点': load('十二宫气机点.json'),
    '空亡规则': load('空亡规则.json'),
    '助日规则': load('助日规则.json'),
    '基础关系': load('基础关系.json')
  },
  shensha: { '神煞': load('神煞起法.json')['神煞'] },
  bifa: { '一百法': load('毕法赋一百法.json')['一百法'] }
};

function boot(src, tag) {
  const ctx = vm.createContext({ console: console });
  vm.runInContext(src, ctx, { filename: tag });
  /* liuren-core 是「全局脚本」形态（无 import/export），类声明不挂 globalThis，末尾补一句导出 */
  vm.runInContext('globalThis.LiurenCore = LiurenCore;', ctx, { filename: tag + '#export' });
  if (!ctx.LiurenCore) throw new Error('LiurenCore 未导出：' + tag);
  ctx.LiurenCore.init(JSON.parse(JSON.stringify(RULES)));
  return ctx.LiurenCore;
}
const oldSrc = execSync('git show HEAD:core/liuren-core.js', { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString('utf-8');
const OLD = boot(oldSrc, 'old-liuren-core.js');
const NEW = boot(fs.readFileSync(path.join(ROOT, 'core', 'liuren-core.js'), 'utf-8'), 'new-liuren-core.js');

const GANS = OLD.GAN, ZHI = OLD.ZHI;
let total = 0, diff = 0;
const byKey = new Map();
const samples = [];
for (const dg of GANS) {
  for (const dz of ZHI) {
    for (const mj of ZHI) {
      for (const hour of ZHI) {
        const a = OLD.buildChartAncient(mj, dg, dz, hour, '', '', '');
        const b = NEW.buildChartAncient(mj, dg, dz, hour, '', '', '');
        if (!a || !b) continue;
        total++;
        const key = (c) => c.sanchuan.method + '|' + c.sanchuan.chuans.map((x) => x.z).join('');
        const ka = key(a), kb = key(b);
        if (ka === kb) continue;
        diff++;
        const mk = a.sanchuan.method + '→' + b.sanchuan.method;
        byKey.set(mk, (byKey.get(mk) || 0) + 1);
        if (samples.length < 12) samples.push(`${dg}${dz}日 ${mj}将 ${hour}时   旧 ${a.sanchuan.method} ${a.sanchuan.chuans.map((x) => x.z).join('/')}   →   新 ${b.sanchuan.method} ${b.sanchuan.chuans.map((x) => x.z).join('/')}`);
      }
    }
  }
}
console.log('涉害孟仲口径修正 · 影响面（全枚举，四课/天地盘不受影响）');
console.log('  枚举总盘数      ：' + total);
console.log('  三传发生改变    ：' + diff + '  （' + (100 * diff / total).toFixed(2) + '%）');
console.log('  改变盘的宗门迁移：');
[...byKey.entries()].sort((x, y) => y[1] - x[1]).forEach(([k, n]) => console.log('    ' + k.padEnd(14) + String(n).padStart(6)));
console.log('  样本：');
samples.forEach((s) => console.log('    ' + s));

/* 与回归基线交叉核对：_tests/_data/sanchuan_baseline.json 的 sweep 键 */
const B = path.join(ROOT, '_tests', '_data', 'sanchuan_baseline.json');
if (fs.existsSync(B)) {
  const bl = JSON.parse(fs.readFileSync(B, 'utf-8'));
  const sweep = bl.sweep || {};
  let n = 0, changed = 0;
  for (const k of Object.keys(sweep)) {
    const m = k.match(/^(.)(.)(.)(.)$/);
    if (!m) continue;
    const dg = m[1], dz = m[2], mj = m[3], hour = m[4];
    const a = OLD.buildChartAncient(mj, dg, dz, hour, '', '', '');
    const b = NEW.buildChartAncient(mj, dg, dz, hour, '', '', '');
    if (!a || !b) continue;
    n++;
    const blCh = Array.isArray(sweep[k][2]) ? sweep[k][2].join('') : String(sweep[k][2]);
    if (blCh !== b.sanchuan.chuans.map((x) => x.z).join('')) changed++;
  }
  console.log('  回归基线 sweep 键：' + n + ' 条，其中基线（旧口径）与新引擎三传不同 = ' + changed + ' 条');
}

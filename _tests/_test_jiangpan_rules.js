/* 天将规则对账：文档规范（大六壬文档/json/十二天神与贵人.json）↔ 引擎（core/liuren-core.js）
 * ----------------------------------------------------------------------------
 * 由来：2026-09-10 用户报「己巳日 酉时 子将 第一课应为朱雀、盘中是太阴」，
 * 需要确认引擎是否按既定规范（十二天神与昼贵夜贵说明.md + 同名 json）执行。
 * 本测试把规范与引擎逐项锁死：规范一改、或引擎一改，立刻暴露。
 *
 * 对账项：
 *   1) 昼夜贵人表（十日干 × 昼贵/夜贵）
 *   2) 昼夜分界（昼贵时辰 / 夜贵时辰）
 *   3) 定顺逆（顺行宫位 / 逆行宫位）
 *   4) 十二天将顺序（顺布 / 逆布）
 *   5) 安贵人：贵人支落于其天盘所在之地盘宫（规范原文措辞见文末校勘注）
 *   6) 布将方向：顺布宫递增取将序递增，逆布宫递增取将序递减
 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'core', 'liuren-core.js'), 'utf-8'), { filename: 'liuren-core.js' });

const SPEC_PATH = path.join(ROOT, '大六壬文档', 'json', '十二天神与贵人.json');
const spec = JSON.parse(fs.readFileSync(SPEC_PATH, 'utf-8'));
const Z = LiurenCore.ZHI;
const JIANG = LiurenCore.JIANG_ORDER;

let fail = 0;
const bad = (n, x) => { fail++; console.log('FAIL:', n, x === undefined ? '' : x); };
const ok = (n, x) => { console.log('OK  :', n, x === undefined ? '' : x); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
/* 集合比对：规范两组时辰/宫位的书写起始顺序可能与引擎不同（如夜贵时辰从酉起），只比集合 */
const sameSet = (a, b) => a.length === b.length && a.slice().sort().join('') === b.slice().sort().join('');

/* ---------- 1. 昼夜贵人表 ---------- */
{
  let n = 0;
  for (const gan of Object.keys(spec.昼夜贵人表)) {
    const s = spec.昼夜贵人表[gan];
    const e = LiurenCore.GUIREN[gan];
    if (!e) { bad('引擎缺贵人表行', gan); continue; }
    if (e[0] !== s.昼贵 || e[1] !== s.夜贵) { bad('昼夜贵人表不一致', gan + ' 规范 ' + s.昼贵 + '/' + s.夜贵 + ' 引擎 ' + e[0] + '/' + e[1]); continue; }
    n++;
  }
  if (Object.keys(LiurenCore.GUIREN).length !== Object.keys(spec.昼夜贵人表).length) bad('贵人表行数不一致', Object.keys(LiurenCore.GUIREN).length + ' vs ' + Object.keys(spec.昼夜贵人表).length);
  if (n === Object.keys(spec.昼夜贵人表).length) ok('昼夜贵人表 ' + n + ' 行逐行一致');
}

/* ---------- 2. 昼夜分界 ---------- */
{
  const day = LiurenCore.JIANG_DAY_HOURS;
  const night = Z.filter((z) => day.indexOf(z) < 0);
  if (!same(day, spec.昼夜分界.昼贵时辰)) bad('昼贵时辰不一致', '引擎 ' + day.join('') + ' 规范 ' + spec.昼夜分界.昼贵时辰.join(''));
  else ok('昼贵时辰一致', day.join(''));
  if (!sameSet(night, spec.昼夜分界.夜贵时辰)) bad('夜贵时辰不一致', '引擎 ' + night.join('') + ' 规范 ' + spec.昼夜分界.夜贵时辰.join(''));
  else ok('夜贵时辰一致（补集）', night.join(''));
}

/* ---------- 3. 定顺逆 ---------- */
{
  const shun = LiurenCore.JIANG_SHUN_GONGS;
  const ni = Z.filter((z) => shun.indexOf(z) < 0);
  if (!same(shun, spec.布将规则.定顺逆.顺行宫位)) bad('顺行宫位不一致', '引擎 ' + shun.join('') + ' 规范 ' + spec.布将规则.定顺逆.顺行宫位.join(''));
  else ok('顺行宫位一致', shun.join(''));
  if (!same(ni, spec.布将规则.定顺逆.逆行宫位)) bad('逆行宫位不一致', '引擎 ' + ni.join('') + ' 规范 ' + spec.布将规则.定顺逆.逆行宫位.join(''));
  else ok('逆行宫位一致（补集）', ni.join(''));
}

/* ---------- 4. 十二天将顺序 ---------- */
{
  if (!same(JIANG, spec.十二天将.顺布顺序)) bad('顺布顺序不一致', '引擎 ' + JIANG.join('') + ' 规范 ' + spec.十二天将.顺布顺序.join(''));
  else ok('顺布将序一致', JIANG.join(''));
  const rev = [JIANG[0]].concat(JIANG.slice(1).reverse());
  if (!same(rev, spec.十二天将.逆布顺序)) bad('逆布顺序不一致', '引擎推导 ' + rev.join('') + ' 规范 ' + spec.十二天将.逆布顺序.join(''));
  else ok('逆布将序一致（贵人+将序倒排）', rev.join(''));
}

/* ---------- 5/6. 安贵人与布将方向：全枚举 10 干 × 12 时 ---------- */
{
  let checked = 0, badCase = '';
  for (const dg of Object.keys(spec.昼夜贵人表)) {
    for (const hour of Z) {
      for (const mj of Z) {
        /* 造一个最小 tp：月将加时 */
        const off = Z.indexOf(mj) - Z.indexOf(hour);
        const tp = {};
        for (let i = 0; i < 12; i++) tp[Z[i]] = Z[(i + off + 24) % 12];
        const b = LiurenCore.buildJiang(dg, tp, hour);
        if (!b || !b.jiangMap) { badCase = dg + '/' + hour + ' buildJiang 返回空'; continue; }
        /* 5) 安贵人：贵人宫 = 贵人支在天盘所在之地盘宫 */
        const wantGuiGong = LiurenCore.gongOf(tp, b.gui);
        if (b.guiGong !== wantGuiGong) { badCase = dg + hour + ' 贵人宫 ' + b.guiGong + ' ≠ ' + wantGuiGong; break; }
        /* 5b) 昼夜取贵 */
        const isNight = LiurenCore.JIANG_DAY_HOURS.indexOf(hour) < 0;
        const wantGui = isNight ? spec.昼夜贵人表[dg].夜贵 : spec.昼夜贵人表[dg].昼贵;
        if (b.gui !== wantGui) { badCase = dg + hour + ' 用贵 ' + b.gui + ' ≠ ' + wantGui; break; }
        /* 6) 顺逆：以贵人落宫分野判定 */
        const wantShun = spec.布将规则.定顺逆.顺行宫位.indexOf(b.guiGong) >= 0;
        if (b.shun !== wantShun) { badCase = dg + hour + ' 顺逆 ' + b.shun + ' ≠ ' + wantShun; break; }
        /* 6b) 布将方向与将序 */
        const gi = Z.indexOf(b.guiGong), step = b.shun ? 1 : -1;
        for (let k = 0; k < 12; k++) {
          const g = Z[(gi + step * k + 120) % 12];
          if (b.jiangMap[g] !== JIANG[k]) { badCase = dg + hour + ' 宫' + g + ' 将 ' + b.jiangMap[g] + ' ≠ ' + JIANG[k]; break; }
        }
        if (badCase) break;
        checked++;
      }
      if (badCase) break;
    }
    if (badCase) break;
  }
  if (badCase) bad('安贵人/布将方向与规范不符', badCase);
  else ok('安贵人与布将方向：' + checked + ' 组（10 干 × 12 时 × 12 将）全部符合规范');
}

console.log(fail === 0 ? '\nALL PASS (jiangpan rules vs spec)' : '\nFAILED: ' + fail);
process.exit(fail === 0 ? 0 : 1);

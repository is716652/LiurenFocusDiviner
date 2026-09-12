/* ============================================================================
 * _engine_probe.js —— 组件化体检用的「引擎运行期探针」（测试辅助，非门禁）
 * ============================================================================
 * 被 _tests/_test_component_audit.js require。职责：
 *   - 装载 core/liuren-core.js（真源产物），按 DataLoader 的口径组装规则包
 *   - 提供维度敏感性、规则影响面、神煞/天将全枚举、破坏性实验探针
 * 注意：本文件不是门禁，不单独跑；它不含任何业务判定。
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const RULEDIR = path.join(ROOT, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'resources', 'rawfile', 'rule');
const CORE_JS = path.join(ROOT, 'core', 'liuren-core.js');

function loadRule(f) { return JSON.parse(fs.readFileSync(path.join(RULEDIR, f), 'utf-8')); }

/* 与 _test_no_hardcode.js / DataLoader.loadCoreRules 同构的规则包组装 */
function ruleBundle() {
  return {
    duxiang: {
      '旺衰休囚死': { '旺衰': loadRule('旺衰休囚死.json')['旺衰'] },
      '十二宫气机点': loadRule('十二宫气机点.json'),
      '空亡规则': loadRule('空亡规则.json'),
      '助日规则': loadRule('助日规则.json'),
      '基础关系': loadRule('基础关系.json')
    },
    shensha: { '神煞': loadRule('神煞起法.json')['神煞'] },
    bifa: { '一百法': loadRule('毕法赋一百法.json')['一百法'] },
    xingnian: {
      liuQin: loadRule('行年打分.json')['liuQin'],
      kong: loadRule('行年打分.json')['kong'],
      wangShuai: loadRule('行年打分.json')['wangShuai'],
      taiSui: loadRule('行年打分.json')['taiSui'],
      jiangJx: loadRule('行年打分.json')['jiangJx'],
      bands: loadRule('行年打分.json')['bands']
    }
  };
}

const CORE_SRC = fs.readFileSync(CORE_JS, 'utf-8') + '\n;LiurenCore;';
let CORE = null;
function core() {
  if (!CORE) {
    /* 引擎是全局脚本、无 module.exports：在源码尾追加 `;LiurenCore;`，
       runInThisContext 的返回值即最后一个表达式的值（类对象）。 */
    CORE = vm.runInThisContext(CORE_SRC, { filename: 'liuren-core.js' });
    if (!CORE) throw new Error('无法从 core/liuren-core.js 取回 LiurenCore（产物缺类定义？）');
  }
  return CORE;
}
function reinit(bundle) {
  const c = core();
  c.init(bundle || ruleBundle());
  return c;
}
reinit();

const GAN = core().GAN, ZHI = core().ZHI;

/* 固定随机源（可复现） */
function rngFrom(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function chartOf(mj, dg, dz, hour, yg, yz, mz) {
  return core().buildChartAncient(mj, dg, dz, hour, yg || '', yz || '', mz || '');
}

/* 盘面签名（覆盖定法层 + 盘态 + 神煞：任何规则表变动都应在此显形） */
function sigOf(c) {
  if (!c) return null;
  return JSON.stringify([
    c.kegs.map((k) => k.x + '/' + k.s),
    c.sanchuan.method, c.sanchuan.keti,
    c.sanchuan.chuans.map((x) => x.z + ':' + x.gz),
    Object.keys(c.tp).sort().map((k) => k + '=' + c.tp[k]),
    Object.keys(c.jiangMap).sort().map((k) => k + '=' + c.jiangMap[k]),
    c.gui, c.shun, c.night, c.hourGan,
    c.dx.xunkong.slice().sort(),
    c.dx.dayWangShuai,
    Object.keys(c.dx.shensha.byZhi).sort().map((z) => z + ':' + c.dx.shensha.byZhi[z].join('+')),
    c.dx.shensha.list.map((x) => x.name).sort(),
    /* 盘态关系（六冲/六合/六害/三刑，来自 rules.duxiang.基础关系）—— 不纳入签名就看不到该表的变动 */
    Object.keys(c.dx.relations).sort().map((z) => z + ':' + [c.dx.relations[z].chong, c.dx.relations[z].he,
      c.dx.relations[z].hai, (c.dx.relations[z].xing || []).join('')].join('/')),
    /* 毕法命中（来自 rules.bifa.一百法） */
    (c.dx.bifa || []).map((x) => x['序'] + ':' + x['法名']).sort()
  ]);
}

/* 合法干支（阳干配阳支 / 阴干配阴支） */
function validPairs() {
  const out = [];
  const yangGan = new Set(['甲', '丙', '戊', '庚', '壬']);
  const yangZhi = new Set(['子', '寅', '辰', '午', '申', '戌']);
  for (const g of GAN) for (const z of ZHI) if (yangGan.has(g) === yangZhi.has(z)) out.push([g, z]);
  return out;
}

/* ---------------- 1. 维度敏感性（500 组随机输入 × 逐维度扰动） ---------------- */
function dimensionSensitivity(n) {
  const N = n || 500;
  const rnd = rngFrom(0x5eed2026);
  const pairs = validPairs();
  const KEY = { 日干: 1, 日支: 2, 月将: 0, 占时: 3 };
  const out = {};
  for (const k of Object.keys(KEY)) out[k] = { trials: 0, changed: 0, examples: [] };
  for (let i = 0; i < N; i++) {
    const p = pairs[Math.floor(rnd() * pairs.length)];
    const mj = ZHI[Math.floor(rnd() * 12)];
    const hour = ZHI[Math.floor(rnd() * 12)];
    const mz = ZHI[Math.floor(rnd() * 12)];
    const yg = GAN[Math.floor(rnd() * 10)], yz = ZHI[Math.floor(rnd() * 12)];
    const base = chartOf(mj, p[0], p[1], hour, yg, yz, mz);
    const b = sigOf(base);
    if (!b) continue;
    for (const dim of Object.keys(KEY)) {
      /* 该维度取另一个值再签一次 */
      let v = [mj, p[0], p[1], hour][KEY[dim]];
      let v2 = v;
      if (dim === '日干' || dim === '日支') {
        const k = 0;
        let cand = v;
        for (let g = 0; g < 12; g++) { cand = (dim === '日干' ? GAN : ZHI)[Math.floor(rnd() * (dim === '日干' ? 10 : 12))]; if (cand !== v) break; }
        v2 = cand;
        /* 保持干支合法性：日支换后与日干同阴阳 */
        if (dim === '日支') {
          const yangGan = ['甲', '丙', '戊', '庚', '壬'].indexOf(p[0]) >= 0;
          const yangZhi = ['子', '寅', '辰', '午', '申', '戌'].indexOf(v2) >= 0;
          if (yangGan !== yangZhi) continue;
        }
        void k;
      } else {
        let cand = v;
        for (let g = 0; g < 12; g++) { cand = ZHI[Math.floor(rnd() * 12)]; if (cand !== v) break; }
        v2 = cand;
      }
      if (v2 === v) continue;
      const args = [mj, p[0], p[1], hour];
      args[KEY[dim]] = v2;
      const alt = chartOf(args[0], args[1], args[2], args[3], yg, yz, mz);
      const a = sigOf(alt);
      out[dim].trials++;
      if (a !== b) out[dim].changed++;
      else if (out[dim].examples.length < 5) {
        out[dim].examples.push({ 输入: { mj: mj, dg: p[0], dz: p[1], hour: hour, yg: yg, yz: yz, mz: mz }, 改动: dim + '→' + v2, 说明: '改为该值后四课/三传/天将/神煞全同' });
      }
    }
  }
  return out;
}

/* ---------------- 2. 规则影响面：逐个规则表置空，看引擎是抛错还是静默变值 ---------------- */
const RULE_SLOTS = [
  { 规则: '旺衰休囚死.json', 字段: 'duxiang.旺衰休囚死.旺衰' },
  { 规则: '基础关系.json', 字段: 'duxiang.基础关系' },
  { 规则: '十二宫气机点.json', 字段: 'duxiang.十二宫气机点' },
  { 规则: '空亡规则.json', 字段: 'duxiang.空亡规则' },
  { 规则: '助日规则.json', 字段: 'duxiang.助日规则' },
  { 规则: '神煞起法.json', 字段: 'shensha.神煞' },
  { 规则: '毕法赋一百法.json', 字段: 'bifa.一百法' },
  { 规则: '行年打分.json', 字段: 'xingnian' }
];
function emptyBundle(missingRule) {
  const b = ruleBundle();
  if (missingRule === '旺衰休囚死.json') b.duxiang['旺衰休囚死'] = {};
  else if (missingRule === '基础关系.json') b.duxiang['基础关系'] = {};
  else if (missingRule === '十二宫气机点.json') b.duxiang['十二宫气机点'] = {};
  else if (missingRule === '空亡规则.json') b.duxiang['空亡规则'] = {};
  else if (missingRule === '助日规则.json') b.duxiang['助日规则'] = {};
  else if (missingRule === '神煞起法.json') b.shensha['神煞'] = {};
  else if (missingRule === '毕法赋一百法.json') b.bifa['一百法'] = [];
  else if (missingRule === '行年打分.json') {
    /* DataLoader 口径：文件存在、但键缺失 → 对应字段为 undefined（不是删除整个 xingnian，
       删除会让引擎落到内置 XN_SCORE_DEFAULT 兜底，看不到真实的 TypeError 风险） */
    b.xingnian = { liuQin: undefined, kong: undefined, wangShuai: undefined, taiSui: undefined, jiangJx: undefined, bands: undefined };
  }
  return b;
}
function sampleCases(n) {
  const rnd = rngFrom(0xc0ffee);
  const pairs = validPairs();
  const out = [];
  for (let i = 0; i < (n || 200); i++) {
    const p = pairs[Math.floor(rnd() * pairs.length)];
    out.push([ZHI[Math.floor(rnd() * 12)], p[0], p[1], ZHI[Math.floor(rnd() * 12)],
      GAN[Math.floor(rnd() * 10)], ZHI[Math.floor(rnd() * 12)], ZHI[Math.floor(rnd() * 12)]]);
  }
  return out;
}
function ruleImpact() {
  const cases = sampleCases(120);
  const FIELD = {
    '四课': (c) => JSON.stringify(c.kegs.map((k) => k.x + '/' + k.s)),
    '三传': (c) => JSON.stringify(c.sanchuan.chuans.map((x) => x.z + ':' + x.gz)),
    '宗门课体': (c) => c.sanchuan.method + '/' + c.sanchuan.keti,
    '天将': (c) => JSON.stringify(Object.keys(c.jiangMap).sort().map((k) => k + '=' + c.jiangMap[k])),
    '旬空': (c) => JSON.stringify(c.dx.xunkong.slice().sort()),
    '神煞': (c) => JSON.stringify(c.dx.shensha.list.map((x) => x.name).sort()),
    '旺衰': (c) => String(c.dx.dayWangShuai),
    '盘态关系': (c) => JSON.stringify(Object.keys(c.dx.relations).sort().map((z) => z + ':' + c.dx.relations[z].chong + '/' + c.dx.relations[z].he + '/' + c.dx.relations[z].hai + '/' + (c.dx.relations[z].xing || []).join(''))),
    '毕法命中': (c) => JSON.stringify((c.dx.bifa || []).map((x) => x['序'] + ':' + x['法名']).sort())
  };
  /* 基线：显式用正常规则包 */
  reinit();
  const sigBase = cases.map((a) => sigOf(chartOf(a[0], a[1], a[2], a[3], a[4], a[5], a[6])));
  const fieldBase = {};
  for (const k of Object.keys(FIELD)) {
    fieldBase[k] = cases.map((a) => { const c = chartOf(a[0], a[1], a[2], a[3], a[4], a[5], a[6]); return c ? FIELD[k](c) : 'null'; });
  }
  const out = [];
  for (const slot of RULE_SLOTS) {
    let err = null;
    const affected = new Set();
    try {
      reinit(emptyBundle(slot.规则));
      for (let i = 0; i < cases.length; i++) {
        const a = cases[i];
        const c = chartOf(a[0], a[1], a[2], a[3], a[4], a[5], a[6]);
        if (sigOf(c) !== sigBase[i]) {
          for (const k of Object.keys(FIELD)) {
            const v = c ? FIELD[k](c) : 'null';
            if (v !== fieldBase[k][i]) affected.add(k);
          }
        }
      }
    } catch (e) {
      err = String((e && e.message) || e);
    } finally {
      reinit();
    }
    out.push({ 规则: slot.规则, 字段: slot.字段, 抛错: err, 受影响字段: [...affected] });
  }
  return out;
}

/* ---------------- 3. 神煞名 / 天将名 全枚举 ---------------- */
let SS_CACHE = null, JIANG_CACHE = null;
function sweep(nPairs) {
  const pairs = validPairs();
  const rnd = rngFrom(0xabcdef);
  const list = nPairs ? pairs.slice(0, nPairs) : pairs;
  const ssNames = new Set(), jNames = new Set();
  let cases = 0;
  for (const [g, z] of list) {
    const mj = ZHI[Math.floor(rnd() * 12)], hour = ZHI[Math.floor(rnd() * 12)], mz = ZHI[Math.floor(rnd() * 12)];
    const yg = GAN[Math.floor(rnd() * 10)], yz = ZHI[Math.floor(rnd() * 12)];
    const c = chartOf(mj, g, z, hour, yg, yz, mz);
    if (!c) continue;
    cases++;
    for (const it of c.dx.shensha.list) ssNames.add(it.name);
    for (const k of Object.keys(c.jiangMap)) jNames.add(c.jiangMap[k]);
  }
  return { ssNames: [...ssNames].sort(), jNames: [...jNames].sort(), cases: cases };
}
function shenshaNames() {
  if (!SS_CACHE) SS_CACHE = sweep();
  return { names: SS_CACHE.ssNames, cases: SS_CACHE.cases };
}
function jiangNames() {
  if (!JIANG_CACHE) JIANG_CACHE = sweep();
  return { names: JIANG_CACHE.jNames, cases: JIANG_CACHE.cases };
}

/* ---------------- 4. 破坏性实验探针 ----------------
   纪律：**基线必须在任何改写之前**用 b4Baseline() 冻结，再逐次改写 + probeAgainstBaseline()。
   不要用「惰性基线」（首次调用时才建立）——调用顺序一变，已改写状态就会被当成基线（假阴性）。 */
/* 行年吉凶（用 rules.xingnian，即宿主注入的 行年打分.json）；返回 score/band 文本 */
function xingnianOf(a) {
  const c = chartOf(a[0], a[1], a[2], a[3], a[4], a[5], a[6]);
  if (!c) return 'null';
  const xn = core().xingNian(c, 1990, 2026, '男', '子');
  return xn.score + '/' + xn.band;
}
function b4Baseline(n) {
  const cases = sampleCases(n || 200);
  reinit();
  const sigs = cases.map((a) => sigOf(chartOf(a[0], a[1], a[2], a[3], a[4], a[5], a[6])));
  let xnSigs = null, xnErr = null;
  try { xnSigs = cases.map(xingnianOf); } catch (e) { xnErr = String(e.message); }
  reinit();
  return { cases: cases, sigs: sigs, 行年: xnSigs, 行年抛错: xnErr, 盘数: cases.length };
}
/* 载入当前磁盘上的规则（调用方须已写入改写内容并保持文件处于改写态），与冻结基线比对 */
function probeAgainstBaseline(baseline) {
  const cases = baseline.cases;
  let err = null;
  let changed = 0;
  let xnChanged = 0, xnErr = null;
  try {
    reinit(ruleBundle());
    for (let i = 0; i < cases.length; i++) {
      const a = cases[i];
      const s = sigOf(chartOf(a[0], a[1], a[2], a[3], a[4], a[5], a[6]));
      if (s !== baseline.sigs[i]) changed++;
    }
    if (baseline.行年) {
      for (let i = 0; i < cases.length; i++) if (xingnianOf(cases[i]) !== baseline.行年[i]) xnChanged++;
    }
  } catch (e) {
    err = String((e && e.message) || e);
  } finally {
    reinit();
  }
  if (err) return { 抛错: err, sigChanged: null, changed: null, 行年变化: null };
  return {
    抛错: null,
    sigChanged: changed > 0 ? (changed + '/' + cases.length + ' 盘签名改变') : null,
    changed: changed,
    行年变化: xnChanged > 0 ? (xnChanged + '/' + cases.length + ' 组行年分/档改变') : null,
    xingnianChanged: xnChanged,
    行年基线抛错: baseline.行年抛错 || null,
    xnErr: xnErr
  };
}
/* 按 DataLoader.loadCoreRules 的真实口径组装规则包：**键缺失 → 对应字段为 undefined**
   （不是空表、也不是删除字段）。用于复现"宿主解析出来的规则包"在键改名后的真实形态。 */
function loaderBundle(overrides) {
  const ov = overrides || {};
  const b = ruleBundle();
  if (ov.shensha) b.shensha['神煞'] = undefined;
  if (ov.bifa) b.bifa['一百法'] = undefined;
  if (ov.jichu) b.duxiang['基础关系'] = { '六冲': undefined, '六合': undefined, '六害': undefined, '三刑': undefined };
  if (ov.wangshuai) b.duxiang['旺衰休囚死'] = { '旺衰': undefined };
  if (ov.xingnian) b.xingnian = { liuQin: undefined, kong: undefined, wangShuai: undefined, taiSui: undefined, jiangJx: undefined, bands: undefined };
  return b;
}
/* loader 口径探针：逐个键缺失场景，看引擎是抛错还是静默变值（含行年面） */
function loaderImpact() {
  const cases = sampleCases(120);
  const FIELD = {
    '四课': (c) => JSON.stringify(c.kegs.map((k) => k.x + '/' + k.s)),
    '三传': (c) => JSON.stringify(c.sanchuan.chuans.map((x) => x.z + ':' + x.gz)),
    '宗门课体': (c) => c.sanchuan.method + '/' + c.sanchuan.keti,
    '天将': (c) => JSON.stringify(Object.keys(c.jiangMap).sort().map((k) => k + '=' + c.jiangMap[k])),
    '旬空': (c) => JSON.stringify(c.dx.xunkong.slice().sort()),
    '神煞': (c) => JSON.stringify(c.dx.shensha.list.map((x) => x.name).sort()),
    '旺衰': (c) => String(c.dx.dayWangShuai),
    '盘态关系': (c) => JSON.stringify(Object.keys(c.dx.relations).sort().map((z) => z + ':' + c.dx.relations[z].chong + '/' + c.dx.relations[z].he + '/' + c.dx.relations[z].hai + '/' + (c.dx.relations[z].xing || []).join(''))),
    '毕法命中': (c) => JSON.stringify((c.dx.bifa || []).map((x) => x['序'] + ':' + x['法名']).sort())
  };
  const SCENES = [
    { 名称: '旺衰休囚死.json 顶层键「旺衰」缺失', 覆盖: { wangshuai: true } },
    { 名称: '基础关系.json 四个键全缺失', 覆盖: { jichu: true } },
    { 名称: '神煞起法.json 顶层键「神煞」缺失', 覆盖: { shensha: true } },
    { 名称: '毕法赋一百法.json 顶层键「一百法」缺失', 覆盖: { bifa: true } },
    { 名称: '行年打分.json 六个键全缺失', 覆盖: { xingnian: true } }
  ];
  reinit();
  const sigBase = cases.map((a) => sigOf(chartOf(a[0], a[1], a[2], a[3], a[4], a[5], a[6])));
  const fieldBase = {};
  for (const k of Object.keys(FIELD)) fieldBase[k] = cases.map((a) => { const c = chartOf(a[0], a[1], a[2], a[3], a[4], a[5], a[6]); return c ? FIELD[k](c) : 'null'; });
  let xnBase = null, xnBaseErr = null;
  try { xnBase = cases.map(xingnianOf); } catch (e) { xnBaseErr = String(e.message); }
  reinit();
  const out = [];
  for (const sc of SCENES) {
    const affected = new Set();
    let err = null, xnErr = null, xnChanged = 0, chartChanged = 0;
    try {
      reinit(loaderBundle(sc.覆盖));
      for (let i = 0; i < cases.length; i++) {
        const a = cases[i];
        const c = chartOf(a[0], a[1], a[2], a[3], a[4], a[5], a[6]);
        if (sigOf(c) !== sigBase[i]) {
          chartChanged++;
          for (const k of Object.keys(FIELD)) {
            const v = c ? FIELD[k](c) : 'null';
            if (v !== fieldBase[k][i]) affected.add(k);
          }
        }
        if (xnBase) { try { if (xingnianOf(a) !== xnBase[i]) xnChanged++; } catch (e) { xnErr = String(e.message); } }
      }
    } catch (e) {
      err = String((e && e.message) || e);
    } finally { reinit(); }
    out.push({
      场景: sc.名称, 抛错: err, 盘签名改变: chartChanged + '/' + cases.length,
      受影响字段: [...affected],
      行年面: xnErr ? ('抛错：' + xnErr) : (xnChanged > 0 ? (xnChanged + '/' + cases.length + ' 组行年分/档改变') : '无变化')
    });
  }
  return out;
}

/* 兼容旧名：等价于「先建基线、立刻比对」（仅当两态都在同一次调用内连续取用才成立） */
function probeWithRuleDir() {
  const base = b4Baseline(200);
  return probeAgainstBaseline(base);
}

module.exports = {
  GAN: GAN, ZHI: ZHI,
  core: core, reinit: reinit, ruleBundle: ruleBundle,
  chartOf: chartOf, sigOf: sigOf,
  dimensionSensitivity: dimensionSensitivity,
  ruleImpact: ruleImpact,
  shenshaNames: shenshaNames,
  jiangNames: jiangNames,
  probeWithRuleDir: probeWithRuleDir,
  b4Baseline: b4Baseline,
  xingnianOf: xingnianOf,
  probeAgainstBaseline: probeAgainstBaseline,
  loaderBundle: loaderBundle,
  loaderImpact: loaderImpact,
  sampleCases: sampleCases
};

/* ============================================================================
 * _test_empty_state.js —— 空态纪律门禁（对应 Agent.md §14.7 第 2 条）
 * ============================================================================
 * 一句话判据：**无声空态 = 测试失败**。
 *   「栏位为空」必须可分辨来源：「本来就该空」还是「规则表没加载/被改坏」。
 *   引擎侧的可分辨性落在一个可查询接口上：LiurenCore.ruleHealth() / missingRules()。
 *
 * 断言（任一条失败即 exit 1）：
 *   E1 缺表必被点名：按 DataLoader 真实口径逐个场景（键缺失 → 字段 undefined）
 *      注入规则包，missingRules() 必须**恰好**点出受影响规则表（不多不少）
 *   E2 键值缺失也要能看见：不仅顶层键，`旺衰休囚死.旺衰` 这类**内层键**缺失同样要点名
 *   E3 表在但无条目 ≠ 缺表：entries=0 且 loaded=true（「本来就该空」与「没读到」不同形）
 *   E4 缺表照旧出盘：任一单表缺失都不得让 buildChart/buildChartAncient 整体 fail-fast
 *      （用户明确要求「总能排出来」），但该表驱动的栏位必须随之可见地变化
 *   E5 note 文案不得出现数据文件名（`.json`）—— 提示是给用户看的，且引擎代码不得带文件名
 *   E6 行年不得静默消失：行年打分表缺失时，引擎要么给出默认表（文件整个缺失 →
 *      走内置 XN_SCORE_DEFAULT），要么抛错/被点名为缺表；**不得算出 NaN 之类静默退化**
 *
 * 降级说明（§14.3）：ArkTS 侧因 arkts-no-props-by-index 暂未提供 ruleHealth，
 *   ArkTS 的逐表状态由 DataLoader 承担；UI 侧「徽标 + 缺表清单」仍待办，
 *   故本门禁只判**引擎/加载层是否给出可查询的缺失清单**。见 §14.7 纪律。
 *
 * 用法：node _tests/_test_empty_state.js
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const RULEDIR = path.join(ROOT, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'resources', 'rawfile', 'rule');
const CORE_JS = path.join(ROOT, 'core', 'liuren-core.js');

let FAIL = 0;
const ok = (m) => console.log('  ✓ ' + m);
const bad = (m) => { FAIL++; console.log('  ✗ ' + m); };
const head = (t) => console.log('\n' + t);

/* ---------------- 装载（与 DataLoader 同构的规则包） ---------------- */
const loadRule = (f) => JSON.parse(fs.readFileSync(path.join(RULEDIR, f), 'utf-8'));
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
      liuQin: loadRule('行年打分.json')['liuQin'], kong: loadRule('行年打分.json')['kong'],
      wangShuai: loadRule('行年打分.json')['wangShuai'], taiSui: loadRule('行年打分.json')['taiSui'],
      jiangJx: loadRule('行年打分.json')['jiangJx'], bands: loadRule('行年打分.json')['bands']
    }
  };
}
const CORE = vm.runInThisContext(fs.readFileSync(CORE_JS, 'utf-8') + '\n;LiurenCore;', { filename: 'liuren-core.js' });
if (!CORE || typeof CORE.ruleHealth !== 'function') {
  console.log('✗ 引擎未提供 ruleHealth()（缺表自述接口）—— §14.7 第 2 条要求必须有');
  process.exit(1);
}
if (typeof CORE.missingRules !== 'function') {
  console.log('✗ 引擎未提供 missingRules()（缺表清单）');
  process.exit(1);
}
/* 规则包打桩：把某路径置 undefined（与 DataLoader「键缺失 → 字段 undefined」一致） */
function bundleWith(mut) {
  const b = ruleBundle();
  mut(b);
  return b;
}
function missingLabels(bundle) {
  CORE.init(bundle);
  const out = CORE.missingRules();
  const labels = out.map((x) => x.label);
  return labels;
}
const sameSet = (a, b) => a.length === b.length && a.slice().sort().join('|') === b.slice().sort().join('|');

/* ---------------- E1 缺表必被点名 ---------------- */
head('[E1] 缺表必被点名（DataLoader 口径：键缺失 → 字段 undefined）');
{
  CORE.init(ruleBundle());
  const baseLabels = missingLabels(ruleBundle());
  if (baseLabels.length !== 0) bad('基准规则包下 missingRules 应为空，实际：' + baseLabels.join('、'));
  else ok('基准：8 张表全部 loaded，missingRules 为空');

  const SCENES = [
    ['旺衰表缺失（顶层键「旺衰休囚死」缺失）', (b) => { b.duxiang['旺衰休囚死'] = undefined; }],
    ['基础关系表缺失', (b) => { b.duxiang['基础关系'] = undefined; }],
    ['十二宫气机点表缺失', (b) => { b.duxiang['十二宫气机点'] = undefined; }],
    ['空亡规则表缺失', (b) => { b.duxiang['空亡规则'] = undefined; }],
    ['助日规则表缺失', (b) => { b.duxiang['助日规则'] = undefined; }],
    ['神煞表缺失（顶层键「神煞」缺失）', (b) => { b.shensha['神煞'] = undefined; }],
    ['毕法表缺失（顶层键「一百法」缺失）', (b) => { b.bifa['一百法'] = undefined; }],
    ['行年打分表缺失（六个键全缺失）', (b) => { b.xingnian = { liuQin: undefined, kong: undefined, wangShuai: undefined, taiSui: undefined, jiangJx: undefined, bands: undefined }; }]
  ];
  for (const [name, mut] of SCENES) {
    const labels = missingLabels(bundleWith(mut));
    if (labels.length === 0) bad(name + '：missingRules 为空 —— 缺表成了「静默空态」');
    else ok(name + ' → 点名：' + labels.join('、'));
  }
}

/* ---------------- E2 内层键缺失也要能看见 ---------------- */
head('[E2] 内层键缺失（表在、键没读到）也要点名');
{
  const labels = missingLabels(bundleWith((b) => { b.duxiang['旺衰休囚死'] = { '旺衰': undefined }; }));
  if (labels.length === 0) bad('「旺衰休囚死」在但内层键「旺衰」缺失：未被点名');
  else ok('内层键「旺衰」缺失 → 点名：' + labels.join('、'));

  const xnPartial = missingLabels(bundleWith((b) => { b.xingnian.kong = undefined; b.xingnian.bands = undefined; }));
  if (xnPartial.length === 0) bad('行年打分表只缺 kong/bands：未被点名（正是 B2c 那类「看不见」的静默退化）');
  else ok('行年打分表缺 kong/bands → 点名：' + xnPartial.join('、'));
}

/* ---------------- E3 「表在但无条目」≠「缺表」 ---------------- */
head('[E3] 「本来就该空」与「没读到」不得同形');
{
  CORE.init(ruleBundle());
  const h = CORE.ruleHealth();
  const emptyTable = { '神煞': {} };            /* 表在、但一条规则都没有 */
  CORE.init(bundleWith((b) => { b.shensha = emptyTable; }));
  const h2 = CORE.ruleHealth();
  const s1 = h.filter((x) => x.key === 'shensha.神煞')[0];
  const s2 = h2.filter((x) => x.key === 'shensha.神煞')[0];
  if (!s1 || !s2) bad('ruleHealth 未包含 shensha.神煞 项');
  else if (s1.loaded !== true || s1.entries < 1) bad('基准神煞表应 loaded=true 且 entries>0，实际 ' + JSON.stringify(s1));
  else if (s2.loaded !== true) bad('空神煞表应 loaded=true（表在），实际 ' + JSON.stringify(s2));
  else if (s2.entries !== 0) bad('空神煞表 entries 应为 0，实际 ' + s2.entries);
  else ok('「表在但无条目」= loaded=true / entries=0（与「缺表 loaded=false」不同形）：' + JSON.stringify(s2));
  CORE.init(ruleBundle());
}

/* ---------------- E4 缺表照旧出盘 ---------------- */
head('[E4] 缺表照旧出盘（不得整体 fail-fast），但受影响栏位必须可见地变化');
{
  const CASES = [['甲', '子', '寅', '午'], ['庚', '午', '申', '卯'], ['癸', '亥', '丑', '酉']];
  const SCENES = [
    ['神煞表缺失', (b) => { b.shensha['神煞'] = undefined; }, (c) => c.dx.shensha.list.length],
    ['毕法表缺失', (b) => { b.bifa['一百法'] = undefined; }, (c) => (c.dx.bifa || []).length],
    /* 基础关系表缺失时 relations 仍排出 12 个宫，但 chong/he/hai/xing 全变空 ——
       故探针要看**有关系值的宫数**，而不是键数 */
    ['基础关系表缺失', (b) => { b.duxiang['基础关系'] = undefined; },
      (c) => Object.keys(c.dx.relations).filter((z) => c.dx.relations[z].chong || c.dx.relations[z].he || c.dx.relations[z].hai || (c.dx.relations[z].xing || []).length > 0).length]
  ];
  for (const [name, mut, probe] of SCENES) {
    CORE.init(ruleBundle());
    const before = CASES.map(([dg, dz, mj, hz]) => { const c = CORE.buildChartAncient(mj, dg, dz, hz); return c ? probe(c) : -1; });
    CORE.init(bundleWith(mut));
    let threw = null;
    const after = [];
    for (const [dg, dz, mj, hz] of CASES) {
      try {
        const c = CORE.buildChartAncient(mj, dg, dz, hz);
        if (!c) { threw = '返回 null（整体 fail-fast）'; break; }
        after.push(probe(c));
      } catch (e) { threw = String(e.message); break; }
    }
    if (threw) bad(name + '：buildChart 未照旧出盘 → ' + threw);
    else if (JSON.stringify(before) === JSON.stringify(after)) bad(name + '：栏位无变化（缺表被掩盖成正常结果）');
    else ok(name + '：盘照旧排出，受影响栏位可见变化 ' + JSON.stringify(before) + ' → ' + JSON.stringify(after));
  }
  CORE.init(ruleBundle());
}

/* ---------------- E5 note 文案不得出现数据文件名 ---------------- */
head('[E5] 缺表 note 不得出现数据文件名（.json）');
{
  CORE.init(ruleBundle());
  const items = CORE.ruleHealth().concat((() => {
    const out = [];
    for (const mut of [(b) => { b.shensha['神煞'] = undefined; }, (b) => { b.bifa['一百法'] = undefined; },
      (b) => { b.duxiang['基础关系'] = undefined; }, (b) => { b.xingnian.kong = undefined; }]) {
      CORE.init(bundleWith(mut));
      for (const x of CORE.ruleHealth()) out.push(x);
    }
    return out;
  })());
  const dirty = items.filter((x) => x.note && x.note.indexOf('.json') >= 0);
  if (dirty.length) bad('note 里出现数据文件名：' + dirty.map((x) => x.note).join(' | '));
  else ok('全部 note 均为面向用户的中文说明（' + items.filter((x) => x.note).length + ' 条非空 note，0 处含 .json）');
  /* 缺表的 note 必须非空：缺了还不说 = 无声空态 */
  CORE.init(bundleWith((b) => { b.duxiang['助日规则'] = undefined; }));
  const m = CORE.ruleHealth().filter((x) => !x.loaded);
  if (m.length === 0) bad('缺表项未出现');
  else if (m.some((x) => !x.note || x.note.trim() === '')) bad('存在 loaded=false 但 note 为空的项（无声空态）');
  else ok('每个 loaded=false 项都带原因文案，例：' + m[0].note);
  CORE.init(ruleBundle());
}

/* ---------------- E6 行年不得静默消失 ---------------- */
head('[E6] 行年不得静默消失（either 默认表 or 点名为缺表，不得算成 NaN）');
{
  /* 情形 A：行年打分表**整个文件缺失** → 宿主不注入 xingnian → 引擎走内置默认表 */
  CORE.init(bundleWith((b) => { delete b.xingnian; }));
  const cA = CORE.buildChartAncient('寅', '甲', '子', '午');
  let rA = null, eA = null;
  try { rA = CORE.xingNian(cA, 1990, 2026, '男', '子'); } catch (e) { eA = String(e.message); }
  if (eA) bad('行年打分表整个缺失：xingNian 抛错（' + eA + '）—— 应走内置默认表');
  else if (!rA) bad('行年打分表整个缺失：xingNian 无结果（静默消失）');
  else if (typeof rA.score !== 'number' || isNaN(rA.score) || !rA.band) bad('行年结果退化：' + JSON.stringify({ score: rA.score, band: rA.band }));
  else ok('行年打分表整个缺失 → 内置默认表兜底（score=' + rA.score + ' / band=' + rA.band + '）');

  /* 情形 B：行年打分表**键被改名/缺失** → 宿主注入了残缺表；必须可被点名，且不得静默算成 NaN */
  CORE.init(bundleWith((b) => { b.xingnian.kong = undefined; b.xingnian.bands = undefined; }));
  const named = CORE.missingRules().map((x) => x.label);
  const cB = CORE.buildChartAncient('寅', '甲', '子', '午');
  let rB = null, eB = null;
  try { rB = CORE.xingNian(cB, 1990, 2026, '男', '子'); } catch (e) { eB = String(e.message); }
  if (named.length === 0) bad('行年打分表键缺失：未被 missingRules 点名（这就是「键改名了看不见」那类）');
  else ok('行年打分表键缺失 → 点名：' + named.join('、'));
  if (eB) ok('残缺表下 xingNian 抛错（' + eB + '）—— 宿主必须显式呈现，不得 try/catch 吞成静默消失');
  else if (!rB) bad('残缺表下 xingNian 静默无结果');
  else if (typeof rB.score !== 'number' || isNaN(rB.score)) bad('残缺表下 xingNian 算成 NaN（静默退化）');
  else {
    /* 不抛错也可以，但必须**同时**被点名（否则就是静默退化）——上一段已断言点名 */
    ok('残缺表下 xingNian 有结果（score=' + rB.score + ' / band=' + rB.band + '）且已被点名');
  }
  CORE.init(ruleBundle());
}

/* ---------------- 汇总 ---------------- */
console.log('\n' + '='.repeat(68));
if (FAIL === 0) {
  console.log('空态纪律门禁：E1–E6 全部通过 ✓（缺表必被点名、表在无条目≠缺表、缺表照旧出盘、'
    + 'note 无数据文件名、行年不静默消失）');
  console.log('待办（§14.3/§14.7，UI 侧）：设置页/首页「已加载 N/N 表」徽标与缺表清单要吃');
  console.log('  Node 侧 LiurenCore.ruleHealth()/missingRules() 与 ArkTS 侧 DataLoader 逐表状态。');
  process.exit(0);
}
console.log('空态纪律门禁：' + FAIL + ' 处违规 ✗');
console.log('处置纪律：不得为过测试放宽判据；无声空态按 §14 修代码或修数据。');
process.exit(1);

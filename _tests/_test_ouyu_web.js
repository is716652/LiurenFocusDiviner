/* 偶遇实盘（encounter）网页原型反验（无头运行 UI/壬案推演原型.html 的内联脚本）
 *
 * 反验什么（对应 大六壬文档/案例剧情/偶遇之占-体例与首个实盘.md 的纪律）：
 *   1) 数据契约：date/hour 合法，锚点字段与案例侧同构（kind/ref/pos）；
 *   2) 盘面现场复算：buildChart(date,hour) 出得来，且课体与样张一致（元首，不是伏吟）；
 *   3) 每条取象链都**真的能点出来**（否则玩家点遍全盘也取不齐，与案例侧同一条纪律）；
 *   4) 层级标注：L1/L2/L3 齐备；L3 必须写明「推断」；
 *   5) 「不取项」（refuse）必须随小结一并呈现——这是本类最容易被跳过、也最要紧的一节；
 *   6) 与案例模式互斥：切进案例后偶占状态复位，反之亦然。
 *
 * 为什么必须无头反验：锚点写错在界面上表现为"这一条永远点不亮"，
 * 肉眼看不出来（会以为是自己没点对），只有遍历才能发现。
 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ui = path.join(ROOT, 'UI');
const html = fs.readFileSync(path.join(ui, '壬案推演原型.html'), 'utf-8');

const blocks = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
if (blocks.length !== 1) { console.log('FAIL: 内联脚本块数量异常', blocks.length); process.exit(1); }
const inline = blocks[0];

let fail = 0;
const bad = (n, e) => { fail++; console.log('FAIL:', n, e === undefined ? '' : e); };
const ok = (n, e) => { console.log('OK  :', n, e === undefined ? '' : e); };

/* ---- 最小 DOM 桩件（与 _test_case_story_web.js 同构） ---- */
function makeEl(id) {
  return {
    id: id, innerHTML: '', textContent: '', className: '', value: '', disabled: false,
    dataset: {}, style: {}, onclick: null,
    querySelectorAll: () => [], querySelector: () => makeEl(id + '>*'),
    prepend: () => {}, appendChild: () => {}, addEventListener: () => {}
  };
}
const els = {};
const documentStub = {
  getElementById: (id) => (els[id] || (els[id] = makeEl(id))),
  createElement: (tag) => makeEl(tag),
  querySelectorAll: () => []
};
const sandbox = {
  window: {}, document: documentStub,
  console: { log: () => {}, warn: () => {}, error: () => {} },
  Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number,
  RegExp: RegExp, Date: Date, isNaN: isNaN, parseInt: parseInt, parseFloat: parseFloat, Set: Set
};
sandbox.window.document = documentStub;
vm.createContext(sandbox);

/* ---- 按 HTML 的加载顺序注入数据（含偶占与历法） ---- */
const calFiles = fs.readdirSync(path.join(ui, '_data')).filter((x) => /^cal_\d{4}s\.js$/.test(x)).sort();
const files = ['_data/duxiang_rules.js', '_data/duxiang_leixiang.js', '_data/shensha_rules.js',
  '_data/bifa.js', '_data/bifa_coach.js', '_data/xingnian_score.js']
  .concat(calFiles.map((f) => '_data/' + f))
  .concat(['_data/yj_all.js', '../core/liuren-core.js', '_data/ancient_case_gallery.js',
    '_data/case_story.js', '_data/ouyu_cases.js']);
for (const f of files) {
  const p = path.join(ui, f);
  if (!fs.existsSync(p)) { bad('原型依赖文件缺失', f); process.exit(1); }
  vm.runInContext(fs.readFileSync(p, 'utf-8'), sandbox, { filename: f });
}
vm.runInContext(inline, sandbox, { filename: '壬案推演原型.html#inline' });
ok('原型脚本无头加载（语法与初始化通过）');
if (!sandbox.window.CAL || !Object.keys(sandbox.window.CAL).length) bad('历法数据未加载（CAL 为空）');
if (!(sandbox.window.YJ_ALL || []).length) bad('月将数据未加载（YJ_ALL 为空）');

/* ---- 数据契约 ---- */
const source = JSON.parse(fs.readFileSync(path.join(ui, '_data', 'ouyu_cases.json'), 'utf-8')).cases;
const cases = sandbox.window.OUYU_CASES || [];
if (!cases.length) { bad('OUYU_CASES 为空'); process.exit(1); }
if (cases.length !== source.length) bad('生成物与真源案数不一致', cases.length + ' vs ' + source.length);

const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const KIND_OK = ['method', 'chuan', 'keg', 'jiang', 'shensha', 'xunkong', 'zhi', 'gong', 'hour', 'dayWangShuai'];
for (const c of cases) {
  if (ZHI.indexOf(c.hour) < 0) bad('占时非十二支', c.id + ' ' + c.hour);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.date || '')) bad('日期格式不对', c.id + ' ' + c.date);
  if (c.kind !== 'encounter') bad('kind 应为 encounter', c.id + ' ' + c.kind);
  if (!c.why || !c.note) bad('缺触机或口径', c.id);
  if (!c.boundary || !c.boundary.length) bad('缺边界声明', c.id);
  if (!c.ending || c.ending.type !== 'encounter') bad('小结类型应为 encounter（非古籍原断）', c.id);
  if (!c.refuse || !c.refuse.length) bad('缺「看见但决定不取」一节', c.id);
  const levels = new Set();
  c.lanes.forEach((L) => {
    if (!L.ask) bad('lanes 缺 ask', c.id + '/' + L.id);
    L.chain.forEach((k) => {
      levels.add(k.level);
      if (['L1', 'L2', 'L3'].indexOf(k.level) < 0) bad('层级不合法', k.id + ' ' + k.level);
      if (!k.onSite) bad('缺现场细节', k.id);
      if (!k.cite) bad('缺古籍出处', k.id);
      if (!k.premise) bad('缺前提判定', k.id);   /* 本类纪律：前提不成立就不能用，必须写明 */
      if (!k.anchors || !k.anchors.length) bad('缺锚点', k.id);
      (k.anchors || []).forEach((a) => {
        if (KIND_OK.indexOf(a.kind) < 0) bad('锚点 kind 不在案例侧口径内', k.id + ' ' + a.kind);
        const head = String(a.ref || '').split('/')[0];
        if (a.kind !== 'method' && ZHI.indexOf(head) < 0) bad('锚点 ref 首段非十二支', k.id + ' ' + a.kind + ':' + a.ref);
      });
      if (k.level === 'L3' && String(k.hint || '').indexOf('推断') < 0) bad('L3 未写明「推断」', k.id);
    });
  });
  /* 三层分级的目的是"不许混写"：L1 事实层与 L2 取象层必须各有落点；
     L3 是本人推断，只在确有推断时出现（不强制每案都有，但出现就必须写明「推断」）。 */
  if (!levels.has('L1')) bad('缺 L1 事实层（每案要有可复算的事实落点）', c.id);
  if (!levels.has('L2')) bad('缺 L2 古籍取象层', c.id);
}
if (fail === 0) ok('数据契约（' + cases.length + ' 案）');

ok('锚点 kind 均在案例侧口径内（无需扩展数据契约）');

/* ---- 逐案演练：起盘 → 穷举可点位 → 必须集齐 ---- */
for (const c of cases) {
  console.log('\n=== 偶遇实盘 ' + c.id + ' ===');
  sandbox.oyuOpen(c.id);
  let st = sandbox.oyuState();
  if (!st.started || !st.hasChart) { bad('实盘未能起盘复算', c.id); continue; }
  ok('起盘（引擎现场复算）', c.date + ' ' + c.hour + '时 · 课体=' + st.method + ' · 旬空=' + (st.xunkong.join('') || '无'));

  /* 样张明确记载：此课课体为元首，天地盘不重合（**不是**伏吟）。
     这条断言是"防止有人把盘认错"的守卫：盘一变，这里立刻红。 */
  if (st.method !== '元首') bad('课体与样张不符（样张=元首）', c.id + ' -> ' + st.method);

  const links = sandbox.oyuWhereList();
  if (!links.length) { bad('无可点取的取象链', c.id); continue; }
  links.forEach((L) => {
    if (!L.spots.length || L.spots.some((s) => !s)) bad('取象链缺可点位置', L.id);
  });
  const surfaces = sandbox.oyuSurfaces();
  if (!surfaces.length) { bad('无可点位', c.id); continue; }
  if (surfaces.some((s) => !s.cands || !s.cands.length)) bad('存在空候选可点位', c.id);

  /* 穷举点遍所有可点位（模拟玩家把盘和卡片全点一遍），直到集齐 */
  let rounds = 0;
  const total = links.length;
  const foundNow = () => sandbox.oyuState().found.length;
  while (foundNow() < total && rounds < 6) {
    const before = foundNow();
    for (const s of surfaces) sandbox.tryOuyuPick(s.cands, s.label);
    rounds++;
    if (foundNow() === before) break;
  }
  if (foundNow() !== total) {
    const stNow = sandbox.oyuState();
    const missing = links.filter((L) => stNow.found.indexOf(L.id) < 0).map((L) => L.id + '[' + L.spots.join('|') + ']');
    bad('取象链无法通过点位集齐', c.id + ' -> 缺 ' + missing.join(', '));
  } else {
    ok('取象链全部可点出', total + ' 条 / ' + surfaces.length + ' 点位');
  }

  st = sandbox.oyuState();
  if (!st.done) bad('集齐后 done 未置位', c.id);
  if (st.traced !== total) bad('留痕条数与取象链数不符', st.traced + ' vs ' + total);
  if (!st.tracedCells.length) bad('盘上无留痕格', c.id);

  const box = sandbox.document.getElementById('ouyuBox').innerHTML || '';
  if (box.indexOf(sandbox.esc(c.ending.text)) < 0) bad('集齐后未显示取象小结', c.id);
  if (box.indexOf('不构成') < 0) bad('小结缺合规口径', c.id);
  for (const r of c.refuse) {
    if (box.indexOf(sandbox.esc(r.title)) < 0) bad('「不取项」未呈现', c.id + ':' + r.title.slice(0, 24));
    if (box.indexOf(sandbox.esc(r.why)) < 0) bad('「不取项」缺理由', c.id + ':' + r.title.slice(0, 24));
  }
  /* 本类不揭古断：不得出现 any 古籍原断式措辞 */
  if (box.indexOf('古籍原断') < 0) bad('小结未声明「非古籍原断」', c.id);

  /* 重开：只清取象与留痕，盘面与触机记录保留 */
  sandbox.oyuReset();
  st = sandbox.oyuState();
  if (st.found.length !== 0 || st.traced !== 0) bad('重开未清空取象与留痕', c.id);
  if (!st.hasChart || !st.started) bad('重开丢了盘面', c.id);
  const box2 = sandbox.document.getElementById('ouyuBox').innerHTML || '';
  if (box2.indexOf(sandbox.esc(c.why)) < 0) bad('重开后触机记录丢失', c.id);
  ok('重开：清取象留痕、保留盘面与触机记录');
}

/* ---- 与案例模式互斥 ---- */
console.log('\n=== 与古籍案例模式互斥 ===');
const firstOyu = cases[0];
sandbox.oyuOpen(firstOyu.id);
const anyCase = (sandbox.window.ANCIENT_CASES || [])[0];
if (!anyCase) bad('案例库为空，无法验证互斥');
else {
  sandbox.selectCase(anyCase.id);
  let ost = sandbox.oyuState();
  if (ost.id !== '' || ost.found.length) bad('切进案例后偶占状态未复位', JSON.stringify(ost));
  sandbox.oyuOpen(firstOyu.id);
  const cst = sandbox.protoState();
  if (cst.caseId !== '' || cst.found.length) bad('切进偶占后案例状态未复位', JSON.stringify(cst));
  /* 偶占态下点盘不应误触案例线索 */
  sandbox.oyuReset();
  const before = sandbox.oyuState().found.length;
  sandbox.tryOuyuPick([{ kind: 'chuan', ref: '卯', pos: '初传' }], '测试');
  if (sandbox.oyuState().found.length !== before + 1) bad('偶占态点盘未按取象链记账');
  if (sandbox.protoState().found.length) bad('偶占态点盘误触了案例线索');
  if (fail === 0) ok('两模式互斥且各自记账');
}

console.log(fail === 0 ? '\nALL PASS (偶遇实盘 web)' : '\nFAILED: ' + fail);
process.exit(fail === 0 ? 0 : 1);

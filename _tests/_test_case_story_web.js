/* 「一局多占」网页原型端到端反验（无头运行 UI/壬案推演原型.html 的内联脚本）
 * 目的（不是重启服务器，也不是截图）：
 *   1) 原型脚本能在真实数据下跑通（语法 + 数据契约）；
 *   2) 每条线索都至少有一个可点位能点出来（否则玩家点遍全盘也集不齐线索）；
 *   3) 支线结算不泄露古籍原断，原占结算必揭原文；
 *   4) 切换占问方向会重置取证状态，且不改变盘面。
 * DOM 用最小桩件替代；原型把「可点位」先登记进 SURFACES（数据先行），
 * 因此无头环境也能遍历全部候选锚点。
 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ui = path.join(__dirname, '..', 'UI');
const html = fs.readFileSync(path.join(ui, '壬案推演原型.html'), 'utf-8');

/* 取出内联脚本（无 src 的最后一个 script 块） */
const blocks = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
if (blocks.length !== 1) { console.log('FAIL: 内联脚本块数量异常', blocks.length); process.exit(1); }
const inline = blocks[0];

let fail = 0;
const bad = (name, extra) => { fail++; console.log('FAIL:', name, extra === undefined ? '' : extra); };
const ok = (name, extra) => { console.log('OK  :', name, extra === undefined ? '' : extra); };

/* ---- 最小 DOM 桩件 ---- */
function makeEl(id) {
  const el = {
    id: id, innerHTML: '', textContent: '', className: '', value: '', disabled: false,
    dataset: {}, style: {}, onclick: null,
    querySelectorAll: () => [], querySelector: () => makeEl(id + '>*'), prepend: () => {}, appendChild: () => {}, addEventListener: () => {}
  };
  return el;
}
const els = {};
const documentStub = {
  getElementById: (id) => (els[id] || (els[id] = makeEl(id))),
  createElement: (tag) => makeEl(tag),
  querySelectorAll: () => []
};

const sandbox = { window: {}, document: documentStub, console: { log: () => {}, warn: () => {}, error: () => {} }, Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, RegExp: RegExp, Date: Date, isNaN: isNaN, parseInt: parseInt, parseFloat: parseFloat };
sandbox.window.document = documentStub;
vm.createContext(sandbox);

/* ---- 按 HTML 的加载顺序注入数据 ---- */
const files = ['_data/duxiang_rules.js', '_data/duxiang_leixiang.js', '_data/shensha_rules.js', '_data/bifa.js', '_data/bifa_coach.js', '_data/xingnian_score.js', '../core/liuren-core.js', '_data/ancient_case_gallery.js', '_data/case_story.js'];
for (const f of files) {
  const p = path.join(ui, f);
  if (!fs.existsSync(p)) { bad('原型依赖文件缺失', f); process.exit(1); }
  vm.runInContext(fs.readFileSync(p, 'utf-8'), sandbox, { filename: f });
}
vm.runInContext(inline, sandbox, { filename: '壬案推演原型.html#inline' });
ok('原型脚本无头加载（语法与初始化通过）');

const stories = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'resources', 'rawfile', 'ancient', 'case_story.json'), 'utf-8')).stories;
const cases = sandbox.window.ANCIENT_CASES || [];
const caseById = {};
for (const c of cases) caseById[c.id] = c;

/* 逐案逐支线演练 */
for (const caseId of Object.keys(stories)) {
  const item = caseById[caseId];
  if (!item) { bad('原型案例库缺该案', caseId); continue; }
  console.log('\n=== ' + caseId + ' ===');
  sandbox.selectCase(caseId);
  sandbox.document.getElementById('startBtn').onclick();
  let st = sandbox.protoState();
  if (!st.started || !st.hasChart) { bad('起盘状态未建立', caseId + ' ' + JSON.stringify(st)); continue; }
  ok('起盘');

  const asks = stories[caseId].asks || [];
  for (let i = 0; i < asks.length; i++) {
    const a = asks[i];
    sandbox.pickAsk(i);
    st = sandbox.protoState();
    if (st.askIdx !== i) { bad('pickAsk 未切换支线', a.id); continue; }
    if (st.found.length) { bad('切换支线未清空取证', a.id); }
    if (!st.started || !st.hasChart) { bad('切换支线丢了盘面', a.id); }
    const surfaces = sandbox.protoSurfaces() || [];
    if (!surfaces.length) { bad('无可点位', a.id); continue; }
    if (surfaces.some((s) => !s.cands || !s.cands.length)) { bad('存在空候选可点位', a.id); }

    /* 点遍所有点位直到集齐（每个点位只点一次，模拟玩家穷举） */
    let rounds = 0;
    while (sandbox.clueFoundCount() < a.clues.length && rounds < 6) {
      const before = sandbox.clueFoundCount();
      for (const s of surfaces) sandbox.tryDiscover(s.cands, s.label);
      rounds++;
      if (sandbox.clueFoundCount() === before) break;
    }
    const total = sandbox.clueFoundCount();
    if (total !== a.clues.length) {
      const foundNow = sandbox.protoState().found;
      const missing = a.clues.filter((c) => foundNow.indexOf(c.id) < 0).map((c) => c.id + '[' + c.anchors.map((an) => an.kind + ':' + (an.ref || '') + (an.pos ? '@' + an.pos : '')).join('|') + ']');
      bad('线索无法通过点位集齐', a.id + ' -> 缺 ' + missing.join(', '));
    } else {
      ok('线索全部可点出', a.id + ' (' + a.clues.length + ' 条 / ' + surfaces.length + ' 点位)');
    }

    /* 立断语 → 结算 */
    const failBefore = fail;
    sandbox.document.getElementById('userVerdict').value = (a.goodWords || []).join(' ');
    sandbox.submitVerdict();
    const reveal = sandbox.document.getElementById('revealBox').innerHTML || '';
    if (!reveal) { bad('结算未渲染', a.id); continue; }
    const orig = item.original || '';
    if (a.role === 'derived') {
      if (reveal.indexOf(sandbox.esc(a.ending.text)) < 0) { bad('支线结算缺取象清单', a.id); }
      if (reveal.indexOf(sandbox.esc(a.ending.note)) < 0) { bad('支线结算缺口径', a.id); }
      for (let k = 0; k + 20 <= orig.length; k += 20) {
        if (reveal.indexOf(orig.substr(k, 20)) >= 0) { bad('支线结算泄露古籍原文', a.id + ':' + orig.substr(k, 20)); break; }
      }
      if (reveal.indexOf('复盘') >= 0) { bad('支线结算泄露原案复盘', a.id); }
      if (reveal.indexOf('不揭古籍原断') < 0) { bad('支线结算未提示可切回原占', a.id); }
      if (fail === failBefore) ok('支线结算不泄露原断且带口径', a.id);
    } else {
      if (reveal.indexOf(sandbox.esc(orig)) < 0) { bad('原占结算未揭原文', a.id); }
      if (a.ending && a.ending.text && reveal.indexOf(sandbox.esc(a.ending.text)) >= 0) { bad('原占结算混入支线文案', a.id); }
      if (fail === failBefore) ok('原占结算揭古断与应验', a.id);
    }
    /* 结算后切到另一条支线应复位（单支线案件无从切换，跳过） */
    if (asks.length > 1) {
      const other = i === 0 ? asks.length - 1 : 0;
      sandbox.pickAsk(other);
      const st2 = sandbox.protoState();
      if (st2.submitted || sandbox.clueFoundCount() !== 0 || st2.askIdx !== other) { bad('结算后切换支线未复位', a.id + ' -> ' + other); }
    }
  }
}

/* 无剧情案例（45 案里的大多数）不能被改版弄崩：应仍可起盘、读证据链 */
const plain = cases.find((c) => !(sandbox.window.CASE_STORY || {})[c.id] && c.reasoning && c.reasoning.length);
if (!plain) { bad('找不到无剧情案例用于回归'); } else {
  console.log('\n=== 无剧情案例 ' + plain.id + ' ===');
  const failBefore = fail;
  sandbox.selectCase(plain.id);
  sandbox.document.getElementById('startBtn').onclick();
  const st = sandbox.protoState();
  if (!st.started || !st.hasChart) { bad('无剧情案例起盘失败', plain.id); }
  if (sandbox.protoSurfaces().length < 10) { bad('无剧情案例点位缺失', String(sandbox.protoSurfaces().length)); }
  if (sandbox.clueFoundCount() !== 0) { bad('无剧情案例不该有线索', plain.id); }
  const rb = sandbox.document.getElementById('reasonBox').innerHTML || '';
  if (rb.indexOf('reason') < 0 || rb.indexOf(sandbox.esc(plain.reasoning[0].claim)) < 0) { bad('无剧情案例未渲染证据链', plain.id); }
  if (fail === failBefore) ok('无剧情案例仍可起盘读证据链', plain.id + ' / ' + sandbox.protoSurfaces().length + ' 点位');
}

console.log(fail === 0 ? '\nALL PASS (web prototype)' : '\nFAILED: ' + fail);
process.exit(fail === 0 ? 0 : 1);

/* ============================================================================
 * _test_ui_empty_state.js —— 空态纪律门禁（Agent.md §14.2 / §14.3 / §14.7）
 * ----------------------------------------------------------------------------
 * 与 core 侧 `_test_empty_state.js` 分工：那只查「引擎在缺表时是否静默改变盘面」，
 * 本门禁查**UI 侧有没有把「空」说清楚**（§14.7 第 2 条：无声空态 = 测试失败）。
 *
 * 断言（全部静态解析，不跑 ArkTS 运行时）：
 *   E1 每个「规则驱动栏位」都在 model/ReasonText.ets 登记，且该有的空态种类齐备
 *      （确实无 / 规则表未加载 / 未填未开 三种不得混用：缺表用 missing，本就无值用 none）；
 *   E2 UI 用到的栏位 id 与登记表**双向一致**（登记了却没人用 = 死登记；用了却没登记 = 会留白）；
 *   E3 文案纪律：不得出现数据文件名（`.json` / `rawfile`）、不得给现实结论（合规口径）；
 *      缺表文案必须出现「未加载」字样（用户一眼能区分「确实无」）；
 *   E4 毕法空态文案必须写清可判定口径（100 法 / 18 法可自动判定）；
 *   E5 行年只允许经由带三态的 computeXingNian 调用（不得再出现直接赋值 + 静默吞错）；
 *   E6 DataLoader 逐表登记的 key 必须在 RuleHealth 登记表里存在，且登记表张数 = 实际规则表张数；
 *   E7 旧的静默空态写法不得复活（如裸 `Text('本课无毕法格局命中')`）。
 *
 * 用法：node _tests/_test_ui_empty_state.js
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ETS = 'APP/LiurenFocusDiviner/entry/src/main/ets';
const FREE_ETS = 'APP/LiurenFocusDivinerFree/entry/src/main/ets';
const RAWFILE_RULE = path.join(ROOT, ETS, '..', 'resources', 'rawfile', 'rule');

let FAIL = 0;
const ok = (m) => console.log('  ✓ ' + m);
const bad = (m) => { FAIL++; console.log('  ✗ ' + m); };
const head = (t) => console.log('\n' + t);

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf-8');

/* ---------------- 读取登记表 ---------------- */
const reasonSrc = read(ETS + '/model/ReasonText.ets');
const healthSrc = read(ETS + '/model/RuleHealth.ets');
const indexSrc = read(ETS + '/pages/Index.ets');
const loaderSrc = read(ETS + '/model/DataLoader.ets');
const homeSrc = read(ETS + '/pages/Home.ets');

/* 解析 ROWS：slot / kind / entry / text */
const ROWS = [];
const reRow = /slot:\s*SlotId\.([A-Z]+)\s*,\s*kind:\s*EmptyKind\.([A-Z]+)[\s\S]*?entry:\s*'([^']*)'\s*,\s*text:\s*'([^']*)'/g;
let m;
while ((m = reRow.exec(reasonSrc)) !== null) {
  ROWS.push({ slot: m[1].toLowerCase(), kind: m[2].toLowerCase(), entry: m[3], text: m[4] });
}
const slotOf = (rows) => {
  const out = [];
  rows.forEach((r) => { if (out.indexOf(r.slot) < 0) out.push(r.slot); });
  return out;
};

/* 期望：每个栏位该有哪些空态种类（§14.2 表） */
const REQUIRED = [
  ['bifa', ['none', 'missing']],
  ['shensha', ['none', 'missing']],
  ['zhonghuang', ['unset', 'missing']],
  ['nianming', ['unset']],
  ['xingnian', ['unset', 'missing']],
  ['yongshen', ['none']],
];

/* ---------------- E1 / E4 / E3 文案 ---------------- */
head('[E1] 规则驱动栏位都有原因文案（三种空不得混用）');
for (const [slot, kinds] of REQUIRED) {
  for (const k of kinds) {
    const hit = ROWS.filter((r) => r.slot === slot && r.kind === k);
    if (hit.length !== 1) {
      bad(slot + ' / ' + k + ' 文案缺失或重复（命中 ' + hit.length + ' 条）');
    } else {
      ok(slot + ' / ' + k + ' → ' + hit[0].text.slice(0, 34) + '…');
    }
  }
}

head('[E3] 文案纪律：不含数据文件名、不给现实结论，缺表文案必须说「未加载」');
const BANNED_FILE = /\.json|rawfile|\.ets|\.ts\b/;
const BANNED_CONCLUSION = /(治病|医疗建议|投资项目|买股票|离婚|一定会|必然发财|寿命|生死|官司输赢|仕途升迁)/;
for (const r of ROWS) {
  if (BANNED_FILE.test(r.text)) {
    bad(r.slot + '/' + r.kind + ' 文案出现数据文件名：' + r.text);
  }
  if (BANNED_CONCLUSION.test(r.text)) {
    bad(r.slot + '/' + r.kind + ' 文案出现现实结论：' + r.text);
  }
  if (r.kind === 'missing' && r.text.indexOf('未加载') < 0) {
    bad(r.slot + '/missing 缺表文案未出现「未加载」：' + r.text);
  }
}
if (FAIL === 0) {
  ok('全部 ' + ROWS.length + ' 条文案：无文件名、无现实结论、缺表文案含「未加载」');
}

head('[E4] 毕法空态写清可判定口径');
const bifaNone = ROWS.filter((r) => r.slot === 'bifa' && r.kind === 'none')[0];
if (!bifaNone) {
  bad('毕法 none 文案缺失');
} else {
  if (bifaNone.text.indexOf('100') < 0 || bifaNone.text.indexOf('18') < 0) {
    bad('毕法 none 文案未写清「100 法 / 18 法可自动判定」：' + bifaNone.text);
  } else {
    ok('毕法 none 文案含 100 法 / 18 法口径');
  }
}

/* ---------------- E2 双向一致 ---------------- */
head('[E2] 登记表与 UI 实际使用双向一致');
const used = [];
const reUse = /SlotId\.([A-Z]+)/g;
let u;
while ((u = reUse.exec(indexSrc)) !== null) {
  const s = u[1].toLowerCase();
  if (used.indexOf(s) < 0) used.push(s);
}
const registered = slotOf(ROWS);
for (const s of registered) {
  if (used.indexOf(s) < 0) bad('栏位「' + s + '」已登记但 UI 未使用（死登记）');
}
for (const s of used) {
  if (registered.indexOf(s) < 0) bad('UI 使用了未登记的栏位「' + s + '」（会留白）');
}
if (FAIL === 0) ok('登记 ' + registered.length + ' 个栏位，UI 使用 ' + used.length + ' 个，一一对应');

/* ---------------- E5 行年三态 ---------------- */
head('[E5] 行年只允许经 computeXingNian（不得静默吞错）');
const direct = (indexSrc.match(/LiurenCore\.xingNian\(/g) || []).length;
if (direct !== 1) {
  bad('Index.ets 里 LiurenCore.xingNian( 出现 ' + direct + ' 次（应为 1：只在 computeXingNian 内）');
} else {
  ok('Index.ets 仅 1 处 xingNian 调用（在 computeXingNian 内）');
}
if (indexSrc.indexOf('private computeXingNian(') < 0) {
  bad('computeXingNian 未定义');
} else {
  ok('computeXingNian 已定义');
}
if (indexSrc.indexOf('this.xingnianKind') < 0 || indexSrc.indexOf('SlotId.XINGNIAN') < 0) {
  bad('行年状态位或行年空态未接线');
} else {
  ok('行年状态位 + 空态已接线（不会静默消失）');
}

/* ---------------- E6 DataLoader 登记 key ---------------- */
head('[E6] DataLoader 逐表登记的 key 与登记表一致');
const keys = [];
const reKey = /'([a-z]+)'/g;
const keysBlock = (healthSrc.match(/const TABLE_KEYS: string\[\] = \[([\s\S]*?)\];/) || [])[1] || '';
let kk;
while ((kk = reKey.exec(keysBlock)) !== null) keys.push(kk[1]);
const ruleFiles = fs.readdirSync(RAWFILE_RULE).filter((f) => /\.json$/.test(f));
if (keys.length !== ruleFiles.length) {
  bad('登记表 ' + keys.length + ' 张 ≠ rawfile/rule 实际 ' + ruleFiles.length + ' 张');
} else {
  ok('登记表张数与实际规则表一致（' + keys.length + ' 张）');
}
const reported = [];
/* 登记调用可能是 RuleHealth.xxx('key' …)，也可能是 DataLoader 的薄封装
   （readRule(ctx, 'key', path) / parseRule(txt, 'key') / report('key', …)）。
   早期版本只匹配 RuleHealth.*，把 14 张表全判成「从未登记」—— 那是门禁自己的正则漏了。 */
const reRep = /(?:RuleHealth\.(?:fail|report|okWithMissingKeys|ok)\(\s*'([a-z]+)'|DataLoader\.(?:readRule|parseRule|report)\((?:[^()]*?)'([a-z]+)')/g;
let rr;
while ((rr = reRep.exec(loaderSrc)) !== null) {
  const key = rr[1] !== undefined ? rr[1] : rr[2];
  if (reported.indexOf(key) < 0) reported.push(key);
}
for (const r of reported) {
  if (keys.indexOf(r) < 0) bad('DataLoader 登记了未在表中定义的 key「' + r + '」（拼写错？）');
}
const unregistered = keys.filter((k) => reported.indexOf(k) < 0);
if (unregistered.length > 0) {
  bad('登记表里有 ' + unregistered.length + ' 张从未被 DataLoader 登记：' + unregistered.join('、'));
} else {
  ok('DataLoader 逐表登记覆盖全部 ' + keys.length + ' 张表');
}

/* ---------------- E7 旧静默写法不得复活 ---------------- */
head('[E7] 无声空态旧写法不得复活');
const silent = [
  ["Text('本课无毕法格局命中')", '毕法空态（应改用 SlotEmpty 带原因）'],
  ["catch (e) {\n      /* 行年打分表缺失：引擎用内置默认表 */", '行年静默吞错'],
];
for (const [needle, what] of silent) {
  if (indexSrc.indexOf(needle) >= 0 || loaderSrc.indexOf(needle) >= 0) {
    bad('发现旧的静默写法：' + what);
  }
}
if (FAIL === 0) ok('未发现旧的静默空态写法');

/* ---------------- 免费版镜像同源 ---------------- */
head('[E8] 免费版镜像与主版同源（空态文案/组件也要同步）');
const PAIRS = [
  'model/ReasonText.ets', 'model/RuleHealth.ets', 'components/SlotEmpty.ets',
  'components/RuleHealthBadge.ets', 'components/RuleHealthPanel.ets',
];
for (const rel of PAIRS) {
  const p = path.join(ROOT, FREE_ETS, rel);
  if (!fs.existsSync(p)) {
    bad('免费版缺文件：' + rel);
    continue;
  }
  const a = read(ETS + '/' + rel).replace(/\r\n/g, '\n');
  const b = fs.readFileSync(p, 'utf-8').replace(/\r\n/g, '\n');
  if (a !== b) {
    bad('主版与免费版不同源：' + rel);
  }
}
if (FAIL === 0) ok('空态/自检相关文件两版同源');

/* ---------------- 结论 ---------------- */
console.log('');
if (FAIL > 0) {
  console.log('空态纪律门禁：不通过 ✗（' + FAIL + ' 项）');
  process.exit(1);
}
console.log('空态纪律门禁：通过 ✓（每个规则驱动栏位都有原因文案；缺表/确实无/未填三态可分）');

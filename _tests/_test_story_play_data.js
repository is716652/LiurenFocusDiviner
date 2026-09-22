/* 剧情演绎 · App 接入层契约测试
 *
 * 反验什么（区别于 _test_case_story.js / _test_ouyu_web.js —— 那两个验的是**数据与原型**，
 * 本测试验的是**App 端接得上接不上**）：
 *   1) 四个 rawfile 到位且 JSON 合法：case_gallery / case_story / ouyu_cases / story_featured；
 *   2) **代码-数据一致**：story_featured.json 的上架白名单里每个案 id 都能在
 *      case_gallery（取 input）与 case_story（取剧情）里找到 —— 否则页面开出来是空白；
 *      并前置自查：StoryPlay.ets 非注释代码里**不得**出现个案 id（门禁 A1 硬项）；
 *   3) **锚点 kind 受支持**：App 侧只认 10 种 kind，数据里出现别的 kind 会静默点不亮；
 *   4) **字段名与 App 类型定义一致**：多余字段会被 JSON.parse 后静默丢弃（ArkTS 无运行时校验）；
 *   5) **盘面可复算**：白名单案的 input 必须能 buildChartAncient 出盘（App 靠它画盘）；
 *   6) **免费版剔除名单**含这四个文件（否则 HAP 即 zip，收费内容随免费包公开）。
 *
 * 为什么必须测：以上任何一条坏了，界面上表现为"空白页 / 某条永远点不亮 / 免费包泄内容"，
 * 都不报错，只能靠契约测试兜。
 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RAW = path.join(ROOT, 'APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/ancient');
const ETS = path.join(ROOT, 'APP/LiurenFocusDiviner/entry/src/main/ets');

let fail = 0;
const bad = (n, e) => { fail++; console.log('FAIL:', n, e === undefined ? '' : e); };
const ok = (n, e) => { console.log('OK  :', n, e === undefined ? '' : e); };
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf-8'));

/* ---- App 侧支持的锚点 kind（与 StoryPlay.anchorZhi / 数据 discipline 对齐）---- */
const ANCHOR_KINDS = ['chuan', 'dayWangShuai', 'gong', 'hour', 'jiang', 'keg',
  'method', 'shensha', 'xunkong', 'zhi'];
const ZHI = '子丑寅卯辰巳午未申酉戌亥';

/* ---- 1. 四个文件到位且合法 ---- */
const gallery = readJson(path.join(RAW, 'case_gallery.json'));
const story = readJson(path.join(RAW, 'case_story.json'));
const ouyu = readJson(path.join(RAW, 'ouyu_cases.json'));
const feat = readJson(path.join(RAW, 'story_featured.json'));
if (Array.isArray(gallery) && gallery.length > 0) ok('case_gallery.json 合法', gallery.length + ' 案');
else bad('case_gallery.json 不合法或为空');
if (story.stories && Object.keys(story.stories).length > 0) ok('case_story.json 合法', Object.keys(story.stories).length + ' 案剧情');
else bad('case_story.json 缺 stories 表');
if (Array.isArray(ouyu.cases) && ouyu.cases.length > 0) ok('ouyu_cases.json 合法', ouyu.cases.length + ' 实盘');
else bad('ouyu_cases.json 缺 cases');

/* ---- 2. 代码-数据一致：白名单 ---- */
const src = fs.readFileSync(path.join(ETS, 'components/StoryPlay.ets'), 'utf-8');
const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
let hardId = 0;
for (const re of [/duanan_/, /renzhan_/, /zhonghuang_c/, /xun_cibin/]) {
  if (re.test(codeOnly)) { hardId += 1; bad('StoryPlay.ets 非注释代码里出现个案 id（门禁 A1 硬项）', String(re)); }
}
if (hardId === 0) ok('组件层无写死个案 id（A1 前置自查）');
{
  const ids = feat.stories ? feat.stories : [];
  ok('上架白名单（story_featured.json）', ids.join(', ') || '(空)');
  if (ids.length === 0) bad('白名单为空 —— 剧情演绎页只会显示偶遇实盘');
  for (const id of ids) {
    const g = gallery.find((c) => c.id === id);
    if (!g) bad('白名单案在 case_gallery 里不存在（取不到 input，盘面画不出）', id);
    else if (!g.input || !g.input.mj || !g.input.dg || !g.input.dz || !g.input.hour) bad('该案 input 不全', id);
    else ok('白名单案 input 齐备', id + ' ' + g.input.dg + g.input.dz + '日 ' + g.input.mj + '将' + g.input.hour + '时');
    if (!story.stories[id]) bad('白名单案在 case_story 里没有剧情', id);
  }
}

/* ---- 3/4. 剧情结构 + 锚点 kind + 字段名 ---- */
const ASK_KEYS = ['id', 'role', 'topic', 'title', 'badge', 'intro', 'question', 'clues', 'goodWords', 'endings', 'ending'];
const CLUE_KEYS = ['id', 'label', 'small', 'anchors', 'hint'];
const ENDING_KEYS = ['type', 'title', 'tip', 'text', 'note'];
const extra = (obj, allowed) => Object.keys(obj).filter((k) => allowed.indexOf(k) < 0);
let clueTotal = 0; let anchorTotal = 0; let kindUnknown = 0; let extraFields = [];
for (const id of Object.keys(story.stories)) {
  const sc = story.stories[id];
  for (const k of extra(sc, ['brief', 'note', 'asks'])) extraFields.push('story.' + id + '.' + k);
  for (const a of (sc.asks || [])) {
    for (const k of extra(a, ASK_KEYS)) extraFields.push('ask.' + id + '.' + a.id + '.' + k);
    if (!a.title) bad('支线缺 title', id + '/' + a.id);
    if (!a.clues || a.clues.length === 0) bad('支线无线索', id + '/' + a.id);
    for (const cl of (a.clues || [])) {
      clueTotal += 1;
      for (const k of extra(cl, CLUE_KEYS)) extraFields.push('clue.' + id + '.' + cl.id + '.' + k);
      if (!cl.label) bad('线索缺 label', id + '/' + cl.id);
      if (!cl.anchors || cl.anchors.length === 0) bad('线索无锚点（点不亮）', id + '/' + cl.id);
      for (const an of (cl.anchors || [])) {
        anchorTotal += 1;
        if (ANCHOR_KINDS.indexOf(an.kind) < 0) { kindUnknown += 1; bad('App 不支持的锚点 kind', cl.id + ' → ' + an.kind); }
      }
    }
    if (a.ending) for (const k of extra(a.ending, ENDING_KEYS)) extraFields.push('ending.' + id + '.' + a.id + '.' + k);
  }
}
ok('剧情线索/锚点规模', clueTotal + ' 线索 / ' + anchorTotal + ' 锚点；未知 kind ' + kindUnknown + ' 个');
if (extraFields.length > 0) bad('数据里有 App 类型未定义的字段（会被静默丢弃）', extraFields.slice(0, 6).join(', '));
else ok('剧情字段名与 App 类型定义一致');

/* ---- 5. 偶遇结构 + 字段名 ---- */
const OYU_KEYS = ['id', 'when', 'date', 'hour', 'place', 'title', 'kind', 'why', 'scene', 'note',
  'boundary', 'sceneTypes', 'lanes', 'ending', 'refuse', 'verify'];
const LANE_KEYS = ['id', 'title', 'forTypes', 'ask', 'chain'];
const STEP_KEYS = ['id', 'onSite', 'level', 'anchors', 'cite', 'premise', 'hint'];
let laneN = 0; let stepN = 0; const oyuExtra = [];
const levelSeen = new Set();
for (const c of ouyu.cases) {
  for (const k of extra(c, OYU_KEYS)) oyuExtra.push('case.' + c.id + '.' + k);
  if (!c.date || !c.hour) bad('偶遇案缺 date/hour（盘面复算不了）', c.id);
  if (!ZHI.includes(c.hour)) bad('偶遇案 hour 不是地支', c.id + ' → ' + c.hour);
  if (!c.sceneTypes || c.sceneTypes.length === 0) bad('偶遇案缺 sceneTypes', c.id);
  if (!c.ending || !c.ending.text) bad('偶遇案缺 ending.text（取象小结）', c.id);
  if (!c.refuse || c.refuse.length === 0) bad('偶遇案缺 refuse（不得引用的条）', c.id);
  for (const l of (c.lanes || [])) {
    laneN += 1;
    for (const k of extra(l, LANE_KEYS)) oyuExtra.push('lane.' + l.id + '.' + k);
    if (!l.title) bad('通道缺 title', l.id);
    if (!l.chain || l.chain.length === 0) bad('通道无取象链', l.id);
    for (const s of (l.chain || [])) {
      stepN += 1;
      for (const k of extra(s, STEP_KEYS)) oyuExtra.push('step.' + l.id + '.' + s.id + '.' + k);
      if (s.level) levelSeen.add(s.level);
      if (!s.hint) bad('取象链一步缺 hint（点开是空）', l.id + '/' + s.id);
      for (const an of (s.anchors || [])) {
        if (ANCHOR_KINDS.indexOf(an.kind) < 0) bad('App 不支持的锚点 kind', l.id + '/' + s.id + ' → ' + an.kind);
      }
    }
  }
}
ok('偶遇取象链规模', laneN + ' 通道 / ' + stepN + ' 步；层级 ' + [...levelSeen].sort().join('/'));
if (oyuExtra.length > 0) bad('偶遇数据里有 App 类型未定义的字段', oyuExtra.slice(0, 6).join(', '));
else ok('偶遇字段名与 App 类型定义一致');

/* ---- 6. 盘面可复算 ---- */
const UI = path.join(ROOT, 'UI', '_data');
const sandbox = { window: {}, console: { log: () => {}, warn: () => {}, error: () => {} } };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
const loadData = (f) => {
  const p = path.join(UI, f);
  if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf-8'), sandbox, { filename: f });
};
for (const f of ['duxiang_rules.js', 'duxiang_leixiang.js', 'shensha_rules.js', 'bifa.js',
  'bifa_coach.js', 'xingnian_score.js', 'guanlu_leishen.js', 'guanlu_xiangyi.js', 'zhan_shi.js']) loadData(f);
loadData('yj_all.js');
for (const f of fs.readdirSync(UI).filter((x) => /^cal_\d{4}s\.js$/.test(x))) loadData(f);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'core', 'liuren-core.js'), 'utf-8')
  + '\nglobalThis.__CORE = LiurenCore;', sandbox, { filename: 'liuren-core.js' });
const C = sandbox.__CORE;
const W = sandbox.window;
C.init({ duxiang: W.DUXIANG_RULES, shensha: W.SHENSHA_RULES, bifa: W.BIFA, xingnian: W.XN_SCORE });

{
  const ids = feat.stories ? feat.stories : [];
  for (const id of ids) {
    const g = gallery.find((c) => c.id === id);
    if (!g || !g.input) continue;
    const i = g.input;
    const ch = C.buildChartAncient(i.mj, i.dg, i.dz, i.hour,
      i.yearGan ? i.yearGan : '', i.yearZhi ? i.yearZhi : '', i.monthZhi ? i.monthZhi : '');
    if (!ch) bad('白名单案盘面复算返回 null', id);
    else ok('白名单案盘面复算', id + ' → ' + ch.sanchuan.method + ' ' + ch.sanchuan.chuans.map((x) => x.z).join(''));
  }
}
for (const c of ouyu.cases) {
  const ch = C.buildChart({ date: c.date, hourZhi: c.hour, calData: W.CAL, yjAll: W.YJ_ALL });
  if (!ch) bad('偶遇案盘面复算返回 null', c.id + ' ' + c.date + ' ' + c.hour);
  else ok('偶遇案盘面复算', c.id + ' → ' + ch.sanchuan.method + ' ' + ch.sanchuan.chuans.map((x) => x.z).join(''));
}

/* ---- 7. 免费版剔除名单 ---- */
const sync = fs.readFileSync(path.join(ROOT, '_tools', 'sync_free_edition.py'), 'utf-8');
const block = /PAID_RAWFILE\s*=\s*\(([\s\S]*?)\)/.exec(sync);
if (!block) bad('sync_free_edition.py 里找不到 PAID_RAWFILE');
else {
  for (const f of ['ancient/case_gallery.json', 'ancient/case_story.json', 'ancient/ouyu_cases.json']) {
    if (block[1].indexOf(f) < 0) bad('免费版剔除名单缺', f);
  }
  ok('免费版剔除名单含三个收费数据文件');
}

console.log(fail === 0 ? '\nPASS  剧情演绎 App 接入层契约（' + clueTotal + ' 线索 / ' + laneN + ' 通道 / 双案盘面可复算）'
  : '\nFAIL  剧情演绎 App 接入层契约：' + fail + ' 项');
process.exit(fail === 0 ? 0 : 1);

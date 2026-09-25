/* 案例剧情（一局多占）反验
 * 数据源（真源）：APP/.../rawfile/ancient/case_story.json
 * 方式：
 *   1) 对每个 story 的 anchor 现场起盘复算，按证据链同一套语义校验锚点；
 *   2) 纪律校验：original 支线的提示不得抄录该案原文断语（8 字窗口比对），
 *      derived 支线必须写「非古籍原断」口径、不得出现承诺式断语；
 *   3) 合规校验：不得出现付费字样；
 *   4) 同步校验：UI/_data/case_story.js 必须与 JSON 一致（由 _tools/export_case_story_web.py 生成）。
 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.join(__dirname, '..');
vm.runInThisContext(fs.readFileSync(path.join(root, 'core', 'liuren-core.js'), 'utf-8'), { filename: 'liuren-core.js' });

const RB = path.join(root, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'resources', 'rawfile');
const load = (f) => JSON.parse(fs.readFileSync(path.join(RB, 'rule', f), 'utf-8'));
LiurenCore.init({
  duxiang: {
    '旺衰休囚死': { '旺衰': load('旺衰休囚死.json')['旺衰'] },
    '十二宫气机点': load('十二宫气机点.json'),
    '空亡规则': load('空亡规则.json'),
    '助日规则': load('助日规则.json'),
    '基础关系': load('基础关系.json')
  },
  shensha: { '神煞': load('神煞起法.json')['神煞'] },
  bifa: { '一百法': load('毕法赋一百法.json')['一百法'] }
});

const storyDoc = JSON.parse(fs.readFileSync(path.join(RB, 'ancient', 'case_story.json'), 'utf-8'));
const cases = JSON.parse(fs.readFileSync(path.join(RB, 'ancient', 'case_gallery.json'), 'utf-8'));
const byId = {};
for (const c of cases) byId[c.id] = c;

/* 上架白名单（发布策略数据）：列在这里的案才是玩家真能打开的 —— 其异占支线必须已做成「自由取象」 */
const featuredDoc = JSON.parse(fs.readFileSync(path.join(RB, 'ancient', 'story_featured.json'), 'utf-8'));
const featured = {};
for (const fid of (featuredDoc.stories || [])) featured[fid] = 1;

let fail = 0;
let anchorsChecked = 0;
const bad = (name, extra) => { fail++; console.log('FAIL:', name, extra === undefined ? '' : extra); };
const ok = (name, extra) => { console.log('OK  :', name, extra === undefined ? '' : extra); };

const TOPICS = { 来意: 1, 疾病: 1, 官讼: 1, 行人: 1, 仕宦: 1, 生产: 1, 风水: 1, 应候: 1, 役事: 1, 终身: 1, 省试: 1, 会试: 1, 流年: 1, 前程: 1, 六甲: 1, 己身: 1, 复建: 1, 亡盗: 1, 远行: 1, 索债: 1, 赴任: 1, 复任: 1, 补官: 1 };
const ROLES = { original: 1, derived: 1 };
const KINDS = { method: 1, chuan: 1, keg: 1, jiang: 1, hour: 1, gong: 1, zhi: 1, xunkong: 1, dayWangShuai: 1, shensha: 1, shiGan: 1, bianGan: 1 };
const POS = { '初传': 0, '中传': 1, '末传': 2 };
const ZHI = { 子: 1, 丑: 1, 寅: 1, 卯: 1, 辰: 1, 巳: 1, 午: 1, 未: 1, 申: 1, 酉: 1, 戌: 1, 亥: 1 };
const PAID = /付费|解锁|会员|VIP|价格|购买|订阅|充值/;
/* 支线不得出现的承诺式断语（避免把取象写成断语） */
const VERDICT = /必得|必成|必死|必中|必至|必有|定主|确主|应验|必然|准有|发财|痊愈|无救|大凶|大吉|包好|一定/;
/* 支线必须出现的规则归属标记 */
const RULE_ATTR = /古法|经文|类象|原文|课经|常取|多主|宜|参看|取象/;

const stripPunct = (s) => String(s || '').replace(/[，。、；：？！（）「」『』“”‘’《》〈〉·,.;:?!()\[\]{}"'\s—…\-\/]/g, '');

/* 原文抄录检测：hint 的 8 字窗口若出现在该案原文里，视为泄露断语 */
function copiesOriginal(hint, original, width) {
  const h = stripPunct(hint);
  const o = stripPunct(original);
  const w = width || 8;
  if (!o || h.length < w) return '';
  for (let i = 0; i + w <= h.length; i++) {
    const seg = h.substr(i, w);
    if (o.indexOf(seg) >= 0) return seg;
  }
  return '';
}

/* 剧情演绎（drama）校验：关卡式与 free-pick 两套规格分别把关。
   anchorOk 由调用方传入（它闭包在该案的复算盘面上）。 */
function checkDrama(a, tag, anchorOk, addBad) {
  const d = a.drama;
  if (!d) return;
  const dtag = tag + ' / drama';
  const badD = (name, extra) => { bad(dtag + ' ' + name, extra); addBad(); };
  if (!d.kind || !d.name || !d.intro) badD('kind/name/intro');
  /* 同课异占没有古籍原断 —— 一旦挂上玩法，就只能是「自由取象」：
     只给象义、不设路径、不给结论。做成关卡式＝替古人说话（编一条"正确路径"）。 */
  if (a.role === 'derived' && d.kind !== 'free-pick') badD('同课异占只能是「自由取象」', d.kind);
  if (d.kind === 'free-pick' && a.role !== 'derived') badD('free-pick 只用于 derived 支线');

  if (d.kind === 'free-pick') {
    /* 自由取象：只有一份「可取之象」，不许有路径、结论、对错 */
    if (!d.note) badD('必写 note（非古籍原断口径）');
    if ((d.entries || []).length || (d.routes || []).length) badD('不得有 entries/routes');
    const pk = d.picks || [];
    if (pk.length < 3) badD('picks ≥3', String(pk.length));
    const pids = {};
    const refs = {};
    for (const p of pk) {
      if (!p || !p.id || pids[p.id]) { badD('pick.id 唯一非空'); continue; }
      pids[p.id] = 1;
      if (!p.name || !p.reply) badD('pick.name/reply', p.id);
      anchorsChecked++;
      if (!anchorOk(p.anchor)) badD('pick 锚点落到复算盘面', p.id + ' ' + JSON.stringify(p.anchor));
      const rk = JSON.stringify(p.anchor);
      if (refs[rk] !== undefined) badD('pick 锚点重复', p.id + ' = ' + refs[rk]);
      refs[rk] = p.id;
    }
    const ptxt = pk.map((x) => (x.name || '') + ' ' + (x.reply || '')).join(' ') + ' ' + (d.intro || '') + ' ' + (d.note || '');
    if (PAID.test(ptxt)) badD('出现付费/解锁字样');
    if (VERDICT.test(ptxt)) badD('出现承诺式断语', (VERDICT.exec(ptxt) || [])[0]);
  } else {
    if (!(d.entries || []).length) badD('关卡式需 entries');
    if (!(d.routes || []).length) badD('关卡式需 routes');
    const eids = {};
    for (const e of (d.entries || [])) {
      if (!e || !e.id || eids[e.id]) { badD('entry.id 唯一非空'); continue; }
      eids[e.id] = e.level;
      if (e.level !== 1 && e.level !== 2) badD('entry.level 取 1/2', e.id);
      if (!e.name || !e.tag || !e.reply) badD('entry.name/tag/reply', e.id);
      anchorsChecked++;
      if (!anchorOk(e.anchor)) badD('entry 锚点落到复算盘面', e.id + ' ' + JSON.stringify(e.anchor));
    }
    const used = {};
    for (const r of (d.routes || [])) {
      if (!r || !r.id || !r.name || !r.kind || !r.conclusion) { badD('route.id/name/kind/conclusion'); continue; }
      if (r.kind === '另一解' && !r.note) badD('另一解必写 note（非古人原话）', r.id);
      if (!Array.isArray(r.steps) || !r.steps.length) badD('route.steps 非空', r.id);
      for (const s of (r.steps || [])) {
        if (!s || !s.reply) badD('step.reply', r.id);
        if (s && s.entry !== undefined) used[s.entry] = 1;
        anchorsChecked++;
        if (!anchorOk(s && s.anchor)) badD('step 锚点落到复算盘面', r.id + ' ' + JSON.stringify(s && s.anchor));
      }
    }
    /* 一级入口是玩家默认看得见的 —— 写了就必须真有路径用它（二级入口由数据层保证只在被用到时存在）*/
    for (const e of (d.entries || [])) {
      if (e && eids[e.id] === 1 && !used[e.id]) badD('一级入口未被任何路径用到', e.id);
    }
    if (PAID.test(JSON.stringify(d))) badD('出现付费/解锁字样');
  }
}

for (const [caseId, story] of Object.entries(storyDoc.stories || {})) {
  console.log('\n=== story ' + caseId + ' ===');
  const item = byId[caseId];
  if (!item) { bad('story 对应案例存在', caseId); continue; }
  ok('story 对应案例');
  if (!story.brief || story.brief.length < 10) { bad('brief 非空'); } else { ok('brief'); }
  const asks = story.asks || [];
  if (!Array.isArray(asks) || !asks.length) { bad('asks 非空'); continue; }
  ok('asks 数量', asks.length);

  const inp = item.input;
  const c = LiurenCore.buildChartAncient(inp.mj, inp.dg, inp.dz, inp.hour, inp.yearGan || inp.yg || '', inp.yearZhi || inp.yz || '', inp.monthZhi || '');
  if (!c) { bad('起盘失败'); continue; }
  const chuans = c.sanchuan.chuans.map((x) => x.z);
  const kegs = c.kegs.map((k) => k.x + '/' + k.s);
  const jiangAt = (z) => c.jiangMap[LiurenCore.gongOf(c.tp, z)] || '';
  const byZhi = (c.dx.shensha && c.dx.shensha.byZhi) ? c.dx.shensha.byZhi : {};
  const zh = LiurenCore.zhonghuangAnalyze(c, inp.hour);

  /* 单个锚点是否落到复算盘面 —— clues 与 drama（入口／步骤／可取之象）共用同一套语义 */
  function anchorOk(an) {
    if (!an || !KINDS[an.kind]) return false;
    switch (an.kind) {
      case 'method':
        return !an.ref || an.ref === c.sanchuan.method;
      case 'chuan':
        if (an.pos !== undefined && POS[an.pos] === undefined) return false;
        return an.pos !== undefined ? chuans[POS[an.pos]] === an.ref : chuans.indexOf(an.ref) >= 0;
      case 'keg':
        return kegs.indexOf(an.ref) >= 0;
      case 'jiang': {
        const p = String(an.ref || '').split('/');
        return !!p[1] && jiangAt(p[0]) === p[1];
      }
      case 'gong':
      case 'zhi':
        return !!ZHI[an.ref];
      case 'xunkong':
        return (c.dx.xunkong || []).indexOf(an.ref) >= 0;
      case 'dayWangShuai':
        return c.dx.dayWangShuai === an.ref;
      case 'shensha': {
        const p = String(an.ref || '').split('/');
        const list = byZhi[p[0]] || [];
        return !!p[1] && list.indexOf(p[1]) >= 0;
      }
      case 'hour':
        return an.ref === inp.hour;
      case 'shiGan':
        return !!zh && zh.dun.shiGan === an.ref;
      case 'bianGan':
        return !!zh && zh.dun.bianGan === an.ref;
    }
    return false;
  }

  const askIds = {};
  const roleCount = { original: 0, derived: 0 };
  let storyBad = 0;

  for (const a of asks) {
    const tag = caseId + ' / ' + (a && a.id);
    if (!a || !a.id || askIds[a.id]) { bad(tag + ' ask.id 唯一非空'); storyBad++; continue; }
    askIds[a.id] = 1;
    if (!ROLES[a.role]) { bad(tag + ' role 取值'); storyBad++; continue; }
    roleCount[a.role]++;
    if (!TOPICS[a.topic]) { bad(tag + ' topic 占类词表', a.topic); storyBad++; }
    if (!a.title || !a.intro || !a.question) { bad(tag + ' title/intro/question'); storyBad++; }
    if (!Array.isArray(a.clues) || !a.clues.length) { bad(tag + ' clues 非空'); storyBad++; continue; }
    if (!Array.isArray(a.endings) || a.endings.length !== 4) { bad(tag + ' endings 四档'); storyBad++; }
    const end = a.ending || {};
    if (end.type !== a.role) { bad(tag + ' ending.type 与 role 一致', String(end.type)); storyBad++; }

    const clueIds = {};
    for (const cl of a.clues) {
      const ctag = tag + ' / ' + (cl && cl.id);
      if (!cl || !cl.id || clueIds[cl.id]) { bad(ctag + ' clue.id 唯一非空'); storyBad++; continue; }
      clueIds[cl.id] = 1;
      if (!cl.label || !cl.hint || !cl.small) { bad(ctag + ' label/hint/small'); storyBad++; }
      if (!Array.isArray(cl.anchors) || !cl.anchors.length) { bad(ctag + ' anchors 非空'); storyBad++; continue; }
      for (const an of cl.anchors) {
        anchorsChecked++;
        if (!an || !KINDS[an.kind]) { bad(ctag + ' anchor.kind 未知', JSON.stringify(an)); storyBad++; continue; }
        if (!anchorOk(an)) { bad(ctag + ' 锚点落到复算盘面', JSON.stringify(an)); storyBad++; }
      }
    }

    /* ---- 剧情演绎（drama）校验 ----
       入口／路径步骤／可取之象的锚点与 clues 同一套语义，必须现场复算命中；
       玩法规格把关卡式与 free-pick 分开：「自由取象」不许有路径与结论。 */
    checkDrama(a, tag, anchorOk, () => { storyBad++; });

    /* 白名单案的异占支线必须**已经**挂上「自由取象」——
       否则玩家点进去看到的是给结论的旧玩法，与"异占不给结论"的口径直接冲突。
       （其余 36 条底稿尚未逐案重做，不在此强制；一旦接入白名单就必须补上。）*/
    if (featured[caseId] && a.role === 'derived' && !a.drama) {
      bad(tag + ' 白名单案的异占支线必须挂「自由取象」'); storyBad++;
    }

    const texts = [a.intro, a.question, (a.clues || []).map((x) => x.label + ' ' + x.small + ' ' + x.hint).join(' '), (a.goodWords || []).join(' '), end.text || '', end.note || ''].join(' ');
    if (PAID.test(texts)) { bad(tag + ' 出现付费/解锁字样'); storyBad++; }

    if (a.role === 'derived') {
      if (!end.text || end.text.length < 20) { bad(tag + ' derived 需写取象清单 ending.text'); storyBad++; }
      if (!end.note || end.note.indexOf('非古籍原断') < 0) { bad(tag + ' derived note 必写「非古籍原断」'); storyBad++; }
      if (!end.note || !/不构成|不给结论/.test(end.note)) { bad(tag + ' derived note 现实免责'); storyBad++; }
      if (VERDICT.test(texts)) { bad(tag + ' derived 出现承诺式断语', (VERDICT.exec(texts) || [])[0]); storyBad++; }
      for (const cl of a.clues) {
        if (!RULE_ATTR.test(cl.hint || '')) { bad(tag + ' derived 提示缺规则归属', cl.id); storyBad++; }
        const seg = copiesOriginal(cl.hint, item.original, 10);
        if (seg) { bad(tag + ' derived 提示抄录原文', cl.id + ':' + seg); storyBad++; }
      }
    } else {
      if (end.text) { bad(tag + ' original 不写 ending.text（揭古断用案例原文）'); storyBad++; }
      if (!item.original) { bad(tag + ' 案例缺 original'); storyBad++; }
      for (const cl of a.clues) {
        const seg = copiesOriginal(cl.hint, item.original, 8);
        if (seg) { bad(tag + ' 原占提示抄录原文断语（应先取证后揭）', cl.id + ':' + seg); storyBad++; }
      }
      for (const tok of ['果如', '七寸', '次日果']) {
        if (a.clues.some((cl) => (cl.hint || '').indexOf(tok) >= 0)) { bad(tag + ' 原占提示泄露应验细节', tok); storyBad++; }
      }
    }
  }

  if (roleCount.original < 1) { bad(caseId + ' 至少一个 original 支线'); storyBad++; }
  if (caseId === 'duanan_001_han_qixue') {
    if (asks.length < 2) { bad('样板案需「一局多占」（≥2 支线）'); storyBad++; }
    if (roleCount.derived < 1) { bad('样板案需至少一条异占支线'); storyBad++; }
  }
  if (storyBad === 0) ok('支线与锚点全部通过');
}

console.log('\n锚点校验数：' + anchorsChecked);

/* 导出文件同步校验 */
try {
  const jsPath = path.join(root, 'UI', '_data', 'case_story.js');
  const src = fs.readFileSync(jsPath, 'utf-8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: 'case_story.js' });
  const same = JSON.stringify(sandbox.window.CASE_STORY) === JSON.stringify(storyDoc.stories);
  if (!same) { bad('UI/_data/case_story.js 与 case_story.json 不同步', '请重跑 _tools/export_case_story_web.py'); } else { ok('网页导出同步'); }
} catch (err) {
  bad('网页导出读取失败', String(err && err.message));
}

if (fail === 0) { console.log('\nALL PASS (' + Object.keys(storyDoc.stories || {}).length + ' stories)'); } else { console.log('\nFAILED: ' + fail); }
process.exit(fail === 0 ? 0 : 1);

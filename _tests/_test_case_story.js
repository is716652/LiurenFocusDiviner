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
  const c = LiurenCore.buildChartAncient(inp.mj, inp.dg, inp.dz, inp.hour, inp.yearGan || '', inp.yearZhi || '', inp.monthZhi || '');
  if (!c) { bad('起盘失败'); continue; }
  const chuans = c.sanchuan.chuans.map((x) => x.z);
  const kegs = c.kegs.map((k) => k.x + '/' + k.s);
  const jiangAt = (z) => c.jiangMap[LiurenCore.gongOf(c.tp, z)] || '';
  const byZhi = (c.dx.shensha && c.dx.shensha.byZhi) ? c.dx.shensha.byZhi : {};
  const zh = LiurenCore.zhonghuangAnalyze(c, inp.hour);

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
        let good = false;
        if (!an || !KINDS[an.kind]) { bad(ctag + ' anchor.kind 未知', JSON.stringify(an)); storyBad++; continue; }
        switch (an.kind) {
          case 'method':
            good = !an.ref || an.ref === c.sanchuan.method;
            break;
          case 'chuan':
            if (an.pos !== undefined && POS[an.pos] === undefined) { good = false; break; }
            good = an.pos !== undefined ? chuans[POS[an.pos]] === an.ref : chuans.indexOf(an.ref) >= 0;
            break;
          case 'keg':
            good = kegs.indexOf(an.ref) >= 0;
            break;
          case 'jiang': {
            const p = String(an.ref || '').split('/');
            good = !!p[1] && jiangAt(p[0]) === p[1];
            break;
          }
          case 'gong':
          case 'zhi':
            good = !!ZHI[an.ref];
            break;
          case 'xunkong':
            good = (c.dx.xunkong || []).indexOf(an.ref) >= 0;
            break;
          case 'dayWangShuai':
            good = c.dx.dayWangShuai === an.ref;
            break;
          case 'shensha': {
            const p = String(an.ref || '').split('/');
            const list = byZhi[p[0]] || [];
            good = !!p[1] && list.indexOf(p[1]) >= 0;
            break;
          }
          case 'hour':
            good = an.ref === inp.hour;
            break;
          case 'shiGan':
            good = !!zh && zh.dun.shiGan === an.ref;
            break;
          case 'bianGan':
            good = !!zh && zh.dun.bianGan === an.ref;
            break;
        }
        if (!good) { bad(ctag + ' 锚点落到复算盘面', JSON.stringify(an)); storyBad++; }
      }
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

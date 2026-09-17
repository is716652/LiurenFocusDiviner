/* ============================================================================
 * case_story_scaffold.js —— 案例剧情补录：骨架生成器（只读，不写任何数据）
 * ----------------------------------------------------------------------------
 * 用途：给一个（或全部待补）案例 id，打印
 *   1) 该案既有字段（input / original / topics / focus）
 *   2) 引擎复算事实（课体 / 三传+遁干 / 乘将 / 旬空 / 日干旺衰 / 神煞 / 助日）
 *      —— 取事实路径与 _tests/_test_case_story.js 完全一致，保证锚点必然可复算
 *   3) 可直接填的 story 骨架（占位符写成【待填】，填完必须全部消失）
 *
 * 纪律：本工具**只打印**，不改随包数据；正式补录是把输出人工填好后写回
 *       APP/.../rawfile/ancient/case_story.json，再跑
 *       node _tests/_test_case_story.js + node _tools/case_story_audit.js
 * 用法：
 *   node _tools/case_story_scaffold.js <案例 id>      # 单个案例
 *   node _tools/case_story_scaffold.js --todo         # 列出所有还没剧情骨架的案例 id
 * ==========================================================================*/
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

const cases = JSON.parse(fs.readFileSync(path.join(RB, 'ancient', 'case_gallery.json'), 'utf-8'));
const stories = JSON.parse(fs.readFileSync(path.join(RB, 'ancient', 'case_story.json'), 'utf-8')).stories || {};
const byId = {};
for (const c of cases) byId[c.id] = c;

/* 骨架里的占类取该案 topics 的第一个（必须在 _test_case_story.js 的占类词表内） */
const TOPICS = ['来意', '疾病', '官讼', '行人', '仕宦', '生产', '风水', '应候', '役事', '终身', '省试', '会试',
  '流年', '前程', '六甲', '己身', '复建', '亡盗', '远行', '索债', '赴任', '复任', '补官'];

const arg = process.argv[2] || '';
if (arg === '--todo' || arg === '') {
  const todo = cases.filter((c) => !stories[c.id]);
  console.log('待补剧情：' + todo.length + ' 案（已有 ' + Object.keys(stories).length + ' 案）\n');
  for (const c of todo) {
    const inp = c.input || {};
    console.log('  ' + c.id.padEnd(38) + ' ' + (c.topics || []).join('/').padEnd(8)
      + ' ' + (inp.mj || '?') + '将' + (inp.hour || '?') + '时 ' + (inp.dg || '?') + (inp.dz || '?') + '日'
      + '  原文' + String(c.original || '').length + '字');
  }
  process.exit(0);
}

const item = byId[arg];
if (!item) { console.log('未找到案例 ' + arg); process.exit(1); }
const inp = item.input || {};
const c = LiurenCore.buildChartAncient(inp.mj, inp.dg, inp.dz, inp.hour, inp.yearGan || inp.yg || '', inp.yearZhi || inp.yz || '', inp.monthZhi || '');
if (!c) { console.log('起盘失败'); process.exit(1); }
const chuans = c.sanchuan.chuans.map((x) => x.z);
const jiangAt = (z) => c.jiangMap[LiurenCore.gongOf(c.tp, z)] || '';
const byZhi = (c.dx.shensha && c.dx.shensha.byZhi) ? c.dx.shensha.byZhi : {};
const ws = (LiurenCore.wangT() || {})[inp.dg] || {};
const kongZhi = Object.keys(c.dx.nodes || {}).filter((z) => c.dx.nodes[z].kong);

console.log('=== 案例 ' + item.id + '  ' + item.title);
console.log('  input    : ' + JSON.stringify(inp));
console.log('  topics   : ' + JSON.stringify(item.topics));
console.log('  original : ' + JSON.stringify(item.original));
console.log('');
console.log('--- 复算事实（锚点只能从这里取） ---');
console.log('  课体（四课）: ' + c.kegs.map((k) => k.x + '/' + k.s).join('  '));
console.log('  三传        : ' + chuans.map((z, i) => ['初', '中', '末'][i] + '=' + z).join('  ')
  + '   乘将: ' + chuans.map((z) => z + '→' + (jiangAt(z) || '?')).join('  '));
console.log('  旬空        : ' + (kongZhi.join('、') || '（无）'));
console.log('  日干旺衰    : ' + inp.dg + ' → ' + Object.keys(ws).map((z) => z + '=' + ws[z]).join(' '));
console.log('  神煞(按支)  : ' + Object.keys(byZhi).filter((z) => (byZhi[z] || []).length)
  .map((z) => z + '[' + byZhi[z].join('、') + ']').join('  '));
console.log('  助日        : 月将' + ((c.dx.yuejiang && c.dx.yuejiang.zhu) ? '助日' : '不助日')
  + '；贵人' + ((c.dx.guiren && c.dx.guiren.zhu) ? '助日' : '不助日'));
console.log('');
console.log('--- 锚点形状契约（以 _tests/_test_case_story.js 的 switch(an.kind) 为准）---');
console.log('  method        {} 或 {ref:"<课体名>"}          —— 如 "涉害"/"比用"/"伏吟"/"元首"');
console.log('  chuan         {pos:"初传|中传|末传", ref:"<该位之支>"}');
console.log('  keg           {ref:"<干上神>/<日干>"}          —— 如 "子/甲"');
console.log('  jiang         {ref:"<支>/<将>"}                —— 如 "戌/玄武"（不是 zhi+ref 两字段！）');
console.log('  gong / zhi    {ref:"<地支>"}');
console.log('  xunkong       {ref:"<空亡之支>"}');
console.log('  dayWangShuai  {ref:"<本课日干旺衰值>"}          —— 如 "死"/"旺"（不是 "甲/申"）');
console.log('  shensha       {ref:"<支>/<神煞名>"}              —— 如 "巳/驿马"');
console.log('  hour          {ref:"<占时之支>"}');
console.log('  shiGan/bianGan{ref:"<中黄遁干>"}');
console.log('');
console.log('--- 可直接填的骨架（占位符【待填】填完必须消失；endings 必须 4 档） ---');
const topic0 = (item.topics || [])[0] || TOPICS[0];
const sk = {};
sk[item.id] = {
  brief: '【待填】情境：' + (inp.mj || '?') + '将' + (inp.hour || '?') + '时、' + (inp.dg || '?') + (inp.dz || '?')
    + '日，某人问……（要素只取自本案 input 与 original，不虚构人物与结果）',
  note: '同一课可作多占（同课异占）：换一个占问方向，盘面不变而取象各异。原占支线揭古籍断语与应验；异占支线只列可取之象与规则依据，不作断语。',
  asks: [
    {
      id: '【待填·原占 id】',
      role: 'original',
      topic: TOPICS.indexOf(topic0) >= 0 ? topic0 : '【待填·占类，须在词表内】',
      title: '原占 · 【待填】',
      badge: '【待填·看点】',
      intro: '【待填】',
      question: '【待填·占问句】',
      clues: [
        {
          id: 'method', label: '先定课体：此课何名？', small: '点「课名」',
          anchors: [{ kind: 'method' }],
          hint: '【待填】只给盘面事实与古法通则；**不得抄本案原文断语**（8 字窗口会被校验）'
        },
        {
          id: 'chu', label: '【待填·问句】初传主事之始：何支、乘何将？', small: '点初传',
          anchors: [{ kind: 'chuan', pos: '初传', ref: chuans[0] }],
          hint: '【待填】可写：本课初传' + chuans[0] + '，乘' + (jiangAt(chuans[0]) || '?')
            + (kongZhi.indexOf(chuans[0]) >= 0 ? '，落旬空' : '') + '；神煞：'
            + ((byZhi[chuans[0]] || []).join('、') || '无')
        },
        {
          id: 'mo', label: '【待填·问句】末传主事之终：日干在此时令有力否？', small: '点末传与日干旺衰',
          anchors: [{ kind: 'chuan', pos: '末传', ref: chuans[2] },
            { kind: 'dayWangShuai', ref: c.dx.dayWangShuai }],
          hint: '【待填】可写：末传' + chuans[2] + '，日干' + inp.dg + '在' + inp.monthZhi + '月为' + (ws[inp.monthZhi] || '?')
        }
      ],
      endings: [{ label: '【待填】', text: '【待填】' }, { label: '【待填】', text: '【待填】' },
        { label: '【待填】', text: '【待填】' }, { label: '【待填】', text: '【待填】' }],
      ending: {
        type: 'original',
        text: '【待填】古断（须能在本案 original 中找到，照录并标出处）',
        note: '【待填】出处：' + JSON.stringify(item.source),
        tip: '【待填】对照盘面：……'
      }
    },
    {
      id: '【待填·异占 id】',
      role: 'derived',
      topic: '【待填·占类，须在词表内且与本案不同】',
      title: '同课异占 · 【待填】',
      badge: '【待填·取象维度】',
      intro: '同一课换一个占问方向，盘面不变、取象各异。',
      question: '【待填】若问……可取之象有哪些？',
      clues: [{
        id: '【待填】', label: '【待填·问句】', small: '【待填·点哪里】',
        anchors: [{ kind: 'gong', ref: '【待填·支或宫】' },
          { kind: 'shensha', ref: '【待填·支】/【待填·神煞名】' }],
        hint: '【待填】须给「古法/经文/类象/常取/多主/参看/取象」之一的规则归属；只列取象，不下结论'
      }],
      endings: [{ label: '【待填】', text: '【待填】' }, { label: '【待填】', text: '【待填】' },
        { label: '【待填】', text: '【待填】' }, { label: '【待填】', text: '【待填】' }],
      ending: {
        type: 'derived',
        text: '可参的取象清单：【待填】① …… ② ……（只列取象，不得含结论）',
        note: '本支线为同课异占的取象推演，非古籍原断，也不构成对现实……的判断或建议。'
      }
    }
  ]
};
console.log(JSON.stringify(sk, null, 2));
console.log('');
console.log('填完请跑：node _tests/_test_case_story.js && node _tools/case_story_audit.js');

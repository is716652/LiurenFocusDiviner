/* ============================================================================
 * case_story_audit.js —— 案例剧情「批量填充」审计（2026-09-15）
 * ----------------------------------------------------------------------------
 * 为什么单独有它：_tests/_test_case_story.js 管**结构与锚点**（锚点必须被引擎复算命中），
 *   但锚点通过 ≠ 文案没说错。批量补录 43 案时最容易出的错是：
 *     ① 套模板：同一句 hint / ending 复制到多案；
 *     ② **文案里的断言与本案盘面不符**（把别案的乘将/神煞/旬空/三传照抄过来）；
 *     ③ 编应验：原占支线结尾写「古断」，但该案 original 里根本没有这句话；
 *     ④ 占位符没删干净（【待填】/TODO/…）；
 *     ⑤ 支线越界：derived 写了结论。
 *   本审计把这些变成机器判据，**对每一案逐句核对复算事实**。
 *
 * 职责边界：本审计**不做**锚点复算（那是 _test_case_story.js 的活）；两者都要过。
 * 用法：
 *   node _tools/case_story_audit.js                  # 审计随包数据 case_story.json
 *   node _tools/case_story_audit.js --file <draft.json>   # 审计草稿（同结构）后再合并
 * 退出码：有 FAIL → 1；只有 WARN → 0（WARN 需人工判断，不阻断）
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

const fi = process.argv.indexOf('--file');
const storyPath = fi >= 0 ? process.argv[fi + 1] : path.join(RB, 'ancient', 'case_story.json');
const storyDoc = JSON.parse(fs.readFileSync(storyPath, 'utf-8'));
const stories = storyDoc.stories || {};
const cases = JSON.parse(fs.readFileSync(path.join(RB, 'ancient', 'case_gallery.json'), 'utf-8'));
const byId = {};
for (const c of cases) byId[c.id] = c;

const SHEN_SHA_ALL = new Set(Object.keys(load('神煞起法.json')['神煞'] || {}));
const JIANG = '贵人|螣蛇|朱雀|六合|勾陈|青龙|天空|白虎|太常|玄武|太阴|天后';
const ZHI = '子丑寅卯辰巳午未申酉戌亥';
const POS = { 初: 0, 中: 1, 末: 2 };
const VERDICT = /必得|必成|必死|必中|必至|必有|定主|确主|应验|必然|准有|发财|痊愈|无救|大凶|大吉|包好|一定/;
const PLACEHOLDER = /【[^】]*待|待填|待补|请填|TODO|FIXME|XXXX|\?\?\?|(^|[^0-9])\.\.\.($|[^0-9])/;
const STANDALONE_DOTS = /^(…|\.\.\.|——|-)$/;
/* topic → 取象关键词（轻量启发式，仅用于 WARN） */
const TOPIC_HINT = {
  行人: /马|驿马|动象|音信|行|归|至/, 远行: /门户|道路|卯|马|程|行/, 亡盗: /财|玄武|隐|暗|盗|失/,
  官讼: /讼|官|勾陈|朱雀|狱|刑/, 疾病: /病|白虎|血|医|天医|死|囚/, 来意: /来意|先锋|门/,
  仕宦: /官|禄|印|贵|迁|任/, 终身: /身|命|禄|宅/, 风水: /宅|墓|土|龙/, 六甲: /胎|孕|产/,
  生产: /胎|产|子|母/, 应候: /候|期|日|时|应/, 省试: /试|文|朱雀|榜/, 会试: /试|文|榜/,
  流年: /年|岁|太岁/, 前程: /禄|马|贵|进/, 己身: /日干|身|旺衰/, 索债: /财|债|玄武/,
  赴任: /任|官|马|禄/, 复任: /任|官/, 补官: /官|禄/, 役事: /役|差/, 复建: /建|土|工/
};

let fails = 0, warns = 0;
const fail = (tag, msg, extra) => { fails++; console.log('FAIL  ' + tag + '  ' + msg + (extra ? '  → ' + extra : '')); };
const warn = (tag, msg, extra) => { warns++; console.log('WARN  ' + tag + '  ' + msg + (extra ? '  → ' + extra : '')); };
const stripPunct = (s) => String(s || '').replace(/[，。、；：？！（）「」『』“”‘’《》〈〉·,.;:?!()\[\]{}"'\s—…\-\/]/g, '');

/* 收集跨案文本，用于「套模板」检测 */
const hintIndex = new Map();   /* 归一化 hint → [案例/tag] */
const endingIndex = new Map();
const labelIndex = new Map();
const caseKinds = new Map();
const caseRoles = new Map();

function collect(map, text, where) {
  const k = stripPunct(text);
  if (k.length < 12) return;
  if (!map.has(k)) map.set(k, []);
  map.get(k).push(where);
}

/* 跨库比对：审计草稿时，把随包语料也纳入「重复检测」索引
   —— 批量补录最容易犯的是「从既有案抄一段改改」，只在草稿内部比对查不出来。 */
const shippedPath = path.join(RB, 'ancient', 'case_story.json');
const isDraft = path.resolve(storyPath) !== path.resolve(shippedPath);
if (isDraft && fs.existsSync(shippedPath)) {
  const shipped = JSON.parse(fs.readFileSync(shippedPath, 'utf-8')).stories || {};
  for (const [cid, st] of Object.entries(shipped)) {
    for (const a of (st.asks || [])) {
      for (const cl of (a.clues || [])) {
        const k = stripPunct(cl.hint);
        if (k.length >= 12) { if (!hintIndex.has(k)) hintIndex.set(k, []); hintIndex.get(k).push(cid); }
      }
      const ek = stripPunct((a.ending || {}).text);
      if (ek.length >= 12) { if (!endingIndex.has(ek)) endingIndex.set(ek, []); endingIndex.get(ek).push(cid); }
    }
  }
  console.log('（已纳入随包语料 ' + Object.keys(shipped).length + ' 案做跨库重复比对）');
}

console.log('=== 案例剧情审计：' + path.relative(root, storyPath) + '（' + Object.keys(stories).length + ' 案）\n');
for (const [caseId, story] of Object.entries(stories)) {
  const item = byId[caseId];
  if (!item) { fail(caseId, '案例不存在于 case_gallery.json'); continue; }
  const inp = item.input || {};
  const c = LiurenCore.buildChartAncient(inp.mj, inp.dg, inp.dz, inp.hour, inp.yearGan || '', inp.yearZhi || '', inp.monthZhi || '');
  if (!c) { fail(caseId, '起盘失败'); continue; }
  const chuans = c.sanchuan.chuans.map((x) => x.z);
  const jiangAt = (z) => c.jiangMap[LiurenCore.gongOf(c.tp, z)] || '';
  const byZhi = (c.dx.shensha && c.dx.shensha.byZhi) ? c.dx.shensha.byZhi : {};
  const kong = new Set(Object.keys(c.dx.nodes || {}).filter((z) => c.dx.nodes[z].kong));
  const original = stripPunct(item.original || '');
  const kinds = new Set();
  const roles = new Set();
  let caseFail0 = fails, caseWarn0 = warns;

  /* 逐文本核对「文案里的盘面断言」 */
  const checkText = (tag, text) => {
    const t = String(text || '');
    if (!t) return;
    if (PLACEHOLDER.test(t) || STANDALONE_DOTS.test(t.trim())) fail(tag, '占位符/未填残留', t.slice(0, 40));
    /* 支乘将 / 将乘支 */
    for (const m of t.matchAll(new RegExp('([' + ZHI + '])乘(' + JIANG + ')', 'g'))) {
      const real = jiangAt(m[1]);
      if (real && real !== m[2]) fail(tag, '乘将断言与复算不符', m[1] + '乘' + m[2] + '（复算：' + m[1] + '乘' + real + '）');
    }
    for (const m of t.matchAll(new RegExp('(' + JIANG + ')乘([' + ZHI + '])', 'g'))) {
      const real = jiangAt(m[2]);
      if (real && real !== m[1]) fail(tag, '乘将断言与复算不符', m[1] + '乘' + m[2] + '（复算：' + m[2] + '乘' + real + '）');
    }
    /* 支带神煞（只核对「已知煞名」的 token，避免误伤普通词） */
    for (const m of t.matchAll(new RegExp('([' + ZHI + '])(?:带|见|兼|并)([^。；，、！？]{1,24})', 'g'))) {
      const zhi = m[1], have = new Set(byZhi[zhi] || []);
      for (const tok of m[2].split(/[、，,和及与]/)) {
        const name = tok.trim().replace(/[。；！？].*$/, '');
        if (name.length >= 2 && name.length <= 6 && SHEN_SHA_ALL.has(name) && !have.has(name)) {
          fail(tag, '神煞断言与复算不符', zhi + '带' + name + '（复算：' + zhi + '带 ' + (byZhi[zhi] || []).join('、') + '）');
        }
      }
    }
    /* 支旬空：**紧邻**才算该支的断言。实测教训：句「日支卯上见申，而申落旬空」里主体是申
       （确在旬空），用 8 字窗口会把卯当主语 → 假阳性。故只匹配「支 + 可选连接词 + 旬空」。 */
    for (const m of t.matchAll(new RegExp('([' + ZHI + '])(?:落|入|逢|临|为|犯|在|亦|又|且|是|主)?旬空', 'g'))) {
      if (!kong.has(m[1])) fail(tag, '旬空断言与复算不符', m[1] + ' 并不在旬空 ' + [...kong].join('、'));
    }
    /* 三传位次 */
    for (const m of t.matchAll(new RegExp('([初中末])传([' + ZHI + '])', 'g'))) {
      const want = chuans[POS[m[1]]];
      if (want && want !== m[2]) fail(tag, m[1] + '传断言与复算不符', m[1] + '传' + m[2] + '（复算：' + want + '）');
    }
  };

  for (const a of (story.asks || [])) {
    const atag = caseId + '/' + (a && a.id) + ' [' + (a && a.role) + ']';
    roles.add(a && a.role);
    for (const cl of (a.clues || [])) {
      for (const an of (cl.anchors || [])) if (an && an.kind) kinds.add(an.kind);
      collect(hintIndex, cl.hint, atag);
      collect(labelIndex, cl.label, caseId);
      if (String(cl.hint || '').length < 20) warn(atag + '/' + cl.id, 'hint 过短（<20 字），疑似敷衍');
      checkText(atag + '/' + cl.id, cl.hint);
      if (a && a.role === 'derived' && !/古法|经文|类象|原文|课经|常取|多主|宜|参看|取象/.test(String(cl.hint || ''))) {
        warn(atag + '/' + cl.id, 'derived 的 hint 未出现规则归属词（古法/经文/类象/…）');
      }
      /* topic 与取象词（轻量） */
      if (a && a.role === 'derived' && TOPIC_HINT[a.topic] && !TOPIC_HINT[a.topic].test(String(cl.hint || ''))) {
        warn(atag + '/' + cl.id, 'hint 未出现占类「' + a.topic + '」的常见取象词');
      }
    }
    const end = a.ending || {};
    collect(endingIndex, end.text, atag);
    checkText(atag + '/ending', end.text);
    checkText(atag + '/ending.note', end.note);
    if (a.role === 'derived' && VERDICT.test(String(end.text || ''))) fail(atag, 'derived 的 ending 含承诺式断语');
    if (a.role === 'original') {
      /* 原占的揭晓必须**能核到该案原文**，两种合格形态：
         ① 直接把古断写进 ending —— 须有 ≥8 字连续出现在该案 original 中；
         ② 显式指向原文（如 tip=「揭古断与应验」）—— 本案既有设计即此：endings[] 是四档提示标签，
            古断由 App 揭 gallery 的 original，故 ending 里本就没有原文文本。
         两者都不满足 → 无从核对「断语正确」，判 FAIL。 */
      const joined = [end.text, end.tip, end.note].filter(Boolean).join('');
      const e = stripPunct(joined);
      let hit = '';
      for (let i = 0; i + 8 <= e.length; i++) if (original.indexOf(e.substr(i, 8)) >= 0) { hit = e.substr(i, 8); break; }
      const pointsToOriginal = /原文|古断|揭古断|应验/.test(joined);
      if (!hit && !pointsToOriginal) {
        fail(caseId + '/' + a.id, '原占 ending 既未引原文也未指向原文（无法核对该案断语出处）',
          'tip=' + JSON.stringify(end.tip || '') + ' / 原文前 24 字：' + (item.original || '').slice(0, 24));
      }
    }
  }
  caseKinds.set(caseId, kinds);
  caseRoles.set(caseId, roles);
  if (fails === caseFail0 && warns === caseWarn0) console.log('OK    ' + caseId + '（' + (story.asks || []).length + ' 支线）');
}

/* ---- 结构面（与 test 重叠的部分只给 WARN，避免与 test 口径打架） ---- */
for (const [caseId, kinds] of caseKinds) {
  const need = ['method', 'chuan', 'jiang', 'gong'].filter((k) => kinds.has(k)).length;
  if (need < 3) warn(caseId, '锚点覆盖面不足（method/chuan/jiang/gong 仅 ' + need + '/4）', [...kinds].join(','));
  const roles = caseRoles.get(caseId) || new Set();
  if (!roles.has('original')) warn(caseId, '缺原占支线（original）');
  if (!roles.has('derived')) warn(caseId, '缺同课异占支线（derived）');
}

/* ---- 套模板检测 ---- */
let dupHints = 0;
for (const [k, where] of hintIndex) {
  const cases = [...new Set(where.map((w) => w.split('/')[0]))];
  if (cases.length >= 2) {
    dupHints++;
    fail('跨案重复', '同一句 hint 出现在 ' + cases.length + ' 案（疑似套模板/抄既有案）',
      k.slice(0, 40) + ' ← ' + cases.join(', '));
  }
}
let dupEnd = 0;
for (const [k, where] of endingIndex) {
  const cases = [...new Set(where.map((w) => w.split('/')[0]))];
  if (cases.length >= 2) { dupEnd++; fail('跨案重复', '同一段 ending 出现在 ' + cases.length + ' 案', k.slice(0, 40) + ' ← ' + cases.join(', ')); }
}
const genericLabels = [...labelIndex].filter(([, v]) => new Set(v).size >= 5).map(([k, v]) => k + '（' + new Set(v).size + ' 案）');
if (genericLabels.length) warn('通用线索标题', '同一 label 出现在 ≥5 案（可接受但需确认是否案案适用）', genericLabels.slice(0, 5).join(' | '));

console.log('\n=== 审计汇总：FAIL ' + fails + ' · WARN ' + warns
  + '（跨案重复 hint ' + dupHints + ' · ending ' + dupEnd + '）');
console.log('    注：结构与锚点复算由 node _tests/_test_case_story.js 负责，两者都要过。');
process.exit(fails ? 1 : 0);

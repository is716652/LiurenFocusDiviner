/* ============================================================================
 * _test_readxiang.js —— 读象读数（气机点 / 空亡三态 / 助日缘由）运行期断言
 * ----------------------------------------------------------------------------
 * 对应《读象数据覆盖度与内容鉴定报告》第 1 档：把三张「已加载但没人读」的表接上盘。
 * 本脚本验三件事：
 *   R1 接得上：宫位名（引擎已算）× 表内象义 / 冲宫 / 合宫 / 三合 / 延长带 都取到了；
 *   R2 真读表：改表内容 → 输出随之改变（**证明不是硬编码**，防「硬凑写死」）；
 *   R3 三态可分：同宫空亡 / 冲空 / 未空（填实只作条件说明）各自说话，缺表不静默；
 *   R4 合规：我方陈述（text/note/助日缘由）不含现实结论词；原文口诀单独成字段。
 * 用法：node _tests/_test_readxiang.js
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
function eq(actual, expect, label) {
  const a = JSON.stringify(actual); const e = JSON.stringify(expect);
  if (a === e) { ok(label + '：' + a); } else { bad(label + '：实得 ' + a + '，应为 ' + e); }
}
function truthy(v, label) { if (v) { ok(label); } else { bad(label); } }
function has(s, sub, label) { if (typeof s === 'string' && s.indexOf(sub) >= 0) { ok(label); } else { bad(label + '（实得 ' + JSON.stringify(s) + '）'); } }

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
for (const api of ['qijiReading', 'zhuriWhy', 'palaceLookup']) {
  if (typeof CORE[api] !== 'function') { console.log('✗ 引擎未提供 ' + api + '()'); process.exit(1); }
}
const QJ = loadRule('十二宫气机点.json');
const KW = loadRule('空亡规则.json');
const ZR = loadRule('助日规则.json');

/* 甲子日：旬空 = 戌亥（甲子旬）；甲为阳干 → 长生在亥（表：阳干顺） */
CORE.init(ruleBundle());
const c = CORE.buildChartAncient('亥', '甲', '子', '午');
if (!c) { console.log('✗ 起盘失败'); process.exit(1); }

/* ---------------- R1 接得上 ---------------- */
head('[R1] 宫位名（引擎算）× 表内象义（表供）接得起来');
const HAI = CORE.qijiReading(c, '亥');
eq(HAI.gong, '长生', '甲日·天盘亥 → 气机宫位');
eq(HAI.side, '阳干顺', '甲为阳干 → 取阳干顺一列');
eq(HAI.oneLine, QJ['十二宫']['长生']['阳干顺'], '一句象义取自气机点表（与表逐字相同）');
eq(HAI.chongGong, QJ['十二宫']['长生']['冲宫'], '冲宫取自表');
eq(HAI.benGongLiuHe, QJ['十二宫']['长生']['本宫六合'], '本宫六合取自表');
eq(HAI.sanHeJu, QJ['十二宫']['长生']['三合局'], '三合局取自表');
truthy(HAI.yanChang !== '', '三合延长带象义非空：' + HAI.yanChang);
has(HAI.text, '长生宫（阳干顺）', '我方陈述含宫位与阴阳侧');

/* ---------------- R2 真读表（负向：改表即改输出） ---------------- */
head('[R2] 真读表而不是硬编码：改表内容 → 输出随之改变');
{
  const b = ruleBundle();
  b.duxiang['十二宫气机点']['十二宫']['长生']['阳干顺'] = '【哨兵】表被改过了';
  CORE.init(b);
  const c2 = CORE.buildChartAncient('亥', '甲', '子', '午');
  eq(CORE.qijiReading(c2, '亥').oneLine, '【哨兵】表被改过了', '改表后一句象义随之变化（证明表被真读）');
  CORE.init(ruleBundle());
}

/* ---------------- R3 空亡三态 / 缺表不静默 ---------------- */
head('[R3] 空亡三态可分（同宫空亡 / 冲空 / 未空），缺表不静默');
eq(HAI.kongState, '同宫空亡', '甲子旬：亥为旬空 → 同宫空亡');
eq(HAI.kongNote, KW['气机宫速用']['长生']['同宫空亡'], '同宫空亡一句取自空亡规则表');
eq(HAI.kongEffect, KW['三种操作']['同宫空亡']['对气机影响'], '对气机影响取自表');
{
  const LIN = CORE.qijiReading(c, '寅');   /* 甲：寅为临官；寅不在甲子旬空（戌亥）内 */
  eq(LIN.gong, '临官', '甲日·天盘寅 → 气机宫位');
  eq(LIN.kongState, '', '未空 → kongState 为空串');
  has(LIN.kongNote, '填实', '未空时给出「填实需俟流年流月流日」的条件说明（不预判）');
}
{
  const SI = CORE.qijiReading(c, '巳');   /* 甲：巳为病；巳本身不空，但其冲支亥空 */
  eq(SI.kongState, '冲空', '巳不空而冲支亥空 → 冲空');
  truthy(SI.kongNote !== '', '冲空有对应一句：' + SI.kongNote);
}
{
  CORE.init({ duxiang: {}, shensha: { '神煞': {} }, bifa: { '一百法': [] } });
  const c3 = CORE.buildChartAncient('亥', '甲', '子', '午');
  const r = CORE.qijiReading(c3, '亥');
  has(r.note, '未加载', '缺表时 note 明说未加载（不静默、不造值）');
  eq(r.oneLine, '', '缺表时不给象义（不造值）');
  CORE.init(ruleBundle());
}

/* ---------------- R4 助日缘由（读助日规则表） ---------------- */
head('[R4] 助日缘由：月将/贵人逐条 + 原文口诀单独成字段');
{
  const c4 = CORE.buildChartAncient('亥', '甲', '子', '午');
  const z = CORE.zhuriWhy(c4);
  has(z.yueJiang, '月将', '月将一行为：' + z.yueJiang);
  truthy(z.yueJiang.indexOf('→ 助日') >= 0 || z.yueJiang.indexOf('→ 不助日') >= 0, '月将给出助/不助结论词');
  has(z.guiRen, '贵人临', '贵人一行为：' + z.guiRen);
  eq(z.kouJue, ZR['月将']['口诀'], '原文口诀与助日规则表逐字相同');
  has(z.text, '月将', '合成一句含月将');
  CORE.init({ duxiang: {}, shensha: { '神煞': {} }, bifa: { '一百法': [] } });
  const c5 = CORE.buildChartAncient('亥', '甲', '子', '午');
  has(CORE.zhuriWhy(c5).note, '未加载', '缺表时助日缘由明说未加载');
  CORE.init(ruleBundle());
}

/* ---------------- R5 合规：我方陈述不含现实结论词 ---------------- */
head('[R5] 合规：我方陈述只讲盘上关系，不含现实结论词');
{
  const c6 = CORE.buildChartAncient('亥', '甲', '子', '午');
  const BANNED = /富贵|升迁|发财|破财|官司|疾病|生死|必|大吉|大凶|一定能|保准/;
  const rows = [CORE.qijiReading(c6, '亥'), CORE.qijiReading(c6, '寅'), CORE.zhuriWhy(c6)];
  let hit = '';
  for (const r of rows) {
    for (const k of ['text', 'note', 'yueJiang', 'guiRen', 'kongNote', 'kongEffect']) {
      if (typeof r[k] === 'string' && BANNED.test(r[k])) { hit = k + ' = ' + r[k]; }
    }
  }
  if (hit === '') { ok('我方字段（text/note/助日缘由/空亡说明）未见现实结论词'); }
  else { bad('出现现实结论词：' + hit); }
  truthy(CORE.qijiReading(c6, '亥').oneLine !== '', '原文层面保留表内口诀（单独字段，不与我方陈述混写）');
}

/* ---------------- R6 点宫速查不回归 ---------------- */
head('[R6] 点宫速查（palaceLookup）不回归');
{
  const c7 = CORE.buildChartAncient('亥', '甲', '子', '午');
  const p = CORE.palaceLookup(c7, '亥', '');
  eq(p.gong, '亥', '入参为地盘宫 → 原样返回');
  /* 交叉校验：palaceLookup 的气机宫位取自「该宫的天盘支」，应与 qijiReading(同支) 一致 */
  truthy(p.qiJi !== '', 'palaceLookup 仍带 qiJi：' + p.qiJi);
  eq(p.qiJi, CORE.qijiReading(c7, p.tianZhi).gong, '两个接口对同一支的气机宫位一致');
  truthy(typeof p.role.text === 'string' && p.role.text.length > 0, '角色说明仍在：' + p.role.text);
}

/* ---------------- R7 速查卡行装配（readXiangCard） ---------------- */
head('[R7] 速查卡行装配：行序契约 / 气机点与空亡态 / 原文独立成行 / 缺表不静默 / 我方陈述合规');
{
  CORE.init(ruleBundle());
  const c7 = CORE.buildChartAncient('亥', '甲', '子', '午');   /* 甲子日：亥为旬空；甲长生在亥 */
  /* 注意：palaceLookup/readXiangCard 的入参是**地盘宫**，其气机取自「该宫的天盘支」，
     故不能拿"亥"当宫来期望"长生" —— 这里按 API 反查：找气机为长生的那个宫。 */
  const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const gongOf = (cc, want) => {
    const hit = ZHI.filter((g) => CORE.palaceLookup(cc, g, '').qiJi === want);
    return hit.length > 0 ? hit[0] : '';
  };
  const gongChangSheng = gongOf(c7, '长生');
  truthy(gongChangSheng !== '', '示例盘中存在气机为「长生」的宫：' + gongChangSheng);
  const rows = CORE.readXiangCard(c7, gongChangSheng, '');
  const labels = rows.map((r) => r['label']);
  eq(labels[0], '此宫', '首行为「此宫」');
  truthy(labels.indexOf('远景') === 1, '第二行为「远景」（旺衰背景）：' + labels.join('/'));
  truthy(labels.indexOf('中景') > labels.indexOf('远景'), '「中景」在远景之后');
  truthy(labels.indexOf('近景') > labels.indexOf('中景'), '「近景」在中景之后');
  truthy(labels.indexOf('气机点') > labels.indexOf('近景'), '「气机点」在近景之后');
  truthy(labels[labels.length - 1] === '此宫一句', '末行为「此宫一句」：' + labels[labels.length - 1]);
  const qj = rows.filter((r) => r['label'] === '气机点')[0];
  has(qj['text'], '长生', '气机点行给出宫位名');
  has(qj['text'], qj['text'].indexOf('空亡态') >= 0 ? '空亡态' : '未见空亡', '气机点行给出空亡状态说明');
  const src = rows.filter((r) => r['label'] === '原文')[0];
  truthy(src !== undefined && src['source'] !== '', '原文单独成行且有内容：' + (src ? src['source'].slice(0, 40) : '（缺失）'));
  const gist = rows.filter((r) => r['label'] === '此宫一句')[0];
  const tianZhiAtGong = CORE.palaceLookup(c7, gongChangSheng, '').tianZhi;
  eq(gist['text'], CORE.qijiReading(c7, tianZhiAtGong)['text'], '末行与 qijiReading(同支).text 逐字一致（同口径）');
  /* 合规：我方陈述（text 字段）不得含现实结论词 */
  const BANNED2 = /富贵|升迁|发财|破财|官司|疾病|生死|必|大吉|大凶/;
  let dirty = '';
  rows.forEach((r) => { if (r['text'] !== '' && BANNED2.test(r['text'])) { dirty = r['label'] + ' → ' + r['text']; } });
  if (dirty === '') { ok('各行 text（我方陈述）未见现实结论词'); } else { bad('出现现实结论词：' + dirty); }
  truthy(rows.every((r) => typeof r['tone'] === 'string' && r['tone'] !== ''), '每行都带 tone（UI 用色）');
  /* 缺表：气机点行必须说「未加载」，不静默、不造值 */
  CORE.init({ duxiang: {}, shensha: { '神煞': {} }, bifa: { '一百法': [] } });
  const c8 = CORE.buildChartAncient('亥', '甲', '子', '午');
  const g8 = gongOf(c8, '长生');
  const rows2 = CORE.readXiangCard(c8, g8 === '' ? '子' : g8, '');
  const qj2 = rows2.filter((r) => r['label'] === '气机点')[0];
  has(qj2['text'] + qj2['tone'], '未加载', '缺表时气机点行明说未加载：' + qj2['text'].slice(0, 40));
  const ws2 = rows2.filter((r) => r['label'] === '远景')[0];
  has(ws2['text'], '未加载', '缺表时远景行明说未加载');
  CORE.init(ruleBundle());
  /* 负向：改表 → 卡片输出随之改变（证明真读表） */
  const b2 = ruleBundle();
  b2.duxiang['十二宫气机点']['十二宫']['长生']['阳干顺'] = '【哨兵卡】表被改过';
  CORE.init(b2);
  const c9 = CORE.buildChartAncient('亥', '甲', '子', '午');
  const g9 = gongOf(c9, '长生');
  const src2 = CORE.readXiangCard(c9, g9, '').filter((r) => r['label'] === '原文')[0];
  has(src2['source'], '【哨兵卡】', '改表后卡片原文行随之改变（真读表）');
  CORE.init(ruleBundle());
}

/* ---------------- R8 非法入参不崩、给原因 ─--------------- */
head('[R8] 非法入参：给一行原因，不抛错');
{
  CORE.init(ruleBundle());
  const c10 = CORE.buildChartAncient('亥', '甲', '子', '午');
  const rows = CORE.readXiangCard(c10, 'X', '');
  eq(rows.length, 1, '非法支只返回一行');
  truthy(rows[0]['tone'] === 'warn', '该行标警示色');
  truthy(rows[0]['text'].indexOf('不是合法地支') >= 0, '该行说明原因：' + rows[0]['text']);
}

console.log('');
if (FAIL > 0) {
  console.log('读象读数断言：不通过 ✗（' + FAIL + ' 项）');
  process.exit(1);
}
console.log('读象读数断言：通过 ✓（气机点/空亡三态/助日缘由 接得上、真读表、缺表不静默、我方陈述合规）');

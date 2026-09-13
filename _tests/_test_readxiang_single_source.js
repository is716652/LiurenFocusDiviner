/* ============================================================================
 * _test_readxiang_single_source.js —— 读数装配「单一真源」门禁（§14.4 收口后新增）
 * ----------------------------------------------------------------------------
 * 背景：点宫速查卡的内容装配原先在两端各有一份（真源 core/liuren/pan/dx.ts 与
 *   App 侧 model/ReadXiang.ets + ReadXiangData.ets），任一端改了另一端不动就是静默漂移。
 *   2026-09-13 收口为「引擎出数、App 出呈现」：装配只住引擎，App 只呈现引擎给的行。
 *   本门禁盯住三件事，且只盯「事实」不盯措辞：
 *     S1 单一真源：App 侧不得再出现读象装配实现（文件不存在、类不重新定义、无摊平层）
 *     S2 三端齐备：readXiangCard / qijiReading / zhuriWhy / cardRow 必须在
 *        真源 .ts、生成模块 pan/dx.ets、门面 LiurenCore.ets 三处同时存在
 *        （本次真实故障：FORWARD 里 palaceLookup 被整行复制 → 门面两个同名方法；
 *          以及生成模块缺方法而门面照旧转发）
 *     S3 消费契约：App 只经 LiurenCore.readXiangCard / LiurenCore.zhuriWhy 取数，
 *        卡片组件按引擎 cardRow 的四字段（label/text/source/tone）呈现
 * 用法：node _tests/_test_readxiang_single_source.js
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const APP = path.join(ROOT, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'ets');
const FREE = path.join(ROOT, 'APP', 'LiurenFocusDivinerFree', 'entry', 'src', 'main', 'ets');
const TSRC = path.join(ROOT, 'core', 'liuren', 'pan', 'dx.ts');
const ETS_DX = path.join(APP, 'model', 'pan', 'dx.ets');
const FACADE = path.join(APP, 'model', 'LiurenCore.ets');
const METHODS = ['readXiangCard', 'qijiReading', 'zhuriWhy', 'cardRow'];

let checked = 0;
const bad = [];
function ok(cond, what, detail) {
  checked++;
  if (!cond) bad.push(what + (detail ? '：' + detail : ''));
}
function readOr(p, dflt) {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : dflt;
}
function countOf(text, re) {
  return (text.match(re) || []).length;
}

/* ---------------- S1 单一真源 ---------------- */
for (const rel of [['model', 'ReadXiang.ets'], ['model', 'ReadXiangData.ets']]) {
  const p = path.join(APP, rel[0], rel[1]);
  ok(!fs.existsSync(p), 'S1 App 侧仍存在读象实现文件', rel[1]);
  const pf = path.join(FREE, rel[0], rel[1]);
  ok(!fs.existsSync(pf), 'S1 免费版仍存在读象实现文件', rel[1]);
}
/* 扫全 App 的 .ets：不得再定义装配类、不得再调摊平接口 */
function walkEts(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkEts(p, out);
    else if (/\.ets$/.test(e.name)) out.push(p);
  }
  return out;
}
const appEts = walkEts(APP);
for (const f of appEts) {
  const t = fs.readFileSync(f, 'utf-8');
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  ok(!/export\s+class\s+ReadXiang\b/.test(t), 'S1 仍定义读象装配类 ReadXiang', rel);
  ok(!/export\s+class\s+ReadXiangData\b/.test(t), 'S1 仍定义读象摊平类 ReadXiangData', rel);
  ok(!/ReadXiangData\s*\.\s*(fill|fillBasics)\s*\(/.test(t), 'S1 仍调用摊平接口', rel);
  ok(!/from\s+'[^']*\/ReadXiang(Data)?'/.test(t), 'S1 仍 import 旧读象模块', rel);
}
ok(appEts.length > 20, 'S1 扫描面异常：App .ets 文件数过少', String(appEts.length));

/* ---------------- S2 三端齐备 + 无重复 ---------------- */
const tsSrc = readOr(TSRC, '');
const etsDx = readOr(ETS_DX, '');
const facade = readOr(FACADE, '');
ok(tsSrc !== '', 'S2 真源缺失', 'core/liuren/pan/dx.ts');
ok(etsDx !== '', 'S2 生成模块缺失', 'model/pan/dx.ets');
ok(facade !== '', 'S2 门面缺失', 'model/LiurenCore.ets');
for (const m of METHODS) {
  const re = new RegExp('static\\s+' + m + '\\s*\\(', 'g');
  ok(countOf(tsSrc, new RegExp('static\\s+' + m + '\\s*\\(', 'g')) >= 1, 'S2 真源缺方法', m);
  ok(countOf(etsDx, new RegExp('static\\s+' + m + '\\s*\\(', 'g')) === 1,
    'S2 生成模块 pan/dx.ets 中 ' + m + ' 出现次数不为 1',
    String(countOf(etsDx, new RegExp('static\\s+' + m + '\\s*\\(', 'g'))));
  const nf = countOf(facade, new RegExp('static\\s+' + m + '\\s*\\(', 'g'));
  ok(nf === 1, 'S2 门面中 ' + m + ' 转发次数不为 1', String(nf));
  void re;
}
/* 门面里任何转发签名都不得重复（本次 palaceLookup 真实故障的守门断言） */
const seen = new Map();
for (const line of facade.split('\n')) {
  const m = /^\s*static\s+([A-Za-z_][\w]*)\s*\(/.exec(line);
  if (!m) continue;
  seen.set(m[1], (seen.get(m[1]) || 0) + 1);
}
for (const [name, n] of seen) {
  ok(n === 1, 'S2 门面同名转发重复', name + ' ×' + n);
}

/* ---------------- S3 消费契约 ---------------- */
const INDEX = path.join(APP, 'pages', 'Index.ets');
const CARD = path.join(APP, 'components', 'PalaceCard.ets');
const DL = path.join(APP, 'model', 'DataLoader.ets');
const idx = readOr(INDEX, '');
const card = readOr(CARD, '');
const dl = readOr(DL, '');
ok(/LiurenCore\s*\.\s*readXiangCard\s*\(/.test(idx), 'S3 Index 未经引擎取卡片行', 'LiurenCore.readXiangCard');
ok(/LiurenCore\s*\.\s*zhuriWhy\s*\(/.test(idx), 'S3 Index 未经引擎取助日缘由', 'LiurenCore.zhuriWhy');
ok(/@Prop\s+rows\s*:\s*Record<string,\s*string>\[\]/.test(card), 'S3 卡片组件未按引擎行类型呈现', 'Record<string, string>[]');
for (const k of ['label', 'text', 'source', 'tone']) {
  ok(new RegExp("r\\['" + k + "'\\]").test(card), 'S3 卡片组件未读取引擎字段', k);
}
ok(/旺衰休囚死|基础关系|十二宫气机点/.test(dl), 'S3 DataLoader 未读入读象所需的规则表');

/* ---------------- 结果 ---------------- */
if (bad.length === 0) {
  console.log('PASS  读数装配单一真源：S1 单一真源 / S2 三端齐备 / S3 消费契约（共 ' + checked + ' 项断言）');
  process.exit(0);
}
console.log('FAIL  读数装配单一真源（' + bad.length + '/' + checked + ' 项不成立）');
for (const b of bad) console.log('  ✗ ' + b);
process.exit(1);

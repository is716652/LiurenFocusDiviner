/* ============================================================================
 * case_facts.js —— 按「公历日期 + 占时」复算一张盘，打印断课需要的全部事实
 * ----------------------------------------------------------------------------
 * 用途：给某个具体占例（真事、古籍课例、用户实测反馈）取**可复算的盘面事实**，
 *       避免手排（本仓库已发生多次手排出入：日干支、月将、四课上下神）。
 * 只读：不写任何数据文件，不改 core/。
 *
 * 用法：
 *   node _tools/case_facts.js 2026-09-21 午
 *   node _tools/case_facts.js 1998-03-05 卯 > _tmp_case.txt
 *
 * 输出：日干支/月将/旬空 → 天地盘（列=地盘十二宫）→ 四课（含乘将、旺衰、空）
 *       → 三传（含宫位、乘将、气机）→ 神煞（按支）→ 毕法命中 → 关系与气机
 *
 * 与 _tests 同路径：日历/月将数据取 UI/_data（与 HTML 同序），引擎取 core/liuren-core.js。
 * 注意：_core_snapshot.js 里的日历过滤正则是 /^cal_\d0s\.js$/（只匹配省略写法），
 *       本脚本用 /^cal_\d{4}s\.js$/ —— 后者才是实际文件名。
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const UI = path.join(ROOT, 'UI', '_data');
const sandbox = { window: {}, console: { log: () => {}, warn: () => {}, error: () => {} } };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
const loadData = (f) => {
  const p = path.join(UI, f);
  if (!fs.existsSync(p)) return;
  vm.runInContext(fs.readFileSync(p, 'utf-8'), sandbox, { filename: f });
};
for (const f of ['duxiang_rules.js', 'duxiang_leixiang.js', 'shensha_rules.js', 'bifa.js', 'bifa_coach.js',
  'xingnian_score.js', 'guanlu_leishen.js', 'guanlu_xiangyi.js', 'zhan_shi.js']) loadData(f);
loadData('yj_all.js');
for (const f of fs.readdirSync(UI).filter((x) => /^cal_\d{4}s\.js$/.test(x))) loadData(f);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'core', 'liuren-core.js'), 'utf-8')
  + '\nglobalThis.__CORE = LiurenCore; globalThis.__YS = YongShenCore;', sandbox, { filename: 'liuren-core.js' });

const W = sandbox.window;
const C = sandbox.__CORE;
const YS = sandbox.__YS;
C.init({ duxiang: W.DUXIANG_RULES, shensha: W.SHENSHA_RULES, bifa: W.BIFA, xingnian: W.XN_SCORE });
YS.zhanShi = W.ZHANSHI || {};

const DATE = process.argv[2];
const HOUR = process.argv[3];
if (!DATE || !HOUR) {
  console.log('用法: node _tools/case_facts.js <YYYY-MM-DD> <时支，如 午>');
  process.exit(2);
}
const c = C.buildChart({ date: DATE, hourZhi: HOUR, calData: W.CAL, yjAll: W.YJ_ALL });
if (!c) { console.log('buildChart 返回 null（日期超出历法表或时辰非法）'); process.exit(1); }

const ZHI = C.ZHI;
const GANWX = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
const ZHIWX = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
const rel = (a, b) => (a === b ? '比和' : SHENG[a] === b ? a + '生' + b : SHENG[b] === a ? b + '生' + a
  : KE[a] === b ? a + '克' + b : KE[b] === a ? b + '克' + a : '?');
const L = [];
const P = (s) => L.push(s);
const jiangAtZhi = (z) => c.jiangMap[C.gongOf(c.tp, z)] || '—';
const nodeOf = (z) => c.dx.nodes[z] || {};

/* 占时：chart 内**不存**占时字段（占时只是 buildChart 的入参），
 * 而 r.ld 是「农历日」（如十一），r.lg 是「用事月将序号」—— 两者都不是占时。
 * 早期版本把 r.ld 印成"占时=N"，被误读为地支序号（2026-09-21 首用即踩：
 * 读到 11 以为是"第 11 位=戌"，于是把月将巳加在戌上，天盘正好重合，整课误判成伏吟；
 * 实际占时是调用时传入的午，月将巳加午、天盘各退一位，课体是元首）。
 * 这里直接用入参 HOUR，并断言它合法。 */
if (ZHI.indexOf(HOUR) < 0) {
  console.log('占时必须是十二支之一（子…亥），收到：' + HOUR);
  process.exit(2);
}
P('=== 起课 ' + DATE + ' ' + HOUR + '时 ===');
P('  年=' + c.r.ygc + '  月支=' + c.r.mz + '  日=' + c.r.dg + c.r.dz
  + '  月将=' + (c.yj ? c.yj.jiang + '(' + c.yj.zhi + '·' + c.yj.term + ')' : c.r.lg)
  + '  昼夜=' + (c.night ? '夜' : '昼') + '  贵人=' + c.gui + '(' + (c.shun ? '顺布' : '逆布') + ')');
P('  占时=' + HOUR + '（入参）  旬空=' + (c.dx.xunkong || []).join('、') + '  占时干=' + c.hourGan);
P('  （提醒：c.r.ld=' + c.r.ld + ' 是农历日、c.r.lg=' + c.r.lg + ' 是用事月将序号，二者都不是占时）');

/* 课体判定：由天盘与地盘的关系算出，不再由调用者凭印象认定 */
const TP_SAME = ZHI.every((g) => c.tp[g] === g);
const TP_CHONG = ZHI.every((g) => c.tp[g] === ZHI[(ZHI.indexOf(g) + 6) % 12]);
P('  课体=' + ((c.sanchuan && c.sanchuan.method) || '?') + '（天地盘'
  + (TP_SAME ? '重合 ⇒ 伏吟' : TP_CHONG ? '互冲 ⇒ 返吟' : '不重合、不互冲') + '）');

P('');
P('=== 天地盘（列 = 地盘十二宫，上南下北：午顶子底）===');
P('  地盘宫  : ' + ZHI.map((g) => String(g).padEnd(3)).join(''));
P('  天盘支  : ' + ZHI.map((g) => String(c.tp[g] || '').padEnd(3)).join(''));
P('  遁干(旬): ' + ZHI.map((g) => String(c.dunXun[g] || '□').padEnd(3)).join(''));
P('  天盘乘将: ' + ZHI.map((g) => String(c.jiangMap[g] || '—').padEnd(3)).join(''));
P('  （□ = 旬空之支，不配旬遁干）');

P('');
P('=== 四课（干→干阴→支→支阴）===');
const KE_NAME = ['第一课(干)', '第二课(干阴)', '第三课(支)', '第四课(支阴)'];
(c.kegs || []).forEach((k, i) => {
  const nu = nodeOf(k.x);
  P('  ' + KE_NAME[i] + ': 上神=' + k.x + '(' + ZHIWX[k.x] + ')  下神=' + k.s
    + '  上神乘将=' + jiangAtZhi(k.x)
    + '  旺衰=' + (nu.wangShuai || '?') + ' 气机=' + (nu.qiJi || '?') + ' 空=' + (nu.kong ? '空' : '—')
    + '  对上神/日干: ' + rel(ZHIWX[k.x], GANWX[c.r.dg]));
});

P('');
P('=== 三传（' + ((c.sanchuan || {}).method || '?') + '法）===');
((c.sanchuan || {}).chuans || []).forEach((x, i) => {
  const g = C.gongOf(c.tp, x.z);
  const nu = nodeOf(x.z);
  P('  ' + ['初', '中', '末'][i] + '传: ' + x.z + (x.gz ? '(' + x.gz + ')' : '')
    + '  地盘' + g + '宫  乘' + jiangAtZhi(x.z)
    + '  旺衰=' + (nu.wangShuai || '?') + ' 气机=' + (nu.qiJi || '?') + ' 空=' + (nu.kong ? '空' : '—')
    + '  对日干: ' + rel(ZHIWX[x.z], GANWX[c.r.dg]));
});

P('');
P('=== 神煞（按支）===');
const byZhi = (c.dx.shensha && c.dx.shensha.byZhi) || {};
ZHI.forEach((z) => { const v = byZhi[z]; if (v && v.length) P('  ' + z + ': ' + v.join('、')); });

P('');
P('=== 毕法命中 ===');
const bf = c.dx.bifa;
if (Array.isArray(bf) && bf.length) bf.forEach((b) => P('  ' + (b['序'] || '?') + '. ' + (b['法名'] || '') + ' —— ' + (b['判'] || '')));
else P('  （无命中）');

P('');
P('=== 月将 / 贵人 助日 ===');
P('  月将: ' + JSON.stringify(c.dx.yuejiang));
P('  贵人: ' + JSON.stringify(c.dx.guiren));

P('');
P('=== 关系表（冲/合/害/刑）===');
const R = c.dx.relations || {};
ZHI.forEach((z) => {
  const r = R[z];
  if (r) P('  ' + z + ': 冲' + (r.chong || '-') + ' 合' + (r.he || '-') + ' 害' + (r.hai || '-') + ' 刑' + ((r.xing || []).join('/') || '-'));
});

console.log(L.join('\n'));

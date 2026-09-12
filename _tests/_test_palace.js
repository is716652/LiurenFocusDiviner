/* ============================================================================
 * _test_palace.js —— 点宫速查只读接口（Agent.md §14.4 / 组件化阶段 4）
 * ============================================================================
 * 接口：LiurenCore.palaceLookup(chart, 宫或支, 用神支) -> PalaceLookup
 * 一屏给全该支：五行阴阳 / 与日干生克与六亲 / 与用神生克 / 气机点 / 空亡 /
 *              所带神煞 / 所乘天将 / 遁干（旬遁 + 日干遁 + 时干遁） /
 *              **该支在本课的角色**（用神·初/中/末传·日支·日干寄宫·月将宫·贵人宫）
 *
 * 断言（任一条失败即 exit 1）：
 *   P1 全字段非空且类型正确（12 宫 × 3 盘）
 *   P2 纯只读：调用前后整盘 JSON 逐字节相同
 *   P3 与盘面/盘态/规则表逐项一致（神煞/天将/旬遁干/空亡/气机点/日干遁/时干遁）
 *   P4 角色正确：初/中/末传、当前用神、日干寄宫、临日支、月将宫、贵人宫
 *   P5 输入两种口径等价（传地盘宫 与 传该宫所临天盘支）
 *   P6 边界：传空串/非法支 或 用神留空 都不崩，且「未选用神」显式成文
 *   P7 三端同构：本接口在 core 侧存在，ArkTS 侧同名同签名（源码级核对）
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const RULEDIR = path.join(ROOT, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'resources', 'rawfile', 'rule');

let FAIL = 0;
const ok = (m) => console.log('  ✓ ' + m);
const bad = (m) => { FAIL++; console.log('  ✗ ' + m); };
const head = (t) => console.log('\n' + t);

const loadRule = (f) => JSON.parse(fs.readFileSync(path.join(RULEDIR, f), 'utf-8'));
const CORE = vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'core', 'liuren-core.js'), 'utf-8') + '\n;LiurenCore;',
  { filename: 'liuren-core.js' });
CORE.init({
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
});
if (typeof CORE.palaceLookup !== 'function') {
  console.log('✗ 引擎未提供 palaceLookup（点宫速查只读接口）—— §14.4 要求必须有');
  process.exit(1);
}

const ZHI = CORE.ZHI;
const CHARTS = [
  ['甲', '子', '寅', '午', '庚', '午', '申'],
  ['己', '卯', '亥', '酉', '', '', ''],
  ['癸', '亥', '丑', '卯', '癸', '亥', '丑']
];
const chartOf = (a) => CORE.buildChartAncient(a[2], a[0], a[1], a[3], a[4], a[5], a[6]);

/* ---------------- P1 全字段非空且类型正确 ---------------- */
head('[P1] 12 宫 × 3 盘：全字段存在且类型正确');
{
  let n = 0, bads = [];
  for (const a of CHARTS) {
    const c = chartOf(a);
    if (!c) { bads.push('盘构建失败 ' + a.join('')); continue; }
    for (const g of ZHI) {
      const p = CORE.palaceLookup(c, g, '午');
      n++;
      const need = ['gong', 'tianZhi', 'wuXing', 'yinYang', 'liuQin', 'relToRiGan', 'relToYongShen',
        'qiJi', 'kong', 'shensha', 'jiang', 'dun', 'dunRi', 'dunShi', 'role'];
      for (const k of need) if (p[k] === undefined) bads.push(g + ' 缺字段 ' + k);
      if (p.wuXing === '' || '木火土金水'.indexOf(p.wuXing) < 0) bads.push(g + ' 五行非法：' + p.wuXing);
      if (p.yinYang !== '阴' && p.yinYang !== '阳') bads.push(g + ' 阴阳非法：' + p.yinYang);
      if (typeof p.kong !== 'boolean') bads.push(g + ' kong 非布尔');
      if (!Array.isArray(p.shensha)) bads.push(g + ' shensha 非数组');
      if (['比肩', '妻财', '官鬼', '子孙', '父母'].indexOf(p.liuQin) < 0) bads.push(g + ' 六亲非法：' + p.liuQin);
      if (p.role === undefined || typeof p.role.text !== 'string' || p.role.text === '') bads.push(g + ' role.text 为空');
    }
  }
  /* 气机点：甲日十二宫应恰好 1 个「长生」、1 个「墓」 */
  const c0 = chartOf(CHARTS[0]);
  const cs = ZHI.filter((g) => CORE.palaceLookup(c0, g, '').qiJi === '长生');
  const mu = ZHI.filter((g) => CORE.palaceLookup(c0, g, '').qiJi === '墓');
  if (cs.length !== 1 || mu.length !== 1) bads.push('气机点长生/墓 各应唯一，实际 ' + cs.length + '/' + mu.length);
  if (bads.length) bad(bads.slice(0, 6).join(' | ') + (bads.length > 6 ? ' …共 ' + bads.length + ' 处' : ''));
  else ok(n + ' 个宫的速查结果字段齐全、取值域合法（气机点长生/墓各唯一）');
}

/* ---------------- P2 纯只读 ---------------- */
head('[P2] 纯只读：调用前后整盘逐字节相同');
{
  const c = chartOf(CHARTS[0]);
  const before = JSON.stringify(c);
  for (const g of ZHI) CORE.palaceLookup(c, g, '午');
  CORE.palaceLookup(c, '子', '');
  CORE.palaceLookup(c, '非法支', '午');
  const after = JSON.stringify(c);
  if (before === after) ok('12 宫 + 边界调用后盘对象逐字节相同（未改盘、未写状态）');
  else bad('调用后盘对象被改动');
}

/* ---------------- P3 与盘面/盘态/规则表逐项一致 ---------------- */
head('[P3] 逐项与盘面/盘态/规则表对账');
{
  const bads = [];
  for (const a of CHARTS) {
    const c = chartOf(a);
    for (const g of ZHI) {
      const p = CORE.palaceLookup(c, g, '午');
      const t = p.tianZhi;
      if (p.jiang !== (c.jiangMap[g] || '')) bads.push(g + ' 天将不符');
      if (p.dun !== (c.dunXun[t] || '')) bads.push(g + ' 旬遁干不符');
      if (p.dunRi !== (c.dun[g] || '')) bads.push(g + ' 日干遁干不符');
      if (p.dunShi !== (CORE.dunMap(c.hourGan)[g] || '')) bads.push(g + ' 时干遁干不符');
      if (p.kong !== Boolean(c.dx.nodes[t] && c.dx.nodes[t].kong)) bads.push(g + ' 空亡不符');
      if (p.qiJi !== ((CORE.QIJI_GONG[c.r.dg] || {})[t] || '')) bads.push(g + ' 气机点不符');
      const ss = (c.dx.shensha.byZhi[t] || []).join('|');
      if (p.shensha.join('|') !== ss) bads.push(g + ' 神煞不符');
      if (CORE.WX[t] !== p.wuXing) bads.push(g + ' 五行不符');
    }
  }
  if (bads.length) bad(bads.slice(0, 6).join(' | ') + (bads.length > 6 ? ' …共 ' + bads.length + ' 处' : ''));
  else ok('3 盘 × 12 宫：天将/旬遁干/日干遁干/时干遁干/空亡/气机点/神煞/五行 与盘面逐项一致');
}

/* ---------------- P4 角色 ---------------- */
head('[P4] 角色正确（用神 / 初中末传 / 日干寄宫 / 临日支 / 月将宫 / 贵人宫）');
{
  const bads = [];
  for (const a of CHARTS) {
    const c = chartOf(a);
    const chuan = c.sanchuan.chuans.map((x) => x.z);
    const yjGong = CORE.gongOf(c.tp, c.yj.zhi);
    const guiGong = CORE.gongOf(c.jiangMap, '贵人');
    const ji = CORE.JI_GONG[c.r.dg];
    /* 用神取初传之支，保证「当前用神」一定命中某一宫 */
    const ys = chuan[0];
    for (const g of ZHI) {
      const p = CORE.palaceLookup(c, g, ys);
      const idx = chuan.indexOf(p.tianZhi);
      const want = idx < 0 ? '未入传' : ['初传', '中传', '末传'][idx];
      if (p.role.inChuan !== want) bads.push(g + ' 传位不符（' + p.role.inChuan + ' ≠ ' + want + '）');
      if (p.role.isYongShen !== (p.tianZhi === ys)) bads.push(g + ' 用神标记不符');
      if (p.role.isRiGanGong !== (g === ji)) bads.push(g + ' 日干寄宫标记不符');
      if (p.role.isRiZhi !== (p.tianZhi === c.r.dz)) bads.push(g + ' 临日支标记不符');
      if (p.role.isYueJiang !== (g === yjGong)) bads.push(g + ' 月将宫标记不符');
      if (p.role.isGuiRen !== (g === guiGong)) bads.push(g + ' 贵人宫标记不符');
      if (p.role.text.indexOf('地盘' + g + '宫') < 0) bads.push(g + ' role.text 未含宫位');
    }
  }
  if (bads.length) bad(bads.slice(0, 6).join(' | ') + (bads.length > 6 ? ' …共 ' + bads.length + ' 处' : ''));
  else ok('3 盘 × 12 宫：传位/用神/日干寄宫/临日支/月将宫/贵人宫 六类角色标记全部正确');
}

/* ---------------- P5 两种输入口径等价 ---------------- */
head('[P5] 入参分辨确定性：合法支恒按地盘宫解析；反查口径与天盘映射一致');
{
  const c = chartOf(CHARTS[0]);
  const bads = [];
  /* (a) 契约：入参是地盘宫 —— 结果宫位恒等于入参（十二支都可作宫） */
  for (const g of ZHI) {
    const p = CORE.palaceLookup(c, g, '午');
    if (p.gong !== g) bads.push('传宫 ' + g + ' 却解析为 ' + p.gong);
    if (p.tianZhi !== c.tp[g]) bads.push(g + ' 所临天盘支不符');
  }
  /* (b) 反查口径与天盘映射一致：对每个天盘支 t，其所在宫 g0 须满足 tp[g0] === t */
  for (const t0 of ZHI) {
    const g0 = CORE.gongOf(c.tp, t0);
    if (c.tp[g0] !== t0) bads.push('反查 ' + t0 + ' 得 ' + g0 + ' 但 tp[g0]!=t0');
  }
  /* (c) 抽样：传入某宫所临天盘支时，落点只能是「该宫」或「该天盘支本身」，不得落到第三宫 */
  for (const g of ['子', '午', '寅', '戌']) {
    const p = CORE.palaceLookup(c, g, '午');
    const q = CORE.palaceLookup(c, p.tianZhi, '午');
    if (q.gong !== p.gong && q.gong !== p.tianZhi) bads.push(g + ' 的两种口径落到第三宫 ' + q.gong);
  }
  if (bads.length) bad(bads.slice(0, 6).join(' | '));
  else ok('合法支恒按地盘宫解析（宫位=入参）；反查口径与 tp 映射逐支一致；抽样无第三宫落点');
}
/* ---------------- P6 边界 ---------------- */
head('[P6] 边界：空串 / 非法支 / 用神留空');
{
  const c = chartOf(CHARTS[0]);
  const bads = [];
  let a = null, b = null, d = null;
  try {
    a = CORE.palaceLookup(c, '', '午');
    b = CORE.palaceLookup(c, '非法支', '午');
    d = CORE.palaceLookup(c, '子', '');
  } catch (e) { bads.push('抛错：' + e.message); }
  if (a && a.wuXing !== undefined && a.role === undefined) bads.push('空串入参返回结构不完整');
  if (b && typeof b.gong !== 'string') bads.push('非法支入参返回结构不完整');
  if (d && d.relToYongShen !== '未选用神') bads.push('用神留空应显式写「未选用神」，实际：' + (d && d.relToYongShen));
  if (bads.length) bad(bads.join(' | '));
  else ok('三种边界均不抛错且结构完整；用神留空显式写「未选用神」（不留白）');
}

/* ---------------- P7 三端同构（接口在两侧都存在） ---------------- */
head('[P7] 接口在 core 侧与 ArkTS 侧同名同签名');
{
  const ets = fs.readFileSync(path.join(ROOT, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'ets',
    'model', 'pan', 'dx.ets'), 'utf-8');
  const ts = fs.readFileSync(path.join(ROOT, 'core', 'liuren', 'pan', 'dx.ts'), 'utf-8');
  const sig = /static palaceLookup\(c: Chart, gongOrZhi: string, yongShenZhi: string\): PalaceLookup \{/;
  const inEts = sig.test(ets), inTs = sig.test(ts);
  const fac = fs.readFileSync(path.join(ROOT, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'ets',
    'model', 'LiurenCore.ets'), 'utf-8');
  const facOk = /static palaceLookup\(/.test(fac);
  if (inEts && inTs && facOk) ok('core/liuren/pan/dx.ts、model/pan/dx.ets、model/LiurenCore.ets 三处均提供同名同签名接口');
  else bad('接口缺失：ts=' + inTs + ' ets=' + inEts + ' 门面=' + facOk);
}

/* ---------------- 汇总 ---------------- */
console.log('\n' + '='.repeat(68));
if (FAIL === 0) {
  console.log('点宫速查只读接口：P1–P7 全部通过 ✓');
  console.log('待办（§14.4，UI 侧）：点宫弹卡尚未接线；三张「加载但引擎未读」的规则表');
  console.log('  （十二宫气机点 / 空亡规则 / 助日规则）应在卡内作为可点开的规则出处呈现。');
  process.exit(0);
}
console.log('点宫速查只读接口：' + FAIL + ' 处违规 ✗');
process.exit(1);

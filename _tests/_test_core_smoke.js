/* ============================================================================
 * _test_core_smoke.js —— 改造后冒烟测试
 *   1) 从改造后的 HTML 提取内联 <script>（无 src 的脚本块）写入 _inline_script_check.js，
 *      供 `node --check` 做语法校验（在 pwsh 里另行执行）
 *   2) 加载 core/liuren-core.js + 真实规则/历法数据 → LiurenCore.init → buildChart
 *      （与 HTML 薄包装同参：date/hourZhi/calData/yjAll）
 *   3) 打印并断言 dx 字段齐全：xunkong/dayWangShuai/nodes/relations/yuejiang/
 *      guiren/shensha(byZhi,list)/bifa，以及用神候选需要的 jiangMap/dun/tp/sanchuan
 * 用法：node _test_core_smoke.js
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'UI', '_data');
const HTML = path.join(ROOT, 'UI', '大六壬万年历起课.html');
const CORE_JS = path.join(ROOT, 'core', 'liuren-core.js');
const OUT_CHECK = path.join(__dirname, '_inline_script_check.js');

/* ---------------- 1. 提取内联脚本（供 node --check） ---------------- */
const html = fs.readFileSync(HTML, 'utf8');
const m = html.match(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/);
if (!m) {
  throw new Error('未找到内联 <script> 块');
}
const inlineSrc = m[1];
fs.writeFileSync(OUT_CHECK, inlineSrc, 'utf8');
console.log('[语法] 内联 <script> 已提取 -> ' + OUT_CHECK + '（' + inlineSrc.length + ' 字节），请运行 node --check');

/* ---------------- 2. 同一 vm 上下文：window + 历法 + 规则 + 核心 ---------------- */
const ctx = { window: {}, console: console };
vm.createContext(ctx);
for (const f of ['yj_all.js', 'cal_2020s.js', 'duxiang_rules.js', 'shensha_rules.js', 'bifa.js']) {
  vm.runInContext(fs.readFileSync(path.join(DATA, f), 'utf8'), ctx);
}
vm.runInContext(fs.readFileSync(CORE_JS, 'utf8') + '\nglobalThis.__LiurenCore = LiurenCore;', ctx);
vm.runInContext('__LiurenCore.init({ duxiang: window.DUXIANG_RULES, shensha: window.SHENSHA_RULES, bifa: window.BIFA });', ctx);

/* ---------------- 3. buildChart 冒烟（HTML 薄包装同参） ---------------- */
const samples = [
  ['2026-01-08', '酉'],
  ['2026-08-15', '酉'],
  ['2024-02-29', '午']
];
let fail = 0;
for (const [d, h] of samples) {
  const c = vm.runInContext(
    '__LiurenCore.buildChart({ date: "' + d + '", hourZhi: "' + h + '", calData: window.CAL, yjAll: window.YJ_ALL })', ctx);
  if (!c) {
    console.log('FAIL ' + d + ' ' + h + '时：buildChart 返回 null');
    fail++;
    continue;
  }
  const dx = c.dx;
  const required = {
    'chart.r': !!c.r, 'chart.tp': !!c.tp, 'chart.kegs': !!c.kegs, 'chart.dun': !!c.dun,
    'chart.sanchuan': !!c.sanchuan, 'chart.jiangMap': !!c.jiangMap, 'chart.gui': !!c.gui,
    'chart.hourGan': !!c.hourGan,
    'dx.xunkong': Array.isArray(dx.xunkong) && dx.xunkong.length === 2,
    'dx.monthZhi': !!dx.monthZhi, 'dx.dayWangShuai': !!dx.dayWangShuai,
    'dx.nodes[12]': !!dx.nodes && Object.keys(dx.nodes).length === 12,
    'dx.relations[12]': !!dx.relations && Object.keys(dx.relations).length === 12,
    'dx.yuejiang.zhi/gong/zhu': !!(dx.yuejiang && dx.yuejiang.zhi && dx.yuejiang.gong),
    'dx.guiren.zhi/zhu': !!(dx.guiren && dx.guiren.zhi),
    'dx.shensha.byZhi[12]': !!dx.shensha && !!dx.shensha.byZhi && Object.keys(dx.shensha.byZhi).length === 12,
    'dx.shensha.list': Array.isArray(dx.shensha && dx.shensha.list),
    'dx.bifa 数组': Array.isArray(dx.bifa)
  };
  let bad = [];
  for (const [k, ok] of Object.entries(required)) {
    if (!ok) bad.push(k);
  }
  // 用神候选所需（UI 直接用）：jiangMap 反查 + dun 遁干 + 动态三传
  const yongshenZhi = vm.runInContext(
    '__LiurenCore.gongOf(' + JSON.stringify(c.tp) + ', ' + JSON.stringify(c.kegs[0].x) + ')', ctx);
  console.log('--- 样本 ' + d + ' ' + h + '时 ---');
  console.log('  宗门: ' + c.sanchuan.method + ' | 三传: ' + c.sanchuan.chuans.map(x => x.gz).join(' ') +
    ' | 日干: ' + c.r.dg + c.r.dz + ' | 月将: ' + c.yj.zhi + '(' + c.yj.term + ')');
  console.log('  dx.xunkong: ' + dx.xunkong.join('') + ' | dayWangShuai: ' + dx.dayWangShuai +
    ' | 月将助日: ' + dx.yuejiang.zhu + ' | 贵人助日: ' + dx.guiren.zhu);
  console.log('  dx.bifa 序: [' + dx.bifa.map(h2 => h2['序']).join(',') + ']');
  console.log('  shensha 数: ' + dx.shensha.list.length + ' | 用神候选用 jiangMap@' + c.kegs[0].x + ' 宫: ' + yongshenZhi);
  if (bad.length) {
    console.log('  FAIL 缺字段: ' + bad.join(', '));
    fail++;
  } else {
    console.log('  PASS 字段齐全');
  }
}
console.log('');
console.log('冒烟: ' + (samples.length - fail) + '/' + samples.length + ' 样本 buildChart 正常、dx 字段齐全');
process.exitCode = fail === 0 ? 0 : 1;

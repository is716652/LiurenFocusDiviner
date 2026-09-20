/* 临时：为「剧情补录样张」复算一个真实案例的盘面事实（只读，不改任何数据）
 * 取事实的方式与 _tests/_test_case_story.js 完全一致，保证样张里的锚点必然可复算。 */
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
const id = process.argv[2] || 'xu_cibin_laiyi_jiazi';
const item = cases.filter((c) => c.id === id)[0];
if (!item) { console.log('未找到案例 ' + id); process.exit(1); }
console.log('=== 案例 ' + item.id);
console.log('  title   : ' + item.title);
console.log('  source  : ' + JSON.stringify(item.source));
console.log('  topics  : ' + JSON.stringify(item.topics));
console.log('  focus   : ' + JSON.stringify(item.focus).slice(0, 160));
console.log('  input   : ' + JSON.stringify(item.input));
console.log('  summary : ' + JSON.stringify(item.summary).slice(0, 200));
console.log('  original: ' + JSON.stringify(item.original));
const inp = item.input;
const c = LiurenCore.buildChartAncient(inp.mj, inp.dg, inp.dz, inp.hour, inp.yearGan || inp.yg || '', inp.yearZhi || inp.yz || '', inp.monthZhi || '');
console.log('=== 引擎复算（与 _test_case_story.js 同一路径）');
console.log('  课体 kegs  : ' + c.kegs.map((k) => k.x + '/' + k.s).join('  '));
console.log('  三传       : ' + c.sanchuan.chuans.map((x, i) => ['初', '中', '末'][i] + '=' + x.z + (x.gz ? '(' + x.gz + ')' : '')).join('  '));
console.log('  三传乘将   : ' + c.sanchuan.chuans.map((x) => x.z + '→' + (c.jiangMap[LiurenCore.gongOf(c.tp, x.z)] || '')).join('  '));
console.log('  日干/日支  : ' + c.r.dg + ' / ' + c.r.dz + '   月将/占时: ' + inp.mj + ' / ' + inp.hour);
console.log('  旬空       : ' + JSON.stringify((c.dx && c.dx.xunkong) ? c.dx.xunkong : null).slice(0, 120));
const byZhi = (c.dx.shensha && c.dx.shensha.byZhi) ? c.dx.shensha.byZhi : {};
console.log('  神煞(按支) : ' + Object.keys(byZhi).slice(0, 14).map((z) => z + '[' + (byZhi[z] || []).join('、') + ']').join(' '));
try {
  const ws = LiurenCore.wangT();
  console.log('  旺衰表(日干): ' + JSON.stringify((ws[inp.dg] || {})).slice(0, 200));
} catch (e) { console.log('  旺衰表: ' + e.message); }
console.log('  节点空亡   : ' + Object.keys(c.dx.nodes || {}).filter((z) => c.dx.nodes[z].kong).join('、'));
console.log('  助日       : 月将=' + JSON.stringify(c.dx.yuejiang && { z: c.dx.yuejiang.z, gong: c.dx.yuejiang.gong, zhu: c.dx.yuejiang.zhu }) + '  贵人=' + JSON.stringify(c.dx.guiren && { z: c.dx.guiren.z, zhu: c.dx.guiren.zhu }));

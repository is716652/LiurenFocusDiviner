/* 临时：为第一批 6 案导出「原文 + 既有结论 + 引擎复算事实」，供撰写剧情使用（只读） */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.join(__dirname, '..');
vm.runInThisContext(fs.readFileSync(path.join(root, 'core', 'liuren-core.js'), 'utf-8'), { filename: 'liuren-core.js' });
const RB = path.join(root, 'APP/LiurenFocusDiviner/entry/src/main/resources/rawfile');
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
const byId = {};
for (const c of cases) byId[c.id] = c;
const IDS = ['xu_cibin_laiyi_jiazi', 'renzhan_jiazi_005_fanli_wuwang', 'renzhan_jiazi_013_shao_liunian',
  'renzhan_bingyin_035_miao_guansong', 'renzhan_bingyin_038_liu_xingren', 'renzhan_yichou_021_chen_huishi'];
for (const id of IDS) {
  const it = byId[id];
  const inp = it.input || {};
  const c = LiurenCore.buildChartAncient(inp.mj, inp.dg, inp.dz, inp.hour, inp.yearGan || '', inp.yearZhi || '', inp.monthZhi || '');
  const chuans = c.sanchuan.chuans.map((x) => x.z);
  const jiangAt = (z) => c.jiangMap[LiurenCore.gongOf(c.tp, z)] || '';
  const byZhi = (c.dx.shensha && c.dx.shensha.byZhi) ? c.dx.shensha.byZhi : {};
  const ws = (LiurenCore.wangT() || {})[inp.dg] || {};
  const kong = Object.keys(c.dx.nodes || {}).filter((z) => c.dx.nodes[z].kong);
  console.log('\n########## ' + id);
  console.log('title   : ' + it.title);
  console.log('source  : ' + JSON.stringify(it.source) + '  topics: ' + JSON.stringify(it.topics));
  console.log('input   : ' + JSON.stringify(inp) + '  focus: ' + JSON.stringify(it.focus));
  console.log('original: ' + it.original);
  console.log('summary : ' + it.summary);
  console.log('expect  : ' + JSON.stringify(it.expect));
  const rs = (it.reasoning || []).map((r) => typeof r === 'string' ? r : (r.claim || r.text || JSON.stringify(r)));
  console.log('reasoning(' + rs.length + '): ' + rs.map((s) => String(s).slice(0, 70)).join(' ｜ '));
  console.log('复算    : 课体 ' + c.kegs.map((k) => k.x + '/' + k.s).join(' ')
    + ' ｜ 三传 ' + chuans.map((z, i) => ['初', '中', '末'][i] + z).join('')
    + ' ｜ 乘将 ' + chuans.map((z) => z + '乘' + (jiangAt(z) || '?')).join(' ')
    + ' ｜ 旬空 ' + (kong.join('、') || '无'));
  console.log('         日干旺衰 ' + inp.dg + '在' + inp.monthZhi + '月=' + (ws[inp.monthZhi] || '?')
    + ' ｜ 神煞 ' + Object.keys(byZhi).filter((z) => (byZhi[z] || []).length).map((z) => z + '[' + byZhi[z].join('、') + ']').join(' '));
}

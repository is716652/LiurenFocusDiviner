/* ============================================================================
 * story_pan.js —— 剧情盘面速查（**只读**）：为「做剧情演绎」列出一案可用的全部锚点素材
 * ----------------------------------------------------------------------------
 * 与 case_story_facts.js 的分工：
 *   case_story_facts.js = 断课视角（四课/三传/乘将/旺衰/神煞/毕法，供写断语）
 *   本工具             = **做剧情视角**：把盘面整理成"可以点在哪儿"的清单，
 *                        并把每条线索可能要引用的 (kind, ref) 直接列出来。
 *
 * 用法：node _tools/story_pan.js <案例 id> [<案例 id> ...]
 *       node _tools/story_pan.js duanan_200_zhixian_shiwu
 *
 * 锚点 kind（与 case_story.json / ouyu_cases.json 同构，App 侧只认这 10 种）：
 *   method（课体，无 ref） / chuan(+pos,ref) / keg(ref="上/下") / jiang(ref="支/将")
 *   hour(ref) / gong(ref) / zhi(ref) / xunkong(ref) / shensha(ref="支/神煞名") / dayWangShuai(ref)
 *
 * 注意
 *   · 天将一律**以引擎为准**（伏吟等特殊课的天将排布易手推错）；
 *   · 癸日、伏吟案这类"日干寄宫与日支同位"的，四课会重复，属正常。
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const UI = path.join(ROOT, 'UI', '_data');
const RAW = path.join(ROOT, 'APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/ancient');

const sandbox = { window: {}, console: { log: () => {}, warn: () => {}, error: () => {} } };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
const loadData = (f) => {
  const p = path.join(UI, f);
  if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf-8'), sandbox, { filename: f });
};
for (const f of ['duxiang_rules.js', 'duxiang_leixiang.js', 'shensha_rules.js', 'bifa.js',
  'bifa_coach.js', 'xingnian_score.js', 'guanlu_leishen.js', 'guanlu_xiangyi.js', 'zhan_shi.js']) loadData(f);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'core', 'liuren-core.js'), 'utf-8')
  + '\nglobalThis.__CORE = LiurenCore;', sandbox, { filename: 'liuren-core.js' });
const C = sandbox.__CORE;
C.init({ duxiang: sandbox.window.DUXIANG_RULES, shensha: sandbox.window.SHENSHA_RULES,
  bifa: sandbox.window.BIFA, xingnian: sandbox.window.XN_SCORE });

const ZHI = C.ZHI;
const gallery = JSON.parse(fs.readFileSync(path.join(RAW, 'case_gallery.json'), 'utf-8'));

const ids = process.argv.slice(2);
if (ids.length === 0) {
  console.log('用法: node _tools/story_pan.js <案例 id> [...]');
  process.exit(2);
}

for (const id of ids) {
  const c = gallery.find((x) => x.id === id);
  if (!c) {
    console.log('!! 无此案: %s', id);
    continue;
  }
  const i = c.input;
  const ch = C.buildChartAncient(i.mj, i.dg, i.dz, i.hour,
    i.yearGan ? i.yearGan : '', i.yearZhi ? i.yearZhi : '', i.monthZhi ? i.monthZhi : '');
  console.log('\n' + '='.repeat(78));
  console.log('【%s】%s', id, c.title);
  if (!ch) {
    console.log('!! 排盘失败');
    continue;
  }
  console.log('占类 %s ｜ 课体 method=%s keti=%s',
    (c.topics || []).join('/'), ch.sanchuan.method, ch.sanchuan.keti || '(空)');

  /* 十二宫：地盘 → 天盘支、乘将、神煞 */
  console.log('\n-- 天地盘（宫 = 地盘十二宫）--');
  console.log('  地盘  天盘  乘将    神煞');
  for (const g of ZHI) {
    const t = ch.tp[g];
    const j = ch.jiangMap[g] || '—';
    const ss = (ch.dx.shensha && ch.dx.shensha.byZhi && ch.dx.shensha.byZhi[t]) ? ch.dx.shensha.byZhi[t].join('、') : '';
    console.log('   %s    %s    %-6s  %s', g, t, j, ss);
  }

  /* 四课 */
  console.log('\n-- 四课（下 → 上）--');
  ch.kegs.forEach((k, n) => {
    const gong = C.gongOf(ch.tp, k.x);
    console.log('   第%d课  %s/%s   上神%s 乘%s（占%s宫）', n + 1, k.x, k.s, k.x,
      ch.jiangMap[gong] || '—', gong);
  });

  /* 三传 */
  console.log('\n-- 三传 --');
  const POS = ['初传', '中传', '末传'];
  ch.sanchuan.chuans.forEach((x, n) => {
    const gong = C.gongOf(ch.tp, x.z);
    const xk = (ch.dx.xunkong || []).indexOf(x.z) >= 0 ? ' 【旬空】' : '';
    const ss = (ch.dx.shensha && ch.dx.shensha.byZhi && ch.dx.shensha.byZhi[x.z]) ? ch.dx.shensha.byZhi[x.z].join('、') : '';
    console.log('   %s %s(%s) 乘%s（占%s宫）%s  %s', POS[n], x.z, x.gz,
      ch.jiangMap[gong] || '—', gong, xk, ss);
  });

  /* 其他事实 */
  console.log('\n-- 其他 --');
  console.log('   旬空 %s ｜ 日干旺衰 %s', (ch.dx.xunkong || []).join(''), ch.dx.dayWangShuai);
  console.log('   日干 %s 寄宫 %s ｜ 日支 %s ｜ 月将 %s ｜ 占时 %s',
    ch.r.dg, C.JI_GONG[ch.r.dg], ch.r.dz, i.mj, i.hour);

  /* 锚点素材清单：直接给出 10 种 kind 各自可填什么 */
  console.log('\n-- 锚点素材（做线索时从这里挑）--');
  console.log('   method      : %s', ch.sanchuan.keti || ch.sanchuan.method);
  ch.sanchuan.chuans.forEach((x, n) => {
    const gong = C.gongOf(ch.tp, x.z);
    console.log('   chuan       : pos="%s" ref="%s"   ｜ jiang ref="%s/%s"',
      POS[n], x.z, x.z, ch.jiangMap[gong] || '—');
  });
  ch.kegs.forEach((k, n) => {
    console.log('   keg         : ref="%s/%s"（第%d课 上/下）', k.x, k.s, n + 1);
  });
  console.log('   hour        : ref="%s"（占时）', i.hour);
  /* 乘将**全表**：只给三传那三行会诱人凭记忆写别的支 —— 曾因此把「太常乘酉」错写成
     「太常乘子」。锚点 jiang 的 ref 一律是「天盘支/将」 */
  const jiangList = [];
  for (const z of ZHI) {
    const j = ch.jiangMap[C.gongOf(ch.tp, z)] || '';
    if (j !== '') jiangList.push(z + '/' + j);
  }
  console.log('   jiang       : %s', jiangList.join('  '));
  const zhiWithSha = [];
  for (const z of ZHI) {
    const ss = (ch.dx.shensha && ch.dx.shensha.byZhi && ch.dx.shensha.byZhi[z]) ? ch.dx.shensha.byZhi[z] : [];
    for (const s of ss) zhiWithSha.push(z + '/' + s);
  }
  console.log('   shensha     : %s', zhiWithSha.join('  '));
  console.log('   xunkong     : ref="%s"', (ch.dx.xunkong || []).join('" ref="'));
  console.log('   zhi / gong  : 任意十二支（ref 直接写该支；gong 写地盘宫）');
  console.log('   dayWangShuai: ref="%s"（日干在月令的旺衰）', ch.dx.dayWangShuai);
}

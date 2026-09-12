/* ============================================================================
 * _core_snapshot.js —— 引擎全量行为快照（组件化结构改动的回归证据）
 * ----------------------------------------------------------------------------
 * 目的：组件化是**纯结构改动**，行为必须逐字节不变。本脚本把 LiurenCore /
 * YongShenCore 的全部公开入口在固定输入空间上跑一遍，产出分区哈希快照：
 *   node _tools/_core_snapshot.js            # 与 _tests/_data/core_snapshot.json 比对
 *   node _tools/_core_snapshot.js --freeze   # 冻结基线（须在任何改动之前做）
 * 比对通过 = 定法 / 盘态 / 神煞 / 毕法 / 中黄 / 读象 / 历法入口 全部输出未变。
 *
 * 数据来源与 HTML 加载顺序一致（UI/_data/*.js），规则包与 DataLoader 口径一致。
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const UI = path.join(ROOT, 'UI');
const SNAP = path.join(ROOT, '_tests', '_data', 'core_snapshot.json');
const FREEZE = process.argv.includes('--freeze');

/* ---------------- 1. 引擎 + 宿主数据（与 HTML 同序） ---------------- */
const sandbox = { window: {}, console: { log: () => {}, warn: () => {}, error: () => {} } };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
for (const f of ['duxiang_rules.js', 'duxiang_leixiang.js', 'shensha_rules.js', 'bifa.js', 'bifa_coach.js',
  'xingnian_score.js', 'guanlu_leixiang.js', 'guanlu_xiangyi.js', 'zhan_shi.js']) {
  const p = path.join(UI, '_data', f);
  if (!fs.existsSync(p)) continue;
  vm.runInContext(fs.readFileSync(p, 'utf-8'), sandbox, { filename: f });
}
for (const f of ['yj_all.js'].concat(fs.readdirSync(path.join(UI, '_data')).filter((x) => /^cal_\d0s\.js$/.test(x)))) {
  vm.runInContext(fs.readFileSync(path.join(UI, '_data', f), 'utf-8'), sandbox, { filename: f });
}
vm.runInContext(fs.readFileSync(path.join(ROOT, 'core', 'liuren-core.js'), 'utf-8')
  + '\nglobalThis.__CORE = LiurenCore; globalThis.__YS = YongShenCore;', sandbox, { filename: 'liuren-core.js' });

const W = sandbox.window;
const CORE = sandbox.__CORE;
const YS = sandbox.__YS;
CORE.init({ duxiang: W.DUXIANG_RULES, shensha: W.SHENSHA_RULES, bifa: W.BIFA, xingnian: W.XN_SCORE });
YS.zhanShi = W.ZHANSHI || {};
const LEIXIANG = W.DUXIANG_LEIXIANG;
const XIANGYI = W.GUANLU_XIANGYI;
const COACH = W.BIFA_COACH || {};
const CAL = W.CAL || {};
const YJA = W.YJ_ALL || [];

const GAN = CORE.GAN, ZHI = CORE.ZHI;

/* ---------------- 2. 快照骨架 ---------------- */
const SECTIONS = [];
let cur = null;
function section(name) {
  if (cur) SECTIONS.push({ name: cur.name, n: cur.n, hash: cur.h.digest('hex') });
  cur = { name: name, n: 0, h: crypto.createHash('sha256') };
}
function put(v) { cur.n++; cur.h.update(typeof v === 'string' ? v : JSON.stringify(v)); cur.h.update('\n'); }

function chartOf(mj, dg, dz, hour, yg, yz, mz) {
  return CORE.buildChartAncient(mj, dg, dz, hour, yg || '', yz || '', mz || '');
}
/* 盘面全景（Chart 的每个可序列化字段） */
function full(c) {
  if (!c) return 'null';
  return JSON.stringify([
    c.r.d, c.r.dg, c.r.dz, c.r.mg, c.r.mz,
    (typeof c.r.ygc === 'string' ? c.r.ygc : (c.r.ygc && c.r.ygc.z) || ''),
    c.r.lg, c.r.ld, c.r.st,
    c.yj.jiang, c.yj.zhi, c.yj.term,
    c.sanchuan.method, c.sanchuan.keti, c.sanchuan.chuans.map((x) => x.z + ':' + x.gz),
    c.kegs.map((k) => k.x + '/' + k.s),
    Object.keys(c.tp).sort().map((k) => k + '=' + c.tp[k]),
    Object.keys(c.dun).sort().map((k) => k + '=' + c.dun[k]),
    Object.keys(c.dunXun).sort().map((k) => k + '=' + c.dunXun[k]),
    Object.keys(c.jiangMap).sort().map((k) => k + '=' + c.jiangMap[k]),
    c.gui, c.shun, c.night, c.hourGan,
    c.dx.xunkong.slice().sort(), c.dx.monthZhi, c.dx.dayWangShuai,
    Object.keys(c.dx.nodes).sort().map((z) => z + ':' + c.dx.nodes[z].wangShuai + '/' + c.dx.nodes[z].qiJi + '/' + c.dx.nodes[z].kong),
    Object.keys(c.dx.relations).sort().map((z) => z + ':' + c.dx.relations[z].chong + '/' + c.dx.relations[z].he + '/' + c.dx.relations[z].hai + '/' + (c.dx.relations[z].xing || []).join('')),
    JSON.stringify(c.dx.yuejiang), JSON.stringify(c.dx.guiren),
    Object.keys(c.dx.shensha.byZhi).sort().map((z) => z + ':' + c.dx.shensha.byZhi[z].join('+')),
    c.dx.shensha.list.map((x) => x.name + '/' + x.zhi + '/' + x.ji + '/' + x.conf),
    (c.dx.bifa || []).map((x) => x['序'] + ':' + x['法名'])
  ]);
}

/* ---------------- 3. 常量表 ---------------- */
section('常量表');
for (const k of ['GAN', 'ZHI', 'JI_GONG', 'WX', 'WXG', 'KE', 'GUIREN', 'JIANG_ORDER', 'JIANG_DAY_HOURS',
  'JIANG_SHUN_GONGS', 'MAOXING_ANCHOR', 'BA_ZHUAN_STEP', 'JINGLAN_SHE', 'ZI_XING', 'BENSHEN', 'JIANG_JX',
  'JIANG_WARN', 'XN_SCORE_DEFAULT', 'YANG_ZHI', 'G_YANG', 'XUN_KONG', 'YUE_LING', 'QIJI_GONG', 'ZHI_GONG',
  'XUN_OF', 'EMPTY_NODE', 'MA_ZHI', 'XING_MAP', 'HE_GAN', 'QIAN_SANHE']) {
  put('const:' + k + '=' + JSON.stringify(CORE[k]));
}
put('YS.zhanShi=' + JSON.stringify(YS.zhanShi));

/* ---------------- 4. 基础工具 ---------------- */
section('基础工具');
for (const a of GAN.concat(ZHI)) {
  put(['SHENG', a, CORE.SHENG(a)]);
  put(['wxOf', a, CORE.wxOf(a)]);
  put(['wutun', a, CORE.wutun(a)]);
  for (const b of GAN.concat(ZHI)) put(['ke', a, b, CORE.ke(a, b)]);
}
for (const dg of GAN) for (const hz of ZHI) put(['hourGan', dg, hz, CORE.hourGan(dg, hz)]);
for (const mz of ZHI) put(['yuejiangForMonth', mz, CORE.yuejiangForMonth(mz)]);
for (const dg of GAN) for (const dz of ZHI) {
  put(['xunDun', dg, dz, CORE.xunDun(dg, dz)]);
  put(['dunMap', dg, CORE.dunMap(dg)]);
  put(['validGanZhi', dg, dz, CORE.validGanZhi(dg, dz)]);
  for (const mj of ZHI) put(['validYuejiangForMonth', dz, mj, CORE.validYuejiangForMonth(dz, mj)]);
}
for (const off of [0, 1, 3, 5, 6, 7, 11]) {
  const tp = {};
  ZHI.forEach((z, i) => { tp[z] = ZHI[(i + off) % 12]; });
  for (const z of ZHI) put(['gongOf', off, z, CORE.gongOf(tp, z)]);
}

/* ---------------- 5. 全枚举 8640 盘 ---------------- */
section('全枚举盘');
let chartN = 0;
for (const dg of GAN) for (const dz of ZHI) {
  if (!CORE.validGanZhi(dg, dz)) continue;
  for (const mj of ZHI) for (const hour of ZHI) { put(full(chartOf(mj, dg, dz, hour))); chartN++; }
}
console.log('  全枚举盘数：' + chartN);

/* ---------------- 6. 天将布列 ---------------- */
section('天将布列');
for (const dg of GAN) for (const mj of ZHI) for (const hour of ZHI) {
  const tp = {};
  const zi = ZHI.indexOf(mj), zs = ZHI.indexOf(hour);
  ZHI.forEach((z, i) => { tp[z] = ZHI[(zi + (i - zs) + 12) % 12]; });
  put(['buildJiang', dg, mj, hour, CORE.buildJiang(dg, tp, hour)]);
}

/* ---------------- 7. 带年干支/月支（神煞 / 旺衰分支） ---------------- */
section('带年干支月支');
const YGZ = [['', '', ''], ['甲', '子', '寅'], ['庚', '午', '申'], ['辛', '酉', '卯'], ['癸', '亥', '丑']];
for (const dg of GAN) for (const dz of ZHI) {
  if (!CORE.validGanZhi(dg, dz)) continue;
  for (const mj of ZHI) for (const hour of [ZHI[0], ZHI[3], ZHI[6], ZHI[9]]) {
    for (const g of YGZ) put(['ygz', dg, dz, mj, hour, g.join(''), full(chartOf(mj, dg, dz, hour, g[0], g[1], g[2]))]);
  }
}

/* ---------------- 8. 中黄 ---------------- */
section('中黄');
for (const dg of GAN) for (const dz of ZHI) {
  if (!CORE.validGanZhi(dg, dz)) continue;
  for (const mj of [ZHI[0], ZHI[5], ZHI[11]]) for (const hour of ZHI) {
    const c = chartOf(mj, dg, dz, hour);
    if (!c) continue;
    put(['zhDun', dg, dz, mj, hour, CORE.zhonghuangDun(c, hour)]);
    put(['zhAnalyze', dg, dz, mj, hour, CORE.zhonghuangAnalyze(c, hour)]);
  }
}

/* ---------------- 9. 毕法 / 渲染 / 教练 ---------------- */
section('毕法');
for (const dg of GAN) for (const dz of ZHI) {
  if (!CORE.validGanZhi(dg, dz)) continue;
  for (const mj of [ZHI[0], ZHI[4], ZHI[8]]) for (const hour of ZHI) {
    const c = chartOf(mj, dg, dz, hour, '甲', '子', '寅');
    if (!c) continue;
    const hits = CORE.bifaForChuans(c, c.sanchuan.chuans);
    put(['hits', dg, dz, mj, hour, hits]);
    put(['coach', dg, dz, mj, hour, CORE.bifaCoach(hits, COACH)]);
    for (const aff of ['求财', '婚姻', '疾病', '行人', '']) {
      put(['render', dg, dz, mj, hour, aff, CORE.renderBifaForChuans(c, c.dx, c.sanchuan.chuans, aff)]);
      put(['renderAll', dg, dz, mj, hour, aff, CORE.renderBifa(c, c.dx, aff)]);
    }
    for (const z of ZHI) {
      const chu = YS.dongtai(c, z).map((x) => ({ z: x.zhi, gz: x.gz }));
      put(['dyn', dg, dz, mj, hour, z, CORE.bifaForChuans(c, chu)]);
    }
  }
}

/* ---------------- 10. 神煞 / 年命 / 行年 / 抓用神 / 读象 ---------------- */
section('神煞行年用神读象');
const AFFS = YS.affairs();
for (const dg of GAN) for (const dz of ZHI) {
  if (!CORE.validGanZhi(dg, dz)) continue;
  for (const mj of [ZHI[1], ZHI[6], ZHI[10]]) for (const hour of [ZHI[2], ZHI[8]]) {
    const c = chartOf(mj, dg, dz, hour, '庚', '午', '申');
    if (!c) continue;
    put(['shensha', dg, dz, mj, hour, CORE.computeShensha(c)]);
    for (const yz of ZHI) put(['nianming', dg, dz, mj, hour, yz, CORE.nianmingAdvice(c, yz, ZHI[3])]);
    for (const by of [1980, 1990, 2000]) for (const g of ['男', '女']) for (const ys of ['', ZHI[0], ZHI[7]]) {
      put(['xingnian', dg, dz, mj, hour, by, g, ys, CORE.xingNian(c, by, 2026, g, ys)]);
    }
    for (const aff of AFFS) {
      const cands = YS.candidates(c, aff);
      put(['affairs', aff.name, aff.liuqin, aff.jiang, aff.zhi, aff.note, aff.guMenlei, aff.scene, aff.info]);
      put(['cands', dg, dz, mj, hour, aff.name, cands]);
      for (const z of [ZHI[0], ZHI[5], ZHI[9]]) {
        put(['liuqinOf', dg, dz, mj, hour, z, YS.liuqinOf(c, z)]);
        put(['dongtai', dg, dz, mj, hour, z, YS.dongtai(c, z)]);
        put(['jieDian', dg, dz, mj, hour, z, YS.jieDianWords(c, z, LEIXIANG)]);
        for (const tick of [0, 1, 3]) {
          put(['duyu', dg, dz, mj, hour, aff.name, z, tick, YS.selectDuyu(c, aff, cands, z, XIANGYI, tick, '')]);
        }
      }
      put(['duyuOf', aff.name, YS.duyuOf(aff.name)]);
    }
    put(['affairByName', YS.affairByName('求财')]);
    put(['findCand', YS.findCand(YS.candidates(c, AFFS[0]), ZHI[2])]);
  }
}

/* ---------------- 11. 历法入口 buildChart / findYuejiang ---------------- */
section('buildChart历法');
const DATES = ['2020-01-01', '2021-06-15', '2022-12-31', '2024-02-29', '2026-09-12', '2029-11-07'];
for (const d of DATES) for (const hz of ZHI) {
  put(['buildChart', d, hz, full(CORE.buildChart({ date: d, hourZhi: hz, calData: CAL, yjAll: YJA }))]);
  put(['findYuejiang', d, hz, CORE.findYuejiang(d, hz, YJA)]);
}

/* ---------------- 12. 汇总 ---------------- */
if (cur) SECTIONS.push({ name: cur.name, n: cur.n, hash: cur.h.digest('hex') });
const total = SECTIONS.reduce((a, s) => a + s.n, 0);
const overall = crypto.createHash('sha256').update(SECTIONS.map((s) => s.name + ':' + s.n + ':' + s.hash).join('\n')).digest('hex');

if (FREEZE) {
  fs.writeFileSync(SNAP, JSON.stringify({ 说明: '引擎全量行为快照（_tools/_core_snapshot.js）', 条目: total, 总哈希: overall, 分区: SECTIONS }, null, 1), 'utf-8');
  console.log('已冻结基线：' + SNAP);
  for (const s of SECTIONS) console.log('  ' + s.name.padEnd(20) + String(s.n).padStart(8) + '  ' + s.hash.slice(0, 16));
  console.log('总哈希 ' + overall + '（' + total + ' 条）');
  process.exit(0);
}
if (!fs.existsSync(SNAP)) { console.log('缺基线：先跑 --freeze'); process.exit(2); }
const base = JSON.parse(fs.readFileSync(SNAP, 'utf-8'));
let bad = 0;
const names = [];
for (const s of base.分区) names.push(s.name);
for (const s of SECTIONS) if (names.indexOf(s.name) < 0) names.push(s.name);
for (const n of names) {
  const a = base.分区.find((s) => s.name === n), b = SECTIONS.find((s) => s.name === n);
  if (!a || !b) { console.log('✗ 分区缺失 ' + n); bad++; continue; }
  if (a.hash !== b.hash || a.n !== b.n) {
    console.log('✗ ' + n + ' 改变：基线 ' + a.n + ' 条/' + a.hash.slice(0, 16) + ' → 现在 ' + b.n + ' 条/' + b.hash.slice(0, 16));
    bad++;
  } else console.log('✓ ' + n.padEnd(20) + String(b.n).padStart(8) + ' 条  ' + b.hash.slice(0, 16));
}
if (base.总哈希 === overall) {
  console.log('\n快照比对：**逐条一致** ✓  总哈希 ' + overall + '（' + total + ' 条）');
  process.exit(0);
}
console.log('\n快照比对：**不一致** ✗  基线 ' + base.总哈希 + ' → 现在 ' + overall + '（' + bad + ' 个分区变化）');
process.exit(1);

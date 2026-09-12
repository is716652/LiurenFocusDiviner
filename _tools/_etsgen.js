/* ============================================================================
 * _ets_build.js —— ArkTS 侧组件化【唯一入口】（可重复执行）
 * ----------------------------------------------------------------------------
 *   1) 取基线单体（tag v1.0.4-pre-componentize 的 model/LiurenCore.ets）
 *   2) 按**显式成员→模块映射表**切出各成员（边界由花括号配平确定，不靠行号/位置）
 *   3) 生成 model/pan/*.ets + model/{bifa,zhonghuang}.ets（export class）
 *   4) 生成门面 model/LiurenCore.ets（模块别名 + 常量绑定 + 方法转发 + 类型 re-export）
 *   5) 结构自检（花括号配平 / import 齐备 / 类型齐备）
 *
 * 纪律：纯结构改动 —— 成员体逐字搬移；跨模块引用一律经门面 LiurenCore（与 .ts 侧同口径），
 *       故 A6 三端同构成立（三端函数体逐行相同）。
 * 用法：node _tools/_ets_build.js
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC_REL = 'APP/LiurenFocusDiviner/entry/src/main/ets/model/LiurenCore.ets';
const MODEL = path.join(ROOT, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'ets', 'model');
const BASE_TAG = 'v1.0.4-pre-componentize';

/* ---------- 模块（顺序＝文件里列出顺序） ---------- */
const MODULES = [
  ['types', null, 'pan/types.ets', 'pan/types —— 数据结构（export interface 集中定义）',
    '原单体顶部 interface 段原样搬入；ArkTS 原生 import/export。'],
  ['base', 'LrBase', 'pan/liuren-const.ets', 'pan/liuren-const —— 最基础常量与五行工具（公共底座）',
    '干支表 / 五行 / 寄宫 / 相克 / 反查等被全部模块共用。'],
  ['xunkong', 'LrXunkong', 'pan/xunkong.ets', 'pan/xunkong —— 旬空',
    '不变量：旬遁下空亡支不配干；旬表 甲子戌亥 … 甲寅子丑。'],
  ['jiang', 'LrJiang', 'pan/jiang.ets', 'pan/jiang —— 十二天将（昼夜贵 / 顺逆 / 乘将）',
    '不变量：规范 JSON《十二天神与贵人》；将序恒定，逆布只改方向。'],
  ['dungan', 'LrDungan', 'pan/dungan.ets', 'pan/dungan —— 遁干（旬遁 / 日干遁 / 时干）',
    '不变量：《五子元遁法》；旬遁为传统默认层。'],
  ['sanchuan', 'LrSanchuan', 'pan/sanchuan.ets', 'pan/sanchuan —— 九宗门·三传取用（含涉害顺数＋复等）',
    '不变量：规范《三传排法》；传本锚点见 _tests/_test_sanchuan_spec.js。'],
  ['sike', 'LrSike', 'pan/sike.ets', 'pan/sike —— 四课（干→干阴→支→支阴）',
    '本站是四课的唯一归属：两个起盘入口原先各自内联的四行四课，抽为 sikeOf 单一实现。'],
  ['tiandipan', 'LrTiandipan', 'pan/tiandipan.ets', 'pan/tiandipan —— 天地盘与主起盘入口',
    '不变量：规范《天地盘的天盘地支排法》。'],
  ['shensha', 'LrShensha', 'pan/shensha.ets', 'pan/shensha —— 神煞起法（查规则表）',
    '不变量：《地盘本位神煞.md》。'],
  ['dx', 'LrDx', 'pan/dx.ets', 'pan/dx —— 盘态（旺衰 / 气机点 / 关系 / 助日 / 年命 / 行年）',
    '不变量：旺衰休囚死规则；只读宿主注入的规则表。'],
  ['bifa', 'LrBifa', 'bifa.ets', 'bifa —— 毕法赋一百法命中 / 定位渲染 / 教练层',
    '不变量：一百法规则（数据由宿主注入）。'],
  ['zhonghuang', 'LrZhonghuang', 'zhonghuang.ets', 'zhonghuang —— 中黄五变经（二次遁 / 变干主线 / 建合检测）',
    '不变量：经文与两份中黄口径文档。']
];
const MOD = {};
for (const m of MODULES) MOD[m[0]] = m;
const CLS_FILE = {};
for (const m of MODULES) if (m[1]) CLS_FILE[m[1]] = m[2];

const CONST_BIND = [
  ['LrBase', ['GAN', 'ZHI', 'JI_GONG', 'WX', 'WXG', 'KE', 'GUIREN', 'YANG_ZHI', 'G_YANG']],
  ['LrJiang', ['JIANG_ORDER', 'JIANG_DAY_HOURS', 'JIANG_SHUN_GONGS', 'BENSHEN', 'JIANG_JX', 'JIANG_WARN']],
  ['LrSanchuan', ['MAOXING_ANCHOR', 'BA_ZHUAN_STEP', 'JINGLAN_SHE', 'ZI_XING', 'MA_ZHI', 'XING_MAP', 'HE_GAN', 'QIAN_SANHE']],
  ['LrDx', ['XN_SCORE_DEFAULT', 'YUE_LING', 'QIJI_GONG', 'ZHI_GONG', 'EMPTY_NODE']],
  ['LrShensha', ['XUN_KONG']],
  ['LrXunkong', ['XUN_OF']]
];

/* ---------- 成员 → 模块（显式映射，不依赖物理位置） ---------- */
const MEMBER = {
  'SHENG': 'base', 'gongOf': 'base', 'wxOf': 'base', 'ke': 'base',
  'buildJiang': 'jiang',
  'wutun': 'dungan', 'hourGan': 'dungan', 'xunDun': 'dungan', 'dunMap': 'dungan',
  'validGanZhi': 'sanchuan', 'resolveSanchuan': 'sanchuan',
  'findYuejiang': 'tiandipan', 'findDayRec': 'tiandipan', 'buildChart': 'tiandipan',
  'yuejiangForMonth': 'tiandipan', 'validYuejiangForMonth': 'tiandipan', 'buildChartAncient': 'tiandipan',
  'computeShensha': 'shensha',
  'EMPTY_NODE': 'dx',
  'wangT': 'dx', 'yearZhiOf': 'dx', 'findZhiOfGong': 'dx', 'computeDuxiang': 'dx', 'withDx': 'dx',
  'nianmingAdvice': 'dx', 'xingNian': 'dx',
  'bifaForChuans': 'bifa', 'renderBifaForChuans': 'bifa', 'renderBifa': 'bifa', 'bifaCoach': 'bifa',
  'zhonghuangDun': 'zhonghuang', 'zhonghuangAnalyze': 'zhonghuang'
};
/* 常量段：同段成员连续，按花括号配平整体搬移 */
const CONST_SECTION = [
  ['base', 'GAN', 'GUIREN'],
  ['jiang', 'JIANG_ORDER', 'JIANG_SHUN_GONGS'],
  ['sanchuan', 'MAOXING_ANCHOR', 'ZI_XING'],
  ['jiang', 'BENSHEN', 'JIANG_JX'],
  ['jiang', 'JIANG_WARN', 'JIANG_WARN'],
  ['dx', 'XN_SCORE_DEFAULT', 'XN_SCORE_DEFAULT'],
  ['base', 'YANG_ZHI', 'G_YANG'],
  ['sanchuan', 'XING_MAP', 'MA_ZHI'],
  ['shensha', 'XUN_KONG', 'XUN_KONG'],
  ['dx', 'YUE_LING', 'YUE_LING'],
  ['dx', 'QIJI_GONG', 'QIJI_GONG'],
  ['dx', 'ZHI_GONG', 'ZHI_GONG'],
  ['xunkong', 'XUN_OF', 'XUN_OF']
];

/* ---------- 读基线与边界 ---------- */
const L = execFileSync('git', ['show', BASE_TAG + ':' + SRC_REL], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 })
  .toString('utf-8').replace(/\r\n/g, '\n').split('\n');
console.log('[1] 基线 ' + BASE_TAG + ':' + SRC_REL + '（' + L.length + ' 行）');
function braceSpan(startLine) {
  let depth = 0, seen = false;
  for (let i = startLine; i <= L.length; i++) {
    for (const c of L[i - 1]) { if (c === '{') { depth++; seen = true; } else if (c === '}') depth--; }
    if (seen && depth === 0) return i;
  }
  throw new Error('未配平 start=' + startLine);
}
const TYPES_START = (() => { for (let i = 0; i < L.length; i++) if (/^export interface /.test(L[i])) return i + 1; throw new Error('no interface'); })();
const TYPES_END = (() => {
  let last = TYPES_START;
  for (let i = 0; i < L.length; i++) if (/^(export )?interface [A-Za-z_]/.test(L[i])) last = i + 1;
  return braceSpan(last);
})();
const SEG_TYPES = L.slice(TYPES_START - 1, TYPES_END).join('\n');
const CLASS_START = (() => { for (let i = 0; i < L.length; i++) if (/^export class LiurenCore \{/.test(L[i])) return i + 1; throw new Error('no class'); })();
const CLASS_END = braceSpan(CLASS_START);
console.log('    interface ' + TYPES_START + '-' + TYPES_END + '；类体 ' + CLASS_START + '-' + CLASS_END);
function leadOf(declLine) {
  let s = declLine;
  for (let i = declLine - 1; i >= CLASS_START; i--) {
    if (/^\s*(\/\*|\*|\/\/)/.test(L[i - 1])) { s = i; continue; }
    break;
  }
  return s;
}
function declLineOf(name) {
  const re = new RegExp('^  (?:private |public )?static (?:readonly )?' + name + '\\b');
  const hits = [];
  for (let i = CLASS_START; i <= CLASS_END; i++) if (re.test(L[i - 1])) hits.push(i);
  if (hits.length === 0) throw new Error('未找到成员 ' + name);
  if (hits.length > 1) throw new Error('成员不唯一 ' + name + ' @' + hits.join(','));
  return hits[0];
}
const memberText = (name) => L.slice(leadOf(declLineOf(name)) - 1, braceSpan(declLineOf(name))).join('\n');
const constText = (a, b) => L.slice(leadOf(declLineOf(a)) - 1, braceSpan(declLineOf(b))).join('\n')
  .replace(/^  private static /gm, '  static ');

/* ---------- 组装 ---------- */
const bodyOf = {};
const put = (mod, text) => { (bodyOf[mod] = bodyOf[mod] || []).push(text); };
for (const [mod, a, b] of CONST_SECTION) put(mod, constText(a, b));
for (const name of Object.keys(MEMBER)) put(MEMBER[name], memberText(name));
put('sike', [
  '  /* 四课：干→干阴→支→支阴（规范《四课排法》）',
  '     原 buildChart / buildChartAncient 各自内联的四行，抽为唯一实现（等价抽取，判定不变） */',
  '  static sikeOf(tp: Record<string, string>, dg: string, dz: string): Keg[] {',
  '    const g1 = tp[LiurenCore.JI_GONG[dg]];',
  '    const g2 = tp[g1];',
  '    const g3 = tp[dz];',
  '    const g4 = tp[g3];',
  '    return [',
  '      { x: g1, s: dg },',
  '      { x: g2, s: g1 },',
  '      { x: g3, s: dz },',
  '      { x: g4, s: g3 }',
  '    ];',
  '  }'
].join('\n'));
const SIKE_CUTS = [
  ['    /* 四课 */', '    const g1 = tp[LiurenCore.JI_GONG[dg]];', '    const g2 = tp[g1];',
    '    const g3 = tp[dz];', '    const g4 = tp[g3];', '    const kegs: Keg[] = [',
    '      { x: g1, s: dg },', '      { x: g2, s: g1 },', '      { x: g3, s: dz },',
    '      { x: g4, s: g3 }', '    ];'].join('\n'),
  ['    /* 四课 */', '    const g1 = tp[LiurenCore.JI_GONG[r.dg]];', '    const g2 = tp[g1];',
    '    const g3 = tp[r.dz];', '    const g4 = tp[g3];', '    const kegs: Keg[] = [',
    '      { x: g1, s: r.dg },', '      { x: g2, s: g1 },', '      { x: g3, s: r.dz },',
    '      { x: g4, s: g3 }', '    ];'].join('\n')
];
bodyOf['tiandipan'] = bodyOf['tiandipan'].map((txt) => {
  let out = txt;
  for (let i = 0; i < SIKE_CUTS.length; i++) {
    if (out.indexOf(SIKE_CUTS[i]) < 0) continue;
    out = out.replace(SIKE_CUTS[i], i === 0
      ? '    const kegs: Keg[] = LrSike.sikeOf(tp, dg, dz);'
      : '    const kegs: Keg[] = LrSike.sikeOf(tp, r.dg, r.dz);');
  }
  return out;
});
{
  const EXTRAS = path.join(__dirname, '_ets_extras_dx.txt');
  if (fs.existsSync(EXTRAS)) bodyOf['dx'].push(fs.readFileSync(EXTRAS, 'utf-8').replace(/\n+$/, ''));
  else { console.log('    !! 缺 _tools/_ets_extras_dx.txt，请先跑 node _tools/_ets_extras.js'); process.exit(1); }
}

/* ---------- 写文件 ---------- */
function header(title, note) {
  return '/* ============================================================================\n'
    + ' * ' + title + '\n'
    + ' * ----------------------------------------------------------------------------\n'
    + note.split('\n').map((s) => ' * ' + s).join('\n') + '\n'
    + ' * 由单体 LiurenCore.ets 按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。\n'
    + ' * ArkTS：原生 import/export；跨模块引用经门面 LiurenCore（与 .ts 侧同口径）。\n'
    + ' * 重新生成：node _tools/_ets_build.js（勿手改本文件）\n'
    + ' * ==========================================================================*/';
}
function relTo(target, selfPath) {
  const tPan = target.indexOf('pan/') === 0, sPan = selfPath.indexOf('pan/') === 0;
  if (sPan && tPan) return './' + target.slice(4, -4);
  if (sPan && !tPan) return '../' + target.slice(0, -4);
  if (!sPan && tPan) return './pan/' + target.slice(4, -4);
  return './' + target.slice(0, -4);
}
const TYPE_EXTRA = ['RuleHealthItem', 'PalaceRole', 'PalaceLookup'];   /* types.ets 里声明，供 UI 使用 */
const ALL_TYPES = (() => {
  const out = [];
  for (const m of SEG_TYPES.matchAll(/^(?:export )?interface ([A-Za-z_][\w]*)/gm)) out.push(m[1]);
  return out.concat(TYPE_EXTRA);
})();
function importsFor(cls, body, selfPath) {
  const lines = [], cl = [];
  for (const c of Object.keys(CLS_FILE)) {
    if (c === cls) continue;
    if (new RegExp('\\b' + c + '\\.').test(body)) cl.push("import { " + c + " } from '" + relTo(CLS_FILE[c], selfPath) + "';");
  }
  if (/\bLiurenCore\./.test(body)) cl.push("import { LiurenCore } from '" + relTo('LiurenCore.ets', selfPath) + "';");
  const used = ALL_TYPES.filter((n) => new RegExp('\\b' + n + '\\b').test(body));
  if (used.length) {
    lines.push('import type {');
    lines.push('  ' + used.join(', '));
    lines.push("} from '" + relTo('pan/types.ets', selfPath) + "';");
  }
  return lines.concat(cl.sort()).join('\n');
}
function writeFile(rel, text) {
  const abs = path.join(MODEL, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, text.replace(/\n*$/, '\n'), 'utf-8');
  return text.split('\n').length - 1;
}
{
  const body = SEG_TYPES.split('\n').map((l) => (l.indexOf('interface ') === 0 ? 'export ' + l : l)).join('\n');
  const ADD = ['', '/* 规则表健康项（引擎侧自述：缺表 / 表在但无条目 / 正常）—— §14 纪律用 */',
    'export interface RuleHealthItem {', '  key: string;', '  label: string;', '  loaded: boolean;',
    '  entries: number;', '  note: string;', '}', '', '/* 该支在本课的角色（点宫速查卡用） */',
    'export interface PalaceRole {', '  asGong: string;', '  inChuan: string;', '  isYongShen: boolean;',
    '  isRiGanGong: boolean;', '  isRiZhi: boolean;', '  isYueJiang: boolean;', '  isGuiRen: boolean;',
    '  text: string;', '}', '', '/* 点宫速查卡（只读）—— 点天地盘任一宫 → 该支的盘面全貌 */',
    'export interface PalaceLookup {', '  gong: string;', '  tianZhi: string;', '  wuXing: string;',
    '  yinYang: string;', '  liuQin: string;', '  relToRiGan: string;', '  relToYongShen: string;',
    '  qiJi: string;', '  kong: boolean;', '  shensha: string[];', '  jiang: string;', '  dun: string;',
    '  dunRi: string;', '  dunShi: string;', '  role: PalaceRole;', '}', ''].join('\n');
  console.log('[2] pan/types.ets'.padEnd(22) + writeFile('pan/types.ets',
    header(MOD['types'][3], MOD['types'][4]) + '\n\n' + body + ADD) + ' 行');
}
for (const m of MODULES) {
  if (m[0] === 'types') continue;
  /* 跨模块经门面调用/被门面转发的原 private 成员一律提升为 public（与 .ts 侧同一批，非逻辑改动） */
  const body = (bodyOf[m[0]] || []).join('\n\n').replace(/^  private static /gm, '  static ');
  const text = header(m[3], m[4]) + '\n\n' + importsFor(m[1], body, m[2]) + '\n\nexport class ' + m[1] + ' {\n' + body + '\n}\n';
  console.log('    ' + m[2].padEnd(20) + writeFile(m[2], text) + ' 行');
}

/* ---------- 门面 ---------- */
const FORWARD = {
  LrBase: ['static SHENG(a: string): string { return LrBase.SHENG(a); }',
    'static wxOf(x: string): string { return LrBase.wxOf(x); }',
    'static ke(a: string, b: string): boolean { return LrBase.ke(a, b); }',
    'static gongOf(tp: Record<string, string>, z: string): string { return LrBase.gongOf(tp, z); }'],
  LrDungan: ['static wutun(g: string): string { return LrDungan.wutun(g); }',
    'static hourGan(dg: string, hz: string): string { return LrDungan.hourGan(dg, hz); }',
    'static xunDun(dg: string, dz: string): Record<string, string> { return LrDungan.xunDun(dg, dz); }',
    'static dunMap(dg: string): Record<string, string> { return LrDungan.dunMap(dg); }'],
  LrJiang: ['static buildJiang(dg: string, tp: Record<string, string>, hourZhi: string): JiangBuild { return LrJiang.buildJiang(dg, tp, hourZhi); }'],
  LrSanchuan: ['static validGanZhi(gan: string, zhi: string): boolean { return LrSanchuan.validGanZhi(gan, zhi); }',
    'static resolveSanchuan(dg: string, tp: Record<string, string>, kegs: Keg[], dunChuan: Record<string, string>): SanChuan { return LrSanchuan.resolveSanchuan(dg, tp, kegs, dunChuan); }'],
  LrSike: ['static sikeOf(tp: Record<string, string>, dg: string, dz: string): Keg[] { return LrSike.sikeOf(tp, dg, dz); }',
    'static buildSiKe(tp: Record<string, string>, dg: string, dz: string): Keg[] { return LrSike.sikeOf(tp, dg, dz); }'],
  LrTiandipan: ['static findYuejiang(dateStr: string, hourZhi: string, yjAll: YueJiangSeg[]): YueJiangState { return LrTiandipan.findYuejiang(dateStr, hourZhi, yjAll); }',
    'static yuejiangForMonth(monthZhi: string): string { return LrTiandipan.yuejiangForMonth(monthZhi); }',
    'static validYuejiangForMonth(monthZhi: string, mjZhi: string): boolean { return LrTiandipan.validYuejiangForMonth(monthZhi, mjZhi); }',
    'static findDayRec(date: string, calData: Record<string, DayRec[]>): DayRec | null { return LrTiandipan.findDayRec(date, calData); }',
    'static buildChart(input: ChartInput): Chart | null { return LrTiandipan.buildChart(input); }',
    'static buildChartAncient(mjZhi: string, dg: string, dz: string, hourZhi: string, yearGan: string = "", yearZhi: string = "", monthZhi: string = ""): Chart | null {',
    '  return LrTiandipan.buildChartAncient(mjZhi, dg, dz, hourZhi, yearGan, yearZhi, monthZhi);',
    '}'],
  LrShensha: ['static computeShensha(c: ChartCore): ShenshaResult { return LrShensha.computeShensha(c); }'],
  LrDx: ['static wangT(): Record<string, Record<string, string>> { return LrDx.wangT(); }',
    'static yearZhiOf(r: DayRec): string { return LrDx.yearZhiOf(r); }',
    'static findZhiOfGong(qj: Record<string, string>, gong: string): string { return LrDx.findZhiOfGong(qj, gong); }',
    'static withDx(c: ChartCore, dx: Duxiang): Chart { return LrDx.withDx(c, dx); }',
    'static computeDuxiang(c: ChartCore): Duxiang { return LrDx.computeDuxiang(c); }',
    'static nianmingAdvice(c: Chart, nianZhi: string, yongShenZhi: string): NianmingAdvice { return LrDx.nianmingAdvice(c, nianZhi, yongShenZhi); }',
    'static xingNian(c: Chart, birthYear: number, currentYear: number, gender: string, yongShenZhi: string): XingNianResult { return LrDx.xingNian(c, birthYear, currentYear, gender, yongShenZhi); }',
    'static palaceLookup(c: Chart, gongOrZhi: string, yongShenZhi: string): PalaceLookup { return LrDx.palaceLookup(c, gongOrZhi, yongShenZhi); }'],
  LrBifa: ['static bifaForChuans(c: Chart, chu: Chuan[]): BifaHit[] { return LrBifa.bifaForChuans(c, chu); }',
    'static renderBifaForChuans(c: ChartCore, dx: Duxiang, chu: Chuan[], aff: string): BifaDetail[] { return LrBifa.renderBifaForChuans(c, dx, chu, aff); }',
    'static renderBifa(c: ChartCore, dx: Duxiang, aff: string): BifaDetail[] { return LrBifa.renderBifa(c, dx, aff); }',
    'static bifaCoach(hits: BifaHit[], coachData: Record<string, Object>): CoachResult { return LrBifa.bifaCoach(hits, coachData); }'],
  LrZhonghuang: ['static zhonghuangDun(c: ChartCore, hourZhi: string): ZhonghuangDun { return LrZhonghuang.zhonghuangDun(c, hourZhi); }',
    'static zhonghuangAnalyze(c: ChartCore, hourZhi: string): ZhonghuangAnalyze { return LrZhonghuang.zhonghuangAnalyze(c, hourZhi); }']
};
{
  const TYPE_NAMES = [];
  for (const m of SEG_TYPES.matchAll(/^export interface ([A-Za-z_][\w]*)/gm)) TYPE_NAMES.push(m[1]);
  const typeImport = 'import type {\n  ' + TYPE_NAMES.join(', ') + '\n} from \'./pan/types\';';
  const extraImport = "import type { PalaceLookup } from './pan/types';";
  const RE = TYPE_NAMES.filter((x) => TYPE_EXTRA.indexOf(x) < 0);
  const typeRe = 'export type {\n  ' + RE.join(', ') + '\n} from \'./pan/types\';';
  const imports = Object.keys(CLS_FILE).map((c) => "import { " + c + " } from './" + CLS_FILE[c] + "';")
    .concat(["import { YongShenCore } from './YongShenCore';"]);
  const cl = ['export class LiurenCore {'];
  cl.push('  /* ---------------- 模块 class 别名 ---------------- */');
  for (const c of Object.keys(CLS_FILE)) cl.push('  static readonly ' + c.replace('Lr', '').toUpperCase() + ' = ' + c + ';');
  cl.push('  static readonly YONGSHEN = YongShenCore;');
  cl.push('');
  cl.push('  /* ---------------- 常量表（实现已搬入各模块；此处按原样再暴露一份，对外 API 不变） ---------------- */');
  for (const [c, names] of CONST_BIND) for (const n of names) cl.push('  static readonly ' + n + ' = ' + c + '.' + n + ';');
  cl.push('');
  cl.push('  /* ---------------- 规则数据（宿主 init 注入） ---------------- */');
  cl.push('  static rules: CoreRules = LiurenCore.emptyRules();');
  cl.push('');
  cl.push('  /* 空规则（init 注入前默认值） */');
  cl.push('  static emptyRules(): CoreRules {');
  cl.push('    const duxiang: DuxiangRulesRaw = {};');
  cl.push('    const shensha: ShenshaRulesRaw = {};');
  cl.push('    const bifa: BifaRulesRaw = {};');
  cl.push('    const out: CoreRules = { duxiang: duxiang, shensha: shensha, bifa: bifa };');
  cl.push('    return out;');
  cl.push('  }');
  cl.push('');
  cl.push('  static init(rules: CoreRules): void {');
  cl.push('    LiurenCore.rules = rules;');
  cl.push('  }');
  for (const c of Object.keys(FORWARD)) {
    cl.push('');
    cl.push('  /* ---------------- 转发到 ' + c + ' ---------------- */');
    for (const l of FORWARD[c]) cl.push('  ' + l);
  }
  cl.push('}');
  const HEAD = ['/* ============================================================================',
    ' * LiurenCore.ets —— 大六壬核心引擎【门面 · 对外 API 与拆分前一字不变】',
    ' * ----------------------------------------------------------------------------',
    ' * 实现已按 Agent.md §13 拆到 pan/ 与 bifa/zhonghuang（yongshen 为独立文件）：',
    ' *   pan/types · pan/liuren-const · pan/xunkong · pan/jiang · pan/dungan · pan/sanchuan',
    ' *   pan/sike · pan/tiandipan · pan/shensha · pan/dx · bifa · zhonghuang',
    ' * 本文件只做：模块别名 + 常量绑定 + 公开方法转发 + 全部类型 re-export。',
    ' * 重新生成：node _tools/_ets_build.js（勿手改本文件）',
    ' * ==========================================================================*/'].join('\n');
  console.log('[3] model/LiurenCore.ets（门面）'.padEnd(22)
    + writeFile('LiurenCore.ets', HEAD + '\n\n' + typeImport + '\n' + extraImport + '\n'
      + imports.sort().join('\n') + '\n\n' + cl.join('\n') + '\n\n' + typeRe + '\n') + ' 行');
}

/* ---------- 自检 ---------- */
console.log('[4] 结构自检');
function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out); else if (/\.ets$/.test(e.name)) out.push(p);
  }
  return out;
}
const CLS = {};
for (const f of walk(MODEL)) {
  for (const m of fs.readFileSync(f, 'utf-8').matchAll(/export class ([A-Za-z_][\w]*)/g)) {
    CLS[m[1]] = path.relative(MODEL, f).replace(/\\/g, '/');
  }
}
function strip(src) {
  let out = '', q = '';
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q !== '') { out += c; if (c === '\\') { out += src[i + 1] || ''; i++; continue; } if (c === q) q = ''; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; out += c; continue; }
    if (c === '/' && src[i + 1] === '/') { const j = src.indexOf('\n', i); i = j < 0 ? src.length : j; continue; }
    if (c === '/' && src[i + 1] === '*') { const j = src.indexOf('*/', i + 2); i = j < 0 ? src.length : j + 1; continue; }
    out += c;
  }
  return out;
}
const TYPE_ALL = new Set();
for (const m of strip(fs.readFileSync(path.join(MODEL, 'pan', 'types.ets'), 'utf-8'))
  .matchAll(/export interface ([A-Za-z_][\w]*)/g)) TYPE_ALL.add(m[1]);
const BUILTIN = new Set(['Object', 'Array', 'String', 'Number', 'Boolean', 'Record', 'Date', 'Math', 'JSON', 'Map', 'Set', 'Promise', 'Error']);
let fail = 0;
for (const f of walk(MODEL)) {
  const name = path.basename(f);
  if (/YongShenCore|DataLoader|CaseStore|NavUtil/.test(name)) continue;
  const rel = path.relative(MODEL, f).replace(/\\/g, '/');
  const code = strip(fs.readFileSync(f, 'utf-8'));
  const problems = [];
  let depth = 0, minDepth = 0;
  for (const ch of code) { if (ch === '{') depth++; else if (ch === '}') { depth--; if (depth < minDepth) minDepth = depth; } }
  if (depth !== 0 || minDepth !== 0) problems.push('花括号不平衡（净 ' + depth + '）');
  const selfCls = new Set();
  for (const m of code.matchAll(/export class ([A-Za-z_][\w]*)/g)) selfCls.add(m[1]);
  const imported = new Set();
  for (const m of code.matchAll(/import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*'([^']+)'/g)) {
    for (const x of m[1].split(',')) { const y = x.trim(); if (y) imported.add(y); }
    const relTarget = m[2].endsWith('.ets') ? m[2] : m[2] + '.ets';
    if (!fs.existsSync(path.resolve(path.dirname(f), relTarget))) problems.push('import 路径不存在：' + m[2]);
  }
  for (const m of code.matchAll(/export\s+type\s*\{([^}]*)\}\s*from/g)) {
    for (const x of m[1].split(',')) { const y = x.trim(); if (y) imported.add(y); }
  }
  for (const c of Object.keys(CLS)) {
    if (selfCls.has(c)) continue;
    if (!new RegExp('\\b' + c + '\\.').test(code)) continue;
    if (!imported.has(c)) problems.push('用到 ' + c + ' 但未 import');
  }
  const declared = new Set();
  for (const m of code.matchAll(/(?:export\s+)?(?:interface|class|type|enum)\s+([A-Za-z_][\w]*)/g)) declared.add(m[1]);
  for (const m of code.matchAll(/:\s*([A-Z][A-Za-z0-9_]*)\b/g)) {
    const tn = m[1];
    if (BUILTIN.has(tn) || declared.has(tn) || imported.has(tn)) continue;
    if (TYPE_ALL.has(tn)) problems.push('类型 ' + tn + ' 未 import');
  }
  if (problems.length) { fail += problems.length; console.log('  ✗ ' + rel); for (const p of problems) console.log('      · ' + p); }
}
if (!fail) console.log('  ✓ 全部模块文件：花括号配平、import 齐备');
else { console.log('  自检失败：' + fail + ' 处'); process.exit(1); }
console.log('\nArkTS 侧组件化完成。下一步：python _tools/sync_free_edition.py && python _tools/verify_free_edition.py && 主版 hvigorw assembleHap');

/* ============================================================================
 * _core_split.js —— 临时工具：按 §13 模块边界把引擎单体**逐字搬移**成多模块
 * ----------------------------------------------------------------------------
 * 纪律：纯结构改动 —— 被搬移的行逐字保留（只做 static 方法改名、四课等价抽取、
 *      「引用归属模块」限定符改写），不评论化、不改任何规则/数值/判据。
 * 用法：node _tools/_core_split.js check   # 只跑覆盖检查
 *       node _tools/_core_split.js ts      # core/liuren-core.ts → core/liuren/*.ts + 装配层
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const MODE = process.argv[2] || 'check';

/* ============================ 模块清单（顺序＝装配顺序） ============================ */
/* [模块名, class 名, 标题（含路径）, 不变量说明, 归属相对路径（无扩展名）] */
const MODULES = [
  ['types', null, 'liuren/types —— 数据结构（interface 集中定义）',
    '原单体顶部 interface 段原样搬入；全局脚本，无 import/export。', 'liuren/types'],
  ['base', 'LrBase', 'liuren/liuren-const —— 最基础常量与五行工具（所有模块的公共底座）',
    '干支表 / 五行 / 寄宫 / 相克 / 反查等被全部模块共用；本模块不依赖任何其它模块。', 'liuren/liuren-const'],
  ['jigong', 'LrJigong', 'pan/jigong —— 天干寄宫',
    '不变量：甲寅/乙辰/丙戊巳/丁己未/庚申/辛戌/壬亥/癸丑（规范《天干寄宫的说明》）。', 'liuren/pan/jigong'],
  ['xunkong', 'LrXunkong', 'pan/xunkong —— 旬空',
    '不变量：旬遁下空亡支不配干；旬表 甲子戌亥 / 甲戌申酉 / … / 甲寅子丑。', 'liuren/pan/xunkong'],
  ['jiang', 'LrJiang', 'pan/jiang —— 十二天将（昼夜贵 / 顺逆 / 乘将）',
    '不变量：规范 JSON《十二天神与贵人》；将序恒定，逆布只改方向。', 'liuren/pan/jiang'],
  ['dungan', 'LrDungan', 'pan/dungan —— 遁干（旬遁 / 日干遁 / 时干）',
    '不变量：《五子元遁法》；旬遁为传统默认层。', 'liuren/pan/dungan'],
  ['sanchuan', 'LrSanchuan', 'pan/sanchuan —— 九宗门·三传取用（含涉害顺数＋复等）',
    '不变量：规范《三传排法》；传本锚点见 _tests/_test_sanchuan_spec.js。', 'liuren/pan/sanchuan'],
  ['sike', 'LrSike', 'pan/sike —— 四课（干→干阴→支→支阴）',
    '不变量：规范《四课排法》；已验 15/15 经文课例。\n本站是四课的**唯一归属**：两个起盘入口原先各自内联的四行四课，\n抽为 LrSike.sikeOf 单一实现（等价抽取，判定不变）。', 'liuren/pan/sike'],
  ['tiandipan', 'LrTiandipan', 'pan/tiandipan —— 天地盘（月将加占时、地盘↔天盘映射）与主起盘入口',
    '不变量：规范《天地盘的天盘地支排法》。', 'liuren/pan/tiandipan'],
  ['shensha', 'LrShensha', 'pan/shensha —— 神煞起法（查 rules.shensha 表）',
    '不变量：《地盘本位神煞.md》。', 'liuren/pan/shensha'],
  ['dx', 'LrDx', 'pan/dx —— 盘态（旺衰 / 气机点 / 关系 / 助日 / 年命 / 行年）',
    '不变量：旺衰休囚死规则；只读宿主注入的规则表。', 'liuren/pan/dx'],
  ['bifa', 'LrBifa', 'bifa —— 毕法赋一百法命中 / 定位渲染 / 教练层',
    '不变量：一百法规则（数据由宿主注入）。', 'liuren/bifa'],
  ['zhonghuang', 'LrZhonghuang', 'zhonghuang —— 中黄五变经（二次遁 / 变干主线 / 建合检测）',
    '不变量：经文与两份中黄口径文档。', 'liuren/zhonghuang'],
  ['yongshen', null, 'yongshen —— 抓用神 / 读象（class YongShenCore）',
    '唯一允许灵活的一层：取象与评分，不进定法。', 'liuren/yongshen']
];
const MOD = {};
for (const m of MODULES) MOD[m[0]] = m;

/* ============================ 切片布局（TS） ============================
 * 每项 = [模块, 起, 止]；起止**含前导说明注释**，保证注释不丢。
 * 互不重叠、覆盖类体 387~2219（另抽四课 763~773 作 pan/sike 的唯一实现）。
 * 459~465（rules/init）留在装配层门面，不在此表。 */
const SEG_TS = [
  ['base', 387, 410],            /* GAN ZHI JI_GONG WX WXG KE GUIREN */
  ['jiang', 411, 423],           /* 十二天将布列规则块 + JIANG_* */
  ['sanchuan', 424, 427],        /* MAOXING_ANCHOR / BA_ZHUAN_STEP / JINGLAN_SHE / ZI_XING */
  ['jiang', 428, 440],           /* BENSHEN / JIANG_JX / JIANG_WARN */
  ['dx', 441, 455],              /* XN_SCORE_DEFAULT */
  ['base', 456, 458],            /* YANG_ZHI / G_YANG */
  ['shensha', 466, 483],         /* XUN_KONG（含前导说明） */
  ['dx', 485, 534],              /* YUE_LING / QIJI_GONG */
  ['dx', 535, 551],              /* ZHI_GONG（含说明） */
  ['xunkong', 553, 565],         /* XUN_OF */
  ['dx', 566, 568],              /* EMPTY_NODE（含前导说明） */
  ['base', 569, 574],            /* SHENG */
  ['base', 575, 586],            /* gongOf（含反查注释） */
  ['dungan', 587, 600],          /* wutun + hourGan（含注释） */
  ['zhonghuang', 601, 626],      /* 中黄天干两遁说明 + zhonghuangDun + 完整分析说明 */
  ['zhonghuang', 627, 706],      /* zhonghuangAnalyze */
  ['sanchuan', 707, 720],        /* 古籍案例校验说明 + validGanZhi */
  ['tiandipan', 721, 734],       /* yuejiangForMonth + validYuejiangForMonth */
  ['tiandipan', 735, 741],       /* 古籍案例起盘说明 */
  ['tiandipan', 742, 817],       /* buildChartAncient */
  ['base', 818, 826],            /* wxOf + 相克判断注释 */
  ['jiang', 827, 844],           /* 相克判断注释 + ke + 十二天将布列 */
  ['dungan', 845, 868],          /* 旬遁说明 + xunDun */
  ['dungan', 869, 879],          /* dunMap */
  ['tiandipan', 880, 910],       /* 精确月将 + findDayRec */
  ['tiandipan', 911, 921],       /* 按日期查日历记录 + 主入口说明 */
  ['tiandipan', 922, 989],       /* buildChart */
  ['sanchuan', 990, 1267],       /* 九宗门规范说明 + resolveSanchuan */
  ['dx', 1268, 1293],            /* 盘态计算 + 旺衰表 + 年支 */
  ['shensha', 1294, 1341],       /* 神煞起法 */
  ['bifa', 1342, 1587],          /* 毕法格局识别 + bifaForChuans + 盘态主计算注释 */
  ['dx', 1588, 1683],            /* computeDuxiang + withDx（含注释） */
  ['bifa', 1684, 1856],          /* 毕法定位渲染说明 + renderBifaForChuans + renderBifa */
  ['bifa', 1857, 1948],          /* bifaCoach + 年命适配说明 */
  ['dx', 1949, 2036],            /* nianmingAdvice + 行年说明 */
  ['dx', 2037, 2219],            /* xingNian */
  ['yongshen', 2222, 2665],      /* YongShenCore 全段 */
  ['sike', 763, 773]             /* 四课（等价抽取源；与 tiandipan 段有意重叠，见 SIKE_CUTS） */
];
/* 四课等价抽取后要从 tiandipan 段里删掉的原文（两处，逐字匹配） */
const SIKE_CUTS = [
  [
    '    /* 四课 */',
    '    const g1 = tp[LiurenCore.JI_GONG[dg]];',
    '    const g2 = tp[g1];',
    '    const g3 = tp[dz];',
    '    const g4 = tp[g3];',
    '    const kegs: Keg[] = [',
    '      { x: g1, s: dg },',
    '      { x: g2, s: g1 },',
    '      { x: g3, s: dz },',
    '      { x: g4, s: g3 }',
    '    ];'
  ].join('\n'),
  [
    '    /* 四课 */',
    '    const g1 = tp[LiurenCore.JI_GONG[r.dg]];',
    '    const g2 = tp[g1];',
    '    const g3 = tp[r.dz];',
    '    const g4 = tp[g3];',
    '    const kegs: Keg[] = [',
    '      { x: g1, s: r.dg },',
    '      { x: g2, s: g1 },',
    '      { x: g3, s: r.dz },',
    '      { x: g4, s: g3 }',
    '    ];'
  ].join('\n')
];
const SIKE_CALL = '    const kegs: Keg[] = LrSike.sikeOf(tp, dg, dz);';
const SIKE_CALL_R = '    const kegs: Keg[] = LrSike.sikeOf(tp, r.dg, r.dz);';

/* ============================ 引用归属改写表 ============================ */
/* 归属改写：字面替换 `LiurenCore.N`，且其后一字符不得是标识符字符（防 WX 误伤 WXG）；
   名字按长度降序，避免长名被短名前缀吃掉。表与 .ets 侧一致。 */
function rewriteCommon(code) {
  const OWNER = {
    'GAN': 'LrBase', 'ZHI': 'LrBase', 'JI_GONG': 'LrBase', 'WX': 'LrBase', 'WXG': 'LrBase',
    'KE': 'LrBase', 'GUIREN': 'LrBase', 'YANG_ZHI': 'LrBase', 'G_YANG': 'LrBase',
    'SHENG': 'LrBase', 'gongOf': 'LrBase', 'wxOf': 'LrBase', 'ke': 'LrBase',
    'wutun': 'LrDungan', 'hourGan': 'LrDungan', 'xunDun': 'LrDungan', 'dunMap': 'LrDungan',
    'JIANG_ORDER': 'LrJiang', 'JIANG_DAY_HOURS': 'LrJiang', 'JIANG_SHUN_GONGS': 'LrJiang',
    'BENSHEN': 'LrJiang', 'JIANG_JX': 'LrJiang', 'JIANG_WARN': 'LrJiang', 'buildJiang': 'LrJiang',
    'MAOXING_ANCHOR': 'LrSanchuan', 'BA_ZHUAN_STEP': 'LrSanchuan', 'JINGLAN_SHE': 'LrSanchuan',
    'ZI_XING': 'LrSanchuan', 'MA_ZHI': 'LrSanchuan', 'XING_MAP': 'LrSanchuan', 'HE_GAN': 'LrSanchuan',
    'QIAN_SANHE': 'LrSanchuan', 'validGanZhi': 'LrSanchuan',
    'yuejiangForMonth': 'LrTiandipan', 'validYuejiangForMonth': 'LrTiandipan', 'findDayRec': 'LrTiandipan',
    'XUN_KONG': 'LrShensha', 'XUN_OF': 'LrXunkong',
    'EMPTY_NODE': 'LrDx', 'XN_SCORE_DEFAULT': 'LrDx', 'YUE_LING': 'LrDx', 'QIJI_GONG': 'LrDx',
    'ZHI_GONG': 'LrDx', 'wangT': 'LrDx', 'yearZhiOf': 'LrDx', 'withDx': 'LrDx', 'findZhiOfGong': 'LrDx'
  };
  const names = Object.keys(OWNER).sort((x, y) => y.length - x.length);
  let out = code;
  for (const name of names) {
    const from = 'LiurenCore.' + name;
    let idx = out.indexOf(from);
    while (idx >= 0) {
      const after = out.charAt(idx + from.length);
      if (after === '' || !/[A-Za-z0-9_$]/.test(after)) {
        out = out.slice(0, idx) + OWNER[name] + '.' + name + out.slice(idx + from.length);
        idx = out.indexOf(from, idx + OWNER[name].length + 1 + name.length);
      } else {
        idx = out.indexOf(from, idx + 1);
      }
    }
  }
  return out;
}

/* ============================ 工具 ============================ */
function sliceLines(lines, a, b) { return lines.slice(a - 1, b).join('\n'); }
function writeFile(rel, text) {
  const abs = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, text.replace(/\r\n/g, '\n').replace(/\n*$/, '\n'), 'utf-8');
  return text.split('\n').length - 1;
}
function head(title, note) {
  return '/* ============================================================================\n'
    + ' * ' + title + '\n'
    + ' * ----------------------------------------------------------------------------\n'
    + (note ? note.split('\n').map((s) => (s === '' ? ' *' : ' * ' + s)).join('\n') + '\n' : '')
    + ' * 由单体核心按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。\n'
    + ' * ==========================================================================*/';
}

/* ============================ 四课：等价抽取（pan/sike 唯一实现） ============================ */
const SIKE_METHOD_TS = [
  '  /* 四课：干→干阴→支→支阴（规范《四课排法》）',
  '     原 buildChart / buildChartAncient 各自内联的四行，抽为唯一实现（等价抽取，判定不变） */',
  '  static sikeOf(tp: Record<string, string>, dg: string, dz: string): Keg[] {',
  '    const g1 = tp[LrBase.JI_GONG[dg]];',
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
].join('\n');

/* ============================ 装配层（门面） ============================ */
const FACADE_HEADER = [
  '/* ============================================================================',
  ' * liuren-core.ts —— 大六壬核心引擎【装配层 / 门面】',
  ' * ----------------------------------------------------------------------------',
  ' * 引擎已按 Agent.md §13 拆分为多模块；本文件只做两件事：',
  ' *   1) 把各模块 class 暴露到同一命名空间（对外 API 与拆分前一字不变）；',
  ' *   2) 把公开静态方法转发到对应模块 —— **本文件不含任何判定逻辑**。',
  ' *',
  ' * 模块（装配顺序）：'
].concat(MODULES.filter((m) => m[0] !== 'types' && m[0] !== 'yongshen')
  .map((m) => ' *   ' + ('core/' + m[4] + '.ts').padEnd(34) + m[1]))
  .concat([
    ' *   ' + 'core/liuren/yongshen.ts'.padEnd(34) + 'YongShenCore（抓用神/读象）',
    ' *',
    ' * ArkTS 兼容子集（与拆分前一致）：零 any/unknown、全局脚本无 import/export。',
    ' *',
    ' * 编译（产物仍是**单一** core/liuren-core.js，Node/Web 只加载它）：',
    ' *   node _tools/build_core.js    # 按固定顺序拼装 core/liuren/** → tsc → liuren-core.js',
    ' *',
    ' * 宿主注入规则数据：LiurenCore.init({ duxiang, shensha, bifa, xingnian })',
    ' * ==========================================================================*/',
    '',
    '/* 门面对象：把各模块 class 暴露到同一命名空间 */',
    'class LiurenCore {'
  ]).join('\n');

const FACADE_ALIASES = [
  '  /* ---------------- 模块 class 别名（实现全部在各模块文件里） ---------------- */',
  '  static readonly BASE: typeof LrBase = LrBase;',
  '  static readonly JIGONG: typeof LrJigong = LrJigong;',
  '  static readonly TIANDIPAN: typeof LrTiandipan = LrTiandipan;',
  '  static readonly SIKE: typeof LrSike = LrSike;',
  '  static readonly SANCHUAN: typeof LrSanchuan = LrSanchuan;',
  '  static readonly JIANG: typeof LrJiang = LrJiang;',
  '  static readonly DUNGAN: typeof LrDungan = LrDungan;',
  '  static readonly XUNKONG: typeof LrXunkong = LrXunkong;',
  '  static readonly SHENSHA: typeof LrShensha = LrShensha;',
  '  static readonly DX: typeof LrDx = LrDx;',
  '  static readonly BIFA: typeof LrBifa = LrBifa;',
  '  static readonly ZHONGHUANG: typeof LrZhonghuang = LrZhonghuang;',
  '  static readonly YONGSHEN: typeof YongShenCore = YongShenCore;'
].join('\n');

const FACADE_METHODS = [
  '  /* ---------------- 规则数据（宿主 init 注入） ---------------- */',
  '  static init(rules: CoreRules): void { LiurenCore.rules = rules; }',
  '',
  '  /* ---------------- 基础五行 / 关系工具（实现：liuren-const、pan/dungan、pan/jiang） ---------------- */',
  '  static SHENG(a: string): string { return LrBase.SHENG(a); }',
  '  static wxOf(x: string): string { return LrBase.wxOf(x); }',
  '  static ke(a: string, b: string): boolean { return LrBase.ke(a, b); }',
  '  static gongOf(tp: Record<string, string>, z: string): string { return LrBase.gongOf(tp, z); }',
  '  static wutun(g: string): string { return LrDungan.wutun(g); }',
  '  static hourGan(dg: string, hz: string): string { return LrDungan.hourGan(dg, hz); }',
  '',
  '  /* ---------------- 天地盘 / 起盘入口（实现：pan/tiandipan） ---------------- */',
  '  static findYuejiang(dateStr: string, hourZhi: string, yjAll: YueJiangSeg[]): YueJiangState { return LrTiandipan.findYuejiang(dateStr, hourZhi, yjAll); }',
  '  static yuejiangForMonth(monthZhi: string): string { return LrTiandipan.yuejiangForMonth(monthZhi); }',
  '  static validYuejiangForMonth(monthZhi: string, mjZhi: string): boolean { return LrTiandipan.validYuejiangForMonth(monthZhi, mjZhi); }',
  '  static buildChart(input: ChartInput): Chart | null { return LrTiandipan.buildChart(input); }',
  '  static buildChartAncient(mjZhi: string, dg: string, dz: string, hourZhi: string,',
  '                           yearGan: string = "", yearZhi: string = "", monthZhi: string = ""): Chart | null {',
  '    return LrTiandipan.buildChartAncient(mjZhi, dg, dz, hourZhi, yearGan, yearZhi, monthZhi);',
  '  }',
  '',
  '  /* ---------------- 四课 / 九宗门·三传（实现：pan/sike、pan/sanchuan） ---------------- */',
  '  static buildSiKe(tp: Record<string, string>, dg: string, dz: string): Keg[] { return LrSike.sikeOf(tp, dg, dz); }',
  '  static resolveSanchuan(dg: string, tp: Record<string, string>, kegs: Keg[], dunChuan: Record<string, string>): SanChuan { return LrSanchuan.resolveSanchuan(dg, tp, kegs, dunChuan); }',
  '  static validGanZhi(gan: string, zhi: string): boolean { return LrSanchuan.validGanZhi(gan, zhi); }',
  '',
  '  /* ---------------- 十二天将（实现：pan/jiang） ---------------- */',
  '  static buildJiang(dg: string, tp: Record<string, string>, hourZhi: string): JiangBuild { return LrJiang.buildJiang(dg, tp, hourZhi); }',
  '',
  '  /* ---------------- 遁干 / 旬空（实现：pan/dungan、pan/xunkong） ---------------- */',
  '  static xunDun(dg: string, dz: string): Record<string, string> { return LrDungan.xunDun(dg, dz); }',
  '  static dunMap(dg: string): Record<string, string> { return LrDungan.dunMap(dg); }',
  '',
  '  /* ---------------- 神煞（实现：pan/shensha） ---------------- */',
  '  static computeShensha(c: ChartCore): ShenshaResult { return LrShensha.computeShensha(c); }',
  '',
  '  /* ---------------- 盘态（实现：pan/dx） ---------------- */',
  '  static computeDuxiang(c: ChartCore): Duxiang { return LrDx.computeDuxiang(c); }',
  '  static nianmingAdvice(c: Chart, nianZhi: string, yongShenZhi: string): NianmingAdvice { return LrDx.nianmingAdvice(c, nianZhi, yongShenZhi); }',
  '  static xingNian(c: Chart, birthYear: number, currentYear: number, gender: string, yongShenZhi: string): XingNianResult { return LrDx.xingNian(c, birthYear, currentYear, gender, yongShenZhi); }',
  '  static ruleHealth(): RuleHealthItem[] { return LrDx.ruleHealth(); }',
  '  static missingRules(): RuleHealthItem[] { return LrDx.missingRules(); }',
  '',
  '  /* ---------------- 毕法赋（实现：bifa） ---------------- */',
  '  static bifaForChuans(c: Chart, chu: Chuan[]): BifaHit[] { return LrBifa.bifaForChuans(c, chu); }',
  '  static renderBifaForChuans(c: ChartCore, dx: Duxiang, chu: Chuan[], aff: string): BifaDetail[] { return LrBifa.renderBifaForChuans(c, dx, chu, aff); }',
  '  static renderBifa(c: ChartCore, dx: Duxiang, aff: string): BifaDetail[] { return LrBifa.renderBifa(c, dx, aff); }',
  '  static bifaCoach(hits: BifaHit[], coachData: Record<string, Object>): CoachResult { return LrBifa.bifaCoach(hits, coachData); }',
  '',
  '  /* ---------------- 中黄五变经（实现：zhonghuang） ---------------- */',
  '  static zhonghuangDun(c: ChartCore, hourZhi: string): ZhonghuangDun { return LrZhonghuang.zhonghuangDun(c, hourZhi); }',
  '  static zhonghuangAnalyze(c: ChartCore, hourZhi: string): ZhonghuangAnalyze { return LrZhonghuang.zhonghuangAnalyze(c, hourZhi); }',
  '',
  '  /* ---------------- 点宫速查：只读接口（实现：pan/dx） ---------------- */',
  '  static palaceLookup(c: Chart, gongOrZhi: string, yongShenZhi: string): PalaceLookup { return LrDx.palaceLookup(c, gongOrZhi, yongShenZhi); }',
  '}'
].join('\n');

/* ============================ 主流程 ============================ */
/* 源文件是 CRLF：先归一化为 LF，避免搬运时把 \r 带进新文件（也会让逐字匹配失配） */
/* 基线一律取自拆分前的 tag：磁盘上的 core/liuren-core.ts 现在是**装配产物**，不能当基线 */
const BASE_TAG = 'v1.0.4-pre-componentize';
const lines = execFileSync('git', ['show', BASE_TAG + ':core/liuren-core.ts'],
  { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString('utf-8').replace(/\r\n/g, '\n').split('\n');
if (lines.length < 2400) {
  console.log('!! 基线不像拆分前单体（仅 ' + lines.length + ' 行）—— 检查 tag ' + BASE_TAG);
  process.exit(1);
}
console.log('基线 ' + BASE_TAG + ':core/liuren-core.ts（' + lines.length + ' 行）');

/* 覆盖检查（四课段与 tiandipan 有意重叠，单独剔除重叠报告） */
{
  const used = new Uint8Array(lines.length + 2);
  for (const [, a, b] of SEG_TS) for (let i = a; i <= b; i++) used[i]++;
  const gaps = [], dups = [];
  for (let i = 387; i <= 2219; i++) {
    if (used[i] === 0) gaps.push(i + ': ' + lines[i - 1]);
    if (used[i] > 1 && !(i >= 763 && i <= 773)) dups.push(i + ': ' + lines[i - 1]);
  }
  const realGaps = gaps.filter((g) => !/^(\d+):\s*$/.test(g) && !/^(\d+):\s+static rules: CoreRules/.test(g)
    && !/^(\d+):\s+\/\* -+ 规则数据/.test(g) && !/^(\d+):\s+static init\(rules/.test(g)
    && !/^(\d+):\s+LiurenCore\.rules = rules;/.test(g) && !/^(\d+):\s+\}/.test(g));
  console.log('覆盖检查（类体 387~2219）：未覆盖 ' + gaps.length + ' 行（其中装配层门面段 '
    + (gaps.length - realGaps.length) + ' 行），意外未覆盖 ' + realGaps.length + '，重复 ' + dups.length);
  for (const g of realGaps) console.log('   意外未覆盖 ' + g);
  for (const d of dups) console.log('   重复 ' + d);
  if (realGaps.length || dups.length) { console.log('!! 布局未通过，停止'); process.exit(1); }
}
console.log('布局检查通过 ✓');
if (MODE === 'check') process.exit(0);

/* ---- types.ts ---- */
const TYPES = [
  [32, 34], [36, 46], [49, 55], [58, 62], [65, 68], [71, 74], [77, 81], [84, 88], [91, 96],
  [99, 109], [112, 121], [124, 129], [132, 135], [138, 143], [146, 153], [156, 164], [167, 177],
  [180, 203], [206, 214], [216, 224], [226, 233], [235, 245], [247, 257], [259, 270], [272, 285],
  [288, 290], [293, 299], [302, 307], [311, 313], [315, 320], [322, 325], [328, 333], [335, 337],
  [340, 343], [345, 350], [352, 354], [357, 364], [366, 369], [371, 376], [380, 384]
];
writeFile('core/liuren/types.ts', head(MOD['types'][2], MOD['types'][3]) + '\n\n'
  + TYPES.map(([a, b]) => sliceLines(lines, a, b)).join('\n') + '\n');
console.log('  · core/liuren/types.ts'.padEnd(36) + TYPES.length + ' 个 interface');

/* ---- 各模块 ---- */
const perMod = {};
for (const [mod, a, b] of SEG_TS) {
  if (mod === 'sike') continue;
  let text = sliceLines(lines, a, b);
  if (mod === 'tiandipan') {
    /* 两个起盘入口各有四课内联块：dg/dz 版（buildChartAncient）与 r.dg/r.dz 版（buildChart）；
       tiandipan 的其它段（findYuejiang/findDayRec 等）不含四课块，按存在即替换处理。 */
    let hit = 0;
    for (let i = 0; i < SIKE_CUTS.length; i++) {
      if (text.indexOf(SIKE_CUTS[i]) < 0) continue;
      text = text.replace(SIKE_CUTS[i], i === 0 ? SIKE_CALL : SIKE_CALL_R);
      hit++;
    }
    if (hit > 0) console.log('    （tiandipan 段 ' + a + '-' + b + '：四课内联块 ' + hit + ' 处 → LrSike.sikeOf）');
  }
  (perMod[mod] = perMod[mod] || []).push(rewriteCommon(text));
}
(perMod['sike'] = perMod['sike'] || []).push(SIKE_METHOD_TS);

for (const m of MODULES) {
  if (m[0] === 'types') continue;
  const body = (perMod[m[0]] || []).join('\n\n');
  const rel = 'core/' + m[4] + '.ts';
  const text = m[1] ? head(m[2], m[3]) + '\n\nclass ' + m[1] + ' {\n' + body + '\n}\n'
    : head(m[2], m[3]) + '\n\n' + body + '\n';
  console.log('  · ' + rel.padEnd(30) + String(writeFile(rel, text)).padStart(5) + ' 行');
}

/* ---- 装配层 core/liuren-core.ts ---- */
{
  const ruleData = [
    '  /* ---------------- 规则数据（宿主 init 注入） ---------------- */',
    '  static rules: CoreRules = { duxiang: {}, shensha: {}, bifa: {} };'
  ].join('\n');
  const text = FACADE_HEADER + '\n' + FACADE_ALIASES + '\n\n' + ruleData + '\n\n'
    + FACADE_METHODS + '\n';
  console.log('  · core/liuren-core.ts（装配层）'.padEnd(36)
    + String(writeFile('core/liuren-core.ts', text)).padStart(5) + ' 行');
}
console.log('\n切片完成。下一步：node _tools/build_core.js（拼装 → tsc → core/liuren-core.js）');

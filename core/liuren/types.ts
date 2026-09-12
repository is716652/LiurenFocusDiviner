/* ============================================================================
 * liuren/types —— 数据结构（interface 集中定义）
 * ----------------------------------------------------------------------------
 * 原单体顶部 interface 段原样搬入；全局脚本，无 import/export。
 * 由单体核心按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ==========================================================================*/

interface YearGcObj {
  z: string;
}
interface DayRec {
  d: string;
  dg: string;
  dz: string;
  mg: string;
  mz: string;
  ygc: string | YearGcObj;
  lg?: number;
  ld?: number;
  st?: string;
}
interface YueJiangSeg {
  st: string;
  en: string;
  j: string;
  z: string;
  t: string;
}
interface YueJiangState {
  jiang: string;
  zhi: string;
  term: string;
}
interface Keg {
  x: string;
  s: string;
}
interface Chuan {
  z: string;
  gz: string;
}
interface SanChuan {
  method: string;
  keti: string;      /* 课体名（伏吟/返吟/八专/别责/昴星/…；普通课为""） */
  chuans: Chuan[];
}
interface NodeState {
  wangShuai: string;
  qiJi: string;
  kong: boolean;
}
interface Relation {
  chong: string | null;
  he: string | null;
  hai: string | null;
  xing: string[];
}
interface YueJiangStateDx {
  zhi: string;
  gong: string;
  kong: boolean;
  wangShuai: string;
  linGan: boolean;
  shengGan: boolean;
  keGan: boolean;
  faYong: boolean;
  zhu: boolean;
}
interface GuirenStateDx {
  zhi: string;
  kong: boolean;
  wangShuai: string;
  linGan: boolean;
  shengGan: boolean;
  keGan: boolean;
  faYong: boolean;
  zhu: boolean;
}
interface ShenshaItem {
  name: string;
  zhi: string;
  ji: string;
  conf: string;
}
interface ShenshaResult {
  byZhi: Record<string, string[]>;
  list: ShenshaItem[];
}
interface BifaHit {
  "序": number;
  "法名": string;
  "赋文": string;
  "判": string;
}
interface CoachItem {
  "序": number;
  "法名": string;
  "吉凶": string;   /* 吉 / 凶 / 中 */
  "类": string;     /* 格局主题（课体/天将/三传/空亡/贵人/官鬼/禄马/脱耗/…） */
  "倾向": string;
  "建议": string;
}
interface CoachResult {
  items: CoachItem[];
  ji: number;       /* 吉格局数 */
  xiong: number;    /* 凶格局数 */
  zhong: number;    /* 中格局数 */
  summary: string;  /* 组合断语 */
  groups: string[]; /* 分组解读（同类格局归并成句） */
  advice: string[]; /* 行动建议（去重汇总） */
}
interface NianmingAdvice {
  nianZhi: string;      /* 年命地支 */
  shangShen: string;    /* 年命上神（天盘加临） */
  liuqin: string;       /* 年命与日干六亲关系 */
  kong: boolean;        /* 年命上神逢空 */
  wangShuai: string;    /* 年命上神旺衰 */
  yongShen: string;     /* 当前用神支（无则空） */
  rel: string;          /* 年命上神与用神关系（生我/我生/克我/我克/比和；无用神时为空） */
  interact: string;     /* 互动断语（年命上神生克用神 → 深化建议） */
  advice: string;       /* 年命适配建议（基础 + 互动） */
}
interface XingNianResult {
  birthYear: number;      /* 出生年 */
  gender: string;         /* 男 / 女 */
  benMingGan: string;     /* 本命天干 */
  benMingZhi: string;     /* 本命地支（生年支） */
  shun: boolean;          /* 顺行 / 逆行 */
  xingNianZhi: string;    /* 行年支（小运落支） */
  shangShen: string;      /* 行年上神（天盘加临） */
  liuqin: string;         /* 行年上神与日干六亲 */
  kong: boolean;          /* 行年上神逢空 */
  wangShuai: string;      /* 行年上神旺衰 */
  yongShen: string;       /* 当前用神支（未选则空串） */
  rel: string;            /* 行年上神与用神生克关系（我生/生我/我克/克我/比和/空） */
  interact: string;       /* 与用神互动断语 */
  taiSui: string;         /* 今年太岁支 */
  tsRel: string;          /* 行年上神与太岁关系（值/冲/合/生/克/比和） */
  tsNote: string;         /* 太岁关系断语（流年吉凶参考） */
  jiang: string;          /* 行年上神所乘天将（无则空串） */
  jiangJx: string;        /* 天将吉凶（吉/凶/空） */
  jiangNote: string;      /* 乘将断语 */
  score: number;          /* 行年吉凶分（五层加权汇总） */
  band: string;           /* 档位（大吉/吉/平/凶/大凶） */
  advice: string;         /* 行年建议（六亲+旺衰+互动+太岁+乘将综合） */
}
interface ZhonghuangDun {
  dayGan: string;         /* 日干 */
  hourZhi: string;        /* 占时支 */
  shiGan: string;         /* 时干（日干遁到占时支） */
  riDun: Record<string, string>;   /* 体：日干遁盘（十二宫） */
  shiDun: Record<string, string>;  /* 用：时干遁盘（中黄盘，断课核心） */
  bianGan: string;        /* 变干（中黄盘占时支之干） */
}

interface ZhonghuangCmpItem {
  gong: string;           /* 地盘宫 */
  xunGan: string;         /* 常遁干（日干五鼠遁） */
  zhGan: string;          /* 中黄时遁干 */
  xunLq: string;          /* 常遁六亲 */
  zhLq: string;           /* 中黄六亲 */
  changed: boolean;       /* 是否变化 */
}

interface ZhonghuangJianhe {
  pos: string;            /* 位置：日上/支上/变干宫/初传/中传/末传 */
  gong: string;
  riGan: string;          /* 日遁干 */
  shiGan: string;         /* 时遁干 */
  type: string;           /* 建合 */
}

interface ZhonghuangAnalyze {
  dun: ZhonghuangDun;
  cmp: ZhonghuangCmpItem[];   /* 双视角对比（十二宫） */
  changed: string[];          /* 六亲变化的宫位 */
  bianGong: string;           /* 变干所在宫 */
  bianJiang: string;          /* 变干所乘天将 */
  bianLq: string;             /* 变干六亲 */
  bianInChuan: string;        /* 变干在三传位置（空=不入） */
  jianhe: ZhonghuangJianhe[]; /* 建合检测结果 */
}

interface BifaDetail {
  "序": number;
  "法名": string;
  "赋文": string;
  "判": string;
  "焦点": string;
  layer: Record<string, string>;
  "相关": boolean;
  "适用": string[];
}

interface Duxiang {
  xunkong: string[];
  monthZhi: string;
  dayWangShuai: string;
  nodes: Record<string, NodeState>;
  relations: Record<string, Relation>;
  yuejiang: YueJiangStateDx;
  guiren: GuirenStateDx;
  shensha: ShenshaResult;
  bifa: BifaHit[];
}

interface ChartCore {
  r: DayRec;
  yj: YueJiangState;
  tp: Record<string, string>;
  kegs: Keg[];
  dun: Record<string, string>;
  dunXun: Record<string, string>;
  sanchuan: SanChuan;
  jiangMap: Record<string, string>;
  gui: string;
  shun: boolean;
  night: boolean;
  hourGan: string;
}
interface Chart extends ChartCore {
  dx: Duxiang;
}
interface JiangBuild {
  jiangMap: Record<string, string>;
  gui: string;
  guiGong: string;
  shun: boolean;
  night: boolean;
}
interface ChartInput {
  date: string;
  hourZhi: string;
  calData: Record<string, DayRec[]>;
  yjAll: YueJiangSeg[];
}
interface WangShuaiSection {
  "旺衰"?: Record<string, Record<string, string>>;
}
interface JiChuSection {
  "六冲"?: Record<string, string>;
  "六合"?: Record<string, string>;
  "六害"?: Record<string, string>;
  "三刑"?: Record<string, string[]>;
}
interface DuxiangRulesRaw {
  /* 以下三张表由 DataLoader 读入 rules.duxiang；引擎侧目前只在自检里读其存在性
     （§14.4：三张「加载但引擎未读」的规则表，归入点宫速查卡作规则出处）。 */
  "十二宫气机点"?: Object;
  "空亡规则"?: Object;
  "助日规则"?: Object;
  "旺衰休囚死"?: WangShuaiSection;
  "基础关系"?: JiChuSection;
}
interface ShenshaRuleRaw {
  "基准"?: string;
  "表"?: Record<string, string>;
  "吉凶"?: string;
  "置信度"?: string;
}
interface ShenshaRulesRaw {
  "神煞"?: Record<string, ShenshaRuleRaw>;
}
interface BifaPandingRaw {
  "定位"?: Record<string, string>;
  "适用占事"?: string[];
}
interface BifaRuleRaw {
  "序"?: number;
  "法名"?: string;
  "赋文"?: string;
  "判定"?: BifaPandingRaw;
}
interface BifaRulesRaw {
  "一百法"?: BifaRuleRaw[];
}
interface XingNianScoreRule {
  liuQin: Record<string, number>;      /* 六亲分 */
  kong: number;                        /* 逢空分 */
  wangShuai: Record<string, number>;   /* 旺衰分 */
  taiSui: Record<string, number>;      /* 太岁关系分 */
  jiangJx: Record<string, number>;     /* 乘将吉凶分 */
  bands: ScoreBand[];                  /* 档位（min 降序，取首个命中） */
}
interface ScoreBand {
  min: number;
  label: string;
}
interface CoreRules {
  duxiang: DuxiangRulesRaw;
  shensha: ShenshaRulesRaw;
  bifa: BifaRulesRaw;
  xingnian?: XingNianScoreRule;
}
interface SheHaiItem {
  shang: string;      /* 候选上神 */
  cnt: number;        /* 涉害克数（深） */
  gong: string;       /* 该上神所临地盘宫（复等判孟/仲、见机/察微所据） */
}

/* 规则表健康项（引擎侧自述：缺表 / 表在但无条目 / 正常）—— §14 纪律用 */
interface RuleHealthItem {
  key: string;
  label: string;
  loaded: boolean;
  entries: number;
  note: string;
}

/* 该支在本课的角色（点宫速查卡用） */
interface PalaceRole {
  asGong: string;
  inChuan: string;
  isYongShen: boolean;
  isRiGanGong: boolean;
  isRiZhi: boolean;
  isYueJiang: boolean;
  isGuiRen: boolean;
  text: string;
}

/* 点宫速查卡（只读）—— 点天地盘任一宫 → 该支的盘面全貌 */
interface PalaceLookup {
  gong: string;
  tianZhi: string;
  wuXing: string;
  yinYang: string;
  liuQin: string;
  relToRiGan: string;
  relToYongShen: string;
  qiJi: string;
  kong: boolean;
  shensha: string[];
  jiang: string;
  dun: string;
  dunRi: string;
  dunShi: string;
  role: PalaceRole;
}

import { LrJiang } from './jiang';
/* ============================================================================
 * pan/types —— 数据结构（export interface 集中定义）
 * ----------------------------------------------------------------------------
 * 原单体顶部 interface 段原样搬入；ArkTS 原生 import/export。
 * 由单体 LiurenCore.ets 按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ArkTS：原生 import/export；跨模块引用经门面 LiurenCore（与 .ts 侧同口径）。
 * 重新生成：node _tools/_ets_build.js（勿手改本文件）
 * ==========================================================================*/

export interface YearGcObj {
  z: string;
}

export interface DayRec {
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

/* 月将换将段（来自 yj_all.js：window.YJ_ALL） */
export interface YueJiangSeg {
  st: string;
  en: string;
  j: string;
  z: string;
  t: string;
}

/* findYuejiang 返回的月将结果（挂在盘对象 c.yj 上） */
export interface YueJiangState {
  jiang: string;
  zhi: string;
  term: string;
}

/* 一课：x=上神(天盘支)，s=下神(地盘支/干或支) */
export interface Keg {
  x: string;
  s: string;
}

/* 一传：z=地支，gz=遁干+地支 */
export interface Chuan {
  z: string;
  gz: string;
}

/* 三传九宗门结果 */
export interface SanChuan {
  method: string;
  keti: string;      /* 课体名（伏吟/返吟/八专/别责/昴星…；普通课为""） */
  chuans: Chuan[];
}

/* 盘态：单支状态 */
export interface NodeState {
  wangShuai: string;
  qiJi: string;
  kong: boolean;
}

/* 盘态：单支关系（冲/合/害/刑） */
export interface Relation {
  chong: string | null;
  he: string | null;
  hai: string | null;
  xing: string[];
}

/* 盘态：月将助日状态 */
export interface YueJiangStateDx {
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

/* 盘态：贵人助日状态 */
export interface GuirenStateDx {
  zhi: string;
  kong: boolean;
  wangShuai: string;
  linGan: boolean;
  shengGan: boolean;
  keGan: boolean;
  faYong: boolean;
  zhu: boolean;
}

/* 神煞命中项 */
export interface ShenshaItem {
  name: string;
  zhi: string;
  ji: string;
  conf: string;
}

/* 神煞计算结果 */
export interface ShenshaResult {
  byZhi: Record<string, string[]>;
  list: ShenshaItem[];
}

/* 毕法格局命中（键名与原 HTML 一致，供宿主/UI 直接使用） */
export interface BifaHit {
  "序": number;
  "法名": string;
  "赋文": string;
  "判": string;
}

/* 行年（小运）结果 */
export interface XingNianResult {
  birthYear: number;
  gender: string;
  benMingGan: string;
  benMingZhi: string;
  shun: boolean;
  xingNianZhi: string;
  shangShen: string;
  liuqin: string;
  kong: boolean;
  wangShuai: string;
  yongShen: string;
  rel: string;
  interact: string;
  taiSui: string;
  tsRel: string;
  tsNote: string;
  jiang: string;
  jiangJx: string;
  jiangNote: string;
  score: number;
  band: string;
  advice: string;
}

/* 中黄五变经 · 天干两遁结果 */
export interface ZhonghuangDun {
  dayGan: string;
  hourZhi: string;
  shiGan: string;
  riDun: Record<string, string>;
  shiDun: Record<string, string>;
  bianGan: string;
}

/* 中黄双视角对比：单宫 常遁六亲 vs 中黄六亲 */
export interface ZhonghuangCmpItem {
  gong: string;
  xunGan: string;
  zhGan: string;
  xunLq: string;
  zhLq: string;
  changed: boolean;
}

/* 建合检测：日遁干 × 时遁干 天干五合 */
export interface ZhonghuangJianhe {
  pos: string;
  gong: string;
  riGan: string;
  shiGan: string;
  type: string;
}

/* 中黄完整分析 */
export interface ZhonghuangAnalyze {
  dun: ZhonghuangDun;
  cmp: ZhonghuangCmpItem[];
  changed: string[];
  bianGong: string;
  bianJiang: string;
  bianLq: string;
  bianInChuan: string;
  jianhe: ZhonghuangJianhe[];
}

/* 毕法格局·定位渲染明细 */
export interface BifaDetail {
  "序": number;
  "法名": string;
  "赋文": string;
  "判": string;
  "焦点": string;
  layer: Record<string, string>;
  "相关": boolean;
  "适用": string[];
}

/* 毕法教练：单格局教练条目 */
export interface CoachItem {
  "序": number;
  "法名": string;
  "吉凶": string;
  "类": string;
  "倾向": string;
  "建议": string;
}

/* 毕法教练：综合结果（组合断 + 分组解读） */
export interface CoachResult {
  items: CoachItem[];
  ji: number;
  xiong: number;
  zhong: number;
  summary: string;
  groups: string[];
  advice: string[];
}

/* 年命适配建议（含与用神互动断） */
export interface NianmingAdvice {
  nianZhi: string;
  shangShen: string;
  liuqin: string;
  kong: boolean;
  wangShuai: string;
  yongShen: string;
  rel: string;
  interact: string;
  advice: string;
}

/* 盘态计算结果 */
export interface Duxiang {
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

/* 排盘结果（不含 dx 前的中间形态；盘态函数入参） */
export interface ChartCore {
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

/* 完整盘对象（含 dx） */
export interface Chart extends ChartCore {
  dx: Duxiang;
}

/* buildChart 入参：日期/时辰 + 宿主历法数据 */
export interface ChartInput {
  date: string;
  hourZhi: string;
  calData: Record<string, DayRec[]>;
  yjAll: YueJiangSeg[];
}

/* 十二天将布列结果（LrJiang.buildJiang 出参） */
export interface JiangBuild {
  jiangMap: Record<string, string>;
  gui: string;
  guiGong: string;
  shun: boolean;
  night: boolean;
}

/* ==================== 规则数据（宿主 init 注入） ==================== */
/* 原 window.DUXIANG_RULES 相关段 */
export interface WangShuaiSection {
  "旺衰"?: Record<string, Record<string, string>>;
}

export interface JiChuSection {
  "六冲"?: Record<string, string>;
  "六合"?: Record<string, string>;
  "六害"?: Record<string, string>;
  "三刑"?: Record<string, string[]>;
}

export interface DuxiangRulesRaw {
  "旺衰休囚死"?: WangShuaiSection;
  "基础关系"?: JiChuSection;
}

/* 原 window.SHENSHA_RULES["神煞"] 单条 */
export interface ShenshaRuleRaw {
  "基准"?: string;
  "表"?: Record<string, string>;
  "吉凶"?: string;
  "置信度"?: string;
}

export interface ShenshaRulesRaw {
  "神煞"?: Record<string, ShenshaRuleRaw>;
}

/* 原 window.BIFA["一百法"] 单条 */
export interface BifaPandingRaw {
  "定位"?: Record<string, string>;
  "适用占事"?: string[];
}

export interface BifaRuleRaw {
  "序"?: number;
  "法名"?: string;
  "赋文"?: string;
  "判定"?: BifaPandingRaw;
}

export interface BifaRulesRaw {
  "一百法"?: BifaRuleRaw[];
}

export interface XingNianScoreRule {
  liuQin: Record<string, number>;
  kong: number;
  wangShuai: Record<string, number>;
  taiSui: Record<string, number>;
  jiangJx: Record<string, number>;
  bands: ScoreBand[];
}

export interface ScoreBand {
  min: number;
  label: string;
}

export interface CoreRules {
  duxiang: DuxiangRulesRaw;
  shensha: ShenshaRulesRaw;
  bifa: BifaRulesRaw;
  xingnian?: XingNianScoreRule;
}

/* ============================== 核心类 ============================== */
/* 涉害深浅比较中间项（九宗门·涉害）：上神、涉害克数、所临地盘宫 */
export interface SheHaiItem {
  shang: string;      /* 候选上神 */
  cnt: number;        /* 涉害克数（深） */
  gong: string;       /* 该上神所临地盘宫（复等判孟/仲、见机/察微所据） */
}
/* 规则表健康项（引擎侧自述：缺表 / 表在但无条目 / 正常）—— §14 纪律用 */
export interface RuleHealthItem {
  key: string;
  label: string;
  loaded: boolean;
  entries: number;
  note: string;
}

/* 该支在本课的角色（点宫速查卡用） */
export interface PalaceRole {
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
export interface PalaceLookup {
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

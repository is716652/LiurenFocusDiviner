/* ============================================================================
 * liuren-core.ts —— 【装配产物 · 勿手改】由 _tools/build_core.js 生成
 * ----------------------------------------------------------------------------
 * 真源：core/liuren/facade.ts（门面）+ core/liuren/**（各模块）
 * 装配顺序：types.ts → liuren-const.ts → pan/jigong.ts → pan/xunkong.ts → pan/jiang.ts → pan/dungan.ts → pan/sanchuan.ts → pan/sike.ts → pan/tiandipan.ts → pan/shensha.ts → pan/dx.ts → bifa.ts → zhonghuang.ts → yongshen.ts → facade.ts
 * 生成：node _tools/build_core.js
 * ==========================================================================*/
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

/* ============================================================================
 * liuren/liuren-const —— 最基础常量与五行工具（所有模块的公共底座）
 * ----------------------------------------------------------------------------
 * 干支表 / 五行 / 寄宫 / 相克 / 反查等被全部模块共用；本模块不依赖任何其它模块。
 * 由单体核心按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ==========================================================================*/

class LrBase {
  /* ---------------- 常量（自 HTML 常量块） ---------------- */
  static readonly GAN: string[] = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  static readonly ZHI: string[] = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  static readonly JI_GONG: Record<string, string> = {
    "甲": "寅", "乙": "辰", "丙": "巳", "丁": "未", "戊": "巳",
    "己": "未", "庚": "申", "辛": "戌", "壬": "亥", "癸": "丑"
  };
  static readonly WX: Record<string, string> = {
    "子": "水", "丑": "土", "寅": "木", "卯": "木", "辰": "土", "巳": "火",
    "午": "火", "未": "土", "申": "金", "酉": "金", "戌": "土", "亥": "水"
  };
  static readonly WXG: Record<string, string> = {
    "甲": "木", "乙": "木", "丙": "火", "丁": "火", "戊": "土",
    "己": "土", "庚": "金", "辛": "金", "壬": "水", "癸": "水"
  };
  static readonly KE: Record<string, string> = {
    "木": "土", "土": "水", "水": "火", "火": "金", "金": "木"
  };
  static readonly GUIREN: Record<string, string[]> = {
    "甲": ["丑", "未"], "戊": ["丑", "未"], "庚": ["丑", "未"],
    "乙": ["子", "申"], "己": ["子", "申"],
    "丙": ["亥", "酉"], "丁": ["亥", "酉"],
    "壬": ["巳", "卯"], "癸": ["巳", "卯"], "辛": ["午", "寅"]
  };

  static readonly YANG_ZHI: Record<string, number> = { "子": 1, "寅": 1, "辰": 1, "午": 1, "申": 1, "戌": 1 };
  static readonly G_YANG: Record<string, number> = { "甲": 1, "丙": 1, "戊": 1, "庚": 1, "壬": 1 };


  static SHENG(a: string): string {
    const map: Record<string, string> = { "木": "火", "火": "土", "土": "金", "金": "水", "水": "木" };
    return map[a];
  }

  /* 反查：tp/jiangMap 值 -> 键（地盘宫） */

  static gongOf(tp: Record<string, string>, z: string): string {
    const keys = Object.keys(tp);
    for (let i = 0; i < keys.length; i++) {
      if (tp[keys[i]] === z) {
        return keys[i];
      }
    }
    return z;
  }

  /* ---------------- 排盘引擎 ---------------- */
  /* 五子元遁首干：日干 -> 遁首 */

  static wxOf(x: string): string {
    return LrBase.WX[x] || LrBase.WXG[x];
  }

  /* 相克判断：a 克 b */
  static ke(a: string, b: string): boolean {
    return LrBase.KE[LrBase.wxOf(a)] === LrBase.wxOf(b);
  }

}

/* ============================================================================
 * pan/jigong —— 天干寄宫
 * ----------------------------------------------------------------------------
 * 不变量：甲寅/乙辰/丙戊巳/丁己未/庚申/辛戌/壬亥/癸丑（规范《天干寄宫的说明》）。
 * 由单体核心按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ==========================================================================*/

class LrJigong {

}

/* ============================================================================
 * pan/xunkong —— 旬空
 * ----------------------------------------------------------------------------
 * 不变量：旬遁下空亡支不配干；旬表 甲子戌亥 / 甲戌申酉 / … / 甲寅子丑。
 * 由单体核心按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ==========================================================================*/

class LrXunkong {
  static readonly XUN_OF: Record<string, string> = (() => {
    const m: Record<string, string> = {};
    const t: string[] = ["甲子", "甲戌", "甲申", "甲午", "甲辰", "甲寅"];
    t.forEach((jia: string) => {
      const j = LrBase.GAN.indexOf(jia[0]);
      const z = LrBase.ZHI.indexOf(jia[1]);
      for (let i = 0; i < 10; i++) {
        m[LrBase.GAN[(j + i) % 10] + LrBase.ZHI[(z + i) % 12]] = jia;
      }
    });
    return m;
  })();

}

/* ============================================================================
 * pan/jiang —— 十二天将（昼夜贵 / 顺逆 / 乘将）
 * ----------------------------------------------------------------------------
 * 不变量：规范 JSON《十二天神与贵人》；将序恒定，逆布只改方向。
 * 由单体核心按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ==========================================================================*/

class LrJiang {
  /* ==================== 十二天将布列规则（本文件唯一来源） ====================
     出处：大六壬文档/排盘/十二天神与昼贵夜贵说明.md（昼夜贵人表、昼夜分界）
           大六壬文档/中黄五变经/天将顺逆排布核心规则.md（顺逆判据：贵人落宫分野）
     四步：1) 昼夜定贵人（卯~申昼）2) 贵人支落于某地盘宫即布将起点
           3) 起点宫属亥子丑寅卯辰顺布、属巳午未申酉戌逆布
           4) 十二将次序恒定 JIANG_ORDER；逆布只改方向，不改将序
     历史坑（2026-09-10 修正）：旧实现把「逆序表」与「逆方向」叠加，二者互相抵消 →
     恒顺布，导致应逆布的盘十二天将整体镜像（青龙↔白虎、朱雀↔太阴、六合↔玄武、
     勾陈↔太常、螣蛇↔天后），仅贵人宫与天空宫不变。 */
  static readonly JIANG_ORDER: string[] = ["贵人", "螣蛇", "朱雀", "六合", "勾陈", "青龙", "天空", "白虎", "太常", "玄武", "太阴", "天后"];
  static readonly JIANG_DAY_HOURS: string[] = ["卯", "辰", "巳", "午", "未", "申"];
  static readonly JIANG_SHUN_GONGS: string[] = ["亥", "子", "丑", "寅", "卯", "辰"];
  /* 九宗门零散写死项，抽为具名常量 */

  static readonly BENSHEN: Record<string, string> = {
    "子": "天后", "丑": "贵人", "寅": "青龙", "卯": "六合", "辰": "勾陈", "巳": "螣蛇",
    "午": "朱雀", "未": "太常", "申": "白虎", "酉": "太阴", "戌": "天空", "亥": "玄武"
  };
  static readonly JIANG_JX: Record<string, string> = {
    "贵人": "吉", "天后": "吉", "太阴": "吉", "玄武": "凶", "太常": "吉", "白虎": "凶",
    "天空": "凶", "青龙": "吉", "勾陈": "凶", "六合": "吉", "朱雀": "凶", "螣蛇": "凶"
  };
  /* 凶将警示词（乘凶将断语用） */
  static readonly JIANG_WARN: Record<string, string> = {
    "玄武": "盗失暗昧", "白虎": "伤病血光", "天空": "虚诈落空",
    "勾陈": "拖延争斗", "朱雀": "口舌是非", "螣蛇": "虚惊怪异"
  };

  /* ---------------- 十二天将布列（唯一实现） ----------------
     buildChart / buildChartAncient 共用；规则见本文件「十二天将布列规则」块 */
  static buildJiang(dg: string, tp: Record<string, string>, hourZhi: string): JiangBuild {
    const night: boolean = LrJiang.JIANG_DAY_HOURS.indexOf(hourZhi) < 0;
    const gui: string = night ? LrBase.GUIREN[dg][1] : LrBase.GUIREN[dg][0];
    const guiGong: string = LrBase.gongOf(tp, gui);
    const shun: boolean = LrJiang.JIANG_SHUN_GONGS.indexOf(guiGong) >= 0;
    const step: number = shun ? 1 : -1;
    const gi: number = LrBase.ZHI.indexOf(guiGong);
    const jiangMap: Record<string, string> = {};
    for (let k = 0; k < LrJiang.JIANG_ORDER.length; k++) {
      const g: string = LrBase.ZHI[(gi + step * k + 120) % 12];
      jiangMap[g] = LrJiang.JIANG_ORDER[k];
    }
    const out: JiangBuild = { jiangMap: jiangMap, gui: gui, guiGong: guiGong, shun: shun, night: night };
    return out;
  }

}

/* ============================================================================
 * pan/dungan —— 遁干（旬遁 / 日干遁 / 时干）
 * ----------------------------------------------------------------------------
 * 不变量：《五子元遁法》；旬遁为传统默认层。
 * 由单体核心按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ==========================================================================*/

class LrDungan {
  static wutun(g: string): string {
    const map: Record<string, string> = {
      "甲": "甲", "己": "甲", "乙": "丙", "庚": "丙",
      "丙": "戊", "辛": "戊", "丁": "庚", "壬": "庚",
      "戊": "壬", "癸": "壬"
    };
    return map[g];
  }

  /* 时干：日干 + 时辰 -> 时干 */
  static hourGan(dg: string, hz: string): string {
    return LrBase.GAN[(LrBase.GAN.indexOf(LrDungan.wutun(dg)) + LrBase.ZHI.indexOf(hz)) % 10];
  }


  /* 旬遁（传统层）：日干支 -> {地支:旬遁干}；旬外二支为旬空，无干（留空）
     出处：大六壬文档/古籍原文-易藏-术数/六壬集成五要权衡--佚名「须用旬遁……旬遁方有空亡……若用时遁无空亡」；
           大六壬文档/中黄五变经/中黄五变经研读整理.md「旬遁＝三传/盘面配干（标准六壬）＝传统层」 */
  static xunDun(dg: string, dz: string): Record<string, string> {
    const Z: string[] = LrBase.ZHI;
    const G: string[] = LrBase.GAN;
    let n: number = -1;
    for (let k = 0; k < 60; k++) {
      if (G[k % 10] === dg && Z[k % 12] === dz) {
        n = k;
        break;
      }
    }
    const m: Record<string, string> = {};
    if (n < 0) {
      return m;
    }
    const sz: string = Z[(Math.floor(n / 10) * 10) % 12];
    for (let k = 0; k < 12; k++) {
      m[Z[(Z.indexOf(sz) + k) % 12]] = k < 10 ? G[k % 10] : "";
    }
    return m;
  }


  /* 五子元遁：日干 -> {地支:遁干} */
  static dunMap(dg: string): Record<string, string> {
    const zi = LrDungan.wutun(dg);
    const ziIdx = LrBase.GAN.indexOf(zi);
    const m: Record<string, string> = {};
    LrBase.ZHI.forEach((z: string, i: number) => {
      m[z] = LrBase.GAN[(ziIdx + i) % 10];
    });
    return m;
  }

}

/* ============================================================================
 * pan/sanchuan —— 九宗门·三传取用（含涉害顺数＋复等）
 * ----------------------------------------------------------------------------
 * 不变量：规范《三传排法》；传本锚点见 _tests/_test_sanchuan_spec.js。
 * 由单体核心按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ==========================================================================*/

class LrSanchuan {
  static readonly MAOXING_ANCHOR: string = "酉";
  static readonly BA_ZHUAN_STEP: number = 3;
  static readonly JINGLAN_SHE: Record<string, string> = { "丑": "亥", "未": "巳" };
  static readonly ZI_XING: Record<string, number> = { "辰": 1, "午": 1, "酉": 1, "亥": 1 };

  /* ---------------- 古籍案例校验 ----------------
     1) validGanZhi：干支阴阳匹配（阳干配阳支，60甲子合法组合）
     2) validYuejiangForMonth：月将与月支匹配（太阳过宫，月支逆行一位为当月月将）
       寅月→亥将、卯月→戌将、辰月→酉将、巳月→申将、午月→未将、未月→午将、
       申月→巳将、酉月→辰将、戌月→卯将、亥月→寅将、子月→丑将、丑月→子将 */
  static validGanZhi(gan: string, zhi: string): boolean {
    if (LrBase.GAN.indexOf(gan) < 0 || LrBase.ZHI.indexOf(zhi) < 0) {
      return false;
    }
    const ganYang = !!LrBase.G_YANG[gan];
    const zhiYang = !!LrBase.YANG_ZHI[zhi];
    return ganYang === zhiYang;
  }


  /* ---------------- 九宗门·三传取用（规范：《大六壬指南》四课三传·三传排法） ----------------
     2026-09-10 按规范整段重写（原实现与规范不符，全枚举对账 24.4% 盘不一致）。规范要点：
       1) 结构课先行：伏吟（天盘＝地盘）、返吟（天盘＝地盘之冲）；
       2) 贼克：仅 1 课下贼上 → 重审（**不论是否另有上克下**）；无下贼上且仅 1 课上克下 → 元首；
       3) 比用：2 课以上贼/克，取与日干比（同阴阳）者，唯一则用之；
       4) 涉害：比用无法筛选（多课均比／均不比）→ **先判所临地盘宫孟（见机）→ 仲（察微）→ 季 档**，
          档内候选多于一个时，再取「自所临地盘宫顺数地盘、止于本家，计地盘支克上神之数」多者；
          仍相等则缀瑕（阳日取日上神、阴日取辰上神）。（2026-09-12 按《六壬指南》第 24 行原文与
《六壬指南注解》第 37 行订正；原为「先取深者、深浅相等才判孟仲」，属并存之另一派口径，
见 大六壬文档/排盘/大六壬指南的四课三传的三传排法.md §3 校勘注二）
       5) 遥克：无贼克 → 第 2/3/4 课上神克日干为蒿矢（比照取）；无蒿矢则取日干所克之上神为弹射；
       6) 昴星：无贼克无遥克（四课全）→ 阳日取地盘酉上神、阴日取天盘酉下神；中末按阴阳互换；
       7) 别责：四课仅三课、无贼克无遥克 → 阳日取干合寄宫上神、阴日取日支前三合上神；中末取干上神；
       8) 八专：干支同位（四课二课）、**有克仍走贼克/比用/涉害；无克不再取遥克**，直接用八专法：
          阳日自干上神顺数三位（含起点）、阴日自支上神逆数三位；中末取干上神；
       9) 井栏射（返吟无克）：初传取日支之驿马（丑日亥、未日巳）；中传取日支上神、末传取日干上神；
      10) 中末传：除特别注明者皆为「初传支之阴神」（以初传支为地盘宫，取其天盘）。
     传本锚点（已入 _tests/_test_sanchuan_spec.js）：
       《六壬断案》88）甲寅日未将戌时（八专）→ 丑/亥/亥；93）丁未日午将子时（返吟·井栏射）→ 巳/丑/丑。 */
  /* dunChuan = 三传配干用表（旬遁） */
  static resolveSanchuan(dg: string, tp: Record<string, string>, kegs: Keg[], dunChuan: Record<string, string>): SanChuan {
    const Z = LrBase.ZHI;
    const yangGan = !!LrBase.G_YANG[dg];
    const ji = LrBase.JI_GONG[dg];
    const MENG: string[] = ["寅", "申", "巳", "亥"];
    const ZHONG: string[] = ["子", "午", "卯", "酉"];
    const chuanOf = (z: string): string => tp[z] || "";
    const chongZhi = (z: string): string => Z[(Z.indexOf(z) + 6) % 12];
    const newSc = (method: string, keti: string, c1: string, c2: string, c3: string): SanChuan => {
      const arr: string[] = [c1, c2, c3];
      const chuans: Chuan[] = arr.map((z: string): Chuan => ({ z: z, gz: dunChuan[z] + z }));
      return { method: method, keti: keti, chuans: chuans };
    };
    /* 中末＝初传之阴神（天盘覆盖） */
    const chain = (c1: string): SanChuan => newSc("", "", c1, chuanOf(c1), chuanOf(chuanOf(c1)));

    /* ---------- 结构判定 ---------- */
    let fuYin = true;
    let fanYin = true;
    for (let i = 0; i < Z.length; i++) {
      if (tp[Z[i]] !== Z[i]) {
        fuYin = false;
      }
      if (tp[Z[i]] !== Z[(i + 6) % 12]) {
        fanYin = false;
      }
    }

    /* ---------- 贼克候选（课1 下神为日干，ke 直接吃天干） ---------- */
    const down: number[] = [];
    const up: number[] = [];
    kegs.forEach((k: Keg, i: number) => {
      if (LrBase.ke(k.s, k.x)) {
        down.push(i);
      } else if (LrBase.ke(k.x, k.s)) {
        up.push(i);
      }
    });
    /* ---------- 遥克候选（第 2/3/4 课上神） ---------- */
    const haoshi: number[] = [];
    const danshe: number[] = [];
    for (let i = 1; i < kegs.length; i++) {
      if (LrBase.ke(kegs[i].x, dg)) {
        haoshi.push(i);
      }
      if (LrBase.ke(dg, kegs[i].x)) {
        danshe.push(i);
      }
    }
    /* ---------- 四课课数（按上神去重） ---------- */
    const uniqShang: string[] = [];
    kegs.forEach((k: Keg) => {
      if (uniqShang.indexOf(k.x) < 0) {
        uniqShang.push(k.x);
      }
    });
    const nSanKe: number = uniqShang.length;
    const baZhuan: boolean = (ji === kegs[2].s) && nSanKe === 2;   /* 干支同位、四课二课 */

    /* ---------- 取用工具 ---------- */
    const biList = (list: number[]): number[] => list.filter((i: number) => !!LrBase.YANG_ZHI[kegs[i].x] === yangGan);
    const yaoKeFirst = (): string => {
      const bi: number[] = biList(haoshi);
      return kegs[(bi.length > 0 ? bi : haoshi)[0]].x;
    };
    /* 涉害取用（《六壬指南》口径：**先判所临地盘宫孟/仲，再在同档内取深**）：
       一、见机（孟优先）：候中「所临地盘宫」属孟（寅申巳亥）者，只在此档内取用；
       二、察微（无孟则仲）：只取所临地盘宫属仲（子午卯酉）者；
       三、季档（无孟无仲）：档内即全部候——《指南》只言孟/仲而未及季，此处按**证据最弱假设**处理：
           既不擅自「径入缀瑕」（那等于在无证据处新增一步），也不擅自扩大候选；此档占进入涉害取用盘的
           540/4380（其候之临宫全为季，如甲丑日 子将丑时）。据《六壬大全》察微条「无孟取仲季用」；
       四、档内取深：档内候多于一个时，取「自所临地盘宫顺数地盘、止于本家，计地盘支克上神之数」最多者；
       五、仍等则缀瑕：阳日取日上神、阴日取辰上神（《六壬大全》「孟仲季复又相等，则阳日取干上神、
           阴日取支上神」）。
       原文依据（出处与行号见 大六壬文档/排盘/大六壬指南的四课三传的三传排法.md §3 校勘注二）：
       《六壬指南》第 24 行「先以寅申巳亥上乘之神为用……若孟神上无克贼则以子午卯酉上乘之神为用」；
       《六壬指南注解》第 37 行「涉害取法，只以孟仲季为准，不以涉害深浅为义，此《指南》所用之法，切记！」；
       《六壬经纬》第 58 行「先取寅申巳亥位上为初传。无寅申巳亥所乘，次取子午卯酉位上为初传」；
       传本课例 5 处：《六壬断案》143/183（癸卯日寅将辰时→丑/亥/酉）、180（己卯日亥将未时→未/亥/卯）、
       181（甲辰日戌将寅时→戌/午/寅）；《六壬指南注解》占验三十二（己亥日亥将未时→未/亥/卯）；
       《中黄五变经》16 释官讼门（癸卯日丑将卯时→丑/亥/酉）。
       **另一派（「取深优先」）并存登记**：《六壬大全》3640/3642 行本文与算例、《御定六壬直指》、《六壬心镜》、
       《六壬神定经》、《六壬粹言》正文、《六壬金铰剪》例1 等；两派在 17280 盘中 360 盘结论不同，
       其中「正月丁卯日丑时亥将」与「癸卯日丑将卯时」天盘与候选全同而两派相反，故本口径**非唯一正解**，
       只是本规范真源《六壬指南》一系的口径；细节与影响面见规范文档 §3 校勘注二。
       —— 禁止为迁就任何个别课例在此写死个案；取用只由 (日干阴阳, 四课, 天盘) 决定。 */
    const sheHai = (list: number[]): string => {
      const items: SheHaiItem[] = list.map((i: number): SheHaiItem => {
        const shang: string = kegs[i].x;
        const gong: string = LrBase.gongOf(tp, shang);   /* 上神所临地盘宫 */
        let cnt: number = 0;
        let cur: number = Z.indexOf(gong);
        for (let n = 0; n < 12; n++) {
          if (LrBase.ke(Z[cur], shang)) {
            cnt++;
          }
          if (Z[cur] === shang) {
            break;
          }
          cur = (cur + 1) % 12;                             /* 顺数地盘，止于本家 */
        }
        return { shang: shang, cnt: cnt, gong: gong };
      });
      /* 一/二/三：孟（见机）→ 仲（察微）→ 季 档 */
      let pool: SheHaiItem[] = items.filter((x: SheHaiItem) => MENG.indexOf(x.gong) >= 0);
      if (pool.length === 0) {
        pool = items.filter((x: SheHaiItem) => ZHONG.indexOf(x.gong) >= 0);
      }
      if (pool.length === 0) {
        pool = items;
      }
      /* 四：档内取深 */
      let max: number = -1;
      pool.forEach((x: SheHaiItem) => {
        if (x.cnt > max) {
          max = x.cnt;
        }
      });
      const top: SheHaiItem[] = pool.filter((x: SheHaiItem) => x.cnt === max);
      if (top.length === 1) {
        return top[0].shang;
      }
      /* 五：仍等 → 缀瑕（阳日取日上神、阴日取辰上神） */
      const fallback: string = yangGan ? kegs[0].x : kegs[2].x;
      const hit: SheHaiItem[] = top.filter((x: SheHaiItem) => x.shang === fallback);
      return hit.length > 0 ? hit[0].shang : top[0].shang;
    };
    /* 贼克/比用/涉害 三法取初传（返吟有克时复用）；取不到返回空串 */
    const zeiKeBiShe = (): string => {
      if (down.length === 1) {
        return kegs[down[0]].x;
      }
      if (down.length === 0 && up.length === 1) {
        return kegs[up[0]].x;
      }
      if (down.length + up.length >= 2) {
        const ks: number[] = down.length > 0 ? down : up;
        const bi: number[] = biList(ks);
        if (bi.length === 1) {
          return kegs[bi[0]].x;
        }
        return sheHai(bi.length > 1 ? bi : ks);
      }
      return "";
    };

    /* ---------- 1. 伏吟 ---------- */
    if (fuYin) {
      const k1: Keg = kegs[0];
      const c1: string = (LrBase.ke(k1.s, k1.x) || LrBase.ke(k1.x, k1.s)) ? k1.x : (yangGan ? k1.x : kegs[2].x);
      let c2: string = "";
      let c3: string = "";
      if (!!LrSanchuan.ZI_XING[c1]) {
        c2 = yangGan ? kegs[2].x : k1.x;
        c3 = LrSanchuan.XING_MAP[c2] || chongZhi(c2);          /* 规范：取中传之刑或冲 */
      } else {
        c2 = LrSanchuan.XING_MAP[c1] || c1;
        c3 = LrSanchuan.XING_MAP[c2] || c2;
      }
      return newSc("伏吟", "伏吟", c1, c2, c3);
    }

    /* ---------- 2. 返吟 ---------- */
    if (fanYin) {
      const zk: string = zeiKeBiShe();
      if (zk !== "" || haoshi.length > 0 || danshe.length > 0) {
        const first: string = zk !== "" ? zk : (haoshi.length > 0 ? yaoKeFirst() : kegs[danshe[0]].x);
        const sc: SanChuan = chain(first);
        sc.method = "返吟";
        sc.keti = "返吟";
        return sc;
      }
      /* 井栏射：初传取日支之驿马；中传取日支上神、末传取日干上神 */
      const she: string = LrSanchuan.JINGLAN_SHE[kegs[2].s] || kegs[2].x;
      return newSc("返吟", "返吟·井栏射", she, kegs[2].x, kegs[0].x);
    }

    /* ---------- 3. 八专（干支同位）：有克已由上面结构之外的贼克/比用/涉害处理，无克则用八专法 ---------- */
    if (baZhuan && down.length + up.length === 0) {
      const base: string = yangGan ? kegs[0].x : kegs[2].x;
      const idx: number = Z.indexOf(base);
      const step: number = LrSanchuan.BA_ZHUAN_STEP;            /* 3 位（含起点）→ 位移 2 */
      const c1: string = yangGan ? Z[(idx + step - 1) % 12] : Z[(idx - step + 1 + 12) % 12];
      return newSc("八专", "八专", c1, kegs[0].x, kegs[0].x);
    }

    /* ---------- 4. 别责（四课仅三课、无贼克无遥克） ---------- */
    if (nSanKe === 3 && down.length + up.length === 0 && haoshi.length === 0 && danshe.length === 0) {
      const c1: string = yangGan
        ? chuanOf(LrBase.JI_GONG[LrSanchuan.HE_GAN[dg]] || "")
        : chuanOf(LrSanchuan.QIAN_SANHE[kegs[2].s] || kegs[2].s);
      return newSc("别责", "别责", c1, kegs[0].x, kegs[0].x);
    }

    /* ---------- 5. 贼克 / 比用 / 涉害 ---------- */
    const c1zk: string = zeiKeBiShe();
    if (c1zk !== "") {
      let method: string = "涉害";
      if (down.length === 1) {
        method = "重审";
      } else if (down.length === 0 && up.length === 1) {
        method = "元首";
      } else {
        const ks: number[] = down.length > 0 ? down : up;
        method = biList(ks).length === 1 ? "比用" : "涉害";
      }
      const sc: SanChuan = chain(c1zk);
      sc.method = method;
      return sc;
    }

    /* ---------- 6. 遥克（蒿矢 / 弹射） ---------- */
    if (haoshi.length > 0) {
      const sc: SanChuan = chain(yaoKeFirst());
      sc.method = "遥克·蒿矢";
      return sc;
    }
    if (danshe.length > 0) {
      const sc: SanChuan = chain(kegs[danshe[0]].x);
      sc.method = "遥克·弹射";
      return sc;
    }

    /* ---------- 7. 昴星（无贼克无遥克、四课全） ---------- */
    const mx: string = yangGan ? tp[LrSanchuan.MAOXING_ANCHOR] : LrBase.gongOf(tp, LrSanchuan.MAOXING_ANCHOR);
    const ganShang: string = tp[ji];
    const zhiShang: string = tp[kegs[2].s];
    return newSc("昴星", yangGan ? "昴星·虎视转蓬" : "昴星·冬蛇掩目",
      mx, yangGan ? zhiShang : ganShang, yangGan ? ganShang : zhiShang);
  }


  /* 驿马表（三合驿马）：申子辰马在寅、巳酉丑马在亥、寅午戌马在申、亥卯未马在巳 */
  static readonly MA_ZHI: Record<string, string> = {
    "申": "寅", "子": "寅", "辰": "寅",
    "巳": "亥", "酉": "亥", "丑": "亥",
    "寅": "申", "午": "申", "戌": "申",
    "亥": "巳", "卯": "巳", "未": "巳"
  };
  /* 课体辅助静态表（《大六壬指南》三传排法规范） */
  /* 刑：子刑卯、卯刑子、寅刑巳、巳刑申、申刑寅、丑刑戌、戌刑未、未刑丑、辰午酉亥自刑 */
  static readonly XING_MAP: Record<string, string> = {
    "子": "卯", "卯": "子", "寅": "巳", "巳": "申", "申": "寅",
    "丑": "戌", "戌": "未", "未": "丑",
    "辰": "辰", "午": "午", "酉": "酉", "亥": "亥"
  };
  /* 干合：甲己合、乙庚合、丙辛合、丁壬合、戊癸合 */
  static readonly HE_GAN: Record<string, string> = {
    "甲": "己", "己": "甲", "乙": "庚", "庚": "乙",
    "丙": "辛", "辛": "丙", "丁": "壬", "壬": "丁",
    "戊": "癸", "癸": "戊"
  };
  /* 支前三合：子合丑、丑合巳、寅合亥、卯合戌、辰合酉、巳合申、午合未、未合午、申合巳、酉合辰、戌合卯、亥合寅 */
  static readonly QIAN_SANHE: Record<string, string> = {
    "子": "丑", "丑": "巳", "寅": "亥", "卯": "戌", "辰": "酉", "巳": "申",
    "午": "未", "未": "午", "申": "巳", "酉": "辰", "戌": "卯", "亥": "寅"
  };

}

/* ============================================================================
 * pan/sike —— 四课（干→干阴→支→支阴）
 * ----------------------------------------------------------------------------
 * 不变量：规范《四课排法》；已验 15/15 经文课例。
 * 本站是四课的**唯一归属**：两个起盘入口原先各自内联的四行四课，
 * 抽为 LrSike.sikeOf 单一实现（等价抽取，判定不变）。
 * 由单体核心按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ==========================================================================*/

class LrSike {
  /* 四课：干→干阴→支→支阴（规范《四课排法》）
     原 buildChart / buildChartAncient 各自内联的四行，抽为唯一实现（等价抽取，判定不变） */
  static sikeOf(tp: Record<string, string>, dg: string, dz: string): Keg[] {
    const g1 = tp[LrBase.JI_GONG[dg]];
    const g2 = tp[g1];
    const g3 = tp[dz];
    const g4 = tp[g3];
    return [
      { x: g1, s: dg },
      { x: g2, s: g1 },
      { x: g3, s: dz },
      { x: g4, s: g3 }
    ];
  }
}

/* ============================================================================
 * pan/tiandipan —— 天地盘（月将加占时、地盘↔天盘映射）与主起盘入口
 * ----------------------------------------------------------------------------
 * 不变量：规范《天地盘的天盘地支排法》。
 * 由单体核心按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ==========================================================================*/

class LrTiandipan {
  static yuejiangForMonth(monthZhi: string): string {
    /* 月将 = 太阳过宫（中气换将）。建月→月将 对应（寅月亥将、卯月戌将…子月丑将） */
    const m: Record<string, string> = {
      "寅": "亥", "卯": "戌", "辰": "酉", "巳": "申",
      "午": "未", "未": "午", "申": "巳", "酉": "辰",
      "戌": "卯", "亥": "寅", "子": "丑", "丑": "子"
    };
    return m[monthZhi] || "";
  }

  static validYuejiangForMonth(monthZhi: string, mjZhi: string): boolean {
    return LrTiandipan.yuejiangForMonth(monthZhi) === mjZhi;
  }


  /* ---------------- 古籍案例起盘 ----------------
     古代案例：月将 + 日干支 + 占时（必需）；年干支/月支 可选。
     天地盘/四课/三传/天将 只需必需项即可完整还原；
     年干支可选 → 太岁等年系神煞完整；缺失则降级（ygc 置空）。
     月支可选 → 月建/旺衰更准；缺失则用月将支近似。
     入参：mjZhi=月将支、dg/dz=日干支、hourZhi=占时支、
           yearGan/yearZhi=年干支（可选，空=降级）、monthZhi=月支（可选，空=月将支近似） */

  static buildChartAncient(mjZhi: string, dg: string, dz: string, hourZhi: string,
                           yearGan: string = "", yearZhi: string = "", monthZhi: string = ""): Chart | null {
    const mj = LrBase.ZHI.indexOf(mjZhi);
    if (mj < 0) {
      return null;
    }
    const r: DayRec = {
      d: dg + dz + "日",
      dg: dg,
      dz: dz,
      mg: "",
      mz: (monthZhi !== "" && LrBase.ZHI.indexOf(monthZhi) >= 0) ? monthZhi : mjZhi,
      ygc: (yearGan !== "" && yearZhi !== "") ? (yearGan + yearZhi) : ""
    };
    const yj: YueJiangState = { jiang: "", zhi: mjZhi, term: "古籍案例" };
    /* 天盘：月将加占时 */
    const zs = LrBase.ZHI.indexOf(hourZhi);
    const tp: Record<string, string> = {};
    LrBase.ZHI.forEach((z: string, i: number) => {
      tp[z] = LrBase.ZHI[(mj + (i - zs) + 12) % 12];
    });
    const kegs: Keg[] = LrSike.sikeOf(tp, dg, dz);
    /* 遁干：dun = 日干遁（五子元遁·中黄体层）；dunXun = 旬遁（传统层） */
    const dun = LrDungan.dunMap(dg);
    const dunXun = LrDungan.xunDun(dg, dz);
    /* 三传九宗门：三传干支按旬遁配干（空亡支留空） */
    const sanchuan = LiurenCore.resolveSanchuan(dg, tp, kegs, dunXun);
    /* 天将：昼夜定贵人 → 贵人落宫定顺逆 → 依固定将序布列（实现见 buildJiang） */
    const jd: JiangBuild = LrJiang.buildJiang(dg, tp, hourZhi);
    const jiangMap: Record<string, string> = jd.jiangMap;
    const gui: string = jd.gui;
    const shun: boolean = jd.shun;
    const night: boolean = jd.night;
    const core: ChartCore = {
      r: r,
      yj: yj,
      tp: tp,
      kegs: kegs,
      dun: dun,
      dunXun: dunXun,
      sanchuan: sanchuan,
      jiangMap: jiangMap,
      gui: gui,
      shun: shun,
      night: night,
      hourGan: LrDungan.hourGan(dg, hourZhi)
    };
    const dx = LiurenCore.computeDuxiang(core);
    const chart: Chart = {
      r: r,
      yj: yj,
      tp: tp,
      kegs: kegs,
      dun: dun,
      dunXun: dunXun,
      sanchuan: sanchuan,
      jiangMap: jiangMap,
      gui: gui,
      shun: shun,
      night: night,
      hourGan: core.hourGan,
      dx: dx
    };
    return chart;
  }


  /* 精确月将：用时辰中点时刻查 yjAll（全量 1900~2060）；无数据时按中气直查（近似兜底） */
  static findYuejiang(dateStr: string, hourZhi: string, yjAll: YueJiangSeg[]): YueJiangState {
    const mid: Record<string, string> = {
      "子": "00:00", "丑": "02:00", "寅": "04:00", "卯": "06:00",
      "辰": "08:00", "巳": "10:00", "午": "12:00", "未": "14:00",
      "申": "16:00", "酉": "18:00", "戌": "20:00", "亥": "22:00"
    };
    const ts = dateStr + " " + mid[hourZhi] + ":00";
    if (yjAll) {
      for (let i = 0; i < yjAll.length; i++) {
        const s = yjAll[i];
        if (ts >= s.st && ts < s.en) {
          return { jiang: s.j, zhi: s.z, term: s.t };
        }
      }
      const last = yjAll[yjAll.length - 1];
      if (ts >= last.st) {
        return { jiang: last.j, zhi: last.z, term: last.t };
      }
      return { jiang: "神后", zhi: "子", term: "大寒" };
    }
    const ZQ: Record<number, string[]> = {
      1: ["神后", "子"], 2: ["登明", "亥"], 3: ["河魁", "戌"], 4: ["从魁", "酉"],
      5: ["传送", "申"], 6: ["小吉", "未"], 7: ["胜光", "午"], 8: ["太乙", "巳"],
      9: ["天罡", "辰"], 10: ["太冲", "卯"], 11: ["功曹", "寅"], 12: ["大吉", "丑"]
    };
    const m = parseInt(dateStr.slice(5, 7), 10);
    return { jiang: ZQ[m][0], zhi: ZQ[m][1], term: "" };
  }

  /* 按日期查日历记录（跨年度） */

  static findDayRec(date: string, calData: Record<string, DayRec[]>): DayRec | null {
    const y = date.slice(0, 4);
    const arr = calData[y];
    if (!arr) {
      return null;
    }
    const found = arr.find((r: DayRec) => r.d === date);
    return found ? found : null;
  }

  /* 主入口：完整排盘（含 dx 盘态） */

  static buildChart(input: ChartInput): Chart | null {
    const r = LrTiandipan.findDayRec(input.date, input.calData);
    if (r === null) {
      return null;
    }
    const yj = LiurenCore.findYuejiang(input.date, input.hourZhi, input.yjAll);
    /* 天盘：月将加占时 */
    const mj = LrBase.ZHI.indexOf(yj.zhi);
    const zs = LrBase.ZHI.indexOf(input.hourZhi);
    const tp: Record<string, string> = {};
    LrBase.ZHI.forEach((z: string, i: number) => {
      tp[z] = LrBase.ZHI[(mj + (i - zs) + 12) % 12];
    });
    const kegs: Keg[] = LrSike.sikeOf(tp, r.dg, r.dz);
    /* 遁干：dun = 日干遁（五子元遁·中黄体层）；dunXun = 旬遁（传统层） */
    const dun = LrDungan.dunMap(r.dg);
    const dunXun = LrDungan.xunDun(r.dg, r.dz);
    /* 三传九宗门：三传干支按旬遁配干（空亡支留空） */
    const sanchuan = LiurenCore.resolveSanchuan(r.dg, tp, kegs, dunXun);
    /* 天将：昼夜定贵人 → 贵人落宫定顺逆 → 依固定将序布列（实现见 buildJiang） */
    const jd: JiangBuild = LrJiang.buildJiang(r.dg, tp, input.hourZhi);
    const jiangMap: Record<string, string> = jd.jiangMap;
    const gui: string = jd.gui;
    const shun: boolean = jd.shun;
    const night: boolean = jd.night;
    const core: ChartCore = {
      r: r,
      yj: yj,
      tp: tp,
      kegs: kegs,
      dun: dun,
      dunXun: dunXun,
      sanchuan: sanchuan,
      jiangMap: jiangMap,
      gui: gui,
      shun: shun,
      night: night,
      hourGan: LrDungan.hourGan(r.dg, input.hourZhi)
    };
    const dx = LiurenCore.computeDuxiang(core);
    const chart: Chart = {
      r: r,
      yj: yj,
      tp: tp,
      kegs: kegs,
      dun: dun,
      dunXun: dunXun,
      sanchuan: sanchuan,
      jiangMap: jiangMap,
      gui: gui,
      shun: shun,
      night: night,
      hourGan: core.hourGan,
      dx: dx
    };
    return chart;
  }

}

/* ============================================================================
 * pan/shensha —— 神煞起法（查 rules.shensha 表）
 * ----------------------------------------------------------------------------
 * 不变量：《地盘本位神煞.md》。
 * 由单体核心按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ==========================================================================*/

class LrShensha {
  /* ---------------- 盘态静态表（与 HTML 的 WANG_T/XUN_KONG/YUE_LING/QIJI_GONG/XUN_OF 一致） ---------------- */
  static readonly XUN_KONG: Record<string, string[]> = (() => {
    const m: Record<string, string[]> = {};
    const t: string[][] = [
      ["甲子", "戌亥"], ["甲戌", "申酉"], ["甲申", "午未"],
      ["甲午", "辰巳"], ["甲辰", "寅卯"], ["甲寅", "子丑"]
    ];
    t.forEach((pair: string[]) => {
      const jia = pair[0];
      const kk = pair[1];
      const j = LrBase.GAN.indexOf(jia[0]);
      const z = LrBase.ZHI.indexOf(jia[1]);
      for (let i = 0; i < 10; i++) {
        m[LrBase.GAN[(j + i) % 10] + LrBase.ZHI[(z + i) % 12]] = kk.split("");
      }
    });
    return m;
  })();

  /* 神煞起法（35 神煞，查表自 神煞起法.json） */
  static computeShensha(c: ChartCore): ShenshaResult {
    const S = LiurenCore.rules.shensha["神煞"] || {};
    const r = c.r;
    const yz = LrDx.yearZhiOf(r);
    const mz = r.mz;
    const dg = r.dg;
    const dz = r.dz;
    const xun = LrXunkong.XUN_OF[dg + dz] || "";
    const byZhi: Record<string, string[]> = {};
    LrBase.ZHI.forEach((z: string) => {
      byZhi[z] = [];
    });
    const list: ShenshaItem[] = [];
    const keys = Object.keys(S);
    for (let ki = 0; ki < keys.length; ki++) {
      const nm = keys[ki];
      const s = S[nm];
      let v: string | null = null;
      const b = s["基准"] || "";
      const biao = s["表"] || {};
      if (b === "年支") {
        v = biao[yz];
      } else if (b === "月支") {
        /* 月煞表键=月份1..12（寅月=1），季煞表键=月支 */
        const mNo = (LrBase.ZHI.indexOf(mz) - LrBase.ZHI.indexOf("寅") + 12) % 12 + 1;
        v = (biao[String(mNo)] !== undefined) ? biao[String(mNo)] : biao[mz];
      } else if (b === "日干") {
        v = biao[dg];
      } else if (b === "日支") {
        v = biao[dz];
      } else if (b === "旬") {
        v = biao[xun];
      }
      if (v == null || v === "") {
        continue;
      }
      const zhis: string[] = String(v).split("");
      zhis.forEach((z: string) => {
        if (byZhi[z]) {
          byZhi[z].push(nm);
        }
      });
      list.push({ name: nm, zhi: zhis.join(""), ji: s["吉凶"] || "", conf: s["置信度"] || "" });
    }
    return { byZhi: byZhi, list: list };
  }

}

/* ============================================================================
 * pan/dx —— 盘态（旺衰 / 气机点 / 关系 / 助日 / 年命 / 行年）
 * ----------------------------------------------------------------------------
 * 不变量：旺衰休囚死规则；只读宿主注入的规则表。
 * 由单体核心按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ==========================================================================*/

class LrDx {
  /* 行年吉凶打分默认表（宿主 init 注入 行年打分.json 覆盖） */
  static readonly XN_SCORE_DEFAULT: XingNianScoreRule = {
    liuQin: { "官鬼": -2, "妻财": 2, "子孙": 2, "父母": 1, "兄弟": 0 },
    kong: -2,
    wangShuai: { "旺": 1, "相": 1, "休": 0, "囚": -1, "死": -1 },
    taiSui: { "值太岁": -1, "冲太岁": -2, "合太岁": 2, "生太岁": 0, "太岁生": 1, "克太岁": -1, "太岁克": -2, "比和": 0 },
    jiangJx: { "吉": 2, "凶": -2, "": 0 },
    bands: [
      { min: 4, label: "大吉" },
      { min: 1, label: "吉" },
      { min: -2, label: "平" },
      { min: -5, label: "凶" },
      { min: -99, label: "大凶" }
    ]
  };

  static readonly YUE_LING: Record<string, Record<string, string>> = (() => {
    const m: Record<string, Record<string, string>> = {};
    const wx5: string[] = ["木", "火", "土", "金", "水"];
    LrBase.ZHI.forEach((z: string) => {
      const ling = LrBase.WX[z];
      const st: Record<string, string> = {};
      wx5.forEach((w: string) => {
        if (w === ling) {
          st[w] = "旺";
        } else if (LrBase.SHENG(ling) === w) {
          st[w] = "相";
        } else if (LrBase.SHENG(w) === ling) {
          st[w] = "休";
        } else if (LrBase.KE[w] === ling) {
          st[w] = "囚";
        } else {
          st[w] = "死";
        }
      });
      m[z] = st;
    });
    return m;
  })();

  static readonly QIJI_GONG: Record<string, Record<string, string>> = (() => {
    const gongs: string[] = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"];
    const yangS: Record<string, string> = { "甲": "亥", "丙": "寅", "戊": "寅", "庚": "巳", "壬": "申" };
    const yinS: Record<string, string> = { "乙": "午", "丁": "酉", "己": "酉", "辛": "子", "癸": "卯" };
    const m: Record<string, Record<string, string>> = {};
    const yangG: string[] = ["甲", "丙", "戊", "庚", "壬"];
    const yinG: string[] = ["乙", "丁", "己", "辛", "癸"];
    yangG.forEach((g: string) => {
      const o: Record<string, string> = {};
      const s = LrBase.ZHI.indexOf(yangS[g]);
      gongs.forEach((n: string, i: number) => {
        o[LrBase.ZHI[(s + i) % 12]] = n;
      });
      m[g] = o;
    });
    yinG.forEach((g: string) => {
      const o: Record<string, string> = {};
      const s = LrBase.ZHI.indexOf(yinS[g]);
      gongs.forEach((n: string, i: number) => {
        o[LrBase.ZHI[(s - i + 12) % 12]] = n;
      });
      m[g] = o;
    });
    return m;
  })();


  /* 地支十二宫（按地支五行统一长生，水土同宫；六壬盘面常用）：
     木(寅卯)长生亥 · 火(巳午)长生寅 · 金(申酉)长生巳 · 水土(子丑辰未戌亥)长生申 */
  static readonly ZHI_GONG: Record<string, Record<string, string>> = (() => {
    const gongs: string[] = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"];
    const changSheng: Record<string, string> = { "木": "亥", "火": "寅", "金": "巳", "水": "申", "土": "申" };
    const m: Record<string, Record<string, string>> = {};
    LrBase.ZHI.forEach((z: string) => {
      const wx = LrBase.WX[z];
      const s = LrBase.ZHI.indexOf(changSheng[wx]);
      const o: Record<string, string> = {};
      gongs.forEach((n: string, i: number) => {
        o[LrBase.ZHI[(s + i) % 12]] = n;
      });
      m[z] = o;
    });
    return m;
  })();

  static EMPTY_NODE: NodeState = { wangShuai: "", qiJi: "", kong: false };

  /* ---------------- 基础五行/关系工具 ---------------- */

  /* ---------------- 盘态计算 ---------------- */
  /* 旺衰表（读 rules.duxiang["旺衰休囚死"].旺衰） */
  static wangT(): Record<string, Record<string, string>> {
    const top = LiurenCore.rules.duxiang["旺衰休囚死"];
    if (!top) {
      return {};
    }
    const t = top["旺衰"];
    if (!t) {
      return {};
    }
    return t;
  }

  /* 年支（兼容字符串/对象形态） */
  static yearZhiOf(r: DayRec): string {
    if (typeof r.ygc === "string") {
      return r.ygc.slice(1);
    }
    const obj = r.ygc;
    if (obj) {
      return obj.z;
    }
    return "";
  }


  static computeDuxiang(c: ChartCore): Duxiang {
    const gx = LiurenCore.rules.duxiang["基础关系"] || {};
    const r = c.r;
    const kx = LrShensha.XUN_KONG[r.dg + r.dz] || [];
    const yz = r.mz;
    const dwW = (LrDx.wangT()[r.dg] || {})[yz] || "";
    const qj = LrDx.QIJI_GONG[r.dg] || {};
    const nodes: Record<string, NodeState> = {};
    LrBase.ZHI.forEach((z: string) => {
      nodes[z] = {
        wangShuai: (LrDx.YUE_LING[yz] || {})[LrBase.WX[z]] || "",
        qiJi: qj[z] || "",
        kong: kx.includes(z)
      };
    });
    /* 月将助日 */
    const yjZ = c.yj.zhi;
    const yjGong = LrBase.gongOf(c.tp, yjZ);
    const yjWx = LrBase.WX[yjZ];
    const dgWx = LrBase.WXG[r.dg];
    const yjState: YueJiangStateDx = {
      zhi: yjZ,
      gong: yjGong,
      kong: kx.includes(yjZ),
      wangShuai: nodes[yjZ].wangShuai,
      linGan: (yjGong === LrBase.JI_GONG[r.dg]),
      shengGan: (LrBase.SHENG(yjWx) === dgWx),
      keGan: (LrBase.KE[yjWx] === dgWx),
      faYong: (c.sanchuan.chuans[0].z === yjZ),
      zhu: false
    };
    yjState.zhu = (yjState.linGan || yjState.shengGan || yjState.faYong ||
      yjState.wangShuai === "旺" || yjState.wangShuai === "相") && !(yjState.keGan || yjState.kong);
    /* 贵人助日（贵人布列宫位；防御：布列异常时降级为空状态） */
    const guiGong = LrBase.gongOf(c.jiangMap, "贵人");
    const guiNd: NodeState = LrBase.ZHI.includes(guiGong) ? nodes[guiGong] : LrDx.EMPTY_NODE;
    const guiWx = LrBase.WX[guiGong] || "";
    const gr: GuirenStateDx = {
      zhi: guiGong,
      kong: !!guiNd.kong,
      wangShuai: guiNd.wangShuai || "",
      linGan: (guiGong === LrBase.JI_GONG[r.dg]),
      shengGan: !!(guiWx && LrBase.SHENG(guiWx) === dgWx),
      keGan: !!(guiWx && LrBase.KE[guiWx] === dgWx),
      faYong: (c.sanchuan.chuans[0].z === guiGong),
      zhu: false
    };
    gr.zhu = (gr.linGan || gr.shengGan || gr.faYong ||
      gr.wangShuai === "旺" || gr.wangShuai === "相") &&
      !(gr.keGan || gr.kong || gr.wangShuai === "死" || gr.wangShuai === "囚");
    /* 关系：12支 冲/合/害/刑 */
    const relations: Record<string, Relation> = {};
    LrBase.ZHI.forEach((z: string) => {
      relations[z] = {
        chong: (gx["六冲"] || {})[z] || null,
        he: (gx["六合"] || {})[z] || null,
        hai: (gx["六害"] || {})[z] || null,
        xing: (gx["三刑"] || {})[z] || []
      };
    });
    const dx: Duxiang = {
      xunkong: kx,
      monthZhi: yz,
      dayWangShuai: dwW,
      nodes: nodes,
      relations: relations,
      yuejiang: yjState,
      guiren: gr,
      shensha: LiurenCore.computeShensha(c),
      bifa: []
    };
    /* 本课格局（静态，供参考）：原 checkBifa(Object.assign({},c,{dx})) 的直接等价 */
    dx.bifa = LiurenCore.bifaForChuans(LrDx.withDx(c, dx), c.sanchuan.chuans);
    return dx;
  }

  /* 浅拷贝 ChartCore + dx -> Chart（供需要 c.dx 的格局判定使用） */
  static withDx(c: ChartCore, dx: Duxiang): Chart {
    const copy: Chart = {
      r: c.r,
      yj: c.yj,
      tp: c.tp,
      kegs: c.kegs,
      dun: c.dun,
      dunXun: c.dunXun,
      sanchuan: c.sanchuan,
      jiangMap: c.jiangMap,
      gui: c.gui,
      shun: c.shun,
      night: c.night,
      hourGan: c.hourGan,
      dx: dx
    };
    return copy;
  }


  static nianmingAdvice(c: Chart, nianZhi: string, yongShenZhi: string): NianmingAdvice {
    const shang = c.tp[nianZhi] || nianZhi;
    const w = LrBase.WX[shang];
    const dw = LrBase.WXG[c.r.dg];
    let lq = "";
    if (w === dw) {
      lq = "兄弟";
    } else if (LrBase.KE[dw] === w) {
      lq = "妻财";
    } else if (LrBase.KE[w] === dw) {
      lq = "官鬼";
    } else if (LrBase.SHENG(dw) === w) {
      lq = "子孙";
    } else {
      lq = "父母";
    }
    const nd: NodeState = c.dx.nodes[shang] || LrDx.EMPTY_NODE;
    const kong = nd.kong;
    const ws = nd.wangShuai || "";
    /* 年命上神与用神互动：生克关系 */
    let rel = "";
    let interact = "";
    if (yongShenZhi !== "") {
      const ysWx = LrBase.WX[yongShenZhi];
      if (ysWx !== "" && w !== "") {
        if (LrBase.SHENG(w) === ysWx) {
          rel = "我生";
          interact = "古籍云：年命上神生用神（" + shang + "生" + yongShenZhi + "），主命主推动此事、亲历有成之象。";
        } else if (LrBase.SHENG(ysWx) === w) {
          rel = "生我";
          interact = "用神生年命上神（" + yongShenZhi + "生" + shang + "），此事反哺命主，纵有波折终得滋养。";
        } else if (LrBase.KE[w] === ysWx) {
          rel = "我克";
          interact = "古籍云：年命上神克用神（" + shang + "克" + yongShenZhi + "），主命主能掌控此事之象。";
        } else if (LrBase.KE[ysWx] === w) {
          rel = "克我";
          interact = "古籍云：用神克年命上神（" + yongShenZhi + "克" + shang + "），主此事克命主，宜避其锋之诫仅作文献参考。";
        } else {
          rel = "比和";
          interact = "年命上神与用神比和（" + shang + "与" + yongShenZhi + "同气），事与命主相合，进展平稳。";
        }
      }
    }
    /* 基础建议 */
    let advice = "";
    if (kong) {
      advice = "古籍云：年命上神逢空，主事象易落空，缓急之机可参出空。";
    } else if (lq === "官鬼") {
      advice = "古籍云：年命上神临官鬼，主是非压力之象（传统文化参考，非现实判断）。";
    } else if (lq === "妻财") {
      advice = "古籍云：年命上神临妻财，主财利机缘之象。";
    } else if (lq === "子孙") {
      advice = "古籍云：年命上神临子孙，主救应化解之象。";
    } else if (lq === "父母") {
      advice = "古籍云：年命上神临父母，主文书长辈扶助之象。";
    } else {
      advice = "古籍云：年命上神临比肩，主同辈扶助、合作共事之象。";
    }
    if (ws === "旺" || ws === "相") {
      advice += " 年命上神旺相，古籍谓助力较实。";
    } else if (ws === "死" || ws === "囚") {
      advice += " 年命上神衰弱，古籍谓助力有限。";
    }
    if (interact !== "") {
      advice += " " + interact;
    }
    if (advice !== "") {
      advice = "按六壬法诀：" + advice;
    }
    const out: NianmingAdvice = {
      nianZhi: nianZhi,
      shangShen: shang,
      liuqin: lq,
      kong: kong,
      wangShuai: ws,
      yongShen: yongShenZhi,
      rel: rel,
      interact: interact,
      advice: advice
    };
    return out;
  }

  /* ---------------- 行年（小运） ----------------
     birthYear 出生年（如 1990）、currentYear 今年（盘之太岁年）、gender 男/女、yongShenZhi 用神支（可选）
     本命支公式：(year-4)%12（1984 甲子=0 子）
     顺逆：阳干（甲丙戊庚壬）男顺女逆；阴干（乙丁己辛癸）男逆女顺
     流年细化：行年上神与用神互动（生克）+ 与太岁关系（值/冲/合/生/克）+ 乘将吉凶 */

  static xingNian(c: Chart, birthYear: number, currentYear: number, gender: string, yongShenZhi: string): XingNianResult {
    const G = LrBase.GAN;
    const Z = LrBase.ZHI;
    const gan = G[((birthYear - 4) % 10 + 10) % 10];
    const benMingZhi = Z[((birthYear - 4) % 12 + 12) % 12];
    const yangGan = !!LrBase.G_YANG[gan];
    const isMale = gender === "男";
    const shun = yangGan ? isMale : !isMale;   /* 阳男顺/阴女顺；阳女逆/阴男逆 */
    const sui = currentYear - birthYear + 1;    /* 虚岁 */
    const startIdx = Z.indexOf(benMingZhi);
    const step = (shun ? 1 : -1);
    const xingIdx = ((startIdx + step * (sui - 1)) % 12 + 12) % 12;
    const xingNianZhi = Z[xingIdx];
    /* 行年上神 */
    const shang = c.tp[xingNianZhi] || xingNianZhi;
    const w = LrBase.WX[shang];
    const dw = LrBase.WXG[c.r.dg];
    let lq = "";
    if (w === dw) {
      lq = "兄弟";
    } else if (LrBase.KE[dw] === w) {
      lq = "妻财";
    } else if (LrBase.KE[w] === dw) {
      lq = "官鬼";
    } else if (LrBase.SHENG(dw) === w) {
      lq = "子孙";
    } else {
      lq = "父母";
    }
    const nd: NodeState = c.dx.nodes[shang] || LrDx.EMPTY_NODE;
    /* ---- ① 行年上神与用神互动（生克） ---- */
    let rel = "";
    let interact = "";
    const ys = yongShenZhi ? yongShenZhi : "";
    if (ys !== "") {
      const ysWx = LrBase.WX[ys];
      if (ysWx !== "" && w !== "") {
        if (LrBase.SHENG(w) === ysWx) {
          rel = "我生";
          interact = "古籍云：行年上神生用神（" + shang + "生" + ys + "），主今年之运推动此事之象。";
        } else if (LrBase.SHENG(ysWx) === w) {
          rel = "生我";
          interact = "用神生行年上神（" + ys + "生" + shang + "），此事反哺今年之运，纵有波折终得滋养。";
        } else if (LrBase.KE[w] === ysWx) {
          rel = "我克";
          interact = "古籍云：行年上神克用神（" + shang + "克" + ys + "），主今年能掌控此事之象。";
        } else if (LrBase.KE[ysWx] === w) {
          rel = "克我";
          interact = "古籍云：用神克行年上神（" + ys + "克" + shang + "），主此事克今年之运，避锋之诫仅作文献参考。";
        } else {
          rel = "比和";
          interact = "行年上神与用神比和（" + shang + "与" + ys + "同气），事与今年之运相合，进展平稳。";
        }
      }
    }
    /* ---- ② 与太岁关系（流年吉凶） ----
       太岁支 = 今年地支（currentYear 取支）；冲/合查基础关系表，五行生克判吉凶 */
    const taiSuiZhi = Z[((currentYear - 4) % 12 + 12) % 12];
    const gx = (LiurenCore.rules.duxiang["基础关系"] || {}) as JiChuSection;
    const chongMap: Record<string, string> = gx["六冲"] || {};
    const heMap: Record<string, string> = gx["六合"] || {};
    let tsRel = "";
    let tsNote = "";
    if (shang === taiSuiZhi) {
      tsRel = "值太岁";
      tsNote = "古籍云：行年上神临太岁，岁星当头，主动静郑重之象。";
    } else if (chongMap[shang] === taiSuiZhi) {
      tsRel = "冲太岁";
      tsNote = "古籍云：行年上神冲太岁，主变动冲击之象；远行外伤诸说仅作文献参考。";
    } else if (heMap[shang] === taiSuiZhi) {
      tsRel = "合太岁";
      tsNote = "古籍云：行年上神合太岁，主岁星眷顾、人缘合作之象。";
    } else if (w !== "") {
      const tw = LrBase.WX[taiSuiZhi];
      if (tw !== "") {
        if (LrBase.SHENG(w) === tw) {
          tsRel = "生太岁";
          tsNote = "古籍云：行年上神生太岁，主付出在前、回报在后之象。";
        } else if (LrBase.SHENG(tw) === w) {
          tsRel = "太岁生";
          tsNote = "古籍云：太岁生行年上神，主岁星生扶、根基渐固之象。";
        } else if (LrBase.KE[w] === tw) {
          tsRel = "克太岁";
          tsNote = "古籍云：行年上神克太岁，主犯岁之嫌；与上位冲突之说仅作文献参考。";
        } else if (LrBase.KE[tw] === w) {
          tsRel = "太岁克";
          tsNote = "古籍云：太岁克行年上神，主岁星压制、官非慎防之诫（传统文化参考）。";
        } else {
          tsRel = "比和";
          tsNote = "古籍云：行年上神与太岁比和，主运势平稳之象。";
        }
      }
    }
    /* ---- ③ 行年上神乘将（吉凶天将） ---- */
    const jiang = c.jiangMap[LrBase.gongOf(c.tp, shang)] || "";
    const jiangJx = jiang ? (LrJiang.JIANG_JX[jiang] || "") : "";
    let jiangNote = "";
    if (jiang !== "") {
      if (jiangJx === "吉") {
        jiangNote = "古籍云：行年上神乘吉将" + jiang + "，主助力之象。";
      } else if (jiangJx === "凶") {
        jiangNote = "古籍云：行年上神乘凶将" + jiang + "，主" + LrJiang.JIANG_WARN[jiang] + "之诫（文献参考）。";
      } else {
        jiangNote = "古籍云：行年上神乘" + jiang + "，主平稳中带变数之象。";
      }
    }
    /* ---- ④ 行年吉凶量化：五层分值汇总 → 档位（打分表数据驱动） ---- */
    const rule: XingNianScoreRule = LiurenCore.rules.xingnian || LrDx.XN_SCORE_DEFAULT;
    let score = (rule.liuQin[lq] || 0);
    if (nd.kong) {
      score += rule.kong;
    }
    score += (rule.wangShuai[nd.wangShuai] || 0);
    score += (rule.taiSui[tsRel] || 0);
    score += (rule.jiangJx[jiangJx] || 0);
    let band = "";
    for (let i = 0; i < rule.bands.length; i++) {
      if (score >= rule.bands[i].min) {
        band = rule.bands[i].label;
        break;
      }
    }
    if (band === "") {
      band = "平";
    }
    /* ---- 综合建议 ---- */
    let advice = "";
    if (nd.kong) {
      advice = "古籍云：行年上神逢空，主事象易落空，缓急可参出空。";
    } else if (lq === "官鬼") {
      advice = "古籍云：行年上神临官鬼，主是非压力之象（传统文化参考，非现实判断）。";
    } else if (lq === "妻财") {
      advice = "古籍云：行年上神临妻财，主财利机缘之象。";
    } else if (lq === "子孙") {
      advice = "古籍云：行年上神临子孙，主救应化解、小辈扶助之象。";
    } else if (lq === "父母") {
      advice = "古籍云：行年上神临父母，主长辈文书扶助之象。";
    } else {
      advice = "古籍云：行年上神临比肩，主同辈助力、合作之象。";
    }
    if (nd.wangShuai === "旺" || nd.wangShuai === "相") {
      advice += " 行年上神旺相，古籍谓运势得力。";
    } else if (nd.wangShuai === "死" || nd.wangShuai === "囚") {
      advice += " 行年上神衰弱，古籍谓宜守之象。";
    }
    if (interact !== "") {
      advice += " " + interact;
    }
    if (tsNote !== "") {
      advice += " " + tsNote;
    }
    if (jiangNote !== "") {
      advice += " " + jiangNote;
    }
    if (advice !== "") {
      advice = "按六壬法诀：" + advice;
    }
    const out: XingNianResult = {
      birthYear: birthYear,
      gender: gender,
      benMingGan: gan,
      benMingZhi: benMingZhi,
      shun: shun,
      xingNianZhi: xingNianZhi,
      shangShen: shang,
      liuqin: lq,
      kong: nd.kong,
      wangShuai: nd.wangShuai,
      yongShen: ys,
      rel: rel,
      interact: interact,
      taiSui: taiSuiZhi,
      tsRel: tsRel,
      tsNote: tsNote,
      jiang: jiang,
      jiangJx: jiangJx,
      jiangNote: jiangNote,
      score: score,
      band: band,
      advice: advice
    };
    return out;
  }

  /* ==================== 规则健康自述（§14 纪律：缺表照旧出盘，但必须查得出来） ====================
     读的就是引擎真正使用的路径，不做任何兜底；缺表 → loaded=false 且 note 说明；
     表在但无条目 → loaded=true / entries=0（「本来就该空」）。
     宿主 UI 依此显示「规则数据：已加载 N/N 表 ✓」并展开缺表清单。
     注：ArkTS 侧暂不提供本方法（其「按表名取字典」写法触发 arkts-no-props-by-index），
         ArkTS 侧的自检改由 DataLoader 逐表状态承担 —— 见 Agent.md §14。 */
  static ruleHealth(): RuleHealthItem[] {
    const out: RuleHealthItem[] = [];
    const push = (key: string, label: string, v: Object | undefined, note: string): void => {
      let entries = 0;
      let loaded = false;
      if (v != null) {
        if (Array.isArray(v)) { entries = v.length; loaded = true; }
        else { entries = Object.keys(v).length; loaded = true; }
      }
      out.push({ key: key, label: label, loaded: loaded, entries: entries, note: loaded ? "" : note });
    };
    const top = LiurenCore.rules.duxiang;
    const wsSec = top["旺衰休囚死"];
    push("duxiang.旺衰休囚死.旺衰", "旺衰休囚死（旺衰表）", wsSec ? wsSec["旺衰"] : undefined,
      "旺衰表未加载：旺衰栏不可用（盘仍可照旧排出）");
    push("duxiang.十二宫气机点", "十二宫气机点", top["十二宫气机点"], "十二宫气机点表未加载：气机点栏不可用");
    push("duxiang.空亡规则", "空亡规则", top["空亡规则"], "空亡规则表未加载：空亡规则出处不可用");
    push("duxiang.助日规则", "助日规则", top["助日规则"], "助日规则表未加载：助日说明不可用");
    push("duxiang.基础关系", "基础关系（六冲/六合/六害/三刑）", top["基础关系"], "基础关系表未加载：盘态关系栏不可用");
    push("shensha.神煞", "神煞起法", LiurenCore.rules.shensha["神煞"],
      "神煞规则表未加载：神煞栏不可用（不是「本课无神煞」）");
    push("bifa.一百法", "毕法一百法规则表", LiurenCore.rules.bifa["一百法"],
      "毕法规则表未加载：该栏不可用（不是本课未命中任何格局）");
    const xn: XingNianScoreRule | undefined = LiurenCore.rules.xingnian;
    const xnOk = !!xn && xn.kong !== undefined && Array.isArray(xn.bands) && xn.bands.length > 0;
    push("xingnian", "行年打分表", xnOk ? xn : undefined,
      "行年打分表未加载：行年栏不可用（不得静默消失）");
    return out;
  }

  /* 只列未加载项（UI 的缺表清单 / 顶部一次性提示 / 日志用） */
  static missingRules(): RuleHealthItem[] {
    return LrDx.ruleHealth().filter((x: RuleHealthItem) => !x.loaded);
  }

  /* ==================== 点宫速查卡（只读接口，§14.4） ====================
     入参：chart、地盘宫（若传天盘支则先反查其地盘宫）、当前用神支（可空）。
     纯读盘 + 查表，不改盘、不写状态。 */
  static palaceLookup(c: Chart, gongOrZhi: string, yongShenZhi: string): PalaceLookup {
    const G = LrBase.ZHI;
    let gong: string = gongOrZhi;
    if (G.indexOf(gong) < 0) { gong = ""; }
    if (c.tp[gong] === undefined) { gong = LrBase.gongOf(c.tp, gongOrZhi); }
    const tianZhi: string = c.tp[gong] || gong;
    const nd: NodeState = c.dx.nodes[tianZhi] || c.dx.nodes[gong] || LrDx.EMPTY_NODE;
    const wx: string = LrBase.WX[tianZhi] || "";
    const dwx: string = LrBase.WXG[c.r.dg] || "";
    let liuQin: string = "";
    let relGan: string = "";
    if (wx !== "" && dwx !== "") {
      if (wx === dwx) { liuQin = "比肩"; relGan = "比和"; }
      else if (LrBase.KE[dwx] === wx) { liuQin = "妻财"; relGan = "干克"; }
      else if (LrBase.KE[wx] === dwx) { liuQin = "官鬼"; relGan = "克干"; }
      else if (LrBase.SHENG(dwx) === wx) { liuQin = "子孙"; relGan = "干生"; }
      else { liuQin = "父母"; relGan = "生干"; }
    }
    let relYs: string = "未选用神";
    if (yongShenZhi !== "" && G.indexOf(yongShenZhi) >= 0) {
      const wy: string = LrBase.WX[yongShenZhi] || "";
      if (wx !== "" && wy !== "") {
        if (wx === wy) { relYs = "比和"; }
        else if (LrBase.SHENG(wx) === wy) { relYs = "生用神"; }
        else if (LrBase.KE[wx] === wy) { relYs = "克用神"; }
        else if (LrBase.SHENG(wy) === wx) { relYs = "用神生"; }
        else { relYs = "用神克"; }
      }
    }
    const chuZhi: string[] = c.sanchuan.chuans.map((x: Chuan) => x.z);
    const chuIdx: number = chuZhi.indexOf(tianZhi);
    let inChuan: string = "未入传";
    if (chuIdx === 0) { inChuan = "初传"; } else if (chuIdx === 1) { inChuan = "中传"; } else if (chuIdx === 2) { inChuan = "末传"; }
    const ji: string = LrBase.JI_GONG[c.r.dg] || "";
    const yjGong: string = LrBase.gongOf(c.tp, c.yj.zhi);
    const guiGong: string = LrBase.gongOf(c.jiangMap, "贵人");
    const isYs: boolean = yongShenZhi !== "" && yongShenZhi === tianZhi;
    const parts: string[] = [];
    parts.push("地盘" + gong + "宫");
    if (gong === ji) { parts.push("日干寄宫"); }
    if (tianZhi === c.r.dz) { parts.push("临日支"); }
    parts.push(inChuan);
    if (isYs) { parts.push("当前用神"); }
    if (gong === yjGong) { parts.push("月将宫"); }
    if (gong === guiGong) { parts.push("贵人宫"); }
    const role: PalaceRole = {
      asGong: gong,
      inChuan: inChuan,
      isYongShen: isYs,
      isRiGanGong: gong === ji,
      isRiZhi: tianZhi === c.r.dz,
      isYueJiang: gong === yjGong,
      isGuiRen: gong === guiGong,
      text: parts.join(" · ")
    };
    const out: PalaceLookup = {
      gong: gong,
      tianZhi: tianZhi,
      wuXing: wx,
      yinYang: LrBase.YANG_ZHI[tianZhi] ? "阳" : "阴",
      liuQin: liuQin,
      relToRiGan: relGan,
      relToYongShen: relYs,
      qiJi: (LrDx.QIJI_GONG[c.r.dg] || {})[tianZhi] || "",
      kong: nd.kong,
      shensha: c.dx.shensha.byZhi[tianZhi] || [],
      jiang: c.jiangMap[gong] || "",
      dun: c.dunXun[tianZhi] || "",
      dunRi: c.dun[gong] || "",
      dunShi: LrDungan.dunMap(c.hourGan)[gong] || "",
      role: role
    };
    return out;
  }

}

/* ============================================================================
 * bifa —— 毕法赋一百法命中 / 定位渲染 / 教练层
 * ----------------------------------------------------------------------------
 * 不变量：一百法规则（数据由宿主注入）。
 * 由单体核心按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ==========================================================================*/

class LrBifa {
  /* 毕法赋格局识别（18 可判定格局；chu=三传数组[{z}]，可传本课或动态三传） */
  static bifaForChuans(c: Chart, chu: Chuan[]): BifaHit[] {
    const B = LiurenCore.rules.bifa["一百法"] || [];
    const r = c.r;
    const dx = c.dx;
    const kegs = c.kegs;
    const c1 = chu[0].z;
    const c2 = chu[1].z;
    const c3 = chu[2].z;
    const ji = LrBase.JI_GONG[r.dg];
    const RILU: Record<string, string> = {
      "甲": "寅", "乙": "卯", "丙": "巳", "丁": "午", "戊": "巳",
      "己": "午", "庚": "申", "辛": "酉", "壬": "亥", "癸": "子"
    };
    const xun = LrXunkong.XUN_OF[r.dg + r.dz] || "";
    const xunWei = LrBase.ZHI[(LrBase.ZHI.indexOf(xun.slice(1)) + 9) % 12];
    const guiZhi = c.gui;
    const night = c.night;
    const yang = (z: string): boolean => !!LrBase.YANG_ZHI[z];
    const liuqinOf = (z: string): string => {
      const w = LrBase.WX[z];
      const dw = LrBase.WXG[r.dg];
      if (w === dw) {
        return "兄弟";
      }
      if (LrBase.KE[dw] === w) {
        return "妻财";
      }
      if (LrBase.KE[w] === dw) {
        return "官鬼";
      }
      if (LrBase.SHENG(dw) === w) {
        return "子孙";
      }
      return "父母";
    };
    const keZ = (a: string, b: string): boolean => LrBase.KE[LrBase.WX[a]] === LrBase.WX[b];
    const out: BifaHit[] = [];
    const hit = (no: number, note: string): void => {
      const f = B.find((x: BifaRuleRaw) => x["序"] === no);
      if (f) {
        out.push({
          "序": no,
          "法名": f["法名"] || "",
          "赋文": (f["赋文"] || "").replace(/。$/, ""),
          "判": note
        });
      }
    };
    if (c1 === LrBase.ZHI[(LrBase.ZHI.indexOf(ji) + 1) % 12] &&
        c3 === LrBase.ZHI[(LrBase.ZHI.indexOf(ji) - 1 + 12) % 12]) {
      hit(1, "初引末从");
    }
    if (kegs[0].x === xunWei && kegs[2].x === xun.slice(1)) {
      hit(2, "干上旬尾·支上旬首");
    }
    if ((night && guiZhi === LrBase.GUIREN[r.dg][0]) || (!night && guiZhi === LrBase.GUIREN[r.dg][1])) {
      if (LrBase.gongOf(c.jiangMap, "贵人") === ji) {
        hit(3, "帘幕贵人临干");
      }
    }
    const all: string[] = [ji, r.dz, kegs[0].x, kegs[1].x, kegs[2].x, kegs[3].x, c1, c2, c3];
    if (all.every((z: string) => yang(z))) {
      hit(5, "干支课传皆阳");
    }
    if (all.every((z: string) => !yang(z))) {
      hit(6, "干支课传皆阴");
    }
    if (kegs[0].x === RILU[r.dg] && (dx.dayWangShuai === "旺" || dx.dayWangShuai === "相")) {
      hit(7, "干上禄旺");
    }
    if (kegs[2].x === RILU[r.dg]) {
      hit(8, "日禄临支");
    }
    const fwd = c2 === LrBase.ZHI[(LrBase.ZHI.indexOf(c1) + 1) % 12] &&
      c3 === LrBase.ZHI[(LrBase.ZHI.indexOf(c2) + 1) % 12];
    const bwd = c2 === LrBase.ZHI[(LrBase.ZHI.indexOf(c1) - 1 + 12) % 12] &&
      c3 === LrBase.ZHI[(LrBase.ZHI.indexOf(c2) - 1 + 12) % 12];
    const chKong = chu.some((x: Chuan) => dx.xunkong.includes(x.z));
    if (fwd && chKong) {
      hit(17, "顺连茹逢空");
    }
    if (bwd && chKong) {
      hit(18, "逆连茹逢空");
    }
    const lq: string[] = chu.map((x: Chuan) => liuqinOf(x.z));
    if (lq.every((x: string) => x === "妻财") && liuqinOf(kegs[0].x) === "官鬼") {
      hit(27, "三传皆财·干上鬼");
    }
    if (lq.every((x: string) => x === "官鬼") && liuqinOf(kegs[0].x) === "妻财") {
      hit(28, "三传皆鬼·干上财");
    }
    if (keZ(c1, c2) && keZ(c2, c3) && keZ(c1, c3)) {
      hit(32, "三传递相克");
    }
    if (c1 === xunWei) {
      hit(38, "旬尾发用(闭口)");
    }
    const zhiMa: Record<string, string> = {
      "申": "寅", "子": "寅", "辰": "寅", "亥": "巳", "卯": "巳", "未": "巳",
      "寅": "申", "午": "申", "戌": "申", "巳": "亥", "酉": "亥", "丑": "亥"
    };
    if (kegs[0].x === zhiMa[r.dz] && kegs[2].x === RILU[r.dg]) {
      hit(41, "干支互换禄马");
    }
    const zhiMu: Record<string, string> = {
      "申": "辰", "子": "辰", "辰": "辰", "亥": "未", "卯": "未", "未": "未",
      "寅": "戌", "午": "戌", "戌": "戌", "巳": "丑", "酉": "丑", "丑": "丑"
    };
    if (kegs[2].x === zhiMu[r.dz] && c.yj.zhi === zhiMu[r.dz]) {
      hit(60, "支墓临支且为月将");
    }
    const ganMu: Record<string, string> = {
      "甲": "未", "乙": "未", "丙": "戌", "丁": "戌", "戊": "戌",
      "己": "戌", "庚": "丑", "辛": "丑", "壬": "辰", "癸": "辰"
    };
    if (kegs[0].x === ganMu[r.dg] && c.jiangMap[LrBase.gongOf(c.tp, kegs[0].x)] === "白虎") {
      hit(61, "干上墓乘白虎");
    }
    const huZhi = LrBase.gongOf(c.jiangMap, "白虎");
    const huDun = c.dun[huZhi] || "";
    if (huDun && LrBase.KE[LrBase.WXG[huDun]] === LrBase.WXG[r.dg]) {
      hit(69, "白虎乘" + huDun + "遁鬼");
    }
    if (liuqinOf(kegs[2].x) === "官鬼" || liuqinOf(kegs[3].x) === "官鬼") {
      hit(70, "官鬼临三四课");
    }
    /* ---- 课体格（依赖 keti 课体识别层，第六批接入） ---- */
    const keti = c.sanchuan.keti || "";
    /* 第54法 虎视逢虎：昴星课且干支上乘白虎 */
    if (keti.indexOf("昴星") >= 0) {
      const ganShangJiang = c.jiangMap[LrBase.gongOf(c.tp, kegs[0].x)] || "";
      const zhiShangJiang = c.jiangMap[LrBase.gongOf(c.tp, kegs[2].x)] || "";
      if (ganShangJiang === "白虎" || zhiShangJiang === "白虎") {
        hit(54, "虎视逢虎（昴星课干支乘白虎）");
      }
    }
    /* 第89法 任信丁马：伏吟课且逢六丁神或驿马（须言动）
       六丁神 = 旬内遁干为丁之支（旬首支顺数3：甲→乙→丙→丁） */
    if (keti === "伏吟") {
      const zhiMa = LrSanchuan.MA_ZHI[r.dz] || "";
      const xun = LrXunkong.XUN_OF[r.dg + r.dz] || "";
      const dingZhi = xun.length >= 2
        ? LrBase.ZHI[(LrBase.ZHI.indexOf(xun[1]) + 3) % 12] : "";
      const six = [ji, r.dz, kegs[0].x, kegs[1].x, kegs[2].x, kegs[3].x, c1, c2, c3];
      let hasDing = false;
      for (let i = 0; i < six.length; i++) {
        if (dingZhi !== "" && six[i] === dingZhi) {
          hasDing = true;
          break;
        }
      }
      let hasMa = false;
      for (let i = 0; i < six.length; i++) {
        if (six[i] === zhiMa) {
          hasMa = true;
          break;
        }
      }
      if (hasDing || hasMa) {
        hit(89, "任信丁马（伏吟逢丁/马，须言动）");
      }
    }
    /* 第22法 上下皆合：干支上神互为六合（如乙酉丙申戊申辛卯壬寅五日伏吟类） */
    const lh = (LiurenCore.rules.duxiang["基础关系"] || {})["六合"] as Record<string, string> || {};
    const ganShang = kegs[0].x;
    const zhiShang = kegs[2].x;
    const liuhe = (z: string): string => lh[z] || "";
    const shangHe = (liuhe(ganShang) === zhiShang || liuhe(zhiShang) === ganShang);
    if (shangHe) {
      hit(22, "上下皆合（干支上神互为六合）");
    }
    /* 第82法 不行传者：中末传空亡，其传不行，吉凶但以初传为断 */
    const chuanKong = chu.filter((x: Chuan) => dx.xunkong.includes(x.z)).length;
    if (chuanKong >= 2 && !dx.xunkong.includes(c1)) {
      hit(82, "不行传者（中末空亡，考初传）");
    }
    /* ---- 复合格局（第八批接入，不依赖课体） ---- */
    /* 第4法 催官使者：日鬼乘白虎临日干（干上神为日鬼且乘白虎） */
    const ganShangJ = c.jiangMap[LrBase.gongOf(c.tp, kegs[0].x)] || "";
    if (liuqinOf(kegs[0].x) === "官鬼" && ganShangJ === "白虎") {
      hit(4, "催官使者（日鬼乘白虎临干）");
    }
    /* 第11法 众鬼虽彰：三传皆日鬼 且 干上为子孙（制鬼） */
    const lqAll = chu.map((x: Chuan) => liuqinOf(x.z));
    if (lqAll.every((x: string) => x === "官鬼") && liuqinOf(kegs[0].x) === "子孙") {
      hit(11, "众鬼虽彰全不畏（三传皆鬼·干上子孙制之）");
    }
    /* 第31法 三传递生：初中末递生日干（末生中·中生初·初生日干，或反序） */
    const shengOf = (a: string, b: string): boolean => LrBase.SHENG(LrBase.WX[a]) === LrBase.WX[b];
    const dgWx = LrBase.WXG[r.dg];
    const chuanWx = chu.map((x: Chuan) => LrBase.WX[x.z]);
    const shengGan = (z: string): boolean => LrBase.SHENG(LrBase.WX[z]) === dgWx;
    const diSheng = (shengOf(c3, c2) && shengOf(c2, c1) && shengGan(c1));
    const diSheng2 = (shengOf(c1, c2) && shengOf(c2, c3) && shengGan(c3));
    if (diSheng || diSheng2) {
      hit(31, "三传递生（传来递生·有人举荐）");
    }
    /* 第33法 有始无终：初传为日长生、末传为日墓（先甜后苦） */
    const qj33 = LrDx.QIJI_GONG[r.dg] || {};
    const changShengZ = Object.keys(qj33).find((z: string) => qj33[z] === "长生") || "";
    const muZ = Object.keys(qj33).find((z: string) => qj33[z] === "墓") || "";
    if (changShengZ !== "" && muZ !== "" && c1 === changShengZ && c3 === muZ) {
      hit(33, "有始无终（初长生·末墓，先甜后苦）");
    }
    /* ---- 脱败逃生组（第十批接入） ---- */
    const ganS = kegs[0].x;
    const zhiS = kegs[2].x;
    const ganWx = LrBase.WXG[r.dg];
    const zhiWx = LrBase.WX[r.dz];
    /* 五行生克：a 生 b（a 为地支/天干，b 为天干或地支，自动取对应五行） */
    const shengWx = (a: string, b: string): boolean => {
      const wa = LrBase.WX[a] || LrBase.WXG[a] || "";
      const wb = LrBase.WX[b] || LrBase.WXG[b] || "";
      return wa !== "" && wb !== "" && LrBase.SHENG(wa) === wb;
    };
    const tuoGan = (z: string): boolean => shengWx(z, r.dg);   /* 上神生日干 = 脱 */
    const tuoZhi = (z: string): boolean => shengWx(z, r.dz);   /* 上神生日支 = 脱 */
    const shengGan2 = (z: string): boolean => shengWx(z, r.dg); /* 生我 */
    /* 第9法 避难逃生：三传皆无益（每传或空亡/日鬼/脱气），干上逢生可救 */
    const chuWorthless = chu.every((x: Chuan) =>
      dx.xunkong.includes(x.z) || liuqinOf(x.z) === "官鬼" || shengWx(x.z, r.dg));
    if (chuWorthless && shengGan2(ganS) && !dx.xunkong.includes(ganS)) {
      hit(9, "避难逃生（三传无益·干上逢生可救）");
    }
    /* 第35法 人宅受脱：干支上皆乘脱气（干上生日干 且 支上生日支） */
    if (tuoGan(ganS) && tuoZhi(zhiS)) {
      hit(35, "人宅受脱（干支上皆脱气，古籍有防失盗之诫）");
    }
    /* 第36法 干支皆败：干上=日干败地 且 支上=日支败地（沐浴；ZHI_GONG 地支表） */
    const qj36 = LrDx.QIJI_GONG[r.dg] || {};
    const ganBai = Object.keys(qj36).find((z: string) => qj36[z] === "沐浴") || "";
    const zj36 = LrDx.ZHI_GONG[r.dz] || {};
    const zhiBai = Object.keys(zj36).find((z: string) => zj36[z] === "沐浴") || "";
    if (ganBai !== "" && zhiBai !== "" && ganS === ganBai && zhiS === zhiBai) {
      hit(36, "干支皆败（干支上皆逢败地·百事倾颓）");
    }
    /* 第15法 脱上逢脱：日干生干上神，干上神又生其上神（层层脱耗） */
    const ganS2 = c.tp[ganS];
    if (shengWx(r.dg, ganS) && ganS2 !== "" && shengWx(ganS, ganS2)) {
      hit(15, "脱上逢脱（干生上神·上神又生，古籍有防虚诈之诫）");
    }
    return out;
  }

  /* 盘态主计算：旬空/旺衰/气机点/冲合刑害/月将·贵人助日 + 本课毕法格局 */

  /* 毕法格局·定位渲染：对每个命中格局确定焦点支，填入 定性/定象/定时/定策/定级；
     chu 可传本课或动态三传；aff 为当前占事（用于适用过滤，原全局 curAffair 抽为参数） */
  static renderBifaForChuans(c: ChartCore, dx: Duxiang, chu: Chuan[], aff: string): BifaDetail[] {
    const B = LiurenCore.rules.bifa["一百法"] || [];
    const r = c.r;
    const kegs = c.kegs;
    const kong = (z: string): boolean => dx.xunkong.includes(z);
    const jiangOf = (z: string): string => c.jiangMap[LrBase.gongOf(c.tp, z)] || "";
    const wsMap: Record<string, string> = { "旺": "旺相", "相": "旺相", "休": "休囚", "囚": "休囚", "死": "衰死" };
    const zhiMa: Record<string, string> = {
      "申": "寅", "子": "寅", "辰": "寅", "亥": "巳", "卯": "巳", "未": "巳",
      "寅": "申", "午": "申", "戌": "申", "巳": "亥", "酉": "亥", "丑": "亥"
    };
    const dingMa = ((): string => {
      const zkeys = Object.keys(dx.shensha.byZhi);
      for (let i = 0; i < zkeys.length; i++) {
        const z = zkeys[i];
        if (dx.shensha.byZhi[z].includes("旬丁(丁马)")) {
          return z;
        }
      }
      return "";
    })();
    const liuqinOf = (z: string): string => {
      const w = LrBase.WX[z];
      const dw = LrBase.WXG[r.dg];
      if (w === dw) {
        return "兄弟";
      }
      if (LrBase.KE[dw] === w) {
        return "妻财";
      }
      if (LrBase.KE[w] === dw) {
        return "官鬼";
      }
      if (LrBase.SHENG(dw) === w) {
        return "子孙";
      }
      return "父母";
    };
    const out: BifaDetail[] = [];
    const hits = LiurenCore.bifaForChuans(LrDx.withDx(c, dx), chu);
    hits.forEach((hit: BifaHit) => {
      const f = B.find((x: BifaRuleRaw) => x["序"] === hit["序"]);
      if (!f) {
        return;
      }
      const loc = (f["判定"] && f["判定"]["定位"]) || {};
      /* 焦点支：各格局取关键盘位 */
      let fz = "";
      const no = hit["序"];
      if (no === 1) {
        fz = chu[0].z;
      } else if (no === 2) {
        fz = kegs[0].x;
      } else if (no === 3) {
        fz = LrBase.gongOf(c.jiangMap, "贵人");
      } else if (no === 5 || no === 6 || no === 32 || no === 38) {
        fz = chu[0].z;
      } else if (no === 7 || no === 27 || no === 28 || no === 41 || no === 61) {
        fz = kegs[0].x;
      } else if (no === 8 || no === 60) {
        fz = kegs[2].x;
      } else if (no === 17 || no === 18) {
        const kongChuan = chu.find((x: Chuan) => kong(x.z));
        fz = kongChuan ? kongChuan.z : "";
      } else if (no === 69) {
        fz = LrBase.gongOf(c.jiangMap, "白虎");
      } else if (no === 70) {
        fz = (liuqinOf(kegs[2].x) === "官鬼") ? kegs[2].x : kegs[3].x;
      }
      const nd: NodeState = dx.nodes[fz] || LrDx.EMPTY_NODE;
      const rep: Record<string, string> = {
        "{支}": fz || "—",
        "{乘将}": fz ? jiangOf(fz) : "—",
        "{月建}": dx.monthZhi,
        "{太岁}": LrDx.yearZhiOf(r),
        "{初传}": chu[0] ? chu[0].z : "",
        "{中传}": chu[1] ? chu[1].z : "",
        "{末传}": chu[2] ? chu[2].z : "",
        "{丁马}": dingMa || "—"
      };
      const fill = (t: string): string => {
        if (!t) {
          return "";
        }
        const jz = fz ? jiangOf(fz) : "";
        const isKong = kong(fz);
        const ws = wsMap[nd.wangShuai] || "";
        const yz2 = LrDx.yearZhiOf(r);
        const segs: string[] = String(t).match(/[^；。]*[；。]/g) || [String(t)];
        const fillOut: string[] = [];
        segs.forEach((seg: string) => {
          const sep = seg.slice(-1);
          const cc = seg.slice(0, -1).trim();
          if (!cc) {
            return;
          }
          let kept = true;
          let rest = cc;
          const m1 = cc.match(/^若乘将为(.+?)，/);
          if (m1) {
            const wants = m1[1].split(/[或、/]/).map((s: string) => s.trim()).filter((s: string) => s.length > 0);
            kept = wants.some((w: string) => jz.includes(w));
            rest = cc.slice(m1[0].length);
          } else {
            const m2 = cc.match(/^若(逢空|未空)，/);
            if (m2) {
              kept = (m2[1] === "逢空") === isKong;
              rest = cc.slice(m2[0].length);
            } else {
              const m3 = cc.match(/^若(旺相|休囚|衰死)(?:或(旺相|休囚|衰死))*，/);
              if (m3) {
                const vals: string[] = [];
                if (m3[1]) {
                  vals.push(m3[1]);
                }
                if (m3[2]) {
                  vals.push(m3[2]);
                }
                kept = vals.includes(ws);
                rest = cc.slice(m3[0].length);
              } else {
                const m4 = cc.match(/^若临(月建|太岁)，/);
                if (m4) {
                  const ref = m4[1] === "月建" ? dx.monthZhi : yz2;
                  kept = fz === ref;
                  rest = cc.slice(m4[0].length);
                } else {
                  const m5 = cc.match(/^若逢丁马，/);
                  if (m5) {
                    kept = !!dingMa && fz === dingMa;
                    rest = cc.slice(m5[0].length);
                  }
                }
              }
            }
          }
          if (kept && rest) {
            fillOut.push(rest.replace(/\{支\}|\{乘将\}|\{月建\}|\{太岁\}|\{初传\}|\{中传\}|\{末传\}|\{丁马\}/g, (mm: string) => rep[mm]) + sep);
          }
        });
        return fillOut.join("");
      };
      const layer: Record<string, string> = {};
      const layerKeys: string[] = ["定性", "定象", "定时", "定策", "定级"];
      layerKeys.forEach((k: string) => {
        layer[k] = fill(loc[k]) || "";
      });
      const apply: string[] = (f["判定"] && f["判定"]["适用占事"]) || [];
      const relevant = !apply.length || apply.includes(aff);
      out.push({
        "序": no,
        "法名": f["法名"] || "",
        "赋文": (f["赋文"] || "").replace(/。$/, ""),
        "判": hit["判"],
        "焦点": fz,
        layer: layer,
        "相关": relevant,
        "适用": apply
      });
    });
    return out;
  }

  /* 本课毕法渲染（aff 显式传入，替代原全局 curAffair） */
  static renderBifa(c: ChartCore, dx: Duxiang, aff: string): BifaDetail[] {
    return LiurenCore.renderBifaForChuans(c, dx, c.sanchuan.chuans, aff);
  }

  /* ---------------- 毕法教练层（组合断 + 吉凶汇总 + 行动建议） ----------------
     coachData：rawfile/rule/毕法教练.json 的 {"格局":[{序,法名,吉凶,倾向,建议}]}
     输入 hits（本课或动态三传命中的 BifaHit[]），输出组合教练卡 */

  static bifaCoach(hits: BifaHit[], coachData: Record<string, Object>): CoachResult {
    const list = (coachData["格局"] as Record<string, Object>[]) || [];
    const items: CoachItem[] = [];
    let ji = 0, xiong = 0, zhong = 0;
    const adviceSet: string[] = [];
    hits.forEach((hit: BifaHit) => {
      for (let i = 0; i < list.length; i++) {
        const it = list[i] as Record<string, Object>;
        if (Number(it["序"]) === hit["序"]) {
          const item: CoachItem = {
            "序": hit["序"],
            "法名": String(it["法名"] || hit["法名"]),
            "吉凶": String(it["吉凶"] || "中"),
            "类": String(it["类"] || "杂"),
            "倾向": String(it["倾向"] || ""),
            "建议": String(it["建议"] || "")
          };
          items.push(item);
          if (item["吉凶"] === "吉") {
            ji++;
          } else if (item["吉凶"] === "凶") {
            xiong++;
          } else {
            zhong++;
          }
          if (item["建议"] !== "" && adviceSet.indexOf(item["建议"]) < 0) {
            adviceSet.push(item["建议"]);
          }
          break;
        }
      }
    });
    /* 组合断语 */
    let summary = "";
    const groups: string[] = [];
    if (items.length === 0) {
      summary = "本课无毕法格局命中，以四课三传与盘态常规推断。";
    } else {
      const tags: string[] = [];
      if (ji > 0) {
        tags.push(ji + " 吉");
      }
      if (xiong > 0) {
        tags.push(xiong + " 凶");
      }
      if (zhong > 0) {
        tags.push(zhong + " 中");
      }
      summary = "命中 " + items.length + " 格局（" + tags.join(" · ") + "）" +
        (xiong > ji ? "，古籍谓凶象偏重。" : (ji > xiong ? "，古籍谓吉象为主。" : "，古籍谓吉凶参半。"));
      /* 分组解读：同类格局归并（保留出现顺序，去重） */
      const seen: string[] = [];
      items.forEach((it: CoachItem) => {
        const cls = it["类"];
        if (seen.indexOf(cls) < 0) {
          seen.push(cls);
          const same = items.filter((x: CoachItem) => x["类"] === cls);
          const names = same.map((x: CoachItem) => x["法名"]).join("、");
          const tones = same.map((x: CoachItem) => x["吉凶"]);
          const hasXiong = tones.indexOf("凶") >= 0;
          const hasJi = tones.indexOf("吉") >= 0;
          let line = "";
          if (cls === "课体") {
            line = "课体上" + (hasXiong ? "主伏藏反复" : "有动象") + "（" + names + "）";
          } else if (cls === "空亡" || cls === "旬空") {
            line = "空亡之象突出（" + names + "），事多虚而不实";
          } else if (cls === "官鬼" || cls === "天将") {
            line = "官鬼天将带凶（" + names + "），古籍主是非病伤之诫";
          } else if (cls === "贵人") {
            line = "贵人相关（" + names + "），古籍主干谒扶助之象";
          } else if (cls === "禄马") {
            line = "禄马并见（" + names + "），进退有凭";
          } else if (cls === "三传") {
            line = "三传结构（" + names + "），定事之始终";
          } else if (cls === "脱耗") {
            line = "脱耗之象（" + names + "），古籍主虚耗失脱之诫";
          } else if (cls === "六合") {
            line = "和合之象（" + names + "），利合作";
          } else {
            line = names + "（" + (hasXiong ? "偏凶" : (hasJi ? "偏吉" : "中平")) + "）";
          }
          groups.push(line);
        }
      });
    }
    const out: CoachResult = { items: items, ji: ji, xiong: xiong, zhong: zhong, summary: summary, groups: groups, advice: adviceSet };
    return out;
  }

  /* ---------------- 年命适配建议 ----------------
     nianZhi：年命地支（如子）；c：完整盘（ChartCore + dx 由 withDx 提供）
     输出：年命上神 + 六亲 + 空亡/旺衰 + 适配建议 */
}

/* ============================================================================
 * zhonghuang —— 中黄五变经（二次遁 / 变干主线 / 建合检测）
 * ----------------------------------------------------------------------------
 * 不变量：经文与两份中黄口径文档。
 * 由单体核心按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ==========================================================================*/

class LrZhonghuang {
  /* ---------------- 中黄五变经 · 天干两遁 ----------------
     体：日干遁盘（盘面常遁，本体能量） = dunMap(日干)
     用：时干遁盘（中黄盘，断课核心）   = dunMap(时干)，时干=c.hourGan（引擎已算）
     变干：中黄盘中占时支对应的干（断课核心枢纽）
     注：旬另用于旬空/旬首，不作为第三种盘面天干模式
     算法经文课例验证：庚辰日未时/庚子日申时/己未日巳时/戊戌日未时 12 项全通过 */
  static zhonghuangDun(c: ChartCore, hourZhi: string): ZhonghuangDun {
    const dayGan = c.r.dg;
    const riDun = LrDungan.dunMap(dayGan);                 /* 体：日干遁盘 */
    const sg = c.hourGan;                                    /* 时干（引擎已算） */
    const shiDun = LrDungan.dunMap(sg);                    /* 用：时干遁盘（中黄盘） */
    const bianGan = shiDun[hourZhi];                         /* 变干：中黄盘占时支之干 */
    const out: ZhonghuangDun = {
      dayGan: dayGan,
      hourZhi: hourZhi,
      shiGan: sg,
      riDun: riDun,
      shiDun: shiDun,
      bianGan: bianGan
    };
    return out;
  }

  /* ---------------- 中黄五变经 · 完整分析 ----------------
     双视角六亲对比（常遁 vs 中黄时遁）+ 变干主线 + 建合检测
     输入：盘 + 占时支；输出：ZhonghuangAnalyze（供 UI 展示，可与读象/气机点配合） */

  static zhonghuangAnalyze(c: ChartCore, hourZhi: string): ZhonghuangAnalyze {
    const z = LiurenCore.zhonghuangDun(c, hourZhi);
    const dayGan = c.r.dg;
    const dwx = LrBase.WXG[dayGan];
    const liuqinOf = (gan: string): string => {
      const w = LrBase.WXG[gan];
      if (w === dwx) {
        return "比肩";
      } else if (LrBase.KE[dwx] === w) {
        return "妻财";
      } else if (LrBase.KE[w] === dwx) {
        return "官鬼";
      } else if (LrBase.SHENG(dwx) === w) {
        return "子孙";
      }
      return "父母";
    };
    /* ① 双视角对比：每宫 常遁干六亲 vs 中黄时遁干六亲 */
    const items: ZhonghuangCmpItem[] = [];
    const changed: string[] = [];
    LrBase.ZHI.forEach((gz: string) => {
      const xunGan = c.dun[gz];           /* 常遁干（传统盘：日干五鼠遁） */
      const zhGan = z.shiDun[gz];          /* 中黄时遁干 */
      const xunLq = liuqinOf(xunGan);
      const zhLq = liuqinOf(zhGan);
      const isChanged = xunLq !== zhLq;
      if (isChanged) {
        changed.push(gz);
      }
      const it: ZhonghuangCmpItem = {
        gong: gz,
        xunGan: xunGan,
        zhGan: zhGan,
        xunLq: xunLq,
        zhLq: zhLq,
        changed: isChanged
      };
      items.push(it);
    });
    /* ② 变干主线：变干落宫/乘将/三传位置 */
    const bianGong = hourZhi;
    /* 变干落占时支宫；乘将即占时支宫所临天将（不可拿天干反查 tp） */
    const bianJiang = c.jiangMap[hourZhi] || "";
    /* 变干是否在三传中 */
    let chuanPos = "";
    for (let i = 0; i < c.sanchuan.chuans.length; i++) {
      const chz = c.sanchuan.chuans[i].z;
      if (z.shiDun[chz] === z.bianGan) {
        chuanPos = ["初传", "中传", "末传"][i];
        break;
      }
    }
    /* ③ 建合检测：日遁干 × 时遁干 天干五合（重点看日上/支上/变干宫/三传） */
    const jianhe: ZhonghuangJianhe[] = [];
    const checkHe = (gz: string, label: string): void => {
      const rg = z.riDun[gz];
      const sg2 = z.shiDun[gz];
      if (LrSanchuan.HE_GAN[rg] === sg2) {
        jianhe.push({ pos: label, gong: gz, riGan: rg, shiGan: sg2, type: "建合" });
      }
    };
    checkHe(c.kegs[0].x, "日上");     /* 日上神宫位（干上） */
    checkHe(c.kegs[2].x, "支上");     /* 支上神宫位 */
    checkHe(hourZhi, "变干宫");       /* 变干所在宫 */
    for (let i = 0; i < c.sanchuan.chuans.length; i++) {
      checkHe(c.sanchuan.chuans[i].z, ["初传", "中传", "末传"][i]);
    }
    const out: ZhonghuangAnalyze = {
      dun: z,
      cmp: items,
      changed: changed,
      bianGong: bianGong,
      bianJiang: bianJiang,
      bianLq: liuqinOf(z.bianGan),
      bianInChuan: chuanPos,
      jianhe: jianhe
    };
    return out;
  }

}

/* ============================================================================
 * yongshen —— 抓用神 / 读象（class YongShenCore）
 * ----------------------------------------------------------------------------
 * 唯一允许灵活的一层：取象与评分，不进定法。
 * 由单体核心按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ==========================================================================*/

/* ============================== 抓用神/读象（YongShenCore）==============================
 * 与鸿蒙端 model/YongShenCore.ets 同构：占事解析 / 类神候选 / 动态三传 /
 * 节点卡词云 / 管辂选句（打分·收光·命中依据）。数据由宿主注入（占事体系/类象库/管辂象意）。
 * 本模块为纯计算（无 DOM），ArkTS 兼容子集（零 any、显式接口、无内联字面量类型）。
 * ============================================================================*/

/* 用神候选 */
interface YongShenCand {
  zhi: string;
  type: string;   /* "六"=六亲地支 "象"=地支取象 "将"=天将布列宫位 */
  jiang: string;  /* 该宫所乘天将（无则空串） */
}

/* 动态三传（传来递生） */
interface DongtaiItem {
  zhi: string;
  gz: string;     /* 遁干+支 */
  jiang: string;  /* 所乘天将 */
  lq: string;     /* 六亲 */
  pos: string;    /* 初传·用神·事起 / 中传·事中 / 末传·事终 */
}

/* 节点卡词云项 */
interface JieDianWord {
  k: string;      /* 标签：将·白虎 / 申·物象 / 纳音·… */
  v: string;      /* 值：象义短句 */
}

/* 读象选句结果 */
interface DuyuPick {
  shouGuang: string;   /* 收光一句 */
  items: DuyuItem[];   /* 选中断语 */
}

interface DuyuItem {
  ge: string;    /* 歌诀 */
  yi: string;    /* 释义（截断） */
  ev: string[];  /* 命中依据（乘XX/用神XX/落空/旺相/带神煞） */
}

/* 选句打分项（内部排序用） */
interface ScoredItem {
  e: Record<string, Object>;
  s: number;
}

/* 占事配置（从占事体系 JSON 提取） */
interface AffairCfg {
  name: string;
  liuqin: string[];
  jiang: string[];
  zhi: string[];
  note: string;
  guMenlei: string[];
  scene: string[];
  info: string;
}

/* 占事体系原始数据（宿主注入） */
interface ZhanShiRaw {
  "占事大类"?: Record<string, Object>[];
}

/* 天将类象（节点卡词云用） */
const TIANJIANG_LEIXIANG: Record<string, string> = {
  "贵人": "尊贵提携", "腾蛇": "虚惊怪异", "朱雀": "文书口舌", "六合": "和合媒合",
  "勾陈": "争斗官讼", "青龙": "财喜酒食", "天空": "欺诈虚妄", "白虎": "病伤血光",
  "太常": "印绶宴席", "玄武": "盗贼暗昧", "太阴": "阴私妇人", "天后": "妇人恩泽"
};

/* 占事 → 管辂神书组合读象（原文要点；管辂象意库之外的精炼句） */
const GUANLU_DUYU: Record<string, string[]> = {
  "求财": ["青龙乘旺气克日，主因财物官司，或因官司破财", "青龙入空仍作我财，一半可得一半可谐", "财临命上最可取，更喜生和合与比"],
  "求官": ["贵入于空，干贵反凶，当谒莫谒", "太常入空作官不逢，虽有禄马亦莫腾通", "太阳发用作贵人官星克干，日干得时旺相，独掌朝纲"],
  "婚姻": ["六合与日相生所求和合，若克日忌和合", "天后不克日往来相生，宜求婚姻", "青龙见破则婚姻公文案卷不行"],
  "疾病": ["白虎二死作空刑，克日辰年病必死", "白虎见空见凶不凶，宜于出往反得其功", "病符加支发用，主人口妻妾灾"],
  "官司": ["勾陈建干克日主官灾凶事", "朱雀克日主口舌官事", "贵人克日主官灾，与日相生旺凡事吉"],
  "出行": ["申为道路之神，用乘丁马必有所往", "午为马为路，发用为日鬼刑害干支，遭马而伤", "天喜带马入传来，一带行人信息至"],
  "失物": ["玄武乘卯酉横截主盗贼", "空亡作鬼带五盗玄耗，其贼自空中而来", "玄武恶神与日干不相克刑何畏"],
  "学业": ["朱雀乘水火土支干，太岁贵人相生日辰，主有权柄文字至身", "朱入于空旺文不就", "太阳皇书天诏旺，女人封赠"],
  "家宅": ["支为房屋却相生，必定人家屋宇宽", "二死加支宅死人", "午临金上人家退，破耗凶亡并其位"],
  "行人": ["初支末干带马人还，或丁或喜喜至无难", "游子斩关空亡入传，天涯尚远书也无还", "白入道神子午申，丁马必是问行人"],
  "六畜": ["占六畜逢空看地分，栏加不得地必损伤", "栏加得地临生气虽空不妨"],
  "求谋": ["传来递生，末生中中生初初生干，犹外人之推荐我", "六合与日相生所求和合", "日上神合命上神此年喜事眷自生"]
};

/* 占事 → 象意门类（管辂象意库选句范围） */
const AFFAIR_XIANGYI: Record<string, string[]> = {
  "求财": ["求财", "杂占"], "求官": ["杂占总诀"], "婚姻": ["婚姻"], "疾病": ["杂占总诀", "杂占"],
  "官司": ["杂占"], "出行": ["杂占"], "失物": ["杂占二"], "学业": ["杂占总诀"],
  "家宅": ["杂占"], "行人": ["杂占"], "六畜": ["杂占二"], "求谋": ["谋事"]
};

/* 占事关键词（句内命中加分，按占事语义粗配） */
const AFFAIR_KW: Record<string, string[]> = {
  "求财": ["财", "金", "商", "货", "酒"], "求官": ["官", "禄", "功名", "贵", "印"], "婚姻": ["婚", "妻", "夫", "嫁", "姻", "媒"],
  "疾病": ["病", "死", "医", "药", "产"], "官司": ["讼", "官符", "口舌", "争", "狱"], "出行": ["行", "路", "马", "出", "舟", "船"],
  "失物": ["失", "盗", "贼", "藏", "偷"], "学业": ["书", "文", "印", "学", "榜"], "家宅": ["宅", "家", "屋", "门", "户"],
  "行人": ["归", "还", "回", "人", "客"], "六畜": ["畜", "牛", "马", "犬", "猪", "羊"], "求谋": ["谋", "求", "合", "事", "成"]
};

/* 日干五行 → 各六亲地支（与 Web 端 LIUQIN_ZHI 一致） */
const LIUQIN_ZHI: Record<string, Record<string, string[]>> = {
  "木": { "妻财": ["辰", "戌", "丑", "未"], "官鬼": ["申", "酉"], "父母": ["亥", "子"], "比肩": ["寅", "卯"], "子孙": ["巳", "午"] },
  "火": { "妻财": ["申", "酉"], "官鬼": ["亥", "子"], "父母": ["寅", "卯"], "比肩": ["巳", "午"], "子孙": ["辰", "戌", "丑", "未"] },
  "土": { "妻财": ["亥", "子"], "官鬼": ["寅", "卯"], "父母": ["巳", "午"], "比肩": ["辰", "戌", "丑", "未"], "子孙": ["申", "酉"] },
  "金": { "妻财": ["寅", "卯"], "官鬼": ["巳", "午"], "父母": ["辰", "戌", "丑", "未"], "比肩": ["申", "酉"], "子孙": ["亥", "子"] },
  "水": { "妻财": ["巳", "午"], "官鬼": ["辰", "戌", "丑", "未"], "父母": ["申", "酉"], "比肩": ["亥", "子"], "子孙": ["寅", "卯"] }
};

class YongShenCore {
  /* 宿主注入的占事体系（12 大类，原始 JSON） */
  static zhanShi: Record<string, Object> = {};

  /* ---------------- 占事体系解析 ---------------- */

  /* 从占事体系 JSON 提取 12 大类配置 */
  static affairs(): AffairCfg[] {
    const list = (YongShenCore.zhanShi["占事大类"] as Record<string, Object>[]) || [];
    const out: AffairCfg[] = [];
    for (let i = 0; i < list.length; i++) {
      const it = list[i] as Record<string, Object>;
      const name = String(it["名称"] || '');
      const ys = (it["用神"] as Record<string, Object>) || {};
      const lq = (ys["六亲"] as string[]) || [];
      const jg = (ys["天将"] as string[]) || [];
      const zz = (ys["地支"] as string[]) || [];
      const cfg: AffairCfg = {
        name: name,
        liuqin: lq,
        jiang: jg,
        zhi: zz,
        note: String(it["断语倾向注"] || ''),
        guMenlei: (it["古门类"] as string[]) || [],
        scene: (it["场景提示词"] as string[]) || [],
        info: String(it["信息提示"] || '')
      };
      out.push(cfg);
    }
    return out;
  }

  /* 按名称取占事配置（未命中返回 null） */
  static affairByName(name: string): AffairCfg | null {
    const all = YongShenCore.affairs();
    for (let i = 0; i < all.length; i++) {
      if (all[i].name === name) {
        return all[i];
      }
    }
    return null;
  }

  /* 管辂神书组合读象（固定精炼句，供「读象直断」区展示） */
  static duyuOf(name: string): string[] {
    const arr = GUANLU_DUYU[name];
    return arr ? arr : [];
  }

  /* ---------------- 类神候选 ---------------- */

  /* 占事 → 候选列表：六亲地支 + 地支取象 + 天将布列宫位（去重） */
  static candidates(c: Chart, aff: AffairCfg): YongShenCand[] {
    const dw = LrBase.WXG[c.r.dg];
    const lqTable = LIUQIN_ZHI[dw] || {};
    const cands: YongShenCand[] = [];

    /* 1. 六亲类神地支 */
    for (let i = 0; i < aff.liuqin.length; i++) {
      const lq = aff.liuqin[i];
      const zs = lqTable[lq] || [];
      for (let j = 0; j < zs.length; j++) {
        YongShenCore.pushCand(cands, zs[j], "六", '');
      }
    }
    /* 2. 地支取象（并入候选，标注"象"） */
    for (let i = 0; i < aff.zhi.length; i++) {
      YongShenCore.pushCand(cands, aff.zhi[i], "象", '');
    }
    /* 3. 天将类神：按布列位置反查（jiangMap[地盘宫]=天将 → 天将所在宫位） */
    for (let i = 0; i < aff.jiang.length; i++) {
      const j = aff.jiang[i];
      const gong = LrBase.gongOf(c.jiangMap, j);
      if (gong !== j && gong !== null) {
        YongShenCore.pushCand(cands, gong, "将", j);
      }
    }
    /* 补充：候选宫位的乘将标注（天将候选已带；六/象候选查 jiangMap） */
    for (let i = 0; i < cands.length; i++) {
      if (cands[i].jiang === '') {
        const g = c.jiangMap[cands[i].zhi] || '';
        cands[i] = { zhi: cands[i].zhi, type: cands[i].type, jiang: g };
      }
    }
    return cands;
  }

  private static pushCand(list: YongShenCand[], z: string, type: string, jiang: string): void {
    for (let i = 0; i < list.length; i++) {
      if (list[i].zhi === z) {
        return; /* 已存在：去重 */
      }
    }
    const it: YongShenCand = { zhi: z, type: type, jiang: jiang };
    list.push(it);
  }

  /* ---------------- 六亲 / 动态三传 ---------------- */

  /* 某支相对日干的六亲（五行生克） */
  static liuqinOf(c: Chart, z: string): string {
    const dw = LrBase.WXG[c.r.dg];
    const w = LrBase.WX[z];
    if (w === dw) {
      return "兄弟";
    }
    if (LrBase.KE[dw] === w) {
      return "妻财";
    }
    if (LrBase.KE[w] === dw) {
      return "官鬼";
    }
    if (LrBase.SHENG(dw) === w) {
      return "子孙";
    }
    return "父母";
  }

  /* 动态三传：以 zhi 为初传，传来递生（初→中：天盘覆初；中→末：天盘覆中） */
  static dongtai(c: Chart, zhi: string): DongtaiItem[] {
    const c1 = zhi;
    const c2 = c.tp[c1];
    const c3 = c.tp[c2];
    /* 动态三传干支按旬遁（传统层）配干；空亡支无干故 gz 只余地支 */
    const dun = c.dunXun;
    const mk = (z: string, pos: string): DongtaiItem => {
      const gz = (dun[z] || '') + z;
      const jiang = c.jiangMap[LrBase.gongOf(c.tp, z)] || '';
      const it: DongtaiItem = { zhi: z, gz: gz, jiang: jiang, lq: YongShenCore.liuqinOf(c, z), pos: pos };
      return it;
    };
    const out: DongtaiItem[] = [];
    out.push(mk(c1, "初传 · 用神 · 事起"));
    out.push(mk(c2, "中传 · 事中"));
    out.push(mk(c3, "末传 · 事终"));
    return out;
  }

  /* ---------------- 用神节点卡：类象词云 ---------------- */

  /* 用神节点 → 词云：天将类象 / 地支象义特征+物象 / 天干类象 / 纳音象义 */
  static jieDianWords(c: Chart, z: string, leixiang: Record<string, Object>): JieDianWord[] {
    const words: JieDianWord[] = [];
    const g = c.dun[z] || '';
    const jiang = c.jiangMap[LrBase.gongOf(c.tp, z)] || '';
    /* 天将类象 */
    if (jiang !== '' && TIANJIANG_LEIXIANG[jiang]) {
      words.push(YongShenCore.w("将·" + jiang, TIANJIANG_LEIXIANG[jiang]));
    }
    /* 地支类象 */
    const dz = ((leixiang["地支类象"] as Record<string, Object>) || {})["地支"] as Record<string, Object>;
    const dzItem = (dz || {})[z] as Record<string, Object>;
    if (dzItem) {
      const feats = (dzItem["象义特征"] as string[]) || [];
      for (let i = 0; i < feats.length && i < 2; i++) {
        const p = YongShenCore.splitColon(feats[i]);
        words.push(YongShenCore.w(z + "·" + p[0], p[1]));
      }
      const wu = (dzItem["物象"] as string[]) || [];
      if (wu.length > 0) {
        words.push(YongShenCore.w(z + "·物象", YongShenCore.cut(wu.join("；"), 46)));
      }
    }
    /* 天干类象 */
    const tg = ((leixiang["天干类象"] as Record<string, Object>) || {})["天干"] as Record<string, Object>;
    const tgItem = (tg || {})[g] as Record<string, Object>;
    if (tgItem) {
      const detail = (tgItem["详细"] as string[]) || [];
      if (detail.length > 0) {
        words.push(YongShenCore.w(g + "·类象", YongShenCore.cut(detail.join("；"), 46)));
      }
    }
    /* 纳音象义 */
    const ny = ((leixiang["纳音象义"] as Record<string, Object>) || {})["六十甲子"] as Record<string, Object>;
    const nyItem = (ny || {})[g + z] as Record<string, Object>;
    if (nyItem && nyItem["纳音"]) {
      words.push(YongShenCore.w("纳音·" + String(nyItem["纳音"]), String(nyItem["象义"] || '')));
    }
    return words;
  }

  private static w(k: string, v: string): JieDianWord {
    const it: JieDianWord = { k: k, v: v };
    return it;
  }

  /* "标签：值" 拆分（首个：号） */
  private static splitColon(t: string): string[] {
    const i = t.indexOf("：");
    if (i > 0) {
      return [t.substring(0, i), t.substring(i + 1)];
    }
    return [t, ''];
  }

  /* 截断（超长加省略号） */
  private static cut(t: string, n: number): string {
    return t.length > n ? t.substring(0, n) + "…" : t;
  }

  /* ---------------- 管辂象意选句 ---------------- */

  /* 选句：按占事门类取库 → 盘态信号匹配打分 → 取最高两条（收光一句 + 命中依据）
     tick：换一条的轮换索引（Web 端"🔄 换一条"用）；anchor：锚定象名（可空） */
  static selectDuyu(c: Chart, aff: AffairCfg, cands: YongShenCand[], zhi: string,
    xiangyi: Record<string, Object>, tick: number, anchor: string): DuyuPick {
    const cur = YongShenCore.findCand(cands, zhi);
    /* 池：占事 → 门类 → 象意条目 */
    const cats = aff.guMenlei.length > 0 ? aff.guMenlei : (AFFAIR_XIANGYI[aff.name] || ["杂占"]);
    const pool: Record<string, Object>[] = [];
    for (let i = 0; i < cats.length; i++) {
      const arr = (xiangyi[cats[i]] as Record<string, Object>[]) || [];
      for (let j = 0; j < arr.length; j++) {
        pool.push(arr[j]);
      }
    }
    /* 关键词：用神天将名 + 用神地支 + 占事关键词 */
    const kw: string[] = [];
    if (cur && cur.jiang !== '') {
      kw.push(cur.jiang);
    }
    kw.push(zhi);
    const affKw = AFFAIR_KW[aff.name] || [];
    /* 打分 */
    const scored: ScoredItem[] = [];
    for (let i = 0; i < pool.length; i++) {
      const e = pool[i];
      const t = String(e["歌诀"] || '') + String(e["释义"] || '');
      let s = 0;
      for (let k = 0; k < kw.length; k++) {
        if (kw[k] !== '' && t.indexOf(kw[k]) >= 0) {
          s += 3;
        }
      }
      for (let k = 0; k < affKw.length; k++) {
        if (t.indexOf(affKw[k]) >= 0) {
          s += 1;
        }
      }
      if (e["存疑"]) {
        s -= 2;
      }
      const it: ScoredItem = { e: e, s: s };
      scored.push(it);
    }
    YongShenCore.sortDesc(scored);
    const top = scored.slice(0, 8);
    if (top.length === 0) {
      const empty: DuyuPick = { shouGuang: '', items: [] };
      return empty;
    }
    const half = Math.max(1, Math.floor(top.length / 2));
    const k = tick % top.length;
    const pick0 = top[k].e;
    const pick1 = top[(k + half) % top.length].e;
    /* 命中依据 */
    const ev0 = YongShenCore.evidenceOf(c, pick0, cur, zhi);
    const ev1 = YongShenCore.evidenceOf(c, pick1, cur, zhi);
    const nd = c.dx.nodes[zhi];
    const jj = cur ? cur.jiang : '';
    const stateT = "用神" + (c.dun[zhi] || '') + zhi + (jj !== '' ? "乘" + jj : '') +
      "，临" + String(nd.qiJi || '?') + "（" + String(nd.wangShuai || '?') + "）" +
      (nd.kong ? "落空" : '') + (anchor ? "·落象『" + anchor + "』" : '');
    const ge0 = String(pick0["歌诀"] || pick0["释义"] || '').substring(0, 30);
    const shouGuang = stateT + "——「" + ge0 + "」";
    const items: DuyuItem[] = [
      YongShenCore.mkItem(pick0, ev0),
      YongShenCore.mkItem(pick1, ev1)
    ];
    const out: DuyuPick = { shouGuang: shouGuang, items: items };
    return out;
  }

  /* 命中依据：断语文本命中了哪些盘态信号 */
  private static evidenceOf(c: Chart, e: Record<string, Object>, cur: YongShenCand | null,
    zhi: string): string[] {
    const t = String(e["歌诀"] || '') + String(e["释义"] || '');
    const ev: string[] = [];
    if (cur && cur.jiang !== '' && t.indexOf(cur.jiang) >= 0) {
      ev.push("乘" + cur.jiang);
    }
    if (t.indexOf(zhi) >= 0) {
      ev.push("用神" + zhi);
    }
    const nd = c.dx.nodes[zhi];
    if (nd) {
      if (nd.kong && (t.indexOf("空") >= 0 || t.indexOf("虚") >= 0)) {
        ev.push("落空");
      }
      const ws = String(nd.wangShuai || '');
      if ((ws === "旺" || ws === "相") && t.indexOf("旺") >= 0) {
        ev.push("旺相");
      }
    }
    const ss = (c.dx.shensha.byZhi[zhi] as string[]) || [];
    for (let i = 0; i < ss.length; i++) {
      const short = ss[i].split("(")[0];
      if (short !== '' && t.indexOf(short) >= 0) {
        ev.push("带" + short);
      }
    }
    return ev;
  }

  private static mkItem(e: Record<string, Object>, ev: string[]): DuyuItem {
    const ge = String(e["歌诀"] || '（原歌诀缺失·物类断语）');
    const yi = YongShenCore.cut(String(e["释义"] || '（无释义）'), 150);
    const it: DuyuItem = { ge: ge, yi: yi, ev: ev };
    return it;
  }

  /* 在候选中查找某支（未命中返回 null） */
  static findCand(cands: YongShenCand[], zhi: string): YongShenCand | null {
    for (let i = 0; i < cands.length; i++) {
      if (cands[i].zhi === zhi) {
        return cands[i];
      }
    }
    return null;
  }

  /* 降序排序（按分数） */
  private static sortDesc(arr: ScoredItem[]): void {
    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = 0; j < arr.length - 1 - i; j++) {
        if (arr[j].s < arr[j + 1].s) {
          const t = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = t;
        }
      }
    }
  }
}

/* ============================================================================
 * liuren-core.ts —— 大六壬核心引擎【装配层 / 门面】
 * ----------------------------------------------------------------------------
 * 引擎已按 Agent.md §13 拆分为多模块；本文件只做两件事：
 *   1) 把各模块 class 暴露到同一命名空间（对外 API 与拆分前一字不变）；
 *   2) 把公开静态方法转发到对应模块 —— **本文件不含任何判定逻辑**。
 *
 * 模块（装配顺序）：
 *   core/liuren/liuren-const.ts       LrBase
 *   core/liuren/pan/jigong.ts         LrJigong
 *   core/liuren/pan/xunkong.ts        LrXunkong
 *   core/liuren/pan/jiang.ts          LrJiang
 *   core/liuren/pan/dungan.ts         LrDungan
 *   core/liuren/pan/sanchuan.ts       LrSanchuan
 *   core/liuren/pan/sike.ts           LrSike
 *   core/liuren/pan/tiandipan.ts      LrTiandipan
 *   core/liuren/pan/shensha.ts        LrShensha
 *   core/liuren/pan/dx.ts             LrDx
 *   core/liuren/bifa.ts               LrBifa
 *   core/liuren/zhonghuang.ts         LrZhonghuang
 *   core/liuren/yongshen.ts           YongShenCore（抓用神/读象）
 *
 * ArkTS 兼容子集（与拆分前一致）：零 any/unknown、全局脚本无 import/export。
 *
 * 编译（产物仍是**单一** core/liuren-core.js，Node/Web 只加载它）：
 *   node _tools/build_core.js    # 按固定顺序拼装 core/liuren/** → tsc → liuren-core.js
 *
 * 宿主注入规则数据：LiurenCore.init({ duxiang, shensha, bifa, xingnian })
 * ==========================================================================*/

/* 门面对象：把各模块 class 暴露到同一命名空间 */
/* 门面真源：本文件是 core/liuren/** 与门面的装配输入之一（见 _tools/build_core.js） */
class LiurenCore {
  /* ---------------- 常量表（实现已搬入各模块；此处按原样再暴露一份，对外 API 不变） ----------------
     值与原实现同一引用：改规则请到归属模块改，门面只绑定。 */
  static readonly GAN: typeof LrBase.GAN = LrBase.GAN;
  static readonly ZHI: typeof LrBase.ZHI = LrBase.ZHI;
  static readonly JI_GONG: typeof LrBase.JI_GONG = LrBase.JI_GONG;
  static readonly WX: typeof LrBase.WX = LrBase.WX;
  static readonly WXG: typeof LrBase.WXG = LrBase.WXG;
  static readonly KE: typeof LrBase.KE = LrBase.KE;
  static readonly GUIREN: typeof LrBase.GUIREN = LrBase.GUIREN;
  static readonly YANG_ZHI: typeof LrBase.YANG_ZHI = LrBase.YANG_ZHI;
  static readonly G_YANG: typeof LrBase.G_YANG = LrBase.G_YANG;
  static readonly JIANG_ORDER: typeof LrJiang.JIANG_ORDER = LrJiang.JIANG_ORDER;
  static readonly JIANG_DAY_HOURS: typeof LrJiang.JIANG_DAY_HOURS = LrJiang.JIANG_DAY_HOURS;
  static readonly JIANG_SHUN_GONGS: typeof LrJiang.JIANG_SHUN_GONGS = LrJiang.JIANG_SHUN_GONGS;
  static readonly BENSHEN: typeof LrJiang.BENSHEN = LrJiang.BENSHEN;
  static readonly JIANG_JX: typeof LrJiang.JIANG_JX = LrJiang.JIANG_JX;
  static readonly JIANG_WARN: typeof LrJiang.JIANG_WARN = LrJiang.JIANG_WARN;
  static readonly MAOXING_ANCHOR: typeof LrSanchuan.MAOXING_ANCHOR = LrSanchuan.MAOXING_ANCHOR;
  static readonly BA_ZHUAN_STEP: typeof LrSanchuan.BA_ZHUAN_STEP = LrSanchuan.BA_ZHUAN_STEP;
  static readonly JINGLAN_SHE: typeof LrSanchuan.JINGLAN_SHE = LrSanchuan.JINGLAN_SHE;
  static readonly ZI_XING: typeof LrSanchuan.ZI_XING = LrSanchuan.ZI_XING;
  static readonly MA_ZHI: typeof LrSanchuan.MA_ZHI = LrSanchuan.MA_ZHI;
  static readonly XING_MAP: typeof LrSanchuan.XING_MAP = LrSanchuan.XING_MAP;
  static readonly HE_GAN: typeof LrSanchuan.HE_GAN = LrSanchuan.HE_GAN;
  static readonly QIAN_SANHE: typeof LrSanchuan.QIAN_SANHE = LrSanchuan.QIAN_SANHE;
  static readonly XN_SCORE_DEFAULT: typeof LrDx.XN_SCORE_DEFAULT = LrDx.XN_SCORE_DEFAULT;
  static readonly YUE_LING: typeof LrDx.YUE_LING = LrDx.YUE_LING;
  static readonly QIJI_GONG: typeof LrDx.QIJI_GONG = LrDx.QIJI_GONG;
  static readonly ZHI_GONG: typeof LrDx.ZHI_GONG = LrDx.ZHI_GONG;
  static readonly EMPTY_NODE: typeof LrDx.EMPTY_NODE = LrDx.EMPTY_NODE;
  static readonly XUN_KONG: typeof LrShensha.XUN_KONG = LrShensha.XUN_KONG;
  static readonly XUN_OF: typeof LrXunkong.XUN_OF = LrXunkong.XUN_OF;

  /* ---------------- 模块 class 别名（实现全部在各模块文件里） ---------------- */
  static readonly BASE: typeof LrBase = LrBase;
  static readonly JIGONG: typeof LrJigong = LrJigong;
  static readonly TIANDIPAN: typeof LrTiandipan = LrTiandipan;
  static readonly SIKE: typeof LrSike = LrSike;
  static readonly SANCHUAN: typeof LrSanchuan = LrSanchuan;
  static readonly JIANG: typeof LrJiang = LrJiang;
  static readonly DUNGAN: typeof LrDungan = LrDungan;
  static readonly XUNKONG: typeof LrXunkong = LrXunkong;
  static readonly SHENSHA: typeof LrShensha = LrShensha;
  static readonly DX: typeof LrDx = LrDx;
  static readonly BIFA: typeof LrBifa = LrBifa;
  static readonly ZHONGHUANG: typeof LrZhonghuang = LrZhonghuang;
  static readonly YONGSHEN: typeof YongShenCore = YongShenCore;

  /* ---------------- 规则数据（宿主 init 注入） ---------------- */
  static rules: CoreRules = { duxiang: {}, shensha: {}, bifa: {} };

  /* ---------------- 规则数据（宿主 init 注入） ---------------- */
  static init(rules: CoreRules): void { LiurenCore.rules = rules; }

  /* ---------------- 基础五行 / 关系工具（实现：liuren-const、pan/dungan、pan/jiang） ---------------- */
  static SHENG(a: string): string { return LrBase.SHENG(a); }
  static wxOf(x: string): string { return LrBase.wxOf(x); }
  static ke(a: string, b: string): boolean { return LrBase.ke(a, b); }
  static gongOf(tp: Record<string, string>, z: string): string { return LrBase.gongOf(tp, z); }
  static wutun(g: string): string { return LrDungan.wutun(g); }
  static hourGan(dg: string, hz: string): string { return LrDungan.hourGan(dg, hz); }

  /* ---------------- 天地盘 / 起盘入口（实现：pan/tiandipan） ---------------- */
  static findYuejiang(dateStr: string, hourZhi: string, yjAll: YueJiangSeg[]): YueJiangState { return LrTiandipan.findYuejiang(dateStr, hourZhi, yjAll); }
  static yuejiangForMonth(monthZhi: string): string { return LrTiandipan.yuejiangForMonth(monthZhi); }
  static validYuejiangForMonth(monthZhi: string, mjZhi: string): boolean { return LrTiandipan.validYuejiangForMonth(monthZhi, mjZhi); }
  static buildChart(input: ChartInput): Chart | null { return LrTiandipan.buildChart(input); }
  static buildChartAncient(mjZhi: string, dg: string, dz: string, hourZhi: string,
                           yearGan: string = "", yearZhi: string = "", monthZhi: string = ""): Chart | null {
    return LrTiandipan.buildChartAncient(mjZhi, dg, dz, hourZhi, yearGan, yearZhi, monthZhi);
  }

  /* ---------------- 四课 / 九宗门·三传（实现：pan/sike、pan/sanchuan） ---------------- */
  static buildSiKe(tp: Record<string, string>, dg: string, dz: string): Keg[] { return LrSike.sikeOf(tp, dg, dz); }
  static resolveSanchuan(dg: string, tp: Record<string, string>, kegs: Keg[], dunChuan: Record<string, string>): SanChuan { return LrSanchuan.resolveSanchuan(dg, tp, kegs, dunChuan); }
  static validGanZhi(gan: string, zhi: string): boolean { return LrSanchuan.validGanZhi(gan, zhi); }

  /* ---------------- 十二天将（实现：pan/jiang） ---------------- */
  static buildJiang(dg: string, tp: Record<string, string>, hourZhi: string): JiangBuild { return LrJiang.buildJiang(dg, tp, hourZhi); }

  /* ---------------- 遁干 / 旬空（实现：pan/dungan、pan/xunkong） ---------------- */
  static xunDun(dg: string, dz: string): Record<string, string> { return LrDungan.xunDun(dg, dz); }
  static dunMap(dg: string): Record<string, string> { return LrDungan.dunMap(dg); }

  /* ---------------- 神煞（实现：pan/shensha） ---------------- */
  static computeShensha(c: ChartCore): ShenshaResult { return LrShensha.computeShensha(c); }

  /* ---------------- 盘态（实现：pan/dx） ---------------- */
  static computeDuxiang(c: ChartCore): Duxiang { return LrDx.computeDuxiang(c); }
  static nianmingAdvice(c: Chart, nianZhi: string, yongShenZhi: string): NianmingAdvice { return LrDx.nianmingAdvice(c, nianZhi, yongShenZhi); }
  static xingNian(c: Chart, birthYear: number, currentYear: number, gender: string, yongShenZhi: string): XingNianResult { return LrDx.xingNian(c, birthYear, currentYear, gender, yongShenZhi); }
  static ruleHealth(): RuleHealthItem[] { return LrDx.ruleHealth(); }
  static missingRules(): RuleHealthItem[] { return LrDx.missingRules(); }

  /* ---------------- 毕法赋（实现：bifa） ---------------- */
  static bifaForChuans(c: Chart, chu: Chuan[]): BifaHit[] { return LrBifa.bifaForChuans(c, chu); }
  static renderBifaForChuans(c: ChartCore, dx: Duxiang, chu: Chuan[], aff: string): BifaDetail[] { return LrBifa.renderBifaForChuans(c, dx, chu, aff); }
  static renderBifa(c: ChartCore, dx: Duxiang, aff: string): BifaDetail[] { return LrBifa.renderBifa(c, dx, aff); }
  static bifaCoach(hits: BifaHit[], coachData: Record<string, Object>): CoachResult { return LrBifa.bifaCoach(hits, coachData); }

  /* ---------------- 中黄五变经（实现：zhonghuang） ---------------- */
  static zhonghuangDun(c: ChartCore, hourZhi: string): ZhonghuangDun { return LrZhonghuang.zhonghuangDun(c, hourZhi); }
  static zhonghuangAnalyze(c: ChartCore, hourZhi: string): ZhonghuangAnalyze { return LrZhonghuang.zhonghuangAnalyze(c, hourZhi); }

  /* ---------------- 拆分前的内部方法（原为 private static，JS 运行时可见） ----------------
     门面按原签名转发，保证「对外 API 一字不变」（_engine_probe.js 等按属性名取用）。 */
  static findDayRec(date: string, calData: Record<string, DayRec[]>): DayRec | null { return LrTiandipan.findDayRec(date, calData); }
  static wangT(): Record<string, Record<string, string>> { return LrDx.wangT(); }
  static yearZhiOf(r: DayRec): string { return LrDx.yearZhiOf(r); }
  static withDx(c: ChartCore, dx: Duxiang): Chart { return LrDx.withDx(c, dx); }
  /* ---------------- 点宫速查：只读接口（实现：pan/dx） ---------------- */
  static palaceLookup(c: Chart, gongOrZhi: string, yongShenZhi: string): PalaceLookup { return LrDx.palaceLookup(c, gongOrZhi, yongShenZhi); }
}

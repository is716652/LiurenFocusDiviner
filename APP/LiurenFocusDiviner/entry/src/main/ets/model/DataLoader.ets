/**
 * DataLoader —— 规则与历法数据加载器（rawfile 读取）
 * ----------------------------------------------------------------------------
 *  - loadCoreRules(ctx)：组装 7 个规则 JSON -> CoreRules（duxiang / shensha / bifa）
 *  - loadCal(ctx, year)：读 cal/cal_XXXX.json（每十年一文件），返回该年 DayRec[]
 *  - loadYjAll(ctx)：读 cal/yj_all.json（月将换将全量 1900~2060）
 * 读取方式：resourceManager.getRawFileContent(path) -> Uint8Array -> util.TextDecoder
 * 上下文：由页面注入（this.getUIContext().getHostContext()），避免使用已废弃的全局 getContext()
 * ArkTS 合规：零 any / unknown；显式类型；静态方法内一律 DataLoader.xxx()
 */
import { util } from '@kit.ArkTS';
import { common } from '@kit.AbilityKit';
import type {
  BifaRuleRaw,
  BifaRulesRaw,
  CoreRules,
  DayRec,
  DuxiangRulesRaw,
  JiChuSection,
  ShenshaRuleRaw,
  ShenshaRulesRaw,
  ScoreBand,
  WangShuaiSection,
  XingNianScoreRule,
  YueJiangSeg
} from './LiurenCore';

/* 组装后的 duxiang 扩展形态（在 DuxiangRulesRaw 基础上附带三个气机规则段，供读象扩展用） */
interface DuxiangRulesExt extends DuxiangRulesRaw {
  "十二宫气机点"?: Object;
  "空亡规则"?: Object;
  "助日规则"?: Object;
}

/* 古籍研习：一篇经文 */
export interface AncientChapter {
  卷: string;
  序: number;
  篇名: string;
  导语: string;
  段落: string[];
}

/* 古籍研习：一部书 */
export interface AncientBook {
  书名: string;
  篇目: AncientChapter[];
}

/* 古籍案例鉴赏：起课输入（月将/日干支/占时；年月干支可选） */
export interface AncientCaseInput {
  mj: string;
  dg: string;
  dz: string;
  hour: string;
  yearGan?: string;
  yearZhi?: string;
  monthZhi?: string;
}

/* 古籍案例鉴赏：中黄校验期望（可只写部分字段） */
export interface AncientCaseZhExpect {
  shiGan?: string;
  bianGan?: string;
  bianGong?: string;
  bianLq?: string;
  bianInChuan?: string;
}

/* 古籍案例鉴赏：程序复算期望（kegs 用引擎顺序：课1..课4） */
export interface AncientCaseExpect {
  kegs?: string[];
  chuans?: string[];
  chuanGz?: string[];
  chuanJiang?: string[];
  xunkong?: string[];
  dayWangShuai?: string;
  monthZhi?: string;
  method?: string;
  keti?: string;
  zhonghuang?: AncientCaseZhExpect;
}

/* 古籍案例鉴赏：断语证据锚点（view=base/zhonghuang/yongshen/bifa） */
export interface AncientCaseEvidence {
  view: string;
  kind: string;
  ref: string;
  why: string;
  pos?: string;
  /* 盘上/课上小标注：仅 key=true 时允许上盘；mark 宜 1–2 字，如 马/空/鬼 */
  mark?: string;
  key?: boolean;
}

/* 古籍案例鉴赏：单句断语的推导链 */
export interface AncientCaseReasoning {
  claim: string;
  route: string;
  evidence: AncientCaseEvidence[];
  ruleRef?: string;
  note?: string;
}

/* 古籍案例鉴赏：盘面高亮焦点 */
export interface AncientCaseFocus {
  hour?: string;
  yongShen?: string;
  chuan?: string[];
  bianGong?: string;
}

/* 古籍案例鉴赏：一案（原文 + 程序化校验锚点 + 断法链路 + 证据链） */
export interface AncientCase {
  id: string;
  title: string;
  source: string;
  chapter: string;
  input: AncientCaseInput;
  expect?: AncientCaseExpect;
  original: string;
  summary: string;
  chain: string[];
  compliance: string;
  topics?: string[];
  routes?: string[];
  focus?: AncientCaseFocus;
  reasoning?: AncientCaseReasoning[];
}

export class DataLoader {
  /* 十年历法缓存：decadeKey("2020") -> Record<year, DayRec[]> */
  private static calCache: Record<string, Record<string, DayRec[]>> = {};
  private static yjCache: YueJiangSeg[] | null = null;
  private static ruleCache: CoreRules | null = null;
  private static ancientCache: AncientBook | null = null;
  private static ancientCaseCache: AncientCase[] | null = null;

  /* ---------------- 基础读取 ---------------- */

  /* 读 rawfile 文本（UTF-8）；异常返回空串（由调用方兜底） */
  private static async readRaw(ctx: common.UIAbilityContext, path: string): Promise<string> {
    let data: Uint8Array;
    try {
      data = await ctx.resourceManager.getRawFileContent(path);
    } catch (e) {
      return '';
    }
    const decoder = util.TextDecoder.create('utf-8');
    return decoder.decodeToString(data);
  }

  /* ---------------- 规则组装 ---------------- */

  /* 组装 7 个规则文件 -> CoreRules；结果缓存 */
  static async loadCoreRules(ctx: common.UIAbilityContext): Promise<CoreRules> {
    if (DataLoader.ruleCache) {
      return DataLoader.ruleCache;
    }
    const wsTxt = await DataLoader.readRaw(ctx, 'rule/旺衰休囚死.json');
    const qjTxt = await DataLoader.readRaw(ctx, 'rule/十二宫气机点.json');
    const kxTxt = await DataLoader.readRaw(ctx, 'rule/空亡规则.json');
    const zrTxt = await DataLoader.readRaw(ctx, 'rule/助日规则.json');
    const jcTxt = await DataLoader.readRaw(ctx, 'rule/基础关系.json');
    const ssTxt = await DataLoader.readRaw(ctx, 'rule/神煞起法.json');
    const bfTxt = await DataLoader.readRaw(ctx, 'rule/毕法赋一百法.json');

    const wsParsed = JSON.parse(wsTxt) as Record<string, Object>;
    const jcParsed = JSON.parse(jcTxt) as Record<string, Object>;
    const ssParsed = JSON.parse(ssTxt) as Record<string, Object>;
    const bfParsed = JSON.parse(bfTxt) as Record<string, Object>;

    const wsSection: WangShuaiSection = {
      "旺衰": wsParsed["旺衰"] as Record<string, Record<string, string>>
    };
    const jcSection: JiChuSection = {
      "六冲": jcParsed["六冲"] as Record<string, string>,
      "六合": jcParsed["六合"] as Record<string, string>,
      "六害": jcParsed["六害"] as Record<string, string>,
      "三刑": jcParsed["三刑"] as Record<string, string[]>
    };
    const duxiang: DuxiangRulesExt = {
      "旺衰休囚死": wsSection,
      "十二宫气机点": JSON.parse(qjTxt),
      "空亡规则": JSON.parse(kxTxt),
      "助日规则": JSON.parse(zrTxt),
      "基础关系": jcSection
    };
    const shensha: ShenshaRulesRaw = {
      "神煞": ssParsed["神煞"] as Record<string, ShenshaRuleRaw>
    };
    const bifa: BifaRulesRaw = {
      "一百法": bfParsed["一百法"] as BifaRuleRaw[]
    };
    const rules: CoreRules = {
      duxiang: duxiang,
      shensha: shensha,
      bifa: bifa
    };
    try {
      const xnTxt = await DataLoader.readRaw(ctx, 'rule/行年打分.json');
      const xnParsed = JSON.parse(xnTxt) as Record<string, Object>;
      const xingnian: XingNianScoreRule = {
        liuQin: xnParsed["liuQin"] as Record<string, number>,
        kong: xnParsed["kong"] as number,
        wangShuai: xnParsed["wangShuai"] as Record<string, number>,
        taiSui: xnParsed["taiSui"] as Record<string, number>,
        jiangJx: xnParsed["jiangJx"] as Record<string, number>,
        bands: xnParsed["bands"] as ScoreBand[]
      };
      rules.xingnian = xingnian;
    } catch (e) {
      /* 行年打分表缺失：引擎用内置默认表 */
    }
    DataLoader.ruleCache = rules;
    return rules;
  }

  /* ---------------- 历法数据 ---------------- */

  /* 某年日柱数组：读对应十年文件（内部缓存整十年） */
  static async loadCal(ctx: common.UIAbilityContext, year: number): Promise<DayRec[]> {
    const dec = Math.floor(year / 10) * 10;
    const key = String(dec);
    let decade = DataLoader.calCache[key];
    if (!decade) {
      const txt = await DataLoader.readRaw(ctx, 'cal/cal_' + key + '.json');
      decade = JSON.parse(txt) as Record<string, DayRec[]>;
      DataLoader.calCache[key] = decade;
    }
    const arr = decade[String(year)];
    return arr ? arr : [];
  }

  /* 月将换将全量段（1900~2060，秒级） */
  static async loadYjAll(ctx: common.UIAbilityContext): Promise<YueJiangSeg[]> {
    if (DataLoader.yjCache) {
      return DataLoader.yjCache;
    }
    const txt = await DataLoader.readRaw(ctx, 'cal/yj_all.json');
    const arr = JSON.parse(txt) as YueJiangSeg[];
    DataLoader.yjCache = arr;
    return arr;
  }

  /* ---------------- 抓用神数据（占事体系 / 管辂类神 / 类象库 / 管辂象意） ---------------- */

  private static zsCache: Record<string, Object> | null = null;
  private static glCache: Record<string, Object> | null = null;
  private static lxCache: Record<string, Object> | null = null;
  private static xyCache: Record<string, Object> | null = null;

  /* 占事体系（12 大类：用神配置 / 古门类 / 场景提示词 / 断语倾向注 / 信息提示） */
  static async loadZhanShi(ctx: common.UIAbilityContext): Promise<Record<string, Object>> {
    if (DataLoader.zsCache) {
      return DataLoader.zsCache;
    }
    const txt = await DataLoader.readRaw(ctx, 'rule/占事体系.json');
    const obj = JSON.parse(txt) as Record<string, Object>;
    DataLoader.zsCache = obj;
    return obj;
  }

  /* 管辂类神取用（总纲 / 身命类神 / 家宅类神 …） */
  static async loadGuanlu(ctx: common.UIAbilityContext): Promise<Record<string, Object>> {
    if (DataLoader.glCache) {
      return DataLoader.glCache;
    }
    const txt = await DataLoader.readRaw(ctx, 'rule/管辂类神取用.json');
    const obj = JSON.parse(txt) as Record<string, Object>;
    DataLoader.glCache = obj;
    return obj;
  }

  /* 类象库（地支类象 / 天干类象 / 纳音象义，节点卡词云用） */
  static async loadLeixiang(ctx: common.UIAbilityContext): Promise<Record<string, Object>> {
    if (DataLoader.lxCache) {
      return DataLoader.lxCache;
    }
    const txt = await DataLoader.readRaw(ctx, 'rule/类象库.json');
    const obj = JSON.parse(txt) as Record<string, Object>;
    DataLoader.lxCache = obj;
    return obj;
  }

  /* 管辂象意（歌诀象意库，按门类：杂占总诀/杂占/求财/谋事/胎产/婚姻/杂占二） */
  static async loadXiangyi(ctx: common.UIAbilityContext): Promise<Record<string, Object>> {
    if (DataLoader.xyCache) {
      return DataLoader.xyCache;
    }
    const txt = await DataLoader.readRaw(ctx, 'rule/管辂象意.json');
    const obj = JSON.parse(txt) as Record<string, Object>;
    DataLoader.xyCache = obj;
    return obj;
  }

  /* 毕法教练（格局吉凶 / 倾向 / 行动建议；毕法教练层数据） */
  static async loadBifaCoach(ctx: common.UIAbilityContext): Promise<Record<string, Object>> {
    const txt = await DataLoader.readRaw(ctx, 'rule/毕法教练.json');
    return JSON.parse(txt) as Record<string, Object>;
  }

  /* 课体课义（九宗门课体 → 通用课义断语） */
  static async loadKetiYi(ctx: common.UIAbilityContext): Promise<Record<string, Object>> {
    const txt = await DataLoader.readRaw(ctx, 'rule/课体课义.json');
    return JSON.parse(txt) as Record<string, Object>;
  }

  /* ---------------- 古籍研习 ---------------- */

  /* 中黄五变经全文（28 篇 + 序；目录/阅读页用）；结果缓存 */
  static async loadAncient(ctx: common.UIAbilityContext): Promise<AncientBook> {
    if (DataLoader.ancientCache) {
      return DataLoader.ancientCache;
    }
    const txt = await DataLoader.readRaw(ctx, 'ancient/zhonghuang_jing.json');
    const book = JSON.parse(txt) as AncientBook;
    DataLoader.ancientCache = book;
    return book;
  }

  /* 古籍案例鉴赏库（主版/收费研习内容；免费上架版由 FeatureFlags 隐藏入口）；结果缓存 */
  static async loadAncientCases(ctx: common.UIAbilityContext): Promise<AncientCase[]> {
    if (DataLoader.ancientCaseCache) {
      return DataLoader.ancientCaseCache;
    }
    const txt = await DataLoader.readRaw(ctx, 'ancient/case_gallery.json');
    if (!txt) {
      DataLoader.ancientCaseCache = [];
      return [];
    }
    const cases = JSON.parse(txt) as AncientCase[];
    DataLoader.ancientCaseCache = cases;
    return cases;
  }
}

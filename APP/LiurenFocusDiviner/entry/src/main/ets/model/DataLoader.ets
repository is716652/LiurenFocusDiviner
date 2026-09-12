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
import { RuleHealth } from './RuleHealth';

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
  /* 断句角色：main 主断；support 旁证；timing 应期；risk 风险/变局；cross 参证 */
  role?: string;
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

  /* 读规则表：失败即登记状态（面向用户措辞，不含文件名），返回空串由调用方兜底 */
  private static async readRule(ctx: common.UIAbilityContext, key: string, p: string): Promise<string> {
    const txt = await DataLoader.readRaw(ctx, p);
    if (!txt) {
      RuleHealth.fail(key, '规则表未读取到');
    }
    return txt;
  }

  /* 解析规则表：空串说明读取阶段已登记过，不再重复登记；解析失败单独登记 */
  private static parseRule(txt: string, key: string): Record<string, Object> {
    if (txt === '') {
      return {};
    }
    try {
      return JSON.parse(txt) as Record<string, Object>;
    } catch (e) {
      RuleHealth.fail(key, '规则表内容无法解析');
      return {};
    }
  }

  /* 条目数：数组取长度、对象取键数、缺失取 0 */
  private static countKeys(v: Object | undefined): number {
    if (v === undefined || v === null) {
      return 0;
    }
    if (Array.isArray(v)) {
      return (v as Object[]).length;
    }
    return Object.keys(v as Record<string, Object>).length;
  }

  /* 表内版本/来源字段：优先 元数据.版本，其次 schemaVersion（没有则空串） */
  private static versionOf(parsed: Record<string, Object>): string {
    const meta = parsed['元数据'] as Record<string, Object> | undefined;
    if (meta !== undefined && meta !== null) {
      const v = meta['版本'] as string | undefined;
      if (v !== undefined && v !== null && v !== '') {
        return v;
      }
    }
    const sv = parsed['schemaVersion'] as string | undefined;
    if (sv !== undefined && sv !== null && sv !== '') {
      return sv;
    }
    return '';
  }

  /* 必填键缺失清单 */
  private static missingKeys(parsed: Record<string, Object>, keys: string[]): string[] {
    const out: string[] = [];
    for (const k of keys) {
      if (parsed[k] === undefined) {
        out.push(k);
      }
    }
    return out;
  }

  /* 登记：解析为空 → 沿用读取阶段的原因（不覆盖）；否则记 条目数/版本/必填键 */
  private static report(key: string, entries: number, required: string[], parsed: Record<string, Object>): void {
    if (Object.keys(parsed).length === 0) {
      if (RuleHealth.failReasonOf(key) === '') {
        RuleHealth.fail(key, '规则表未读取到');
      }
      return;
    }
    RuleHealth.okWithMissingKeys(key, entries, DataLoader.versionOf(parsed),
      DataLoader.missingKeys(parsed, required));
  }

  /* ---------------- 规则组装 ---------------- */

  /* 组装 7 个规则文件 -> CoreRules；结果缓存 */
  static async loadCoreRules(ctx: common.UIAbilityContext): Promise<CoreRules> {
    if (DataLoader.ruleCache) {
      return DataLoader.ruleCache;
    }
    /* 逐表读取 + 状态登记（§14.3）：读不到 / 解析失败 / 必填键缺，都要被登记，
       界面据此显示「规则表未加载 / 内容不完整」而不是静默留白（§14.1、§14.7）。 */
    RuleHealth.init();
    const wsTxt = await DataLoader.readRule(ctx, 'wangshuai', 'rule/旺衰休囚死.json');
    const qjTxt = await DataLoader.readRule(ctx, 'qijidian', 'rule/十二宫气机点.json');
    const kxTxt = await DataLoader.readRule(ctx, 'kongwang', 'rule/空亡规则.json');
    const zrTxt = await DataLoader.readRule(ctx, 'zhuri', 'rule/助日规则.json');
    const jcTxt = await DataLoader.readRule(ctx, 'jichu', 'rule/基础关系.json');
    const ssTxt = await DataLoader.readRule(ctx, 'shensha', 'rule/神煞起法.json');
    const bfTxt = await DataLoader.readRule(ctx, 'bifa', 'rule/毕法赋一百法.json');

    const wsParsed = DataLoader.parseRule(wsTxt, 'wangshuai');
    const jcParsed = DataLoader.parseRule(jcTxt, 'jichu');
    const ssParsed = DataLoader.parseRule(ssTxt, 'shensha');
    const bfParsed = DataLoader.parseRule(bfTxt, 'bifa');
    const qjParsed = DataLoader.parseRule(qjTxt, 'qijidian');
    const kxParsed = DataLoader.parseRule(kxTxt, 'kongwang');
    const zrParsed = DataLoader.parseRule(zrTxt, 'zhuri');

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
      "十二宫气机点": qjParsed,
      "空亡规则": kxParsed,
      "助日规则": zrParsed,
      "基础关系": jcSection
    };
    /* 核心 7 表的自检登记（条目数 / 版本 / 必填键） */
    DataLoader.report('wangshuai', DataLoader.countKeys(wsParsed['旺衰']), ['旺衰'], wsParsed);
    DataLoader.report('jichu', DataLoader.countKeys(jcParsed), ['六冲', '六合', '六害', '三刑'], jcParsed);
    DataLoader.report('shensha', DataLoader.countKeys(ssParsed['神煞']), ['神煞'], ssParsed);
    DataLoader.report('bifa', DataLoader.countKeys(bfParsed['一百法']), ['一百法'], bfParsed);
    DataLoader.report('qijidian', DataLoader.countKeys(qjParsed), [], qjParsed);
    DataLoader.report('kongwang', DataLoader.countKeys(kxParsed), [], kxParsed);
    DataLoader.report('zhuri', DataLoader.countKeys(zrParsed), [], zrParsed);
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
    /* 行年打分表：过去整个 try/catch 吞掉（键被改名时引擎抛错 → 行年被宿主吞成静默消失，§14.7 第 3 条）。
       现在读/解析/必填键三态都被登记，行年栏据此显示原因而不是消失。 */
    const xnTxt = await DataLoader.readRule(ctx, 'xingnian', 'rule/行年打分.json');
    const xnParsed = DataLoader.parseRule(xnTxt, 'xingnian');
    DataLoader.report('xingnian', DataLoader.countKeys(xnParsed['bands']),
      ['liuQin', 'kong', 'wangShuai', 'taiSui', 'jiangJx', 'bands'], xnParsed);
    if (Object.keys(xnParsed).length > 0) {
      const xingnian: XingNianScoreRule = {
        liuQin: xnParsed["liuQin"] as Record<string, number>,
        kong: xnParsed["kong"] as number,
        wangShuai: xnParsed["wangShuai"] as Record<string, number>,
        taiSui: xnParsed["taiSui"] as Record<string, number>,
        jiangJx: xnParsed["jiangJx"] as Record<string, number>,
        bands: xnParsed["bands"] as ScoreBand[]
      };
      rules.xingnian = xingnian;
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
    const txt = await DataLoader.readRule(ctx, 'zhanshi', 'rule/占事体系.json');
    const obj = DataLoader.parseRule(txt, 'zhanshi');
    DataLoader.report('zhanshi', DataLoader.countKeys(obj['占事大类']), ['占事大类'], obj);
    DataLoader.zsCache = obj;
    return obj;
  }

  /* 管辂类神取用（总纲 / 身命类神 / 家宅类神 …） */
  static async loadGuanlu(ctx: common.UIAbilityContext): Promise<Record<string, Object>> {
    if (DataLoader.glCache) {
      return DataLoader.glCache;
    }
    const txt = await DataLoader.readRule(ctx, 'guanlu', 'rule/管辂类神取用.json');
    const obj = DataLoader.parseRule(txt, 'guanlu');
    DataLoader.report('guanlu', DataLoader.countKeys(obj), [], obj);
    DataLoader.glCache = obj;
    return obj;
  }

  /* 类象库（地支类象 / 天干类象 / 纳音象义，节点卡词云用） */
  static async loadLeixiang(ctx: common.UIAbilityContext): Promise<Record<string, Object>> {
    if (DataLoader.lxCache) {
      return DataLoader.lxCache;
    }
    const txt = await DataLoader.readRule(ctx, 'leixiang', 'rule/类象库.json');
    const obj = DataLoader.parseRule(txt, 'leixiang');
    DataLoader.report('leixiang', DataLoader.countKeys(obj), [], obj);
    DataLoader.lxCache = obj;
    return obj;
  }

  /* 管辂象意（歌诀象意库，按门类：杂占总诀/杂占/求财/谋事/胎产/婚姻/杂占二） */
  static async loadXiangyi(ctx: common.UIAbilityContext): Promise<Record<string, Object>> {
    if (DataLoader.xyCache) {
      return DataLoader.xyCache;
    }
    const txt = await DataLoader.readRule(ctx, 'xiangyi', 'rule/管辂象意.json');
    const obj = DataLoader.parseRule(txt, 'xiangyi');
    DataLoader.report('xiangyi', DataLoader.countKeys(obj), [], obj);
    DataLoader.xyCache = obj;
    return obj;
  }

  /* 毕法教练（格局吉凶 / 倾向 / 行动建议；毕法教练层数据） */
  static async loadBifaCoach(ctx: common.UIAbilityContext): Promise<Record<string, Object>> {
    const txt = await DataLoader.readRule(ctx, 'bifacoach', 'rule/毕法教练.json');
    const obj = DataLoader.parseRule(txt, 'bifacoach');
    DataLoader.report('bifacoach', DataLoader.countKeys(obj['格局']), ['格局'], obj);
    return obj;
  }

  /* 课体课义（九宗门课体 → 通用课义断语） */
  static async loadKetiYi(ctx: common.UIAbilityContext): Promise<Record<string, Object>> {
    const txt = await DataLoader.readRule(ctx, 'ketiyi', 'rule/课体课义.json');
    const obj = DataLoader.parseRule(txt, 'ketiyi');
    DataLoader.report('ketiyi', DataLoader.countKeys(obj['课体']), ['课体'], obj);
    return obj;
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

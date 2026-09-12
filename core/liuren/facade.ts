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

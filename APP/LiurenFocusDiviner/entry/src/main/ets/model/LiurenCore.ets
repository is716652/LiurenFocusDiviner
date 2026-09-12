/* ============================================================================
 * LiurenCore.ets —— 大六壬核心引擎【门面 · 对外 API 与拆分前一字不变】
 * ----------------------------------------------------------------------------
 * 实现已按 Agent.md §13 拆到 pan/ 与 bifa/zhonghuang（yongshen 为独立文件）：
 *   pan/types · pan/liuren-const · pan/xunkong · pan/jiang · pan/dungan · pan/sanchuan
 *   pan/sike · pan/tiandipan · pan/shensha · pan/dx · bifa · zhonghuang
 * 本文件只做：模块别名 + 常量绑定 + 公开方法转发 + 全部类型 re-export。
 * 重新生成：node _tools/_ets_pipeline.js（勿手改本文件）
 * ==========================================================================*/

import type {
  YearGcObj, DayRec, YueJiangSeg, YueJiangState, Keg, Chuan, SanChuan, NodeState, Relation, YueJiangStateDx, GuirenStateDx, ShenshaItem, ShenshaResult, BifaHit, XingNianResult, ZhonghuangDun, ZhonghuangCmpItem, ZhonghuangJianhe, ZhonghuangAnalyze, BifaDetail, CoachItem, CoachResult, NianmingAdvice, Duxiang, ChartCore, Chart, ChartInput, JiangBuild, WangShuaiSection, JiChuSection, DuxiangRulesRaw, ShenshaRuleRaw, ShenshaRulesRaw, BifaPandingRaw, BifaRuleRaw, BifaRulesRaw, XingNianScoreRule, ScoreBand, CoreRules
} from './pan/types';
import type { PalaceLookup } from './pan/types';
import { LrBase } from './pan/liuren-const.ets';
import { LrBifa } from './bifa.ets';
import { LrDungan } from './pan/dungan.ets';
import { LrDx } from './pan/dx.ets';
import { LrJiang } from './pan/jiang.ets';
import { LrSanchuan } from './pan/sanchuan.ets';
import { LrShensha } from './pan/shensha.ets';
import { LrSike } from './pan/sike.ets';
import { LrTiandipan } from './pan/tiandipan.ets';
import { LrXunkong } from './pan/xunkong.ets';
import { LrZhonghuang } from './zhonghuang.ets';
import { YongShenCore } from './YongShenCore';

export class LiurenCore {
  /* ---------------- 模块 class 别名 ---------------- */
  static readonly BASE = LrBase;
  static readonly XUNKONG = LrXunkong;
  static readonly JIANG = LrJiang;
  static readonly DUNGAN = LrDungan;
  static readonly SANCHUAN = LrSanchuan;
  static readonly SIKE = LrSike;
  static readonly TIANDIPAN = LrTiandipan;
  static readonly SHENSHA = LrShensha;
  static readonly DX = LrDx;
  static readonly BIFA = LrBifa;
  static readonly ZHONGHUANG = LrZhonghuang;
  static readonly YONGSHEN = YongShenCore;

  /* ---------------- 常量表（实现已搬入各模块；此处按原样再暴露一份，对外 API 不变） ---------------- */
  static readonly GAN = LrBase.GAN;
  static readonly ZHI = LrBase.ZHI;
  static readonly JI_GONG = LrBase.JI_GONG;
  static readonly WX = LrBase.WX;
  static readonly WXG = LrBase.WXG;
  static readonly KE = LrBase.KE;
  static readonly GUIREN = LrBase.GUIREN;
  static readonly YANG_ZHI = LrBase.YANG_ZHI;
  static readonly G_YANG = LrBase.G_YANG;
  static readonly JIANG_ORDER = LrJiang.JIANG_ORDER;
  static readonly JIANG_DAY_HOURS = LrJiang.JIANG_DAY_HOURS;
  static readonly JIANG_SHUN_GONGS = LrJiang.JIANG_SHUN_GONGS;
  static readonly BENSHEN = LrJiang.BENSHEN;
  static readonly JIANG_JX = LrJiang.JIANG_JX;
  static readonly JIANG_WARN = LrJiang.JIANG_WARN;
  static readonly MAOXING_ANCHOR = LrSanchuan.MAOXING_ANCHOR;
  static readonly BA_ZHUAN_STEP = LrSanchuan.BA_ZHUAN_STEP;
  static readonly JINGLAN_SHE = LrSanchuan.JINGLAN_SHE;
  static readonly ZI_XING = LrSanchuan.ZI_XING;
  static readonly MA_ZHI = LrSanchuan.MA_ZHI;
  static readonly XING_MAP = LrSanchuan.XING_MAP;
  static readonly HE_GAN = LrSanchuan.HE_GAN;
  static readonly QIAN_SANHE = LrSanchuan.QIAN_SANHE;
  static readonly XN_SCORE_DEFAULT = LrDx.XN_SCORE_DEFAULT;
  static readonly YUE_LING = LrDx.YUE_LING;
  static readonly QIJI_GONG = LrDx.QIJI_GONG;
  static readonly ZHI_GONG = LrDx.ZHI_GONG;
  static readonly EMPTY_NODE = LrDx.EMPTY_NODE;
  static readonly XUN_KONG = LrShensha.XUN_KONG;
  static readonly XUN_OF = LrXunkong.XUN_OF;

  /* ---------------- 规则数据（宿主 init 注入） ---------------- */
  static rules: CoreRules = LiurenCore.emptyRules();

  /* 空规则（init 注入前默认值） */
  static emptyRules(): CoreRules {
    const duxiang: DuxiangRulesRaw = {};
    const shensha: ShenshaRulesRaw = {};
    const bifa: BifaRulesRaw = {};
    const out: CoreRules = { duxiang: duxiang, shensha: shensha, bifa: bifa };
    return out;
  }

  static init(rules: CoreRules): void {
    LiurenCore.rules = rules;
  }

  /* ---------------- 转发到 LrBase ---------------- */
  static SHENG(a: string): string { return LrBase.SHENG(a); }
  static wxOf(x: string): string { return LrBase.wxOf(x); }
  static ke(a: string, b: string): boolean { return LrBase.ke(a, b); }
  static gongOf(tp: Record<string, string>, z: string): string { return LrBase.gongOf(tp, z); }

  /* ---------------- 转发到 LrDungan ---------------- */
  static wutun(g: string): string { return LrDungan.wutun(g); }
  static hourGan(dg: string, hz: string): string { return LrDungan.hourGan(dg, hz); }
  static xunDun(dg: string, dz: string): Record<string, string> { return LrDungan.xunDun(dg, dz); }
  static dunMap(dg: string): Record<string, string> { return LrDungan.dunMap(dg); }

  /* ---------------- 转发到 LrJiang ---------------- */
  static buildJiang(dg: string, tp: Record<string, string>, hourZhi: string): JiangBuild { return LrJiang.buildJiang(dg, tp, hourZhi); }

  /* ---------------- 转发到 LrSanchuan ---------------- */
  static validGanZhi(gan: string, zhi: string): boolean { return LrSanchuan.validGanZhi(gan, zhi); }
  static resolveSanchuan(dg: string, tp: Record<string, string>, kegs: Keg[], dunChuan: Record<string, string>): SanChuan { return LrSanchuan.resolveSanchuan(dg, tp, kegs, dunChuan); }

  /* ---------------- 转发到 LrSike ---------------- */
  static sikeOf(tp: Record<string, string>, dg: string, dz: string): Keg[] { return LrSike.sikeOf(tp, dg, dz); }
  static buildSiKe(tp: Record<string, string>, dg: string, dz: string): Keg[] { return LrSike.sikeOf(tp, dg, dz); }

  /* ---------------- 转发到 LrTiandipan ---------------- */
  static findYuejiang(dateStr: string, hourZhi: string, yjAll: YueJiangSeg[]): YueJiangState { return LrTiandipan.findYuejiang(dateStr, hourZhi, yjAll); }
  static yuejiangForMonth(monthZhi: string): string { return LrTiandipan.yuejiangForMonth(monthZhi); }
  static validYuejiangForMonth(monthZhi: string, mjZhi: string): boolean { return LrTiandipan.validYuejiangForMonth(monthZhi, mjZhi); }
  static findDayRec(date: string, calData: Record<string, DayRec[]>): DayRec | null { return LrTiandipan.findDayRec(date, calData); }
  static buildChart(input: ChartInput): Chart | null { return LrTiandipan.buildChart(input); }
  static buildChartAncient(mjZhi: string, dg: string, dz: string, hourZhi: string, yearGan: string = "", yearZhi: string = "", monthZhi: string = ""): Chart | null {
    return LrTiandipan.buildChartAncient(mjZhi, dg, dz, hourZhi, yearGan, yearZhi, monthZhi);
  }

  /* ---------------- 转发到 LrShensha ---------------- */
  static computeShensha(c: ChartCore): ShenshaResult { return LrShensha.computeShensha(c); }

  /* ---------------- 转发到 LrDx ---------------- */
  static wangT(): Record<string, Record<string, string>> { return LrDx.wangT(); }
  static yearZhiOf(r: DayRec): string { return LrDx.yearZhiOf(r); }
  static findZhiOfGong(qj: Record<string, string>, gong: string): string { return LrDx.findZhiOfGong(qj, gong); }
  static withDx(c: ChartCore, dx: Duxiang): Chart { return LrDx.withDx(c, dx); }
  static computeDuxiang(c: ChartCore): Duxiang { return LrDx.computeDuxiang(c); }
  static nianmingAdvice(c: Chart, nianZhi: string, yongShenZhi: string): NianmingAdvice { return LrDx.nianmingAdvice(c, nianZhi, yongShenZhi); }
  static xingNian(c: Chart, birthYear: number, currentYear: number, gender: string, yongShenZhi: string): XingNianResult { return LrDx.xingNian(c, birthYear, currentYear, gender, yongShenZhi); }
  static palaceLookup(c: Chart, gongOrZhi: string, yongShenZhi: string): PalaceLookup { return LrDx.palaceLookup(c, gongOrZhi, yongShenZhi); }

  /* ---------------- 转发到 LrBifa ---------------- */
  static bifaForChuans(c: Chart, chu: Chuan[]): BifaHit[] { return LrBifa.bifaForChuans(c, chu); }
  static renderBifaForChuans(c: ChartCore, dx: Duxiang, chu: Chuan[], aff: string): BifaDetail[] { return LrBifa.renderBifaForChuans(c, dx, chu, aff); }
  static renderBifa(c: ChartCore, dx: Duxiang, aff: string): BifaDetail[] { return LrBifa.renderBifa(c, dx, aff); }
  static bifaCoach(hits: BifaHit[], coachData: Record<string, Object>): CoachResult { return LrBifa.bifaCoach(hits, coachData); }

  /* ---------------- 转发到 LrZhonghuang ---------------- */
  static zhonghuangDun(c: ChartCore, hourZhi: string): ZhonghuangDun { return LrZhonghuang.zhonghuangDun(c, hourZhi); }
  static zhonghuangAnalyze(c: ChartCore, hourZhi: string): ZhonghuangAnalyze { return LrZhonghuang.zhonghuangAnalyze(c, hourZhi); }
}

export type {
  YearGcObj, DayRec, YueJiangSeg, YueJiangState, Keg, Chuan, SanChuan, NodeState, Relation, YueJiangStateDx, GuirenStateDx, ShenshaItem, ShenshaResult, BifaHit, XingNianResult, ZhonghuangDun, ZhonghuangCmpItem, ZhonghuangJianhe, ZhonghuangAnalyze, BifaDetail, CoachItem, CoachResult, NianmingAdvice, Duxiang, ChartCore, Chart, ChartInput, JiangBuild, WangShuaiSection, JiChuSection, DuxiangRulesRaw, ShenshaRuleRaw, ShenshaRulesRaw, BifaPandingRaw, BifaRuleRaw, BifaRulesRaw, XingNianScoreRule, ScoreBand, CoreRules
} from './pan/types';

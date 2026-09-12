/* ============================================================================
 * pan/tiandipan —— 天地盘与主起盘入口
 * ----------------------------------------------------------------------------
 * 不变量：规范《天地盘的天盘地支排法》。
 * 由单体 LiurenCore.ets 按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ArkTS：原生 import/export；跨模块引用经门面 LiurenCore（与 .ts 侧同口径）。
 * 重新生成：node _tools/_ets_build.js（勿手改本文件）
 * ==========================================================================*/

import type {
  DayRec, YueJiangSeg, YueJiangState, Keg, ChartCore, Chart, ChartInput, JiangBuild
} from './types';
import { LiurenCore } from '../LiurenCore';
import { LrSike } from './sike';
import { LrBase } from './liuren-const';
import { LrDungan } from './dungan';
import { LrJiang } from './jiang';

export class LrTiandipan {
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
    /* 遁干 */
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

  static yuejiangForMonth(monthZhi: string): string {
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
    const zs = LrBase.ZHI.indexOf(hourZhi);
    const tp: Record<string, string> = {};
    LrBase.ZHI.forEach((z: string, i: number) => {
      tp[z] = LrBase.ZHI[(mj + (i - zs) + 12) % 12];
    });
    const g1 = tp[LrBase.JI_GONG[dg]];
    const g2 = tp[g1];
    const g3 = tp[dz];
    const g4 = tp[g3];
    const kegs: Keg[] = [
      { x: g1, s: dg },
      { x: g2, s: g1 },
      { x: g3, s: dz },
      { x: g4, s: g3 }
    ];
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
}

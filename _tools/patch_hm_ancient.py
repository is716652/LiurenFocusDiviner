# -*- coding: utf-8 -*-
"""补丁：鸿蒙 LiurenCore.ets 新增 buildChartAncient（古籍案例起盘）"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\model\LiurenCore.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    # 在 buildChart 方法后插入 buildChartAncient
    # 找 buildChart 的结尾：hourGan: core.hourGan,\n      dx: dx\n    };\n    return chart;\n  }
    old_end = """      hourGan: core.hourGan,
      dx: dx
    };
    return chart;
  }"""
    assert s.count(old_end) == 1, 'end: %d' % s.count(old_end)
    new_fn = old_end + """

  /* ---------------- 古籍案例起盘 ----------------
     古代案例：月将 + 日干支 + 占时（必需）；年干支/月支 可选。
     天地盘/四课/三传/天将 只需必需项即可完整还原；
     年干支可选 → 太岁等年系神煞完整；缺失则降级。 */
  static buildChartAncient(mjZhi: string, dg: string, dz: string, hourZhi: string,
                           yearGan: string = "", yearZhi: string = "", monthZhi: string = ""): Chart | null {
    const mj = LiurenCore.ZHI.indexOf(mjZhi);
    if (mj < 0) {
      return null;
    }
    const r: DayRec = {
      d: dg + dz + "日",
      dg: dg,
      dz: dz,
      mg: "",
      mz: (monthZhi !== "" && LiurenCore.ZHI.indexOf(monthZhi) >= 0) ? monthZhi : mjZhi,
      ygc: (yearGan !== "" && yearZhi !== "") ? (yearGan + yearZhi) : ""
    };
    const yj: YueJiangState = { jiang: "", zhi: mjZhi, term: "古籍案例" };
    const zs = LiurenCore.ZHI.indexOf(hourZhi);
    const tp: Record<string, string> = {};
    LiurenCore.ZHI.forEach((z: string, i: number) => {
      tp[z] = LiurenCore.ZHI[(mj + (i - zs) + 12) % 12];
    });
    const g1 = tp[LiurenCore.JI_GONG[dg]];
    const g2 = tp[g1];
    const g3 = tp[dz];
    const g4 = tp[g3];
    const kegs: Keg[] = [
      { x: g1, s: dg },
      { x: g2, s: g1 },
      { x: g3, s: dz },
      { x: g4, s: g3 }
    ];
    const dun = LiurenCore.dunMap(dg);
    const sanchuan = LiurenCore.resolveSanchuan(dg, tp, kegs, dun);
    const night = !(LiurenCore.ZHI.indexOf(hourZhi) >= 3 && LiurenCore.ZHI.indexOf(hourZhi) <= 8);
    const gui = night ? LiurenCore.GUIREN[dg][1] : LiurenCore.GUIREN[dg][0];
    const guiGong = LiurenCore.gongOf(tp, gui);
    const guiIdx = LiurenCore.ZHI.indexOf(guiGong);
    const shun = guiIdx === 11 || guiIdx <= 4;
    const order = shun ? LiurenCore.JIANG_SHUN : LiurenCore.JIANG_NI;
    const jiangMap: Record<string, string> = {};
    for (let k = 0; k < 12; k++) {
      const g = shun
        ? LiurenCore.ZHI[(LiurenCore.ZHI.indexOf(guiGong) + k) % 12]
        : LiurenCore.ZHI[(LiurenCore.ZHI.indexOf(guiGong) - k + 12) % 12];
      jiangMap[g] = order[k];
    }
    const core: ChartCore = {
      r: r,
      yj: yj,
      tp: tp,
      kegs: kegs,
      dun: dun,
      sanchuan: sanchuan,
      jiangMap: jiangMap,
      gui: gui,
      shun: shun,
      night: night,
      hourGan: LiurenCore.hourGan(dg, hourZhi)
    };
    const dx = LiurenCore.computeDuxiang(core);
    const chart: Chart = {
      r: r,
      yj: yj,
      tp: tp,
      kegs: kegs,
      dun: dun,
      sanchuan: sanchuan,
      jiangMap: jiangMap,
      gui: gui,
      shun: shun,
      night: night,
      hourGan: core.hourGan,
      dx: dx
    };
    return chart;
  }"""
    s = s.replace(old_end, new_fn)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('HM buildChartAncient PATCH OK')

if __name__ == '__main__':
    main()

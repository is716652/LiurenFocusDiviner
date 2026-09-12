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

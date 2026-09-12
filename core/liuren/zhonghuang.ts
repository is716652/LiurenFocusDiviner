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

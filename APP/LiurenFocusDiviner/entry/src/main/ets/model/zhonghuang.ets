/* ============================================================================
 * zhonghuang —— 中黄五变经（二次遁 / 变干主线 / 建合检测）
 * ----------------------------------------------------------------------------
 * 不变量：经文与两份中黄口径文档。
 * 由单体 LiurenCore.ets 按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ArkTS：原生 import/export；跨模块引用经门面 LiurenCore（与 .ts 侧同口径）。
 * 重新生成：node _tools/_ets_build.js（勿手改本文件）
 * ==========================================================================*/

import type {
  ZhonghuangDun, ZhonghuangCmpItem, ZhonghuangJianhe, ZhonghuangAnalyze, ChartCore
} from './pan/types';
import { LiurenCore } from './LiurenCore';
import { LrBase } from './pan/liuren-const';
import { LrDungan } from './pan/dungan';
import { LrSanchuan } from './pan/sanchuan';

export class LrZhonghuang {
  static zhonghuangDun(c: ChartCore, hourZhi: string): ZhonghuangDun {
    const dayGan = c.r.dg;
    const riDun = LrDungan.dunMap(dayGan);
    const sg = c.hourGan;
    const shiDun = LrDungan.dunMap(sg);
    const bianGan = shiDun[hourZhi];
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
    const items: ZhonghuangCmpItem[] = [];
    const changed: string[] = [];
    LrBase.ZHI.forEach((gz: string) => {
      const xunGan = c.dun[gz];
      const zhGan = z.shiDun[gz];
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
    const bianGong = hourZhi;
    /* 变干落占时支宫；乘将即占时支宫所临天将（不可拿天干反查 tp） */
    const bianJiang = c.jiangMap[hourZhi] || "";
    let chuanPos = "";
    for (let i = 0; i < c.sanchuan.chuans.length; i++) {
      const chz = c.sanchuan.chuans[i].z;
      if (z.shiDun[chz] === z.bianGan) {
        chuanPos = ["初传", "中传", "末传"][i];
        break;
      }
    }
    const jianhe: ZhonghuangJianhe[] = [];
    const checkHe = (gz: string, label: string): void => {
      const rg = z.riDun[gz];
      const sg2 = z.shiDun[gz];
      if (LrSanchuan.HE_GAN[rg] === sg2) {
        jianhe.push({ pos: label, gong: gz, riGan: rg, shiGan: sg2, type: "建合" });
      }
    };
    checkHe(c.kegs[0].x, "日上");
    checkHe(c.kegs[2].x, "支上");
    checkHe(hourZhi, "变干宫");
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

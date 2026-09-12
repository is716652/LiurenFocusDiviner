/* ============================================================================
 * pan/dungan —— 遁干（旬遁 / 日干遁 / 时干）
 * ----------------------------------------------------------------------------
 * 不变量：《五子元遁法》；旬遁为传统默认层。
 * 由单体 LiurenCore.ets 按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ArkTS：原生 import/export；跨模块引用经门面 LiurenCore（与 .ts 侧同口径）。
 * 重新生成：node _tools/_ets_pipeline.js（勿手改本文件）
 * ==========================================================================*/

import { LiurenCore } from '../LiurenCore';
import { LrBase } from './liuren-const';

export class LrDungan {
  /* ---------------- 排盘引擎 ---------------- */
  /* 五子元遁首干：日干 -> 遁首 */
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
    const sz: string = Z[(Math.floor(n / 10) * 10) % 12]; /* 旬首之支（旬首必为甲×） */
    for (let k = 0; k < 12; k++) {
      m[Z[(Z.indexOf(sz) + k) % 12]] = k < 10 ? G[k % 10] : "";
    }
    return m;
  }

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

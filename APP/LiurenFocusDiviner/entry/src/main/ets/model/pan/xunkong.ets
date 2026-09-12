/* ============================================================================
 * pan/xunkong —— 旬空
 * ----------------------------------------------------------------------------
 * 不变量：旬遁下空亡支不配干；旬表 甲子戌亥 … 甲寅子丑。
 * 由单体 LiurenCore.ets 按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ArkTS：原生 import/export；跨模块引用经门面 LiurenCore（与 .ts 侧同口径）。
 * 重新生成：node _tools/_ets_pipeline.js（勿手改本文件）
 * ==========================================================================*/

import { LiurenCore } from '../LiurenCore';
import { LrBase } from './liuren-const';

export class LrXunkong {
  static readonly XUN_OF: Record<string, string> = (() => {
    const m: Record<string, string> = {};
    const t: string[] = ["甲子", "甲戌", "甲申", "甲午", "甲辰", "甲寅"];
    t.forEach((jia: string) => {
      const j = LrBase.GAN.indexOf(jia[0]);
      const z = LrBase.ZHI.indexOf(jia[1]);
      for (let i = 0; i < 10; i++) {
        m[LrBase.GAN[(j + i) % 10] + LrBase.ZHI[(z + i) % 12]] = jia;
      }
    });
    return m;
  })();
}

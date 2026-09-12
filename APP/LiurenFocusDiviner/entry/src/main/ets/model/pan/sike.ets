/* ============================================================================
 * pan/sike —— 四课（干→干阴→支→支阴）
 * ----------------------------------------------------------------------------
 * 本站是四课的唯一归属：两个起盘入口原先各自内联的四行四课，抽为 sikeOf 单一实现。
 * 由单体 LiurenCore.ets 按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ArkTS：原生 import/export；跨模块引用经门面 LiurenCore（与 .ts 侧同口径）。
 * 重新生成：node _tools/_ets_build.js（勿手改本文件）
 * ==========================================================================*/

import type {
  Keg
} from './types';
import { LiurenCore } from '../LiurenCore';
import { LrBase } from './liuren-const';

export class LrSike {
  /* 四课：干→干阴→支→支阴（规范《四课排法》）
     原 buildChart / buildChartAncient 各自内联的四行，抽为唯一实现（等价抽取，判定不变） */
  static sikeOf(tp: Record<string, string>, dg: string, dz: string): Keg[] {
    const g1 = tp[LrBase.JI_GONG[dg]];
    const g2 = tp[g1];
    const g3 = tp[dz];
    const g4 = tp[g3];
    return [
      { x: g1, s: dg },
      { x: g2, s: g1 },
      { x: g3, s: dz },
      { x: g4, s: g3 }
    ];
  }
}

/* ============================================================================
 * pan/jiang —— 十二天将（昼夜贵 / 顺逆 / 乘将）
 * ----------------------------------------------------------------------------
 * 不变量：规范 JSON《十二天神与贵人》；将序恒定，逆布只改方向。
 * 由单体 LiurenCore.ets 按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ArkTS：原生 import/export；跨模块引用经门面 LiurenCore（与 .ts 侧同口径）。
 * 重新生成：node _tools/_ets_pipeline.js（勿手改本文件）
 * ==========================================================================*/

import type {
  JiangBuild
} from './types';
import { LiurenCore } from '../LiurenCore';
import { LrBase } from './liuren-const';

export class LrJiang {
  static readonly JIANG_ORDER: string[] = ["贵人", "螣蛇", "朱雀", "六合", "勾陈", "青龙", "天空", "白虎", "太常", "玄武", "太阴", "天后"];
  static readonly JIANG_DAY_HOURS: string[] = ["卯", "辰", "巳", "午", "未", "申"];
  static readonly JIANG_SHUN_GONGS: string[] = ["亥", "子", "丑", "寅", "卯", "辰"];
  /* 九宗门零散写死项，抽为具名常量（与 core/liuren-core.js 同名常量对应） */
  static readonly MAOXING_ANCHOR: string = "酉";
  static readonly BA_ZHUAN_STEP: number = 3;
  static readonly JINGLAN_SHE: Record<string, string> = { "丑": "亥", "未": "巳" };

  static readonly BENSHEN: Record<string, string> = {
    "子": "天后", "丑": "贵人", "寅": "青龙", "卯": "六合", "辰": "勾陈", "巳": "螣蛇",
    "午": "朱雀", "未": "太常", "申": "白虎", "酉": "太阴", "戌": "天空", "亥": "玄武"
  };
  static readonly JIANG_JX: Record<string, string> = {
    "贵人": "吉", "天后": "吉", "太阴": "吉", "玄武": "凶", "太常": "吉", "白虎": "凶",
    "天空": "凶", "青龙": "吉", "勾陈": "凶", "六合": "吉", "朱雀": "凶", "螣蛇": "凶"
  };

  /* 凶将警示词（乘凶将断语用） */
  static readonly JIANG_WARN: Record<string, string> = {
    "玄武": "盗失暗昧", "白虎": "伤病血光", "天空": "虚诈落空",
    "勾陈": "拖延争斗", "朱雀": "口舌是非", "螣蛇": "虚惊怪异"
  };

  static buildJiang(dg: string, tp: Record<string, string>, hourZhi: string): JiangBuild {
    const night: boolean = LrJiang.JIANG_DAY_HOURS.indexOf(hourZhi) < 0;
    const gui: string = night ? LrBase.GUIREN[dg][1] : LrBase.GUIREN[dg][0];
    const guiGong: string = LrBase.gongOf(tp, gui);
    const shun: boolean = LrJiang.JIANG_SHUN_GONGS.indexOf(guiGong) >= 0;
    const step: number = shun ? 1 : -1;
    const gi: number = LrBase.ZHI.indexOf(guiGong);
    const jiangMap: Record<string, string> = {};
    for (let k = 0; k < LrJiang.JIANG_ORDER.length; k++) {
      const g: string = LrBase.ZHI[(gi + step * k + 120) % 12];
      jiangMap[g] = LrJiang.JIANG_ORDER[k];
    }
    const out: JiangBuild = { jiangMap: jiangMap, gui: gui, guiGong: guiGong, shun: shun, night: night };
    return out;
  }
}

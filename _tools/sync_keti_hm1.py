# -*- coding: utf-8 -*-
"""鸿蒙 LiurenCore.ets：课体识别层同步（SanChuan.keti + resolveSanchuan 重写 + 静态表）
   从核心 liuren-core.ts 复制课体实现（ArkTS 合规）"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\model\LiurenCore.ets"
t = io.open(p, encoding="utf-8").read()

# ---------- 1. SanChuan 接口加 keti ----------
old_iface = """/* 三传九宗门结果 */
export interface SanChuan {
  method: string;
  chuans: Chuan[];
}"""
new_iface = """/* 三传九宗门结果 */
export interface SanChuan {
  method: string;
  keti: string;      /* 课体名（伏吟/返吟/八专/别责/昴星…；普通课为""） */
  chuans: Chuan[];
}"""
if old_iface in t:
    t = t.replace(old_iface, new_iface)
    print("OK iface")
else:
    print("MISS iface")

# ---------- 2. 新增静态表（XING_MAP/HE_GAN/QIAN_SANHE）----------
old_const = """  static readonly YANG_ZHI: Record<string, number> = { "子": 1, "寅": 1, "辰": 1, "午": 1, "申": 1, "戌": 1 };
  static readonly G_YANG: Record<string, number> = { "甲": 1, "丙": 1, "戊": 1, "庚": 1, "壬": 1 };"""
new_const = """  static readonly YANG_ZHI: Record<string, number> = { "子": 1, "寅": 1, "辰": 1, "午": 1, "申": 1, "戌": 1 };
  static readonly G_YANG: Record<string, number> = { "甲": 1, "丙": 1, "戊": 1, "庚": 1, "壬": 1 };
  /* 课体辅助静态表（《大六壬指南》三传排法规范） */
  static readonly XING_MAP: Record<string, string> = {
    "子": "卯", "卯": "子", "寅": "巳", "巳": "申", "申": "寅",
    "丑": "戌", "戌": "未", "未": "丑",
    "辰": "辰", "午": "午", "酉": "酉", "亥": "亥"
  };
  static readonly HE_GAN: Record<string, string> = {
    "甲": "己", "己": "甲", "乙": "庚", "庚": "乙",
    "丙": "辛", "辛": "丙", "丁": "壬", "壬": "丁",
    "戊": "癸", "癸": "戊"
  };
  static readonly QIAN_SANHE: Record<string, string> = {
    "子": "丑", "丑": "巳", "寅": "亥", "卯": "戌", "辰": "酉", "巳": "申",
    "午": "未", "未": "午", "申": "巳", "酉": "辰", "戌": "卯", "亥": "寅"
  };"""
if old_const in t:
    t = t.replace(old_const, new_const)
    print("OK const")
else:
    print("MISS const")

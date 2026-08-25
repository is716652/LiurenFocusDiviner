# -*- coding: utf-8 -*-
"""修复：鸿蒙 SanChuan 接口加 keti；检查 XING_MAP 静态表是否缺失"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\model\LiurenCore.ets"
t = io.open(p, encoding="utf-8").read()

# 1. SanChuan 接口
old = """export interface SanChuan {
  method: string;
  chuans: Chuan[];
}"""
new = """export interface SanChuan {
  method: string;
  keti: string;      /* 课体名（伏吟/返吟/八专/别责/昴星…；普通课为""） */
  chuans: Chuan[];
}"""
if old in t:
    t = t.replace(old, new)
    print("OK iface")
else:
    print("MISS iface")
    # 查找实际文本
    idx = t.find("export interface SanChuan")
    print("around:", repr(t[idx:idx+80]))

# 2. XING_MAP 静态表
if "static readonly XING_MAP" not in t:
    print("MISS XING_MAP — 需要插入")
    anchor = "  static readonly G_YANG: Record<string, number> = { \"甲\": 1, \"丙\": 1, \"戊\": 1, \"庚\": 1, \"壬\": 1 };"
    add = anchor + """
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
    if anchor in t:
        t = t.replace(anchor, add)
        print("OK inserted XING_MAP tables")
    else:
        print("MISS G_YANG anchor")
else:
    print("XING_MAP present")

io.open(p, "w", encoding="utf-8").write(t)
print("done")

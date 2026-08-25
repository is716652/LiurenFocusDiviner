# -*- coding: utf-8 -*-
"""鸿蒙 LiurenCore.ets：同步 ZHI_GONG 表 + 36法完整版"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\model\LiurenCore.ets"
t = io.open(p, encoding="utf-8").read()

# 1. ZHI_GONG 表（插在 XUN_OF 或某静态表前；鸿蒙端找 QIJI_GONG 后）
anchor = "  static readonly XUN_OF: Record<string, string> = (() => {"
if "static readonly ZHI_GONG" not in t:
    zhi_gong = """  /* 地支十二宫（按地支五行统一长生，水土同宫；六壬盘面常用）：
     木(寅卯)长生亥 · 火(巳午)长生寅 · 金(申酉)长生巳 · 水土(子丑辰未戌亥)长生申 */
  static readonly ZHI_GONG: Record<string, Record<string, string>> = (() => {
    const gongs: string[] = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"];
    const changSheng: Record<string, string> = { "木": "亥", "火": "寅", "金": "巳", "水": "申", "土": "申" };
    const m: Record<string, Record<string, string>> = {};
    LiurenCore.ZHI.forEach((z: string) => {
      const wx = LiurenCore.WX[z];
      const s = LiurenCore.ZHI.indexOf(changSheng[wx]);
      const o: Record<string, string> = {};
      gongs.forEach((n: string, i: number) => {
        o[LiurenCore.ZHI[(s + i) % 12]] = n;
      });
      m[z] = o;
    });
    return m;
  })();

"""
    if anchor in t:
        t = t.replace(anchor, zhi_gong + anchor)
        print("OK ZHI_GONG hm")
    else:
        print("MISS anchor hm")
else:
    print("ZHI_GONG already present")

# 2. 36 法完整版
old36 = """    /* 第36法 干支皆败：干上逢日干败地（沐浴；核心暂无地支败地表，支上败地留待补表） */
    const qj36 = LiurenCore.QIJI_GONG[r.dg] || {};
    const baiZ = LiurenCore.findZhiOfGong(qj36, "沐浴");
    if (baiZ !== "" && ganS === baiZ) {
      hit(36, "干上逢败（日干败地临干·百事倾颓）");
    }"""
new36 = """    /* 第36法 干支皆败：干上=日干败地 且 支上=日支败地（沐浴；ZHI_GONG 地支表） */
    const qj36 = LiurenCore.QIJI_GONG[r.dg] || {};
    const ganBai = LiurenCore.findZhiOfGong(qj36, "沐浴");
    const zj36 = LiurenCore.ZHI_GONG[r.dz] || {};
    const zhiBai = LiurenCore.findZhiOfGong(zj36, "沐浴");
    if (ganBai !== "" && zhiBai !== "" && ganS === ganBai && zhiS === zhiBai) {
      hit(36, "干支皆败（干支上皆逢败地·百事倾颓）");
    }"""
if old36 in t:
    t = t.replace(old36, new36)
    print("OK 36 hm")
else:
    print("MISS 36 hm")

io.open(p, "w", encoding="utf-8").write(t)
print("done")

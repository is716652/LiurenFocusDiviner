# -*- coding: utf-8 -*-
"""修正 36 法：干支皆败 —— 核心无地支败地表，先实现「干上逢败地」（保守，不硬猜支上）"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\core\liuren-core.ts"
t = io.open(p, encoding="utf-8").read()

old = """    /* 第36法 干支皆败：干支上皆逢败地（沐浴） */
    const qj36 = LiurenCore.QIJI_GONG[r.dg] || {};
    const baiZ = Object.keys(qj36).find((z: string) => qj36[z] === "沐浴") || "";
    const zhiBai = Object.keys(LiurenCore.QIJI_GONG[r.dg] || {}).find((z: string) => (LiurenCore.QIJI_GONG[r.dg] || {})[z] === "沐浴") || "";
    if (baiZ !== "" && ganS === baiZ && zhiS === zhiBai) {
      hit(36, "干支皆败（干支上皆逢败地·百事倾颓）");
    }"""
new = """    /* 第36法 干支皆败：干上逢日干败地（沐浴；核心暂无地支败地表，支上败地留待补表） */
    const qj36 = LiurenCore.QIJI_GONG[r.dg] || {};
    const baiZ = Object.keys(qj36).find((z: string) => qj36[z] === "沐浴") || "";
    if (baiZ !== "" && ganS === baiZ) {
      hit(36, "干上逢败（日干败地临干·百事倾颓）");
    }"""
if old in t:
    t = t.replace(old, new)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK 36")
else:
    print("MISS 36")

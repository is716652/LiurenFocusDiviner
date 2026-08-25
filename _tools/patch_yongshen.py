# -*- coding: utf-8 -*-
"""Index.ets + YongShenCore.ets 抓用神接入补丁（幂等）"""
import io

BASE = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets"


def patch(path, pairs):
    with io.open(path, "r", encoding="utf-8") as f:
        t = f.read()
    changed = []
    for old, new in pairs:
        if old in t:
            t = t.replace(old, new)
            changed.append(old[:40])
        else:
            print("MISS:", path.split("\\")[-1], old[:40])
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(t)
    if changed:
        print("PATCHED:", path.split("\\")[-1], len(changed), "blocks")


# ---- YongShenCore.ets：zhanShi 类型 Record ----
patch(BASE + r"\model\YongShenCore.ets", [
    ("  /* 宿主注入的占事体系（12 大类） */\n  static zhanShi: ZhanShiRaw = {};",
     "  /* 宿主注入的占事体系（12 大类，原始 JSON） */\n  static zhanShi: Record<string, Object> = {};"),
    ("    const list = YongShenCore.zhanShi[\"占事大类\"] || [];",
     "    const list = (YongShenCore.zhanShi[\"占事大类\"] as Record<string, Object>[]) || [];"),
])

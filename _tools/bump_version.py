# -*- coding: utf-8 -*-
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\UI\大六壬万年历起课.html"
t = io.open(p, encoding="utf-8").read()
old = '<script src="../core/liuren-core.js?v=20260818-2"></script>'
new = '<script src="../core/liuren-core.js?v=20260818-3"></script>'
if old in t:
    t = t.replace(old, new)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK version bump")
else:
    print("MISS")

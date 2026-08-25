# -*- coding: utf-8 -*-
import re

t = open(r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\UI\大六壬万年历起课.html", encoding="utf-8").read()
scripts = re.findall(r'<script src="([^"]+)"></script>', t)
print("script order:")
for s in scripts:
    print("  ", s)
zi = scripts.index("_data/zhan_shi.js") if "_data/zhan_shi.js" in scripts else -1
ci = scripts.index("../core/liuren-core.js") if "../core/liuren-core.js" in scripts else -1
print("zhan_shi idx:", zi, " core idx:", ci, " 顺序OK:", zi < ci)
print("YongShenCore 引用数:", t.count("YongShenCore"))
print("selectDuyu 引用数:", t.count("selectDuyu"))

# -*- coding: utf-8 -*-
"""毕法教练 JSON → Web _data/bifa_coach.js（window.BIFA_COACH）"""
import json
import io

src = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\resources\rawfile\rule\毕法教练.json"
dst = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\UI\_data\bifa_coach.js"

obj = json.load(io.open(src, encoding="utf-8"))
body = json.dumps(obj, ensure_ascii=False)
out = "/* 毕法教练（格局吉凶/倾向/建议；源：鸿蒙 rawfile/rule/毕法教练.json）*/\nwindow.BIFA_COACH = " + body + ";\n"
io.open(dst, "w", encoding="utf-8").write(out)
print("OK", len(out), "chars")

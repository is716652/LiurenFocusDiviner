# -*- coding: utf-8 -*-
"""导出毕法 100 法全文，供筛选可接 keti 的法"""
import json
import io

d = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\resources\rawfile\rule\毕法赋一百法.json"
b = json.load(open(d, encoding="utf-8"))
arr = b["一百法"]

out = io.open(r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\_tools\bifa_all.txt", "w", encoding="utf-8")
for x in arr:
    pd = x.get("判定", {})
    out.write(u"{} | {} | {} | 判定:{} | 说明:{}\n".format(
        x.get("序"), x.get("法名"), x.get("赋文", ""), pd.get("可判定"), pd.get("说明", "")))
out.close()
print("written", len(arr))

# -*- coding: utf-8 -*-
"""提取 HTML 内联脚本，用 node 模拟执行定位错误行"""
import re
import io

t = io.open(r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\UI\大六壬万年历起课.html", encoding="utf-8").read()
# 内联脚本（非 src 引用）
blocks = re.findall(r"<script>(.*?)</script>", t, re.S)
print("inline blocks:", len(blocks))
js = "\n".join(blocks)
io.open(r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\_tmp_inline.js", "w", encoding="utf-8").write(js)
print("written", len(js), "chars")

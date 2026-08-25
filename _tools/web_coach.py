# -*- coding: utf-8 -*-
"""Web 端：毕法教练栏（加载毕法教练 JSON + renderBifaSection 顶部显示）"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\UI\大六壬万年历起课.html"
t = io.open(p, encoding="utf-8").read()

# 1. 版本号 +7
t2 = t.replace('?v=20260818-7', '?v=20260818-8')
if t2 != t:
    t = t2
    print("OK ver8")

# 2. 数据加载：毕法教练 JSON（script 标签后加 <script src> 不好，改为 fetch？web 端是本地文件，
#    用同步加载不可行；改用内联 fetch 异步 —— 简化：直接在 <script> 里 fetch('../APP/.../毕法教练.json')？
#    web 端运行于 file:// 时 fetch 受限。方案：把教练数据作为 JS 变量注入（从 rawfile 转 js）
#    为保持与鸿蒙数据同源，用 <script src="_data/bifa_coach.js"> 由构建工具生成。
print("data loader pending")

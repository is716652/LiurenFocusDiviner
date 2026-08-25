# -*- coding: utf-8 -*-
"""Splash.ets：四正方位字修正（北归子位）"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Splash.ets"
t = io.open(p, encoding="utf-8").read()

old = "    const fwName: string[] = ['', '北', '', '东', '', '', '南', '', '', '西', '', ''];"
new = "    const fwName: string[] = ['北', '', '', '东', '', '', '南', '', '', '西', '', ''];"

if old in t:
    t = t.replace(old, new)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK Splash fwName")
else:
    print("MISS")

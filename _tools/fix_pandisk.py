# -*- coding: utf-8 -*-
"""PanDisk.ets：vp2px 弃用 → display.densityPixels"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\components\PanDisk.ets"
t = io.open(p, encoding="utf-8").read()

pairs = [
    ("import { LiurenCore } from '../model/LiurenCore';",
     "import { display } from '@kit.ArkUI';\nimport { LiurenCore } from '../model/LiurenCore';"),
    ("""    /* vp → 物理像素：ctx.font 的 px 是物理像素，而 ctx.width 是 vp，
       高密度屏(≈3x)下必须 vp2px 转换，否则文字显示只有 1/3 大小 */
    const fontPx = (vp: number): string => vp2px(vp) + 'px sans-serif';
    const boldPx = (vp: number): string => 'bold ' + vp2px(vp) + 'px sans-serif';""",
     """    /* vp → 物理像素：ctx.font 的 px 是物理像素，而 ctx.width 是 vp，
       高密度屏(≈3x)下必须乘 densityPixels，否则文字显示只有 1/3 大小 */
    const d = display.getDefaultDisplaySync().densityPixels;
    const fontPx = (vp: number): string => (vp * d) + 'px sans-serif';
    const boldPx = (vp: number): string => 'bold ' + (vp * d) + 'px sans-serif';"""),
]
for old, new in pairs:
    if old in t:
        t = t.replace(old, new)
        print("OK:", old[:40])
    else:
        print("MISS:", old[:50])
io.open(p, "w", encoding="utf-8").write(t)
print("done")

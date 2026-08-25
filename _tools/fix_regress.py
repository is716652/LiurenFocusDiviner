# -*- coding: utf-8 -*-
"""回归测试：天将顺逆为规则修正项（非重构），从比对中移除，保留 gui/night"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\_tests\_test_core_regress.js"
t = io.open(p, encoding="utf-8").read()

pairs = [
    # 样本比对：移除 jiangMap / shun（2026-08-18 天将顺逆规则修正：天门地户法）
    ("""  ['dun', (c) => c.dun],
  ['jiangMap', (c) => c.jiangMap],
  ['gui', (c) => c.gui],
  ['shun', (c) => c.shun],
  ['night', (c) => c.night],""",
     """  ['dun', (c) => c.dun],
  /* 天将顺逆（jiangMap/shun）为 2026-08-18 规则修正项（天门地户法），
     不在重构回归比对范围；gui/night（昼夜贵人选择）仍比对 */
  ['gui', (c) => c.gui],
  ['night', (c) => c.night],"""),
    # sweep：移除 shun
    ("""      ['gui', (c) => c.gui],
      ['shun', (c) => c.shun],
      ['night', (c) => c.night],""",
     """      ['gui', (c) => c.gui],
      ['night', (c) => c.night],"""),
]
for old, new in pairs:
    if old in t:
        t = t.replace(old, new)
        print("OK")
    else:
        print("MISS:", old[:60])
io.open(p, "w", encoding="utf-8").write(t)
print("done")

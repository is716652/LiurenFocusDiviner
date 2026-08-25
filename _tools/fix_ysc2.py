# -*- coding: utf-8 -*-
"""YongShenCore.ets：nd 由 Record 改为 NodeState 后的点访问修复"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\model\YongShenCore.ets"
t = io.open(p, encoding="utf-8").read()

pairs = [
    ("""    const stateT = "用神" + (c.dun[zhi] || '') + zhi + (jj !== '' ? "乘" + jj : '') +
      "，临" + String(nd["qiJi"] || '?') + "（" + String(nd["wangShuai"] || '?') + "）" +
      (nd["kong"] ? "落空" : '');""",
     """    const stateT = "用神" + (c.dun[zhi] || '') + zhi + (jj !== '' ? "乘" + jj : '') +
      "，临" + String(nd.qiJi || '?') + "（" + String(nd.wangShuai || '?') + "）" +
      (nd.kong ? "落空" : '');"""),
    ("""      if (nd["kong"] && (t.indexOf("空") >= 0 || t.indexOf("虚") >= 0)) {
        ev.push("落空");
      }
      const ws = String(nd["wangShuai"] || '');""",
     """      if (nd.kong && (t.indexOf("空") >= 0 || t.indexOf("虚") >= 0)) {
        ev.push("落空");
      }
      const ws = String(nd.wangShuai || '');"""),
]
for old, new in pairs:
    if old in t:
        t = t.replace(old, new)
        print("OK:", old[:40])
    else:
        print("MISS:", old[:60])
io.open(p, "w", encoding="utf-8").write(t)
print("done")

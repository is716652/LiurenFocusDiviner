# -*- coding: utf-8 -*-
"""修正鸿蒙 bifaCoach：接口类型用点访问（hit.序 / item.吉凶）"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\model\LiurenCore.ets"
t = io.open(p, encoding="utf-8").read()

pairs = [
    ("if (Number(it[\"序\"]) === hit[\"序\"]) {",
     "if (Number(it[\"序\"]) === hit.序) {"),
    ("""          const item: CoachItem = {
            "序": hit["序"],
            "法名": String(it["法名"] || hit["法名"]),
            "吉凶": String(it["吉凶"] || "中"),
            "倾向": String(it["倾向"] || ""),
            "建议": String(it["建议"] || "")
          };""",
     """          const item: CoachItem = {
            "序": hit.序,
            "法名": String(it["法名"] || hit.法名),
            "吉凶": String(it["吉凶"] || "中"),
            "倾向": String(it["倾向"] || ""),
            "建议": String(it["建议"] || "")
          };"""),
    ("if (item[\"吉凶\"] === \"吉\") {",
     "if (item.吉凶 === \"吉\") {"),
    ("} else if (item[\"吉凶\"] === \"凶\") {",
     "} else if (item.吉凶 === \"凶\") {"),
    ("if (item[\"建议\"] !== \"\" && adviceSet.indexOf(item[\"建议\"]) < 0) {",
     "if (item.建议 !== \"\" && adviceSet.indexOf(item.建议) < 0) {"),
    ("adviceSet.push(item[\"建议\"]);",
     "adviceSet.push(item.建议);"),
]
for old, new in pairs:
    if old in t:
        t = t.replace(old, new)
        print("OK:", old[:40])
    else:
        print("MISS:", old[:40])

io.open(p, "w", encoding="utf-8").write(t)
print("done")

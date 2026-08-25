# -*- coding: utf-8 -*-
"""毕法教练 JSON：为每个格局补充「类」字段（课体/天将/三传/空亡/贵人/干支/杂）
   用于组合综合断的分组归并"""
import json
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\resources\rawfile\rule\毕法教练.json"
obj = json.load(io.open(p, encoding="utf-8"))

# 格局 → 类（按格局主题归类）
cats = {
  1: "贵人", 2: "旬空", 3: "贵人", 4: "官鬼", 5: "阴阳", 6: "阴阳", 7: "禄马",
  8: "禄马", 9: "三传", 11: "官鬼", 15: "脱耗", 17: "空亡", 18: "空亡",
  22: "六合", 27: "财鬼", 28: "财鬼", 31: "三传", 32: "三传", 33: "长生",
  35: "脱耗", 36: "败地", 38: "旬空", 41: "禄马", 54: "课体", 60: "支墓",
  61: "墓虎", 69: "天将", 70: "官鬼", 82: "空亡", 89: "课体"
}
for it in obj["格局"]:
    no = int(it["序"])
    it["类"] = cats.get(no, "杂")

io.open(p, "w", encoding="utf-8").write(json.dumps(obj, ensure_ascii=False, indent=1))
print("OK classes added:", len(obj["格局"]))
# 输出类别分布
from collections import Counter
print(Counter(it["类"] for it in obj["格局"]))

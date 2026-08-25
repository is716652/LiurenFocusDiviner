# -*- coding: utf-8 -*-
import json
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\resources\base\element\string.json"
d = json.load(io.open(p, encoding="utf-8"))
out = io.open(r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\_tools\string_check.txt", "w", encoding="utf-8")
for s in d["string"]:
    out.write(u"{} = {}\n".format(s["name"], s["value"]))
out.close()
print("written")

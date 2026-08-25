# -*- coding: utf-8 -*-
"""把 Web 端 _data 下的 window.XXX = {...} JS 数据文件抽取为纯 JSON（鸿蒙 rawfile 用）"""
import re
import json
import os

SRC = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\UI\_data"
DST = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\resources\rawfile\rule"

JOBS = [
    ("zhan_shi.js", "window.ZHANSHI", "占事体系.json"),
    ("guanlu_leishen.js", "window.GUANLU", "管辂类神取用.json"),
    ("duxiang_leixiang.js", "window.DUXIANG_LEIXIANG", "类象库.json"),
    ("guanlu_xiangyi.js", "window.GUANLU_XIANGYI", "管辂象意.json"),
]


def extract(s: str, var: str):
    # 取最后一个出现位置（文件头注释里常有示例代码，需跳过）
    idx = s.rfind(var)
    if idx < 0:
        return None
    m = re.search(r"=\s*(\{.*)", s[idx:], re.S)
    if not m:
        return None
    txt = m.group(1)
    depth = 0
    end = 0
    for i, ch in enumerate(txt):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    return txt[:end]


for fn, var, out in JOBS:
    s = open(os.path.join(SRC, fn), encoding="utf-8").read()
    body = extract(s, var)
    if body is None:
        print("NO MATCH", fn)
        continue
    obj = json.loads(body)
    outp = os.path.join(DST, out)
    with open(outp, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
    print(out, "OK", os.path.getsize(outp), "bytes")

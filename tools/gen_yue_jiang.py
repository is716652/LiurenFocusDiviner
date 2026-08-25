# -*- coding: utf-8 -*-
"""由 solar_terms.json 派生 ext/yue_jiang.json（月将换将时刻表）。

月将换将时刻 = 十二中气交接时刻（太阳过宫, 视黄经 15° 整数倍）。
中气 -> 月将: 雨水->登明亥 春分->河魁戌 谷雨->从魁酉 小满->传送申
夏至->小吉未 大暑->胜光午 处暑->太乙巳 秋分->天罡辰 霜降->太冲卯
小雪->功曹寅 冬至->大吉丑 大寒->神后子
"""
import os, sys, json, datetime

import paths
OUT = paths.EXT_DIR

MAPPING = [
    ("大寒", "神后", "子"), ("雨水", "登明", "亥"), ("春分", "河魁", "戌"),
    ("谷雨", "从魁", "酉"), ("小满", "传送", "申"), ("夏至", "小吉", "未"),
    ("大暑", "胜光", "午"), ("处暑", "太乙", "巳"), ("秋分", "天罡", "辰"),
    ("霜降", "太冲", "卯"), ("小雪", "功曹", "寅"), ("冬至", "大吉", "丑"),
]

def load_terms():
    with open(os.path.join(OUT, "solar_terms.json"), encoding="utf-8") as f:
        return json.load(f)

def index_terms(terms):
    by = {}
    for r in terms:
        by.setdefault((r["solar_date"][:4], r["name"]), r)
    return by

def term_at(by, year, name):
    """取 year 年 name 节气记录; 跨年(2061大寒)时现场计算。"""
    key = (str(year), name)
    if key in by:
        return by[key]
    # 现场用 skyfield 计算
    sys.path.insert(0, paths.TOOLS_DIR)
    from pyext_solar_terms import term_time_utc8
    t, lon = term_time_utc8(year, name)
    return {
        "solar_date": t.strftime("%Y-%m-%d"),
        "solar_time": t.strftime("%H:%M:%S"),
        "unix_utc8": int((t.replace(tzinfo=None) - datetime.datetime(1970, 1, 1, 8, 0, 0)).total_seconds()),
    }

def main():
    terms = load_terms()
    by = index_terms(terms)
    years_out = []
    for y in range(1900, 2061):
        segs = []
        for i, (start_term, yj, zhi) in enumerate(MAPPING):
            end_term, _, _ = MAPPING[(i + 1) % 12]
            end_year = y if i + 1 < 12 else y + 1  # 最后一段结束于次年大寒
            s = term_at(by, y, start_term)
            e = term_at(by, end_year, end_term)
            segs.append({
                "yue_jiang": yj, "zhi": zhi,
                "start_term": start_term, "start_utc8": s["solar_date"] + " " + s["solar_time"],
                "start_unix_utc8": s["unix_utc8"],
                "end_term": end_term, "end_utc8": e["solar_date"] + " " + e["solar_time"],
                "end_unix_utc8": e["unix_utc8"],
            })
        years_out.append({"year": y, "segments": segs})
    data = {
        "note": "月将换将时刻表。换将时刻 = 对应中气交接时刻（太阳过宫，视黄经 15° 整数倍），与 solar_terms.json 一致。",
        "mapping": {t: f"{yj}{zhi}" for t, yj, zhi in MAPPING},
        "years": years_out,
    }
    with open(os.path.join(OUT, "yue_jiang.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    print("yue_jiang.json written:", len(years_out), "years")

if __name__ == "__main__":
    main()

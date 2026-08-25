# -*- coding: utf-8 -*-
"""生成 ext/solar_terms.json：1900~2060 年二十四节气时刻表（JPL de422 视黄经算法）。

输出字段: index, name, type(节/气), solar_date, solar_time, unix_utc8,
         year_gz_lichun(立春纪年年柱), month_gz(该节气交接后生效月柱)
附: anchors_report.json 官方锚点比对。
"""
import os, sys, json, datetime

import paths
TOOLS = paths.TOOLS_DIR
sys.path.insert(0, TOOLS)
from pyext_solar_terms import TERMS, LON, term_time_utc8  # noqa

OUT_DIR = paths.EXT_DIR
os.makedirs(OUT_DIR, exist_ok=True)

GAN = "甲乙丙丁戊己庚辛壬癸"
ZHI = "子丑寅卯辰巳午未申酉戌亥"
WUHU = {"甲": "丙", "乙": "戊", "丙": "庚", "丁": "壬", "戊": "甲",
        "己": "丙", "庚": "戊", "辛": "庚", "壬": "壬", "癸": "甲"}
JIE = {"立春", "惊蛰", "清明", "立夏", "芒种", "小暑",
       "立秋", "白露", "寒露", "立冬", "大雪", "小寒"}
# 节气 -> 月支（节为换月点）
MONTH_ZHI = {"立春": "寅", "惊蛰": "卯", "清明": "辰", "立夏": "巳", "芒种": "午",
             "小暑": "未", "立秋": "申", "白露": "酉", "寒露": "戌", "立冬": "亥",
             "大雪": "子", "小寒": "丑"}
# 气 -> 其前一个节（气所处月份由前一节决定）
QI_PREV_JIE = {"雨水": "立春", "春分": "惊蛰", "谷雨": "清明", "小满": "立夏", "夏至": "芒种",
               "大暑": "小暑", "处暑": "立秋", "秋分": "白露", "霜降": "寒露", "小雪": "立冬",
               "冬至": "大雪", "大寒": "小寒"}
MONTH_IDX = {"寅": 1, "卯": 2, "辰": 3, "巳": 4, "午": 5, "未": 6,
             "申": 7, "酉": 8, "戌": 9, "亥": 10, "子": 11, "丑": 12}

def gz_of_index(idx):
    idx %= 60
    return GAN[idx % 10] + ZHI[idx % 12]

def year_gz_lichun_of(greg_year):
    """公历 Y 年立春起算的干支年（1984=甲子）。"""
    return gz_of_index((greg_year - 1984) % 60)

def month_gz_rule(term, year):
    """按五虎遁规则计算 term(属于公历 year 的节气) 交接后生效的月柱。
    小寒/大寒在立春之前, 属上一干支年; 气(中气)的月柱 = 其前一节的月柱。"""
    if term in QI_PREV_JIE:
        term = QI_PREV_JIE[term]
    # 小寒、大寒均在立春前, 属上一干支年
    anchor_year = year - 1 if term in ("小寒", "大寒") else year
    yin_stem = WUHU[year_gz_lichun_of(anchor_year)[0]]
    zhi = MONTH_ZHI[term]
    off = MONTH_IDX[zhi] - 1
    stem = GAN[(GAN.index(yin_stem) + off) % 10]
    return stem + zhi

def unix_utc8(dt_utc8):
    epoch = datetime.datetime(1970, 1, 1, 8, 0, 0)  # UTC+8 的 epoch 基准
    return int((dt_utc8.replace(tzinfo=None) - epoch).total_seconds())

def main():
    order = ["小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨",
             "立夏", "小满", "芒种", "夏至", "小暑", "大暑", "立秋", "处暑",
             "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪", "冬至"]
    records = []
    idx = 0
    for y in range(1900, 2061):
        for name in order:
            t, lon = term_time_utc8(y, name)
            rec = {
                "index": idx,
                "name": name,
                "type": "节" if name in JIE else "气",
                "solar_date": t.strftime("%Y-%m-%d"),
                "solar_time": t.strftime("%H:%M:%S"),
                "unix_utc8": unix_utc8(t),
                "year_gz_lichun": year_gz_lichun_of(y - 1 if name in ("小寒", "大寒") else y),
                "month_gz": month_gz_rule(name, y),
            }
            records.append(rec)
            idx += 1
    with open(os.path.join(OUT_DIR, "solar_terms.json"), "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=1)
    print("solar_terms.json written:", len(records), "records")
    # 官方锚点比对
    anchors = [
        (2024, "立春", "2024-02-04 16:26:53"),
        (2024, "冬至", "2024-12-21 17:20:20"),
        (2025, "立春", "2025-02-03 22:10:13"),
        (2023, "冬至", "2023-12-22 11:27:09"),
        (2024, "夏至", "2024-06-21 04:50:46"),
        (2024, "小寒", "2024-01-06 04:49:09"),
        (2024, "大寒", "2024-01-20 22:07:08"),
    ]
    rep = []
    for y, name, offi in anchors:
        t, lon = term_time_utc8(y, name)
        off = datetime.datetime.strptime(offi, "%Y-%m-%d %H:%M:%S")
        diff = (t.replace(tzinfo=None) - off).total_seconds()
        rep.append({"year": y, "term": name, "computed_utc8": t.strftime("%Y-%m-%d %H:%M:%S"),
                    "official_utc8": offi, "diff_seconds": round(diff, 1)})
    with open(os.path.join(OUT_DIR, "anchors_report.json"), "w", encoding="utf-8") as f:
        json.dump(rep, f, ensure_ascii=False, indent=2)
    print("anchors_report.json:", json.dumps(rep, ensure_ascii=False))

if __name__ == "__main__":
    main()

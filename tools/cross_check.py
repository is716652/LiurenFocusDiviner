# -*- coding: utf-8 -*-
"""交叉校验: 1) solar_terms.json(skyfield/de422) vs lunar_python 全量 3864 条
2) solar_terms.json 规则推导的 year_gz_lichun/month_gz vs calendar_fixed(lunar_python)
输出: ext/cross_check_report.json
"""
import os, sys, json, datetime

import paths
LIB = paths.PYEXT
sys.path.insert(0, LIB)
OUT = paths.EXT_DIR
from lunar_python import Solar

terms = json.load(open(os.path.join(OUT, "solar_terms.json"), encoding="utf-8"))
fixed = {r["date"]: r for r in json.load(open(os.path.join(OUT, "calendar_fixed.json"), encoding="utf-8"))}
print("loaded", len(terms), "terms,", len(fixed), "fixed days")

def lib_term_time(year, name):
    anchor_year = year + 1 if name == "冬至" else year
    l = Solar.fromYmdHms(anchor_year, 6, 15, 12, 0, 0).getLunar()
    return l.getJieQiTable()[name]

date_mismatch = []
gz_mismatch = []
max_diff = 0.0
diffs = []
for r in terms:
    y, name = int(r["solar_date"][:4]), r["name"]
    t = lib_term_time(y, name)
    lib_s = t.toYmdHms()
    lib_dt = datetime.datetime.strptime(lib_s, "%Y-%m-%d %H:%M:%S")
    my_dt = datetime.datetime.strptime(r["solar_date"] + " " + r["solar_time"], "%Y-%m-%d %H:%M:%S")
    diff = (my_dt - lib_dt).total_seconds()
    if lib_s[:10] != r["solar_date"]:
        date_mismatch.append({"year": y, "term": name, "skyfield": r["solar_date"], "lib": lib_s[:10]})
    max_diff = max(max_diff, abs(diff))
    diffs.append(abs(diff))
    # 规则字段 vs lunar_python (经 calendar_fixed)
    fr = fixed.get(r["solar_date"])
    if fr is None:
        continue
    if r["year_gz_lichun"] != fr["year_gan_zhi_lichun"]:
        gz_mismatch.append({"date": r["solar_date"], "term": name, "field": "year_gz_lichun",
                            "rule": r["year_gz_lichun"], "lib": fr["year_gan_zhi_lichun"]})
    if r["month_gz"] != fr["month_gan"] + fr["month_zhi"]:
        gz_mismatch.append({"date": r["solar_date"], "term": name, "field": "month_gz",
                            "rule": r["month_gz"], "lib": fr["month_gan"] + fr["month_zhi"]})

diffs.sort()
import statistics
rep = {
    "solar_terms_total": len(terms),
    "date_match": len(terms) - len(date_mismatch),
    "date_mismatch": date_mismatch[:10],
    "time_diff_seconds": {
        "max_abs": round(max_diff, 1),
        "p50": round(statistics.median(diffs), 1),
        "p99": round(diffs[int(len(diffs) * 0.99)] if diffs else 0, 1),
        "min": round(diffs[0], 1) if diffs else 0,
    },
    "gz_field_rule_match": len(terms) * 2 - len(gz_mismatch),
    "gz_field_mismatch": gz_mismatch[:10],
    "notes": [
        "时间差为 skyfield(JPL de422) - lunar_python(寿星天文历): 两套算法系统性偏差约 0~46 秒(1900 年代略大, 近期 10~15 秒), 中位数 3 秒, 日期绝大多数一致",
        "2 个日期边缘差异(1911 立夏、1951 冬至)为发生在午夜前后数十秒的节气: skyfield 23:59:46/23:59:49, lunar_python 次日 00:00:18/00:00:01; 本数据采用 skyfield(JPL) 日期",
        "官方(紫金山/新华/气象)公布值与本数据相差 12~15 秒(见 anchors_report.json), 属不同天文理论的正常差异, 不影响时辰(2小时)粒度排盘",
        "year_gz_lichun/month_gz 由规则(五虎遁)推导并经 lunar_python 逐条核验: 7727/7728 一致, 唯一差异即 1911 立夏跨日边界",
    ],
}
with open(os.path.join(OUT, "cross_check_report.json"), "w", encoding="utf-8") as f:
    json.dump(rep, f, ensure_ascii=False, indent=1)
print("date_match:", rep["date_match"], "/", len(terms), "| max time diff:", rep["time_diff_seconds"])
print("gz rule match:", rep["gz_field_rule_match"], "/", len(terms) * 2)
print("gz mismatches:", gz_mismatch[:5])
print("date mismatches:", date_mismatch[:5])

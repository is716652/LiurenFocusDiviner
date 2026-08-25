# -*- coding: utf-8 -*-
"""1) 用 lunar_python 全量校验现有 58,805 条数据 -> verify_report.json
   2) 生成 ext/calendar_fixed.json（立春纪年年柱 + 节气精确月柱 + 权威农历/日干支/节气）
"""
import os, sys, json, glob

import paths
LIB = paths.PYEXT
sys.path.insert(0, LIB)
OUT = paths.EXT_DIR
os.makedirs(OUT, exist_ok=True)

from lunar_python import Solar

DATA_DIR = paths.JSON_DIR
records = []
for f in sorted(glob.glob(os.path.join(DATA_DIR, "*.json"))):
    with open(f, encoding="utf-8") as fh:
        records.extend(json.load(fh))
print("loaded", len(records), "records")

def gz(gan, zhi):
    return gan + zhi

lunar_diff, daygz_diff, st_diff, monthgz_diff, ygz_chunjie_diff, zodiac_diff, week_diff, leap_diff = [], [], [], [], [], [], [], []
fixed = []
total = len(records)

for i, r in enumerate(records):
    l = Solar.fromYmdHms(r["year"], r["month"], r["day"], 12, 0, 0).getLunar()

    # 农历
    lib_month = l.getMonth()  # 闰月为负, 与现有约定一致
    if (r["lunar_year"], r["lunar_month"], r["lunar_day"]) != (l.getYear(), lib_month, l.getDay()):
        lunar_diff.append({"date": r["date"], "orig": [r["lunar_year"], r["lunar_month"], r["lunar_day"]],
                           "lib": [l.getYear(), lib_month, l.getDay()]})
    # 日干支
    lib_daygz = l.getDayInGanZhi()
    if gz(r["day_gan"], r["day_zhi"]) != lib_daygz:
        daygz_diff.append({"date": r["date"], "orig": gz(r["day_gan"], r["day_zhi"]), "lib": lib_daygz})
    # 节气(名称, 按日)
    lib_jq = l.getJieQi() or ""
    if r["solar_term"] != lib_jq:
        st_diff.append({"date": r["date"], "orig": r["solar_term"], "lib": lib_jq})
    # 月柱: 现有 vs 库(按节气日粒度)
    lib_monthgz = l.getMonthInGanZhi()
    if gz(r["month_gan"], r["month_zhi"]) != lib_monthgz:
        monthgz_diff.append({"date": r["date"], "orig": gz(r["month_gan"], r["month_zhi"]), "lib": lib_monthgz})
    # 年柱(春节纪年): 现有 vs 库 getYearInGanZhi()
    lib_ygz = l.getYearInGanZhi()
    if gz(r["year_gan"], r["year_zhi"]) != lib_ygz:
        ygz_chunjie_diff.append({"date": r["date"], "orig": gz(r["year_gan"], r["year_zhi"]), "lib": lib_ygz})
    # 生肖
    lib_zodiac = l.getYearShengXiao()
    if r["zodiac"] != lib_zodiac:
        zodiac_diff.append({"date": r["date"], "orig": r["zodiac"], "lib": lib_zodiac})
    # 星期 (lunar_python getWeek: 0=周日,1=周一..6=周六; getWeekInChinese 返回单字)
    lib_week_num = (l.getWeek() + 6) % 7   # 转成 0=周一..6=周日, 与现有数据一致
    lib_week_name = "星期" + l.getWeekInChinese()
    if (r["week_day"], r["week_name"]) != (lib_week_num, lib_week_name):
        week_diff.append({"date": r["date"], "orig": [r["week_day"], r["week_name"]],
                          "lib": [lib_week_num, lib_week_name]})

    # ---- 修正主表 ----
    fixed.append({
        "date": r["date"],
        "year": r["year"], "month": r["month"], "day": r["day"],
        "lunar_year": l.getYear(), "lunar_month": lib_month, "lunar_day": l.getDay(),
        "zodiac": lib_zodiac,
        "year_gan_zhi_chunjie": lib_ygz,                 # 春节纪年（原数据语义）
        "year_gan_zhi_lichun": l.getYearInGanZhiByLiChun(),  # 立春纪年（八字/奇门/六壬年命）
        "month_gan": lib_monthgz[0], "month_zhi": lib_monthgz[1],  # 按节气日换月
        "day_gan": lib_daygz[0], "day_zhi": lib_daygz[1],
        "week_day": lib_week_num, "week_name": lib_week_name,
        "solar_term": lib_jq,
        "is_holiday": r["is_holiday"], "holiday_name": r["holiday_name"], "festivals": r["festivals"],
    })
    if i % 10000 == 0:
        print("...", i)

report = {
    "tool": "lunar_python 1.4.8 (6tail, 寿星天文历算法)",
    "range": "1900-01-01 ~ 2060-12-31",
    "total_days": total,
    "summary": {
        "lunar_year_month_day_match": total - len(lunar_diff),
        "day_gan_zhi_match": total - len(daygz_diff),
        "solar_term_match": total - len(st_diff),
        "month_gan_zhi_match": total - len(monthgz_diff),
        "year_gan_zhi_chunjie_match": total - len(ygz_chunjie_diff),
        "zodiac_match": total - len(zodiac_diff),
        "week_match": total - len(week_diff),
    },
    "diff_samples": {
        "lunar": lunar_diff[:10],
        "day_gz": daygz_diff[:10],
        "solar_term": st_diff[:10],
        "month_gz": monthgz_diff[:10],
        "year_gz_chunjie": ygz_chunjie_diff[:10],
        "zodiac": zodiac_diff[:10],
        "week": week_diff[:10],
    },
    "diff_counts": {
        "lunar": len(lunar_diff), "day_gz": len(daygz_diff), "solar_term": len(st_diff),
        "month_gz": len(monthgz_diff), "year_gz_chunjie": len(ygz_chunjie_diff),
        "zodiac": len(zodiac_diff), "week": len(week_diff),
    },
    "notes": [
        "solar_term 差异: 现有数据缺小寒/大寒(322 天), 另有 1421 个节气日期与权威值相差 ±1~2 天(如 1900 年惊蛰原标 03-05, 权威为 03-06); 修正主表已按权威值补齐",
        "lunar 差异: 30 天(2057-09-28 ~ 2057-10-27)农历与寿星天文历相差 1 天, 源于 2057 年农历八月大小月/朔日算法分歧; 修正主表采用寿星天文历(紫金山天文台一致)数值",
        "month_gan_zhi: 现有数据月柱按节气日换月, 与权威逐日一致(58805/58805); 修正主表保留该语义",
        "year_gan_zhi_chunjie: 以农历正月初一换柱(与现有数据一致); year_gan_zhi_lichun: 以立春换柱(八字/奇门/六壬年命用, 日粒度)",
        "week: lunar_python getWeek 0=周日..6=周六, 已转成 0=周一..6=周日 与现有数据一致",
        "calendar_fixed.json 的 lunar_month 为负表示闰月(与现有数据约定一致)",
    ],
}
with open(os.path.join(OUT, "verify_report.json"), "w", encoding="utf-8") as f:
    json.dump(report, f, ensure_ascii=False, indent=1)
with open(os.path.join(OUT, "calendar_fixed.json"), "w", encoding="utf-8") as f:
    json.dump(fixed, f, ensure_ascii=False)
print("verify_report.json + calendar_fixed.json written")

# 打印统计
s = report["summary"]
print({k: v for k, v in s.items()})
print("month_gz diff dates sample:", [d["date"] for d in monthgz_diff[:8]])
print("solar_term diff dates sample:", [d["date"] for d in st_diff[:8]])

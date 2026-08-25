# -*- coding: utf-8 -*-
"""skyfield + de422.bsp 计算二十四节气时刻（太阳视黄经过 15° 整数倍）。

节气 -> 视黄经(度): 立春315 雨水330 惊蛰345 春分0/360 清明15 谷雨30
立夏45 小满60 芒种75 夏至90 小暑105 大暑120 立秋135 处暑150 白露165
秋分180 寒露195 霜降210 立冬225 小雪240 大雪255 冬至270 小寒285 大寒300
输出: 东八区 (UTC+8), 精确到秒。
效率: 每年逐日采样一次(约365次星历求值), 24 节气复用。
"""
import os, sys, math, datetime, calendar

import paths
LIB = paths.PYEXT
sys.path.insert(0, LIB)

from skyfield.api import load_file, load
from skyfield.framelib import ecliptic_frame

BSP = paths.BSP
eph = load_file(BSP)
earth = eph["earth"]
sun = eph["sun"]
ts = load.timescale()

TERMS = ["立春", "雨水", "惊蛰", "春分", "清明", "谷雨",
         "立夏", "小满", "芒种", "夏至", "小暑", "大暑",
         "立秋", "处暑", "白露", "秋分", "寒露", "霜降",
         "立冬", "小雪", "大雪", "冬至", "小寒", "大寒"]
LON = {
    "立春": 315.0, "雨水": 330.0, "惊蛰": 345.0, "春分": 360.0, "清明": 15.0, "谷雨": 30.0,
    "立夏": 45.0, "小满": 60.0, "芒种": 75.0, "夏至": 90.0, "小暑": 105.0, "大暑": 120.0,
    "立秋": 135.0, "处暑": 150.0, "白露": 165.0, "秋分": 180.0, "寒露": 195.0, "霜降": 210.0,
    "立冬": 225.0, "小雪": 240.0, "大雪": 255.0, "冬至": 270.0, "小寒": 285.0, "大寒": 300.0,
}
MONTH = {"立春": 2, "雨水": 2, "惊蛰": 3, "春分": 3, "清明": 4, "谷雨": 4,
         "立夏": 5, "小满": 5, "芒种": 6, "夏至": 6, "小暑": 7, "大暑": 7,
         "立秋": 8, "处暑": 8, "白露": 9, "秋分": 9, "寒露": 10, "霜降": 10,
         "立冬": 11, "小雪": 11, "大雪": 12, "冬至": 12, "小寒": 1, "大寒": 1}

_cache = {}

def sun_lon_deg(t):
    astrometric = earth.at(t).observe(sun).apparent()
    lat, lon, dist = astrometric.frame_latlon(ecliptic_frame)
    return lon.degrees % 360.0

def year_daily(year):
    """当年逐日(UTC 0点)视黄经数组。缓存。"""
    if year in _cache:
        return _cache[year]
    dates = []
    for m in range(1, 13):
        for d in range(1, calendar.monthrange(year, m)[1] + 1):
            dates.append(datetime.date(year, m, d))
    lons = [sun_lon_deg(ts.utc(d.year, d.month, d.day)) for d in dates]
    _cache[year] = (dates, lons)
    return _cache[year]

def term_time_utc8(year, term):
    """返回 (datetime_utc8, 视黄经)。"""
    target = LON[term]
    approx = (year, MONTH[term], 15)
    dates, lons = year_daily(year)

    crossing = None
    for i in range(len(dates) - 1):
        di = (lons[i] - target) % 360.0
        dj = (lons[i + 1] - target) % 360.0
        if di > 180.0 and dj <= 180.0:
            d0 = dates[i]
            if crossing is None or abs((d0 - datetime.date(*approx)).days) < abs(
                    (crossing - datetime.date(*approx)).days):
                crossing = d0
    if crossing is None:
        raise RuntimeError(f"{year} {term}: no crossing found")

    t = ts.utc(crossing.year, crossing.month, crossing.day) + 0.5

    def f_of(t):
        v = (sun_lon_deg(t) - target) % 360.0
        return v - 360.0 if v > 180.0 else v

    for _ in range(30):
        d = 600.0
        f0 = f_of(t)
        fp = f_of(t + d / 86400.0)
        fm = f_of(t - d / 86400.0)
        df = (fp - fm) / (2.0 * d)
        if abs(df) < 1e-12:
            break
        step = f0 / df
        if abs(step) > 86400.0:
            step = math.copysign(86400.0, step)
        t = t - step / 86400.0
        if abs(step) < 0.005:
            break
    utc8 = t.utc_datetime() + datetime.timedelta(hours=8)
    return utc8, sun_lon_deg(t)

if __name__ == "__main__":
    anchors = [
        (2024, "立春", "2024-02-04 16:26:53"),
        (2024, "冬至", "2024-12-21 17:20:20"),
        (2025, "立春", "2025-02-03 22:10:13"),
        (2023, "冬至", "2023-12-22 11:27:09"),
        (2024, "夏至", "2024-06-21 04:50:46"),
        (2024, "小寒", "2024-01-06 04:49:09"),
        (2024, "大寒", "2024-01-20 22:07:08"),
    ]
    for y, term, official in anchors:
        t, lon = term_time_utc8(y, term)
        s = t.strftime("%Y-%m-%d %H:%M:%S")
        off = datetime.datetime.strptime(official, "%Y-%m-%d %H:%M:%S")
        diff = (t.replace(tzinfo=None) - off).total_seconds()
        print(f"{y} {term}: 计算 {s} | 官方 {official} | 差 {diff:+.1f}s | 黄经 {lon:.4f}")

# 万年历 JSON 数据说明

本目录包含一套**完整的万年历数据**：公历（阳历）1900-01-01 至 2060-12-31，共 **161 年、58,805 天**，每一天一条记录，无缺漏。

数据同时提供 4 种格式，内容完全一致：

| 文件 | 格式 | 说明 |
| --- | --- | --- |
| `json/calendar_data_0001.json` ~ `0017.json` | JSON | 主数据，按 10 年一个文件分片（最后一个文件只有 2060 年） |
| `calendar.csv` | CSV | 全部数据合并为一个文件（含表头，共 58,806 行） |
| `calendar.db` | SQLite | 含 `calendar` 表（58,805 行）与空的 `holidays` 表（预留） |
| `calendar.xls` | Excel 97-2003 (OLE2) | 全部数据 |

---

## 一、JSON 文件结构

17 个 JSON 文件按公历 10 年一段分片，每个文件是一个**对象数组**，数组内按日期升序排列：

| 文件 | 覆盖日期 | 记录数 |
| --- | --- | --- |
| calendar_data_0001.json | 1900-01-01 ~ 1909-12-31 | 3,652 |
| calendar_data_0002.json | 1910-01-01 ~ 1919-12-31 | 3,652 |
| calendar_data_0003.json | 1920-01-01 ~ 1929-12-31 | 3,653 |
| calendar_data_0004.json | 1930-01-01 ~ 1939-12-31 | 3,652 |
| calendar_data_0005.json | 1940-01-01 ~ 1949-12-31 | 3,653 |
| calendar_data_0006.json | 1950-01-01 ~ 1959-12-31 | 3,652 |
| calendar_data_0007.json | 1960-01-01 ~ 1969-12-31 | 3,653 |
| calendar_data_0008.json | 1970-01-01 ~ 1979-12-31 | 3,652 |
| calendar_data_0009.json | 1980-01-01 ~ 1989-12-31 | 3,653 |
| calendar_data_0010.json | 1990-01-01 ~ 1999-12-31 | 3,652 |
| calendar_data_0011.json | 2000-01-01 ~ 2009-12-31 | 3,653 |
| calendar_data_0012.json | 2010-01-01 ~ 2019-12-31 | 3,652 |
| calendar_data_0013.json | 2020-01-01 ~ 2029-12-31 | 3,653 |
| calendar_data_0014.json | 2030-01-01 ~ 2039-12-31 | 3,652 |
| calendar_data_0015.json | 2040-01-01 ~ 2049-12-31 | 3,653 |
| calendar_data_0016.json | 2050-01-01 ~ 2059-12-31 | 3,652 |
| calendar_data_0017.json | 2060-01-01 ~ 2060-12-31 | 366 |
| **合计** | **1900-01-01 ~ 2060-12-31** | **58,805** |

> 编码：UTF-8（无 BOM），行结束符为 CRLF。每条记录约 640 字节，单文件约 1.7 MB。

---

## 二、单条记录示例

以 `1900-01-01` 与 `2024-02-10`（甲辰年正月初一）为例：

```json
{
  "date": "1900-01-01",
  "year": 1900,
  "month": 1,
  "day": 1,
  "lunar_year": 1899,
  "lunar_month": 12,
  "lunar_day": 1,
  "zodiac": "猪",
  "year_gan": "己",
  "year_zhi": "亥",
  "month_gan": "丙",
  "month_zhi": "子",
  "day_gan": "甲",
  "day_zhi": "戌",
  "week_day": 0,
  "week_name": "星期一",
  "is_holiday": 0,
  "holiday_name": "",
  "solar_term": "",
  "festivals": "元旦"
}
```

```json
{
  "date": "2024-02-10",
  "year": 2024,
  "month": 2,
  "day": 10,
  "lunar_year": 2024,
  "lunar_month": 1,
  "lunar_day": 1,
  "zodiac": "龙",
  "year_gan": "甲",
  "year_zhi": "辰",
  "month_gan": "丙",
  "month_zhi": "寅",
  "day_gan": "甲",
  "day_zhi": "辰",
  "week_day": 5,
  "week_name": "星期六",
  "is_holiday": 0,
  "holiday_name": "",
  "solar_term": "",
  "festivals": ""
}
```

---

## 三、字段说明

每条记录共 **20 个字段**，全部为字符串或整数（无 null 值）：

| 字段 | 类型 | 含义 | 取值说明 |
| --- | --- | --- | --- |
| `date` | string | 公历日期 | 格式 `YYYY-MM-DD`，全表唯一，按此字段升序排列 |
| `year` | int | 公历年 | 1900 ~ 2060 |
| `month` | int | 公历月 | 1 ~ 12 |
| `day` | int | 公历日 | 1 ~ 31 |
| `lunar_year` | int | 农历年 | 等于 `year` 或 `year - 1`（公历元旦至春节前仍属上一年农历） |
| `lunar_month` | int | 农历月 | 1 ~ 12；**负数表示闰月**，取绝对值即闰月序号（见下） |
| `lunar_day` | int | 农历日 | 1 ~ 30 |
| `zodiac` | string | 生肖（属相） | 按**农历年**计算：鼠、牛、虎、兔、龙、蛇、马、羊、猴、鸡、狗、猪 |
| `year_gan` | string | 年干 | 甲、乙、丙、丁、戊、己、庚、辛、壬、癸 |
| `year_zhi` | string | 年支 | 子、丑、寅、卯、辰、巳、午、未、申、酉、戌、亥 |
| `month_gan` | string | 月干 | 同上十干 |
| `month_zhi` | string | 月支 | 同上十二支 |
| `day_gan` | string | 日干 | 同上十干 |
| `day_zhi` | string | 日支 | 同上十二支 |
| `week_day` | int | 星期（数值） | **0 = 星期一，1 = 星期二 … 5 = 星期六，6 = 星期日** |
| `week_name` | string | 星期（中文） | 星期一 ~ 星期日 |
| `is_holiday` | int | 是否法定节假日 | 当前版本恒为 `0`（字段预留，未填充） |
| `holiday_name` | string | 节假日名称 | 当前版本恒为空字符串（字段预留） |
| `solar_term` | string | 当日节气 | 非节气日为空字符串（见「节气」一节） |
| `festivals` | string | 节日 | 非节日为空字符串（见「节日」一节） |

---

## 四、编码规则与要点

### 1. 星期（week_day / week_name）
`week_day` 与真实星期完全对应，例如 1900-01-01 与 2024-01-01 均为真实星期一（`week_day = 0`）。

### 2. 农历闰月（lunar_month 为负数）
`lunar_month` 为负表示该月是**闰月**，取绝对值即为闰的月份序号，例如 `-8` 表示「闰八月」，`-11` 表示「闰十一月」。

统计（1900 ~ 2060）：
- 闰月共 **60 个**，分布在 **59 个农历年**（1900 ~ 2058），闰月天数合计 **1,729 天**；
- 闰月序号为 2 ~ 11，**无闰正月、无闰腊月**；
- 典型例子：2033 年「闰十一月」（`2033-12-22` 起，跨公历 2033/2034 两年）；
- 平均约 2.7 年出现一次闰月。

### 3. 农历年与公历年的错位（lunar_year）
- 公历元旦至当年春节前一天：`lunar_year = year - 1`（例如 2024-01-01 是农历癸卯年十一月二十）；
- 春节当天起：`lunar_year = year`（例如 2024-02-10 是甲辰年正月初一）。
- 全表 `lunar_year = year - 1` 的记录共 5,632 条，`lunar_year = year` 的共 53,173 条。

### 4. 年干支与生肖（year_gan / year_zhi / zodiac）
以**农历年**为界：正月初一换年柱与生肖。例如 2024-02-10 前为「癸卯兔年」，当天起为「甲辰龙年」。干支依六十甲子循环。

### 5. 日干支（day_gan / day_zhi）
按日递增、严格遵循六十甲子循环（甲子 → 乙丑 → …… → 癸亥 → 甲子），全表连续无跳变。

### 6. 月干支（month_gan / month_zhi）
以二十四节气中的「**节**」（立春、惊蛰、清明、立夏、芒种、小暑、立秋、白露、寒露、立冬、大雪、小寒）为换月界限，而非公历每月 1 日。

> ⚠️ 注意：数据中月柱的换月日期由**近似节气表**推算，与 `solar_term` 字段标注的节气日期存在个别 **±1 天**偏差（例如 2024 年大雪实际为 12-07，但月柱在 12-06 即换成丙子月）。如需精确到天的月柱，建议以权威节气时刻自行校验。

### 7. 节气（solar_term）
- 每年恰好有 **22 个节气**记录，共 3,542 条；
- 覆盖：立春、雨水、惊蛰、春分、清明、谷雨、立夏、小满、芒种、夏至、小暑、大暑、立秋、处暑、白露、秋分、寒露、霜降、立冬、小雪、大雪、冬至；
- **缺少「小寒」「大寒」**（即公历 1 月的两个节气未收录）；
- 已收录的节气日期经抽样核对（2024、2025 年等）与真实节气日一致。

### 8. 节日（festivals）
每年固定 4 个公历节日，共 644 条（161 年 × 4）：

| 节日 | 日期 |
| --- | --- |
| 元旦 | 1 月 1 日 |
| 劳动节 | 5 月 1 日 |
| 国庆节 | 10 月 1 日 |
| 圣诞节 | 12 月 25 日 |

> 说明：仅收录上述 4 个固定公历节日；农历节日（春节、端午、中秋等）与调休安排未收录。

### 9. 节假日（is_holiday / holiday_name）
两个字段当前**未填充**：`is_holiday` 恒为 `0`，`holiday_name` 恒为空字符串。它们为法定节假日与调休数据预留，使用时可自行扩展（或参考 `calendar.db` 中预留的 `holidays` 空表）。

---

## 五、配套文件

### calendar.csv
- 20 列与 JSON 字段一一对应，首行为表头（字段名带引号）；
- 共 58,806 行（1 行表头 + 58,805 行数据），UTF-8 编码；
- 适合 Excel / pandas / 任意文本工具直接使用。

### calendar.db（SQLite）
- `calendar` 表：20 列与 JSON 一致，`date` 为**主键**（TEXT），共 58,805 行；
- `holidays` 表：**空表（0 行）**，预置结构 `id INTEGER PRIMARY KEY, date TEXT, name TEXT, type TEXT, description TEXT`，供扩展节假日数据使用；
- `sqlite_sequence`：空（系统表）。

### calendar.xls
- 旧版 Excel 二进制格式（OLE2 / BIFF），16.7 MB；
- 内容与 JSON / CSV 一致，适合不熟悉代码的场景直接打开查看。

---

## 六、已知限制与使用提示

1. `solar_term` 缺少小寒、大寒两个节气；经权威校验，另有约 1,421 个节气**日期**标错 ±1~2 天（如 1900 年惊蛰原标 03-05，实际 03-06）——修正版见 `ext/calendar_fixed.json` 与 `ext/solar_terms.json`；
2. `month_gan` / `month_zhi` 按「节」日期换月（日粒度），经校验与权威逐日一致（58,805/58,805）；精确到时刻的换月见 `ext/solar_terms.json`；
3. `year_gan` / `year_zhi` 以**农历春节**换柱（与农历生肖一致）；八字/奇门/大六壬使用的**立春换柱**年柱见 `ext/calendar_fixed.json` 的 `year_gan_zhi_lichun` 字段；
4. 农历 2057 年八月（朔日/大小月）与寿星天文历相差 1 天（涉及 2057-09-28 ~ 10-27 共 30 天），修正主表已采用权威值；
5. `is_holiday` / `holiday_name` 未填充，`holidays` 表为空，法定节假日需自行补充；
6. `festivals` 仅含 4 个固定公历节日，无农历节日与调休信息；
7. 农历数据覆盖 1900 ~ 2060 年，超出此范围无数据（如需更长跨度，需自行扩展历法算法）。

---

## 八、扩展数据（`ext/` 目录，面向大六壬/奇门排盘）

为支撑国学排盘软件，新增 `ext/` 目录（生成说明与规格详见《万年历数据扩展规格说明.md》）：

| 文件 | 内容 | 规模 |
| --- | --- | --- |
| `solar_terms.json` | 二十四节气**交接时刻**（JPL DE422 视黄经，东八区，秒级），含节/气类型、立春纪年年柱、月柱 | 3,864 条 |
| `yue_jiang.json` | 大六壬**月将**换将时刻表（换将时刻 = 十二中气交接时刻），每年 12 段 | 161 年 |
| `calendar_fixed.json` | 修正主表：权威农历/日干支/节气 + `year_gan_zhi_lichun`（立春纪年）+ 精确月柱 | 58,805 条 |
| `xun_kong.json` | 六甲旬空亡 + 旬首（奇门值符用） | 6 旬 |
| `na_yin.json` | 六十甲子纳音五行 | 60 条 |
| `chang_sheng.json` | 十二长生（阳顺阴逆） | 120 条 |
| `shen_sha.json` | 神煞查法表（天乙贵人/驿马/桃花/华盖/劫煞/亡神/天喜/月厌/天德/月德/天赦/刑冲合害破等） | 23 类 |
| `qi_men.json` | 奇门三元局数（24 节气×上中下元）+ 九星/八门/八神/三奇六仪映射 | 72 局 + 映射 |
| `xiu.json` | 二十八宿（七政/动物/宿度/吉凶/宫位） | 28 条 |
| `jian_chu.json` | 建除十二神 + 黄黑道十二神 | 各 12 |
| `shi_chen.json` | 十二时辰划分 + 昼夜/子时换日约定 | 12 条 |
| `anchors_report.json` | 节气时刻与官方公布值比对报告 | — |
| `verify_report.json` | 现有数据全量校验报告（农历/干支/节气差异清单） | — |
| `cross_check_report.json` | 双库交叉校验报告（skyfield vs lunar_python） | — |

**精度说明**：节气时刻由 JPL DE422 星历（skyfield）计算，与 lunar_python（寿星天文历）逐条互验一致（3,862/3,864 日期一致，仅 1911 立夏、1951 冬至两个发生在午夜前后数十秒的节气跨日不同）；与国内官方公布值相差约 12~15 秒，属不同天文理论的正常差异，不影响时辰（2 小时）粒度的排盘使用。

---

## 七、读取示例（Python）

```python
import json, glob

records = []
for f in sorted(glob.glob(r"json\calendar_data_*.json")):
    with open(f, encoding="utf-8") as fh:
        records.extend(json.load(fh))

# 按日期索引
by_date = {r["date"]: r for r in records}

r = by_date["2024-02-10"]
print(r["lunar_year"], r["lunar_month"], r["lunar_day"])   # 2024 1 1
print(r["year_gan"] + r["year_zhi"], r["zodiac"])          # 甲辰 龙

# 闰月判断：lunar_month < 0 即为闰月，abs() 为闰的月份
leap = [r for r in records if r["lunar_month"] < 0]
print(len(leap))                                           # 1729
```

使用 SQLite：

```sql
SELECT date, lunar_year, lunar_month, lunar_day
FROM calendar
WHERE date = '2024-02-10';
```

---

*本说明基于对 17 个 JSON 文件全量统计（58,805 条记录）编写，字段取值与统计数字均直接来自数据本身；扩展数据说明见《万年历数据扩展规格说明.md》。*

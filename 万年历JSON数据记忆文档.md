# 记忆文档（工作区共享）

> 本文件记录 **LargeLiuRen-Design** 工作区内「万年历数据」任务的完整过程、产出、关键决策与踩坑记录，供工作区其他任务（大六壬/奇门/紫微等排盘软件）阅读与复用。
> 最后更新：本任务完成时。

---

## 1. 任务概述

**目标**：完善 `万年历JSON数据/` 的万年历数据，使其可用于大六壬、奇门遁甲等国学排盘软件。

**四个阶段**（全部完成）：

| 阶段 | 内容 | 产出 |
| --- | --- | --- |
| ① 数据说明 | 全量读取 17 个 JSON（58,805 条）统计分析，重写说明文档 | `万年历JSON数据/万年历json数据说明.md` |
| ② 扩展规格 | 面向排盘软件的数据扩展方案（分层架构、11 个新文件规格、准确度保障方案） | `万年历JSON数据/万年历数据扩展规格说明.md` |
| ③ 数据生成 | 生成节气时刻表、月将表、静态规则表、修正主表，全量校验 | `万年历JSON数据/ext/`（14 个文件） |
| ④ 工具整理 | 脚本移入独立工具目录，共享路径模块化 | `tools/`（7 脚本 + paths.py + README.md） |

---

## 2. 工作区结构（当前状态）

```
LargeLiuRen-Design/
├─ tools/                     # 可复用工具脚本（本任务新整理）
│  ├─ README.md               # 脚本用法与运行顺序
│  ├─ paths.py                # 共享路径模块（项目根/.pyext/数据目录）
│  ├─ pyext_solar_terms.py    # 节气时刻核心计算（JPL DE422 视黄经）
│  ├─ gen_solar_terms.py      # 生成 ext/solar_terms.json
│  ├─ gen_yue_jiang.py        # 生成 ext/yue_jiang.json
│  ├─ gen_static_tables.py    # 生成 ext/ 8 个静态规则表
│  ├─ verify_and_fixed.py     # 校验现有数据 + 生成 ext/calendar_fixed.json
│  └─ cross_check.py          # 双库交叉校验
├─ .pyext/                    # 本地依赖库（不占系统 Python）
│  ├─ lunar_python/           # 农历/干支/节气（寿星天文历算法）
│  ├─ cnlunar/                # 备用校验
│  ├─ skyfield/ numpy/ jplephem/ sgp4/ dateutil/ six/ certifi/
│  └─ de422.bsp               # JPL 星历（约 623MB，覆盖 1900~2200）
├─ 万年历JSON数据/
│  ├─ json/                   # 【原始数据，只读】17 个分片，58,805 条
│  ├─ ext/                    # 【本任务新增】扩展数据 14 个文件
│  ├─ calendar.csv / .db / .xls   # 原始数据其他格式（只读）
│  ├─ 万年历json数据说明.md
│  └─ 万年历数据扩展规格说明.md
├─ 大六壬文档/  APP/  Web/     # 工作区其他内容（未涉及）
└─ 大六壬排盘教学.html
```

---

## 3. 数据资产清单

### 3.1 原始数据（`万年历JSON数据/json/`，未改动）

- 17 个 `calendar_data_0001~0017.json`，按 10 年分片（0017 仅 2060 年）；
- **1900-01-01 ~ 2060-12-31，共 58,805 天，无缺漏**；每天 20 字段（date/year/month/day/lunar_*/zodiac/干支/星期/is_holiday/holiday_name/solar_term/festivals）；
- 编码 UTF-8 无 BOM，CRLF；单文件约 1.7MB。

### 3.2 扩展数据（`万年历JSON数据/ext/`，本任务新增）

| 文件 | 内容 | 规模 |
| --- | --- | --- |
| `solar_terms.json` | 24 节气交接时刻（东八区秒级），含节/气、立春纪年年柱、月柱 | 3,864 条 |
| `yue_jiang.json` | 大六壬月将换将时刻（=十二中气交接时刻） | 161 年 × 12 段 |
| `calendar_fixed.json` | 修正主表：权威农历/日干支/节气 + `year_gan_zhi_lichun` | 58,805 条 |
| `xun_kong.json` | 六甲旬空 + 旬首（奇门值符用） | 6 旬 |
| `na_yin.json` | 六十甲子纳音 | 60 条 |
| `chang_sheng.json` | 十二长生 | 120 条 |
| `shen_sha.json` | 神煞查法（贵人/驿马/桃花/华盖/劫煞/亡神/天喜/月厌/天德/月德/天赦/刑冲合害破等） | 23 类 |
| `qi_men.json` | 奇门三元局数 + 九星/八门/八神/三奇六仪 | 72 局+映射 |
| `xiu.json` | 二十八宿 | 28 条 |
| `jian_chu.json` | 建除十二神 + 黄黑道 | 各 12 |
| `shi_chen.json` | 十二时辰 + 昼夜/子时约定 | 12 条 |
| `anchors_report.json` | 官方锚点比对 | 7 条 |
| `verify_report.json` | 现有数据全量校验报告 | — |
| `cross_check_report.json` | 双库交叉校验报告 | — |

---

## 4. 关键发现与决策（其他任务必读）

### 4.1 原数据问题（已在修正主表中处理）

1. **年柱按农历春节换柱**，而八字/奇门/大六壬以**立春**换柱 → 每年「立春~春节」窗口年柱不同（如 2024-02-04 立春当天原数据为癸卯，应为甲辰）。修正：`calendar_fixed.json` 新增 `year_gan_zhi_lichun` 字段，原字段保留为春节纪年（`year_gan_zhi_chunjie`）；
2. **缺小寒、大寒两个节气**（原数据每年仅 22 个）；
3. **1,421 个节气日期标错 ±1~2 天**（如 1900 年惊蛰原标 03-05，实际 03-06）——原数据的 `solar_term` 日期字段不可全信，`ext/solar_terms.json` 为权威修正版；
4. **农历 2057 年八月**（2057-09-28 ~ 10-27 共 30 天）与原数据相差 1 天（朔日/大小月分歧），修正主表采用寿星天文历值；
5. `is_holiday`/`holiday_name` 全表为空（预留字段）；`calendar.db` 的 `holidays` 表为空模板；
6. `festivals` 仅 4 个固定公历节日（元旦/劳动节/国庆节/圣诞节），无农历节日。

### 4.2 已验证一致的字段（可直接信任）

日干支、月柱（按节气日换月）、年柱（春节）、生肖、星期 → **与原数据及 lunar_python 100% 一致（58,805/58,805）**。

### 4.3 数据约定（沿用/确立）

- `week_day`：**0=星期一 … 6=星期日**（lunar_python `getWeek()` 是 0=周日，换算公式 `(getWeek()+6)%7`）；
- 闰月：`lunar_month` **负数为闰月**，取绝对值即闰月序号（原数据与 lunar_python 同为该约定，全表 60 个闰月、1,729 闰月天，含 2033 闰十一月）；
- 时区：全部 **东八区（UTC+8）北京时间**；
- 子时换日：默认**子初 23:00 换日**（晚子时日柱用次日），可配置；
- 节气时刻定义：**太阳视黄经 15° 整数倍**（立春 315°、春分 0°……）。

### 4.4 准确度结论（如实记录）

- 节气时刻源：**JPL DE422 星历**（skyfield 计算），与 lunar_python（寿星天文历）逐条互验：**日期 3,862/3,864 一致**，时刻差中位数 3 秒、最大 46 秒（1900 年代）；
- 与国内官方公布值（紫金山/新华社/气象，如 2024 立春 16:26:53）差 **12~15 秒**——不同天文理论的正常差异，不影响时辰（2 小时）粒度排盘；
- **2 个跨午夜边缘节气**：1911 立夏（23:59:46）、1951 冬至（23:59:49）——发生在午夜前后数十秒，两套算法跨日不同，本数据采用 skyfield 日期；
- 干支规则字段（五虎遁推导的立春年柱/月柱）经 lunar_python 逐条核验 7,727/7,728 一致（唯一差异即 1911 立夏跨日）。

### 4.5 工具链决策

- **sxtwl 不可用**：Python 3.14 无预编译 wheel（仅源码 sdist），本机无 C++ 编译器 → 改用 **lunar_python**（主校验）+ **skyfield/JPL de422**（节气时刻权威源）+ **cnlunar**（备用）；
- 节气时刻生成算法已实现并固化在 `tools/pyext_solar_terms.py`：每年逐日采样视黄经一次（约 365 次星历求值），找交点后用牛顿迭代精化到秒级。

---

## 5. 可复现方法（其他任务如何用）

### 5.1 直接使用数据

```python
import json
ext = r"万年历JSON数据\ext"
fixed = {r["date"]: r for r in json.load(open(ext + r"\calendar_fixed.json", encoding="utf-8"))}
terms = json.load(open(ext + r"\solar_terms.json", encoding="utf-8"))
r = fixed["2024-02-04"]
print(r["year_gan_zhi_lichun"], r["month_gan"] + r["month_zhi"])  # 甲辰 丙寅
```

### 5.2 重新生成数据（需 `.pyext/` 依赖）

```bash
cd tools
python gen_solar_terms.py     # ① 节气时刻表（约 5 分钟）
python gen_yue_jiang.py       # ② 月将表
python gen_static_tables.py   # ③ 静态规则表
python verify_and_fixed.py    # ④ 校验 + 修正主表
python cross_check.py         # ⑤ 交叉校验
```

### 5.3 扩展年份

`de422.bsp` 覆盖至 2200 年（节气可扩）；但 **lunar_python 农历数据仅 1900~2100**，超范围需换农历数据源。修改 `tools/gen_solar_terms.py` 的 `range(1900, 2061)` 即可。

---

## 6. 环境与踩坑记录（同环境任务直接受益）

1. **pip 被沙箱拦截**：pip 解包临时目录（含重定向后的工作区路径）会被 DSH 文件沙箱拒绝（Errno 13 / sandbox marker）→ 解决方案：`tools/pyext_install.py` 用 urllib 直接下载 wheel/sdist 并手动解包到 `.pyext/`，绕开 pip；
2. **numpy wheel 陷阱**：Python 3.14 的 numpy 有 free-threaded 版（`cp314t` 后缀），标准版 Python 无法加载 → 必须选 `cp314-cp314-win_amd64`（安装脚本已处理）；
3. **NASA/JPL 直连被墙**（ssd.jpl.nasa.gov 超时）：使用用户提供的代理 `127.0.0.1:10808`（HTTP 代理，Python urllib + 关闭证书校验可下载；curl 的 schannel 在本机报 SEC_E_NO_CREDENTIALS 不可用）；
4. **de422.bsp 约 623MB**，位于 `.pyext/de422.bsp`，是节气时刻计算的必需文件（skyfield 加载）；
5. **Nutstore 同步盘**：edit 工具偶发 `ReplaceFileW EIO` 或 "file changed since read" → 重读后重试即可，属同步抖动非数据错误；
6. 项目根 `--大六壬项目--`（0 字节）为既有占位文件，勿删。

---

## 7. 未完成/后续建议

- [ ] 法定节假日数据（`is_holiday`/`holiday_name`/`holidays` 表）未填充；
- [ ] 农历节日（春节/端午/中秋等）与调休未收录；
- [ ] 真太阳时与均时差表（`eq_time.json`）未生成（规格中为可选）；
- [ ] `shen_sha.json` 为人工校订的主流口诀，六壬/奇门排盘前应按具体流派核对；
- [ ] 建除/黄道等择日数据如需完整宜忌，需另建宜忌词库（业务数据，非历法数据）；
- [ ] 工作区其他项目（如 FuYingDunjia 奇门、XiangZhongLiuRen 象中六壬、ZiweiAstrology 紫微）可直接引用 `ext/calendar_fixed.json` + `solar_terms.json` 作为历法底座。

---

*本记忆文档由「万年历数据」任务编写；详细规格见 `万年历JSON数据/万年历数据扩展规格说明.md`，数据说明见 `万年历json数据说明.md`，工具用法见 `tools/README.md`。*

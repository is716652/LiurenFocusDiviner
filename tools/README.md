# 万年历数据工具集（tools/）

本目录存放「万年历 JSON 数据」项目（`../万年历JSON数据/`）的可复用生成与校验脚本，面向**大六壬、奇门遁甲**等国学排盘软件的历法数据维护。

## 目录结构

```
tools/
├─ paths.py               # 共享路径模块（项目根、.pyext 依赖、数据目录）
├─ pyext_install.py       # 依赖库安装脚本（绕过 pip 临时目录限制）
├─ pyext_solar_terms.py   # 节气时刻计算核心库（JPL DE422 视黄经算法）
├─ gen_solar_terms.py     # 生成 ext/solar_terms.json（24 节气 × 161 年时刻表）
├─ gen_yue_jiang.py       # 生成 ext/yue_jiang.json（月将换将时刻表）
├─ gen_static_tables.py   # 生成 ext/ 8 个静态规则表（旬空/纳音/长生/神煞/奇门/二十八宿/建除/时辰）
├─ verify_and_fixed.py    # 校验现有数据 + 生成 ext/calendar_fixed.json（修正主表）
├─ cross_check.py         # 双库交叉校验（skyfield vs lunar_python）
└─ README.md
```

## 依赖（`.pyext/`，位于项目根目录）

脚本依赖本地目录 `../.pyext/` 中的第三方库（无需 pip 安装到系统环境）：

| 库 | 用途 |
| --- | --- |
| `skyfield` + `jplephem` + `numpy` + `sgp4` + `python-dateutil` + `six` + `certifi` | 天文计算 |
| `de422.bsp`（JPL 星历，约 623 MB） | 太阳视黄经/节气时刻权威数据源（覆盖 1900~2200） |
| `lunar_python`（6tail） | 农历/干支/节气交叉校验 |
| `cnlunar` | 备用校验 |

安装（按需，仅首次或迁移环境时）：
```bash
cd tools
python pyext_install.py lunar_python cnlunar
python pyext_install.py numpy skyfield jplephem sgp4 python-dateutil six certifi
# de422.bsp 需联网手动下载到 .pyext/（见下）
```
> `de422.bsp` 官方地址：`https://ssd.jpl.nasa.gov/ftp/eph/planets/bsp/de422.bsp`
> （如直连失败可用本地代理：`curl -x socks5h://127.0.0.1:10808 -k -L -o .pyext/de422.bsp <上述URL>`）

## 运行顺序与说明

所有脚本在 `tools/` 目录下直接运行即可，输出统一写入 `../万年历JSON数据/ext/`：

```bash
cd tools
python pyext_solar_terms.py      # (可选) 自检：官方锚点比对
python gen_solar_terms.py        # ① 节气时刻表（约 5 分钟，3864 条）
python gen_yue_jiang.py          # ② 月将表（依赖 ① 的输出）
python gen_static_tables.py      # ③ 8 个静态规则表（秒级）
python verify_and_fixed.py       # ④ 全量校验 + 修正主表 calendar_fixed.json（约 1 分钟）
python cross_check.py            # ⑤ 双库交叉校验报告
```

### 脚本明细

| 脚本 | 功能 | 输出 |
| --- | --- | --- |
| `pyext_solar_terms.py` | 节气时刻核心计算：`term_time_utc8(year, term)` 返回东八区秒级时刻；可直接运行做官方锚点自检 | 控制台 |
| `gen_solar_terms.py` | 生成 1900~2060 全部 24 节气时刻，含节/气类型、立春纪年年柱、月柱（五虎遁规则） | `ext/solar_terms.json`、`ext/anchors_report.json` |
| `gen_yue_jiang.py` | 由十二中气时刻派生月将换将段（太阳过宫 = 中气交接） | `ext/yue_jiang.json` |
| `gen_static_tables.py` | 旬空、纳音、十二长生、神煞查法、奇门局数/九星八门八神、二十八宿、建除+黄黑道、十二时辰 | `ext/xun_kong.json` 等 8 个文件 |
| `verify_and_fixed.py` | lunar_python 全量校验现有 58,805 条；生成修正主表（立春纪年年柱、精确月柱、权威节气/农历） | `ext/verify_report.json`、`ext/calendar_fixed.json` |
| `cross_check.py` | 3864 个节气时刻与规则推导干支的逐条互验 | `ext/cross_check_report.json` |

## 数据口径（重要）

- **时区**：全部为东八区（UTC+8）北京时间；
- **节气时刻**：JPL DE422 星历按太阳视黄经 15° 整数倍求解，与国内官方公布值差约 12~15 秒（不同天文理论的正常差异，不影响时辰粒度排盘）；
- **年柱双轨**：`calendar_fixed.json` 中 `year_gan_zhi_chunjie`（春节换柱，与原数据一致）与 `year_gan_zhi_lichun`（立春换柱，八字/奇门/六壬年命用）并存；
- **闰月**：`lunar_month` 为负表示闰月，绝对值即闰月序号；
- **扩展年份**：如需超出 1900~2060 范围，修改 `gen_solar_terms.py` 中 `main()` 的 `range(1900, 2061)` 即可（`de422.bsp` 覆盖至 2200 年，农历部分需 lunar_python 支持范围 1900~2100）。

## 输出数据说明

生成文件与字段定义详见 `../万年历JSON数据/万年历数据扩展规格说明.md`；数据使用说明见 `../万年历JSON数据/万年历json数据说明.md`。

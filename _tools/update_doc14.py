# -*- coding: utf-8 -*-
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\core\核心解耦与鸿蒙移植说明.md"
t = io.open(p, encoding="utf-8").read()

anchor = "## 八、待扩展\n"
addition = """✅ **第十四批：毕法教练升级 —— 分组综合断 + 年命适配建议**（回归 6/6 + 5724/5724 全过，BUILD SUCCESSFUL 0 ERROR 0 WARN）
- **分组综合断**：毕法教练 JSON 每个格局新增「类」（课体/空亡/官鬼/贵人/禄马/三传/脱耗/六合等 15 类）；`bifaCoach` 输出新增 `groups`（同类格局归并成句，如「空亡之象突出（踏脚空亡、不行传者），事多虚而不实」）
- **年命适配**：核心新增 `nianmingAdvice(chart, nianZhi)` —— 年命上神（天盘加临）+ 六亲 + 空亡/旺衰 + 个性化建议（官鬼防是非/财主动求财/子孙逢凶可解等）
- **鸿蒙 UI**：教练栏显示分组解读；毕法区底部新增「年命适配」块（12 支 chips 横向滚动 → 显示上神/六亲/旺衰/建议）；受 `bifa_coach` 付费门禁
- **Web UI**：同数据同逻辑（renderNianming + pickNian）；核心 JS 版本 `?v=20260818-9`
- **验证**：`_tests/_test_coach2.js` ALL PASS —— 组合断「命中4格局（2吉1凶1中）吉象为主」+ 2 条分组解读；年命子/午/卯/申 上神六亲旺衰建议全部正确
- **后续**：年命与用神互动断（年命上神生克用神）、行年进阶

## 八、待扩展
"""
if anchor in t:
    t = t.replace(anchor, addition)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK doc")
else:
    print("MISS anchor")

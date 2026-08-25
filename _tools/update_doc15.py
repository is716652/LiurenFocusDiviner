# -*- coding: utf-8 -*-
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\core\核心解耦与鸿蒙移植说明.md"
t = io.open(p, encoding="utf-8").read()

anchor = "## 八、待扩展\n"
addition = """✅ **第十五批：年命与用神互动断**（回归 6/6 + 5724/5724 全过，BUILD SUCCESSFUL 0 ERROR 0 WARN）
- **核心升级**：`nianmingAdvice(c, nianZhi, yongShenZhi)` 新增第三参数用神；`NianmingAdvice` 增加 `yongShen`/`rel`/`interact` 字段
- **互动断规则**：年命上神与用神五行生克 → 「我生（命主主动推动）/ 生我（事反哺命主）/ 我克（命主能掌控宜出击）/ 克我（事克命主宜回避）/ 比和（事命相合）」+ 深化建议
- **鸿蒙 UI**：年命块显示「与用神X」关系 + 互动断语（doChart 与 chips 点击均传当前用神）
- **Web UI**：renderNianming 传 `curYongshen` 并显示关系；核心 JS 版本 `?v=20260818-10`
- **验证**：`_tests/_test_nianming2.js` ALL PASS —— 丙子日用神巳：子水我克/丑土生我/寅木我生/午火比和/酉金克我，五行判定全对；空亡优先（酉逢空先断空）；无用神时 rel 空、基础建议仍在
- **后续**：行年上神、年命与用神落宫互动（非仅五行）、占事定制建议

## 八、待扩展
"""
if anchor in t:
    t = t.replace(anchor, addition)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK doc")
else:
    print("MISS anchor")

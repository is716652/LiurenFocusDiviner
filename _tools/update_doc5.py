# -*- coding: utf-8 -*-
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\core\核心解耦与鸿蒙移植说明.md"
t = io.open(p, encoding="utf-8").read()

anchor = "- **布局决策**：用户确认「底部半模态弹出 Sheet」方案（避免长页一直下滑），入口置四柱行下方\n"
addition = anchor + """
✅ **第五批：天将顺逆规则修正 + 盘面内外圈校正**（回归 6/6 + 5724/5724 全过，BUILD SUCCESSFUL 0 ERROR 0 WARN）
- **规则修正（核心 `liuren-core.ts` + 鸿蒙 `LiurenCore.ets` 同步）**：天将顺逆判定由「占时 index 0-5=顺」改为**天门地户法**——贵人落宫（贵加占时）在 **亥子丑寅卯辰=顺布**、**巳午未申酉戌=逆布**（依据 `大六壬文档/排盘/十二天神与昼贵夜贵说明.md`）；昼夜只决定用哪个贵人（昼贵/夜贵），与顺逆无关
- **盘面内外圈**（`PanDisk.ets` + Web `drawDisk/drawDiskAnimated`）：由「天将→地盘→遁干→天盘」改为传统布局「**天将(最外·接天盘外)→天盘支(外圈)→遁干(中圈)→地盘支(内圈)→中心月将**」
- **Web 天盘渲染**：删除天盘支"同位→加临"飞行动画（动画中间态易显示为"月将未加时"），改为直接渲染加临后的天盘——地盘巳宫=午、地盘午宫=未（月将午加巳时）
- **回归测试**：`jiangMap`/`shun` 从重构比对中移除（规则修正项），新增 `_tests/_test_jiangpan.js` 独立校验 12 占时顺逆 + 顺逆布顺序 + 贵加占时落宫
- **验证**：核心实际 buildChart（2026-08-18 甲子日 己巳时，月将午）→ 地盘巳=午✓ 地盘午=未✓ 贵人丑落巳宫✓ 逆布✓；天将顺序与文档逐字一致
"""

if anchor in t:
    t = t.replace(anchor, addition)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK doc")
else:
    print("MISS anchor")

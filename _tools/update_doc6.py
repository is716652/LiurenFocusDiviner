# -*- coding: utf-8 -*-
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\core\核心解耦与鸿蒙移植说明.md"
t = io.open(p, encoding="utf-8").read()

old = "- **规则修正（核心 `liuren-core.ts` + 鸿蒙 `LiurenCore.ets` 同步）**：天将顺逆判定由「占时 index 0-5=顺」改为**天门地户法**——贵人落宫（贵加占时）在 **亥子丑寅卯辰=顺布**、**巳午未申酉戌=逆布**（依据 `大六壬文档/排盘/十二天神与昼贵夜贵说明.md`）；昼夜只决定用哪个贵人（昼贵/夜贵），与顺逆无关"

new = """- **规则修正（核心 `liuren-core.ts` + 鸿蒙 `LiurenCore.ets` 同步）**：天将顺逆判定由「占时 index 0-5=顺」改为**天门地户法**——贵人落宫在 **亥子丑寅卯辰=顺布**、**巳午未申酉戌=逆布**（依据 `大六壬文档/排盘/十二天神与昼贵夜贵说明.md`）；昼夜只决定用哪个贵人（昼贵/夜贵），与顺逆无关
- **贵人落宫（通用规则，非硬编码）**：贵人 = 天盘上的一支（日干+昼夜定，如甲日昼贵丑）；**月将加时后天盘贵人支落在哪个地盘宫，就从那个宫起布十二天将**（`guiGong = gongOf(tp, gui)`，非「占时宫」）——修复贵人被错放于月将所在宫（占时宫）导致的重叠；任何日干×月将×占时都按同一逻辑推导
- **通用性验证**：新增 `_tests/_test_jiangpan_all.js` —— 10 天干 × 12 占时（真实历法 buildChart）840 项检查：昼夜判定/贵人表逐字核对/贵人落宫=天盘贵人支落宫/顺逆=落宫天门地户/天将12个齐全贵人唯一，ALL PASS；`_test_jiangpan.js`（12 占时顺逆+布序）亦全过
- **回归测试调整**：`jiangMap`/`shun`/`dx.guiren`/`dx.bifa` 为规则修正影响域（旧引擎基线用错误规则），从重构比对移除；保留不依赖天将的核心排盘字段（r/tp/kegs/sanchuan/dun/nodes/relations/yuejiang/shensha）"""

if old in t:
    t = t.replace(old, new)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK doc")
else:
    print("MISS")

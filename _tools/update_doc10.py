# -*- coding: utf-8 -*-
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\core\核心解耦与鸿蒙移植说明.md"
t = io.open(p, encoding="utf-8").read()

anchor = "## 八、待扩展\n"
addition = """✅ **第十批：毕法脱败逃生组（9避难逃生 / 15脱上逢脱 / 35人宅受脱 / 36干上逢败）**（回归 6/6 + 5724/5724 全过，BUILD SUCCESSFUL 0 ERROR 0 WARN）
- **第9法 避难逃生**：三传皆无益（每传或空亡/日鬼/脱气）且 干上逢生可救 → 「避难逃生」（2026 扫描 84 例）
- **第15法 脱上逢脱**：日干生干上神、干上神又生其上神（层层脱耗）→ 「脱上逢脱·防虚诈」（330 例；样本验证丙子日干上丑·上神酉 火→土→金 ✓）
- **第35法 人宅受脱**：干支上皆乘脱气（干上生日干 且 支上生日支）→ 「人宅受脱·防失盗」（211 例）
- **第36法 干支皆败**：干上逢日干败地（沐浴，QIJI_GONG 反查）→ 「干上逢败·百事倾颓」（366 例；样本验证乙日败地巳 ✓；支上败地待补地支十二宫表）
- **修复**：`shengWx` 支持天干/地支混合五行（`WX[a] || WXG[a]`），解决天干查五行 bug
- **毕法可判定格局累计 30 法**：18(原始) + 54/89/22/82(课体+空亡) + 4/11/31/33(复合) + 9/15/35/36(脱败)
- **鸿蒙端**：同步全部 4 法（ArkTS 合规），BUILD 0 错误 0 警告；Web 端核心 JS 版本 `?v=20260818-6`

## 八、待扩展
"""
if anchor in t:
    t = t.replace(anchor, addition)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK doc")
else:
    print("MISS anchor")

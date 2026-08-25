# -*- coding: utf-8 -*-
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\core\核心解耦与鸿蒙移植说明.md"
t = io.open(p, encoding="utf-8").read()

anchor = "## 八、待扩展\n"
addition = """✅ **第十一批：地支十二宫表 ZHI_GONG + 36法「干支皆败」完整版**（回归 6/6 + 5724/5724 全过，BUILD SUCCESSFUL 0 ERROR 0 WARN）
- **新增 `ZHI_GONG` 静态表**：地支维度十二宫（按地支五行统一长生，**水土同宫**）——木(寅卯)长生亥、火(巳午)长生寅、金(申酉)长生巳、水土(子丑辰未戌亥)长生申；解决"支上败地"无法判定的缺口
- **36法升级完整版**：干上=日干败地 **且** 支上=日支败地（沐浴，用 QIJI_GONG + ZHI_GONG 双表）→ 「干支皆败·百事倾颓」；2026 扫描命中从 366 例收窄至 **61 例**（双条件更精准）；样本验证戊寅日干上卯(土败卯)·支上子(木败子) ✓
- **鸿蒙端**：同步 ZHI_GONG 表 + 36法完整版（ArkTS 合规），BUILD 0 错误 0 警告；Web 核心 JS 版本 `?v=20260818-7`

## 八、待扩展
"""
if anchor in t:
    t = t.replace(anchor, addition)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK doc")
else:
    print("MISS anchor")

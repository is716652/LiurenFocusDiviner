# -*- coding: utf-8 -*-
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\core\核心解耦与鸿蒙移植说明.md"
t = io.open(p, encoding="utf-8").read()

anchor = "## 八、待扩展\n"
addition = """✅ **第九批：毕法复合格局接入（4催官使者 / 11众鬼虽彰 / 31三传递生 / 33有始无终）**（回归 6/6 + 5724/5724 全过，BUILD SUCCESSFUL 0 ERROR 0 WARN）
- **第4法 催官使者**：日鬼乘**白虎**临日干 → 「催官使者（日鬼乘白虎临干）」（2026 扫描 92 例；样本验证壬午日干上戌=官鬼乘白虎 ✓）
- **第11法 众鬼虽彰**：三传皆日鬼 且 干上为**子孙**（制鬼）→ 「众鬼虽彰全不畏」（12 例）
- **第31法 三传递生**：初中末**递生日干**（末生中·中生初·初生日干 或反序）→ 「三传递生·有人举荐」（241 例）
- **第33法 有始无终**：初传=日**长生**、末传=日**墓** → 「有始无终（先甜后苦）」（55 例；用 QIJI_GONG 反查长生/墓之支）
- **毕法可判定格局累计**：18(原始) + 54/89/22/82(课体+空亡) + 4/11/31/33(复合) = **26 法**
- **鸿蒙端**：新增 `findZhiOfGong` 私有方法（QIJI_GONG 反查，ArkTS 合规）；BUILD 0 错误 0 警告
- **Web 端**：核心 JS 版本更新至 `?v=20260818-5`
- **剩余**：可继续接入「避难逃生/众鬼制救/脱上逢脱/干支皆败」等，多为多条件组合，可按同模式扩展

## 八、待扩展
"""
if anchor in t:
    t = t.replace(anchor, addition)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK doc")
else:
    print("MISS anchor")

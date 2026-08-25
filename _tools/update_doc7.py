# -*- coding: utf-8 -*-
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\core\核心解耦与鸿蒙移植说明.md"
t = io.open(p, encoding="utf-8").read()

anchor = "## 八、待扩展\n"
addition = """✅ **第七批：毕法课体格接入（第54法 虎视逢虎 + 第89法 任信丁马）**（回归 6/6 + 5724/5724 全过，BUILD SUCCESSFUL 0 ERROR 0 WARN）
- **接入方式**：不改毕法 JSON（数据驱动），在核心 `bifaForChuans` 判定引擎末尾新增课体格（与既有 18 法并列），依赖第六批的 `keti` 课体识别
- **第54法 虎视逢虎**：`keti` 含「昴星」且 干上/支上乘白虎 → 「虎视逢虎（昴星课干支乘白虎）」
- **第89法 任信丁马**：`keti`=「伏吟」且 六处（干支/课/传）逢**六丁神**或**驿马** → 「任信丁马（伏吟逢丁/马，须言动）」
  - 六丁神 = 旬内遁干为丁之支（`XUN_OF` 定旬首，旬首支顺数 3：甲→乙→丙→丁）
  - 驿马 = `MA_ZHI` 三合驿马表（申子辰→寅、巳酉丑→亥、寅午戌→申、亥卯未→巳）
- **验证**：2026 全日期×12 时辰扫描——363 例伏吟课中 206 例命中 89 法（逢丁/马才言动，语义正确）；129 例昴星课中 19 例命中 54 法（干支乘白虎）；`_tests/_test_bifa_keti.js` ALL PASS
- **后续**：其余 82 法中「上下皆合（伏吟五日）」「不行传者（伏吟/返吟）」等课体相关法可继续按此模式接入

## 八、待扩展
"""
if anchor in t:
    t = t.replace(anchor, addition)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK doc")
else:
    print("MISS anchor")

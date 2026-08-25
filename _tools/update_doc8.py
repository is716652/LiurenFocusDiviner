# -*- coding: utf-8 -*-
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\core\核心解耦与鸿蒙移植说明.md"
t = io.open(p, encoding="utf-8").read()

anchor = "## 八、待扩展\n"
addition = """✅ **第八批：毕法课体格继续接入（第22法 上下皆合 + 第82法 不行传者）**（回归 6/6 + 5724/5724 全过，BUILD SUCCESSFUL 0 ERROR 0 WARN）
- **第22法 上下皆合**：干支上神**互为六合**（读 `基础关系.六合` 表；原文"乙酉丙申戊申辛卯壬寅五日伏吟"类）→ 「上下皆合（干支上神互为六合）」；2026 扫描 365 例命中
- **第82法 不行传者**：中末传**空亡**（其传不行，吉凶但以初传为断）→ 「不行传者（中末空亡，考初传）」；2026 扫描 73 例命中
- **课体格累计**：54(虎视逢虎)/89(任信丁马)/22(上下皆合)/82(不行传者) 共 4 法，均依赖 `keti` 课体识别或三传空亡，不改毕法 JSON（数据驱动）
- **鸿蒙端**：ArkTS 合规（`rules.duxiang.基础关系.六合` 点访问，避免 arkts-no-props-by-index）；BUILD 0 错误 0 警告
- **Web 端**：核心 JS 版本参数更新至 `?v=20260818-4`，逻辑自动同步
- **剩余**：82 法中其余课理语义型法（催官使者/避难逃生/三传递生等）多为多条件复合格局，可按同模式继续接入或留人工判读

## 八、待扩展
"""
if anchor in t:
    t = t.replace(anchor, addition)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK doc")
else:
    print("MISS anchor")

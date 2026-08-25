# -*- coding: utf-8 -*-
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\core\核心解耦与鸿蒙移植说明.md"
t = io.open(p, encoding="utf-8").read()

anchor = "## 八、待扩展\n"
addition = """✅ **第十三批：毕法教练层（组合断 + 吉凶汇总 + 行动建议）**（回归 6/6 + 5724/5724 全过，BUILD SUCCESSFUL 0 ERROR 0 WARN）
- **数据**：`rawfile/rule/毕法教练.json` —— 30 个可判定格局的 吉凶/倾向/建议（从毕法赋原文提取）；Web 端由 `_tools/json2js_coach.py` 转为 `_data/bifa_coach.js`
- **核心**：`LiurenCore.bifaCoach(hits, coachData)`（两端同构）—— 输入命中 BifaHit[] → CoachResult{ items, ji/xiong/zhong, summary(组合断), advice(建议去重) }；2026 全扫描 6365 次命中全部有教练数据
- **鸿蒙 UI**：Index 毕法区顶部教练栏（🧭 组合断 + 建议汇总；凶课朱砂色/吉课金色）；受 `bifa_coach` 付费门禁控制（免费模式直接显示）
- **Web UI**：renderBifaSection 顶部教练栏（同数据同逻辑）；核心 JS 版本 `?v=20260818-8`
- **验证**：`_tests/_test_bifa_coach.js` ALL PASS（样本 2026-01-02 丑时疾病 → "命中3格局（2凶1中）凶象偏重" + 3 条建议）；Web 端到端模拟输出教练栏正确
- **后续**：毕法教练可深化为「格局组合综合断」（多格局交叉解读）+ 年命适配建议

## 八、待扩展
"""
if anchor in t:
    t = t.replace(anchor, addition)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK doc")
else:
    print("MISS anchor")

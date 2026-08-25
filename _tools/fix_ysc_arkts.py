# -*- coding: utf-8 -*-
"""YongShenCore.ets ArkTS 合规修复"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\model\YongShenCore.ets"
t = io.open(p, encoding="utf-8").read()

pairs = [
    # 1. ScoredItem 显式接口
    ("    const scored: { e: Record<string, Object>; s: number }[] = [];",
     "    const scored: ScoredItem[] = [];"),
    ("      const it = { e: e, s: s };",
     "      const it: ScoredItem = { e: e, s: s };"),
    ("  private static sortDesc(arr: { e: Record<string, Object>; s: number }[]): void {",
     "  private static sortDesc(arr: ScoredItem[]): void {"),
    # 2. NodeState 不再强转 Record（直接用类型访问）
    ("    const nd = (c.dx.nodes[zhi] as Record<string, Object>) || {};",
     "    const nd = c.dx.nodes[zhi];"),
    ("    const nd = c.dx.nodes[zhi] as Record<string, Object>;",
     "    const nd = c.dx.nodes[zhi];"),
]
for old, new in pairs:
    if old in t:
        t = t.replace(old, new)
        print("OK:", old[:46])
    else:
        print("MISS:", old[:60])

# 3. 声明 ScoredItem 接口（放在 DuyuItem 接口后）
anchor = "/* 占事配置（从占事体系 JSON 提取） */"
if "export interface ScoredItem" not in t:
    t = t.replace(anchor,
        "/* 选句打分项（内部排序用） */\nexport interface ScoredItem {\n  e: Record<string, Object>;\n  s: number;\n}\n\n" + anchor)
    print("OK: interface ScoredItem")

io.open(p, "w", encoding="utf-8").write(t)
print("done")

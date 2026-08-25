# -*- coding: utf-8 -*-
"""修正 22 法：严格「干支上神互为六合」（去掉与日干/日支的宽松判定）"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\core\liuren-core.ts"
t = io.open(p, encoding="utf-8").read()

old = """    /* 第22法 上下皆合：干支上神作六合（伏吟五日类；干支上神互为六合或与日干六合） */
    const lh = (LiurenCore.rules.duxiang["基础关系"] || {})["六合"] as Record<string, string> || {};
    const ganShang = kegs[0].x;
    const zhiShang = kegs[2].x;
    const liuhe = (z: string): string => lh[z] || "";
    const shangHe = (liuhe(ganShang) === zhiShang || liuhe(zhiShang) === ganShang);
    const ganHe = (liuhe(ganShang) === r.dg || liuhe(ganShang) === r.dz || liuhe(r.dg) === ganShang);
    if (shangHe || ganHe) {
      hit(22, "上下皆合（干支上神作六合）");
    }"""
new = """    /* 第22法 上下皆合：干支上神互为六合（如乙酉丙申戊申辛卯壬寅五日伏吟类） */
    const lh = (LiurenCore.rules.duxiang["基础关系"] || {})["六合"] as Record<string, string> || {};
    const ganShang = kegs[0].x;
    const zhiShang = kegs[2].x;
    const liuhe = (z: string): string => lh[z] || "";
    const shangHe = (liuhe(ganShang) === zhiShang || liuhe(zhiShang) === ganShang);
    if (shangHe) {
      hit(22, "上下皆合（干支上神互为六合）");
    }"""
if old in t:
    t = t.replace(old, new)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK 22 strict")
else:
    print("MISS")

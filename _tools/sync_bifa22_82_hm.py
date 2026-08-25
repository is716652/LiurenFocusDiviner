# -*- coding: utf-8 -*-
"""鸿蒙 LiurenCore.ets：同步 22法(上下皆合) + 82法(不行传者)"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\model\LiurenCore.ets"
t = io.open(p, encoding="utf-8").read()

old = """      if (hasDing || hasMa) {
        hit(89, "任信丁马（伏吟逢丁/马，须言动）");
      }
    }
    return out;
  }"""
new = """      if (hasDing || hasMa) {
        hit(89, "任信丁马（伏吟逢丁/马，须言动）");
      }
    }
    /* 第22法 上下皆合：干支上神互为六合（如乙酉丙申戊申辛卯壬寅五日伏吟类） */
    const lh = (LiurenCore.rules.duxiang["基础关系"] || {})["六合"] as Record<string, string> || {};
    const ganShang = kegs[0].x;
    const zhiShang = kegs[2].x;
    const liuhe = (z: string): string => lh[z] || "";
    const shangHe = (liuhe(ganShang) === zhiShang || liuhe(zhiShang) === ganShang);
    if (shangHe) {
      hit(22, "上下皆合（干支上神互为六合）");
    }
    /* 第82法 不行传者：中末传空亡，其传不行，吉凶但以初传为断 */
    const chuanKong = chu.filter((x: Chuan) => dx.xunkong.includes(x.z)).length;
    if (chuanKong >= 2 && !dx.xunkong.includes(c1)) {
      hit(82, "不行传者（中末空亡，考初传）");
    }
    return out;
  }"""
if old in t:
    t = t.replace(old, new)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK 22/82 hm")
else:
    print("MISS hm")

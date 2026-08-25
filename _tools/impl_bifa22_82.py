# -*- coding: utf-8 -*-
"""核心：毕法继续接入 —— 第22法(上下皆合·伏吟干支六合) + 第82法(不行传者·中末空亡)"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\core\liuren-core.ts"
t = io.open(p, encoding="utf-8").read()

# 在 89 法逻辑之后、return out 之前插入
old_end = """      if (hasDing || hasMa) {
        hit(89, "任信丁马（伏吟逢丁/马，须言动）");
      }
    }
    return out;
  }"""
new_end = """      if (hasDing || hasMa) {
        hit(89, "任信丁马（伏吟逢丁/马，须言动）");
      }
    }
    /* 第22法 上下皆合：干支上神作六合（伏吟五日类；干支上神互为六合或与日干六合） */
    const lh = (LiurenCore.rules.duxiang["基础关系"] || {})["六合"] as Record<string, string> || {};
    const ganShang = kegs[0].x;
    const zhiShang = kegs[2].x;
    const liuhe = (z: string): string => lh[z] || "";
    const shangHe = (liuhe(ganShang) === zhiShang || liuhe(zhiShang) === ganShang);
    const ganHe = (liuhe(ganShang) === r.dg || liuhe(ganShang) === r.dz || liuhe(r.dg) === ganShang);
    if (shangHe || ganHe) {
      hit(22, "上下皆合（干支上神作六合）");
    }
    /* 第82法 不行传者：中末传空亡，其传不行，吉凶但以初传为断 */
    const chuanKong = chu.filter((x: Chuan) => dx.xunkong.includes(x.z)).length;
    if (chuanKong >= 2 && !dx.xunkong.includes(c1)) {
      hit(82, "不行传者（中末空亡，考初传）");
    }
    return out;
  }"""
if old_end in t:
    t = t.replace(old_end, new_end)
    print("OK 22/82")
else:
    print("MISS end")

io.open(p, "w", encoding="utf-8").write(t)
print("done")

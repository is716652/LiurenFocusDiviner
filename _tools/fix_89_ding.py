# -*- coding: utf-8 -*-
"""修正 89 法六丁神：旬遁得丁（旬首支+3），替代固定支表"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\core\liuren-core.ts"
t = io.open(p, encoding="utf-8").read()

# 1. 删除 DING_ZHI 固定表
old_ding = """  /* 六丁神（旬内六丁之日支）：丁卯/丁丑/丁亥/丁酉/丁未/丁巳 */
  static readonly DING_ZHI: Record<string, number> = {
    "卯": 1, "丑": 1, "亥": 1, "酉": 1, "未": 1, "巳": 1
  };

"""
if old_ding in t:
    t = t.replace(old_ding, "")
    print("OK remove DING_ZHI")
else:
    print("MISS DING_ZHI")

# 2. 89 法逻辑：六丁 = 旬首支+3
old_89 = """    /* 第89法 任信丁马：伏吟课且逢六丁神或驿马（须言动） */
    if (keti === "伏吟") {
      const zhiMa = LiurenCore.MA_ZHI[r.dz] || "";
      const six = [ji, r.dz, kegs[0].x, kegs[1].x, kegs[2].x, kegs[3].x, c1, c2, c3];
      let hasDing = false;
      for (let i = 0; i < six.length; i++) {
        if (LiurenCore.DING_ZHI[six[i]]) {
          hasDing = true;
          break;
        }
      }
      let hasMa = false;
      for (let i = 0; i < six.length; i++) {
        if (six[i] === zhiMa) {
          hasMa = true;
          break;
        }
      }
      if (hasDing || hasMa) {
        hit(89, "任信丁马（伏吟逢丁/马，须言动）");
      }
    }"""
new_89 = """    /* 第89法 任信丁马：伏吟课且逢六丁神或驿马（须言动）
       六丁神 = 旬内遁干为丁之支（旬首支顺数3：甲→乙→丙→丁） */
    if (keti === "伏吟") {
      const zhiMa = LiurenCore.MA_ZHI[r.dz] || "";
      const xun = LiurenCore.XUN_OF[r.dg + r.dz] || "";
      const dingZhi = xun.length >= 2
        ? LiurenCore.ZHI[(LiurenCore.ZHI.indexOf(xun[1]) + 3) % 12] : "";
      const six = [ji, r.dz, kegs[0].x, kegs[1].x, kegs[2].x, kegs[3].x, c1, c2, c3];
      let hasDing = false;
      for (let i = 0; i < six.length; i++) {
        if (dingZhi !== "" && six[i] === dingZhi) {
          hasDing = true;
          break;
        }
      }
      let hasMa = false;
      for (let i = 0; i < six.length; i++) {
        if (six[i] === zhiMa) {
          hasMa = true;
          break;
        }
      }
      if (hasDing || hasMa) {
        hit(89, "任信丁马（伏吟逢丁/马，须言动）");
      }
    }"""
if old_89 in t:
    t = t.replace(old_89, new_89)
    print("OK 89 logic")
else:
    print("MISS 89")

io.open(p, "w", encoding="utf-8").write(t)
print("done")

# -*- coding: utf-8 -*-
"""核心：毕法接入课体条件 —— 第54法(虎视逢虎)、第89法(任信丁马)
   新增 MA_ZHI(驿马) 静态表；bifaForChuans 末尾插入两法判定"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\core\liuren-core.ts"
t = io.open(p, encoding="utf-8").read()

# 1. MA_ZHI 静态表（三合驿马：申子辰→寅、巳酉丑→亥、寅午戌→申、亥卯未→巳）
anchor = "  /* 课体辅助静态表（《大六壬指南》三传排法规范） */"
ma = """  /* 驿马表（三合驿马）：申子辰马在寅、巳酉丑马在亥、寅午戌马在申、亥卯未马在巳 */
  static readonly MA_ZHI: Record<string, string> = {
    "申": "寅", "子": "寅", "辰": "寅",
    "巳": "亥", "酉": "亥", "丑": "亥",
    "寅": "申", "午": "申", "戌": "申",
    "亥": "巳", "卯": "巳", "未": "巳"
  };
  /* 六丁神（旬内六丁之日支）：丁卯/丁丑/丁亥/丁酉/丁未/丁巳 */
  static readonly DING_ZHI: Record<string, number> = {
    "卯": 1, "丑": 1, "亥": 1, "酉": 1, "未": 1, "巳": 1
  };

"""
if anchor in t:
    t = t.replace(anchor, ma + anchor)
    print("OK MA_ZHI")
else:
    print("MISS anchor")

# 2. bifaForChuans 末尾（return out 前）插入 54/89 两法
old_end = """    if (liuqinOf(kegs[2].x) === "官鬼" || liuqinOf(kegs[3].x) === "官鬼") {
      hit(70, "官鬼临三四课");
    }
    return out;
  }"""
new_end = """    if (liuqinOf(kegs[2].x) === "官鬼" || liuqinOf(kegs[3].x) === "官鬼") {
      hit(70, "官鬼临三四课");
    }
    /* ---- 课体格（依赖 keti 课体识别层，第六批接入） ---- */
    const keti = c.sanchuan.keti || "";
    /* 第54法 虎视逢虎：昴星课且干支上乘白虎 */
    if (keti.indexOf("昴星") >= 0) {
      const ganShangJiang = c.jiangMap[LiurenCore.gongOf(c.tp, kegs[0].x)] || "";
      const zhiShangJiang = c.jiangMap[LiurenCore.gongOf(c.tp, kegs[2].x)] || "";
      if (ganShangJiang === "白虎" || zhiShangJiang === "白虎") {
        hit(54, "虎视逢虎（昴星课干支乘白虎）");
      }
    }
    /* 第89法 任信丁马：伏吟课且逢六丁神或驿马（须言动） */
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
    }
    return out;
  }"""
if old_end in t:
    t = t.replace(old_end, new_end)
    print("OK bifa 54/89")
else:
    print("MISS bifa end")

io.open(p, "w", encoding="utf-8").write(t)
print("done")

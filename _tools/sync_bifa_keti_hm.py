# -*- coding: utf-8 -*-
"""鸿蒙 LiurenCore.ets：同步毕法课体格（MA_ZHI + 54法 + 89法）"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\model\LiurenCore.ets"
t = io.open(p, encoding="utf-8").read()

# 1. MA_ZHI 静态表（插在 QIAN_SANHE 之后）
anchor = """  static readonly QIAN_SANHE: Record<string, string> = {
    "子": "丑", "丑": "巳", "寅": "亥", "卯": "戌", "辰": "酉", "巳": "申",
    "午": "未", "未": "午", "申": "巳", "酉": "辰", "戌": "卯", "亥": "寅"
  };"""
add = anchor + """
  /* 驿马表（三合驿马）：申子辰马在寅、巳酉丑马在亥、寅午戌马在申、亥卯未马在巳 */
  static readonly MA_ZHI: Record<string, string> = {
    "申": "寅", "子": "寅", "辰": "寅",
    "巳": "亥", "酉": "亥", "丑": "亥",
    "寅": "申", "午": "申", "戌": "申",
    "亥": "巳", "卯": "巳", "未": "巳"
  };"""
if anchor in t:
    t = t.replace(anchor, add)
    print("OK MA_ZHI")
else:
    print("MISS QIAN_SANHE anchor")

# 2. bifaForChuans 末尾（官鬼临三四课后）插入 54/89
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
    /* 第89法 任信丁马：伏吟课且逢六丁神或驿马（须言动）
       六丁神 = 旬内遁干为丁之支（旬首支顺数3：甲→乙→丙→丁） */
    if (keti === "伏吟") {
      const zhiMa = LiurenCore.MA_ZHI[r.dz] || "";
      const xun = LiurenCore.XUN_OF[r.dg + r.dz] || "";
      const dingZhi = xun.length >= 2
        ? LiurenCore.ZHI[(LiurenCore.ZHI.indexOf(xun[1]) + 3) % 12] : "";
      const six: string[] = [ji, r.dz, kegs[0].x, kegs[1].x, kegs[2].x, kegs[3].x, c1, c2, c3];
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

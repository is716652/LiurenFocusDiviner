# -*- coding: utf-8 -*-
"""鸿蒙 LiurenCore.ets：同步复合格局 4/11/31/33"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\model\LiurenCore.ets"
t = io.open(p, encoding="utf-8").read()

old_end = """    /* 第82法 不行传者：中末传空亡，其传不行，吉凶但以初传为断 */
    const chuanKong = chu.filter((x: Chuan) => dx.xunkong.includes(x.z)).length;
    if (chuanKong >= 2 && !dx.xunkong.includes(c1)) {
      hit(82, "不行传者（中末空亡，考初传）");
    }
    return out;
  }"""
new_end = """    /* 第82法 不行传者：中末传空亡，其传不行，吉凶但以初传为断 */
    const chuanKong = chu.filter((x: Chuan) => dx.xunkong.includes(x.z)).length;
    if (chuanKong >= 2 && !dx.xunkong.includes(c1)) {
      hit(82, "不行传者（中末空亡，考初传）");
    }
    /* ---- 复合格局（第八批接入，不依赖课体） ---- */
    /* 第4法 催官使者：日鬼乘白虎临日干（干上神为日鬼且乘白虎） */
    const ganShangJ = c.jiangMap[LiurenCore.gongOf(c.tp, kegs[0].x)] || "";
    if (liuqinOf(kegs[0].x) === "官鬼" && ganShangJ === "白虎") {
      hit(4, "催官使者（日鬼乘白虎临干）");
    }
    /* 第11法 众鬼虽彰：三传皆日鬼 且 干上为子孙（制鬼） */
    const lqAll = chu.map((x: Chuan) => liuqinOf(x.z));
    if (lqAll.every((x: string) => x === "官鬼") && liuqinOf(kegs[0].x) === "子孙") {
      hit(11, "众鬼虽彰全不畏（三传皆鬼·干上子孙制之）");
    }
    /* 第31法 三传递生：初中末递生日干（末生中·中生初·初生日干，或反序） */
    const shengOf = (a: string, b: string): boolean => LiurenCore.SHENG(LiurenCore.WX[a]) === LiurenCore.WX[b];
    const dgWx = LiurenCore.WXG[r.dg];
    const chuanWx = chu.map((x: Chuan) => LiurenCore.WX[x.z]);
    const shengGan = (z: string): boolean => LiurenCore.SHENG(LiurenCore.WX[z]) === dgWx;
    const diSheng = (shengOf(c3, c2) && shengOf(c2, c1) && shengGan(c1));
    const diSheng2 = (shengOf(c1, c2) && shengOf(c2, c3) && shengGan(c3));
    if (diSheng || diSheng2) {
      hit(31, "三传递生（传来递生·有人举荐）");
    }
    /* 第33法 有始无终：初传为日长生、末传为日墓（先甜后苦） */
    const qj33 = LiurenCore.QIJI_GONG[r.dg] || {};
    const csZ = LiurenCore.findZhiOfGong(qj33, "长生");
    const muZ = LiurenCore.findZhiOfGong(qj33, "墓");
    if (csZ !== "" && muZ !== "" && c1 === csZ && c3 === muZ) {
      hit(33, "有始无终（初长生·末墓，先甜后苦）");
    }
    return out;
  }

  /* 十二宫气机点反查：某宫名对应之支（如长生/墓） */
  private static findZhiOfGong(qj: Record<string, string>, gong: string): string {
    const keys: string[] = [];
    const all = Object.keys(qj);
    for (let i = 0; i < all.length; i++) {
      keys.push(all[i]);
    }
    for (let i = 0; i < keys.length; i++) {
      if (qj[keys[i]] === gong) {
        return keys[i];
      }
    }
    return "";
  }
"""
if old_end in t:
    t = t.replace(old_end, new_end)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK 4/11/31/33 hm")
else:
    print("MISS hm")

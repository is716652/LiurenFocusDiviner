# -*- coding: utf-8 -*-
"""鸿蒙 LiurenCore.ets：同步脱败逃生组 9/15/35/36"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\model\LiurenCore.ets"
t = io.open(p, encoding="utf-8").read()

old_end = """    /* 第33法 有始无终：初传为日长生、末传为日墓（先甜后苦） */
    const qj33 = LiurenCore.QIJI_GONG[r.dg] || {};
    const changShengZ = LiurenCore.findZhiOfGong(qj33, "长生");
    const muZ = LiurenCore.findZhiOfGong(qj33, "墓");
    if (changShengZ !== "" && muZ !== "" && c1 === changShengZ && c3 === muZ) {
      hit(33, "有始无终（初长生·末墓，先甜后苦）");
    }
    return out;
  }"""
new_end = """    /* 第33法 有始无终：初传为日长生、末传为日墓（先甜后苦） */
    const qj33 = LiurenCore.QIJI_GONG[r.dg] || {};
    const changShengZ = LiurenCore.findZhiOfGong(qj33, "长生");
    const muZ = LiurenCore.findZhiOfGong(qj33, "墓");
    if (changShengZ !== "" && muZ !== "" && c1 === changShengZ && c3 === muZ) {
      hit(33, "有始无终（初长生·末墓，先甜后苦）");
    }
    /* ---- 脱败逃生组（第十批接入） ---- */
    const ganS = kegs[0].x;
    const zhiS = kegs[2].x;
    const ganWx = LiurenCore.WXG[r.dg];
    const zhiWx = LiurenCore.WX[r.dz];
    const shengWx = (a: string, b: string): boolean => {
      const wa = LiurenCore.WX[a] || LiurenCore.WXG[a] || "";
      const wb = LiurenCore.WX[b] || LiurenCore.WXG[b] || "";
      return wa !== "" && wb !== "" && LiurenCore.SHENG(wa) === wb;
    };
    const tuoGan = (z: string): boolean => shengWx(z, r.dg);
    const tuoZhi = (z: string): boolean => shengWx(z, r.dz);
    const shengGan2 = (z: string): boolean => shengWx(z, r.dg);
    /* 第9法 避难逃生：三传皆无益（每传或空亡/日鬼/脱气），干上逢生可救 */
    const chuWorthless = chu.every((x: Chuan) =>
      dx.xunkong.includes(x.z) || liuqinOf(x.z) === "官鬼" || shengWx(x.z, r.dg));
    if (chuWorthless && shengGan2(ganS) && !dx.xunkong.includes(ganS)) {
      hit(9, "避难逃生（三传无益·干上逢生可救）");
    }
    /* 第35法 人宅受脱：干支上皆乘脱气（干上生日干 且 支上生日支） */
    if (tuoGan(ganS) && tuoZhi(zhiS)) {
      hit(35, "人宅受脱（干支上皆脱气，防失盗）");
    }
    /* 第36法 干支皆败：干上逢日干败地（沐浴；核心暂无地支败地表，支上败地留待补表） */
    const qj36 = LiurenCore.QIJI_GONG[r.dg] || {};
    const baiZ = LiurenCore.findZhiOfGong(qj36, "沐浴");
    if (baiZ !== "" && ganS === baiZ) {
      hit(36, "干上逢败（日干败地临干·百事倾颓）");
    }
    /* 第15法 脱上逢脱：日干生干上神，干上神又生其上神（层层脱耗） */
    const ganS2 = c.tp[ganS];
    if (shengWx(r.dg, ganS) && ganS2 !== "" && shengWx(ganS, ganS2)) {
      hit(15, "脱上逢脱（干生上神·上神又生，防虚诈）");
    }
    return out;
  }"""
if old_end in t:
    t = t.replace(old_end, new_end)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK 9/15/35/36 hm")
else:
    print("MISS hm")

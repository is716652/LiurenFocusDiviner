# -*- coding: utf-8 -*-
"""修复 9/15/35：天干五行查 WXG（原 shengWx 用 WX[a] 对天干无效）"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\core\liuren-core.ts"
t = io.open(p, encoding="utf-8").read()

old = """    /* ---- 脱败逃生组（第十批接入） ---- */
    const ganS = kegs[0].x;
    const zhiS = kegs[2].x;
    const shengWx = (a: string, b: string): boolean => LiurenCore.SHENG(LiurenCore.WX[a]) === LiurenCore.WX[b];
    const ganWx = LiurenCore.WXG[r.dg];
    const zhiWx = LiurenCore.WX[r.dz];
    const tuoGan = (z: string): boolean => shengWx(z, r.dg);   /* 上神生日干 = 脱 */
    const tuoZhi = (z: string): boolean => shengWx(z, r.dz);   /* 上神生日支 = 脱 */
    const shengGan2 = (z: string): boolean => shengWx(z, r.dg); /* 生我 */
    /* 第9法 避难逃生：三传皆无益（空亡/日鬼/脱气），干上逢生可救 */
    const chuWorthless = chu.every((x: Chuan) =>
      dx.xunkong.includes(x.z) || liuqinOf(x.z) === "官鬼" || shengWx(x.z, r.dg));
    if (chuWorthless && shengGan2(ganS) && !dx.xunkong.includes(ganS)) {
      hit(9, "避难逃生（三传无益·干上逢生可救）");
    }
    /* 第35法 人宅受脱：干支上皆乘脱气（干上生日干 且 支上生日支） */
    if (tuoGan(ganS) && tuoZhi(zhiS)) {
      hit(35, "人宅受脱（干支上皆脱气，防失盗）");
    }"""
new = """    /* ---- 脱败逃生组（第十批接入） ---- */
    const ganS = kegs[0].x;
    const zhiS = kegs[2].x;
    const ganWx = LiurenCore.WXG[r.dg];
    const zhiWx = LiurenCore.WX[r.dz];
    /* 五行生克：a 生 b（a 为地支/天干，b 为天干或地支，自动取对应五行） */
    const shengWx = (a: string, b: string): boolean => {
      const wa = LiurenCore.WX[a] || LiurenCore.WXG[a] || "";
      const wb = LiurenCore.WX[b] || LiurenCore.WXG[b] || "";
      return wa !== "" && wb !== "" && LiurenCore.SHENG(wa) === wb;
    };
    const tuoGan = (z: string): boolean => shengWx(z, r.dg);   /* 上神生日干 = 脱 */
    const tuoZhi = (z: string): boolean => shengWx(z, r.dz);   /* 上神生日支 = 脱 */
    const shengGan2 = (z: string): boolean => shengWx(z, r.dg); /* 生我 */
    /* 第9法 避难逃生：三传皆无益（每传或空亡/日鬼/脱气），干上逢生可救 */
    const chuWorthless = chu.every((x: Chuan) =>
      dx.xunkong.includes(x.z) || liuqinOf(x.z) === "官鬼" || shengWx(x.z, r.dg));
    if (chuWorthless && shengGan2(ganS) && !dx.xunkong.includes(ganS)) {
      hit(9, "避难逃生（三传无益·干上逢生可救）");
    }
    /* 第35法 人宅受脱：干支上皆乘脱气（干上生日干 且 支上生日支） */
    if (tuoGan(ganS) && tuoZhi(zhiS)) {
      hit(35, "人宅受脱（干支上皆脱气，防失盗）");
    }"""
if old in t:
    t = t.replace(old, new)
    print("OK 9/35 sheng fix")
else:
    print("MISS 9/35")

# 15 法同样修复
old15 = """    /* 第15法 脱上逢脱：日干生干上神，干上神又生其上神（层层脱耗） */
    const ganS2 = c.tp[ganS];
    if (shengWx(r.dg, ganS) && ganS2 !== "" && shengWx(ganS, ganS2)) {
      hit(15, "脱上逢脱（干生上神·上神又生，防虚诈）");
    }"""
new15 = """    /* 第15法 脱上逢脱：日干生干上神，干上神又生其上神（层层脱耗） */
    const ganS2 = c.tp[ganS];
    if (shengWx(r.dg, ganS) && ganS2 !== "" && shengWx(ganS, ganS2)) {
      hit(15, "脱上逢脱（干生上神·上神又生，防虚诈）");
    }"""
if old15 in t:
    t = t.replace(old15, new15)
    print("OK 15 (unchanged logic, fixed via shengWx)")
else:
    print("MISS 15")

io.open(p, "w", encoding="utf-8").write(t)
print("done")

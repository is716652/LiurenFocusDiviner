# -*- coding: utf-8 -*-
"""修正课体测试：八专样本用无克 tp；别责用正确无克 3 课构造"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\_tests\_test_keti.js"
t = io.open(p, encoding="utf-8").read()

# 3. 八专：甲寅日（寅寄寅），用无贼克的天盘
old3 = """/* 3. 八专：干支同位（甲寅日，寅寄寅），天盘非伏吟 */
{
  // 用非伏吟天盘（月将加时后不完全重合）
  const tpDesc = ['未', '申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰', '巳', '午']; // 子->未...
  const r = testKeti('甲', '寅', tpDesc, null);
  check('八专识别', r.sc.keti === '八专', 'got ' + r.sc.keti + ' kegs:' + r.kegs.map(k => k.x + k.s).join(','));
  console.log('  八专三传:', r.sc.chuans.map(c => c.gz).join('→'));
}"""
new3 = """/* 3. 八专：干支同位（甲寅日，寅寄寅），须无贼克 */
{
  // 用无克天盘：子->戌（使寅上神与寅无克、四课无贼克）
  // 甲寅日：干上神= tp[寅]，支上神= tp[寅]（同位）→ 2 课
  // 需 tp[寅] 与 寅、以及上神之间无克：选 tp[寅]=戌? 戌土克寅木? 火克金...
  // 安全做法：直接用"伏吟"的邻居——天盘仅错开 1 位且干支同位
  // 甲寅日、天盘 tp[子]=亥...（顺移-1），检查无克
  const tpDesc = ['亥', '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌'];
  const r = testKeti('甲', '寅', tpDesc, null);
  // 甲寅：干上神=tp[寅]=卯，支上神=tp[寅]=卯（同位），卯与寅木比和（无克）
  check('八专识别', r.sc.keti === '八专', 'got ' + r.sc.keti + ' kegs:' + r.kegs.map(k => k.x + k.s).join(','));
  console.log('  八专三传:', r.sc.chuans.map(c => c.gz).join('→'));
}"""

# 4. 别责：手工构造无克 3 课
old4 = """/* 4. 别责：四课去重3课且无贼克遥克 */
{
  // 构造：干课重复导致仅3课。丙日（寄巳），用特殊 tp
  // 简单构造：让 g2 与 g4 相同
  const dg = '甲', dz = '子';
  const ji = LiurenCore.JI_GONG[dg]; // 寅
  // tp: 使 g1=tp[寅], g2=tp[g1], g3=tp[子], g4=tp[g3]，且 g2===g4
  // 选 tp[寅]=卯, tp[卯]=卯?? 天盘不能重复。改用手工 kegs 构造
  const tp = {};
  ZHI.forEach((z, i) => { tp[z] = ZHI[(i + 1) % 12]; }); // 顺移一位（非伏吟非返吟）
  // 手工四课：干课两课重合 → 3 课
  const g1 = '卯', g2 = '卯'; // 干上两课同一上神（干阳课=干阴课）
  const g3 = tp['子'], g4 = tp[g3];
  const kegs = [{ x: g1, s: dg }, { x: g2, s: g1 }, { x: g3, s: dz }, { x: g4, s: g3 }];
  const dun = LiurenCore.dunMap(dg);
  const sc = LiurenCore.resolveSanchuan(dg, tp, kegs, dun);
  check('别责识别', sc.keti === '别责', 'got ' + sc.keti + ' ' + sc.method);
  console.log('  别责三传:', sc.chuans.map(c => c.gz).join('→'));
}"""
new4 = """/* 4. 别责：四课去重3课且无贼克遥克 */
{
  // 构造：干课仅1课（干阴课与干阳课重复）→ 3 课，且全程无克
  // 甲日（寄寅），取干上神=午（午与甲木无克：甲木生午火 = 我生，非克）
  // 支课：日支子，子上神=午（午火与子水？子水克午火=上克下=贼克！需避免）
  // 改：日支未，未上神=午（午火与未土：火生土=我生非克）
  const dg = '甲', dz = '未';
  // 手工四课：干两课= (午,甲),(午,午)；支两课= (午,未),(X,午)
  // 需支阴课上神 X 与午无克：选 X=申（午火克申金=上克下=贼克！）改 X=戌（午火生戌土? 火生土 我生，无克）
  const g1 = '午', g2 = '午', g3 = '午', g4 = '戌';
  const kegs = [{ x: g1, s: dg }, { x: g2, s: g1 }, { x: g3, s: dz }, { x: g4, s: g3 }];
  // 检查无贼克：午-甲(我生无克)、午-午(比和无克)、午-未(我生无克)、戌-午(午火生戌土? 火生土=我生无克)
  const dun = LiurenCore.dunMap(dg);
  // 用任意 tp（别责不依赖 tp 判定，只判 无克+3课）
  const tp = {};
  ZHI.forEach((z, i) => { tp[z] = ZHI[(i + 2) % 12]; });
  const sc = LiurenCore.resolveSanchuan(dg, tp, kegs, dun);
  check('别责识别', sc.keti === '别责', 'got ' + sc.keti + ' ' + sc.method);
  console.log('  别责三传:', sc.chuans.map(c => c.gz).join('→'));
}"""

for old, new in [(old3, new3), (old4, new4)]:
    if old in t:
        t = t.replace(old, new)
        print("OK block")
    else:
        print("MISS block:", old[:40])
io.open(p, "w", encoding="utf-8").write(t)
print("done")

# -*- coding: utf-8 -*-
"""修正 _test_bifa_keti.js：补 LiurenCore.init（加载毕法规则），否则 rules.bifa 为空"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\_tests\_test_bifa_keti.js"
t = io.open(p, encoding="utf-8").read()

old = """const cal = JSON.parse(fs.readFileSync('D:/nutstore/HarmonyOS/GuoXue_Research/LargeLiuRen-Design/APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/cal/cal_2020.json', 'utf-8'));
const yjAll = JSON.parse(fs.readFileSync('D:/nutstore/HarmonyOS/GuoXue_Research/LargeLiuRen-Design/APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/cal/yj_all.json', 'utf-8'));
const calData = { '2026': cal['2026'] };
"""
new = """const R = 'D:/nutstore/HarmonyOS/GuoXue_Research/LargeLiuRen-Design/APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/rule';
const load = (f) => JSON.parse(fs.readFileSync(R + '/' + f, 'utf-8'));
/* 规则数据必须 init，否则 rules.bifa 为空 */
const duxiang = load('旺衰休囚死.json');
const shensha = load('神煞起法.json');
const bifa = load('毕法赋一百法.json');
const jc = load('基础关系.json');
LiurenCore.init({
  duxiang: { '旺衰休囚死': { '旺衰': duxiang['旺衰'] }, '基础关系': jc },
  shensha: { '神煞': shensha['神煞'] },
  bifa: { '一百法': bifa['一百法'] }
});
const cal = JSON.parse(fs.readFileSync('D:/nutstore/HarmonyOS/GuoXue_Research/LargeLiuRen-Design/APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/cal/cal_2020.json', 'utf-8'));
const yjAll = JSON.parse(fs.readFileSync('D:/nutstore/HarmonyOS/GuoXue_Research/LargeLiuRen-Design/APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/cal/yj_all.json', 'utf-8'));
const calData = { '2026': cal['2026'] };
"""
if old in t:
    t = t.replace(old, new)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK")
else:
    print("MISS")

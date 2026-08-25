# -*- coding: utf-8 -*-
"""修正 jiangpan_all 测试：移除过强的'贵人不与月将同宫'假设
（贵人支=月将支时（如戊日昼贵丑+月将丑）同宫是合法的）"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\_tests\_test_jiangpan_all.js"
t = io.open(p, encoding="utf-8").read()

old = """    // 5. 贵人落宫 ≠ 月将所在宫（不重叠）
    const yjGong = Object.keys(c.tp).find(k => c.tp[k] === c.yj.zhi);
    check(dg + '日' + hz + '时 贵人(' + guiGong + ')≠月将(' + yjGong + ')', guiGong !== yjGong,
      '(贵人' + guiGong + ' vs 月将' + yjGong + ')');"""
new = """    // 5. 贵人落宫 = 天盘贵人支落宫（贵加占时：贵人支随天盘加时后落宫）
    //    注：当贵人支=月将支时（如戊日昼贵丑+月将丑）同宫是合法的
    check(dg + '日' + hz + '时 贵人落宫=' + guiGong + '（天盘' + guiGong + '宫=' + c.tp[guiGong] + '）',
      c.tp[guiGong] === c.gui, '(tp[' + guiGong + ']=' + c.tp[guiGong] + ' 应=' + c.gui + ')');"""
if old in t:
    t = t.replace(old, new)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK")
else:
    print("MISS")

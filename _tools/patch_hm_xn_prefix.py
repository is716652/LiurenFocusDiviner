# -*- coding: utf-8 -*-
"""补丁：鸿蒙 LiurenCore.ets xingNian advice 前缀"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\model\LiurenCore.ets'

def main():
    s = io.open(P, 'r', encoding='utf-8').read()
    old = """    if (jiangNote !== "") {
      advice += " " + jiangNote;
    }
    const out: XingNianResult = {"""
    new = """    if (jiangNote !== "") {
      advice += " " + jiangNote;
    }
    if (advice !== "") {
      advice = "按六壬法诀：" + advice;
    }
    const out: XingNianResult = {"""
    assert s.count(old) == 1, s.count(old)
    s = s.replace(old, new)
    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('xingNian prefix OK')

if __name__ == '__main__':
    main()

# -*- coding: utf-8 -*-
"""「求官」信息提示换措辞：空串 → 可补：求职方向/所谋职位
涉及：主项目 rawfile、免费版 rawfile、Web zhan_shi.js、源文档 json"""
import io

TARGETS = [
    r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\resources\rawfile\rule\占事体系.json',
    r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDivinerFree\entry\src\main\resources\rawfile\rule\占事体系.json',
    r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\UI\_data\zhan_shi.js',
    r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\大六壬文档\json\占事\占事体系.json',
]

def main():
    total = 0
    for p in TARGETS:
        try:
            s = io.open(p, 'r', encoding='utf-8').read()
        except FileNotFoundError:
            print('skip missing:', p)
            continue
        # JSON 缩进形态
        old_json = '"信息提示": ""'
        new_json = '"信息提示": "可补：求职方向/所谋职位"'
        n = s.count(old_json)
        s = s.replace(old_json, new_json)
        # JS 单行形态
        old_js = '"信息提示":""'
        new_js = '"信息提示":"可补：求职方向/所谋职位"'
        n += s.count(old_js)
        s = s.replace(old_js, new_js)
        io.open(p, 'w', encoding='utf-8', newline='').write(s)
        print('OK %s (%d)' % (p, n))
        total += n
    print('TOTAL:', total)
    if total < 4:
        print('WARN: expected 4')

if __name__ == '__main__':
    main()

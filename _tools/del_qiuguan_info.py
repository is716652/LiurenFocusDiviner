# -*- coding: utf-8 -*-
"""删除「求官」类信息提示：可补：年命/目标岗位方位（改为空串）
涉及：主项目 rawfile、免费版 rawfile、Web zhan_shi.js、源文档 json"""
import io

TARGETS = [
    r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\resources\rawfile\rule\占事体系.json',
    r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDivinerFree\entry\src\main\resources\rawfile\rule\占事体系.json',
    r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\UI\_data\zhan_shi.js',
    r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\大六壬文档\json\占事\占事体系.json',
]

def patch(s):
    """JSON 形态（缩进版）："信息提示": "可补：年命/目标岗位方位"  →  "信息提示": "" """
    old_json = '"信息提示": "可补：年命/目标岗位方位"'
    new_json = '"信息提示": ""'
    n = s.count(old_json)
    s = s.replace(old_json, new_json)
    # JS 单行形态（backup/源文档压缩版可能不同，先只处理标准 JSON 缩进形态）
    old_js = '"信息提示":"可补：年命/目标岗位方位"'
    new_js = '"信息提示":""'
    n += s.count(old_js)
    s = s.replace(old_js, new_js)
    return s, n

def main():
    total = 0
    for p in TARGETS:
        try:
            s = io.open(p, 'r', encoding='utf-8').read()
        except FileNotFoundError:
            print('skip missing:', p)
            continue
        s2, n = patch(s)
        io.open(p, 'w', encoding='utf-8', newline='').write(s2)
        print('OK %s (%d replaced)' % (p, n))
        total += n
    print('TOTAL replaced:', total)
    if total < 4:
        print('WARN: expected >= 4 replacements')

if __name__ == '__main__':
    main()

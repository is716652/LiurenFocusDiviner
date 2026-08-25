# -*- coding: utf-8 -*-
"""免费版 module.json5 移除 INTERNET 权限（免费版无 IAP，保持零权限申报）
修复：按行精确删除 requestPermissions 块（含前导换行缩进），不破坏 JSON5 结构
"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDivinerFree\entry\src\main\module.json5'

def main():
    lines = io.open(P, encoding='utf-8').read().split('\n')
    out = []
    skip = False
    removed = False
    for ln in lines:
        s = ln.strip()
        if s == '"requestPermissions": [':
            skip = True
            removed = True
            continue
        if skip:
            if s == '],':
                skip = False
            continue
        out.append(ln)
    if removed:
        io.open(P, 'w', encoding='utf-8', newline='').write('\n'.join(out))
        print('免费版 requestPermissions 块已移除')
    else:
        print('未找到 requestPermissions（无需处理）')

if __name__ == '__main__':
    main()

# -*- coding: utf-8 -*-
"""补丁：Index.ets 付费区门禁加 paidVisible() —— 免费版整体隐藏付费区"""
import io, sys

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Index.ets'

def main():
    s = io.open(P, 'r', encoding='utf-8').read()

    # 年命适配门禁
    old1 = """        /* 年命适配（付费门禁；选年命看个性化建议） */
        if (PayGate.isUnlocked(PayConfig.F_BIFA)) {"""
    new1 = """        /* 年命适配（付费门禁；付费区仅开发/收费版显示，免费版整体隐藏） */
        if (PayConfig.paidVisible() && PayGate.isUnlocked(PayConfig.F_BIFA)) {"""
    assert s.count(old1) == 1, 'old1: %d' % s.count(old1)
    s = s.replace(old1, new1)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('Index paidVisible PATCH OK')

if __name__ == '__main__':
    main()

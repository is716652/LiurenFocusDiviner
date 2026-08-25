# -*- coding: utf-8 -*-
"""SDK 版本切换到 release API 24 (6.1.1)：主项目 + 免费版 的 default/release 产品
targetSdkVersion: 26.0.0 -> 6.1.1(24)
compatibleSdkVersion: 6.1.0(23) -> 6.1.1(24)
"""
import io

PROJS = [
    r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner',
    r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDivinerFree',
]

def patch(p):
    s = io.open(p, 'r', encoding='utf-8').read()
    n_t = s.count('"targetSdkVersion": "26.0.0"')
    n_c = s.count('"compatibleSdkVersion": "6.1.0(23)"')
    s = s.replace('"targetSdkVersion": "26.0.0"', '"targetSdkVersion": "6.1.1(24)"')
    s = s.replace('"compatibleSdkVersion": "6.1.0(23)"', '"compatibleSdkVersion": "6.1.1(24)"')
    io.open(p, 'w', encoding='utf-8', newline='').write(s)
    print('OK', p.split('\\')[-1], 'target x%d, compatible x%d' % (n_t, n_c))
    if n_t != 2 or n_c != 2:
        print('  WARN: 期望各 2 处（default + release 产品）')

for proj in PROJS:
    patch(proj + '\\build-profile.json5')
print('DONE')

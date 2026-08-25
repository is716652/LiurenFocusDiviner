# -*- coding: utf-8 -*-
"""给所有 Scroll 加边界回弹动效 .edgeEffect(EdgeEffect.Spring)
策略：每个 .scrollBar(...) 调用后追加 .edgeEffect(EdgeEffect.Spring)；
      若 Scroll 块内无 scrollBar 调用，则在 Scroll 的最后一个属性后追加。
简单方案：全文对 Scroll 块做处理——每个 Scroll() { ... } 的结尾属性链插入。
更稳：对每处 "Scroll() {" 找到其对应的收尾 "." 链，在 .scrollBar(x) 行后插 edgeEffect。
本脚本采用：在每一行 ".scrollBar(" 属性后插入 edgeEffect 行；
若某 Scroll 无 scrollBar，人工补。
"""
import io
import re

FILES = [
    r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Index.ets',
    r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Splash.ets',
    r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Legal\PrivacyPolicy.ets',
    r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Legal\UserAgreement.ets',
    r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\components\YongShenSheet.ets',
    r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\components\AffairChips.ets',
]

def patch(p):
    s = io.open(p, encoding='utf-8').read()
    if '.edgeEffect(EdgeEffect.Spring)' in s:
        print('SKIP (already has)', p.split('\\')[-1])
        return
    # 在 .scrollBar(...) 行后插入 edgeEffect
    lines = s.split('\n')
    out = []
    n = 0
    for ln in lines:
        out.append(ln)
        if re.search(r'\.scrollBar\(', ln):
            indent = re.match(r'(\s*)', ln).group(1)
            out.append(indent + '.edgeEffect(EdgeEffect.Spring)')
            n += 1
    if n > 0:
        io.open(p, 'w', encoding='utf-8', newline='').write('\n'.join(out))
        print('OK %s (%d scrollBar)' % (p.split('\\')[-1], n))
    else:
        # 无 scrollBar 的 Scroll：报告
        cnt = s.count('Scroll() {')
        print('WARN %s: %d Scroll() but %d scrollBar' % (p.split('\\')[-1], cnt, n))

for f in FILES:
    patch(f)
print('DONE')

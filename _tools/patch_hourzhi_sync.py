# -*- coding: utf-8 -*-
"""补丁：doAncientChart 同步 hourZhi（换时辰后各派生数据用对时辰）"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Index.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    old = """    this.chart = c;
    this.ancientNote = this.ancientMj + '将 ' + this.ancientDg + this.ancientDz + '日 ' + this.ancientHz + '时 · 已反推（' +"""
    assert s.count(old) == 1, 'old: %d' % s.count(old)
    new = """    this.chart = c;
    this.hourZhi = this.ancientHz; /* 同步占时（各派生状态用对时辰） */
    this.ancientNote = this.ancientMj + '将 ' + this.ancientDg + this.ancientDz + '日 ' + this.ancientHz + '时 · 已反推（' +"""
    s = s.replace(old, new)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('HOURZHI SYNC PATCH OK')

if __name__ == '__main__':
    main()

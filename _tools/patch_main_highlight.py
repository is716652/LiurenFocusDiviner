# -*- coding: utf-8 -*-
"""补丁：大盘四课第一课/三传初传 醒目标记"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Index.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    # 四课：kegRows()[3] 是第一课（最右）→ highlight
    old_k = """          KegCard({ kn: this.kegRows()[3].kn, xia: this.kegRows()[3].keg.s,
            shang: this.kegRows()[3].keg.x, jiang: this.jiangOf(this.kegRows()[3].keg.x) })
            .layoutWeight(1)"""
    assert s.count(old_k) == 1, 'k: %d' % s.count(old_k)
    new_k = """          KegCard({ kn: this.kegRows()[3].kn, xia: this.kegRows()[3].keg.s,
            shang: this.kegRows()[3].keg.x, jiang: this.jiangOf(this.kegRows()[3].keg.x),
            highlight: true })
            .layoutWeight(1)"""
    s = s.replace(old_k, new_k)

    # 三传：初传 = chuanRows()[0] → highlight
    old_c = """          ChuanCard({ pos: this.chuanRows()[0].pos, gz: this.chuanRows()[0].gz,
            jiang: this.chuanRows()[0].jiang, lq: this.chuanRows()[0].lq, color: this.chuanRows()[0].color })
            .layoutWeight(1)"""
    assert s.count(old_c) == 1, 'c: %d' % s.count(old_c)
    new_c = """          ChuanCard({ pos: this.chuanRows()[0].pos, gz: this.chuanRows()[0].gz,
            jiang: this.chuanRows()[0].jiang, lq: this.chuanRows()[0].lq, color: this.chuanRows()[0].color,
            highlight: true })
            .layoutWeight(1)"""
    s = s.replace(old_c, new_c)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('MAIN HIGHLIGHT PATCH OK')

if __name__ == '__main__':
    main()
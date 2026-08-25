# -*- coding: utf-8 -*-
"""补丁：四课改为显式四卡（避免 ForEach 首次渲染丢项，与三传一致）"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Index.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    old = """        Row({ space: 8 }) {
          ForEach(this.kegRows(), (row: KegRow) => {
            KegCard({ kn: row.kn, xia: row.keg.s, shang: row.keg.x, jiang: this.jiangOf(row.keg.x) })
              .layoutWeight(1)
          }, (row: KegRow) => 'k' + row.keg.x + row.keg.s)
        }
        .width('100%')"""
    assert s.count(old) == 1, 'old: %d' % s.count(old)
    new = """        Row({ space: 8 }) {
          KegCard({ kn: this.kegRows()[0].kn, xia: this.kegRows()[0].keg.s,
            shang: this.kegRows()[0].keg.x, jiang: this.jiangOf(this.kegRows()[0].keg.x) })
            .layoutWeight(1)
          KegCard({ kn: this.kegRows()[1].kn, xia: this.kegRows()[1].keg.s,
            shang: this.kegRows()[1].keg.x, jiang: this.jiangOf(this.kegRows()[1].keg.x) })
            .layoutWeight(1)
          KegCard({ kn: this.kegRows()[2].kn, xia: this.kegRows()[2].keg.s,
            shang: this.kegRows()[2].keg.x, jiang: this.jiangOf(this.kegRows()[2].keg.x) })
            .layoutWeight(1)
          KegCard({ kn: this.kegRows()[3].kn, xia: this.kegRows()[3].keg.s,
            shang: this.kegRows()[3].keg.x, jiang: this.jiangOf(this.kegRows()[3].keg.x) })
            .layoutWeight(1)
        }
        .width('100%')"""
    s = s.replace(old, new)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('KEG EXPLICIT PATCH OK')

if __name__ == '__main__':
    main()

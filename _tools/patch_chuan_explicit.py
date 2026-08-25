# -*- coding: utf-8 -*-
"""补丁：三传改为显式三卡（避免 ForEach 首次渲染丢末传的 bug）"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Index.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    old = """        Row({ space: 8 }) {
          ForEach(this.chuanRows(), (row: ChuanRow) => {
            ChuanCard({ pos: row.pos, gz: row.gz, jiang: row.jiang, lq: row.lq, color: row.color })
              .layoutWeight(1)
          }, (row: ChuanRow) => 'c' + row.gz)
        }
        .width('100%')
      }
      .width('100%')
      .padding(12)"""
    assert s.count(old) == 1, 'old: %d' % s.count(old)
    new = """        Row({ space: 8 }) {
          ChuanCard({ pos: this.chuanRows()[0].pos, gz: this.chuanRows()[0].gz,
            jiang: this.chuanRows()[0].jiang, lq: this.chuanRows()[0].lq, color: this.chuanRows()[0].color })
            .layoutWeight(1)
          ChuanCard({ pos: this.chuanRows()[1].pos, gz: this.chuanRows()[1].gz,
            jiang: this.chuanRows()[1].jiang, lq: this.chuanRows()[1].lq, color: this.chuanRows()[1].color })
            .layoutWeight(1)
          ChuanCard({ pos: this.chuanRows()[2].pos, gz: this.chuanRows()[2].gz,
            jiang: this.chuanRows()[2].jiang, lq: this.chuanRows()[2].lq, color: this.chuanRows()[2].color })
            .layoutWeight(1)
        }
        .width('100%')
      }
      .width('100%')
      .padding(12)"""
    s = s.replace(old, new)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('CHUAN EXPLICIT PATCH OK')

if __name__ == '__main__':
    main()

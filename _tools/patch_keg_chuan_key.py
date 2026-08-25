# -*- coding: utf-8 -*-
"""补丁：四课/三传 ForEach key 加入内容，换盘时强制重渲染（修复"四课三传不动"）"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Index.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    # ① 四课 key
    old1 = """          ForEach(this.kegRows(), (row: KegRow) => {
            KegCard({ kn: row.kn, xia: row.keg.s, shang: row.keg.x, jiang: this.jiangOf(row.keg.x) })
              .layoutWeight(1)
          }, (row: KegRow) => row.kn)"""
    assert s.count(old1) == 1, 'keg: %d' % s.count(old1)
    new1 = """          ForEach(this.kegRows(), (row: KegRow) => {
            KegCard({ kn: row.kn, xia: row.keg.s, shang: row.keg.x, jiang: this.jiangOf(row.keg.x) })
              .layoutWeight(1)
          }, (row: KegRow) => 'k' + row.keg.x + row.keg.s)"""
    s = s.replace(old1, new1)

    # ② 三传 key
    old2 = """          ForEach(this.chuanRows(), (row: ChuanRow) => {
            ChuanCard({ pos: row.pos, gz: row.gz, jiang: row.jiang, lq: row.lq, color: row.color })
              .layoutWeight(1)
          }, (row: ChuanRow) => row.pos)"""
    assert s.count(old2) == 1, 'chuan: %d' % s.count(old2)
    new2 = """          ForEach(this.chuanRows(), (row: ChuanRow) => {
            ChuanCard({ pos: row.pos, gz: row.gz, jiang: row.jiang, lq: row.lq, color: row.color })
              .layoutWeight(1)
          }, (row: ChuanRow) => 'c' + row.gz)"""
    s = s.replace(old2, new2)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('KEG/CHUAN KEY PATCH OK')

if __name__ == '__main__':
    main()

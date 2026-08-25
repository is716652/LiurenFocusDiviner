# -*- coding: utf-8 -*-
"""补丁：迷你四课改横排（4课并排，每课一列：第X课/上神/下神/神煞）"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\components\YongShenSheet.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    old = """                /* 页2 迷你四课（第一课在右；每课 第X课/上神干支/下神/神煞） */
                Column({ space: 3 }) {
                  ForEach(this.kegRowsFull(), (kr: MiniKegRow) => {
                    Row({ space: 3 }) {
                      Text(kr.kn)
                        .fontSize(8)
                        .fontColor('#8A7B5C')
                        .width(22)
                      Text(kr.xGan + kr.xZhi)
                        .fontSize(11)
                        .fontWeight(FontWeight.Bold)
                        .fontColor('#F0D98C')
                        .width(28)
                      Text('/')
                        .fontSize(9)
                        .fontColor('#6B5F45')
                      Text(kr.sGan + kr.sZhi)
                        .fontSize(11)
                        .fontColor('#C4B183')
                        .layoutWeight(1)
                      Text(kr.shensha)
                        .fontSize(8)
                        .fontColor('#6B5F45')
                        .layoutWeight(1)
                    }
                    .width('100%')
                    .padding({ top: 3, bottom: 3, left: 4, right: 4 })
                    .borderRadius(5)
                    .backgroundColor('rgba(233,200,120,0.07)')
                  }, (kr: MiniKegRow) => 'kr' + kr.kn)
                  Text('四课（上神/下神）· 左右滑切')
                    .fontSize(8)
                    .fontColor('#6B5F45')
                    .width('100%')
                    .textAlign(TextAlign.Center)
                }
                .width(150)"""
    assert s.count(old) == 1, 'old: %d' % s.count(old)
    new = """                /* 页2 迷你四课（横排4课，每课一列；第一课在右） */
                Column({ space: 3 }) {
                  Row({ space: 3 }) {
                    ForEach(this.kegRowsFull(), (kr: MiniKegRow) => {
                      Column({ space: 2 }) {
                        Text(kr.kn)
                          .fontSize(8)
                          .fontColor('#8A7B5C')
                        Text(kr.xGan + kr.xZhi)
                          .fontSize(12)
                          .fontWeight(FontWeight.Bold)
                          .fontColor('#F0D98C')
                        Text('—')
                          .fontSize(8)
                          .fontColor('#6B5F45')
                        Text(kr.sGan + kr.sZhi)
                          .fontSize(11)
                          .fontColor('#C4B183')
                        Text(kr.shensha)
                          .fontSize(7)
                          .fontColor('#6B5F45')
                          .maxLines(2)
                          .textOverflow({ overflow: TextOverflow.Ellipsis })
                      }
                      .layoutWeight(1)
                      .padding({ top: 4, bottom: 4, left: 2, right: 2 })
                      .borderRadius(5)
                      .backgroundColor('rgba(233,200,120,0.07)')
                    }, (kr: MiniKegRow) => 'kr' + kr.kn)
                  }
                  .width('100%')
                  Text('四课（上神/下神）· 左右滑切')
                    .fontSize(8)
                    .fontColor('#6B5F45')
                    .width('100%')
                    .textAlign(TextAlign.Center)
                }
                .width(150)"""
    s = s.replace(old, new)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('KEG HORIZONTAL PATCH OK')

if __name__ == '__main__':
    main()
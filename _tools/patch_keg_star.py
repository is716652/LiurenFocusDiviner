# -*- coding: utf-8 -*-
"""补丁：迷你四课 ★ 独立一行，天将行不换行"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\components\YongShenSheet.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    old = """                      Column({ space: 3 }) {
                        Text((ki === 3 ? '★ ' : '') + (kr.jiang !== '' ? kr.jiang : '—'))
                          .fontSize(10)
                          .fontWeight(ki === 3 ? FontWeight.Bold : FontWeight.Medium)
                          .fontColor(ki === 3 ? '#F0D98C' : (kr.jiang !== '' && LiurenCore.JIANG_JX[kr.jiang] === '凶' ? '#D0704A' : '#E9C878'))
                        Text(kr.xZhi)
                          .fontSize(14)
                          .fontWeight(FontWeight.Bold)
                          .fontColor('#F0D98C')
                        Text(kr.sZhi)
                          .fontSize(14)
                          .fontWeight(FontWeight.Bold)
                          .fontColor('#F0D98C')
                      }
                      .layoutWeight(1)
                      .padding({ top: 6, bottom: 6, left: 2, right: 2 })
                      .borderRadius(5)
                      .backgroundColor(ki === 3 ? 'rgba(240,217,140,0.16)' : 'rgba(233,200,120,0.07)')
                      .border({ width: ki === 3 ? 1 : 0, color: '#F0D98C' })
                      .constraintSize({ minHeight: 78 })"""
    assert s.count(old) == 1, 'old: %d' % s.count(old)
    new = """                      Column({ space: 3 }) {
                        Text(ki === 3 ? '★' : ' ')
                          .fontSize(9)
                          .fontColor('#F0D98C')
                          .height(12)
                        Text(kr.jiang !== '' ? kr.jiang : '—')
                          .fontSize(10)
                          .fontWeight(ki === 3 ? FontWeight.Bold : FontWeight.Medium)
                          .fontColor(ki === 3 ? '#F0D98C' : (kr.jiang !== '' && LiurenCore.JIANG_JX[kr.jiang] === '凶' ? '#D0704A' : '#E9C878'))
                          .maxLines(1)
                          .textOverflow({ overflow: TextOverflow.Ellipsis })
                        Text(kr.xZhi)
                          .fontSize(14)
                          .fontWeight(FontWeight.Bold)
                          .fontColor('#F0D98C')
                        Text(kr.sZhi)
                          .fontSize(14)
                          .fontWeight(FontWeight.Bold)
                          .fontColor('#F0D98C')
                      }
                      .layoutWeight(1)
                      .padding({ top: 4, bottom: 6, left: 2, right: 2 })
                      .borderRadius(5)
                      .backgroundColor(ki === 3 ? 'rgba(240,217,140,0.16)' : 'rgba(233,200,120,0.07)')
                      .border({ width: ki === 3 ? 1 : 0, color: '#F0D98C' })
                      .constraintSize({ minHeight: 82 })"""
    s = s.replace(old, new)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('KEG STAR FIX PATCH OK')

if __name__ == '__main__':
    main()
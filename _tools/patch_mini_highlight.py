# -*- coding: utf-8 -*-
"""补丁：迷你盘 四课第一课/三传初传 醒目标记"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\components\YongShenSheet.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    # 迷你四课：第一课在最右（数组最后一项）→ ForEach 带 index 判断
    old_k = """                    ForEach(this.kegRowsFull(), (kr: MiniKegRow) => {
                      Column({ space: 3 }) {
                        Text(kr.jiang !== '' ? kr.jiang : '—')
                          .fontSize(10)
                          .fontWeight(FontWeight.Medium)
                          .fontColor(kr.jiang !== '' && LiurenCore.JIANG_JX[kr.jiang] === '凶' ? '#D0704A' : '#E9C878')
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
                      .backgroundColor('rgba(233,200,120,0.07)')
                      .constraintSize({ minHeight: 78 })
                    }, (kr: MiniKegRow) => 'kr' + this.refreshTick + kr.kn)"""
    assert s.count(old_k) == 1, 'k: %d' % s.count(old_k)
    new_k = """                    ForEach(this.kegRowsFull(), (kr: MiniKegRow, ki: number) => {
                      Column({ space: 3 }) {
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
                      .constraintSize({ minHeight: 78 })
                    }, (kr: MiniKegRow, ki: number) => 'kr' + this.refreshTick + ki + kr.kn)"""
    s = s.replace(old_k, new_k)

    # 迷你三传：初传 = 第一行 → ForEach 带 index
    old_t = """                  ForEach(this.dongtaiRows(), (tr: MiniChuanRow) => {
                    Row({ space: 3 }) {
                      Text(tr.pos)
                        .fontSize(8)
                        .fontColor('#8A7B5C')
                        .width(18)
                      Text(tr.gan)
                        .fontSize(11)
                        .fontWeight(FontWeight.Bold)
                        .fontColor('#F0D98C')
                        .width(14)
                      Text(tr.zhi)
                        .fontSize(12)
                        .fontWeight(FontWeight.Bold)
                        .fontColor('#F0D98C')
                        .width(18)
                      Text(tr.lq)
                        .fontSize(9)
                        .fontColor('#A8843C')
                        .width(24)
                      Text(tr.jiang)
                        .fontSize(9)
                        .fontColor('#C4B183')
                        .layoutWeight(1)
                      Text(tr.shensha)
                        .fontSize(8)
                        .fontColor(tr.kong ? '#D0704A' : '#6B5F45')
                        .layoutWeight(1)
                    }
                    .width('100%')
                    .padding({ top: 3, bottom: 3, left: 4, right: 4 })
                    .borderRadius(5)
                    .backgroundColor('rgba(233,200,120,0.07)')
                  }, (tr: MiniChuanRow) => 'mr' + this.refreshTick + tr.pos)"""
    assert s.count(old_t) == 1, 't: %d' % s.count(old_t)
    new_t = """                  ForEach(this.dongtaiRows(), (tr: MiniChuanRow, ti: number) => {
                    Row({ space: 3 }) {
                      Text((ti === 0 ? '★ ' : '') + tr.pos)
                        .fontSize(8)
                        .fontColor(ti === 0 ? '#F0D98C' : '#8A7B5C')
                        .fontWeight(ti === 0 ? FontWeight.Bold : FontWeight.Normal)
                        .width(22)
                      Text(tr.gan)
                        .fontSize(11)
                        .fontWeight(FontWeight.Bold)
                        .fontColor('#F0D98C')
                        .width(14)
                      Text(tr.zhi)
                        .fontSize(12)
                        .fontWeight(FontWeight.Bold)
                        .fontColor('#F0D98C')
                        .width(18)
                      Text(tr.lq)
                        .fontSize(9)
                        .fontColor('#A8843C')
                        .width(24)
                      Text(tr.jiang)
                        .fontSize(9)
                        .fontColor('#C4B183')
                        .layoutWeight(1)
                      Text(tr.shensha)
                        .fontSize(8)
                        .fontColor(tr.kong ? '#D0704A' : '#6B5F45')
                        .layoutWeight(1)
                    }
                    .width('100%')
                    .padding({ top: 3, bottom: 3, left: 4, right: 4 })
                    .borderRadius(5)
                    .backgroundColor(ti === 0 ? 'rgba(240,217,140,0.14)' : 'rgba(233,200,120,0.07)')
                  }, (tr: MiniChuanRow, ti: number) => 'mr' + this.refreshTick + ti + tr.pos)"""
    s = s.replace(old_t, new_t)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('MINI HIGHLIGHT PATCH OK')

if __name__ == '__main__':
    main()
# -*- coding: utf-8 -*-
"""补丁：YongShenSheet
1) Swiper 默认页=动态三传（页0），左滑=天地盘（页1），再滑=四课（页2）
2) 删除下方 DongtaiChuan（顶部已含，不重复）
"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\components\YongShenSheet.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    # ① Swiper 页序：三传→天地盘→四课
    old = """              Swiper() {
                /* 页0 天地盘 */
                PanDisk({
                  chart: this.chart,
                  yongShen: this.yongShen,
                  cands: this.candZhis(),
                  onPickZhi: (z: string, layer: string) => {
                    this.onPickZhi(z, layer);
                  }
                })
                  .width(150)
                /* 页1 迷你四课（第一课在右，与主盘一致） */
                Column({ space: 4 }) {
                  Row({ space: 4 }) {
                    ForEach(this.kegList(), (kg: KegMini) => {
                      Column({ space: 2 }) {
                        Text(kg.x)
                          .fontSize(13)
                          .fontWeight(FontWeight.Bold)
                          .fontColor('#F0D98C')
                        Text('—')
                          .fontSize(8)
                          .fontColor('#6B5F45')
                        Text(kg.s)
                          .fontSize(12)
                          .fontColor('#C4B183')
                      }
                      .layoutWeight(1)
                      .padding({ top: 6, bottom: 6 })
                      .borderRadius(6)
                      .backgroundColor('rgba(233,200,120,0.08)')
                    }, (kg: KegMini) => 'km' + kg.x + kg.s)
                  }
                  .width('100%')
                  Text('四课（上神/下神）· 左右滑切天地盘·三传')
                    .fontSize(9)
                    .fontColor('#6B5F45')
                    .width('100%')
                    .textAlign(TextAlign.Center)
                }
                .width(150)
                /* 页2 迷你三传（随用神动态） */
                Column({ space: 4 }) {
                  Row({ space: 4 }) {
                    ForEach(this.dongtai(), (dt: DongtaiItem) => {
                      Column({ space: 2 }) {
                        Text(dt.gz)
                          .fontSize(13)
                          .fontWeight(FontWeight.Bold)
                          .fontColor('#F0D98C')
                        Text(dt.lq + (dt.jiang !== '' ? '·' + dt.jiang : ''))
                          .fontSize(9)
                          .fontColor('#C4B183')
                      }
                      .layoutWeight(1)
                      .padding({ top: 6, bottom: 6 })
                      .borderRadius(6)
                      .backgroundColor('rgba(233,200,120,0.08)')
                    }, (dt: DongtaiItem) => 'dm' + dt.gz)
                  }
                  .width('100%')
                  Text(this.yongShen !== '' ? '动态三传（以' + this.yongShen + '为初传）' : '三传 · 选用神后动态')
                    .fontSize(9)
                    .fontColor('#6B5F45')
                    .width('100%')
                    .textAlign(TextAlign.Center)
                }
                .width(150)
              }
              .width(150)
              .height(170)
              .indicator(true)
              .loop(false)
              .onChange((idx: number) => {
                /* 切页无需额外逻辑 */
              })"""
    assert s.count(old) == 1, 'swiper: %d' % s.count(old)
    new = """              Swiper() {
                /* 页0 动态三传（默认；随用神） */
                Column({ space: 4 }) {
                  Row({ space: 4 }) {
                    ForEach(this.dongtai(), (dt: DongtaiItem) => {
                      Column({ space: 2 }) {
                        Text(dt.gz)
                          .fontSize(13)
                          .fontWeight(FontWeight.Bold)
                          .fontColor('#F0D98C')
                        Text(dt.lq + (dt.jiang !== '' ? '·' + dt.jiang : ''))
                          .fontSize(9)
                          .fontColor('#C4B183')
                      }
                      .layoutWeight(1)
                      .padding({ top: 6, bottom: 6 })
                      .borderRadius(6)
                      .backgroundColor('rgba(233,200,120,0.08)')
                    }, (dt: DongtaiItem) => 'dm' + dt.gz)
                  }
                  .width('100%')
                  Text(this.yongShen !== '' ? '动态三传（以' + this.yongShen + '为初传）' : '三传 · 选用神后动态')
                    .fontSize(9)
                    .fontColor('#6B5F45')
                    .width('100%')
                    .textAlign(TextAlign.Center)
                }
                .width(150)
                /* 页1 天地盘（点盘换用神） */
                PanDisk({
                  chart: this.chart,
                  yongShen: this.yongShen,
                  cands: this.candZhis(),
                  onPickZhi: (z: string, layer: string) => {
                    this.onPickZhi(z, layer);
                  }
                })
                  .width(150)
                /* 页2 迷你四课（第一课在右，与主盘一致） */
                Column({ space: 4 }) {
                  Row({ space: 4 }) {
                    ForEach(this.kegList(), (kg: KegMini) => {
                      Column({ space: 2 }) {
                        Text(kg.x)
                          .fontSize(13)
                          .fontWeight(FontWeight.Bold)
                          .fontColor('#F0D98C')
                        Text('—')
                          .fontSize(8)
                          .fontColor('#6B5F45')
                        Text(kg.s)
                          .fontSize(12)
                          .fontColor('#C4B183')
                      }
                      .layoutWeight(1)
                      .padding({ top: 6, bottom: 6 })
                      .borderRadius(6)
                      .backgroundColor('rgba(233,200,120,0.08)')
                    }, (kg: KegMini) => 'km' + kg.x + kg.s)
                  }
                  .width('100%')
                  Text('四课（上神/下神）· 左右滑切')
                    .fontSize(9)
                    .fontColor('#6B5F45')
                    .width('100%')
                    .textAlign(TextAlign.Center)
                }
                .width(150)
              }
              .width(150)
              .height(170)
              .indicator(true)
              .loop(false)
              .onChange((idx: number) => {
                /* 切页无需额外逻辑 */
              })"""
    s = s.replace(old, new)

    # ② 删除下方 DongtaiChuan
    old_dt = """          if (this.dongtai().length > 0) {
            DongtaiChuan({ items: this.dongtai() })
          }

"""
    assert s.count(old_dt) == 1, 'dt: %d' % s.count(old_dt)
    s = s.replace(old_dt, "")

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('SHEET SWIPER V2 PATCH OK')

if __name__ == '__main__':
    main()

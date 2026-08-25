/**
 * DongtaiChuan —— 动态三传（以用神为初传，传来递生）
 * 三卡竖排：初传·用神(事起) → 中传(事中) → 末传(事终)；每卡显示 干支/天将/六亲
 */
import type { DongtaiItem } from '../model/YongShenCore';

@Component
export struct DongtaiChuan {
  @Prop items: DongtaiItem[] = [];

  build() {
    Column({ space: 6 }) {
      Row() {
        Text('动态三传')
          .fontSize(11)
          .fontColor('#8A7B5C')
        Blank()
        Text('传来递生 · 随用神而变')
          .fontSize(10)
          .fontColor('#5A4F3D')
      }
      .width('100%')

      ForEach(this.items, (it: DongtaiItem) => {
        Row({ space: 10 }) {
          Column() {
            Text(it.gz)
              .fontSize(17)
              .fontWeight(FontWeight.Bold)
              .fontColor(this.gzColor(it.pos))
          }
          .layoutWeight(1)
          .alignItems(HorizontalAlign.Start)

          Column({ space: 2 }) {
            Text(it.pos)
              .fontSize(10)
              .fontColor('#8A7B5C')
            Text(it.jiang !== '' ? it.jiang + ' · ' + it.lq : it.lq)
              .fontSize(11)
              .fontColor('#B8A97F')
          }
          .layoutWeight(2)
          .alignItems(HorizontalAlign.End)
        }
        .width('100%')
        .padding({ left: 14, right: 14, top: 8, bottom: 8 })
        .borderRadius(12)
        .backgroundColor('#211E18')
        .border({ width: 1, color: this.cardBrd(it.pos) })
      }, (it: DongtaiItem) => it.pos + '|' + it.gz + '|' + it.jiang + '|' + it.lq)
    }
    .width('100%')
  }

  private gzColor(pos: string): string {
    if (pos.indexOf('初传') >= 0) {
      return '#F0D98C';
    }
    if (pos.indexOf('中传') >= 0) {
      return '#C4B183';
    }
    return '#9A8C6E';
  }

  private cardBrd(pos: string): string {
    if (pos.indexOf('初传') >= 0) {
      return 'rgba(233,200,120,0.45)';
    }
    return 'rgba(233,200,120,0.16)';
  }
}

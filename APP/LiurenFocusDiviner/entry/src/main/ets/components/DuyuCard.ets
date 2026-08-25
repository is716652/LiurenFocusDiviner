/**
 * DuyuCard —— 读象断语（管辂神书组合读象 + 管辂象意选句）
 * 收光一句（金色打底）+ 选中断语（歌诀 + 释义 + 命中依据标签）
 */
import type { DuyuPick, DuyuItem } from '../model/YongShenCore';

@Component
export struct DuyuCard {
  @Prop duyu: string[] = [];      /* 管辂神书组合读象（固定 2-3 条） */
  @Prop pick: DuyuPick | null = null; /* 管辂象意选句（收光 + 选中断语） */

  build() {
    Column({ space: 8 }) {
      /* 管辂神书组合读象 */
      if (this.duyu.length > 0) {
        Column({ space: 4 }) {
          Row() {
            Text('读象直断')
              .fontSize(11)
              .fontColor('#8A7B5C')
            Blank()
            Text('管辂神书 · 类神取用')
              .fontSize(10)
              .fontColor('#5A4F3D')
          }
          .width('100%')
          ForEach(this.duyu, (d: string) => {
            Text('· ' + d)
              .fontSize(12)
              .fontColor('#D8C9A3')
              .lineHeight(18)
              .width('100%')
          }, (d: string) => d)
        }
        .width('100%')
        .padding(12)
        .borderRadius(12)
        .backgroundColor('#211E18')
        .border({ width: 1, color: 'rgba(233,200,120,0.18)' })
      }

      /* 管辂象意选句 */
      if (this.pick && this.pick.items.length > 0) {
        Column({ space: 6 }) {
          Text(this.pick.shouGuang)
            .fontSize(12)
            .fontColor('#1A1410')
            .backgroundColor('rgba(240,217,140,0.85)')
            .borderRadius(8)
            .padding({ left: 10, right: 10, top: 6, bottom: 6 })
            .lineHeight(18)
            .width('100%')
          Row() {
            Text('管辂象意直断')
              .fontSize(11)
              .fontColor('#8A7B5C')
            Blank()
            Text('按盘态信号选句')
              .fontSize(10)
              .fontColor('#5A4F3D')
          }
          .width('100%')
          ForEach(this.pick.items, (it: DuyuItem) => {
            Column({ space: 3 }) {
              Row() {
                Text('◎ ' + it.ge)
                  .fontSize(12)
                  .fontColor('#F0D98C')
                  .lineHeight(17)
                  .layoutWeight(1)
                if (it.ev.length > 0) {
                  Text('✓' + it.ev.join('·'))
                    .fontSize(10)
                    .fontColor('#7FA69A')
                    .margin({ left: 6 })
                }
              }
              .width('100%')
              .alignItems(VerticalAlign.Top)
              Text(it.yi)
                .fontSize(11)
                .fontColor('#B8A97F')
                .lineHeight(16)
                .width('100%')
            }
            .width('100%')
          }, (it: DuyuItem) => it.ge + it.yi)
        }
        .width('100%')
        .padding(12)
        .borderRadius(12)
        .backgroundColor('#211E18')
        .border({ width: 1, color: 'rgba(233,200,120,0.18)' })
      }
    }
    .width('100%')
  }
}

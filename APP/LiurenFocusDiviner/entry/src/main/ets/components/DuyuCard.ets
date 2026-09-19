/**
 * DuyuCard —— 古籍断法选句（管辂神书组合读象 + 管辂象意选句）
 * 古籍收光句（金色打底）+ 选中断语（歌诀 + 释义 + 命中依据标签）
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
            Text('古籍断法选句')
              .fontSize($r('app.float.font_body_s'))
              .fontColor($r('app.color.ink_text_secondary'))
            Blank()
            Text('管辂神书 · 类神取用')
              .fontSize($r('app.float.font_caption_l'))
              .fontColor($r('app.color.ink_text_secondary'))
          }
          .width('100%')
          ForEach(this.duyu, (d: string) => {
            Text('· ' + d)
              .fontSize($r('app.float.font_body_m'))
              .fontColor($r('app.color.ink_text_body'))
              .lineHeight(18)
              .width('100%')
          }, (d: string) => d)
        }
        .width('100%')
        .padding(12)
        .borderRadius(12)
        .backgroundColor($r('app.color.ink_surface'))
        .border({ width: 1, color: $r('app.color.overlay_gold_mid') })
      }

      /* 管辂象意选句 */
      if (this.pick && this.pick.items.length > 0) {
        Column({ space: 6 }) {
          Text(this.pick.shouGuang)
            .fontSize($r('app.float.font_body_m'))
            .fontColor($r('app.color.ink_page'))
            .backgroundColor($r('app.color.overlay_gold_solid'))
            .borderRadius(8)
            .padding({ left: 10, right: 10, top: 6, bottom: 6 })
            .lineHeight(18)
            .width('100%')
          Row() {
            Text('管辂象意选句')
              .fontSize($r('app.float.font_body_s'))
              .fontColor($r('app.color.ink_text_secondary'))
            Blank()
            Text('据盘态信号取古籍句')
              .fontSize($r('app.float.font_caption_l'))
              .fontColor($r('app.color.ink_text_secondary'))
          }
          .width('100%')
          ForEach(this.pick.items, (it: DuyuItem) => {
            Column({ space: 3 }) {
              Row() {
                Text('◎ ' + it.ge)
                  .fontSize($r('app.float.font_body_m'))
                  .fontColor($r('app.color.brand_gold_bright'))
                  .lineHeight(17)
                  .layoutWeight(1)
                if (it.ev.length > 0) {
                  Text('✓' + it.ev.join('·'))
                    .fontSize($r('app.float.font_caption_l'))
                    .fontColor($r('app.color.accent_teal_soft'))
                    .margin({ left: 6 })
                }
              }
              .width('100%')
              .alignItems(VerticalAlign.Top)
              Text(it.yi)
                .fontSize($r('app.float.font_body_s'))
                .fontColor($r('app.color.ink_text_source'))
                .lineHeight(16)
                .width('100%')
            }
            .width('100%')
          }, (it: DuyuItem) => it.ge + it.yi)
        }
        .width('100%')
        .padding(12)
        .borderRadius(12)
        .backgroundColor($r('app.color.ink_surface'))
        .border({ width: 1, color: $r('app.color.overlay_gold_mid') })
      }
    }
    .width('100%')
  }
}

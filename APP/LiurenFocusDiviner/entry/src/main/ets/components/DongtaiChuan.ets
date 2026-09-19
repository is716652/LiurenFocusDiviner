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
          .fontSize($r('app.float.font_body_s'))
          .fontColor($r('app.color.ink_text_secondary'))
        Blank()
        Text('传来递生 · 随用神而变')
          .fontSize($r('app.float.font_caption_l'))
          .fontColor($r('app.color.ink_text_secondary'))
      }
      .width('100%')

      ForEach(this.items, (it: DongtaiItem) => {
        Row({ space: 10 }) {
          Column() {
            Text(it.gz)
              .fontSize($r('app.float.font_title_s'))
              .fontWeight(FontWeight.Bold)
              .fontColor(this.gzColor(it.pos))
          }
          .layoutWeight(1)
          .alignItems(HorizontalAlign.Start)

          Column({ space: 2 }) {
            Text(it.pos)
              .fontSize($r('app.float.font_caption_l'))
              .fontColor($r('app.color.ink_text_secondary'))
            Text(it.jiang !== '' ? it.jiang + ' · ' + it.lq : it.lq)
              .fontSize($r('app.float.font_body_s'))
              .fontColor($r('app.color.ink_text_source'))
          }
          .layoutWeight(2)
          .alignItems(HorizontalAlign.End)
        }
        .width('100%')
        .padding({ left: 14, right: 14, top: 8, bottom: 8 })
        .borderRadius(12)
        .backgroundColor($r('app.color.ink_surface'))
        .border({ width: 1, color: this.cardBrd(it.pos) })
      }, (it: DongtaiItem) => it.pos + '|' + it.gz + '|' + it.jiang + '|' + it.lq)
    }
    .width('100%')
  }

  private gzColor(pos: string): ResourceColor {
    if (pos.indexOf('初传') >= 0) {
      return $r('app.color.brand_gold_bright');
    }
    if (pos.indexOf('中传') >= 0) {
      return $r('app.color.ink_text_muted');
    }
    return $r('app.color.ink_text_olive');
  }

  private cardBrd(pos: string): ResourceColor {
    if (pos.indexOf('初传') >= 0) {
      return $r('app.color.overlay_gold_strong');
    }
    return $r('app.color.overlay_gold_weak');
  }
}

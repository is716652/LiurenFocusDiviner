/**
 * AffairChips —— 占事大类横向滚动选择（抓用神第一步）
 * 数据：names（12 大类）+ selected（当前）+ onPick(名称) 回调
 * 选中态金色高亮；下方附 场景提示词（落象方向）与 信息提示（可补信息）
 */
import type { AffairCfg } from '../model/YongShenCore';

@Component
export struct AffairChips {
  @Prop names: string[] = [];
  @Prop selected: string = '';
  @Prop cfg: AffairCfg | null = null;
  onPick: (name: string) => void = () => { };

  build() {
    Column({ space: 8 }) {
      Row() {
        Text('所占之事')
          .fontSize($r('app.float.font_body_s'))
          .fontColor($r('app.color.ink_text_secondary'))
        Blank()
        Text('点击选占事 → 自动抓类神')
          .fontSize($r('app.float.font_caption_l'))
          .fontColor($r('app.color.ink_text_secondary'))
      }
      .width('100%')

      Scroll() {
        Row({ space: 8 }) {
          ForEach(this.names, (n: string) => {
            Text(n)
              .fontSize($r('app.float.fs_caption'))
              .fontWeight(this.selected === n ? FontWeight.Medium : FontWeight.Normal)
              .fontColor(this.selected === n ? $r('app.color.ink_page') : $r('app.color.ink_text_muted'))
              .backgroundColor(this.selected === n ? $r('app.color.accent_gold_fill_bright') : $r('app.color.overlay_olive_weak'))
              .borderRadius(16)
              .padding({ left: 14, right: 14, top: 6, bottom: 6 })
              .onClick(() => {
                this.onPick(n);
              })
          }, (n: string) => n)
        }
        .padding({ left: 2, right: 2, top: 2, bottom: 2 })
      }
      .scrollable(ScrollDirection.Horizontal)
      .scrollBar(BarState.Off)
      .edgeEffect(EdgeEffect.Spring)
      .width('100%')

      if (this.cfg) {
        Column({ space: 4 }) {
          if (this.cfg.scene.length > 0) {
            Text('落象提示：' + this.cfg.scene.join(' · '))
              .fontSize($r('app.float.font_body_s'))
              .fontColor($r('app.color.brand_gold_deep'))
              .lineHeight(16)
              .width('100%')
          }
          if (this.cfg.info !== '') {
            Text(this.cfg.info)
              .fontSize($r('app.float.font_body_s'))
              .fontColor($r('app.color.accent_teal_soft'))
              .lineHeight(16)
              .width('100%')
          }
          if (this.cfg.note !== '') {
            Text('取用：' + this.cfg.note)
              .fontSize($r('app.float.font_body_s'))
              .fontColor($r('app.color.ink_text_source'))
              .lineHeight(16)
              .width('100%')
          }
        }
        .width('100%')
      }
    }
    .width('100%')
  }
}

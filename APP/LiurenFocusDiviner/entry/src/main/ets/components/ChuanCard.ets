/**
 * ChuanCard —— 三传单卡
 * pos=初/中/末；gz=遁干+地支；jiang=天将；lq=六亲；color=主色
 * highlight=true：初传醒目标记（金边框+亮背景+★）
 */
@Component
export struct ChuanCard {
  @Prop pos: string = '';
  @Prop gz: string = '';
  @Prop jiang: string = '';
  @Prop lq: string = '';
  @Prop color: string = '#E9C878';
  @Prop highlight: boolean = false;
  /* 关键标注：如 马/空/鬼；空串不显示 */
  @Prop mark: string = '';

  build() {
    Column({ space: 3 }) {
      Row() {
        Text((this.highlight ? '★ ' : '') + this.pos)
          .fontSize($r('app.float.font_caption_l'))
          .fontColor(this.highlight ? $r('app.color.brand_gold_bright') : $r('app.color.ink_text_secondary'))
          .fontWeight(this.highlight ? FontWeight.Bold : FontWeight.Normal)
          .letterSpacing(1)
          .layoutWeight(1)
        if (this.mark !== '') {
          Text(this.mark)
            .fontSize($r('app.float.font_caption_m'))
            .fontColor($r('app.color.ink_on_deep_text'))
            .backgroundColor($r('app.color.state_warn'))
            .borderRadius(7)
            .padding({ left: 5, right: 5, top: 1, bottom: 1 })
        }
      }
      .width('100%')
      Text(this.gz)
        .fontSize($r('app.float.fs_title'))
        .fontWeight(FontWeight.Bold)
        .fontColor(this.color)
      Text(this.jiang)
        .fontSize($r('app.float.font_body_s'))
        .fontColor($r('app.color.ink_text_muted'))
      Text(this.lq)
        .fontSize($r('app.float.font_body_s'))
        .fontColor($r('app.color.brand_gold_deep'))
    }
    .width('100%')
    .padding({ top: 10, bottom: 10, left: 4, right: 4 })
    .borderRadius(12)
    .backgroundColor(this.highlight ? $r('app.color.overlay_gold_mid') : $r('app.color.ink_surface'))
    .border({ width: this.highlight ? 1.5 : 1, color: this.highlight ? $r('app.color.brand_gold_bright') : $r('app.color.overlay_gold_mid') })
  }
}

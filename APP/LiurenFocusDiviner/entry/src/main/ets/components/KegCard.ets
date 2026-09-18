/**
 * KegCard —— 四课单卡
 * kn=课序；shang=上神（大）；xia=下神（次）；jiang=天将（小）
 * highlight=true：第一课醒目标记（金边框+亮背景+★）
 */
@Component
export struct KegCard {
  @Prop kn: string = '';
  @Prop xia: string = '';
  @Prop shang: string = '';
  @Prop jiang: string = '';
  @Prop highlight: boolean = false;

  build() {
    Column({ space: 3 }) {
      Text((this.highlight ? '★ ' : '') + this.kn)
        .fontSize($r('app.float.font_caption_l'))
        .fontColor(this.highlight ? $r('app.color.brand_gold_bright') : $r('app.color.ink_text_secondary'))
        .fontWeight(this.highlight ? FontWeight.Bold : FontWeight.Normal)
        .letterSpacing(1)
      Text(this.shang)
        .fontSize(30)
        .fontWeight(FontWeight.Bold)
        .fontColor($r('app.color.brand_gold_bright'))
      Text(this.xia)
        .fontSize($r('app.float.splash_sub'))
        .fontColor($r('app.color.ink_text_muted'))
      Divider()
        .color($r('app.color.overlay_gold_weak'))
        .width(24)
        .margin({ top: 2, bottom: 2 })
      Text(this.jiang)
        .fontSize($r('app.float.font_caption_l'))
        .fontColor($r('app.color.brand_gold_deep'))
    }
    .width('100%')
    .padding({ top: 10, bottom: 10, left: 4, right: 4 })
    .borderRadius(12)
    .backgroundColor(this.highlight ? $r('app.color.overlay_gold_mid') : $r('app.color.ink_surface'))
    .border({ width: this.highlight ? 1.5 : 1, color: this.highlight ? $r('app.color.brand_gold_bright') : $r('app.color.overlay_gold_mid') })
  }
}

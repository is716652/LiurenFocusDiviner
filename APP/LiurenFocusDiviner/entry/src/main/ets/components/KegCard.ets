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
        .fontSize(10)
        .fontColor(this.highlight ? '#F0D98C' : '#8A7B5C')
        .fontWeight(this.highlight ? FontWeight.Bold : FontWeight.Normal)
        .letterSpacing(1)
      Text(this.shang)
        .fontSize(30)
        .fontWeight(FontWeight.Bold)
        .fontColor('#F0D98C')
      Text(this.xia)
        .fontSize(15)
        .fontColor('#C4B183')
      Divider()
        .color('rgba(233,200,120,0.15)')
        .width(24)
        .margin({ top: 2, bottom: 2 })
      Text(this.jiang)
        .fontSize(10)
        .fontColor('#A8843C')
    }
    .width('100%')
    .padding({ top: 10, bottom: 10, left: 4, right: 4 })
    .borderRadius(12)
    .backgroundColor(this.highlight ? 'rgba(240,217,140,0.16)' : '#211E18')
    .border({ width: this.highlight ? 1.5 : 1, color: this.highlight ? '#F0D98C' : 'rgba(233,200,120,0.18)' })
  }
}

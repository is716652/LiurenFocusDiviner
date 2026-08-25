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

  build() {
    Column({ space: 3 }) {
      Text((this.highlight ? '★ ' : '') + this.pos)
        .fontSize(10)
        .fontColor(this.highlight ? '#F0D98C' : '#8A7B5C')
        .fontWeight(this.highlight ? FontWeight.Bold : FontWeight.Normal)
        .letterSpacing(1)
      Text(this.gz)
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
        .fontColor(this.color)
      Text(this.jiang)
        .fontSize(11)
        .fontColor('#C4B183')
      Text(this.lq)
        .fontSize(11)
        .fontColor('#A8843C')
    }
    .width('100%')
    .padding({ top: 10, bottom: 10, left: 4, right: 4 })
    .borderRadius(12)
    .backgroundColor(this.highlight ? 'rgba(240,217,140,0.16)' : '#211E18')
    .border({ width: this.highlight ? 1.5 : 1, color: this.highlight ? '#F0D98C' : 'rgba(233,200,120,0.18)' })
  }
}

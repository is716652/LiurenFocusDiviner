/**
 * InfoRow —— 一行信息（盘态/神煞明细用）
 * tone: 'gold' | 'cinnabar' | 'plain'
 */
@Component
export struct InfoRow {
  @Prop label: string = '';
  @Prop value: string = '';
  @Prop tone: string = 'plain';

  build() {
    Row() {
      Text(this.label)
        .fontSize(12)
        .fontColor('#8A7B5C')
      Blank()
      Text(this.value)
        .fontSize(13)
        .fontWeight(FontWeight.Medium)
        .fontColor(this.valueColor())
        .textAlign(TextAlign.End)
    }
    .width('100%')
    .padding({ top: 7, bottom: 7, left: 2, right: 2 })
  }

  private valueColor(): string {
    if (this.tone === 'gold') {
      return '#F0D98C';
    }
    if (this.tone === 'cinnabar') {
      return '#E8A483';
    }
    return '#C4B183';
  }
}

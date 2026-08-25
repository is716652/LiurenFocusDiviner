/**
 * TagBadge —— 圆角小标签（神煞/格局标签）
 * tone: 'gold' | 'cinnabar' | 'plain'
 */
@Component
export struct TagBadge {
  @Prop text: string = '';
  @Prop tone: string = 'plain';

  build() {
    Text(this.text)
      .fontSize(11)
      .fontColor(this.txtColor())
      .backgroundColor(this.bgColor())
      .border({ width: 1, color: this.brdColor() })
      .borderRadius(8)
      .padding({ left: 8, right: 8, top: 3, bottom: 3 })
  }

  private txtColor(): string {
    if (this.tone === 'gold') {
      return '#F0D98C';
    }
    if (this.tone === 'cinnabar') {
      return '#E8A483';
    }
    return '#B8A97F';
  }

  private bgColor(): string {
    if (this.tone === 'gold') {
      return 'rgba(233,200,120,0.14)';
    }
    if (this.tone === 'cinnabar') {
      return 'rgba(208,112,74,0.14)';
    }
    return 'rgba(138,123,92,0.10)';
  }

  private brdColor(): string {
    if (this.tone === 'gold') {
      return 'rgba(233,200,120,0.45)';
    }
    if (this.tone === 'cinnabar') {
      return 'rgba(208,112,74,0.45)';
    }
    return 'rgba(138,123,92,0.30)';
  }
}

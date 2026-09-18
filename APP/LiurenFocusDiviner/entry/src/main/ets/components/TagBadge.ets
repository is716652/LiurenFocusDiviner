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
      .fontSize($r('app.float.font_body_s'))
      .fontColor(this.txtColor())
      .backgroundColor(this.bgColor())
      .border({ width: 1, color: this.brdColor() })
      .borderRadius(8)
      .padding({ left: 8, right: 8, top: 3, bottom: 3 })
  }

  private txtColor(): ResourceColor {
    if (this.tone === 'gold') {
      return $r('app.color.brand_gold_bright');
    }
    if (this.tone === 'cinnabar') {
      return $r('app.color.pan_kong');
    }
    return $r('app.color.ink_text_source');
  }

  private bgColor(): ResourceColor {
    if (this.tone === 'gold') {
      return $r('app.color.overlay_gold_weak');
    }
    if (this.tone === 'cinnabar') {
      return $r('app.color.overlay_cinnabar_weak');
    }
    return $r('app.color.overlay_olive_weak');
  }

  private brdColor(): ResourceColor {
    if (this.tone === 'gold') {
      return $r('app.color.overlay_gold_strong');
    }
    if (this.tone === 'cinnabar') {
      return $r('app.color.overlay_cinnabar_strong');
    }
    return $r('app.color.overlay_olive_mid');
  }
}

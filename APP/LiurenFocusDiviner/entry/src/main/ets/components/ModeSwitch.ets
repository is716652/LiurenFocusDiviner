/**
 * ModeSwitch —— 页面模式切换组（排盘 / 课例 / 古籍）
 * ----------------------------------------------------------------------------
 * 嵌于各页头右侧（页头不随内容滚动，等效常驻右上）；替代底部页签栏，
 * 规避底部导航条遮挡问题。当前项金色实底，其余暗色描边。
 * ArkTS 合规：零 any / unknown；显式类型；回调显式签名
 */
@Component
export struct ModeSwitch {
  @Prop active: number = 0;
  onSwitch: (idx: number) => void = () => { };

  private names: string[] = ['排盘', '课例', '古籍'];

  build() {
    Row({ space: 6 }) {
      ForEach(this.names, (n: string, i: number) => {
        Text(n)
          .fontSize($r('app.float.font_body_s'))
          .fontWeight(this.active === i ? FontWeight.Medium : FontWeight.Normal)
          .fontColor(this.active === i ? $r('app.color.ink_page') : $r('app.color.ink_text_muted'))
          .backgroundColor(this.active === i ? $r('app.color.brand_gold') : 'rgba(138,123,92,0.14)')
          .borderRadius(11)
          .padding({ left: 11, right: 11, top: 4, bottom: 4 })
          .onClick(() => {
            this.onSwitch(i);
          })
      }, (n: string) => 'ms' + n)
    }
  }
}

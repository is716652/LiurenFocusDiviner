/**
 * RuleHealthBadge —— 规则数据健康徽标（Agent.md §14.3）
 * ----------------------------------------------------------------------------
 * 正常：`规则数据：已加载 14/14 表 ✓`；缺表：黄色 `… 11/14 表 ⚠` + 「查看缺表 ›」。
 * 摘要与状态由宿主（Home.ets）从 model/RuleHealth.ets 取，组件本身无隐式状态。
 * ArkTS 合规：零 any / unknown；显式类型与回调签名。
 */
@Component
export struct RuleHealthBadge {
  @Prop summary: string = '';
  @Prop hasProblem: boolean = false;
  onTap: () => void = () => { };

  build() {
    Row({ space: 6 }) {
      Text(this.summary)
        .fontSize($r('app.float.font_body_s'))
        .fontColor(this.hasProblem ? '#E8C46A' : '#8FA88C')
        .layoutWeight(1)
      if (this.hasProblem) {
        Text('查看缺表 ›')
          .fontSize($r('app.float.font_body_s'))
          .fontColor($r('app.color.brand_gold_deep'))
      }
      Blank()
      Text('数据自检')
        .fontSize($r('app.float.font_body_s'))
        .fontColor($r('app.color.ink_text_secondary'))
    }
    .width('100%')
    .padding({ left: 10, right: 10, top: 7, bottom: 7 })
    .borderRadius(10)
    .backgroundColor(this.hasProblem ? $r('app.color.overlay_gold_weak') : $r('app.color.overlay_teal_weak'))
    .border({ width: 1, color: this.hasProblem ? $r('app.color.overlay_gold_strong') : $r('app.color.overlay_teal_strong') })
    .onClick(() => {
      this.onTap();
    })
  }
}

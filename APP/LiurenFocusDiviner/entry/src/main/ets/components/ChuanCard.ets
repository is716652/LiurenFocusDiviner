/**
 * ChuanCard —— 三传单卡
 * pos=初/中/末；gz=遁干+地支；jiang=天将；lq=六亲；color=主色
 * 四张三传卡**外观统一**（2026-09-18 去掉初传的"金边框+亮背景+★"特殊标记：
 * 用户反馈已无必要，且金色淡底会把凶将朱砂文字的对比度压到 3.1:1 导致干支看不清）。
 * color=干支主色（资源令牌：吉=brand_gold / 凶=brand_cinnabar）
 */
@Component
export struct ChuanCard {
  @Prop pos: string = '';
  @Prop gz: string = '';
  @Prop jiang: string = '';
  @Prop lq: string = '';
  @Prop color: ResourceColor = $r('app.color.brand_gold');
  /* 关键标注：如 马/空/鬼；空串不显示 */
  @Prop mark: string = '';
  /* 交互高亮：案卷页点用神时高亮对应传（不再换底色，只加粗标题与边框） */
  @Prop highlight: boolean = false;
  /* 点击回调（**可选**）：剧情演绎里点三传 = 取象；不传则无副作用（排盘页/旧鉴赏页照旧）。
     注意**不能加 private** —— ArkUI 会静默忽略从构造函数传入的 private 成员。 */
  onTap: () => void = () => { };

  build() {
    Column({ space: 3 }) {
      Row() {
        Text(this.pos)
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
    .backgroundColor($r('app.color.ink_surface'))
    .border({ width: this.highlight ? 1.5 : 1, color: this.highlight ? $r('app.color.brand_gold_bright') : $r('app.color.overlay_gold_mid') })
    .onClick(() => {
      this.onTap();
    })
  }
}

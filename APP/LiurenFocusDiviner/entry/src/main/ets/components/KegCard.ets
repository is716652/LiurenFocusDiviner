/**
 * KegCard —— 四课单卡
 * kn=课序；shang=上神；xia=下神；jiang=天将（小）
 * **上神与下神等大、等重**（2026-09-26 用户反馈）：原为 shang=30（硬编码）、xia=splash_sub(15)，
 * 相差一倍，看上去"上神是主要的、下神是次要的"—— 四课的上下神是同一课的两端，不该有主次。
 * 现两者同用 fs_title（24fp，与三传干支同字号）、字重同为 Bold，只以**颜色**别天地：
 * 金 = 上神（天盘），铜绿 = 下神（与 Web 原型 `.keg .xia` 同色）。
 * 四张课卡**外观统一**（2026-09-18 去掉第一课的特殊标记，理由同 ChuanCard）
 */
@Component
export struct KegCard {
  @Prop kn: string = '';
  @Prop xia: string = '';
  @Prop shang: string = '';
  @Prop jiang: string = '';
  /* 交互高亮：案卷页点用神时高亮对应课（2026-09-18 起不再换底色）——
     原先的「金色淡底」会把凶将朱砂文字压到 3.1:1，只保留标题加粗与加粗金边这两个提示。 */
  @Prop highlight: boolean = false;
  /* 点击回调（**可选**）：剧情演绎里点四课 = 取象；不传则无副作用（排盘页/旧鉴赏页照旧）。
     注意**不能加 private** —— ArkUI 会静默忽略从构造函数传入的 private 成员。 */
  onTap: () => void = () => { };

  build() {
    Column({ space: 3 }) {
      Text(this.kn)
        .fontSize($r('app.float.font_caption_l'))
        .fontColor(this.highlight ? $r('app.color.brand_gold_bright') : $r('app.color.ink_text_secondary'))
        .fontWeight(this.highlight ? FontWeight.Bold : FontWeight.Normal)
        .letterSpacing(1)
      Text(this.shang)
        .fontSize($r('app.float.fs_title'))
        .fontWeight(FontWeight.Bold)
        .fontColor($r('app.color.brand_gold_bright'))
      Text(this.xia)
        .fontSize($r('app.float.fs_title'))
        .fontWeight(FontWeight.Bold)
        .fontColor($r('app.color.brand_verdigris'))
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
    .backgroundColor($r('app.color.ink_surface'))
    .border({ width: this.highlight ? 1.5 : 1, color: this.highlight ? $r('app.color.brand_gold_bright') : $r('app.color.overlay_gold_mid') })
    .onClick(() => {
      this.onTap();
    })
  }
}

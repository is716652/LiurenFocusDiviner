/**
 * ChuanCard —— 三传的**古法一行**（2026-09-26 用户要求：三传要按古法排）
 *
 * 古法三传自下而上读：**初传在下、末传在上**，每行自左至右
 *   六亲 ｜ 神煞 ｜ 天干 ｜ 地支 ｜ 传位
 * （原为三张卡**横排**「初传·中传·末传」，且是正序 —— 与四课「倒序渲染 右起第一课」
 * 的口径也不一致。现由调用方按 **[末,中,初]** 倒序渲染这三行。）
 *
 * 天将**不入列**：它是地支的「乘将」，作地支列下的小字（如「巳／玄武」）。
 * pos=传位；gz=遁干+地支（"甲子"）或纯地支（"戌" —— 旬空之传本旬无干，gz 只此一字）；
 * lq=六亲；mark=神煞标记（空/马…，可为空）；color=干支主色（吉=brand_gold / 凶=brand_cinnabar）。
 * highlight：案卷页点用神时高亮对应传（只加粗传位名与边框，不换底色 —— 理由同 KegCard）。
 */
@Component
export struct ChuanCard {
  @Prop pos: string = '';
  @Prop gz: string = '';
  @Prop jiang: string = '';
  @Prop lq: string = '';
  /* 神煞标记：如 马/空/鬼；空串不显示（古法这一列本就不是每传都有） */
  @Prop mark: string = '';
  @Prop color: ResourceColor = $r('app.color.brand_gold');
  @Prop highlight: boolean = false;
  /* 点击回调（**可选**）：剧情演绎里点三传 = 取象；不传则无副作用（排盘页/旧鉴赏页照旧）。
     注意**不能加 private** —— ArkUI 会静默忽略从构造函数传入的 private 成员。 */
  onTap: () => void = () => { };

  /* gz 的**末字恒为地支**（旬空之传无遁干，gz 只这一字），其前若有字即为天干 */
  private zhiOf(): string {
    const s: string = this.gz ? this.gz : '';
    return s.length === 0 ? '' : s.charAt(s.length - 1);
  }

  private ganOf(): string {
    const s: string = this.gz ? this.gz : '';
    return s.length <= 1 ? '' : s.substring(0, s.length - 1);
  }

  build() {
    Row({ space: 6 }) {
      /* 六亲 */
      Text(this.lq)
        .fontSize($r('app.float.font_subtitle_s'))
        .fontColor($r('app.color.brand_gold_deep'))
        .width(48)
        .textAlign(TextAlign.Center)
      /* 神煞 */
      Text(this.mark)
        .fontSize($r('app.float.font_caption_m'))
        .fontColor($r('app.color.ink_on_deep_text'))
        .backgroundColor($r('app.color.state_warn'))
        .borderRadius(7)
        .padding({ left: 5, right: 5, top: 1, bottom: 1 })
        .width(38)
        .textAlign(TextAlign.Center)
      /* 天干（遁干） */
      Text(this.ganOf())
        .fontSize($r('app.float.font_title_s'))
        .fontColor($r('app.color.ink_text_secondary'))
        .width(26)
        .textAlign(TextAlign.Center)
      /* 地支 —— 这一行的主角；乘将作它的小字 */
      Column({ space: 0 }) {
        Text(this.zhiOf())
          .fontSize($r('app.float.fs_title'))
          .fontWeight(FontWeight.Bold)
          .fontColor(this.color)
        Text(this.jiang)
          .fontSize($r('app.float.font_caption_m'))
          .fontColor($r('app.color.brand_gold_deep'))
      }
      .width(64)
      .alignItems(HorizontalAlign.Center)
      /* 传位 */
      Text(this.pos)
        .fontSize($r('app.float.font_caption_l'))
        .fontColor(this.highlight ? $r('app.color.brand_gold_bright') : $r('app.color.ink_text_secondary'))
        .fontWeight(this.highlight ? FontWeight.Bold : FontWeight.Normal)
        .letterSpacing(1)
        .width(44)
        .textAlign(TextAlign.Center)
    }
    .width('100%')
    .alignItems(VerticalAlign.Center)
    /* 各列固定宽 + 整行居中：古法这一行是**表格**，不撑满也不让某一列吃掉空档 */
    .justifyContent(FlexAlign.Center)
    .padding({ top: 6, bottom: 6, left: 8, right: 8 })
    .borderRadius(10)
    .backgroundColor($r('app.color.ink_surface'))
    .border({ width: this.highlight ? 1.5 : 1, color: this.highlight ? $r('app.color.brand_gold_bright') : $r('app.color.overlay_gold_mid') })
    .onClick(() => {
      this.onTap();
    })
  }
}

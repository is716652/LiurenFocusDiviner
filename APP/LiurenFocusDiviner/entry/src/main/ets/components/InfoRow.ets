/**
 * InfoRow —— 一行信息（盘态/神煞明细用）
 * tone: 'gold' | 'cinnabar' | 'plain'
 * stack: false（默认）= 标签左、值右，一行（短线值用，如「旬空 / 无」）
 *        true          = 标签在上、值在下，**左对齐**（长文案用，如毕法展开的五层）
 *
 * 排版纪律（2026-09-12 修「毕法展开文字溢出右边界且不左对齐」）：
 *   ① 值文本必须有宽度约束 —— 旧写法是 `Text(label) + Blank() + Text(value)`，
 *      value 既无 width 也无 layoutWeight，长文案会顶出父容器右边界（超出屏幕）。
 *      现改为 value 用 `layoutWeight(1)` 占满剩余宽度，长文案在容器内换行。
 *   ② 长文案不用「标签左值右」——右对齐 + 单行挤压正是用户报的现象；
 *      用 `stack: true` 改成上下两行左对齐，读起来才是正常段落。
 *   ③ 容器 Column 显式 `alignItems(HorizontalAlign.Start)` —— ArkUI 的 Column
 *      默认是居中对齐，靠默认值会出现"看着没左对齐"的问题。
 */
@Component
export struct InfoRow {
  @Prop label: string = '';
  @Prop value: string = '';
  @Prop tone: string = 'plain';
  @Prop stack: boolean = false;

  build() {
    if (this.stack) {
      Column({ space: 2 }) {
        Text(this.label)
          .fontSize(11)
          .fontColor('#A8986E')
          .width('100%')
          .textAlign(TextAlign.Start)
        Text(this.value)
          .fontSize(13)
          .fontWeight(FontWeight.Medium)
          .fontColor(this.valueColor())
          .lineHeight(19)
          .width('100%')
          .textAlign(TextAlign.Start)
      }
      .width('100%')
      .alignItems(HorizontalAlign.Start)
      .padding({ top: 5, bottom: 5, left: 2, right: 2 })
    } else {
      Row() {
        Text(this.label)
          .fontSize(12)
          .fontColor('#A8986E')
          .flexShrink(0)
        Text(this.value)
          .fontSize(13)
          .fontWeight(FontWeight.Medium)
          .fontColor(this.valueColor())
          .layoutWeight(1)
          .textAlign(TextAlign.End)
      }
      .width('100%')
      .padding({ top: 7, bottom: 7, left: 2, right: 2 })
    }
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

/**
 * PageHeader —— 三页统一页头组件（标题 + ModeSwitch 胶囊 + 可选改期）
 * ----------------------------------------------------------------------------
 * 作为独立组件嵌入各页根 Column：组件是独立渲染单元，
 * 规避"根布局直接子级 Row/Text 渲染异常"的问题。
 * ArkTS 合规：零 any / unknown；显式类型
 */
import { ModeSwitch } from './ModeSwitch';

@Component
export struct PageHeader {
  @Prop title: string = '';
  @Prop active: number = 0;
  @Prop showBack: boolean = false;   /* 显示"‹ 返回"（改期/返回上级） */
  backText: string = '‹ 返回';        /* 返回按钮文案 */
  onBack: () => void = () => { };     /* 返回/改期回调 */
  onSwitch: (idx: number) => void = () => { };

  build() {
    Column({ space: 8 }) {
      /* 标题 */
      Text(this.title)
        .fontSize(18)
        .fontWeight(FontWeight.Bold)
        .fontColor('#E9C878')
        .letterSpacing(2)
        .width('100%')
        .textAlign(TextAlign.Start)
        .padding({ left: 16, top: 14 })

      /* 胶囊行 */
      Row() {
        ModeSwitch({
          active: this.active,
          onSwitch: (i: number) => {
            this.onSwitch(i);
          }
        })
        Blank()
        if (this.showBack) {
          Text(this.backText)
            .fontSize(12)
            .fontColor('#C4B183')
            .padding({ left: 12, right: 12, top: 4, bottom: 4 })
            .borderRadius(9)
            .backgroundColor('#211E18')
            .onClick(() => {
              this.onBack();
            })
        }
      }
      .width('100%')
      .padding({ left: 16, right: 16 })

      Divider()
        .color('rgba(233,200,120,0.2)')
        .width('100%')
    }
    .width('100%')
  }
}

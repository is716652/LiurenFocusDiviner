/**
 * SlotEmpty —— 空态「说话」组件（Agent.md §14.2）
 * ----------------------------------------------------------------------------
 * 三种空必须区分：① 确实无（none）/ ② 规则表未加载或缺内容（missing，警示色）/ ③ 未填未开（unset）。
 * 文案统一取自 model/ReasonText.ets 的登记表；本组件只负责排版与入口回调。
 * 纪律：不留白、不给现实结论、缺表提示不出现数据文件名。
 * ArkTS 合规：零 any / unknown；显式类型与回调签名。
 */
import { ReasonText, SlotReason } from '../model/ReasonText';

@Component
export struct SlotEmpty {
  @Prop slot: string = '';
  @Prop kind: string = 'none';
  onEntry: () => void = () => { };

  build() {
    Column({ space: 6 }) {
      Text(ReasonText.of(this.slot, this.kind).text)
        .fontSize(11)
        .fontColor(this.toneColor())
        .lineHeight(16)
        .width('100%')
        .textAlign(TextAlign.Start)
      if (this.entryLabel() !== '') {
        Text(this.entryLabel() + ' ›')
          .fontSize(11)
          .fontColor('#C4A25C')
          .padding({ top: 1, bottom: 1 })
          .onClick(() => {
            this.onEntry();
          })
      }
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
    .padding({ top: 4, bottom: 4, left: 2, right: 2 })
  }

  private reason(): SlotReason {
    return ReasonText.of(this.slot, this.kind);
  }

  private toneColor(): string {
    return this.reason().warn ? '#E8A483' : '#A8986E';
  }

  private entryLabel(): string {
    return this.reason().entry;
  }
}

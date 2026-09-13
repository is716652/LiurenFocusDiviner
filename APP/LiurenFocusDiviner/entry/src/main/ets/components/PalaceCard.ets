/**
 * PalaceCard —— 点宫速查卡（Agent.md §14.4）
 * ----------------------------------------------------------------------------
 * 内容由 model/ReadXiang.ets 装配（顺序：远景 → 中景 → 近景 → 气机点 → 收梢），
 * 本组件只负责排版：行首小标题 + 正文 + 可选「原文」行（原文与我方陈述分开显示）。
 * 纪律：只呈现盘上关系与原文引用；缺表时由 ReadXiang 给出「未加载」说明，不留白。
 * 排版纪律（§9 排版门禁）：所有长文本都给 width('100%')，不用 Blank 抢宽度。
 */
import { ReadXiangRow } from '../model/ReadXiang';

@Component
export struct PalaceCard {
  @Prop title: string = '';
  @Prop rows: ReadXiangRow[] = [];
  onClose: () => void = () => { };

  build() {
    Column({ space: 6 }) {
      Row({ space: 8 }) {
        Text(this.title)
          .fontSize(13)
          .fontWeight(FontWeight.Medium)
          .fontColor('#F0E6C8')
          .layoutWeight(1)
        Text('收起')
          .fontSize(11)
          .fontColor('#C4A25C')
          .onClick(() => {
            this.onClose();
          })
      }
      .width('100%')

      ForEach(this.rows, (r: ReadXiangRow) => {
        Column({ space: 2 }) {
          if (r.text !== '') {
            Row({ space: 6 }) {
              Text(r.label)
                .fontSize(10)
                .fontColor('#A8986E')
                .flexShrink(0)
              Text(r.text)
                .fontSize(11)
                .lineHeight(17)
                .fontColor(this.toneOf(r.tone))
                .layoutWeight(1)
            }
            .width('100%')
          }
          if (r.source !== '') {
            Row({ space: 6 }) {
              Text('原文')
                .fontSize(9)
                .fontColor('#8A7B5C')
                .backgroundColor('rgba(233,200,120,0.10)')
                .borderRadius(6)
                .padding({ left: 5, right: 5, top: 1, bottom: 1 })
                .flexShrink(0)
              Text(r.source)
                .fontSize(10)
                .lineHeight(16)
                .fontColor('#B8A97F')
                .layoutWeight(1)
            }
            .width('100%')
          }
        }
        .width('100%')
        .alignItems(HorizontalAlign.Start)
      }, (r: ReadXiangRow, i: number) => 'pc' + i + r.label)

      Text('说明：本卡只陈述盘上关系（宫 · 冲合刑害 · 空亡 · 乘将 · 气机点），不作现实判断；「原文」行引自本项目的读象规则文档。')
        .fontSize(9)
        .lineHeight(14)
        .fontColor('#A8986E')
        .width('100%')
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
    .padding(12)
    .borderRadius(12)
    .backgroundColor('#1C1A16')
    .border({ width: 1, color: 'rgba(233,200,120,0.18)' })
  }

  private toneOf(tone: string): string {
    if (tone === 'gold') {
      return '#F0D98C';
    }
    if (tone === 'warn') {
      return '#E8C46A';
    }
    return '#C4B183';
  }
}

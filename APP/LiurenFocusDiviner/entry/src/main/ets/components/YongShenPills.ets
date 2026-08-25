/**
 * YongShenPills —— 用神候选标签（点击切换用神）
 * 候选：{zhi, type, jiang}；当前用神金色实底，天将类神朱砂描边，其余金描边
 */
import type { YongShenCand } from '../model/YongShenCore';

@Component
export struct YongShenPills {
  @Prop cands: YongShenCand[] = [];
  @Prop selected: string = '';
  onPick: (zhi: string) => void = () => { };

  build() {
    Column({ space: 6 }) {
      Row() {
        Text('类神候选')
          .fontSize(11)
          .fontColor('#8A7B5C')
        Blank()
        Text('金色=当前 · 朱砂=天将类神')
          .fontSize(10)
          .fontColor('#5A4F3D')
      }
      .width('100%')

      Flex({ wrap: FlexWrap.Wrap }) {
        ForEach(this.cands, (c: YongShenCand) => {
          Text(this.labelOf(c))
            .fontSize(13)
            .fontWeight(this.selected === c.zhi ? FontWeight.Bold : FontWeight.Normal)
            .fontColor(this.fontColorOf(c))
            .backgroundColor(this.bgOf(c))
            .border({ width: 1, color: this.brdOf(c) })
            .borderRadius(14)
            .padding({ left: 12, right: 12, top: 5, bottom: 5 })
            .margin({ right: 6, bottom: 6 })
            .onClick(() => {
              this.onPick(c.zhi);
            })
        }, (c: YongShenCand) => c.zhi + c.type)
      }
      .width('100%')
    }
    .width('100%')
  }

  /* "子宫 · 青龙"（天将类神标注乘将） */
  private labelOf(c: YongShenCand): string {
    if (c.type === '将') {
      return c.zhi + '宫 · ' + c.jiang;
    }
    if (c.jiang !== '') {
      return c.zhi + '宫 · ' + c.jiang;
    }
    return c.zhi + '宫';
  }

  private fontColorOf(c: YongShenCand): string {
    if (this.selected === c.zhi) {
      return '#1A1410';
    }
    if (c.type === '将') {
      return '#E8A483';
    }
    return '#F0D98C';
  }

  private bgOf(c: YongShenCand): string {
    if (this.selected === c.zhi) {
      return '#F0D98C';
    }
    if (c.type === '将') {
      return 'rgba(208,112,74,0.16)';
    }
    return 'rgba(233,200,120,0.10)';
  }

  private brdOf(c: YongShenCand): string {
    if (this.selected === c.zhi) {
      return '#F0D98C';
    }
    if (c.type === '将') {
      return 'rgba(208,112,74,0.55)';
    }
    return 'rgba(233,200,120,0.40)';
  }
}

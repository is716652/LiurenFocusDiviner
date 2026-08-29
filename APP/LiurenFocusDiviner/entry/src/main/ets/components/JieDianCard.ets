/**
 * JieDianCard —— 用神节点卡：类象词云 + 起爆要素（古籍术语）+ 所带神煞
 * 词云项可点击锚定（选中金色实底，再次点击取消）
 */
import type { JieDianWord } from '../model/YongShenCore';

@Component
export struct JieDianCard {
  @Prop head: string = '';        /* 用神节点 甲子 · 妻财 · 乘青龙 · 旺 无空 */
  @Prop words: JieDianWord[] = [];
  @Prop boom: string[] = [];      /* 起爆要素：落空/被冲/合/害/刑/与日干 */
  @Prop shensha: string = '';     /* 所带神煞 */
  @Prop anchor: string = '';      /* 当前锚定的词云值 */
  onAnchor: (v: string) => void = () => { };

  build() {
    Column({ space: 6 }) {
      Row() {
        Text('用神节点')
          .fontSize(11)
          .fontColor('#8A7B5C')
        Blank()
        Text(this.head)
          .fontSize(12)
          .fontWeight(FontWeight.Medium)
          .fontColor('#F0D98C')
      }
      .width('100%')

      Flex({ wrap: FlexWrap.Wrap }) {
        ForEach(this.words, (w: JieDianWord) => {
          Text(this.chipText(w))
            .fontSize(11)
            .fontColor(this.anchor === w.v ? '#1A1410' : '#C4B183')
            .backgroundColor(this.anchor === w.v ? '#F0D98C' : 'rgba(233,200,120,0.10)')
            .border({ width: 1, color: this.anchor === w.v ? '#F0D98C' : 'rgba(233,200,120,0.30)' })
            .borderRadius(10)
            .padding({ left: 8, right: 8, top: 3, bottom: 3 })
            .margin({ right: 6, bottom: 6 })
            .onClick(() => {
              this.onAnchor(w.v);
            })
        }, (w: JieDianWord) => w.k + w.v)
      }
      .width('100%')

      if (this.boom.length > 0 || this.shensha !== '') {
        Column({ space: 2 }) {
          if (this.boom.length > 0) {
            Text('起爆要素（古籍术语）：' + this.boom.join(' · '))
              .fontSize(11)
              .fontColor('#E8A483')
              .lineHeight(16)
              .width('100%')
          }
          if (this.shensha !== '') {
            Text('所带神煞：' + this.shensha)
              .fontSize(11)
              .fontColor('#B8A97F')
              .lineHeight(16)
              .width('100%')
          }
        }
        .width('100%')
        .padding({ top: 4 })
        .border({ width: { top: 1 }, color: 'rgba(233,200,120,0.15)' })
      }
    }
    .width('100%')
    .padding(12)
    .borderRadius(12)
    .backgroundColor('#211E18')
    .border({ width: 1, color: 'rgba(233,200,120,0.18)' })
  }

  /* 词云标签：显示 k 的短名（去掉"将·"/"纳音·"前缀），值截断 14 字 */
  private chipText(w: JieDianWord): string {
    const short = w.k.split('·').pop() || w.k;
    const v = w.v.length > 14 ? w.v.substring(0, 14) + '…' : w.v;
    return short + '：' + v;
  }
}

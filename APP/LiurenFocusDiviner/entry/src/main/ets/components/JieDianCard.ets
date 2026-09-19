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
          .fontSize($r('app.float.font_body_s'))
          .fontColor($r('app.color.ink_text_secondary'))
        Blank()
        Text(this.head)
          .fontSize($r('app.float.font_body_m'))
          .fontWeight(FontWeight.Medium)
          .fontColor($r('app.color.brand_gold_bright'))
          .layoutWeight(1)
          .textAlign(TextAlign.End)
      }
      .width('100%')

      Flex({ wrap: FlexWrap.Wrap }) {
        ForEach(this.words, (w: JieDianWord) => {
          Text(this.chipText(w))
            .fontSize($r('app.float.font_body_s'))
            .fontColor(this.anchor === w.v ? $r('app.color.ink_page') : $r('app.color.ink_text_muted'))
            .backgroundColor(this.anchor === w.v ? $r('app.color.accent_gold_fill_bright') : $r('app.color.pan_sel_bg'))
            .border({ width: 1, color: this.anchor === w.v ? $r('app.color.brand_gold_bright') : $r('app.color.overlay_gold_strong') })
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
              .fontSize($r('app.float.font_body_s'))
              .fontColor($r('app.color.state_warn_text'))
              .lineHeight(16)
              .width('100%')
          }
          if (this.shensha !== '') {
            Text('所带神煞：' + this.shensha)
              .fontSize($r('app.float.font_body_s'))
              .fontColor($r('app.color.ink_text_source'))
              .lineHeight(16)
              .width('100%')
          }
        }
        .width('100%')
        .padding({ top: 4 })
        .border({ width: { top: 1 }, color: $r('app.color.overlay_gold_weak') })
      }
    }
    .width('100%')
    .padding(12)
    .borderRadius(12)
    .backgroundColor($r('app.color.ink_surface'))
    .border({ width: 1, color: $r('app.color.overlay_gold_mid') })
  }

  /* 词云标签：显示 k 的短名（去掉"将·"/"纳音·"前缀），值截断 14 字 */
  private chipText(w: JieDianWord): string {
    const short = w.k.split('·').pop() || w.k;
    const v = w.v.length > 14 ? w.v.substring(0, 14) + '…' : w.v;
    return short + '：' + v;
  }
}

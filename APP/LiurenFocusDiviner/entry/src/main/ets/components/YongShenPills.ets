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
          .fontSize($r('app.float.font_body_s'))
          .fontColor($r('app.color.ink_text_secondary'))
        Blank()
        Text('金色=当前 · 朱砂=天将类神')
          .fontSize($r('app.float.font_caption_l'))
          .fontColor($r('app.color.ink_text_secondary'))
      }
      .width('100%')

      Flex({ wrap: FlexWrap.Wrap }) {
        ForEach(this.cands, (c: YongShenCand) => {
          Text(this.labelOf(c))
            .fontSize($r('app.float.fs_caption'))
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

  private fontColorOf(c: YongShenCand): ResourceColor {
    if (this.selected === c.zhi) {
      return $r('app.color.ink_page');
    }
    if (c.type === '将') {
      return $r('app.color.pan_kong');
    }
    return $r('app.color.brand_gold_bright');
  }

  private bgOf(c: YongShenCand): ResourceColor {
    if (this.selected === c.zhi) {
      return $r('app.color.brand_gold_bright');
    }
    if (c.type === '将') {
      return $r('app.color.overlay_cinnabar_weak');
    }
    return $r('app.color.pan_sel_bg');
  }

  private brdOf(c: YongShenCand): ResourceColor {
    if (this.selected === c.zhi) {
      return $r('app.color.brand_gold_bright');
    }
    if (c.type === '将') {
      return $r('app.color.overlay_cinnabar_edge');
    }
    return $r('app.color.overlay_gold_strong');
  }
}

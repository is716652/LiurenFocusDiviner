/**
 * PalaceCard —— 点宫速查卡（Agent.md §14.4）
 * ----------------------------------------------------------------------------
 * 内容由引擎装配（LiurenCore.readXiangCard，顺序：远景 → 中景 → 近景 → 气机点 → 收梢），
 * 本组件只负责排版：行首小标题 + 正文 + 可选「原文」行（原文与我方陈述分开显示）。
 * 纪律：只呈现盘上关系与原文引用；缺表时由引擎给出「未加载」说明（warn 色调），不留白。
 *       「引擎出数 / App 出呈现」—— 本文件不再自带任何读象判断。
 * 排版纪律（§9 排版门禁）：所有长文本都给 width('100%')，不用 Blank 抢宽度。
 */
@Component
export struct PalaceCard {
  @Prop title: string = '';
  /* 行即引擎 cardRow 的四字段：label / text / source / tone（Record 下标 ArkTS 允许） */
  @Prop rows: Record<string, string>[] = [];
  onClose: () => void = () => { };

  build() {
    Column({ space: 6 }) {
      Row({ space: 8 }) {
        Text(this.title)
          .fontSize($r('app.float.fs_caption'))
          .fontWeight(FontWeight.Medium)
          .fontColor($r('app.color.ink_text'))
          .layoutWeight(1)
        Text('收起')
          .fontSize($r('app.float.font_body_s'))
          .fontColor($r('app.color.brand_gold_deep'))
          .onClick(() => {
            this.onClose();
          })
      }
      .width('100%')

      /* 键必须内容派生：换宫位时行标签集与顺序恒定（此宫/远景/中景/近景/气机点/原文/此宫一句），
         若键只含 label+索引，ArkUI 会判定为同一批子组件而复用旧内容 —— 真机现象是标题在变、
         正文却停在上一个宫位。（2026-09-13 实测修复：见 Agent.md「读象读数」节） */
      ForEach(this.rows, (r: Record<string, string>) => {
        Column({ space: 2 }) {
          if (r['text'] !== '') {
            Row({ space: 6 }) {
              Text(r['label'])
                .fontSize($r('app.float.font_caption_l'))
                .fontColor($r('app.color.ink_text_secondary'))
                .flexShrink(0)
              Text(r['text'])
                .fontSize($r('app.float.font_body_s'))
                .lineHeight(17)
                .fontColor(this.toneOf(r['tone']))
                .layoutWeight(1)
            }
            .width('100%')
          }
          if (r['source'] !== '') {
            Row({ space: 6 }) {
              Text('原文')
                .fontSize($r('app.float.font_caption_m'))
                .fontColor($r('app.color.ink_text_source'))
                .backgroundColor($r('app.color.pan_sel_bg'))
                .borderRadius(6)
                .padding({ left: 5, right: 5, top: 1, bottom: 1 })
                .flexShrink(0)
              Text(r['source'])
                .fontSize($r('app.float.font_caption_l'))
                .lineHeight(16)
                .fontColor($r('app.color.ink_text_source'))
                .layoutWeight(1)
            }
            .width('100%')
          }
        }
        .width('100%')
        .alignItems(HorizontalAlign.Start)
      }, (r: Record<string, string>, i: number) => 'pc' + i + '|' + r['label'] + '|' + r['text']
        + '|' + r['source'] + '|' + r['tone'])

      Text('说明：本卡只陈述盘上关系（宫 · 冲合刑害 · 空亡 · 乘将 · 气机点），不作现实判断；「原文」行引自本项目的读象规则文档。')
        .fontSize($r('app.float.font_caption_m'))
        .lineHeight(14)
        .fontColor($r('app.color.ink_text_secondary'))
        .width('100%')
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
    .padding(12)
    .borderRadius(12)
    .backgroundColor($r('app.color.ink_card'))
    .border({ width: 1, color: $r('app.color.overlay_gold_mid') })
  }

  private toneOf(tone: string): ResourceColor {
    if (tone === 'gold') {
      return $r('app.color.brand_gold_bright');
    }
    if (tone === 'warn') {
      return '#E8C46A';
    }
    return $r('app.color.ink_text_muted');
  }
}

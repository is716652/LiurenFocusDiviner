/**
 * AffairChips —— 占事大类横向滚动选择（抓用神第一步）
 * 数据：names（12 大类）+ selected（当前）+ onPick(名称) 回调
 * 选中态金色高亮；下方附 场景提示词（落象方向）与 信息提示（可补信息）
 */
import type { AffairCfg } from '../model/YongShenCore';

@Component
export struct AffairChips {
  @Prop names: string[] = [];
  @Prop selected: string = '';
  @Prop cfg: AffairCfg | null = null;
  onPick: (name: string) => void = () => { };

  build() {
    Column({ space: 8 }) {
      Row() {
        Text('所占之事')
          .fontSize(11)
          .fontColor('#8A7B5C')
        Blank()
        Text('点击选占事 → 自动抓类神')
          .fontSize(10)
          .fontColor('#5A4F3D')
      }
      .width('100%')

      Scroll() {
        Row({ space: 8 }) {
          ForEach(this.names, (n: string) => {
            Text(n)
              .fontSize(13)
              .fontWeight(this.selected === n ? FontWeight.Medium : FontWeight.Normal)
              .fontColor(this.selected === n ? '#1A1410' : '#C4B183')
              .backgroundColor(this.selected === n ? '#F0D98C' : 'rgba(138,123,92,0.12)')
              .borderRadius(16)
              .padding({ left: 14, right: 14, top: 6, bottom: 6 })
              .onClick(() => {
                this.onPick(n);
              })
          }, (n: string) => n)
        }
        .padding({ left: 2, right: 2, top: 2, bottom: 2 })
      }
      .scrollable(ScrollDirection.Horizontal)
      .scrollBar(BarState.Off)
      .edgeEffect(EdgeEffect.Spring)
      .width('100%')

      if (this.cfg) {
        Column({ space: 4 }) {
          if (this.cfg.scene.length > 0) {
            Text('落象提示：' + this.cfg.scene.join(' · '))
              .fontSize(11)
              .fontColor('#A8843C')
              .lineHeight(16)
              .width('100%')
          }
          if (this.cfg.info !== '') {
            Text(this.cfg.info)
              .fontSize(11)
              .fontColor('#7FA69A')
              .lineHeight(16)
              .width('100%')
          }
          if (this.cfg.note !== '') {
            Text('取用：' + this.cfg.note)
              .fontSize(11)
              .fontColor('#B8A97F')
              .lineHeight(16)
              .width('100%')
          }
        }
        .width('100%')
      }
    }
    .width('100%')
  }
}

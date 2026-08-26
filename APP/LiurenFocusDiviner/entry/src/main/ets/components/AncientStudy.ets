/**
 * AncientStudy —— 古籍研习页签（目录 + 阅读，页签内部切换不走路由）
 * ----------------------------------------------------------------------------
 * 目录：按卷分组的篇目列表（篇名 + 导语），点击进入阅读视图
 * 阅读：篇名栏（‹ 返回 / 篇名 / 卷名）+ 滚动经文段落 + 上一篇/下一篇
 * 数据：rawfile/ancient/zhonghuang_jing.json（由父级 DataLoader.loadAncient 注入）
 * 风格：墨夜鎏金（深底 #14120F / 卡片 #1C1A16 / 金字 #F0D98C / 暗金 #A8843C）
 * ArkTS 合规：零 any / unknown；显式类型；@Prop 状态由父级注入
 */
import type { AncientBook, AncientChapter } from '../model/DataLoader';
import { ModeSwitch } from './ModeSwitch';

@Component
export struct AncientStudy {
  @Prop book: AncientBook | null = null;
  /* 当前页（ModeSwitch 高亮）与切换回调（由 Index 注入） */
  @Prop activeTab: number = 0;
  onSwitchTab: (idx: number) => void = () => { };
  /* 当前阅读篇目下标（-1 = 目录视图） */
  @State private curIdx: number = -1;

  /* 目录行数据（扁平化：卷头 + 篇行） */
  private listRows(): AncientChapter[] {
    const b = this.book;
    if (!b) {
      return [];
    }
    return b.篇目;
  }

  /* 卷头是否显示（与上一篇不同卷时显示） */
  private showJuan(idx: number): boolean {
    const list = this.listRows();
    if (idx === 0) {
      return true;
    }
    return list[idx].卷 !== list[idx - 1].卷;
  }

  build() {
    Column() {
      /* 页头 */
      Row() {
        Text(this.curIdx >= 0 ? '‹ 目录' : '古籍 · 研习')
          .fontSize(17)
          .fontWeight(FontWeight.Bold)
          .fontColor('#F0D98C')
          .onClick(() => {
            if (this.curIdx >= 0) {
              this.curIdx = -1;
            }
          })
        Blank()
        Text(this.book ? this.book.书名 : '')
          .fontSize(11)
          .fontColor('#8A7B5C')
          .margin({ right: 8 })
        ModeSwitch({
          active: this.activeTab,
          onSwitch: (i: number) => {
            this.onSwitchTab(i);
          }
        })
      }
      .width('100%')
      .padding({ left: 20, right: 20, top: 16, bottom: 12 })
      .border({ width: { bottom: 1 }, color: 'rgba(233,200,120,0.2)' })

      if (this.curIdx < 0) {
        this.catalogView()
      } else {
        this.readerView()
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#14120F')
  }

  /* ---------------- 目录视图 ---------------- */
  @Builder
  private catalogView() {
    Scroll() {
      Column() {
        if (!this.book) {
          Text('正在载入古籍…')
            .fontSize(12)
            .fontColor('#6B5F45')
            .padding(24)
        } else {
          ForEach(this.listRows(), (c: AncientChapter, idx: number) => {
            if (this.showJuan(idx)) {
              Text(c.卷)
                .fontSize(12)
                .fontWeight(FontWeight.Medium)
                .fontColor('#A8843C')
                .width('100%')
                .padding({ top: 14, bottom: 6 })
            }
            Row({ space: 10 }) {
              Text(String(c.序).padStart(2, '0'))
                .fontSize(12)
                .fontColor('#8A7448')
                .width(24)
              Column({ space: 3 }) {
                Text(c.篇名)
                  .fontSize(15)
                  .fontWeight(FontWeight.Medium)
                  .fontColor('#F0E6C8')
                  .maxLines(1)
                Text(c.导语)
                  .fontSize(11)
                  .fontColor('#8A7B5C')
                  .maxLines(1)
              }
              .layoutWeight(1)
              .alignItems(HorizontalAlign.Start)
              Text('›')
                .fontSize(16)
                .fontColor('#6B5F45')
            }
            .width('100%')
            .padding({ top: 8, bottom: 8 })
            .onClick(() => {
              this.curIdx = idx;
            })
          }, (c: AncientChapter) => 'ch' + c.序)
          Text('内容据馆藏抄本整理，仅供传统文化研习参考')
            .fontSize(10)
            .fontColor('#5A4F3D')
            .width('100%')
            .textAlign(TextAlign.Center)
            .padding({ top: 20, bottom: 56 })
        }
      }
      .width('100%')
      .padding({ left: 16, right: 16 })
    }
    .layoutWeight(1)
    .scrollBar(BarState.Off)
    .edgeEffect(EdgeEffect.Spring)
  }

  /* ---------------- 阅读视图 ---------------- */
  @Builder
  private readerView() {
    Column() {
      Scroll() {
        Column() {
          /* 篇头 */
          Column({ space: 6 }) {
            Text(this.listRows()[this.curIdx].篇名)
              .fontSize(20)
              .fontWeight(FontWeight.Bold)
              .fontColor('#F0D98C')
            Text(this.listRows()[this.curIdx].卷 + ' · ' + this.listRows()[this.curIdx].导语)
              .fontSize(11)
              .fontColor('#8A7B5C')
              .textAlign(TextAlign.Center)
          }
          .width('100%')
          .padding({ top: 18, bottom: 14 })
          .border({ width: { bottom: 1 }, color: 'rgba(233,200,120,0.15)' })

          /* 经文段落 */
          ForEach(this.listRows()[this.curIdx].段落, (p: string) => {
            Text(p)
              .fontSize(15)
              .fontColor('#D8CBA8')
              .lineHeight(26)
              .width('100%')
              .margin({ top: 10 })
          }, (p: string, pi: number) => 'p' + this.curIdx + '-' + pi)
        }
        .width('100%')
        .padding({ left: 18, right: 18, bottom: 56 })
      }
      .layoutWeight(1)
      .scrollBar(BarState.Off)
      .edgeEffect(EdgeEffect.Spring)

      /* 上一篇 / 下一篇 */
      Row({ space: 10 }) {
        Button(this.curIdx > 0 ? '上一篇' : '已是首篇')
          .layoutWeight(1)
          .height(38)
          .fontSize(13)
          .fontColor('#E9C878')
          .backgroundColor('#211E18')
          .borderRadius(19)
          .enabled(this.curIdx > 0)
          .onClick(() => {
            if (this.curIdx > 0) {
              this.curIdx--;
            }
          })
        Button(this.curIdx < this.listRows().length - 1 ? '下一篇' : '已是末篇')
          .layoutWeight(1)
          .height(38)
          .fontSize(13)
          .fontColor('#1A1410')
          .backgroundColor('#D9A94E')
          .borderRadius(19)
          .enabled(this.curIdx < this.listRows().length - 1)
          .onClick(() => {
            if (this.curIdx < this.listRows().length - 1) {
              this.curIdx++;
            }
          })
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 8, bottom: 56 })
      .backgroundColor('#1C1A16')
      .border({ width: { top: 1 }, color: 'rgba(233,200,120,0.15)' })
    }
    .width('100%')
    .height('100%')
  }
}

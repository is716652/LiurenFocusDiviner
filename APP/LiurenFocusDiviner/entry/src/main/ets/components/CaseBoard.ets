/**
 * CaseBoard —— 课例页签（保存的排盘记录列表）
 * ----------------------------------------------------------------------------
 * 卡片：日期时辰 + 四柱 + 月将/课体/三传 + 用神/占事 + 备注
 * 交互：点卡片 → onRestore(rec)（父级回填日期时辰并重排跳回排盘页签）；
 *       右上 ✕ → onDelete(ts)
 * 数据：CaseRec[] 由父级持有（CaseStore 持久化）
 * ArkTS 合规：零 any / unknown；显式类型；回调显式签名
 */
import type { CaseRec } from '../model/CaseStore';

@Component
export struct CaseBoard {
  @Prop cases: CaseRec[] = [];
  onDelete: (ts: number) => void = () => { };
  onRestore: (rec: CaseRec) => void = () => { };

  build() {
    Column() {
      /* 页头由页面层 PageHeader 提供（本组件只渲染列表内容） */
      Scroll() {
        Column({ space: 10 }) {
          if (this.cases.length === 0) {
            Column({ space: 8 }) {
              Text('暂存课例')
                .fontSize(14)
                .fontColor('#8A7B5C')
              Text('排盘后点「保存课例」，盘面要点即存于此；点击可一键恢复重排')
                .fontSize(11)
                .fontColor('#6B5F45')
                .textAlign(TextAlign.Center)
                .lineHeight(17)
            }
            .width('100%')
            .padding({ top: 60, bottom: 60 })
          } else {
            ForEach(this.cases, (r: CaseRec) => {
              this.caseCard(r)
            }, (r: CaseRec) => 'cs' + r.ts)
            Text('课例存于本机（最多 200 例），卸载应用后清除')
              .fontSize(10)
              .fontColor('#5A4F3D')
              .width('100%')
              .textAlign(TextAlign.Center)
              .padding({ top: 10, bottom: 72 })
          }
        }
        .width('100%')
        .height('100%')
        .justifyContent(FlexAlign.Start)
        .padding({ left: 16, right: 16, top: 14 })
      }
      .layoutWeight(1)
      .scrollBar(BarState.Off)
      .edgeEffect(EdgeEffect.Spring)
    }
    .width('100%')
    .height('100%')
    .layoutWeight(1)
    .backgroundColor('#14120F')
  }

  @Builder
  private caseCard(r: CaseRec) {
    Column({ space: 8 }) {
      /* 首行：标题 + 来源徽标 + 删除 */
      Row() {
        Text(r.title !== '' ? r.title : r.date)
          .fontSize(15)
          .fontWeight(FontWeight.Medium)
          .fontColor('#F0D98C')
          .layoutWeight(1)
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
        if (r.title.indexOf('古籍') === 0) {
          Text('古籍')
            .fontSize(9)
            .fontColor('#1A1410')
            .backgroundColor('#7FA0B8')
            .borderRadius(6)
            .padding({ left: 6, right: 6, top: 1, bottom: 1 })
            .margin({ left: 6 })
        }
        Text(r.hourZhi + '时')
          .fontSize(11)
          .fontColor('#1A1410')
          .backgroundColor('#E9C878')
          .borderRadius(8)
          .padding({ left: 8, right: 8, top: 2, bottom: 2 })
          .margin({ left: 8 })
        Blank()
        Text('✕')
          .fontSize(13)
          .fontColor('#6B5F45')
          .padding({ left: 8, right: 2, top: 4, bottom: 4 })
          .onClick(() => {
            this.onDelete(r.ts);
          })
      }
      .width('100%')

      /* 日期（小字） */
      Text(r.date)
        .fontSize(10)
        .fontColor('#8A7B5C')
        .width('100%')

      /* 四柱 */
      Text(r.siZhu)
        .fontSize(14)
        .fontWeight(FontWeight.Medium)
        .fontColor('#F0D98C')
        .width('100%')

      /* 盘面要点：月将 / 课体 / 三传 */
      Row({ space: 8 }) {
        Text('月将 ' + r.yueJiang)
          .fontSize(11)
          .fontColor('#C4B183')
        Text(r.keti !== '' ? r.keti : '—')
          .fontSize(11)
          .fontColor('#C4B183')
          .layoutWeight(1)
          .maxLines(1)
        Text('三传 ' + r.chuans)
          .fontSize(11)
          .fontColor('#C4B183')
      }
      .width('100%')

      /* 用神 / 占事 / 备注 */
      if (r.yongShen !== '' || r.affairName !== '' || r.note !== '') {
        Text((r.yongShen !== '' ? '用神' + r.yongShen + ' · ' : '') +
          (r.affairName !== '' ? r.affairName + ' · ' : '') + r.note)
          .fontSize(11)
          .fontColor('#8A7B5C')
          .maxLines(2)
          .width('100%')
      }
    }
    .width('100%')
    .padding(12)
    .borderRadius(14)
    .backgroundColor('#1C1A16')
    .border({ width: 1, color: 'rgba(233,200,120,0.14)' })
    .onClick(() => {
      this.onRestore(r);
    })
  }
}

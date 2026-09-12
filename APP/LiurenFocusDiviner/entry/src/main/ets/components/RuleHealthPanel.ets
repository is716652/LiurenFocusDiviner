/**
 * RuleHealthPanel —— 数据自检面板（Agent.md §14.3）
 * ----------------------------------------------------------------------------
 * 一屏给全：① 摘要（已加载 N/N 表）② 缺表清单（规则表名 + 失败原因，**不含数据文件名**）
 * ③ 逐表自检（条目数 / 必填键 / 版本 / 登记时间）④ 一键重新自检 ⑤ 一键导出诊断（复制到剪贴板）。
 * 纪律：诊断文本离线生成、不联网、不含个人信息；缺表不影响排盘（盘照旧排出），这里只是把状态说清楚。
 * ArkTS 合规：零 any / unknown；显式类型；不用变量下标取字典。
 */
import { pasteboard } from '@kit.BasicServicesKit';
import { RuleHealth, RuleTableStatus } from '../model/RuleHealth';

@Component
export struct RuleHealthPanel {
  @Prop appVersion: string = '';
  @Prop extra: string = '';
  onClose: () => void = () => { };
  onRecheck: () => void = () => { };

  @State private summary: string = '';
  @State private problems: RuleTableStatus[] = [];
  @State private all: RuleTableStatus[] = [];
  @State private diagnose: string = '';
  @State private tip: string = '';

  aboutToAppear(): void {
    this.refresh();
  }

  private refresh(): void {
    RuleHealth.init();
    this.summary = RuleHealth.summaryText();
    this.problems = RuleHealth.problemList();
    this.all = RuleHealth.statusList();
    this.diagnose = RuleHealth.diagnoseText(this.appVersion, this.extra);
    this.tip = '';
  }

  private async copyDiagnose(): Promise<void> {
    const data = pasteboard.createData(pasteboard.MIMETYPE_TEXT_PLAIN, this.diagnose);
    const board = pasteboard.getSystemPasteboard();
    await board.setData(data);
    this.tip = '已复制到剪贴板（可粘贴发给我们排查）';
  }

  build() {
    Column() {
      /* 标题栏 */
      Row() {
        Text('数据自检')
          .fontSize(16)
          .fontWeight(FontWeight.Medium)
          .fontColor('#F0E6C8')
        Blank()
        Text('✕')
          .fontSize(15)
          .fontColor('#C4B183')
          .padding({ left: 10, right: 10, top: 2, bottom: 2 })
          .onClick(() => {
            this.onClose();
          })
      }
      .width('100%')
      .padding({ bottom: 10 })

      Scroll() {
        Column({ space: 10 }) {
          Text(this.summary)
            .fontSize(13)
            .fontColor(this.problems.length > 0 ? '#E8C46A' : '#8FA88C')
            .width('100%')
            .textAlign(TextAlign.Start)

          if (this.problems.length > 0) {
            Column({ space: 4 }) {
              Text('缺表 / 内容不完整（' + this.problems.length + ' 项）')
                .fontSize(12)
                .fontColor('#E8A483')
                .width('100%')
                .textAlign(TextAlign.Start)
              ForEach(this.problems, (s: RuleTableStatus) => {
                Column({ space: 2 }) {
                  Text('· ' + s.label + '：' + (s.missingKeys.length > 0 ? ('缺 ' + s.missingKeys.join('、')) : '未加载'))
                    .fontSize(12)
                    .fontColor('#E8A483')
                    .width('100%')
                    .textAlign(TextAlign.Start)
                  Text(s.failReason !== '' ? s.failReason : '未登记失败原因')
                    .fontSize(10)
                    .fontColor('#B8A97F')
                    .width('100%')
                    .textAlign(TextAlign.Start)
                }
                .width('100%')
                .alignItems(HorizontalAlign.Start)
              }, (s: RuleTableStatus) => 'p' + s.key)
              Text('说明：缺表不影响排盘（引擎以空规则兜底，盘照旧排出），相关栏目会标注「规则表未加载」。')
                .fontSize(10)
                .fontColor('#A8986E')
                .lineHeight(15)
                .width('100%')
                .textAlign(TextAlign.Start)
            }
            .width('100%')
            .alignItems(HorizontalAlign.Start)
            .padding(10)
            .borderRadius(10)
            .backgroundColor('rgba(208,112,74,0.08)')
            .border({ width: 1, color: 'rgba(208,112,74,0.28)' })
          }

          /* 逐表自检 */
          Column({ space: 3 }) {
            Text('逐表自检（条目数 · 版本 · 登记时间）')
              .fontSize(12)
              .fontColor('#F0E6C8')
              .width('100%')
              .textAlign(TextAlign.Start)
            ForEach(this.all, (s: RuleTableStatus) => {
              Row({ space: 6 }) {
                Text(s.loaded ? (s.missingKeys.length > 0 ? '!' : '✓') : '✗')
                  .fontSize(11)
                  .fontColor(!s.loaded ? '#E8A483' : (s.missingKeys.length > 0 ? '#E8C46A' : '#8FA88C'))
                Text(s.label)
                  .fontSize(11)
                  .fontColor('#C4B183')
                  .layoutWeight(1)
                Text(this.detailOf(s))
                  .fontSize(10)
                  .fontColor('#A8986E')
              }
              .width('100%')
            }, (s: RuleTableStatus) => 'a' + s.key)
          }
          .width('100%')
          .alignItems(HorizontalAlign.Start)
          .padding(10)
          .borderRadius(10)
          .backgroundColor('#1C1A16')
          .border({ width: 1, color: 'rgba(233,200,120,0.14)' })

          /* 诊断文本预览（可长按选择复制，剪贴板失败时也能看） */
          Column({ space: 4 }) {
            Text('诊断文本（导出即复制此内容）')
              .fontSize(12)
              .fontColor('#F0E6C8')
              .width('100%')
              .textAlign(TextAlign.Start)
            Text(this.diagnose)
              .fontSize(10)
              .fontColor('#B8A97F')
              .lineHeight(15)
              .width('100%')
              .textAlign(TextAlign.Start)
              .copyOption(CopyOptions.LocalDevice)
          }
          .width('100%')
          .alignItems(HorizontalAlign.Start)
          .padding(10)
          .borderRadius(10)
          .backgroundColor('#1C1A16')
          .border({ width: 1, color: 'rgba(233,200,120,0.14)' })

          if (this.tip !== '') {
            Text(this.tip)
              .fontSize(11)
              .fontColor('#8FA88C')
              .width('100%')
              .textAlign(TextAlign.Start)
          }
        }
        .width('100%')
        .alignItems(HorizontalAlign.Start)
      }
      .layoutWeight(1)
      .scrollBar(BarState.Auto)

      /* 操作栏 */
      Row({ space: 10 }) {
        Text('重新自检')
          .fontSize(12)
          .fontColor('#C4B183')
          .padding({ left: 14, right: 14, top: 8, bottom: 8 })
          .borderRadius(10)
          .backgroundColor('#211E18')
          .border({ width: 1, color: 'rgba(233,200,120,0.20)' })
          .onClick(() => {
            this.onRecheck();
            this.refresh();
          })
        Text('导出诊断（复制）')
          .fontSize(12)
          .fontColor('#1A1410')
          .padding({ left: 14, right: 14, top: 8, bottom: 8 })
          .borderRadius(10)
          .backgroundColor('#E9C878')
          .onClick(() => {
            this.copyDiagnose();
          })
      }
      .width('100%')
      .padding({ top: 10 })
    }
    .width('100%')
    .height('100%')
    .padding(16)
    .backgroundColor('#141210')
    .alignItems(HorizontalAlign.Start)
  }

  private detailOf(s: RuleTableStatus): string {
    if (!s.loaded) {
      return '未加载';
    }
    let out = s.entries >= 0 ? (s.entries + ' 条') : '';
    if (s.version !== '') {
      out += (out !== '' ? ' · ' : '') + 'v' + s.version;
    }
    if (s.missingKeys.length > 0) {
      out += (out !== '' ? ' · ' : '') + '缺 ' + s.missingKeys.join('、');
    }
    return out === '' ? '已加载' : out;
  }
}

/**
 * AncientCaseGallery —— 古籍案例鉴赏（主版/收费研习内容；免费上架版隐藏入口）
 * ----------------------------------------------------------------------------
 * 数据：rawfile/ancient/case_gallery.json（DataLoader.loadAncientCases）
 * 盘面：不存死盘，按案例输入现场 LiurenCore.buildChartAncient() 复算
 * 合规：只做古籍断法复原与程序校验，不出现付费/解锁/会员字样
 */
import type { AncientCase } from '../model/DataLoader';
import { LiurenCore } from '../model/LiurenCore';
import type { Chart, ZhonghuangAnalyze } from '../model/LiurenCore';

@Component
export struct AncientCaseGallery {
  @Prop cases: AncientCase[] = [];
  @State private cur: AncientCase | null = null;
  @State private chart: Chart | null = null;
  @State private ana: ZhonghuangAnalyze | null = null;

  private openCase(c: AncientCase): void {
    this.cur = c;
    const inp = c.input;
    const ch = LiurenCore.buildChartAncient(
      inp.mj,
      inp.dg,
      inp.dz,
      inp.hour,
      inp.yearGan ? inp.yearGan : '',
      inp.yearZhi ? inp.yearZhi : '',
      inp.monthZhi ? inp.monthZhi : ''
    );
    this.chart = ch;
    this.ana = ch ? LiurenCore.zhonghuangAnalyze(ch, inp.hour) : null;
  }

  private kegLine(ch: Chart): string {
    const parts: string[] = [];
    for (let i = 0; i < ch.kegs.length; i++) {
      parts.push('课' + String(i + 1) + ' ' + ch.kegs[i].x + '/' + ch.kegs[i].s);
    }
    return parts.join('　');
  }

  private chuanLine(ch: Chart): string {
    const parts: string[] = [];
    for (let i = 0; i < ch.sanchuan.chuans.length; i++) {
      const z = ch.sanchuan.chuans[i].z;
      const gong = LiurenCore.gongOf(ch.tp, z);
      parts.push(ch.sanchuan.chuans[i].gz + '乘' + ch.jiangMap[gong] + '@' + gong);
    }
    return parts.join(' → ');
  }

  @Builder
  private tabButton(txt: string, active: boolean, onTap: () => void) {
    Text(txt)
      .fontSize(12)
      .fontColor(active ? '#1A1410' : '#C4B183')
      .backgroundColor(active ? '#E9C878' : '#211E18')
      .borderRadius(14)
      .padding({ left: 12, right: 12, top: 6, bottom: 6 })
      .onClick(() => {
        onTap();
      })
  }

  @Builder
  private listView() {
    Column({ space: 10 }) {
      Text('案例鉴赏')
        .fontSize(15)
        .fontWeight(FontWeight.Bold)
        .fontColor('#F0D98C')
      Text('古籍案例的程序化复原：课式校验、中黄先锋、断法链路')
        .fontSize(10)
        .fontColor('#8A7B5C')
      ForEach(this.cases, (c: AncientCase) => {
        Column({ space: 5 }) {
          Row() {
            Text(c.title)
              .fontSize(14)
              .fontWeight(FontWeight.Medium)
              .fontColor('#F0E6C8')
              .layoutWeight(1)
            Text('›')
              .fontSize(18)
              .fontColor('#6B5F45')
          }
          Text(c.source + ' · ' + c.chapter)
            .fontSize(10)
            .fontColor('#A8843C')
          Text(c.summary)
            .fontSize(11)
            .fontColor('#8A7B5C')
            .maxLines(2)
            .textOverflow({ overflow: TextOverflow.Ellipsis })
        }
        .width('100%')
        .padding(12)
        .borderRadius(12)
        .backgroundColor('#1C1A16')
        .border({ width: 1, color: 'rgba(233,200,120,0.14)' })
        .onClick(() => {
          this.openCase(c);
        })
      }, (c: AncientCase) => c.id)
    }
    .width('100%')
    .padding({ left: 16, right: 16, top: 12, bottom: 20 })
  }

  @Builder
  private detailView(c: AncientCase) {
    Column({ space: 10 }) {
      Row() {
        Text('‹ 案例列表')
          .fontSize(12)
          .fontColor('#C4B183')
          .padding({ left: 10, right: 10, top: 5, bottom: 5 })
          .borderRadius(9)
          .backgroundColor('#211E18')
          .onClick(() => {
            this.cur = null;
            this.chart = null;
            this.ana = null;
          })
        Blank()
        Text('研习样例')
          .fontSize(10)
          .fontColor('#8A7B5C')
      }
      Text(c.title)
        .fontSize(17)
        .fontWeight(FontWeight.Bold)
        .fontColor('#F0D98C')
      Text(c.source + ' · ' + c.chapter)
        .fontSize(10)
        .fontColor('#A8843C')

      Column({ space: 6 }) {
        Text('原文断语')
          .fontSize(12)
          .fontColor('#A8843C')
        Text(c.original)
          .fontSize(13)
          .fontColor('#F0E6C8')
          .lineHeight(20)
      }
      .width('100%')
      .padding(12)
      .borderRadius(12)
      .backgroundColor('#1C1A16')

      if (this.chart) {
        Column({ space: 6 }) {
          Text('程序复算')
            .fontSize(12)
            .fontColor('#A8843C')
          Text('四课　' + this.kegLine(this.chart as Chart))
            .fontSize(11)
            .fontColor('#F0E6C8')
          Text('三传　' + this.chuanLine(this.chart as Chart))
            .fontSize(11)
            .fontColor('#F0E6C8')
          Text('旬空　' + (this.chart as Chart).dx.xunkong.join('') + '　日干旺衰　' + (this.chart as Chart).dx.dayWangShuai)
            .fontSize(11)
            .fontColor('#8A7B5C')
        }
        .width('100%')
        .padding(12)
        .borderRadius(12)
        .backgroundColor('#1C1A16')
      }

      if (this.ana) {
        Column({ space: 6 }) {
          Text('中黄先锋链路')
            .fontSize(12)
            .fontColor('#A8843C')
          Text('时干' + (this.ana as ZhonghuangAnalyze).dun.shiGan + ' · 变干' + (this.ana as ZhonghuangAnalyze).dun.bianGan + '落' + (this.ana as ZhonghuangAnalyze).bianGong + '宫 · 六亲' + (this.ana as ZhonghuangAnalyze).bianLq + ' · ' + ((this.ana as ZhonghuangAnalyze).bianInChuan ? '入' + (this.ana as ZhonghuangAnalyze).bianInChuan : '不入三传'))
            .fontSize(11)
            .fontColor('#F0E6C8')
            .lineHeight(18)
        }
        .width('100%')
        .padding(12)
        .borderRadius(12)
        .backgroundColor('#1C1A16')
      }

      Column({ space: 6 }) {
        Text('断法链路')
          .fontSize(12)
          .fontColor('#A8843C')
        ForEach(c.chain, (line: string, idx: number) => {
          Text(String(idx + 1) + '. ' + line)
            .fontSize(11)
            .fontColor('#F0E6C8')
            .lineHeight(18)
        }, (line: string) => line)
      }
      .width('100%')
      .padding(12)
      .borderRadius(12)
      .backgroundColor('#1C1A16')

      Text(c.compliance)
        .fontSize(9)
        .fontColor('#6B5F45')
        .lineHeight(15)
    }
    .width('100%')
    .padding({ left: 16, right: 16, top: 12, bottom: 24 })
  }

  build() {
    Column() {
      if (this.cases.length === 0) {
        Text('案例库整理中')
          .fontSize(12)
          .fontColor('#8A7B5C')
          .width('100%')
          .textAlign(TextAlign.Center)
          .padding(24)
      } else {
        Scroll() {
          Column() {
            if (this.cur === null) {
              this.listView()
            } else {
              this.detailView(this.cur as AncientCase)
            }
          }
          .width('100%')
        }
        .layoutWeight(1)
        .scrollBar(BarState.Off)
        .edgeEffect(EdgeEffect.Spring)
      }
    }
    .width('100%')
    .layoutWeight(1)
  }
}

/**
 * AncientCaseGallery —— 古籍案例鉴赏（主版/收费研习内容；免费上架版隐藏入口）
 * ----------------------------------------------------------------------------
 * 数据：rawfile/ancient/case_gallery.json（DataLoader.loadAncientCases）
 * 盘面：不存死盘，按案例输入现场 LiurenCore.buildChartAncient() 复算
 * 合规：只做古籍断法复原与程序校验，不出现付费/解锁/会员字样
 */
import type { AncientCase } from '../model/DataLoader';
import { LiurenCore } from '../model/LiurenCore';
import type { Chart, Keg, ZhonghuangAnalyze } from '../model/LiurenCore';
import { PanDisk } from './PanDisk';
import { KegCard } from './KegCard';
import { ChuanCard } from './ChuanCard';

interface KegRow {
  kn: string;
  keg: Keg;
}

interface ChuanRow {
  pos: string;
  gz: string;
  jiang: string;
  lq: string;
  color: string;
}

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

  private jiangOf(ch: Chart, z: string): string {
    const gong = LiurenCore.gongOf(ch.tp, z);
    const j = ch.jiangMap[gong];
    return j ? j : '';
  }

  private liuqinOf(ch: Chart, z: string): string {
    const w = LiurenCore.WX[z] || '';
    const dw = LiurenCore.WXG[ch.r.dg] || '';
    if (w === dw) {
      return '兄弟';
    }
    if (LiurenCore.KE[dw] === w) {
      return '妻财';
    }
    if (LiurenCore.KE[w] === dw) {
      return '官鬼';
    }
    if (LiurenCore.SHENG(dw) === w) {
      return '子孙';
    }
    return '父母';
  }

  private chuanTitle(ch: Chart): string {
    const k = ch.sanchuan.keti;
    return k !== '' ? k : ch.sanchuan.method;
  }

  private kegRows(ch: Chart): KegRow[] {
    const out: KegRow[] = [];
    for (let i = 3; i >= 0; i--) {
      out.push({ kn: '第' + (i + 1) + '课', keg: ch.kegs[i] });
    }
    return out;
  }

  private chuanRows(ch: Chart): ChuanRow[] {
    const posNames: string[] = ['初传', '中传', '末传'];
    const out: ChuanRow[] = [];
    for (let i = 0; i < ch.sanchuan.chuans.length; i++) {
      const z = ch.sanchuan.chuans[i].z;
      const jiang = this.jiangOf(ch, z);
      out.push({
        pos: posNames[i],
        gz: ch.sanchuan.chuans[i].gz,
        jiang: jiang,
        lq: this.liuqinOf(ch, z),
        color: (LiurenCore.JIANG_JX[jiang] === '吉') ? '#E9C878' : '#D0704A'
      });
    }
    return out;
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
    .alignItems(HorizontalAlign.Start)
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
        Column({ space: 10 }) {
          Row() {
            Text('程序复算')
              .fontSize(12)
              .fontColor('#A8843C')
            Blank()
            Text('旬空 ' + (this.chart as Chart).dx.xunkong.join('') + ' · 日干' + (this.chart as Chart).dx.dayWangShuai)
              .fontSize(10)
              .fontColor('#6B5F45')
          }
          .width('100%')

          Column() {
            PanDisk({
              chart: this.chart as Chart
            })
          }
          .width('100%')
          .alignItems(HorizontalAlign.Center)

          Column({ space: 8 }) {
            Row() {
              Text('四课')
                .fontSize(13)
                .fontWeight(FontWeight.Medium)
                .fontColor('#F0E6C8')
              Blank()
              Text('右起第一课 · 干上神')
                .fontSize(9)
                .fontColor('#6B5F45')
            }
            .width('100%')
            Row({ space: 8 }) {
              KegCard({ kn: this.kegRows(this.chart as Chart)[0].kn, xia: this.kegRows(this.chart as Chart)[0].keg.s,
                shang: this.kegRows(this.chart as Chart)[0].keg.x, jiang: this.jiangOf(this.chart as Chart, this.kegRows(this.chart as Chart)[0].keg.x) })
                .layoutWeight(1)
              KegCard({ kn: this.kegRows(this.chart as Chart)[1].kn, xia: this.kegRows(this.chart as Chart)[1].keg.s,
                shang: this.kegRows(this.chart as Chart)[1].keg.x, jiang: this.jiangOf(this.chart as Chart, this.kegRows(this.chart as Chart)[1].keg.x) })
                .layoutWeight(1)
              KegCard({ kn: this.kegRows(this.chart as Chart)[2].kn, xia: this.kegRows(this.chart as Chart)[2].keg.s,
                shang: this.kegRows(this.chart as Chart)[2].keg.x, jiang: this.jiangOf(this.chart as Chart, this.kegRows(this.chart as Chart)[2].keg.x) })
                .layoutWeight(1)
              KegCard({ kn: this.kegRows(this.chart as Chart)[3].kn, xia: this.kegRows(this.chart as Chart)[3].keg.s,
                shang: this.kegRows(this.chart as Chart)[3].keg.x, jiang: this.jiangOf(this.chart as Chart, this.kegRows(this.chart as Chart)[3].keg.x),
                highlight: true })
                .layoutWeight(1)
            }
            .width('100%')
          }
          .width('100%')

          Column({ space: 8 }) {
            Row() {
              Text('三传 · ' + this.chuanTitle(this.chart as Chart))
                .fontSize(13)
                .fontWeight(FontWeight.Medium)
                .fontColor('#F0E6C8')
              Blank()
              Text('九宗门')
                .fontSize(9)
                .fontColor('#6B5F45')
            }
            .width('100%')
            Row({ space: 8 }) {
              ChuanCard({ pos: this.chuanRows(this.chart as Chart)[0].pos, gz: this.chuanRows(this.chart as Chart)[0].gz,
                jiang: this.chuanRows(this.chart as Chart)[0].jiang, lq: this.chuanRows(this.chart as Chart)[0].lq,
                color: this.chuanRows(this.chart as Chart)[0].color, highlight: true })
                .layoutWeight(1)
              ChuanCard({ pos: this.chuanRows(this.chart as Chart)[1].pos, gz: this.chuanRows(this.chart as Chart)[1].gz,
                jiang: this.chuanRows(this.chart as Chart)[1].jiang, lq: this.chuanRows(this.chart as Chart)[1].lq,
                color: this.chuanRows(this.chart as Chart)[1].color })
                .layoutWeight(1)
              ChuanCard({ pos: this.chuanRows(this.chart as Chart)[2].pos, gz: this.chuanRows(this.chart as Chart)[2].gz,
                jiang: this.chuanRows(this.chart as Chart)[2].jiang, lq: this.chuanRows(this.chart as Chart)[2].lq,
                color: this.chuanRows(this.chart as Chart)[2].color })
                .layoutWeight(1)
            }
            .width('100%')
          }
          .width('100%')
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
    .alignItems(HorizontalAlign.Start)
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
          .constraintSize({ minHeight: '100%' })
          .justifyContent(FlexAlign.Start)
        }
        .layoutWeight(1)
        .scrollBar(BarState.Off)
        .edgeEffect(EdgeEffect.Spring)
      }
    }
    .width('100%')
    .layoutWeight(1)
    .justifyContent(FlexAlign.Start)
  }
}

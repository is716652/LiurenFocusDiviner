/**
 * AncientCaseGallery —— 古籍案例鉴赏（主版/收费研习内容；免费上架版隐藏入口）
 * ----------------------------------------------------------------------------
 * 数据：rawfile/ancient/case_gallery.json（DataLoader.loadAncientCases）
 * 盘面：不存死盘，按案例输入现场 LiurenCore.buildChartAncient() 复算
 * 合规：只做古籍断法复原与程序校验，不出现付费/解锁/会员字样
 */
import type { AncientCase, AncientCaseEvidence, AncientCaseReasoning } from '../model/DataLoader';
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
  /* 详情态双向同步给页面：用于页头返回/手势返回先回列表，而不是直接退出古籍页 */
  @Link @Watch('onDetailOpenChange') detailOpen: boolean;
  @State private cur: AncientCase | null = null;
  @State private chart: Chart | null = null;
  @State private ana: ZhonghuangAnalyze | null = null;
  @State private focusZhi: string = '';
  @State private focusLabel: string = '';
  @State private topicFilter: string = '全部';
  @State private activeClaim: string = '';
  @State private showSupport: boolean = true;
  @State private showTiming: boolean = true;
  @State private showRisk: boolean = true;
  @State private showCross: boolean = false;

  private openCase(c: AncientCase): void {
    this.cur = c;
    this.activeClaim = (c.reasoning && c.reasoning.length > 0) ? c.reasoning[0].claim : '';
    this.clearFocus();
    this.detailOpen = true;
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

  private routeLabel(r: string): string {
    if (r === 'base') {
      return '本盘';
    }
    if (r === 'duxiang') {
      return '读象链路';
    }
    if (r === 'zhonghuang') {
      return '中黄链路';
    }
    if (r === 'yongshen') {
      return '抓用神链路';
    }
    if (r === 'bifa') {
      return '毕法链路';
    }
    return r;
  }

  private routeColor(r: string): string {
    if (r === 'duxiang') {
      return '#A63A2B';
    }
    if (r === 'zhonghuang') {
      return '#3E5C76';
    }
    if (r === 'yongshen') {
      return '#3F7D6B';
    }
    if (r === 'bifa') {
      return '#8A5A2B';
    }
    return '#A63A2B';
  }

  private evidenceText(e: AncientCaseEvidence): string {
    const p = e.pos ? e.pos + '·' : '';
    return p + e.ref + '：' + e.why;
  }

  /* 证据锚点提取：从 ref 中取第一个地支作为盘面高亮焦点 */
  private evidenceZhi(e: AncientCaseEvidence): string {
    const zs = '子丑寅卯辰巳午未申酉戌亥';
    for (let i = 0; i < e.ref.length; i++) {
      const ch = e.ref.charAt(i);
      if (zs.indexOf(ch) >= 0) {
        return ch;
      }
    }
    return '';
  }

  private setFocus(z: string, label: string): void {
    this.focusZhi = z;
    this.focusLabel = label;
  }

  private clearFocus(): void {
    this.focusZhi = '';
    this.focusLabel = '';
  }

  private closeDetail(): void {
    this.cur = null;
    this.chart = null;
    this.ana = null;
    this.activeClaim = '';
    this.clearFocus();
    this.detailOpen = false;
  }

  private onDetailOpenChange(): void {
    if (!this.detailOpen && this.cur) {
      this.closeDetail();
    }
  }

  private topicOptions(): string[] {
    return ['全部', '来意', '疾病', '官讼', '行人', '仕宦', '生产', '风水', '应候', '役事', '终身', '省试', '会试', '流年', '前程', '己身', '复建', '亡盗', '远行', '索债', '赴任', '复任', '补官', '六甲'];
  }

  private groupNames(): string[] {
    return ['中黄五变经', '壬占汇选·甲子日', '壬占汇选·乙丑日', '壬占汇选·丙寅日'];
  }

  private groupOf(c: AncientCase): string {
    if (c.source.indexOf('中黄五变经') >= 0) {
      return '中黄五变经';
    }
    if (c.id.indexOf('_yichou_') >= 0 || c.title.indexOf('乙丑日') >= 0 || c.chapter === '乙丑日') {
      return '壬占汇选·乙丑日';
    }
    if (c.id.indexOf('_bingyin_') >= 0 || c.title.indexOf('丙寅日') >= 0 || c.chapter === '丙寅日') {
      return '壬占汇选·丙寅日';
    }
    return '壬占汇选·甲子日';
  }

  private filteredCases(): AncientCase[] {
    if (this.topicFilter === '全部') {
      return this.cases;
    }
    return this.cases.filter((c: AncientCase) => (c.topics ? c.topics : []).indexOf(this.topicFilter) >= 0);
  }

  private casesInGroup(g: string): AncientCase[] {
    return this.filteredCases().filter((c: AncientCase) => this.groupOf(c) === g);
  }

  /* 当前断句的关键标注：只有 mark + key=true 的证据允许上三传卡 */
  private markForZhi(z: string): string {
    const c = this.cur;
    if (!c || !c.reasoning || this.activeClaim === '') {
      return '';
    }
    for (const r of c.reasoning) {
      if (r.claim !== this.activeClaim) {
        continue;
      }
      for (const e of r.evidence) {
        if (e.key === true && e.mark && this.evidenceZhi(e) === z) {
          return e.mark;
        }
      }
    }
    return '';
  }

  private mainReasoning(c: AncientCase): AncientCaseReasoning | null {
    if (!c.reasoning || c.reasoning.length === 0) {
      return null;
    }
    return c.reasoning[0];
  }

  private reasoningByRole(c: AncientCase, role: string): AncientCaseReasoning[] {
    if (!c.reasoning) {
      return [];
    }
    return c.reasoning.filter((r: AncientCaseReasoning) => (r.role ? r.role : 'support') === role);
  }

  private roleLabel(role?: string): string {
    if (role === 'main') { return '主断'; }
    if (role === 'timing') { return '应期'; }
    if (role === 'risk') { return '风险'; }
    if (role === 'cross') { return '参证'; }
    return '旁证';
  }

  private roleColor(role?: string): string {
    if (role === 'main') { return '#A63A2B'; }
    if (role === 'timing') { return '#2F4A5F'; }
    if (role === 'risk') { return '#7A2E2E'; }
    if (role === 'cross') { return '#3E5C76'; }
    return '#8A7B5C';
  }

  private consensusKeyword(c: AncientCase): string {
    const m = this.mainReasoning(c);
    if (!m) {
      return '';
    }
    const words: string[] = ['行人', '疾病', '官讼', '来意', '失物', '赴任', '仕宦', '生产', '应试', '流年', '风水', '复任', '补官', '役事', '省试', '会试'];
    for (const w of words) {
      if (m.claim.indexOf(w) >= 0) {
        return w;
      }
    }
    return '';
  }

  private consensusCount(c: AncientCase): number {
    const k = this.consensusKeyword(c);
    if (!c.reasoning || k === '') {
      return 0;
    }
    return c.reasoning.filter((r: AncientCaseReasoning) => r.role !== 'main' && r.claim.indexOf(k) >= 0).length;
  }

  private claimKeyword(claim: string): string {
    const words: string[] = ['行人', '疾病', '官讼', '来意', '失物', '赴任', '仕宦', '生产', '应试', '流年', '风水', '复任', '补官', '役事', '省试', '会试'];
    for (const w of words) {
      if (claim.indexOf(w) >= 0) {
        return w;
      }
    }
    return '';
  }

  /* 异断：非主断断句落在另一个占类关键词上；只提示，不硬合并 */
  private divergentReasoning(c: AncientCase): AncientCaseReasoning[] {
    const mk = this.consensusKeyword(c);
    if (!c.reasoning) {
      return [];
    }
    return c.reasoning.filter((r: AncientCaseReasoning) => {
      if (r.role === 'main') {
        return false;
      }
      const k = this.claimKeyword(r.claim);
      return k !== '' && k !== mk;
    });
  }

  private isDivergent(c: AncientCase | null, r: AncientCaseReasoning): boolean {
    if (!c) {
      return false;
    }
    return this.divergentReasoning(c).some((x: AncientCaseReasoning) => x.claim === r.claim);
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
  private reasoningItem(r: AncientCaseReasoning, emphasis: boolean) {
    Column({ space: 6 }) {
      Row() {
        Text(this.roleLabel(r.role))
          .fontSize(9)
          .fontColor('#F5EFE2')
          .backgroundColor(this.roleColor(r.role))
          .borderRadius(8)
          .padding({ left: 6, right: 6, top: 2, bottom: 2 })
        if (this.isDivergent(this.cur, r)) {
          Text('异断')
            .fontSize(9)
            .fontColor('#F5EFE2')
            .backgroundColor('#2F4A5F')
            .borderRadius(8)
            .padding({ left: 6, right: 6, top: 2, bottom: 2 })
        }
        Text('断：' + r.claim)
          .fontSize(emphasis ? 13 : 12)
          .fontWeight(emphasis ? FontWeight.Bold : FontWeight.Medium)
          .fontColor(this.activeClaim === r.claim ? '#A63A2B' : '#2B241B')
          .layoutWeight(1)
        Text(this.routeLabel(r.route))
          .fontSize(9)
          .fontColor('#F5EFE2')
          .backgroundColor(this.routeColor(r.route))
          .borderRadius(8)
          .padding({ left: 6, right: 6, top: 2, bottom: 2 })
      }
      .width('100%')
      .onClick(() => {
        this.activeClaim = r.claim;
      })
      ForEach(r.evidence, (e: AncientCaseEvidence) => {
        Text('· ' + this.evidenceText(e))
          .fontSize(10)
          .fontColor(this.evidenceZhi(e) !== '' && this.evidenceZhi(e) === this.focusZhi ? '#A63A2B' : '#4A3F32')
          .fontWeight(this.evidenceZhi(e) !== '' && this.evidenceZhi(e) === this.focusZhi ? FontWeight.Bold : FontWeight.Normal)
          .lineHeight(15)
          .width('100%')
          .textAlign(TextAlign.Start)
          .onClick(() => {
            this.activeClaim = r.claim;
            const z = this.evidenceZhi(e);
            if (z !== '') {
              this.setFocus(z, r.claim);
            }
          })
      }, (e: AncientCaseEvidence) => e.kind + e.ref + e.why)
      if (r.ruleRef) {
        Text('规则出处：' + r.ruleRef)
          .fontSize(9)
          .fontColor('#2F4A5F')
          .width('100%')
          .textAlign(TextAlign.Start)
      }
      if (r.note) {
        Text(r.note)
          .fontSize(9)
          .fontColor('#7A6A55')
          .lineHeight(14)
          .width('100%')
          .textAlign(TextAlign.Start)
      }
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
    .padding({ top: 6, bottom: 6, left: emphasis ? 8 : 0, right: emphasis ? 8 : 0 })
    .borderRadius(emphasis ? 10 : 0)
    .backgroundColor(emphasis ? 'rgba(166,58,43,0.08)' : '#00000000')
    .border({ width: { bottom: emphasis ? 0 : 1 }, color: 'rgba(166,58,43,0.15)' })
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
      Scroll() {
        Row({ space: 8 }) {
          ForEach(this.topicOptions(), (t: string) => {
            Text(t)
              .fontSize(10)
              .fontColor(this.topicFilter === t ? '#1A1410' : '#C4B183')
              .backgroundColor(this.topicFilter === t ? '#E9C878' : '#211E18')
              .borderRadius(12)
              .padding({ left: 10, right: 10, top: 5, bottom: 5 })
              .onClick(() => {
                this.topicFilter = t;
              })
          }, (t: string) => t)
        }
      }
      .scrollable(ScrollDirection.Horizontal)
      .scrollBar(BarState.Off)
      .width('100%')

      ForEach(this.groupNames(), (g: string) => {
        if (this.casesInGroup(g).length > 0) {
          Column({ space: 8 }) {
            Text(g)
              .fontSize(12)
              .fontWeight(FontWeight.Medium)
              .fontColor('#A8843C')
              .margin({ top: 4 })
            ForEach(this.casesInGroup(g), (c: AncientCase) => {
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
                Row({ space: 6 }) {
                  ForEach((c.topics ? c.topics : []), (t: string) => {
                    Text(t)
                      .fontSize(9)
                      .fontColor('#A63A2B')
                      .backgroundColor('rgba(166,58,43,0.10)')
                      .borderRadius(8)
                      .padding({ left: 6, right: 6, top: 2, bottom: 2 })
                  }, (t: string) => c.id + ':' + t)
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
        }
      }, (g: string) => g)
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
            this.closeDetail();
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
      if (c.routes && c.routes.length > 0) {
        Flex({ wrap: FlexWrap.Wrap }) {
          ForEach(c.routes, (r: string) => {
            Text(this.routeLabel(r))
              .fontSize(10)
              .fontColor('#F5EFE2')
              .backgroundColor(this.routeColor(r))
              .borderRadius(9)
              .padding({ left: 8, right: 8, top: 3, bottom: 3 })
              .margin({ right: 6, bottom: 6 })
          }, (r: string) => r)
        }
        .width('100%')
      }

      Column({ space: 6 }) {
        Text('原文断语')
          .fontSize(12)
          .fontColor('#2F4A5F')
        Text(c.original)
          .fontSize(13)
          .fontColor('#2B241B')
          .lineHeight(20)
      }
      .width('100%')
      .padding(12)
      .borderRadius(12)
      .backgroundColor('#F5EFE2')
      .border({ width: 1, color: 'rgba(166,58,43,0.25)' })

      if (this.chart) {
        Column({ space: 10 }) {
          Row() {
            Text('程序复算 · 专属盘例')
              .fontSize(12)
              .fontColor('#2F4A5F')
            Blank()
            Text('旬空 ' + (this.chart as Chart).dx.xunkong.join('') + ' · 日干' + (this.chart as Chart).dx.dayWangShuai)
              .fontSize(10)
              .fontColor('#6B5F45')
          }
          .width('100%')
          if (this.focusZhi !== '') {
            Row({ space: 6 }) {
              Text('锚点 ' + this.focusZhi + (this.focusLabel !== '' ? ' · ' + this.focusLabel : ''))
                .fontSize(10)
                .fontColor('#A63A2B')
                .layoutWeight(1)
                .maxLines(1)
                .textOverflow({ overflow: TextOverflow.Ellipsis })
              Text('清除')
                .fontSize(10)
                .fontColor('#F5EFE2')
                .backgroundColor('#A63A2B')
                .borderRadius(8)
                .padding({ left: 8, right: 8, top: 3, bottom: 3 })
                .onClick(() => {
                  this.clearFocus();
                })
            }
            .width('100%')
          }

          Column() {
            PanDisk({
              chart: this.chart as Chart,
              yongShen: this.focusZhi,
              cands: (this.cur && this.cur.focus && this.cur.focus.chuan) ? this.cur.focus.chuan as string[] : []
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
                shang: this.kegRows(this.chart as Chart)[0].keg.x, jiang: this.jiangOf(this.chart as Chart, this.kegRows(this.chart as Chart)[0].keg.x),
                highlight: this.focusZhi !== '' && (this.kegRows(this.chart as Chart)[0].keg.x === this.focusZhi || this.kegRows(this.chart as Chart)[0].keg.s === this.focusZhi) })
                .layoutWeight(1)
              KegCard({ kn: this.kegRows(this.chart as Chart)[1].kn, xia: this.kegRows(this.chart as Chart)[1].keg.s,
                shang: this.kegRows(this.chart as Chart)[1].keg.x, jiang: this.jiangOf(this.chart as Chart, this.kegRows(this.chart as Chart)[1].keg.x),
                highlight: this.focusZhi !== '' && (this.kegRows(this.chart as Chart)[1].keg.x === this.focusZhi || this.kegRows(this.chart as Chart)[1].keg.s === this.focusZhi) })
                .layoutWeight(1)
              KegCard({ kn: this.kegRows(this.chart as Chart)[2].kn, xia: this.kegRows(this.chart as Chart)[2].keg.s,
                shang: this.kegRows(this.chart as Chart)[2].keg.x, jiang: this.jiangOf(this.chart as Chart, this.kegRows(this.chart as Chart)[2].keg.x),
                highlight: this.focusZhi !== '' && (this.kegRows(this.chart as Chart)[2].keg.x === this.focusZhi || this.kegRows(this.chart as Chart)[2].keg.s === this.focusZhi) })
                .layoutWeight(1)
              KegCard({ kn: this.kegRows(this.chart as Chart)[3].kn, xia: this.kegRows(this.chart as Chart)[3].keg.s,
                shang: this.kegRows(this.chart as Chart)[3].keg.x, jiang: this.jiangOf(this.chart as Chart, this.kegRows(this.chart as Chart)[3].keg.x),
                highlight: this.focusZhi === '' || this.kegRows(this.chart as Chart)[3].keg.x === this.focusZhi || this.kegRows(this.chart as Chart)[3].keg.s === this.focusZhi })
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
                color: this.chuanRows(this.chart as Chart)[0].color, mark: this.markForZhi((this.chart as Chart).sanchuan.chuans[0].z),
                highlight: this.focusZhi === '' || (this.chart as Chart).sanchuan.chuans[0].z === this.focusZhi })
                .layoutWeight(1)
              ChuanCard({ pos: this.chuanRows(this.chart as Chart)[1].pos, gz: this.chuanRows(this.chart as Chart)[1].gz,
                jiang: this.chuanRows(this.chart as Chart)[1].jiang, lq: this.chuanRows(this.chart as Chart)[1].lq,
                color: this.chuanRows(this.chart as Chart)[1].color, mark: this.markForZhi((this.chart as Chart).sanchuan.chuans[1].z),
                highlight: this.focusZhi !== '' && (this.chart as Chart).sanchuan.chuans[1].z === this.focusZhi })
                .layoutWeight(1)
              ChuanCard({ pos: this.chuanRows(this.chart as Chart)[2].pos, gz: this.chuanRows(this.chart as Chart)[2].gz,
                jiang: this.chuanRows(this.chart as Chart)[2].jiang, lq: this.chuanRows(this.chart as Chart)[2].lq,
                color: this.chuanRows(this.chart as Chart)[2].color, mark: this.markForZhi((this.chart as Chart).sanchuan.chuans[2].z),
                highlight: this.focusZhi !== '' && (this.chart as Chart).sanchuan.chuans[2].z === this.focusZhi })
                .layoutWeight(1)
            }
            .width('100%')
          }
          .width('100%')
        }
        .width('100%')
        .padding(12)
        .borderRadius(12)
        .backgroundColor('#F5EFE2')
        .border({ width: 1, color: 'rgba(47,74,95,0.20)' })
      }

      if (this.ana) {
        Column({ space: 6 }) {
          Text('中黄先锋链路')
            .fontSize(12)
            .fontColor('#3E5C76')
          Text('时干' + (this.ana as ZhonghuangAnalyze).dun.shiGan + ' · 变干' + (this.ana as ZhonghuangAnalyze).dun.bianGan + '落' + (this.ana as ZhonghuangAnalyze).bianGong + '宫 · 六亲' + (this.ana as ZhonghuangAnalyze).bianLq + ' · ' + ((this.ana as ZhonghuangAnalyze).bianInChuan ? '入' + (this.ana as ZhonghuangAnalyze).bianInChuan : '不入三传'))
            .fontSize(11)
            .fontColor('#2B241B')
            .lineHeight(18)
          Text('中黄只作“时干→变干→落宫”的旁证链；若不改主断，此处明确标为参证。')
            .fontSize(9)
            .fontColor('#7A6A55')
            .lineHeight(14)
        }
        .width('100%')
        .padding(12)
        .borderRadius(12)
        .backgroundColor('#EEF3F6')
        .border({ width: 1, color: 'rgba(62,92,118,0.25)' })
      }

      if (c.reasoning && c.reasoning.length > 0) {
        Column({ space: 10 }) {
          Text('断语证据链')
            .fontSize(12)
            .fontColor('#A63A2B')
            .width('100%')
            .textAlign(TextAlign.Start)
          if (this.consensusCount(c) > 0) {
            Text('多链同断：' + this.consensusKeyword(c) + ' · 主链外另有 ' + String(this.consensusCount(c)) + ' 条佐证')
              .fontSize(10)
              .fontColor('#2F4A5F')
              .backgroundColor('rgba(47,74,95,0.10)')
              .borderRadius(8)
              .padding({ left: 8, right: 8, top: 4, bottom: 4 })
              .width('100%')
              .textAlign(TextAlign.Start)
          }
          if (this.consensusKeyword(c) !== '' && this.divergentReasoning(c).length > 0) {
            Text('异断对读：主断为「' + this.consensusKeyword(c) + '」，另有 ' + String(this.divergentReasoning(c).length) + ' 条落在其他占类，宜分列参看')
              .fontSize(10)
              .fontColor('#7A2E2E')
              .backgroundColor('rgba(122,46,46,0.10)')
              .borderRadius(8)
              .padding({ left: 8, right: 8, top: 4, bottom: 4 })
              .width('100%')
              .textAlign(TextAlign.Start)
          }
          if (this.mainReasoning(c)) {
            this.reasoningItem(this.mainReasoning(c) as AncientCaseReasoning, true)
          }

          if (this.reasoningByRole(c, 'support').length > 0) {
            Text('旁证 ' + String(this.reasoningByRole(c, 'support').length) + (this.showSupport ? ' · 收起' : ' · 展开'))
              .fontSize(11)
              .fontColor('#8A7B5C')
              .width('100%')
              .textAlign(TextAlign.Start)
              .onClick(() => {
                this.showSupport = !this.showSupport;
              })
            if (this.showSupport) {
              ForEach(this.reasoningByRole(c, 'support'), (r: AncientCaseReasoning) => {
                this.reasoningItem(r, false)
              }, (r: AncientCaseReasoning) => r.claim)
            }
          }

          if (this.reasoningByRole(c, 'timing').length > 0) {
            Text('应期 ' + String(this.reasoningByRole(c, 'timing').length) + (this.showTiming ? ' · 收起' : ' · 展开'))
              .fontSize(11)
              .fontColor('#2F4A5F')
              .width('100%')
              .textAlign(TextAlign.Start)
              .onClick(() => {
                this.showTiming = !this.showTiming;
              })
            if (this.showTiming) {
              ForEach(this.reasoningByRole(c, 'timing'), (r: AncientCaseReasoning) => {
                this.reasoningItem(r, false)
              }, (r: AncientCaseReasoning) => r.claim)
            }
          }

          if (this.reasoningByRole(c, 'risk').length > 0) {
            Text('风险/变局 ' + String(this.reasoningByRole(c, 'risk').length) + (this.showRisk ? ' · 收起' : ' · 展开'))
              .fontSize(11)
              .fontColor('#7A2E2E')
              .width('100%')
              .textAlign(TextAlign.Start)
              .onClick(() => {
                this.showRisk = !this.showRisk;
              })
            if (this.showRisk) {
              ForEach(this.reasoningByRole(c, 'risk'), (r: AncientCaseReasoning) => {
                this.reasoningItem(r, false)
              }, (r: AncientCaseReasoning) => r.claim)
            }
          }

          if (this.reasoningByRole(c, 'cross').length > 0) {
            Text('参证 ' + String(this.reasoningByRole(c, 'cross').length) + (this.showCross ? ' · 收起' : ' · 展开'))
              .fontSize(11)
              .fontColor('#3E5C76')
              .width('100%')
              .textAlign(TextAlign.Start)
              .onClick(() => {
                this.showCross = !this.showCross;
              })
            if (this.showCross) {
              ForEach(this.reasoningByRole(c, 'cross'), (r: AncientCaseReasoning) => {
                this.reasoningItem(r, false)
              }, (r: AncientCaseReasoning) => r.claim)
            }
          }
        }
        .width('100%')
        .alignItems(HorizontalAlign.Start)
        .padding(12)
        .borderRadius(12)
        .backgroundColor('#F5EFE2')
        .border({ width: 1, color: 'rgba(166,58,43,0.25)' })
      }

      Column({ space: 6 }) {
        Text('断法链路纲要')
          .fontSize(12)
          .fontColor('#2F4A5F')
          .width('100%')
          .textAlign(TextAlign.Start)
        ForEach(c.chain, (line: string, idx: number) => {
          Text(String(idx + 1) + '. ' + line)
            .fontSize(11)
            .fontColor('#2B241B')
            .lineHeight(18)
            .width('100%')
            .textAlign(TextAlign.Start)
        }, (line: string) => line)
      }
      .width('100%')
      .alignItems(HorizontalAlign.Start)
      .padding(12)
      .borderRadius(12)
      .backgroundColor('#F5EFE2')
      .border({ width: 1, color: 'rgba(47,74,95,0.20)' })

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

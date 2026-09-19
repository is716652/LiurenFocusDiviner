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

  private routeColor(r: string): ResourceColor {
    if (r === 'duxiang') {
      return $r('app.color.state_warn');
    }
    if (r === 'zhonghuang') {
      return '#3E5C76';
    }
    if (r === 'yongshen') {
      return '#33705E';
    }
    if (r === 'bifa') {
      return '#8A5A2B';
    }
    return $r('app.color.state_warn');
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

  /* 分组名由数据现推（不再把「甲子日/乙丑日…戊辰日」这类个案口径写死在代码里）。
     分组只用于展示分栏，不参与任何排盘判定。 */
  private groupNames(): string[] {
    const seen: string[] = [];
    for (let i = 0; i < this.cases.length; i++) {
      const g = this.groupOf(this.cases[i]);
      if (seen.indexOf(g) < 0) {
        seen.push(g);
      }
    }
    return seen;
  }

  /* 日柱标记：完全取自数据自带字段（source / title / chapter 里的「X日」），
     不做任何 id→日柱 的硬编码回填；都没有则归「其他」。 */
  private dayMarkOf(c: AncientCase): string {
    const pool: string = c.source + '|' + c.title + '|' + c.chapter;
    const m = /[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]日/.exec(pool);
    if (m !== null) {
      return m[0];
    }
    return '其他';
  }

  /* 归属：按数据自带的书目字段分流（不再按个案 id 片段特判具体课） */
  private groupOf(c: AncientCase): string {
    if (c.source.indexOf('中黄五变经') >= 0) {
      return '中黄五变经';
    }
    if (c.source.indexOf('六壬断案') >= 0) {
      return '六壬断案';
    }
    if (c.source.indexOf('壬占汇选') >= 0) {
      return '壬占汇选·' + this.dayMarkOf(c);
    }
    return '古籍案例鉴赏';
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

  private roleColor(role?: string): ResourceColor {
    if (role === 'main') { return '#A63A2B'; }
    if (role === 'timing') { return '#2F4A5F'; }
    if (role === 'risk') { return '#7A2E2E'; }
    if (role === 'cross') { return '#3E5C76'; }
    return '#5A4F3D';   /* 旁证标签底：须与浅色标签字 #F5EFE2 达到 4.5:1 */
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
      .fontSize($r('app.float.font_body_m'))
      .fontColor(active ? $r('app.color.ink_page') : $r('app.color.ink_text_muted'))
      .backgroundColor(active ? $r('app.color.accent_gold_fill') : $r('app.color.ink_surface'))
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
          .fontSize($r('app.float.font_caption_m'))
          .fontColor($r('app.color.ink_text_bright'))
          .backgroundColor(this.roleColor(r.role))
          .borderRadius(8)
          .padding({ left: 6, right: 6, top: 2, bottom: 2 })
        if (this.isDivergent(this.cur, r)) {
          Text('异断')
            .fontSize($r('app.float.font_caption_m'))
            .fontColor($r('app.color.ink_text_bright'))
            .backgroundColor('#2F4A5F')
            .borderRadius(8)
            .padding({ left: 6, right: 6, top: 2, bottom: 2 })
        }
        Text('断：' + r.claim)
          .fontSize(emphasis ? 13 : 12)
          .fontWeight(emphasis ? FontWeight.Bold : FontWeight.Medium)
          .fontColor(this.activeClaim === r.claim ? $r('app.color.state_warn') : $r('app.color.ink_sunken'))
          .layoutWeight(1)
        Text(this.routeLabel(r.route))
          .fontSize($r('app.float.font_caption_m'))
          .fontColor($r('app.color.ink_text_bright'))
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
          .fontSize($r('app.float.font_caption_l'))
          .fontColor(this.evidenceZhi(e) !== '' && this.evidenceZhi(e) === this.focusZhi ? $r('app.color.state_warn') : '#4A3F32')
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
          .fontSize($r('app.float.font_caption_m'))
          .fontColor('#2F4A5F')
          .width('100%')
          .textAlign(TextAlign.Start)
      }
      if (r.note) {
        Text(r.note)
          .fontSize($r('app.float.font_caption_m'))
          .fontColor($r('app.color.ink_hairline'))
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
        .fontSize($r('app.float.splash_sub'))
        .fontWeight(FontWeight.Bold)
        .fontColor($r('app.color.brand_gold_bright'))
      Text('古籍案例的程序化复原：课式校验、中黄先锋、断法链路')
        .fontSize($r('app.float.font_caption_l'))
        .fontColor($r('app.color.ink_text_secondary'))
      Scroll() {
        Row({ space: 8 }) {
          ForEach(this.topicOptions(), (t: string) => {
            Text(t)
              .fontSize($r('app.float.font_caption_l'))
              .fontColor(this.topicFilter === t ? $r('app.color.ink_page') : $r('app.color.ink_text_muted'))
              .backgroundColor(this.topicFilter === t ? $r('app.color.accent_gold_fill') : $r('app.color.ink_surface'))
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
              .fontSize($r('app.float.font_body_m'))
              .fontWeight(FontWeight.Medium)
              .fontColor($r('app.color.brand_gold_deep'))
              .margin({ top: 4 })
            ForEach(this.casesInGroup(g), (c: AncientCase) => {
              Column({ space: 5 }) {
                Row() {
                  Text(c.title)
                    .fontSize($r('app.float.font_subtitle_m'))
                    .fontWeight(FontWeight.Medium)
                    .fontColor($r('app.color.ink_text'))
                    .layoutWeight(1)
                  Text('›')
                    .fontSize(18)
                    .fontColor($r('app.color.ink_text_secondary'))
                }
                Row({ space: 6 }) {
                  ForEach((c.topics ? c.topics : []), (t: string) => {
                    Text(t)
                      .fontSize($r('app.float.font_caption_m'))
                      .fontColor('#E08A7A')
                      .backgroundColor('rgba(166,58,43,0.10)')
                      .borderRadius(8)
                      .padding({ left: 6, right: 6, top: 2, bottom: 2 })
                  }, (t: string) => c.id + ':' + t)
                }
                Text(c.source + ' · ' + c.chapter)
                  .fontSize($r('app.float.font_caption_l'))
                  .fontColor($r('app.color.brand_gold_deep'))
                Text(c.summary)
                  .fontSize($r('app.float.font_body_s'))
                  .fontColor($r('app.color.ink_text_secondary'))
                  .maxLines(2)
                  .textOverflow({ overflow: TextOverflow.Ellipsis })
              }
              .width('100%')
              .padding(12)
              .borderRadius(12)
              .backgroundColor($r('app.color.ink_card'))
              .border({ width: 1, color: $r('app.color.overlay_gold_weak') })
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
          .fontSize($r('app.float.font_body_m'))
          .fontColor($r('app.color.ink_text_muted'))
          .padding({ left: 10, right: 10, top: 5, bottom: 5 })
          .borderRadius(9)
          .backgroundColor($r('app.color.ink_surface'))
          .onClick(() => {
            this.closeDetail();
          })
        Blank()
        Text('研习样例')
          .fontSize($r('app.float.font_caption_l'))
          .fontColor($r('app.color.ink_text_secondary'))
      }
      Text(c.title)
        .fontSize($r('app.float.font_title_s'))
        .fontWeight(FontWeight.Bold)
        .fontColor($r('app.color.brand_gold_bright'))
      Text(c.source + ' · ' + c.chapter)
        .fontSize($r('app.float.font_caption_l'))
        .fontColor($r('app.color.brand_gold_deep'))
      if (c.routes && c.routes.length > 0) {
        Flex({ wrap: FlexWrap.Wrap }) {
          ForEach(c.routes, (r: string) => {
            Text(this.routeLabel(r))
              .fontSize($r('app.float.font_caption_l'))
              .fontColor($r('app.color.ink_text_bright'))
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
          .fontSize($r('app.float.font_body_m'))
          .fontColor('#2F4A5F')
        Text(c.original)
          .fontSize($r('app.float.fs_caption'))
          .fontColor($r('app.color.ink_sunken'))
          .lineHeight(20)
      }
      .width('100%')
      .padding(12)
      .borderRadius(12)
      .backgroundColor($r('app.color.case_paper'))
      .border({ width: 1, color: 'rgba(166,58,43,0.25)' })

      if (this.chart) {
        Column({ space: 10 }) {
          Row() {
            Text('程序复算 · 专属盘例')
              .fontSize($r('app.float.font_body_m'))
              .fontColor('#2F4A5F')
            Blank()
            Text('旬空 ' + (this.chart as Chart).dx.xunkong.join('') + ' · 日干' + (this.chart as Chart).dx.dayWangShuai) /* layout-ok: 旬空最多 2 支 + 日干旺衰 2 字，长度有界 */
              .fontSize($r('app.float.font_caption_l'))
              .fontColor($r('app.color.ink_hairline'))
          }
          .width('100%')
          if (this.focusZhi !== '') {
            Row({ space: 6 }) {
              Text('锚点 ' + this.focusZhi + (this.focusLabel !== '' ? ' · ' + this.focusLabel : ''))
                .fontSize($r('app.float.font_caption_l'))
                .fontColor($r('app.color.state_warn'))
                .layoutWeight(1)
                .maxLines(1)
                .textOverflow({ overflow: TextOverflow.Ellipsis })
              Text('清除')
                .fontSize($r('app.float.font_caption_l'))
                .fontColor($r('app.color.ink_text_bright'))
                .backgroundColor($r('app.color.state_warn'))
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
                .fontSize($r('app.float.fs_caption'))
                .fontWeight(FontWeight.Medium)
                .fontColor($r('app.color.ink_sunken'))
              Blank()
              Text('右起第一课 · 干上神')
                .fontSize($r('app.float.font_caption_m'))
                .fontColor($r('app.color.ink_hairline'))
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
                .fontSize($r('app.float.fs_caption'))
                .fontWeight(FontWeight.Medium)
                .fontColor($r('app.color.ink_sunken'))
                .layoutWeight(1)
              Blank()
              Text('九宗门')
                .fontSize($r('app.float.font_caption_m'))
                .fontColor($r('app.color.ink_hairline'))
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
        .backgroundColor($r('app.color.case_paper'))
        .border({ width: 1, color: 'rgba(47,74,95,0.20)' })
      }

      if (this.ana) {
        Column({ space: 6 }) {
          Text('中黄先锋链路')
            .fontSize($r('app.float.font_body_m'))
            .fontColor($r('app.color.accent_blue_deep'))
          Text('时干' + (this.ana as ZhonghuangAnalyze).dun.shiGan + ' · 变干' + (this.ana as ZhonghuangAnalyze).dun.bianGan + '落' + (this.ana as ZhonghuangAnalyze).bianGong + '宫 · 六亲' + (this.ana as ZhonghuangAnalyze).bianLq + ' · ' + ((this.ana as ZhonghuangAnalyze).bianInChuan ? '入' + (this.ana as ZhonghuangAnalyze).bianInChuan : '不入三传'))
            .fontSize($r('app.float.font_body_s'))
            .fontColor($r('app.color.ink_sunken'))
            .lineHeight(18)
          Text('中黄只作“时干→变干→落宫”的旁证链；若不改主断，此处明确标为参证。')
            .fontSize($r('app.float.font_caption_m'))
            .fontColor($r('app.color.ink_hairline'))
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
            .fontSize($r('app.float.font_body_m'))
            .fontColor($r('app.color.state_warn'))
            .width('100%')
            .textAlign(TextAlign.Start)
          if (this.consensusCount(c) > 0) {
            Text('多链同断：' + this.consensusKeyword(c) + ' · 主链外另有 ' + String(this.consensusCount(c)) + ' 条佐证')
              .fontSize($r('app.float.font_caption_l'))
              .fontColor('#2F4A5F')
              .backgroundColor('rgba(47,74,95,0.10)')
              .borderRadius(8)
              .padding({ left: 8, right: 8, top: 4, bottom: 4 })
              .width('100%')
              .textAlign(TextAlign.Start)
          }
          if (this.consensusKeyword(c) !== '' && this.divergentReasoning(c).length > 0) {
            Text('异断对读：主断为「' + this.consensusKeyword(c) + '」，另有 ' + String(this.divergentReasoning(c).length) + ' 条落在其他占类，宜分列参看')
              .fontSize($r('app.float.font_caption_l'))
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
              .fontSize($r('app.float.font_body_s'))
              .fontColor($r('app.color.ink_hairline'))
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
              .fontSize($r('app.float.font_body_s'))
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
              .fontSize($r('app.float.font_body_s'))
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
              .fontSize($r('app.float.font_body_s'))
              .fontColor($r('app.color.accent_blue_deep'))
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
        .backgroundColor($r('app.color.case_paper'))
        .border({ width: 1, color: 'rgba(166,58,43,0.25)' })
      }

      Column({ space: 6 }) {
        Text('断法链路纲要')
          .fontSize($r('app.float.font_body_m'))
          .fontColor('#2F4A5F')
          .width('100%')
          .textAlign(TextAlign.Start)
        ForEach(c.chain, (line: string, idx: number) => {
          Text(String(idx + 1) + '. ' + line)
            .fontSize($r('app.float.font_body_s'))
            .fontColor($r('app.color.ink_sunken'))
            .lineHeight(18)
            .width('100%')
            .textAlign(TextAlign.Start)
        }, (line: string) => line)
      }
      .width('100%')
      .alignItems(HorizontalAlign.Start)
      .padding(12)
      .borderRadius(12)
      .backgroundColor($r('app.color.case_paper'))
      .border({ width: 1, color: 'rgba(47,74,95,0.20)' })

      Text(c.compliance)
        .fontSize($r('app.float.font_caption_m'))
        .fontColor($r('app.color.ink_text_secondary'))
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
          .fontSize($r('app.float.font_body_m'))
          .fontColor($r('app.color.ink_text_secondary'))
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

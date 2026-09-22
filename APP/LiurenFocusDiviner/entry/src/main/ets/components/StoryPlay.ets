/**
 * StoryPlay —— 剧情演绎（收费块主入口）
 * ----------------------------------------------------------------------------
 * 两种体裁，同一套盘面底座：
 *   ① 古籍剧情（case_story.json）＝「一局多占」推演体（样板：韩太守占祈雪）
 *      卷宗 → 线索（点线索/点盘取证）→ 呈上断语 → 揭古断与应验
 *   ② 偶遇实盘（ouyu_cases.json）＝无占类、无可抓用神的一类（样板：地铁偶遇）
 *      现场 → 取象通道 → 逐链（L1 盘面事实／L2 古籍取象／L3 本人推断）→ 取象小结 → 不得引用的条
 *
 * 盘面：**不入库**，按案例输入现场复算（古籍用 buildChartAncient，偶遇用 buildChart）。
 * 锚点：两边同构（kind/ref/pos），共用一套「锚点 → 地支 → 盘面高亮」映射。
 * 合规：只做古籍断法复原与取象，不出现付费/解锁/会员字样；免责与出处遵守「挂一次」纪律。
 * 数据：免费版由 sync_free_edition 物理剔除两个 JSON → 本组件走空态。
 */
import type {
  AncientCase, StoryAnchor, StoryAsk, StoryCase, StoryClue,
  OuyuCase, OuyuLane, OuyuSceneType, OuyuStep, OuyuRefuse
} from '../model/DataLoader';
import { LiurenCore } from '../model/LiurenCore';
import type { Chart, Keg, DayRec, YueJiangSeg } from '../model/LiurenCore';
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
  color: ResourceColor;
}

/* 上架白名单**不写在这里**：它落在 rawfile/ancient/story_featured.json。
   理由有二：① 组件层不得写死个案 id（门禁 A1 硬项）；② 「上哪些案」属发布策略，
   属数据不属代码 —— 做一案只改 JSON，不动组件。 */
const ZHI_STR: string = '子丑寅卯辰巳午未申酉戌亥';

@Component
export struct StoryPlay {
  /* 数据由页面加载后传入；加载完成即不再变化（加载中不渲染本组件），故不做 @Prop 同步。
     注意：这些成员**不能加 private** —— ArkUI 禁止从组件构造函数初始化 private 成员，
     加了会被静默忽略（编译只报 WARN），页面数据就进不来。 */
  cases: AncientCase[] = [];
  stories: Record<string, StoryCase> = {};
  ouyu: OuyuCase[] = [];
  /* 上架白名单（来自 rawfile/ancient/story_featured.json）—— 组件不写死任何案 id */
  featured: string[] = [];
  yjAll: YueJiangSeg[] = [];
  calData: Record<string, DayRec[]> = {};
  /* 详情态双向同步给页面：页头返回/手势返回先回列表，而不是直接退出古籍页 */
  @Link @Watch('onOpenChange') detailOpen: boolean;

  @State private mode: string = 'list';
  @State private chart: Chart | null = null;
  @State private focusZhi: string = '';
  @State private focusLabel: string = '';
  @State private tip: string = '';
  /* 古籍剧情态 */
  @State private caseId: string = '';
  @State private askIdx: number = 0;
  @State private found: string[] = [];
  @State private openClue: string = '';
  @State private revealed: boolean = false;
  /* 偶遇实盘态 */
  @State private oyuIdx: number = -1;
  @State private oyuType: string = '';
  @State private oyuOpen: string = '';
  @State private oyuStepOpen: number = -1;
  @State private oyuShown: boolean = false;

  /* ============================ 数据查询 ============================ */

  /* 上架白名单（数据驱动）：只返回既在白名单、又确实有剧情的案 */
  private storyIds(): string[] {
    const out: string[] = [];
    for (const id of this.featured) {
      if (this.stories[id]) {
        out.push(id);
      }
    }
    return out;
  }

  private caseOf(id: string): AncientCase | null {
    for (const c of this.cases) {
      if (c.id === id) {
        return c;
      }
    }
    return null;
  }

  private storyOf(id: string): StoryCase | null {
    const s = this.stories[id];
    return s ? s : null;
  }

  private curAsk(): StoryAsk | null {
    const st = this.storyOf(this.caseId);
    if (!st || !st.asks || st.asks.length === 0) {
      return null;
    }
    const i = this.askIdx < st.asks.length ? this.askIdx : 0;
    return st.asks[i];
  }

  private curOuyu(): OuyuCase | null {
    if (this.oyuIdx < 0 || this.oyuIdx >= this.ouyu.length) {
      return null;
    }
    return this.ouyu[this.oyuIdx];
  }

  /* 偶遇结局三字段：统一在这里兜底（模板里不做可选链，避免 ArkTS 严格空检查报错） */
  private oyuEndTitle(): string {
    const o = this.curOuyu();
    if (!o || !o.ending || !o.ending.title) {
      return '取象小结';
    }
    return o.ending.title;
  }

  private oyuEndText(): string {
    const o = this.curOuyu();
    if (!o || !o.ending || !o.ending.text) {
      return '';
    }
    return this.cleanHint(o.ending.text);
  }

  private oyuEndNote(): string {
    const o = this.curOuyu();
    if (!o || !o.ending || !o.ending.note) {
      return '';
    }
    return o.ending.note;
  }

  /* 偶遇现场三字段（同理兜底） */
  private oyuWhy(): string {
    const o = this.curOuyu();
    return (o && o.why) ? o.why : '';
  }

  private oyuNote(): string {
    const o = this.curOuyu();
    return (o && o.note) ? o.note : '';
  }

  private oyuScene(): string[] {
    const o = this.curOuyu();
    return (o && o.scene) ? o.scene : [];
  }

  private oyuSceneTypes(): OuyuSceneType[] {
    const o = this.curOuyu();
    return (o && o.sceneTypes) ? o.sceneTypes : [];
  }

  private oyuRefuse(): OuyuRefuse[] {
    const o = this.curOuyu();
    return (o && o.refuse) ? o.refuse : [];
  }

  private hasAny(): boolean {
    return this.storyIds().length > 0 || this.ouyu.length > 0;
  }

  /* ============================ 锚点 → 盘面 ============================ */

  /* 从锚点 ref 取第一个地支（"巳/玄武" → 巳；"申/卯" → 申）；无地支返回空串 */
  private anchorZhi(a: StoryAnchor): string {
    const ref = a.ref ? a.ref : '';
    for (let i = 0; i < ref.length; i++) {
      const ch = ref.charAt(i);
      if (ZHI_STR.indexOf(ch) >= 0) {
        return ch;
      }
    }
    return '';
  }

  private anchorZhiList(anchors: StoryAnchor[]): string[] {
    const out: string[] = [];
    for (const a of anchors) {
      const z = this.anchorZhi(a);
      if (z !== '' && out.indexOf(z) < 0) {
        out.push(z);
      }
    }
    return out;
  }

  private setFocus(z: string, label: string): void {
    this.focusZhi = z;
    this.focusLabel = label;
  }

  private clearFocus(): void {
    this.focusZhi = '';
    this.focusLabel = '';
  }

  /* ============================ 盘面复算 ============================ */

  private buildAncientChart(c: AncientCase): Chart | null {
    const inp = c.input;
    return LiurenCore.buildChartAncient(
      inp.mj, inp.dg, inp.dz, inp.hour,
      inp.yearGan ? inp.yearGan : '',
      inp.yearZhi ? inp.yearZhi : '',
      inp.monthZhi ? inp.monthZhi : ''
    );
  }

  private buildOuyuChart(o: OuyuCase): Chart | null {
    return LiurenCore.buildChart({
      date: o.date,
      hourZhi: o.hour,
      calData: this.calData,
      yjAll: this.yjAll
    });
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
        color: (LiurenCore.JIANG_JX[jiang] === '吉') ? $r('app.color.brand_gold') : $r('app.color.brand_cinnabar')
      });
    }
    return out;
  }

  private chuanTitle(ch: Chart): string {
    const k = ch.sanchuan.keti;
    return k !== '' ? k : ch.sanchuan.method;
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

  /* ============================ 古籍剧情 ============================ */

  private openStory(id: string): void {
    const c = this.caseOf(id);
    if (!c) {
      return;
    }
    this.caseId = id;
    this.askIdx = 0;
    this.found = [];
    this.openClue = '';
    this.revealed = false;
    this.tip = '';
    this.clearFocus();
    this.chart = this.buildAncientChart(c);
    this.mode = 'ancient';
    this.detailOpen = true;
  }

  private switchAsk(i: number): void {
    this.askIdx = i;
    this.found = [];
    this.openClue = '';
    this.revealed = false;
    this.tip = '';
    this.clearFocus();
  }

  /* 点线索：高亮锚点、展开提示、记为已找到 */
  private pickClue(cl: StoryClue): void {
    const anchors = cl.anchors ? cl.anchors : [];
    const zs = this.anchorZhiList(anchors);
    if (zs.length > 0) {
      this.setFocus(zs[0], cl.label);
    } else {
      this.setFocus('', cl.label);
    }
    this.openClue = cl.id;
    if (this.found.indexOf(cl.id) < 0) {
      const next: string[] = this.found.slice();
      next.push(cl.id);
      this.found = next;
    }
    this.tip = '';
  }

  /* 点盘 / 点四课 / 点三传取证 —— 分两种体裁走：
     · 古籍剧情：命中某条**尚未找到**的线索 → 点亮它（展开提示 + 记入已得）；
     · 偶遇实盘：命中**当前可见取象通道**某一步的锚点 → 展开那条通道与那一步。
     都没命中就只移动焦点，并**明确告知"此处无可取之象"**（而不是静默无反应）。 */
  private onPickZhi(z: string, layer: string): void {
    if (this.mode === 'ouyu') {
      this.pickOuyuByZhi(z, layer);
      return;
    }
    const ask = this.curAsk();
    if (!ask || !ask.clues) {
      this.setFocus(z, layer);
      return;
    }
    for (const cl of ask.clues) {
      if (this.found.indexOf(cl.id) >= 0) {
        continue;
      }
      const zs = this.anchorZhiList(cl.anchors ? cl.anchors : []);
      if (zs.indexOf(z) >= 0) {
        this.pickClue(cl);
        return;
      }
    }
    this.setFocus(z, layer);
    this.tip = '「' + z + '」上暂无可取之象（或该线索已取过）—— 换个位置，或直接点上方的线索。';
  }

  /* 偶遇：点盘/点三传命中的是「取象链的某一步」—— 展开该通道与该步，并把盘面焦点移过去。
     只遍历**当前场景类型下可见**的通道，保证点到的就是屏幕上看得见的那几条。 */
  private pickOuyuByZhi(z: string, layer: string): void {
    const o = this.curOuyu();
    if (!o) {
      this.setFocus(z, layer);
      return;
    }
    let fallbackLane: string = '';
    let fallbackStep: number = -1;
    for (const l of this.visibleLanes(o)) {
      const chain = l.chain ? l.chain : [];
      for (let i = 0; i < chain.length; i++) {
        const step: OuyuStep = chain[i];
        /* ArkTS 的类型收窄比 TS 严格：三元结果不能直接当实参，先落到带类型标注的局部变量 */
        const stepAnchors: StoryAnchor[] = step.anchors ? step.anchors : [];
        const zs: string[] = this.anchorZhiList(stepAnchors);
        if (zs.indexOf(z) < 0) {
          continue;
        }
        /* 已展开的那一处先跳过，优先打开"还没看过的那一处"，免得反复点同一支只见同一处 */
        if (this.oyuOpen === l.id && this.oyuStepOpen === i) {
          if (fallbackLane === '') {
            fallbackLane = l.id;
            fallbackStep = i;
          }
          continue;
        }
        const label: string = step.onSite ? step.onSite : layer;
        this.oyuOpen = l.id;
        this.oyuStepOpen = i;
        this.setFocus(z, label);
        return;
      }
    }
    if (fallbackLane !== '') {
      this.oyuOpen = fallbackLane;
      this.oyuStepOpen = fallbackStep;
      this.setFocus(z, layer);
      return;
    }
    this.setFocus(z, layer);
    this.tip = '「' + z + '」上暂无可取之象 —— 换个位置，或换一类再看。';
  }

  private askClues(): StoryClue[] {
    const ask = this.curAsk();
    if (!ask || !ask.clues) {
      return [];
    }
    return ask.clues;
  }

  private allFound(): boolean {
    const list = this.askClues();
    if (list.length === 0) {
      return false;
    }
    for (const cl of list) {
      if (this.found.indexOf(cl.id) < 0) {
        return false;
      }
    }
    return true;
  }

  private reveal(): void {
    this.revealed = true;
    this.clearFocus();
    this.tip = '';
  }

  private endingOf(ask: StoryAsk): string {
    const e = ask.ending;
    if (!e) {
      return '';
    }
    if (e.text) {
      return e.text;
    }
    return '';
  }

  /* ============================ 偶遇实盘 ============================ */

  private openOuyu(i: number): void {
    this.oyuIdx = i;
    this.oyuType = 'shuobujhao';
    this.oyuOpen = '';
    this.oyuStepOpen = -1;
    this.oyuShown = false;
    this.tip = '';
    this.clearFocus();
    this.chart = this.buildOuyuChart(this.ouyu[i]);
    this.mode = 'ouyu';
    this.detailOpen = true;
  }

  private laneVisible(l: OuyuLane): boolean {
    const ft = l.forTypes ? l.forTypes : [];
    if (ft.length === 0) {
      return true;
    }
    if (this.oyuType === 'shuobujhao') {
      return true;
    }
    return ft.indexOf(this.oyuType) >= 0;
  }

  private visibleLanes(o: OuyuCase): OuyuLane[] {
    const out: OuyuLane[] = [];
    const ls = o.lanes ? o.lanes : [];
    for (const l of ls) {
      if (this.laneVisible(l)) {
        out.push(l);
      }
    }
    return out;
  }

  private openLane(l: OuyuLane): void {
    this.oyuOpen = (this.oyuOpen === l.id) ? '' : l.id;
    this.oyuStepOpen = -1;
    this.clearFocus();
  }

  private openStep(l: OuyuLane, i: number, s: OuyuStep): void {
    this.oyuStepOpen = (this.oyuStepOpen === i) ? -1 : i;
    const zs = this.anchorZhiList(s.anchors ? s.anchors : []);
    if (zs.length > 0) {
      this.setFocus(zs[0], s.onSite ? s.onSite : '');
    } else {
      this.clearFocus();
    }
  }

  private levelLabel(lv: string): string {
    if (lv === 'L1') {
      return 'L1 盘面事实';
    }
    if (lv === 'L2') {
      return 'L2 古籍取象';
    }
    if (lv === 'L3') {
      return 'L3 本人推断';
    }
    return lv;
  }

  private levelColor(lv: string): ResourceColor {
    if (lv === 'L1') {
      return $r('app.color.case_blue_deep');
    }
    if (lv === 'L2') {
      return $r('app.color.accent_brown');
    }
    return $r('app.color.state_warn');
  }

  private cleanHint(s: string): string {
    return s.replace(/\*\*/g, '');
  }

  private onOpenChange(): void {
    if (!this.detailOpen && this.mode !== 'list') {
      this.backToList();
    }
  }

  private backToList(): void {
    this.mode = 'list';
    this.chart = null;
    this.caseId = '';
    this.oyuIdx = -1;
    this.found = [];
    this.openClue = '';
    this.revealed = false;
    this.oyuOpen = '';
    this.oyuStepOpen = -1;
    this.tip = '';
    this.clearFocus();
    this.detailOpen = false;
  }

  /* ============================ 视图 ============================ */

  @Builder
  clueItem(cl: StoryClue, idx: number) {
    Column({ space: 6 }) {
      Row({ space: 8 }) {
        Text(this.found.indexOf(cl.id) >= 0 ? '✓' : String(idx + 1))
          .fontSize($r('app.float.font_caption_l'))
          .fontColor(this.found.indexOf(cl.id) >= 0 ? $r('app.color.ink_page') : $r('app.color.ink_text_muted'))
          .backgroundColor(this.found.indexOf(cl.id) >= 0 ? $r('app.color.accent_gold_fill') : $r('app.color.ink_surface'))
          .borderRadius(9)
          .width(20)
          .height(20)
          .textAlign(TextAlign.Center)
        Text(cl.label)
          .fontSize($r('app.float.font_caption_l'))
          .fontColor($r('app.color.ink_sunken'))
          .layoutWeight(1)
      }
      .width('100%')
      if (cl.small) {
        Text(cl.small)
          .fontSize($r('app.float.font_caption_m'))
          .fontColor($r('app.color.ink_text_paper_muted'))
          .width('100%')
      }
      if (this.openClue === cl.id && cl.hint) {
        Text(this.cleanHint(cl.hint))
          .fontSize($r('app.float.fs_caption'))
          .fontColor($r('app.color.ink_sunken'))
          .lineHeight(20)
          .width('100%')
      }
    }
    .width('100%')
    .padding(10)
    .borderRadius(10)
    .backgroundColor($r('app.color.case_paper'))
    .border({ width: 1, color: this.openClue === cl.id ? $r('app.color.brand_gold') : $r('app.color.case_red_wash_25') })
    .onClick(() => {
      this.pickClue(cl);
    })
  }

  @Builder
  chartBlock() {
    if (this.chart) {
      Column({ space: 10 }) {
        Row() {
          Text('程序复算 · 专属盘例')
            .fontSize($r('app.float.font_body_m'))
            .fontColor($r('app.color.case_blue_deep'))
          Blank()
          Text('旬空 ' + (this.chart as Chart).dx.xunkong.join('') + ' · 日干' + (this.chart as Chart).dx.dayWangShuai) /* layout-ok: 旬空最多 2 支 + 旺衰 2 字，长度有界 */
            .fontSize($r('app.float.font_caption_l'))
            .fontColor($r('app.color.ink_text_paper_muted'))
        }
        .width('100%')
        if (this.focusZhi !== '' || this.focusLabel !== '') {
          Row({ space: 6 }) {
            Text('取象 ' + this.focusZhi + (this.focusLabel !== '' ? ' · ' + this.focusLabel : ''))
              .fontSize($r('app.float.font_caption_l'))
              .fontColor($r('app.color.state_warn'))
              .layoutWeight(1)
              .maxLines(2)
              .textOverflow({ overflow: TextOverflow.Ellipsis })
            Text('清除')
              .fontSize($r('app.float.font_caption_l'))
              .fontColor($r('app.color.ink_on_deep_text'))
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
            cands: [],
            onPickZhi: (z: string, layer: string) => {
              this.onPickZhi(z, layer);
            }
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
              .fontColor($r('app.color.ink_text_paper_muted'))
          }
          .width('100%')
          Row({ space: 8 }) {
            KegCard({ kn: this.kegRows(this.chart as Chart)[0].kn, xia: this.kegRows(this.chart as Chart)[0].keg.s,
              shang: this.kegRows(this.chart as Chart)[0].keg.x, jiang: this.jiangOf(this.chart as Chart, this.kegRows(this.chart as Chart)[0].keg.x),
              highlight: this.focusZhi !== '' && (this.kegRows(this.chart as Chart)[0].keg.x === this.focusZhi || this.kegRows(this.chart as Chart)[0].keg.s === this.focusZhi),
              onTap: () => { this.onPickZhi(this.kegRows(this.chart as Chart)[0].keg.x, '四课'); } })
              .layoutWeight(1)
            KegCard({ kn: this.kegRows(this.chart as Chart)[1].kn, xia: this.kegRows(this.chart as Chart)[1].keg.s,
              shang: this.kegRows(this.chart as Chart)[1].keg.x, jiang: this.jiangOf(this.chart as Chart, this.kegRows(this.chart as Chart)[1].keg.x),
              highlight: this.focusZhi !== '' && (this.kegRows(this.chart as Chart)[1].keg.x === this.focusZhi || this.kegRows(this.chart as Chart)[1].keg.s === this.focusZhi),
              onTap: () => { this.onPickZhi(this.kegRows(this.chart as Chart)[1].keg.x, '四课'); } })
              .layoutWeight(1)
            KegCard({ kn: this.kegRows(this.chart as Chart)[2].kn, xia: this.kegRows(this.chart as Chart)[2].keg.s,
              shang: this.kegRows(this.chart as Chart)[2].keg.x, jiang: this.jiangOf(this.chart as Chart, this.kegRows(this.chart as Chart)[2].keg.x),
              highlight: this.focusZhi !== '' && (this.kegRows(this.chart as Chart)[2].keg.x === this.focusZhi || this.kegRows(this.chart as Chart)[2].keg.s === this.focusZhi),
              onTap: () => { this.onPickZhi(this.kegRows(this.chart as Chart)[2].keg.x, '四课'); } })
              .layoutWeight(1)
            KegCard({ kn: this.kegRows(this.chart as Chart)[3].kn, xia: this.kegRows(this.chart as Chart)[3].keg.s,
              shang: this.kegRows(this.chart as Chart)[3].keg.x, jiang: this.jiangOf(this.chart as Chart, this.kegRows(this.chart as Chart)[3].keg.x),
              highlight: this.focusZhi !== '' && (this.kegRows(this.chart as Chart)[3].keg.x === this.focusZhi || this.kegRows(this.chart as Chart)[3].keg.s === this.focusZhi),
              onTap: () => { this.onPickZhi(this.kegRows(this.chart as Chart)[3].keg.x, '四课'); } })
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
              .fontColor($r('app.color.ink_text_paper_muted'))
          }
          .width('100%')
          Row({ space: 8 }) {
            ChuanCard({ pos: this.chuanRows(this.chart as Chart)[0].pos, gz: this.chuanRows(this.chart as Chart)[0].gz,
              jiang: this.chuanRows(this.chart as Chart)[0].jiang, lq: this.chuanRows(this.chart as Chart)[0].lq,
              color: this.chuanRows(this.chart as Chart)[0].color, mark: '',
              highlight: this.focusZhi !== '' && (this.chart as Chart).sanchuan.chuans[0].z === this.focusZhi,
              onTap: () => { this.onPickZhi((this.chart as Chart).sanchuan.chuans[0].z, '三传'); } })
              .layoutWeight(1)
            ChuanCard({ pos: this.chuanRows(this.chart as Chart)[1].pos, gz: this.chuanRows(this.chart as Chart)[1].gz,
              jiang: this.chuanRows(this.chart as Chart)[1].jiang, lq: this.chuanRows(this.chart as Chart)[1].lq,
              color: this.chuanRows(this.chart as Chart)[1].color, mark: '',
              highlight: this.focusZhi !== '' && (this.chart as Chart).sanchuan.chuans[1].z === this.focusZhi,
              onTap: () => { this.onPickZhi((this.chart as Chart).sanchuan.chuans[1].z, '三传'); } })
              .layoutWeight(1)
            ChuanCard({ pos: this.chuanRows(this.chart as Chart)[2].pos, gz: this.chuanRows(this.chart as Chart)[2].gz,
              jiang: this.chuanRows(this.chart as Chart)[2].jiang, lq: this.chuanRows(this.chart as Chart)[2].lq,
              color: this.chuanRows(this.chart as Chart)[2].color, mark: '',
              highlight: this.focusZhi !== '' && (this.chart as Chart).sanchuan.chuans[2].z === this.focusZhi,
              onTap: () => { this.onPickZhi((this.chart as Chart).sanchuan.chuans[2].z, '三传'); } })
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
    }
  }

  @Builder
  listView() {
    Scroll() {
      Column({ space: 12 }) {
        Text('剧情演绎')
          .fontSize($r('app.float.font_title_s'))
          .fontWeight(FontWeight.Bold)
          .fontColor($r('app.color.brand_gold_bright'))
          .width('100%')
        Text('两类做法各不一样：古人有断例，可循其推导链复盘；今人现场无断，只能取象。')
          .fontSize($r('app.float.font_caption_l'))
          .fontColor($r('app.color.ink_text_muted'))
          .width('100%')

        if (!this.hasAny()) {
          Column({ space: 8 }) {
            Text('剧情数据未随包提供')
              .fontSize($r('app.float.font_body_m'))
              .fontColor($r('app.color.ink_text_muted'))
          }
          .width('100%')
          .padding(20)
          .borderRadius(12)
          .backgroundColor($r('app.color.ink_surface'))
        }

        ForEach(this.storyIds(), (id: string) => {
          Column({ space: 8 }) {
            Row() {
              Text('古籍剧情 · 一局多占')
                .fontSize($r('app.float.font_caption_l'))
                .fontColor($r('app.color.case_blue_deep'))
                .backgroundColor($r('app.color.case_paper'))
                .borderRadius(9)
                .padding({ left: 8, right: 8, top: 3, bottom: 3 })
              Blank()
            }
            .width('100%')
            Text(this.storyOf(id) ? (this.storyOf(id) as StoryCase).asks[0].title : id)
              .fontSize($r('app.float.font_subtitle_m'))
              .fontWeight(FontWeight.Medium)
              .fontColor($r('app.color.ink_text_bright'))
              .width('100%')
            Text(this.caseOf(id) ? (this.caseOf(id) as AncientCase).title : '')
              .fontSize($r('app.float.font_caption_m'))
              .fontColor($r('app.color.brand_gold_deep'))
              .width('100%')
            Text(this.storyOf(id) && (this.storyOf(id) as StoryCase).brief ? (this.storyOf(id) as StoryCase).brief : '')
              .fontSize($r('app.float.font_caption_l'))
              .fontColor($r('app.color.ink_text_secondary'))
              .maxLines(4)
              .textOverflow({ overflow: TextOverflow.Ellipsis })
              .width('100%')
          }
          .width('100%')
          .padding(12)
          .borderRadius(12)
          .backgroundColor($r('app.color.ink_surface'))
          .border({ width: 1, color: $r('app.color.case_red_wash_25') })
          .onClick(() => {
            this.openStory(id);
          })
        }, (id: string) => id)

        ForEach(this.ouyu, (o: OuyuCase, i: number) => {
          Column({ space: 8 }) {
            Row() {
              Text('偶遇实盘 · 只取象')
                .fontSize($r('app.float.font_caption_l'))
                .fontColor($r('app.color.accent_brown'))
                .backgroundColor($r('app.color.case_paper'))
                .borderRadius(9)
                .padding({ left: 8, right: 8, top: 3, bottom: 3 })
              Blank()
            }
            .width('100%')
            Text(o.title)
              .fontSize($r('app.float.font_subtitle_m'))
              .fontWeight(FontWeight.Medium)
              .fontColor($r('app.color.ink_text_bright'))
              .width('100%')
            Text(o.place + ' · ' + o.when)
              .fontSize($r('app.float.font_caption_m'))
              .fontColor($r('app.color.brand_gold_deep'))
              .width('100%')
            Text(o.why ? o.why : '')
              .fontSize($r('app.float.font_caption_l'))
              .fontColor($r('app.color.ink_text_secondary'))
              .maxLines(4)
              .textOverflow({ overflow: TextOverflow.Ellipsis })
              .width('100%')
          }
          .width('100%')
          .padding(12)
          .borderRadius(12)
          .backgroundColor($r('app.color.ink_surface'))
          .border({ width: 1, color: $r('app.color.case_red_wash_25') })
          .onClick(() => {
            this.openOuyu(i);
          })
        }, (o: OuyuCase) => o.id)

        Text('以上皆为古籍断法复原与取象整理，供传统文化与算法研习参考。')
          .fontSize($r('app.float.font_caption_m'))
          .fontColor($r('app.color.ink_text_muted'))
          .width('100%')
      }
      .width('100%')
      .padding(16)
      /* 内容不足一屏时也必须靠上：Scroll 默认把不足一屏的内容垂直居中，
         两张卡时就会"浮"在屏幕中间。故显式撑满高度 + 给 Scroll 置顶。 */
      .constraintSize({ minHeight: '100%' })
    }
    .width('100%')
    .layoutWeight(1)
    .align(Alignment.TopStart)
    .scrollBar(BarState.Off)
  }

  @Builder
  ancientView() {
    if (this.curAsk() && this.storyOf(this.caseId)) {
      Scroll() {
        Column({ space: 12 }) {
          Row() {
            Text('‹ 剧情列表')
              .fontSize($r('app.float.font_body_m'))
              .fontColor($r('app.color.ink_text_muted'))
              .padding({ left: 10, right: 10, top: 5, bottom: 5 })
              .borderRadius(9)
              .backgroundColor($r('app.color.ink_surface'))
              .onClick(() => {
                this.backToList();
              })
            Blank()
            Text('古籍剧情')
              .fontSize($r('app.float.font_caption_l'))
              .fontColor($r('app.color.ink_text_secondary'))
          }
          .width('100%')

          Column({ space: 6 }) {
            Text(this.caseOf(this.caseId) ? (this.caseOf(this.caseId) as AncientCase).title : '')
              .fontSize($r('app.float.font_title_s'))
              .fontWeight(FontWeight.Bold)
              .fontColor($r('app.color.case_blue_deep'))
            Text(this.storyOf(this.caseId) && (this.storyOf(this.caseId) as StoryCase).brief ? (this.storyOf(this.caseId) as StoryCase).brief : '')
              .fontSize($r('app.float.font_caption_l'))
              .fontColor($r('app.color.ink_sunken'))
              .lineHeight(20)
          }
          .width('100%')
          .padding(12)
          .borderRadius(12)
          .backgroundColor($r('app.color.case_paper'))

          Row({ space: 8 }) {
            ForEach((this.storyOf(this.caseId) as StoryCase).asks, (a: StoryAsk, i: number) => {
              Text(a.title)
                .fontSize($r('app.float.font_caption_l'))
                .fontColor(this.askIdx === i ? $r('app.color.ink_page') : $r('app.color.ink_text_muted'))
                .backgroundColor(this.askIdx === i ? $r('app.color.accent_gold_fill') : $r('app.color.ink_surface'))
                .borderRadius(12)
                .padding({ left: 10, right: 10, top: 5, bottom: 5 })
                .onClick(() => {
                  this.switchAsk(i);
                })
            }, (a: StoryAsk) => a.id)
          }
          .width('100%')

          Column({ space: 6 }) {
            Text((this.curAsk() as StoryAsk).intro ? (this.curAsk() as StoryAsk).intro as string : '')
              .fontSize($r('app.float.font_caption_l'))
              .fontColor($r('app.color.ink_text_secondary'))
            Text((this.curAsk() as StoryAsk).question ? (this.curAsk() as StoryAsk).question as string : '')
              .fontSize($r('app.float.font_body_m'))
              .fontColor($r('app.color.ink_text_bright'))
          }
          .width('100%')
          .padding(12)
          .borderRadius(12)
          .backgroundColor($r('app.color.ink_surface'))

          if (!this.revealed) {
            Text('依次点开下面的线索（也可直接点盘上对应之处），盘面会随之高亮。')
              .fontSize($r('app.float.font_caption_m'))
              .fontColor($r('app.color.ink_text_muted'))
              .width('100%')
            Column({ space: 8 }) {
              ForEach(this.askClues(), (cl: StoryClue, i: number) => {
                this.clueItem(cl, i)
              }, (cl: StoryClue) => cl.id)
            }
            .width('100%')

            Row() {
              Text(this.allFound() ? '线索已齐 · 呈上断语' : '已得 ' + String(this.found.length) + ' / ' + String(this.askClues().length) + ' 条线索')
                .fontSize($r('app.float.font_body_m'))
                .fontColor(this.allFound() ? $r('app.color.ink_page') : $r('app.color.ink_text_muted'))
                .backgroundColor(this.allFound() ? $r('app.color.accent_gold_fill') : $r('app.color.ink_surface'))
                .borderRadius(12)
                .padding({ left: 16, right: 16, top: 9, bottom: 9 })
                .onClick(() => {
                  if (this.allFound()) {
                    this.reveal();
                  } else {
                    this.tip = '先把线索逐条点开，再看古人怎么断。';
                  }
                })
            }
            .width('100%')
            .justifyContent(FlexAlign.Center)

            if (this.tip !== '') {
              Text(this.tip)
                .fontSize($r('app.float.font_caption_l'))
                .fontColor($r('app.color.brand_gold_bright'))
                .width('100%')
            }
          }

          this.chartBlock()

          if (this.revealed) {
            Column({ space: 8 }) {
              Text(this.endingOf(this.curAsk() as StoryAsk) !== '' ? '取象小结' : '古断与应验')
                .fontSize($r('app.float.font_body_m'))
                .fontColor($r('app.color.case_blue_deep'))
              if (this.endingOf(this.curAsk() as StoryAsk) !== '') {
                Text(this.endingOf(this.curAsk() as StoryAsk))
                  .fontSize($r('app.float.fs_caption'))
                  .fontColor($r('app.color.ink_sunken'))
                  .lineHeight(20)
              } else {
                Text(this.caseOf(this.caseId) ? (this.caseOf(this.caseId) as AncientCase).original : '')
                  .fontSize($r('app.float.fs_caption'))
                  .fontColor($r('app.color.ink_sunken'))
                  .lineHeight(20)
              }
            }
            .width('100%')
            .padding(12)
            .borderRadius(12)
            .backgroundColor($r('app.color.case_paper'))
            .border({ width: 1, color: $r('app.color.case_red_wash_25') })

            Row({ space: 12 }) {
              Text('重看本支线')
                .fontSize($r('app.float.font_caption_l'))
                .fontColor($r('app.color.ink_text_muted'))
                .backgroundColor($r('app.color.ink_surface'))
                .borderRadius(10)
                .padding({ left: 12, right: 12, top: 6, bottom: 6 })
                .onClick(() => {
                  this.switchAsk(this.askIdx);
                })
              Text('换一条支线')
                .fontSize($r('app.float.font_caption_l'))
                .fontColor($r('app.color.ink_text_muted'))
                .backgroundColor($r('app.color.ink_surface'))
                .borderRadius(10)
                .padding({ left: 12, right: 12, top: 6, bottom: 6 })
                .onClick(() => {
                  const total = (this.storyOf(this.caseId) as StoryCase).asks.length;
                  this.switchAsk((this.askIdx + 1) % total);
                })
            }
            .width('100%')
          }
        }
        .width('100%')
        .padding(16)
        /* 同列表页：内容不足一屏也靠上（Scroll 默认垂直居中） */
        .constraintSize({ minHeight: '100%' })
      }
      .width('100%')
      .layoutWeight(1)
      .align(Alignment.TopStart)
      .scrollBar(BarState.Off)
    }
  }

  @Builder
  ouyuView() {
    if (this.curOuyu()) {
      Scroll() {
        Column({ space: 12 }) {
          Row() {
            Text('‹ 剧情列表')
              .fontSize($r('app.float.font_body_m'))
              .fontColor($r('app.color.ink_text_muted'))
              .padding({ left: 10, right: 10, top: 5, bottom: 5 })
              .borderRadius(9)
              .backgroundColor($r('app.color.ink_surface'))
              .onClick(() => {
                this.backToList();
              })
            Blank()
            Text('偶遇实盘')
              .fontSize($r('app.float.font_caption_l'))
              .fontColor($r('app.color.ink_text_secondary'))
          }
          .width('100%')

          Column({ space: 6 }) {
            Text((this.curOuyu() as OuyuCase).title)
              .fontSize($r('app.float.font_title_s'))
              .fontWeight(FontWeight.Bold)
              .fontColor($r('app.color.case_blue_deep'))
            Text((this.curOuyu() as OuyuCase).place + ' · ' + (this.curOuyu() as OuyuCase).when)
              .fontSize($r('app.float.font_caption_l'))
              .fontColor($r('app.color.case_blue_deep'))
            Text(this.oyuWhy())
              .fontSize($r('app.float.font_caption_l'))
              .fontColor($r('app.color.ink_sunken'))
              .lineHeight(20)
            ForEach(this.oyuScene(), (s: string) => {
              Text('· ' + s)
                .fontSize($r('app.float.font_caption_l'))
                .fontColor($r('app.color.ink_text_paper_muted'))
                .width('100%')
            }, (s: string) => s)
            Text(this.oyuNote())
              .fontSize($r('app.float.font_caption_m'))
              .fontColor($r('app.color.ink_text_paper_muted'))
          }
          .width('100%')
          .padding(12)
          .borderRadius(12)
          .backgroundColor($r('app.color.case_paper'))

          Text('这一占属于哪一类？（换一类，取的象就不同）')
            .fontSize($r('app.float.font_caption_m'))
            .fontColor($r('app.color.ink_text_muted'))
            .width('100%')
          Flex({ wrap: FlexWrap.Wrap }) {
            ForEach(this.oyuSceneTypes(), (t: OuyuSceneType) => {
              Text(t.label)
                .fontSize($r('app.float.font_caption_l'))
                .fontColor(this.oyuType === t.id ? $r('app.color.ink_page') : $r('app.color.ink_text_muted'))
                .backgroundColor(this.oyuType === t.id ? $r('app.color.accent_gold_fill') : $r('app.color.ink_surface'))
                .borderRadius(12)
                .padding({ left: 10, right: 10, top: 5, bottom: 5 })
                .margin({ right: 6, bottom: 6 })
                .onClick(() => {
                  this.oyuType = t.id;
                  this.oyuOpen = '';
                  this.oyuStepOpen = -1;
                  this.clearFocus();
                })
            }, (t: OuyuSceneType) => t.id)
          }
          .width('100%')

          Text('点盘上某处、或点三传／四课，命中的取象会自动展开；也可直接点下面的通道。')
            .fontSize($r('app.float.font_caption_m'))
            .fontColor($r('app.color.ink_text_muted'))
            .width('100%')
          if (this.tip !== '') {
            Text(this.tip)
              .fontSize($r('app.float.font_caption_l'))
              .fontColor($r('app.color.brand_gold_bright'))
              .width('100%')
          }

          Column({ space: 10 }) {
            ForEach(this.visibleLanes(this.curOuyu() as OuyuCase), (l: OuyuLane) => {
              Column({ space: 6 }) {
                Row({ space: 6 }) {
                  Text(l.title)
                    .fontSize($r('app.float.font_body_m'))
                    .fontColor($r('app.color.ink_text_bright'))
                    .layoutWeight(1)
                  Text(this.oyuOpen === l.id ? '收起' : '展开')
                    .fontSize($r('app.float.font_caption_m'))
                    .fontColor($r('app.color.ink_text_muted'))
                }
                .width('100%')
                if (l.ask) {
                  Text(l.ask)
                    .fontSize($r('app.float.font_caption_l'))
                    .fontColor($r('app.color.ink_text_secondary'))
                    .width('100%')
                }
                if (this.oyuOpen === l.id) {
                  ForEach(l.chain ? l.chain : [], (s: OuyuStep, i: number) => {
                    Column({ space: 6 }) {
                      Row({ space: 6 }) {
                        Text(this.levelLabel(s.level ? s.level : ''))
                          .fontSize($r('app.float.font_caption_m'))
                          .fontColor($r('app.color.ink_on_deep_text'))
                          .backgroundColor(this.levelColor(s.level ? s.level : ''))
                          .borderRadius(8)
                          .padding({ left: 6, right: 6, top: 2, bottom: 2 })
                        Text(s.onSite ? s.onSite : '')
                          .fontSize($r('app.float.font_caption_l'))
                          .fontColor($r('app.color.ink_sunken'))
                          .layoutWeight(1)
                      }
                      .width('100%')
                      if (this.oyuStepOpen === i) {
                        Text(this.cleanHint(s.hint ? s.hint : ''))
                          .fontSize($r('app.float.fs_caption'))
                          .fontColor($r('app.color.ink_sunken'))
                          .lineHeight(20)
                          .width('100%')
                        if (s.cite) {
                          Text('出处：' + s.cite)
                            .fontSize($r('app.float.font_caption_m'))
                            .fontColor($r('app.color.ink_text_paper_muted'))
                            .width('100%')
                        }
                      }
                    }
                    .width('100%')
                    .padding(8)
                    .borderRadius(9)
                    .backgroundColor($r('app.color.case_paper'))
                    .onClick(() => {
                      this.openStep(l, i, s);
                    })
                  }, (s: OuyuStep) => l.id + '_' + s.id)
                }
              }
              .width('100%')
              .padding(10)
              .borderRadius(10)
              .backgroundColor($r('app.color.ink_surface'))
              .border({ width: 1, color: $r('app.color.case_red_wash_25') })
              .onClick(() => {
                this.openLane(l);
              })
            }, (l: OuyuLane) => l.id)
          }
          .width('100%')

          this.chartBlock()

          Row() {
            Text(this.oyuShown ? '收起小结' : '看取象小结')
              .fontSize($r('app.float.font_body_m'))
              .fontColor($r('app.color.ink_page'))
              .backgroundColor($r('app.color.accent_gold_fill'))
              .borderRadius(12)
              .padding({ left: 16, right: 16, top: 9, bottom: 9 })
              .onClick(() => {
                this.oyuShown = !this.oyuShown;
                this.clearFocus();
              })
          }
          .width('100%')
          .justifyContent(FlexAlign.Center)

          if (this.oyuShown) {
            Column({ space: 8 }) {
              Text(this.oyuEndTitle())
                .fontSize($r('app.float.font_body_m'))
                .fontColor($r('app.color.case_blue_deep'))
              Text(this.oyuEndText())
                .fontSize($r('app.float.fs_caption'))
                .fontColor($r('app.color.ink_sunken'))
                .lineHeight(20)
              Text(this.oyuEndNote())
                .fontSize($r('app.float.font_caption_m'))
                .fontColor($r('app.color.ink_text_paper_muted'))
                .width('100%')
            }
            .width('100%')
            .padding(12)
            .borderRadius(12)
            .backgroundColor($r('app.color.case_paper'))
            .border({ width: 1, color: $r('app.color.case_red_wash_25') })

            if (this.oyuRefuse().length > 0) {
              Column({ space: 6 }) {
                Text('看着最配、却不能用')
                  .fontSize($r('app.float.font_body_m'))
                  .fontColor($r('app.color.brand_gold_bright'))
                ForEach(this.oyuRefuse(), (r: OuyuRefuse) => {
                  Column({ space: 4 }) {
                    Text(r.title)
                      .fontSize($r('app.float.font_caption_l'))
                      .fontColor($r('app.color.ink_text_bright'))
                    Text(r.why)
                      .fontSize($r('app.float.font_caption_m'))
                      .fontColor($r('app.color.ink_text_muted'))
                      .lineHeight(18)
                  }
                  .width('100%')
                }, (r: OuyuRefuse) => r.title)
              }
              .width('100%')
              .padding(12)
              .borderRadius(12)
              .backgroundColor($r('app.color.ink_surface'))
            }
          }

          Text('偶遇之占：只取象，不下断；不涉当事人身份、职业或意图。')
            .fontSize($r('app.float.font_caption_m'))
            .fontColor($r('app.color.ink_text_muted'))
            .width('100%')
        }
        .width('100%')
        .padding(16)
        /* 同列表页：内容不足一屏也靠上（Scroll 默认垂直居中） */
        .constraintSize({ minHeight: '100%' })
      }
      .width('100%')
      .layoutWeight(1)
      .align(Alignment.TopStart)
      .scrollBar(BarState.Off)
    }
  }

  build() {
    Column() {
      if (this.mode === 'ancient') {
        this.ancientView()
      } else if (this.mode === 'ouyu') {
        this.ouyuView()
      } else {
        this.listView()
      }
    }
    .width('100%')
    .layoutWeight(1)
  }
}

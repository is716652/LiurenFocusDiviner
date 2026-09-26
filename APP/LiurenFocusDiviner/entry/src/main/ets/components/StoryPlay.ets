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
  Drama, DramaEntry, DramaPick, DramaRoute, DramaStep,
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
  /* 神煞标记（如「空」）：古法三传行有这一列，与 Index.ets 的 chuanRows 同一口径 */
  mark: string;
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
  /* 盘面下方的「本次取证」：点盘 / 点三传 / 点四课命中的那一条，**就地**显示。
     为什么需要：取证内容本来在页面上方的列表里展开，而用户此刻正在下面看盘 ——
     只会看到屏幕因内容高度变化而跳动，却看不到那条内容。改为就地显示后，
     点击不再改动上方列表的展开态，跳动也随之消失。
     hitKind：'' 无 / 'clue' 古籍线索 / 'ouyu' 偶遇取象一步。 */
  @State private hitKind: string = '';
  @State private hitTitle: string = '';
  @State private hitLevel: string = '';
  @State private hitText: string = '';
  @State private hitWhere: string = '';
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
  /* 关卡式推演（drama）态：玩家自己攒的推断链 + 本次反馈 + 揭古断对照 */
  @State private chain: string[] = [];            /* 已走过的步，键 = routeId#stepIndex */
  @State private chainOrder: string[] = [];       /* 走过的顺序（显示用）*/
  @State private dramaTitle: string = '';         /* 本次反馈来自哪一处 */
  @State private dramaReply: string = '';         /* 本次反馈：说象义，不说对错 */
  @State private dramaConclusion: string = '';    /* 成局后的断语（你走的路）*/
  @State private dramaAncient: string = '';       /* 古籍原断（古人走的路）*/
  @State private dramaRevealed: boolean = false;  /* 是否已揭古断 */
  /* 自由取象（同课异占）：已收入清单的象 */
  @State private picked: string[] = [];
  @State private pickedNames: string[] = [];

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

  /* 这次点击是否命中该锚点。
     圆盘分内外两层：外圈给出的是天盘支，内圈给出的是地盘宫名。乘将、神煞、三传这些
     锚点一律挂在天盘支上 —— 所以内圈点到的宫名不能直接当支用（否则「点地盘寅宫」
     会读到天盘亥的象）。gong / zhi 两类锚点本就不限层次（数据里两种写法都有），
     故两层都收；其余锚点只在天地盘重合（伏吟一类）时才认内圈。 */
  private anchorHit(a: StoryAnchor, z: string, layer: string): boolean {
    const az: string = this.anchorZhi(a);
    if (az === '' || az !== z) {
      return false;
    }
    const k: string = a.kind ? a.kind : '';
    if (k === 'gong' || k === 'zhi') {
      return true;
    }
    if (layer !== '地盘') {
      return true;
    }
    const c = this.chart;
    const t: string = c ? (c.tp[z] ? c.tp[z] : '') : '';
    return t === z;
  }

  private anyAnchorHit(anchors: StoryAnchor[], z: string, layer: string): boolean {
    for (const a of anchors) {
      if (this.anchorHit(a, z, layer)) {
        return true;
      }
    }
    return false;
  }

  private setFocus(z: string, label: string): void {
    this.focusZhi = z;
    this.focusLabel = label;
  }

  private clearFocus(): void {
    this.focusZhi = '';
    this.focusLabel = '';
    this.hitKind = '';
    this.hitTitle = '';
    this.hitLevel = '';
    this.hitText = '';
    this.hitWhere = '';
  }

  /* 记下"本次取证"（就地显示用） */
  private setHit(kind: string, title: string, level: string, text: string, where: string): void {
    this.hitKind = kind;
    this.hitTitle = title;
    this.hitLevel = level;
    this.hitText = text;
    this.hitWhere = where;
  }

  /* 该线索在本支线里的序号（1 起），用于"在上方第 N 条"的提示 */
  private clueIndex(id: string): number {
    const list = this.askClues();
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        return i + 1;
      }
    }
    return 0;
  }

  /* 取证卡的类别标签（写成方法而不是内联三元：ArkTS 不接受三元结果直接当实参） */
  private hitLabel(): string {
    return this.hitKind === 'clue' ? '本次取证 · 线索' : '本次取证 · 取象';
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
        color: (LiurenCore.JIANG_JX[jiang] === '吉') ? $r('app.color.brand_gold') : $r('app.color.brand_cinnabar'),
        /* 空亡传支标「空」：旬遁下该支本旬无干，gz 只余地支，此处补上标记（同 Index.ets）*/
        mark: (ch.dx.xunkong.indexOf(z) >= 0) ? '空' : ''
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
    this.resetDrama();
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
    this.resetDrama();
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

  /* 点盘 / 点四课 / 点三传取证 —— 分三种玩法走：
     · 关卡式推演（ask 有 drama）：说这一处的象义，攒进推断链，不说对错；
     · 古籍剧情（旧玩法）：命中尚未找到的线索 → 点亮它；
     · 偶遇实盘：命中可见取象通道某一步 → 展开那条通道与那一步。 */
  /* 点盘／点卡片的统一入口。
     外圈点到的就是天盘支；内圈点到的是地盘宫名 —— 而锚点里的乘将、神煞、三传都挂在
     天盘支上。所以内圈点击先按「宫」匹配一次（gong / zhi 类锚点本就认宫名），不中再把
     这一宫折算成它的上神重试一次：既不会把宫名当成别处的支，也不会点了没反应。 */
  private onPickZhi(z: string, layer: string): void {
    if (this.dispatchPick(z, layer)) {
      return;
    }
    if (layer === '地盘') {
      const c = this.chart;
      const t: string = c ? (c.tp[z] ? c.tp[z] : '') : '';
      if (t !== '' && t !== z && this.dispatchPick(t, '地盘' + z + '宫之上神')) {
        return;
      }
    }
    this.setFocus(z, layer);
    if (this.mode === 'ouyu') {
      this.tip = '「' + z + '」上暂无可取之象 —— 换个位置，或换一类再看。';
    } else if (this.curDrama()) {
      /* 剧情演绎：不说"没中"，说清这一处是什么 —— 玩家看的是盘，不是答卷 */
      this.tip = this.plainZhiReply(z);
    } else {
      this.tip = '「' + z + '」上暂无可取之象（或该线索已取过）—— 换个位置，或直接点上方的线索。';
    }
  }

  /* 分派一次，返回「是否取到了东西」 */
  private dispatchPick(z: string, layer: string): boolean {
    if (this.mode === 'ouyu') {
      return this.pickOuyuByZhi(z, layer);
    }
    const d = this.curDrama();
    if (d) {
      if (this.isFree()) {
        return this.pickFreeZhi(z, layer);
      }
      return this.pickDramaZhi(z, layer);
    }
    const ask = this.curAsk();
    if (!ask || !ask.clues) {
      return false;
    }
    for (const cl of ask.clues) {
      if (this.found.indexOf(cl.id) >= 0) {
        continue;
      }
      if (this.anyAnchorHit(cl.anchors ? cl.anchors : [], z, layer)) {
        /* 记为已得；但**不**展开上方列表（那会让屏幕跳，而用户正在下面看盘）—— 改为就地显示 */
        const next: string[] = this.found.slice();
        next.push(cl.id);
        this.found = next;
        this.setFocus(z, cl.label);
        const at: number = this.clueIndex(cl.id);
        this.setHit('clue', cl.label, '', cl.hint ? cl.hint : '',
          at > 0 ? '在上方线索列表第 ' + String(at) + ' 条' : '');
        this.tip = '';
        return true;
      }
    }
    return false;
  }

  /* 偶遇：点盘/点三传命中的是「取象链的某一步」—— 展开该通道与该步，并把盘面焦点移过去。
     只遍历**当前场景类型下可见**的通道，保证点到的就是屏幕上看得见的那几条。 */
  private pickOuyuByZhi(z: string, layer: string): boolean {
    const o = this.curOuyu();
    if (!o) {
      return false;
    }
    let fallbackLane: string = '';
    let fallbackStep: number = -1;
    for (const l of this.visibleLanes(o)) {
      const chain = l.chain ? l.chain : [];
      for (let i = 0; i < chain.length; i++) {
        const step: OuyuStep = chain[i];
        /* ArkTS 的类型收窄比 TS 严格：三元结果不能直接当实参，先落到带类型标注的局部变量 */
        const stepAnchors: StoryAnchor[] = step.anchors ? step.anchors : [];
        if (!this.anyAnchorHit(stepAnchors, z, layer)) {
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
        this.setFocus(z, label);
        /* 就地显示，**不**展开上方通道列表（否则屏幕跳、而用户在下面看盘看不到内容） */
        this.setHit('ouyu', l.title, step.level ? step.level : '',
          step.hint ? step.hint : '',
          '在上方取象通道「' + l.title + '」第 ' + String(i + 1) + ' 步');
        this.tip = '';
        return true;
      }
    }
    if (fallbackLane !== '') {
      /* 唯一的命中就是"当前已展开的那一处"—— 读出它的内容就地显示 */
      const o2 = this.curOuyu();
      const lanes: OuyuLane[] = o2 ? this.visibleLanes(o2) : [];
      for (const l2 of lanes) {
        if (l2.id !== fallbackLane) {
          continue;
        }
        const ch2: OuyuStep[] = l2.chain ? l2.chain : [];
        if (fallbackStep >= 0 && fallbackStep < ch2.length) {
          const s2: OuyuStep = ch2[fallbackStep];
          this.setFocus(z, s2.onSite ? s2.onSite : layer);
          this.setHit('ouyu', l2.title, s2.level ? s2.level : '',
            s2.hint ? s2.hint : '',
            '在上方取象通道「' + l2.title + '」第 ' + String(fallbackStep + 1) + ' 步');
          this.tip = '';
          return true;
        }
      }
      return false;
    }
    return false;
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

  /* ==================== 关卡式推演（drama）====================
   * 与旧线索玩法的根本区别：旧玩法是"未走先说"（clue.hint 就是指路，玩家只能照做）；
   * 这里每一步的 reply 都是**走过去之后**才给的，而且**只说这一处的象、不说对错**。
   * 玩家自己攒链：攒到某条路径的 minSteps 就成局，然后并排揭古断。 */

  private curDrama(): Drama | null {
    const ask = this.curAsk();
    if (!ask || !ask.drama) {
      return null;
    }
    return ask.drama;
  }

  /* 自由取象（free-pick）：**同课异占专用** —— 无路径、无结论、无对错，只有"可取之象"。
     异占没有古籍原断（性质是「同一张盘换一个方向看」），所以这一支不判对错、也不揭古断。 */
  private isFree(): boolean {
    const d = this.curDrama();
    return !!(d && d.kind === 'free-pick');
  }

  private dramaPicks(): DramaPick[] {
    const d = this.curDrama();
    if (!d || !d.picks) {
      return [];
    }
    return d.picks;
  }

  /* 点盘：取到一处象就收进清单 —— 不判对错，也不说下一步 */
  private pickFreeZhi(z: string, layer: string): boolean {
    const ps: DramaPick[] = this.dramaPicks();
    let again: string = '';
    for (let i = 0; i < ps.length; i++) {
      if (!this.anchorHit(ps[i].anchor, z, layer)) {
        continue;
      }
      if (this.picked.indexOf(ps[i].id) >= 0) {
        if (again === '') {
          again = ps[i].reply;
        }
        continue;
      }
      const np: string[] = this.picked.slice();
      np.push(ps[i].id);
      this.picked = np;
      const nn: string[] = this.pickedNames.slice();
      nn.push(ps[i].name);
      this.pickedNames = nn;
      this.setFocus(z, '');
      this.dramaTitle = '已收入你的取象清单（第 ' + String(np.length) + ' 处）';
      this.dramaReply = ps[i].reply;
      return true;
    }
    if (again !== '') {
      /* 这一处已经取过了：把它的象义再读一遍，也算"有反应" */
      this.setFocus(z, '');
      this.dramaTitle = '盘上 ' + z + '（' + layer + '）';
      this.dramaReply = again;
      return true;
    }
    return false;
  }

  /* 关卡名字与引导都写在数据里 —— 不同案子的关卡本就该有不同名字（要素圈／时线／…）*/
  private dramaName(): string {
    const d = this.curDrama();
    return d ? d.name : '';
  }

  private dramaIntro(): string {
    const d = this.curDrama();
    if (!d || !d.intro) {
      return '';
    }
    return d.intro;
  }

  /* 可见入口：数据层已保证"二级入口只在被某条路径用到时才存在"，故直接全给 */
  private dramaEntries(lv: number): DramaEntry[] {
    const d = this.curDrama();
    if (!d || !d.entries) {
      return [];
    }
    const out: DramaEntry[] = [];
    for (const e of d.entries) {
      if (e.level === lv) {
        out.push(e);
      }
    }
    return out;
  }

  private stepKey(rid: string, i: number): string {
    return rid + '#' + String(i);
  }

  private walked(rid: string, i: number): boolean {
    return this.chain.indexOf(this.stepKey(rid, i)) >= 0;
  }

  private entryName(eid: string): string {
    const d = this.curDrama();
    if (!d || !d.entries) {
      return eid;
    }
    for (const e of d.entries) {
      if (e.id === eid) {
        return e.name;
      }
    }
    return eid;
  }

  /* 盘上某一支在没有对应推断时，也要说清"这一处是什么" —— 不能只说没反应 */
  private plainZhiReply(z: string): string {
    const c = this.chart;
    if (!c) {
      return '盘上「' + z + '」。';
    }
    const gong: string = LiurenCore.gongOf(c.tp, z);
    const j: string = c.jiangMap[gong] ? c.jiangMap[gong] : '';
    let s: string = '盘上「' + z + '」' + (j !== '' ? '乘' + j : '') + '。';
    if (c.dx && c.dx.shensha && c.dx.shensha.byZhi && c.dx.shensha.byZhi[z]) {
      const ss: string[] = c.dx.shensha.byZhi[z];
      if (ss.length > 0) {
        s = s + '带神煞：' + ss.join('、') + '。';
      }
    }
    s = s + '这一处在本案里没有对应的推断 —— 它讲的不是这一案要问的那一层。';
    return s;
  }

  /* 走一步：记入推断链 + 给这一步的象义 */
  private enterStep(r: DramaRoute, i: number, mark: string): void {
    const key: string = this.stepKey(r.id, i);
    if (this.chain.indexOf(key) < 0) {
      const nc: string[] = this.chain.slice();
      nc.push(key);
      this.chain = nc;
      const eid: string = r.steps[i].entry ? r.steps[i].entry as string : '';
      const nl: string[] = this.chainOrder.slice();
      nl.push('第 ' + String(nc.length) + ' 步 · ' + (eid !== '' ? this.entryName(eid) : r.name));
      this.chainOrder = nl;
    }
    this.setFocus(mark, '');
    this.dramaTitle = '已记入你的推断';
    this.dramaReply = r.steps[i].reply;
  }

  /* 点盘上某处 → 在所有路径的步里找锚点匹配的（找**还没走过**的那一处）*/
  private pickDramaZhi(z: string, layer: string): boolean {
    const d = this.curDrama();
    if (!d || !d.routes) {
      return false;
    }
    let fallback: string = '';
    for (const r of d.routes) {
      for (let i = 0; i < r.steps.length; i++) {
        if (!this.anchorHit(r.steps[i].anchor, z, layer)) {
          continue;
        }
        if (this.walked(r.id, i)) {
          if (fallback === '') {
            fallback = r.steps[i].reply;
          }
          continue;
        }
        this.enterStep(r, i, z);
        return true;
      }
    }
    if (fallback !== '') {
      /* 这一处已经走过：把它的象义再读一遍，也算"有反应" */
      this.setFocus(z, '');
      this.dramaTitle = '盘上 ' + z + '（' + layer + '）';
      this.dramaReply = fallback;
      return true;
    }
    return false;
  }

  /* 点要素圈的入口 → 取该入口下"还没走过"的那一步 */
  private pickEntry(e: DramaEntry): void {
    const d = this.curDrama();
    if (!d || !d.routes) {
      return;
    }
    for (const r of d.routes) {
      for (let i = 0; i < r.steps.length; i++) {
        if (r.steps[i].entry !== e.id) {
          continue;
        }
        if (this.walked(r.id, i)) {
          continue;
        }
        const mark: string = this.anchorZhi(r.steps[i].anchor);
        this.enterStep(r, i, mark);
        return;
      }
    }
    /* 该入口的步都走过了，或它没有步 —— 给入口自身的说明 */
    const mark2: string = this.anchorZhi(e.anchor);
    this.setFocus(mark2, '');
    this.dramaTitle = e.name + '（' + e.tag + '）';
    this.dramaReply = e.reply;
  }

  /* 成局判定：某条路径已走的步数 ≥ minSteps，且它不是"说明性" */
  private doneRoute(): DramaRoute | null {
    const d = this.curDrama();
    if (!d || !d.routes) {
      return null;
    }
    for (const r of d.routes) {
      if (r.kind === '说明性') {
        continue;
      }
      const need: number = r.minSteps ? r.minSteps : r.steps.length;
      let hit: number = 0;
      for (let i = 0; i < r.steps.length; i++) {
        if (this.walked(r.id, i)) {
          hit += 1;
        }
      }
      if (hit >= need) {
        return r;
      }
    }
    return null;
  }

  private canSubmit(): boolean {
    return this.doneRoute() !== null;
  }

  /* 呈上断语 → 并排揭古断（你走的路 vs 古人走的路）*/
  private revealDrama(): void {
    const r = this.doneRoute();
    if (!r) {
      this.dramaTitle = '还不能呈断';
      this.dramaReply = '你的推断还没有连成一条能走的链 —— 再在盘上找找看。'
        + '（提示：每一次点击都会告诉你这一处是什么象，不必怕点错。）';
      return;
    }
    const d = this.curDrama();
    if (d && d.routes) {
      for (const x of d.routes) {
        if (x.kind === '古籍原断') {
          this.dramaAncient = x.conclusion;
        }
      }
    }
    this.dramaConclusion = r.conclusion;
    this.dramaRevealed = true;
    this.clearFocus();
  }

  /* 复位（换支线 / 回列表时调）*/
  private resetDrama(): void {
    this.chain = [];
    this.chainOrder = [];
    this.dramaTitle = '';
    this.dramaReply = '';
    this.dramaConclusion = '';
    this.dramaAncient = '';
    this.dramaRevealed = false;
    this.picked = [];
    this.pickedNames = [];
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
    this.resetDrama();
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
          /* 三传：古法**竖排**三行，自下而上 初传→中传→末传（按 [末,中,初] 倒序渲染）*/
          Column({ space: 6 }) {
            ChuanCard({ pos: this.chuanRows(this.chart as Chart)[2].pos, gz: this.chuanRows(this.chart as Chart)[2].gz,
              jiang: this.chuanRows(this.chart as Chart)[2].jiang, lq: this.chuanRows(this.chart as Chart)[2].lq,
              color: this.chuanRows(this.chart as Chart)[2].color, mark: this.chuanRows(this.chart as Chart)[2].mark,
              highlight: this.focusZhi !== '' && (this.chart as Chart).sanchuan.chuans[2].z === this.focusZhi,
              onTap: () => { this.onPickZhi((this.chart as Chart).sanchuan.chuans[2].z, '三传'); } })
            ChuanCard({ pos: this.chuanRows(this.chart as Chart)[1].pos, gz: this.chuanRows(this.chart as Chart)[1].gz,
              jiang: this.chuanRows(this.chart as Chart)[1].jiang, lq: this.chuanRows(this.chart as Chart)[1].lq,
              color: this.chuanRows(this.chart as Chart)[1].color, mark: this.chuanRows(this.chart as Chart)[1].mark,
              highlight: this.focusZhi !== '' && (this.chart as Chart).sanchuan.chuans[1].z === this.focusZhi,
              onTap: () => { this.onPickZhi((this.chart as Chart).sanchuan.chuans[1].z, '三传'); } })
            ChuanCard({ pos: this.chuanRows(this.chart as Chart)[0].pos, gz: this.chuanRows(this.chart as Chart)[0].gz,
              jiang: this.chuanRows(this.chart as Chart)[0].jiang, lq: this.chuanRows(this.chart as Chart)[0].lq,
              color: this.chuanRows(this.chart as Chart)[0].color, mark: this.chuanRows(this.chart as Chart)[0].mark,
              highlight: this.focusZhi !== '' && (this.chart as Chart).sanchuan.chuans[0].z === this.focusZhi,
              onTap: () => { this.onPickZhi((this.chart as Chart).sanchuan.chuans[0].z, '三传'); } })
          }
          .width('100%')
        }
        .width('100%')

        /* 本次取证：点盘 / 点三传 / 点四课命中的那一条，就地显示在盘面正下方 ——
           用户此刻正是在这里看盘，不必再滚回上方列表去找
           （那也正是"屏幕上下跳动、却跳不到那条证据上"的根源）。
           配色：本块位于 chartBlock 的**浅纸底**内，故文字一律用纸底深色，
           且**不另设深底背景** —— 否则门禁推断出的底色与实际不符，dark 主题会不达标。 */
        if (this.hitKind !== '') {
          Column({ space: 6 }) {
            Row({ space: 6 }) {
              Text(this.hitLabel())
                .fontSize($r('app.float.font_caption_m'))
                .fontColor($r('app.color.ink_text_paper_muted'))
              if (this.hitLevel !== '') {
                Text(this.levelLabel(this.hitLevel))
                  .fontSize($r('app.float.font_caption_m'))
                  .fontColor($r('app.color.ink_on_deep_text'))
                  .backgroundColor(this.levelColor(this.hitLevel))
                  .borderRadius(8)
                  .padding({ left: 6, right: 6, top: 2, bottom: 2 })
              }
            }
            .width('100%')
            Text(this.hitTitle)
              .fontSize($r('app.float.font_caption_l'))
              .fontColor($r('app.color.case_blue_deep'))
              .width('100%')
            Text(this.cleanHint(this.hitText))
              .fontSize($r('app.float.fs_caption'))
              .fontColor($r('app.color.ink_sunken'))
              .lineHeight(20)
              .width('100%')
            if (this.hitWhere !== '') {
              Text(this.hitWhere)
                .fontSize($r('app.float.font_caption_m'))
                .fontColor($r('app.color.ink_text_paper_muted'))
                .width('100%')
            }
          }
          .width('100%')
          .padding(10)
          .borderRadius(10)
          .border({ width: 2, color: $r('app.color.brand_gold') })
        }
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

          /* 关卡玩法：要素圈在盘面上方；旧线索列表整块让位（两套不并存）*/
          if (this.curDrama()) {
            this.dramaBar()
          }

          if (!this.revealed && !this.curDrama()) {
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

          /* 关卡玩法：反馈 + 推断链 + 呈断 + 并排揭古断，都在盘面下方 */
          if (this.curDrama()) {
            this.dramaPanel()
          }

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

  /* ============ 关卡式推演的界面 ============ */

  /* 要素圈：盘面上方 —— 玩家自己挑从哪一处切进去（不告诉他哪条是对的）*/
  @Builder
  dramaBar() {
    if (this.curDrama() && !this.isFree()) {
      Column({ space: 6 }) {
        Text(this.dramaName())
          .fontSize($r('app.float.font_caption_m'))
          .fontColor($r('app.color.ink_text_muted'))
          .width('100%')
        if (this.dramaIntro() !== '') {
          Text(this.cleanHint(this.dramaIntro()))
            .fontSize($r('app.float.font_caption_m'))
            .fontColor($r('app.color.ink_text_secondary'))
            .lineHeight(18)
            .width('100%')
        }
        Flex({ wrap: FlexWrap.Wrap }) {
          ForEach(this.dramaEntries(1), (e: DramaEntry) => {
            Text(e.name)
              .fontSize($r('app.float.font_caption_l'))
              .fontColor($r('app.color.ink_text_bright'))
              .backgroundColor($r('app.color.ink_surface'))
              .borderRadius(12)
              .padding({ left: 10, right: 10, top: 5, bottom: 5 })
              .margin({ right: 6, bottom: 6 })
              .onClick(() => {
                this.pickEntry(e);
              })
          }, (e: DramaEntry) => e.id)
        }
        .width('100%')
        if (this.dramaEntries(2).length > 0) {
          Text('还有这几处（原文或某条路径用到才出现）')
            .fontSize($r('app.float.font_caption_m'))
            .fontColor($r('app.color.ink_text_muted'))
            .width('100%')
          Flex({ wrap: FlexWrap.Wrap }) {
            ForEach(this.dramaEntries(2), (e: DramaEntry) => {
              Text(e.name)
                .fontSize($r('app.float.font_caption_m'))
                .fontColor($r('app.color.ink_text_secondary'))
                .backgroundColor($r('app.color.ink_surface'))
                .borderRadius(10)
                .padding({ left: 8, right: 8, top: 4, bottom: 4 })
                .margin({ right: 6, bottom: 6 })
                .onClick(() => {
                  this.pickEntry(e);
                })
            }, (e: DramaEntry) => e.id)
          }
          .width('100%')
        }
      }
      .width('100%')
      .padding(10)
      .borderRadius(10)
      .backgroundColor($r('app.color.ink_surface'))
    }
  }

  /* 反馈 + 推断链 + 呈断 + 揭古断对照（盘面下方）*/
  @Builder
  dramaPanel() {
    if (this.curDrama()) {
      Column({ space: 10 }) {
        if (this.dramaReply !== '') {
          Column({ space: 6 }) {
            Text(this.dramaTitle)
              .fontSize($r('app.float.font_caption_m'))
              .fontColor($r('app.color.ink_text_muted'))
              .width('100%')
            Text(this.cleanHint(this.dramaReply))
              .fontSize($r('app.float.fs_caption'))
              .fontColor($r('app.color.ink_text_bright'))
              .lineHeight(20)
              .width('100%')
          }
          .width('100%')
          .padding(10)
          .borderRadius(10)
          .backgroundColor($r('app.color.ink_surface'))
          .border({ width: 1, color: $r('app.color.brand_gold') })
        }

        if (!this.dramaRevealed) {
          Text('点盘上任意一处，或点上面的入口 —— 每一次点击都会告诉你这一处的象是什么。')
            .fontSize($r('app.float.font_caption_m'))
            .fontColor($r('app.color.ink_text_muted'))
            .width('100%')
        }

        if (this.chainOrder.length > 0) {
          Column({ space: 4 }) {
            Text('你的推断链（' + String(this.chainOrder.length) + ' 步）')
              .fontSize($r('app.float.font_caption_m'))
              .fontColor($r('app.color.ink_text_muted'))
              .width('100%')
            ForEach(this.chainOrder, (s: string, i: number) => {
              Text('· ' + s)
                .fontSize($r('app.float.font_caption_l'))
                .fontColor($r('app.color.ink_text_secondary'))
                .width('100%')
            }, (s: string, i: number) => String(i) + '_' + s)
          }
          .width('100%')
          .padding(10)
          .borderRadius(10)
          .backgroundColor($r('app.color.ink_surface'))
        }

        if (this.isFree() && this.pickedNames.length > 0) {
          Column({ space: 4 }) {
            Text('你的取象清单（' + String(this.pickedNames.length) + ' 处）')
              .fontSize($r('app.float.font_caption_m'))
              .fontColor($r('app.color.ink_text_muted'))
              .width('100%')
            ForEach(this.pickedNames, (s2: string, i2: number) => {
              Text('· ' + s2)
                .fontSize($r('app.float.font_caption_l'))
                .fontColor($r('app.color.ink_text_secondary'))
                .width('100%')
            }, (s2: string, i2: number) => s2 + '#' + String(i2))
          }
          .width('100%')
          .padding(10)
          .borderRadius(10)
          .backgroundColor($r('app.color.ink_surface'))
        }

        if (this.isFree() && !this.dramaRevealed) {
          Row() {
            Text('看取象小结')
              .fontSize($r('app.float.font_body_m'))
              .fontColor($r('app.color.ink_page'))
              .backgroundColor($r('app.color.accent_gold_fill'))
              .borderRadius(12)
              .padding({ left: 16, right: 16, top: 9, bottom: 9 })
              .onClick(() => {
                this.dramaRevealed = true;
                this.clearFocus();
              })
          }
          .width('100%')
          .justifyContent(FlexAlign.Center)
        }

        if (!this.dramaRevealed && !this.isFree()) {
          Row() {
            Text(this.canSubmit() ? '呈上断语' : '推断链还没连成（继续找）')
              .fontSize($r('app.float.font_body_m'))
              .fontColor(this.canSubmit() ? $r('app.color.ink_page') : $r('app.color.ink_text_muted'))
              .backgroundColor(this.canSubmit() ? $r('app.color.accent_gold_fill') : $r('app.color.ink_surface'))
              .borderRadius(12)
              .padding({ left: 16, right: 16, top: 9, bottom: 9 })
              .onClick(() => {
                this.revealDrama();
              })
          }
          .width('100%')
          .justifyContent(FlexAlign.Center)
        }

        if (this.dramaRevealed && this.isFree()) {
          Column({ space: 8 }) {
            Text('取象小结')
              .fontSize($r('app.float.font_body_m'))
              .fontColor($r('app.color.brand_gold_bright'))
              .width('100%')
            Text(this.cleanHint(this.endingOf(this.curAsk() as StoryAsk)))
              .fontSize($r('app.float.fs_caption'))
              .fontColor($r('app.color.ink_text_bright'))
              .lineHeight(20)
              .width('100%')
            Text('同课异占没有古籍原断 —— 你取到的都是象，不是断语。')
              .fontSize($r('app.float.font_caption_m'))
              .fontColor($r('app.color.ink_text_muted'))
              .width('100%')
          }
          .width('100%')
          .padding(12)
          .borderRadius(12)
          .backgroundColor($r('app.color.ink_surface'))
          .border({ width: 1, color: $r('app.color.brand_gold') })
        }

        if (this.dramaRevealed && !this.isFree()) {
          Column({ space: 8 }) {
            Text(this.dramaConclusion === this.dramaAncient ? '你走的正是古人的路' : '你走的路')
              .fontSize($r('app.float.font_body_m'))
              .fontColor($r('app.color.brand_gold_bright'))
              .width('100%')
            Text(this.dramaConclusion)
              .fontSize($r('app.float.fs_caption'))
              .fontColor($r('app.color.ink_text_bright'))
              .lineHeight(20)
              .width('100%')
            if (this.dramaConclusion !== this.dramaAncient) {
              Text('古人走的路')
                .fontSize($r('app.float.font_body_m'))
                .fontColor($r('app.color.brand_gold_bright'))
                .margin({ top: 6 })
                .width('100%')
              Text(this.dramaAncient)
                .fontSize($r('app.float.fs_caption'))
                .fontColor($r('app.color.ink_text_secondary'))
                .lineHeight(20)
                .width('100%')
              Text('你走的路依据同样在盘上 —— 与古人不一致，不等于错。')
                .fontSize($r('app.float.font_caption_m'))
                .fontColor($r('app.color.ink_text_muted'))
                .width('100%')
            }
          }
          .width('100%')
          .padding(12)
          .borderRadius(12)
          .backgroundColor($r('app.color.ink_surface'))
          .border({ width: 1, color: $r('app.color.brand_gold') })
        }
      }
      .width('100%')
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

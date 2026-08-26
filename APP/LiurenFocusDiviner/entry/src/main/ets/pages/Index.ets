/**
 * Index —— 排盘工作台（组件化）
 * ----------------------------------------------------------------------------
 * 日期/时辰选择 → 排盘 → 盘面(PanDisk) / 四课(KegCard) / 三传(ChuanCard)
 * / 盘态(InfoRow) / 神煞(TagBadge) / 毕法（点击展开定位五层）
 * 数据：DataLoader 读 rawfile（rule/ 规则 + cal/ 万年历 + yj_all 月将）
 */
import { common } from '@kit.AbilityKit';
import { LiurenCore } from '../model/LiurenCore';
import type {
  BifaDetail,
  BifaHit,
  Chart,
  ChartInput,
  CoachResult,
  DayRec,
  Keg,
  NianmingAdvice,
  XingNianResult,
  YearGcObj,
  YueJiangSeg,
  ZhonghuangAnalyze,
  ZhonghuangCmpItem,
  ZhonghuangDun,
  ZhonghuangJianhe
} from '../model/LiurenCore';
import { DataLoader } from '../model/DataLoader';
import type { AncientBook } from '../model/DataLoader';
import { CaseStore } from '../model/CaseStore';
import type { CaseRec } from '../model/CaseStore';
import { YongShenCore } from '../model/YongShenCore';
import { PayConfig } from '../pay/PayConfig';
import { PayGate } from '../pay/PayGate';
import type { PurchaseResult } from '../pay/IapAdapter';
import { ChuanCard } from '../components/ChuanCard';
import { InfoRow } from '../components/InfoRow';
import { KegCard } from '../components/KegCard';
import { PanDisk } from '../components/PanDisk';
import { TagBadge } from '../components/TagBadge';
import { YongShenSheet } from '../components/YongShenSheet';
import { AncientStudy } from '../components/AncientStudy';
import { CaseBoard } from '../components/CaseBoard';

const MIN_YEAR: number = 1900;
const MAX_YEAR: number = 2060;
const HOURS: string[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const WEEK_HEADS: string[] = ['一', '二', '三', '四', '五', '六', '日'];

/* 三传展示行 */
interface ChuanRow {
  pos: string;
  gz: string;
  jiang: string;
  lq: string;
  color: string;
}

/* 四课展示行（倒序渲染：右起第一课） */
interface KegRow {
  kn: string;
  keg: Keg;
}

/* 神煞分组（日支 / 月将 / 初传） */
interface ShenshaGroup {
  label: string;
  names: string[];
}

/* 四柱行参数（@Builder 按引用传递用；ArkTS 禁内联对象字面量类型） */
interface PillarParams {
  label: string;
  value: string;
}

@Entry
@Component
struct Index {
  @State private year: number = 2026;
  @State private month: number = 1;
  @State private day: number = 1;
  @State private hourZhi: string = '午';
  @State private ready: boolean = false;
  @State private chart: Chart | null = null;
  @State private calData: Record<string, DayRec[]> = {};
  @State private yjAll: YueJiangSeg[] = [];
  @State private expandedBifa: number = -1;
  @State private bifaDetails: BifaDetail[] = [];
  @State private coachData: Record<string, Object> = {};
  @State private coach: CoachResult | null = null;
  @State private nianZhi: string = '';
  @State private nianming: NianmingAdvice | null = null;
  /* 行年（小运）：出生年 + 性别 → 本命/行年/上神/建议 */
  @State private birthYear: number = 1990;
  @State private gender: string = '男';
  @State private xingnian: XingNianResult | null = null;
  /* 年份就地编辑（点击数字切换为输入框，回车/失焦确认） */
  @State private yearEditing: boolean = false;
  @State private yearEditVal: string = '';
  @State private birthEditing: boolean = false;
  @State private birthEditVal: string = '';
  @State private showYongShen: boolean = false;
  @State private zhanShi: Record<string, Object> = {};
  @State private leixiang: Record<string, Object> = {};
  @State private xiangyi: Record<string, Object> = {};
  /* 抓用神（受控状态，关闭 Sheet 重开不丢）：
     affairName=当前占事 / yongShen=当前用神 / anchor=锚定象；
     cands=候选地支（派生，供 PanDisk 高亮） */
  @State private affairName: string = '';
  @State private yongShen: string = '';
  @State private anchor: string = '';
  @State private cands: string[] = [];
  /* 外应取用标记：true=当前用神来自盘面点击（自定义），false=占事驱动 */
  @State private customYS: boolean = false;
  /* 外应取用来源层（天盘/地盘），仅提示用 */
  @State private customLayer: string = '天盘';
  /* 中黄研习：遁干模式（旬/日遁/时遁）+ 两遁数据 + 完整分析 */
  @State private zhonghuangMode: string = '旬';
  @State private zhonghuang: ZhonghuangDun | null = null;
  @State private zhonghuangAna: ZhonghuangAnalyze | null = null;
  /* 解读路线：当前展开的路线（读象/毕法/中黄；空=全收起） */
  @State private route: string = '';
  /* 古籍案例速排：输入月将/日干支/占时(+可选年/月) 反推完整盘面 */
  @State private showAncient: boolean = false;
  /* 盘面辅助层开关：显地盘干/显本位神（颜色区分主辅） */
  @State private showDunDi: boolean = false;
  @State private showBenshen: boolean = false;
  /* 课体课义数据（九宗门课体 → 通用课义） */
  @State private ketiYi: Record<string, Object> = {};
  @State private ancientMj: string = '未';
  @State private ancientDg: string = '甲';
  /* 底部页签：0=排盘 1=课例 2=古籍（受控 Tabs） */
  @State private curTab: number = 0;
  /* 古籍研习数据（DataLoader.loadAncient） */
  @State private ancient: AncientBook | null = null;
  /* 课例列表（CaseStore 持久化，新→旧） */
  @State private cases: CaseRec[] = [];
  @State private ancientDz: string = '戌';
  @State private ancientHz: string = '卯';
  @State private ancientYG: string = '';
  @State private ancientYZ: string = '';
  @State private ancientMZ: string = '';
  @State private ancientNote: string = '';

  /* ---------------- 生命周期 ---------------- */

  aboutToAppear(): void {
    this.initData();
  }

  private async initData(): Promise<void> {
    const ctx = this.abilityCtx();
    if (!ctx) {
      return;
    }
    try {
      const rules = await DataLoader.loadCoreRules(ctx);
      LiurenCore.init(rules);
    } catch (e) {
      /* 规则加载失败：引擎以空规则兜底，可继续排盘 */
    }
    try {
      const yj = await DataLoader.loadYjAll(ctx);
      this.yjAll = yj;
    } catch (e) {
      /* 月将数据缺失时引擎走中气近似兜底 */
    }
    try {
      const zs = await DataLoader.loadZhanShi(ctx);
      this.zhanShi = zs;
      YongShenCore.zhanShi = zs;
    } catch (e) {
      /* 占事体系缺失：抓用神模块以空数据兜底 */
    }
    try {
      this.leixiang = await DataLoader.loadLeixiang(ctx);
      this.xiangyi = await DataLoader.loadXiangyi(ctx);
    } catch (e) {
      /* 类象库/管辂象意缺失：节点卡与选句兜底为空 */
    }
    try {
      this.coachData = await DataLoader.loadBifaCoach(ctx);
    } catch (e) {
      /* 毕法教练数据缺失：教练栏兜底为空 */
    }
    try {
      this.ketiYi = await DataLoader.loadKetiYi(ctx);
    } catch (e) {
      /* 课体课义缺失：课体解读卡兜底为空 */
    }
    try {
      this.ancient = await DataLoader.loadAncient(ctx);
    } catch (e) {
      /* 古籍数据缺失：研习页签兜底为空 */
    }
    await CaseStore.init(ctx);
    this.cases = await CaseStore.loadCases();
    const now = new Date();
    const y = now.getFullYear();
    this.year = (y < MIN_YEAR) ? MIN_YEAR : ((y > MAX_YEAR) ? MAX_YEAR : y);
    this.month = now.getMonth() + 1;
    this.day = now.getDate();
    const h = now.getHours();
    this.hourZhi = HOURS[Math.floor((h + 1) / 2) % 12];
    /* 行年出生年默认：今年 - 30（可步进调整） */
    const by = this.year - 30;
    this.birthYear = (by < MIN_YEAR) ? MIN_YEAR : by;
    try {
      const arr = await DataLoader.loadCal(ctx, this.year);
      const m: Record<string, DayRec[]> = {};
      m[String(this.year)] = arr;
      this.calData = m;
      this.clampDay();
      this.ready = true;
    } catch (e) {
      /* 历法数据缺失：日期网格暂空 */
    }
  }

  /* 当前 Ability 上下文（页面注入，替代已废弃的全局 getContext） */
  private abilityCtx(): common.UIAbilityContext | null {
    const host = this.getUIContext().getHostContext();
    if (host) {
      return host as common.UIAbilityContext;
    }
    return null;
  }

  /* ---------------- 日期导航 ---------------- */

  private pad2(n: number): string {
    return n < 10 ? ('0' + n) : String(n);
  }

  private dateStr(): string {
    return String(this.year) + '-' + this.pad2(this.month) + '-' + this.pad2(this.day);
  }

  private changeYear(delta: number): void {
    const ny = this.year + delta;
    if (ny < MIN_YEAR || ny > MAX_YEAR) {
      return;
    }
    this.year = ny;
    this.syncCal();
  }

  private changeMonth(delta: number): void {
    let m = this.month + delta;
    let y = this.year;
    if (m < 1) {
      m = 12;
      y = y - 1;
    }
    if (m > 12) {
      m = 1;
      y = y + 1;
    }
    if (y < MIN_YEAR || y > MAX_YEAR) {
      return;
    }
    this.year = y;
    this.month = m;
    this.syncCal();
  }

  /* 行年出生年步进（1900-2060，与历法同界） */
  private changeBirthYear(delta: number): void {
    const ny = this.birthYear + delta;
    if (ny < MIN_YEAR || ny > MAX_YEAR) {
      return;
    }
    this.birthYear = ny;
    const c = this.chart;
    if (c) {
      this.xingnian = LiurenCore.xingNian(c, ny, this.year, this.gender, this.yongShen);
    }
  }

  /* 行年吉凶档位配色（大吉/吉=金，凶/大凶=绯，平=灰） */
  private bandColor(band: string): string {
    if (band === '大吉' || band === '吉') {
      return '#F0D98C';
    }
    if (band === '凶' || band === '大凶') {
      return '#D0704A';
    }
    return '#B8A97F';
  }

  /* 起课年份/出生年 就地编辑确认（免逐格步进） */
  private commitYearEdit(): void {
    this.yearEditing = false;
    const n = parseInt(this.yearEditVal);
    if (!isNaN(n) && n >= MIN_YEAR && n <= MAX_YEAR && n !== this.year) {
      this.year = n;
      this.syncCal();
    }
  }

  private commitBirthEdit(): void {
    this.birthEditing = false;
    const n = parseInt(this.birthEditVal);
    if (!isNaN(n) && n >= MIN_YEAR && n <= MAX_YEAR && n !== this.birthYear) {
      this.birthYear = n;
      const c = this.chart;
      if (c) {
        this.xingnian = LiurenCore.xingNian(c, n, this.year, this.gender, this.yongShen);
      }
    }
  }

  private today(): void {
    const now = new Date();
    const y = now.getFullYear();
    if (y < MIN_YEAR || y > MAX_YEAR) {
      return;
    }
    this.year = y;
    this.month = now.getMonth() + 1;
    this.day = now.getDate();
    this.syncCal();
  }

  private syncCal(): void {
    if (this.calData[String(this.year)]) {
      this.clampDay();
    } else {
      this.ensureCal(this.year);
    }
  }

  private ensureCal(year: number): void {
    if (this.calData[String(year)]) {
      return;
    }
    const ctx = this.abilityCtx();
    if (!ctx) {
      return;
    }
    DataLoader.loadCal(ctx, year).then((arr: DayRec[]) => {
      if (arr.length > 0) {
        const m: Record<string, DayRec[]> = {};
        m[String(year)] = arr;
        this.calData = m;
        this.clampDay();
      }
    });
  }

  private clampDay(): void {
    const arr = this.calData[String(this.year)];
    if (!arr) {
      return;
    }
    const prefix = String(this.year) + '-' + this.pad2(this.month);
    let maxDay = 0;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].d.startsWith(prefix)) {
        const dd = parseInt(arr[i].d.slice(8, 10), 10);
        if (dd > maxDay) {
          maxDay = dd;
        }
      }
    }
    if (maxDay > 0 && this.day > maxDay) {
      this.day = maxDay;
    }
  }

  /* ---------------- 日网格 ---------------- */

  private monthDays(): DayRec[] {
    const arr = this.calData[String(this.year)];
    if (!arr) {
      return [];
    }
    const prefix = String(this.year) + '-' + this.pad2(this.month);
    const out: DayRec[] = [];
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].d.startsWith(prefix)) {
        out.push(arr[i]);
      }
    }
    return out;
  }

  private leadBlanks(): number {
    const dt = new Date(this.year, this.month - 1, 1);
    return (dt.getDay() + 6) % 7;
  }

  private blankCells(): number[] {
    const out: number[] = [];
    for (let i = 0; i < this.leadBlanks(); i++) {
      out.push(i);
    }
    return out;
  }

  private dayNum(r: DayRec): number {
    return parseInt(r.d.slice(8, 10), 10);
  }

  /* ---------------- 排盘 ---------------- */

  private doChart(): void {
    if (!this.ready) {
      return;
    }
    if (!this.calData[String(this.year)]) {
      return;
    }
    const input: ChartInput = {
      date: this.dateStr(),
      hourZhi: this.hourZhi,
      calData: this.calData,
      yjAll: this.yjAll
    };
    const c = LiurenCore.buildChart(input);
    if (c) {
      this.chart = c;
      this.bifaDetails = LiurenCore.renderBifaForChuans(c, c.dx, c.sanchuan.chuans, '');
      this.coach = LiurenCore.bifaCoach(c.dx.bifa, this.coachData);
      this.nianming = null;
      if (this.nianZhi !== '') {
        this.nianming = LiurenCore.nianmingAdvice(c, this.nianZhi, this.yongShen);
      }
      this.xingnian = LiurenCore.xingNian(c, this.birthYear, this.year, this.gender, this.yongShen);
      this.zhonghuang = LiurenCore.zhonghuangDun(c, this.hourZhi);
      this.zhonghuangAna = LiurenCore.zhonghuangAnalyze(c, this.hourZhi);
      this.expandedBifa = -1;
    }
  }

  /* 古籍案例速排：月将+日干支+占时(+可选年/月) → 完整盘面（带合法性校验） */
  private doAncientChart(): void {
    /* ① 日干支阴阳匹配 */
    if (!LiurenCore.validGanZhi(this.ancientDg, this.ancientDz)) {
      this.ancientNote = '日干支不合：' + this.ancientDg + this.ancientDz +
        '（阳干配阳支/阴干配阴支，60甲子合法组合中不存在）';
      return;
    }
    /* ② 年干支须成对填写（只填一个则提示） */
    if ((this.ancientYG === '') !== (this.ancientYZ === '')) {
      this.ancientNote = '年干支需同时填写天干与地支（当前只填了' +
        (this.ancientYG !== '' ? '年干' : '年支') + '）';
      return;
    }
    /* ②b 年干支阴阳匹配（若填了年干支） */
    if (this.ancientYG !== '' && this.ancientYZ !== '' && !LiurenCore.validGanZhi(this.ancientYG, this.ancientYZ)) {
      this.ancientNote = '年干支不合：' + this.ancientYG + this.ancientYZ + '（阴阳不配，不存在）';
      return;
    }
    /* ③ 月将×月支匹配（若填了月支） */
    if (this.ancientMZ !== '') {
      const expectMj = LiurenCore.yuejiangForMonth(this.ancientMZ);
      if (expectMj !== this.ancientMj) {
        this.ancientNote = this.ancientMZ + '月（' + this.ancientMZ + '支）月将应为' + expectMj + '将，非' + this.ancientMj + '将';
        return;
      }
    }
    const c = LiurenCore.buildChartAncient(this.ancientMj, this.ancientDg, this.ancientDz,
      this.ancientHz, this.ancientYG, this.ancientYZ, this.ancientMZ);
    if (!c) {
      this.ancientNote = '起盘失败';
      return;
    }
    this.chart = c;
    this.hourZhi = this.ancientHz; /* 同步占时（各派生状态用对时辰） */
    this.ancientNote = this.ancientMj + '将 ' + this.ancientDg + this.ancientDz + '日 ' + this.ancientHz + '时 · 已反推（' +
      (c.dx.xunkong.length ? '旬空' + c.dx.xunkong.join('') : '无空') + '）';
    this.bifaDetails = LiurenCore.renderBifaForChuans(c, c.dx, c.sanchuan.chuans, '');
    this.coach = LiurenCore.bifaCoach(c.dx.bifa, this.coachData);
    this.zhonghuang = LiurenCore.zhonghuangDun(c, this.ancientHz);
    this.zhonghuangAna = LiurenCore.zhonghuangAnalyze(c, this.ancientHz);
    this.yongShen = '';
    this.cands = [];
    this.customYS = false;
    this.nianZhi = '';
    this.nianming = null;
    this.xingnian = LiurenCore.xingNian(c, this.birthYear, this.year, this.gender, '');
    this.expandedBifa = -1;
    this.route = '';
  }

  /* 当前盘（仅在 chart 非空时调用） */
  private cur(): Chart {
    return this.chart as Chart;
  }

  /* 保存课例：当前盘面要点存入 CaseStore（本地 Preferences） */
  private saveCase(): void {
    const c = this.chart;
    if (!c) {
      return;
    }
    const rec: CaseRec = {
      ts: Date.now(),
      date: this.dateStr(),
      hourZhi: this.hourZhi,
      siZhu: this.ygcText(c.r) + ' ' + c.r.mg + c.r.mz + ' ' + c.r.dg + c.r.dz + ' ' + c.hourGan + this.hourZhi,
      yueJiang: c.yj.zhi,
      keti: this.chuanTitle(),
      chuans: c.sanchuan.chuans[0].z + c.sanchuan.chuans[1].z + c.sanchuan.chuans[2].z,
      yongShen: this.yongShen,
      affairName: this.affairName,
      note: ''
    };
    CaseStore.addCase(rec).then((list: CaseRec[]) => {
      this.cases = list;
      this.showTip('已保存到课例');
    });
  }

  /* 恢复课例：回填日期时辰 → （必要时先补载该年历法）→ 重排并跳回排盘页签 */
  private restoreCase(rec: CaseRec): void {
    const y = parseInt(rec.date.slice(0, 4));
    const m = parseInt(rec.date.slice(5, 7));
    const d = parseInt(rec.date.slice(8, 10));
    if (isNaN(y) || isNaN(m) || isNaN(d)) {
      return;
    }
    this.year = y;
    this.month = m;
    this.day = d;
    this.hourZhi = rec.hourZhi;
    /* 先恢复用神（重排时年命/行年/毕法动态三传即用恢复值） */
    if (rec.yongShen !== '') {
      this.yongShen = rec.yongShen;
      this.cands = [];
      this.customYS = true;
      this.customLayer = '天盘';
      this.anchor = '';
    } else {
      this.yongShen = '';
      this.cands = [];
      this.customYS = false;
    }
    const doCast = (): void => {
      this.doChart();
      this.curTab = 0;
    };
    const ctx = this.abilityCtx();
    if (!this.calData[String(y)] && ctx) {
      /* 该年历法未载：先补载再排（避免 doChart 静默早退） */
      DataLoader.loadCal(ctx, y).then((arr: DayRec[]) => {
        if (arr.length > 0) {
          const m2: Record<string, DayRec[]> = {};
          m2[String(y)] = arr;
          this.calData = m2;
          this.clampDay();
        }
        doCast();
      });
    } else {
      this.syncCal();
      doCast();
    }
  }

  /* 删除课例 */
  private deleteCase(ts: number): void {
    CaseStore.removeCase(ts).then((list: CaseRec[]) => {
      this.cases = list;
    });
  }

  /* 课体课义：当前课体名 → 匹配课体课义表的断语 */
  private ketiTxt(): string {
    if (!this.chart) {
      return '';
    }
    const name = this.chuanTitle();
    const list = this.ketiYi['课体'] as Record<string, Object>[];
    if (!list) {
      return '';
    }
    for (let i = 0; i < list.length; i++) {
      const it = list[i];
      if (it['名'] === name) {
        const yi = it['课义'] as string;
        const duan = it['断语'] as string;
        const jx = it['吉凶'] as string;
        return '【课义】' + yi + ' 【断】' + duan + '（' + jx + '）';
      }
    }
    return name !== '' ? '宗门法：' + name + '（贼克/比用/涉害/遥克…）' : '';
  }

  private ygcText(r: DayRec): string {
    const y = r.ygc;
    if (typeof y === 'string') {
      return y;
    }
    const o = y as YearGcObj;
    if (o) {
      return o.z;
    }
    return '';
  }

  private jiangOf(z: string): string {
    const c = this.chart;
    if (!c) {
      return '';
    }
    const gong = LiurenCore.gongOf(c.tp, z);
    const j = c.jiangMap[gong];
    return j ? j : '';
  }

  private liuqinOf(z: string): string {
    const c = this.chart;
    if (!c) {
      return '';
    }
    const w = LiurenCore.WX[z] || '';
    const dw = LiurenCore.WXG[c.r.dg] || '';
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

  /* 三传标题：课体课显示课体名，普通课显示宗门法 */
  private chuanTitle(): string {
    const k = this.cur().sanchuan.keti;
    return (k !== '') ? k : this.cur().sanchuan.method;
  }

  private chuanRows(): ChuanRow[] {
    const c = this.cur();
    const posNames: string[] = ['初传', '中传', '末传'];
    const out: ChuanRow[] = [];
    const chuans = c.sanchuan.chuans;
    for (let i = 0; i < chuans.length; i++) {
      const z = chuans[i].z;
      const jiang = this.jiangOf(z);
      const lq = this.liuqinOf(z);
      const color = (LiurenCore.JIANG_JX[jiang] === '吉') ? '#E9C878' : '#D0704A';
      out.push({ pos: posNames[i], gz: chuans[i].gz, jiang: jiang, lq: lq, color: color });
    }
    return out;
  }

  private kegRows(): KegRow[] {
    const c = this.cur();
    const out: KegRow[] = [];
    for (let i = 3; i >= 0; i--) {
      out.push({ kn: '第' + (i + 1) + '课', keg: c.kegs[i] });
    }
    return out;
  }

  private shenshaGroups(): ShenshaGroup[] {
    const c = this.cur();
    const byZhi = c.dx.shensha.byZhi;
    const out: ShenshaGroup[] = [];
    out.push(this.shenshaGroup('日支·' + c.r.dz, byZhi[c.r.dz]));
    out.push(this.shenshaGroup('月将·' + c.yj.zhi, byZhi[c.yj.zhi]));
    const c1 = c.sanchuan.chuans[0] ? c.sanchuan.chuans[0].z : '';
    out.push(this.shenshaGroup('初传·' + c1, byZhi[c1]));
    return out;
  }

  private shenshaGroup(label: string, names: string[] | undefined): ShenshaGroup {
    const g: ShenshaGroup = { label: label, names: names ? names : [] };
    return g;
  }

  /* ---------------- 毕法定位 ---------------- */

  private detailOf(no: number): BifaDetail | null {
    for (let i = 0; i < this.bifaDetails.length; i++) {
      if (this.bifaDetails[i].序 === no) {
        return this.bifaDetails[i];
      }
    }
    return null;
  }

  private layerOf(no: number, key: string): string {
    const d = this.detailOf(no);
    if (d) {
      const v = d.layer[key];
      return v ? v : '—';
    }
    return '—';
  }

  private kongText(): string {
    const k = this.cur().dx.xunkong;
    if (k.length === 0) {
      return '无';
    }
    return k.join(' ');
  }

  private yjText(): string {
    const d = this.cur().dx.yuejiang;
    return this.cur().yj.jiang + '(' + d.zhi + ') 临' + d.gong + ' · ' + d.wangShuai;
  }

  /* ============================ 界面 ============================ */

  @Builder
  private header() {
    Row() {
      Text('六壬 · 读象工作台')
        .fontSize(18)
        .fontWeight(FontWeight.Bold)
        .fontColor('#E9C878')
        .letterSpacing(2)
      Blank()
      Text('排盘')
        .fontSize(11)
        .fontColor('#A8843C')
        .padding({ left: 10, right: 10, top: 3, bottom: 3 })
        .border({ width: 1, color: 'rgba(168,132,60,0.6)' })
        .borderRadius(10)
    }
    .width('100%')
    .padding({ left: 20, right: 20, top: 16, bottom: 14 })
    .backgroundColor('#1C1A16')
    .border({ width: { bottom: 1 }, color: 'rgba(233,200,120,0.2)' })
  }

  @Builder
  private dateCard() {
    Column({ space: 12 }) {
      Row() {
        Text('起课日期')
          .fontSize(14)
          .fontWeight(FontWeight.Medium)
          .fontColor('#F0E6C8')
        Blank()
        Text(this.dateStr())
          .fontSize(12)
          .fontColor('#A8843C')
      }
      Row({ space: 20 }) {
        Row({ space: 8 }) {
          Text('‹')
            .fontSize(24)
            .fontColor('#A8843C')
            .onClick(() => {
              this.changeYear(-1);
            })
          Column({ space: 2 }) {
            Text('年 · 点击输入')
              .fontSize(10)
              .fontColor('#8A7B5C')
            if (this.yearEditing) {
              TextInput({ text: this.yearEditVal, placeholder: String(this.year) })
                .type(InputType.Number)
                .maxLength(4)
                .fontSize(16)
                .fontColor('#F0D98C')
                .backgroundColor('#211E18')
                .height(30)
                .width(86)
                .onChange((v: string) => {
                  this.yearEditVal = v;
                })
                .onSubmit(() => {
                  this.commitYearEdit();
                })
                .onBlur(() => {
                  this.commitYearEdit();
                })
            } else {
              Text(String(this.year))
                .fontSize(16)
                .fontWeight(FontWeight.Medium)
                .fontColor('#F0D98C')
                .onClick(() => {
                  this.yearEditVal = String(this.year);
                  this.yearEditing = true;
                })
            }
          }
          Text('›')
            .fontSize(24)
            .fontColor('#A8843C')
            .onClick(() => {
              this.changeYear(1);
            })
        }
        Row({ space: 8 }) {
          Text('‹')
            .fontSize(24)
            .fontColor('#A8843C')
            .onClick(() => {
              this.changeMonth(-1);
            })
          Column({ space: 2 }) {
            Text('月')
              .fontSize(10)
              .fontColor('#8A7B5C')
            Text(String(this.month))
              .fontSize(16)
              .fontWeight(FontWeight.Medium)
              .fontColor('#F0D98C')
          }
          Text('›')
            .fontSize(24)
            .fontColor('#A8843C')
            .onClick(() => {
              this.changeMonth(1);
            })
        }
        Blank()
        Text('今日')
          .fontSize(12)
          .fontColor('#B8A97F')
          .padding({ left: 12, right: 12, top: 5, bottom: 5 })
          .backgroundColor('#211E18')
          .borderRadius(12)
          .onClick(() => {
            this.today();
          })
      }
      .width('100%')
      Grid() {
        ForEach(WEEK_HEADS, (h: string, hi: number) => {
          GridItem() {
            Text(h)
              .fontSize(11)
              .fontColor(hi >= 5 ? '#A8843C' : '#8A7B5C')
              .textAlign(TextAlign.Center)
              .width('100%')
          }
        }, (h: string) => 'w' + h)
        ForEach(this.blankCells(), (i: number) => {
          GridItem() {
            Column()
              .width('100%')
              .height(56)
          }
        }, (i: number) => 'b' + i)
        ForEach(this.monthDays(), (r: DayRec) => {
          GridItem() {
            Column({ space: 2 }) {
              Text(String(this.dayNum(r)))
                .fontSize(14)
                .fontWeight(FontWeight.Medium)
                .fontColor(this.dayNum(r) === this.day ? '#1A1410' : '#F0E6C8')
              Text(r.dg + r.dz)
                .fontSize(9)
                .fontColor(this.dayNum(r) === this.day ? '#4A3A18' : '#8A7B5C')
              if (r.st && r.st.length > 0) {
                Text(r.st)
                  .fontSize(8)
                  .fontColor(this.dayNum(r) === this.day ? '#4A3A18' : '#A8843C')
              } else {
                Text(' ')
                  .fontSize(8)
              }
            }
            .width('100%')
            .height(56)
            .justifyContent(FlexAlign.Center)
            .borderRadius(8)
            .backgroundColor(this.dayNum(r) === this.day ? '#E9C878' : '#211E18')
            .onClick(() => {
              this.day = this.dayNum(r);
            })
          }
        }, (r: DayRec) => r.d)
      }
      .columnsTemplate('1fr 1fr 1fr 1fr 1fr 1fr 1fr')
      .columnsGap(5)
      .rowsGap(5)
      .width('100%')
    }
    .width('100%')
    .padding(16)
    .borderRadius(16)
    .backgroundColor('#1C1A16')
    .border({ width: 1, color: 'rgba(233,200,120,0.14)' })
  }

  @Builder
  private hourCard() {
    Column({ space: 10 }) {
      Row() {
        Text('占时时辰')
          .fontSize(14)
          .fontWeight(FontWeight.Medium)
          .fontColor('#F0E6C8')
        Blank()
        Text('子 23-01 · 午 11-13')
          .fontSize(10)
          .fontColor('#6B5F45')
      }
      Flex({ wrap: FlexWrap.Wrap, justifyContent: FlexAlign.Start }) {
        ForEach(HOURS, (z: string) => {
          Text(z)
            .fontSize(13)
            .fontColor(this.hourZhi === z ? '#1A1410' : '#C4B183')
            .backgroundColor(this.hourZhi === z ? '#E9C878' : '#211E18')
            .borderRadius(16)
            .padding({ left: 12, right: 12, top: 6, bottom: 6 })
            .margin({ right: 8, bottom: 8 })
            .onClick(() => {
              this.hourZhi = z;
            })
        }, (z: string) => z)
      }
      .width('100%')
    }
    .width('100%')
    .padding(16)
    .borderRadius(16)
    .backgroundColor('#1C1A16')
    .border({ width: 1, color: 'rgba(233,200,120,0.14)' })
  }

  @Builder
  private resultArea() {
    Column({ space: 14 }) {
      /* 四柱行（@Builder 按引用传递 $$：value 表达式随 chart 重赋值重新求值刷新） */
      Row() {
        this.pillar({ label: '年柱', value: this.ygcText(this.cur().r) })
        this.pillar({ label: '月柱', value: this.cur().r.mg + this.cur().r.mz })
        this.pillar({ label: '日柱', value: this.cur().r.dg + this.cur().r.dz })
        this.pillar({ label: '时柱', value: this.cur().hourGan + this.hourZhi })
        this.pillar({ label: '月将', value: this.cur().yj.zhi })
      }
      .width('100%')
      .padding({ top: 12, bottom: 12, left: 6, right: 6 })
      .borderRadius(16)
      .backgroundColor('#1C1A16')
      .border({ width: 1, color: 'rgba(233,200,120,0.14)' })

      /* 抓用神·读象 入口（半模态弹出） */
      Button('抓用神 · 读象')
        .width('100%')
        .height(42)
        .fontSize(15)
        .fontWeight(FontWeight.Medium)
        .fontColor('#1A1410')
        .linearGradient({ angle: 90, colors: [['#F5D98E', 0.0], ['#D9A94E', 1.0]] })
        .borderRadius(21)
        .shadow({ radius: 14, color: 'rgba(233,200,120,0.30)', offsetY: 3 })
        .onClick(() => {
          this.showYongShen = true;
        })

      /* 保存课例（本地记录，课例页签可一键恢复复盘） */
      Button('★ 保存课例')
        .width('100%')
        .height(36)
        .fontSize(13)
        .fontColor('#C4B183')
        .backgroundColor('#211E18')
        .borderRadius(18)
        .border({ width: 1, color: 'rgba(233,200,120,0.25)' })
        .onClick(() => {
          this.saveCase();
        })

      /* 天地盘 */
      Column({ space: 6 }) {
        Row() {
          Text('天地盘')
            .fontSize(14)
            .fontWeight(FontWeight.Medium)
            .fontColor('#F0E6C8')
          Blank()
          /* 遁干模式切换 + 辅助层开关（看盘免费；中黄断语块仍锁定） */
          if (PayConfig.paidVisible() && this.zhonghuang) {
            Row({ space: 4 }) {
              ForEach(['旬', '日遁', '时遁'], (m: string) => {
                Text(m)
                  .fontSize(10)
                  .fontColor(this.zhonghuangMode === m ? '#1A1410' : '#C4B183')
                  .backgroundColor(this.zhonghuangMode === m ? '#F0D98C' : 'rgba(138,123,92,0.12)')
                  .borderRadius(8)
                  .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                  .onClick(() => {
                    this.zhonghuangMode = m;
                  })
              }, (m: string) => 'topzh' + m)
            }
            .margin({ left: 6 })
          } else if (!PayConfig.paidVisible()) {
            /* 免费版：仅辅助层开关（无中黄） */
            Row({ space: 4 }) {
              Text('地盘干')
                .fontSize(10)
                .fontColor(this.showDunDi ? '#7FA69A' : '#6B5F45')
                .borderRadius(8)
                .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                .onClick(() => {
                  this.showDunDi = !this.showDunDi;
                })
              Text('本位')
                .fontSize(10)
                .fontColor(this.showBenshen ? '#8A7448' : '#6B5F45')
                .borderRadius(8)
                .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                .onClick(() => {
                  this.showBenshen = !this.showBenshen;
                })
            }
            .margin({ left: 6 })
          }
          /* 收费版：中黄模式下叠加辅助层开关 */
          if (PayConfig.paidVisible() && this.zhonghuang) {
            Row({ space: 4 }) {
              Text('地盘干')
                .fontSize(10)
                .fontColor(this.showDunDi ? '#7FA69A' : '#6B5F45')
                .borderRadius(8)
                .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                .onClick(() => {
                  this.showDunDi = !this.showDunDi;
                })
              Text('本位')
                .fontSize(10)
                .fontColor(this.showBenshen ? '#8A7448' : '#6B5F45')
                .borderRadius(8)
                .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                .onClick(() => {
                  this.showBenshen = !this.showBenshen;
                })
            }
            .margin({ left: 6 })
          }
        }
        .width('100%')
        Column() {
          PanDisk({
            chart: this.cur(),
            yongShen: this.yongShen,
            cands: this.cands,
            zhonghuangMode: this.zhonghuangMode,
            zhonghuang: this.zhonghuang,
            showDunDi: this.showDunDi,
            showBenshen: this.showBenshen,
            onPickZhi: (z: string, layer: string) => {
              this.pickCustomZhi(z, layer);
            }
          })
          Text(this.customYS ? '⚡ 外应取用：' + this.yongShen + '（' + (this.customLayer === '天盘' ? '天盘加临之象' : '地盘本位之象') + '）· 点盘可换' :
            '点盘任一支 = 外应取用（天盘优先）')
            .fontSize(10)
            .fontColor(this.customYS ? '#F0D98C' : '#6B5F45')
            .margin({ top: 4 })
            .width('100%')
            .textAlign(TextAlign.Center)
        }
        .width('100%')
        .alignItems(HorizontalAlign.Center)
      }
      .width('100%')
      .padding(12)
      .borderRadius(16)
      .backgroundColor('#1C1A16')
      .border({ width: 1, color: 'rgba(233,200,120,0.14)' })

      /* 四课 */
      Column({ space: 8 }) {
        Row() {
          Text('四课')
            .fontSize(14)
            .fontWeight(FontWeight.Medium)
            .fontColor('#F0E6C8')
          Blank()
          Text('右起第一课 · 干上神')
            .fontSize(10)
            .fontColor('#6B5F45')
        }
        .width('100%')
        Row({ space: 8 }) {
          KegCard({ kn: this.kegRows()[0].kn, xia: this.kegRows()[0].keg.s,
            shang: this.kegRows()[0].keg.x, jiang: this.jiangOf(this.kegRows()[0].keg.x) })
            .layoutWeight(1)
          KegCard({ kn: this.kegRows()[1].kn, xia: this.kegRows()[1].keg.s,
            shang: this.kegRows()[1].keg.x, jiang: this.jiangOf(this.kegRows()[1].keg.x) })
            .layoutWeight(1)
          KegCard({ kn: this.kegRows()[2].kn, xia: this.kegRows()[2].keg.s,
            shang: this.kegRows()[2].keg.x, jiang: this.jiangOf(this.kegRows()[2].keg.x) })
            .layoutWeight(1)
          KegCard({ kn: this.kegRows()[3].kn, xia: this.kegRows()[3].keg.s,
            shang: this.kegRows()[3].keg.x, jiang: this.jiangOf(this.kegRows()[3].keg.x),
            highlight: true })
            .layoutWeight(1)
        }
        .width('100%')
      }
      .width('100%')
      .padding(12)
      .borderRadius(16)
      .backgroundColor('#1C1A16')
      .border({ width: 1, color: 'rgba(233,200,120,0.14)' })

      /* 三传 */
      Column({ space: 8 }) {
        Row() {
          Text('三传 · ' + this.chuanTitle())
            .fontSize(14)
            .fontWeight(FontWeight.Medium)
            .fontColor('#F0E6C8')
          Blank()
          Text('九宗门')
            .fontSize(10)
            .fontColor('#6B5F45')
        }
        .width('100%')
        Row({ space: 8 }) {
          ChuanCard({ pos: this.chuanRows()[0].pos, gz: this.chuanRows()[0].gz,
            jiang: this.chuanRows()[0].jiang, lq: this.chuanRows()[0].lq, color: this.chuanRows()[0].color,
            highlight: true })
            .layoutWeight(1)
          ChuanCard({ pos: this.chuanRows()[1].pos, gz: this.chuanRows()[1].gz,
            jiang: this.chuanRows()[1].jiang, lq: this.chuanRows()[1].lq, color: this.chuanRows()[1].color })
            .layoutWeight(1)
          ChuanCard({ pos: this.chuanRows()[2].pos, gz: this.chuanRows()[2].gz,
            jiang: this.chuanRows()[2].jiang, lq: this.chuanRows()[2].lq, color: this.chuanRows()[2].color })
            .layoutWeight(1)
        }
        .width('100%')
      }
      .width('100%')
      .padding(12)
      .borderRadius(16)
      .backgroundColor('#1C1A16')
      .border({ width: 1, color: 'rgba(233,200,120,0.14)' })

      /* 课体解读卡 */
      if (this.chart && this.chuanTitle() !== '') {
        Column({ space: 6 }) {
          Row() {
            Text('课体 · ' + this.chuanTitle())
              .fontSize(14)
              .fontWeight(FontWeight.Medium)
              .fontColor('#F0E6C8')
            Blank()
            Text('九宗门课体 · 通用课义')
              .fontSize(10)
              .fontColor('#6B5F45')
          }
          .width('100%')
          if (this.ketiTxt() !== '') {
            Text(this.ketiTxt())
              .fontSize(12)
              .fontColor('#C4B183')
              .lineHeight(18)
              .width('100%')
          }
        }
        .width('100%')
        .padding(12)
        .borderRadius(16)
        .backgroundColor('#1C1A16')
        .border({ width: 1, color: 'rgba(233,200,120,0.14)' })
      }

      /* 盘态 */
      Column({ space: 2 }) {
        Row() {
          Text('盘态')
            .fontSize(14)
            .fontWeight(FontWeight.Medium)
            .fontColor('#F0E6C8')
          Blank()
          Text('旬空 · 旺衰 · 助日')
            .fontSize(10)
            .fontColor('#6B5F45')
        }
        .width('100%')
        .margin({ bottom: 4 })
        InfoRow({ label: '旬空', value: this.kongText(), tone: this.kongText() === '无' ? 'plain' : 'cinnabar' })
        InfoRow({ label: '日干旺衰', value: this.cur().dx.dayWangShuai || '—', tone: 'gold' })
        InfoRow({ label: '月将', value: this.yjText(), tone: 'plain' })
        InfoRow({ label: '月将助日', value: this.cur().dx.yuejiang.zhu ? '助' : '不助', tone: this.cur().dx.yuejiang.zhu ? 'gold' : 'plain' })
        InfoRow({ label: '贵人助日', value: this.cur().dx.guiren.zhu ? '助' : '不助', tone: this.cur().dx.guiren.zhu ? 'gold' : 'plain' })
      }
      .width('100%')
      .padding(12)
      .borderRadius(16)
      .backgroundColor('#1C1A16')
      .border({ width: 1, color: 'rgba(233,200,120,0.14)' })

      /* 解读路线：读象/毕法/中黄 三条路线速览（点击切换；四课三传先看，路线按需深入） */
      Column({ space: 8 }) {
        Row() {
          Text('解读路线')
            .fontSize(14)
            .fontWeight(FontWeight.Medium)
            .fontColor('#F0E6C8')
          Blank()
          Text('先看四课三传 · 模糊时沿一条路线深入')
            .fontSize(10)
            .fontColor('#6B5F45')
        }
        .width('100%')
        Row({ space: 6 }) {
          ForEach(['读象', '毕法', '中黄'], (r: string) => {
            Text(r)
              .fontSize(12)
              .fontColor(this.route === r ? '#1A1410' : '#C4B183')
              .backgroundColor(this.route === r ? '#F0D98C' : 'rgba(138,123,92,0.12)')
              .borderRadius(10)
              .padding({ left: 14, right: 14, top: 4, bottom: 4 })
              .onClick(() => {
                this.route = (this.route === r) ? '' : r;
              })
          }, (r: string) => 'route' + r)
        }
        .width('100%')

        if (this.route === '读象') {
          Column({ space: 4 }) {
            Text('读象路线：以用神/类神为链——选占事 → 类神候选 → 节点卡 → 动态三传 → 读象直断')
              .fontSize(11)
              .fontColor('#C4B183')
              .lineHeight(16)
              .width('100%')
            Row({ space: 6 }) {
              Text('打开抓用神')
                .fontSize(12)
                .fontColor('#F0D98C')
                .backgroundColor('rgba(233,200,120,0.12)')
                .borderRadius(10)
                .padding({ left: 12, right: 12, top: 4, bottom: 4 })
                .onClick(() => {
                  this.showYongShen = true;
                })
              Text(this.yongShen !== '' ? '当前用神：' + this.yongShen : '尚未取用神')
                .fontSize(11)
                .fontColor('#8A7B5C')
            }
            .width('100%')
          }
          .width('100%')
        } else if (this.route === '毕法') {
          Column({ space: 4 }) {
            Text('毕法路线：以格局为链——命中格局 → 五层定位 → 教练组合断')
              .fontSize(11)
              .fontColor('#C4B183')
              .lineHeight(16)
              .width('100%')
            if (this.coach && this.coach.items.length > 0) {
              Text(this.coach.summary)
                .fontSize(11)
                .fontColor('#F0D98C')
                .lineHeight(16)
                .width('100%')
            } else {
              Text('本课无毕法格局命中')
                .fontSize(11)
                .fontColor('#6B5F45')
                .lineHeight(16)
                .width('100%')
            }
          }
          .width('100%')
        } else if (this.route === '中黄') {
          Column({ space: 4 }) {
            Text('中黄路线（先锋链路）：时支(先锋门) → 变干(动能) → 初传/用神(落点)')
              .fontSize(11)
              .fontColor('#C4B183')
              .lineHeight(16)
              .width('100%')
            if (this.zhonghuangAna) {
              Text('时支' + this.zhonghuangAna.dun.hourZhi + ' → 变干' + this.zhonghuangAna.dun.bianGan +
                '(' + this.zhonghuangAna.bianGong + '宫' +
                (this.zhonghuangAna.bianJiang !== '' ? ' 乘' + this.zhonghuangAna.bianJiang : '') +
                ') 为日干之' + this.zhonghuangAna.bianLq +
                (this.zhonghuangAna.bianInChuan !== '' ? ' · 入' + this.zhonghuangAna.bianInChuan : ''))
                .fontSize(12)
                .fontWeight(FontWeight.Medium)
                .fontColor('#F0D98C')
                .lineHeight(17)
                .width('100%')
            } else {
              Text('排盘后自动生成先锋链路')
                .fontSize(11)
                .fontColor('#6B5F45')
                .lineHeight(16)
                .width('100%')
            }
          }
          .width('100%')
        }
      }
      .width('100%')
      .padding(12)
      .borderRadius(16)
      .backgroundColor('#1C1A16')
      .border({ width: 1, color: 'rgba(233,200,120,0.14)' })

      /* 神煞 */
      Column({ space: 8 }) {
        Row() {
          Text('神煞')
            .fontSize(14)
            .fontWeight(FontWeight.Medium)
            .fontColor('#F0E6C8')
          Blank()
          Text('日支 · 月将 · 初传所带')
            .fontSize(10)
            .fontColor('#6B5F45')
        }
        .width('100%')
        ForEach(this.shenshaGroups(), (g: ShenshaGroup) => {
          Column({ space: 6 }) {
            Row() {
              Text(g.label)
                .fontSize(11)
                .fontColor('#8A7B5C')
              Blank()
              if (g.names.length === 0) {
                Text('无')
                  .fontSize(11)
                  .fontColor('#5A4F3D')
              }
            }
            .width('100%')
            Flex({ wrap: FlexWrap.Wrap }) {
              ForEach(g.names, (n: string) => {
                TagBadge({ text: n, tone: 'gold' })
                  .margin({ right: 6, bottom: 6 })
              }, (n: string) => g.label + n)
            }
            .width('100%')
          }
          .width('100%')
          .padding({ top: 4, bottom: 4 })
        }, (g: ShenshaGroup) => g.label)
      }
      .width('100%')
      .padding(12)
      .borderRadius(16)
      .backgroundColor('#1C1A16')
      .border({ width: 1, color: 'rgba(233,200,120,0.14)' })

      /* 毕法 */
      Column({ space: 8 }) {
        Row() {
          Text('毕法格局')
            .fontSize(14)
            .fontWeight(FontWeight.Medium)
            .fontColor('#F0E6C8')
          Blank()
          Text('点击展开定位五层')
            .fontSize(10)
            .fontColor('#6B5F45')
        }
        .width('100%')
        /* 付费门禁：毕法教练（付费区仅开发/收费版显示；免费版整体隐藏） */
        if (PayConfig.paidVisible() && !PayGate.isUnlocked(PayConfig.F_BIFA)) {
          Row({ space: 6 }) {
            Text('🔒')
              .fontSize(13)
            Text('毕法法诀研习内容（组合对照 · 参考提示）为付费解锁')
              .fontSize(11)
              .fontColor('#8A7B5C')
            Blank()
            Text('解锁')
              .fontSize(12)
              .fontColor('#F0D98C')
              .onClick(() => {
                this.unlockBifa();
              })
          }
          .width('100%')
          .padding({ top: 6 })
          .border({ width: { top: 1 }, color: 'rgba(233,200,120,0.15)' })
        }
        /* 毕法教练栏（组合断 + 建议汇总；付费区仅开发/收费版显示） */
        if (this.coach && PayConfig.paidVisible() && PayGate.isUnlocked(PayConfig.F_BIFA) && this.coach.items.length > 0) {
          Column({ space: 4 }) {
            Row({ space: 6 }) {
              Text('🧭')
                .fontSize(14)
              Text(this.coach.summary)
                .fontSize(12)
                .fontWeight(FontWeight.Medium)
                .fontColor(this.coach.xiong > this.coach.ji ? '#E8A483' : '#F0D98C')
                .lineHeight(17)
                .layoutWeight(1)
            }
            .width('100%')
            if (this.coach.groups.length > 0) {
              ForEach(this.coach.groups, (g: string) => {
                Text('· ' + g)
                  .fontSize(11)
                  .fontColor('#C4B183')
                  .lineHeight(16)
                  .width('100%')
              }, (g: string) => g)
            }
            if (this.coach.advice.length > 0) {
              Text('建议：' + this.coach.advice.join('；'))
                .fontSize(11)
                .fontColor('#B8A97F')
                .lineHeight(16)
                .width('100%')
            }
            Text('以上为古籍毕法断语整理，仅供传统文化研习参考，不构成医疗、法律或决策建议')
              .fontSize(9)
              .fontColor('#5A4F3D')
              .lineHeight(13)
              .width('100%')
          }
          .width('100%')
          .padding(10)
          .borderRadius(12)
          .backgroundColor(this.coach.xiong > this.coach.ji ? 'rgba(208,112,74,0.10)' : 'rgba(233,200,120,0.08)')
          .border({ width: 1, color: this.coach.xiong > this.coach.ji ? 'rgba(208,112,74,0.35)' : 'rgba(233,200,120,0.25)' })
        }
        if (this.cur().dx.bifa.length === 0) {
          Text('本课无毕法格局命中')
            .fontSize(12)
            .fontColor('#5A4F3D')
            .margin({ top: 2 })
        }
        ForEach(this.cur().dx.bifa, (hit: BifaHit) => {
          Column({ space: 6 }) {
            Row({ space: 8 }) {
              Text(hit.法名)
                .fontSize(14)
                .fontWeight(FontWeight.Medium)
                .fontColor('#F0D98C')
              TagBadge({ text: '第' + hit.序 + '法', tone: 'cinnabar' })
              Blank()
              Text(this.expandedBifa === hit.序 ? '收起' : '展开')
                .fontSize(11)
                .fontColor('#A8843C')
            }
            .width('100%')
            Text(hit.判)
              .fontSize(12)
              .fontColor('#B8A97F')
              .lineHeight(18)
              .width('100%')
            if (this.expandedBifa === hit.序) {
              Column({ space: 2 }) {
                InfoRow({ label: '定性', value: this.layerOf(hit.序, '定性') })
                InfoRow({ label: '定象', value: this.layerOf(hit.序, '定象') })
                InfoRow({ label: '定时', value: this.layerOf(hit.序, '定时') })
                InfoRow({ label: '定策', value: this.layerOf(hit.序, '定策') })
                InfoRow({ label: '定级', value: this.layerOf(hit.序, '定级') })
              }
              .width('100%')
              .padding({ top: 4, left: 2, right: 2 })
              .border({ width: { top: 1 }, color: 'rgba(233,200,120,0.15)' })
            }
          }
          .width('100%')
          .padding(12)
          .borderRadius(12)
          .backgroundColor('#211E18')
          .border({ width: 1, color: 'rgba(233,200,120,0.18)' })
          .onClick(() => {
            this.expandedBifa = (this.expandedBifa === hit.序) ? -1 : hit.序;
          })
        }, (hit: BifaHit) => 'b' + hit.序)

        /* 年命适配（付费门禁；付费区仅开发/收费版显示，免费版整体隐藏） */
        if (PayConfig.paidVisible() && PayGate.isUnlocked(PayConfig.F_BIFA)) {
          Column({ space: 6 }) {
            Row() {
              Text('年命适配')
                .fontSize(11)
                .fontColor('#8A7B5C')
              Blank()
              Text('选年命地支 · 看个性化建议')
                .fontSize(10)
                .fontColor('#5A4F3D')
            }
            .width('100%')
            Scroll() {
              Row({ space: 6 }) {
                ForEach(HOURS, (z: string) => {
                  Text(z)
                    .fontSize(12)
                    .fontColor(this.nianZhi === z ? '#1A1410' : '#C4B183')
                    .backgroundColor(this.nianZhi === z ? '#F0D98C' : 'rgba(138,123,92,0.12)')
                    .borderRadius(12)
                    .padding({ left: 10, right: 10, top: 4, bottom: 4 })
                    .onClick(() => {
                      this.nianZhi = z;
                      const c = this.chart;
                      if (c) {
                        this.nianming = LiurenCore.nianmingAdvice(c, z, this.yongShen);
                      }
                    })
                }, (z: string) => 'nz' + z)
              }
              .padding({ left: 2, right: 2, top: 2, bottom: 2 })
            }
            .scrollable(ScrollDirection.Horizontal)
            .scrollBar(BarState.Off)
            .edgeEffect(EdgeEffect.Spring)
            .width('100%')
            if (this.nianming) {
              Text('年命' + this.nianming.nianZhi + ' · 上神' + this.nianming.shangShen +
                '（' + this.nianming.liuqin + '）' + (this.nianming.kong ? '·空' : '') +
                ' ' + this.nianming.wangShuai +
                (this.nianming.rel !== '' ? ' · 与用神' + this.nianming.rel : ''))
                .fontSize(11)
                .fontColor('#C4B183')
                .lineHeight(16)
                .width('100%')
              Text(this.nianming.advice)
                .fontSize(12)
                .fontColor('#F0D98C')
                .lineHeight(18)
                .width('100%')
            }

            /* 行年小运：出生年 + 性别 → 本命/行年/上神 */
            Row() {
              Text('行年小运')
                .fontSize(11)
                .fontColor('#8A7B5C')
              Blank()
              Text('出生年 + 性别 · 看今年')
                .fontSize(10)
                .fontColor('#5A4F3D')
            }
            .width('100%')
            Row({ space: 12 }) {
              Row({ space: 8 }) {
                Text('‹')
                  .fontSize(24)
                  .fontColor('#A8843C')
                  .onClick(() => {
                    this.changeBirthYear(-1);
                  })
                Column({ space: 2 }) {
                  Text('出生年 · 点击输入')
                    .fontSize(10)
                    .fontColor('#8A7B5C')
                  if (this.birthEditing) {
                    TextInput({ text: this.birthEditVal, placeholder: String(this.birthYear) })
                      .type(InputType.Number)
                      .maxLength(4)
                      .fontSize(16)
                      .fontColor('#F0D98C')
                      .backgroundColor('#211E18')
                      .height(30)
                      .width(86)
                      .onChange((v: string) => {
                        this.birthEditVal = v;
                      })
                      .onSubmit(() => {
                        this.commitBirthEdit();
                      })
                      .onBlur(() => {
                        this.commitBirthEdit();
                      })
                  } else {
                    Text(String(this.birthYear))
                      .fontSize(16)
                      .fontWeight(FontWeight.Medium)
                      .fontColor('#F0D98C')
                      .onClick(() => {
                        this.birthEditVal = String(this.birthYear);
                        this.birthEditing = true;
                      })
                  }
                }
                Text('›')
                  .fontSize(24)
                  .fontColor('#A8843C')
                  .onClick(() => {
                    this.changeBirthYear(1);
                  })
              }
              Row({ space: 6 }) {
                ForEach(['男', '女'], (g: string) => {
                  Text(g)
                    .fontSize(12)
                    .fontColor(this.gender === g ? '#1A1410' : '#C4B183')
                    .backgroundColor(this.gender === g ? '#F0D98C' : 'rgba(138,123,92,0.12)')
                    .borderRadius(10)
                    .padding({ left: 12, right: 12, top: 3, bottom: 3 })
                    .onClick(() => {
                      this.gender = g;
                      const c = this.chart;
                      if (c) {
                        this.xingnian = LiurenCore.xingNian(c, this.birthYear, this.year, g, this.yongShen);
                      }
                    })
                }, (g: string) => 'g' + g)
              }
            }
            .width('100%')
            if (this.xingnian) {
              Text('本命' + this.xingnian.benMingGan + this.xingnian.benMingZhi +
                '（' + (this.xingnian.shun ? '顺行' : '逆行') + '）· 行年' + this.xingnian.xingNianZhi +
                ' · 上神' + this.xingnian.shangShen + '（' + this.xingnian.liuqin + '）' +
                (this.xingnian.kong ? '·空' : '') + ' ' + this.xingnian.wangShuai)
                .fontSize(11)
                .fontColor('#C4B183')
                .lineHeight(16)
                .width('100%')
              if (this.xingnian.rel !== '') {
                Text('与用神' + this.xingnian.yongShen + '：' + this.xingnian.rel)
                  .fontSize(11)
                  .fontColor('#C4B183')
                  .lineHeight(16)
                  .width('100%')
              }
              Text('流年·' + this.xingnian.tsRel + (this.xingnian.jiang !== '' ? ' · 乘将' + this.xingnian.jiang + '（' + this.xingnian.jiangJx + '）' : ''))
                .fontSize(11)
                .fontColor('#C4B183')
                .lineHeight(16)
                .width('100%')
              Text('研习参考 · 吉凶权重 ' + this.xingnian.score + '分（' + this.xingnian.band + '）')
                .fontSize(13)
                .fontWeight(FontWeight.Medium)
                .fontColor(this.bandColor(this.xingnian.band))
                .lineHeight(18)
                .width('100%')
              Text(this.xingnian.advice)
                .fontSize(12)
                .fontColor('#F0D98C')
                .lineHeight(18)
                .width('100%')
              Text('注：行年起法依《六壬大全》本命起数；《集要》另法存疑未采')
                .fontSize(9)
                .fontColor('#5A4F3D')
                .lineHeight(13)
                .width('100%')
            }
          }
          .width('100%')
          .padding({ top: 8 })
          .border({ width: { top: 1 }, color: 'rgba(233,200,120,0.15)' })
        }

        /* 中黄研习（付费门禁；双视角对比 + 变干主线 + 建合检测） */
        if (PayConfig.paidVisible() && PayGate.isUnlocked(PayConfig.F_ZHONGHUANG) && this.zhonghuangAna) {
          Column({ space: 6 }) {
            Row() {
              Text('中黄五变经')
                .fontSize(11)
                .fontColor('#8A7B5C')
              Blank()
              Text('日干遁·时干遁 双演 · 遁干切换在天地盘标题')
                .fontSize(10)
                .fontColor('#5A4F3D')
            }
            .width('100%')

            /* ① 双视角对比：旬遁 vs 中黄 六亲变化 */
            Text('① 六亲视角对比（旬遁 → 中黄）· 变化 ' + this.zhonghuangAna.changed.length + ' 宫')
              .fontSize(11)
              .fontWeight(FontWeight.Medium)
              .fontColor('#C4B183')
              .width('100%')
            Flex({ wrap: FlexWrap.Wrap }) {
              ForEach(this.zhonghuangAna.cmp, (it: ZhonghuangCmpItem) => {
                Text(it.gong + ' ' + it.xunLq + (it.changed ? ('→' + it.zhLq) : ''))
                  .fontSize(10)
                  .fontColor(it.changed ? '#F0D98C' : '#6B5F45')
                  .backgroundColor(it.changed ? 'rgba(240,217,140,0.12)' : 'rgba(107,95,69,0.12)')
                  .borderRadius(8)
                  .padding({ left: 7, right: 7, top: 3, bottom: 3 })
                  .margin({ right: 5, bottom: 5 })
              }, (it: ZhonghuangCmpItem) => 'cmp' + it.gong)
            }
            .width('100%')

            /* ② 变干主线 */
            Text('② 变干主线：变干' + this.zhonghuangAna.dun.bianGan + '(' + this.zhonghuangAna.bianGong + '宫)' +
              (this.zhonghuangAna.bianJiang !== '' ? ' 乘' + this.zhonghuangAna.bianJiang : '') +
              ' 为日干' + this.zhonghuangAna.dun.dayGan + '之' + this.zhonghuangAna.bianLq +
              (this.zhonghuangAna.bianInChuan !== '' ? ' · 入' + this.zhonghuangAna.bianInChuan : ' · 不入三传'))
              .fontSize(12)
              .fontWeight(FontWeight.Medium)
              .fontColor('#F0D98C')
              .lineHeight(17)
              .width('100%')
            Text(this.zhonghuangTxt())
              .fontSize(11)
              .fontColor('#C4B183')
              .lineHeight(16)
              .width('100%')

            /* ③ 建合检测 */
            Text('③ 建合检测（日遁×时遁 天干五合）')
              .fontSize(11)
              .fontWeight(FontWeight.Medium)
              .fontColor('#C4B183')
              .width('100%')
            if (this.zhonghuangAna.jianhe.length === 0) {
              Text('本盘无建合（日遁与时遁在日上/支上/变干宫/三传无干合）')
                .fontSize(11)
                .fontColor('#6B5F45')
                .lineHeight(16)
                .width('100%')
            } else {
              ForEach(this.zhonghuangAna.jianhe, (jh: ZhonghuangJianhe) => {
                Text(jh.pos + '(' + jh.gong + '宫) 日遁' + jh.riGan + '×时遁' + jh.shiGan + ' → ' + jh.type + '（吉，夫妇相见鬼不能克）')
                  .fontSize(11)
                  .fontColor('#F0D98C')
                  .lineHeight(16)
                  .width('100%')
              }, (jh: ZhonghuangJianhe) => 'jh' + jh.pos)
            }

            Text('注：中黄以日干及时干各起五鼠遁排天干，与传统旬遁不同（古籍研习参考）')
              .fontSize(9)
              .fontColor('#5A4F3D')
              .lineHeight(13)
              .width('100%')
          }
          .width('100%')
          .padding({ top: 8 })
          .border({ width: { top: 1 }, color: 'rgba(233,200,120,0.15)' })
        }
      }
      .width('100%')
      .padding(12)
      .borderRadius(16)
      .backgroundColor('#1C1A16')
      .border({ width: 1, color: 'rgba(233,200,120,0.14)' })
    }
    .width('100%')
  }

  /* 按引用传递（对象字面量 $$）：重排盘后 value 随 chart 变化刷新（按值传参不刷新） */
  @Builder
  private pillar($$: PillarParams) {
    Column({ space: 3 }) {
      Text($$.label)
        .fontSize(10)
        .fontColor('#8A7B5C')
      Text($$.value)
        .fontSize(14)
        .fontWeight(FontWeight.Medium)
        .fontColor('#F0D98C')
    }
    .layoutWeight(1)
  }

  /* ============================ 根布局 ============================ */

  /* 底部页签按钮（暗底金字，选中亮金） */
  @Builder
  private tabBar(title: string, glyph: string, idx: number) {
    Column({ space: 3 }) {
      Text(glyph)
        .fontSize(16)
        .fontColor(this.curTab === idx ? '#F0D98C' : '#6B5F45')
      Text(title)
        .fontSize(10)
        .fontColor(this.curTab === idx ? '#F0D98C' : '#6B5F45')
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
  }

  build() {
    Stack() {
      /* 沉浸背景层：延伸到状态栏与底部导航条之下（导航条背景与应用融合） */
      Column()
        .width('100%')
        .height('100%')
        .backgroundColor('#14120F')
        .expandSafeArea([SafeAreaType.SYSTEM], [SafeAreaEdge.TOP, SafeAreaEdge.BOTTOM])

      /* 内容层：不做安全区扩展——底部页签栏避让导航条，滚动内容与按钮不被遮挡 */
      Tabs({ barPosition: BarPosition.End, index: this.curTab }) {
      TabContent() {
        Column() {
          this.header()

          Scroll() {
        Column({ space: 14 }) {
          this.dateCard()
          this.hourCard()

          Button('排 盘')
            .width('100%')
            .height(48)
            .fontSize(17)
            .fontWeight(FontWeight.Medium)
            .fontColor('#1A1410')
            .linearGradient({ angle: 90, colors: [['#F5D98E', 0.0], ['#D9A94E', 1.0]] })
            .borderRadius(24)
            .shadow({ radius: 18, color: 'rgba(233,200,120,0.35)', offsetY: 4 })
            .enabled(this.ready)
            .opacity(this.ready ? 1 : 0.4)
            .onClick(() => {
              this.doChart();
            })

          Text(this.ready ? '规则与历法已就绪 · 选择日期时辰后排盘' : '正在载入历法数据…')
            .fontSize(11)
            .fontColor('#6B5F45')
            .textAlign(TextAlign.Center)

          /* 古籍案例速排 */
          Row({ space: 6 }) {
            Text('📜 古籍案例速排')
              .fontSize(12)
              .fontColor(this.showAncient ? '#F0D98C' : '#C4B183')
              .padding({ left: 12, right: 12, top: 4, bottom: 4 })
              .borderRadius(10)
              .backgroundColor(this.showAncient ? 'rgba(240,217,140,0.12)' : 'rgba(138,123,92,0.12)')
              .onClick(() => {
                this.showAncient = !this.showAncient;
              })
            Text(this.ancientNote !== '' ? this.ancientNote : '输入古案例（月将+日干支+占时）→ 完整盘面')
              .fontSize(10)
              .fontColor('#8A7B5C')
          }
          .width('100%')

          if (this.showAncient) {
            Column({ space: 6 }) {
              Text('必填：月将支 + 日干 + 日支 + 占时；选填：年干支/月支（有则神煞完整）')
                .fontSize(10)
                .fontColor('#6B5F45')
                .width('100%')
              /* 月将（横向滚动） */
              Row() {
                Text('月将').fontSize(11).fontColor('#8A7B5C').margin({ right: 6 })
                Scroll() {
                  Row({ space: 6 }) {
                    ForEach(HOURS, (z: string) => {
                      Text(z)
                        .fontSize(12)
                        .fontColor(this.ancientMj === z ? '#1A1410' : '#C4B183')
                        .backgroundColor(this.ancientMj === z ? '#F0D98C' : 'rgba(138,123,92,0.12)')
                        .borderRadius(8)
                        .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                        .onClick(() => { this.ancientMj = z; })
                    }, (z: string) => 'amj' + z)
                  }
                }
                .scrollable(ScrollDirection.Horizontal)
                .scrollBar(BarState.Off)
                .layoutWeight(1)
              }
              .width('100%')
              /* 日干（横向滚动） */
              Row() {
                Text('日干').fontSize(11).fontColor('#8A7B5C').margin({ right: 6 })
                Scroll() {
                  Row({ space: 6 }) {
                    ForEach(LiurenCore.GAN, (g: string) => {
                      Text(g)
                        .fontSize(12)
                        .fontColor(this.ancientDg === g ? '#1A1410' : '#C4B183')
                        .backgroundColor(this.ancientDg === g ? '#F0D98C' : 'rgba(138,123,92,0.12)')
                        .borderRadius(8)
                        .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                        .onClick(() => { this.ancientDg = g; })
                    }, (g: string) => 'adg' + g)
                  }
                }
                .scrollable(ScrollDirection.Horizontal)
                .scrollBar(BarState.Off)
                .layoutWeight(1)
              }
              .width('100%')
              /* 日支（横向滚动） */
              Row() {
                Text('日支').fontSize(11).fontColor('#8A7B5C').margin({ right: 6 })
                Scroll() {
                  Row({ space: 6 }) {
                    ForEach(HOURS, (z: string) => {
                      Text(z)
                        .fontSize(12)
                        .fontColor(this.ancientDz === z ? '#1A1410' : '#C4B183')
                        .backgroundColor(this.ancientDz === z ? '#F0D98C' : 'rgba(138,123,92,0.12)')
                        .borderRadius(8)
                        .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                        .onClick(() => { this.ancientDz = z; })
                    }, (z: string) => 'adz' + z)
                  }
                }
                .scrollable(ScrollDirection.Horizontal)
                .scrollBar(BarState.Off)
                .layoutWeight(1)
              }
              .width('100%')
              /* 占时（横向滚动） */
              Row() {
                Text('占时').fontSize(11).fontColor('#8A7B5C').margin({ right: 6 })
                Scroll() {
                  Row({ space: 6 }) {
                    ForEach(HOURS, (z: string) => {
                      Text(z)
                        .fontSize(12)
                        .fontColor(this.ancientHz === z ? '#1A1410' : '#C4B183')
                        .backgroundColor(this.ancientHz === z ? '#F0D98C' : 'rgba(138,123,92,0.12)')
                        .borderRadius(8)
                        .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                        .onClick(() => { this.ancientHz = z; })
                    }, (z: string) => 'ahz' + z)
                  }
                }
                .scrollable(ScrollDirection.Horizontal)
                .scrollBar(BarState.Off)
                .layoutWeight(1)
              }
              .width('100%')
              /* 选填：年干/年支/月支 */
              Row() {
                Text('年干(选)').fontSize(10).fontColor('#6B5F45').margin({ right: 6 })
                Scroll() {
                  Row({ space: 6 }) {
                    ForEach(LiurenCore.GAN, (g: string) => {
                      Text(g)
                        .fontSize(11)
                        .fontColor(this.ancientYG === g ? '#1A1410' : '#8A7B5C')
                        .backgroundColor(this.ancientYG === g ? '#F0D98C' : 'rgba(107,95,69,0.2)')
                        .borderRadius(6)
                        .padding({ left: 5, right: 5, top: 1, bottom: 1 })
                        .onClick(() => { this.ancientYG = (this.ancientYG === g) ? '' : g; })
                    }, (g: string) => 'ayg' + g)
                  }
                }
                .scrollable(ScrollDirection.Horizontal)
                .scrollBar(BarState.Off)
                .layoutWeight(1)
              }
              .width('100%')
              Row() {
                Text('年支(选)').fontSize(10).fontColor('#6B5F45').margin({ right: 6 })
                Scroll() {
                  Row({ space: 6 }) {
                    ForEach(HOURS, (z: string) => {
                      Text(z)
                        .fontSize(11)
                        .fontColor(this.ancientYZ === z ? '#1A1410' : '#8A7B5C')
                        .backgroundColor(this.ancientYZ === z ? '#F0D98C' : 'rgba(107,95,69,0.2)')
                        .borderRadius(6)
                        .padding({ left: 5, right: 5, top: 1, bottom: 1 })
                        .onClick(() => { this.ancientYZ = (this.ancientYZ === z) ? '' : z; })
                    }, (z: string) => 'ayz' + z)
                  }
                }
                .scrollable(ScrollDirection.Horizontal)
                .scrollBar(BarState.Off)
                .layoutWeight(1)
              }
              .width('100%')
              Row() {
                Text('月支(选)').fontSize(10).fontColor('#6B5F45').margin({ right: 6 })
                Scroll() {
                  Row({ space: 6 }) {
                    ForEach(HOURS, (z: string) => {
                      Text(z)
                        .fontSize(11)
                        .fontColor(this.ancientMZ === z ? '#1A1410' : '#8A7B5C')
                        .backgroundColor(this.ancientMZ === z ? '#F0D98C' : 'rgba(107,95,69,0.2)')
                        .borderRadius(6)
                        .padding({ left: 5, right: 5, top: 1, bottom: 1 })
                        .onClick(() => { this.ancientMZ = (this.ancientMZ === z) ? '' : z; })
                    }, (z: string) => 'amz' + z)
                  }
                }
                .scrollable(ScrollDirection.Horizontal)
                .scrollBar(BarState.Off)
                .layoutWeight(1)
              }
              .width('100%')
              Button('反推盘面')
                .width('100%')
                .height(36)
                .fontSize(14)
                .fontColor('#1A1410')
                .linearGradient({ angle: 90, colors: [['#F5D98E', 0.0], ['#D9A94E', 1.0]] })
                .borderRadius(18)
                .onClick(() => {
                  this.doAncientChart();
                })
            }
            .width('100%')
            .padding(10)
            .borderRadius(12)
            .backgroundColor('#211E18')
            .border({ width: 1, color: 'rgba(233,200,120,0.15)' })
          }

          if (this.chart) {
            this.resultArea()
          } else {
            Text('起课后在此显示：天地盘 · 四课 · 三传 · 盘态 · 神煞 · 毕法格局')
              .fontSize(12)
              .fontColor('#5A4F3D')
              .textAlign(TextAlign.Center)
              .lineHeight(20)
              .width('100%')
              .padding({ top: 24, bottom: 24 })
          }
        }
        .width('100%')
        .padding({ left: 16, right: 16, top: 14, bottom: 40 })
      }
      .layoutWeight(1)
      .scrollBar(BarState.Off)
      .edgeEffect(EdgeEffect.Spring)
        }
        .width('100%')
        .height('100%')
        .bindSheet($$this.showYongShen, this.yongShenSheet(), {
          height: SheetSize.MEDIUM,
          dragBar: true,
          showClose: false,
          backgroundColor: '#1C1A16'
        })
      }
      .tabBar(this.tabBar('排盘', '☷', 0))

      /* 课例页签：保存的排盘记录（点卡片恢复重排） */
      TabContent() {
        CaseBoard({
          cases: this.cases,
          onDelete: (ts: number) => {
            this.deleteCase(ts);
          },
          onRestore: (rec: CaseRec) => {
            this.restoreCase(rec);
          }
        })
      }
      .tabBar(this.tabBar('课例', '✦', 1))

      /* 古籍页签：中黄五变经全文（目录 + 阅读） */
      TabContent() {
        AncientStudy({ book: this.ancient })
      }
      .tabBar(this.tabBar('古籍', '❖', 2))
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#14120F')
    .barWidth('100%')
    .barHeight(58)
    .onChange((i: number) => {
      this.curTab = i;
    })
    }
    .width('100%')
    .height('100%')
  }


  /* 选占事：重算候选并用神（沿用旧用神或取首候选），同步更新盘面高亮 */
  private pickYongShenAffair(name: string): void {
    this.affairName = name;
    this.anchor = '';
    const c = this.chart;
    const aff = YongShenCore.affairByName(name);
    if (!c || !aff) {
      this.yongShen = '';
      this.cands = [];
      this.customYS = false;
      return;
    }
    const cs = YongShenCore.candidates(c, aff);
    const list: string[] = [];
    for (let i = 0; i < cs.length; i++) {
      list.push(cs[i].zhi);
    }
    this.cands = list;
    if (list.length === 0) {
      this.yongShen = '';
      this.customYS = false;
      return;
    }
    let keep = '';
    for (let i = 0; i < list.length; i++) {
      if (list[i] === this.yongShen) {
        keep = this.yongShen;
        break;
      }
    }
    this.yongShen = keep !== '' ? keep : list[0];
    /* 切占事 → 回到占事驱动（自定义标记清除） */
    this.customYS = false;
  }

  /* 外应取用：盘面点击任一支 → 自定义为用神（天盘支优先；动态三传/毕法/年命行年自动联动） */
  private pickCustomZhi(zhi: string, layer: string): void {
    this.yongShen = zhi;
    this.cands = [];
    this.customYS = true;
    this.customLayer = layer;
    this.anchor = '';
    /* 刷新毕法与年命行年（用神已变） */
    const c = this.chart;
    if (c) {
      this.coach = LiurenCore.bifaCoach(c.dx.bifa, this.coachData);
      if (this.nianZhi !== '') {
        this.nianming = LiurenCore.nianmingAdvice(c, this.nianZhi, this.yongShen);
      }
      this.xingnian = LiurenCore.xingNian(c, this.birthYear, this.year, this.gender, this.yongShen);
    }
    /* 自动弹出抓用神，告知所选用神（迷你盘同步显示） */
    this.showYongShen = true;
  }

  /* 解锁毕法研习内容（带结果提示） */
  private unlockBifa(): void {
    const res = PayGate.requestUnlock(PayConfig.F_BIFA);
    res.then((r: PurchaseResult) => {
      if (r.success) {
        this.showTip('已解锁研习内容');
      } else {
        this.showTip(r.msg !== '' ? r.msg : '解锁未完成');
      }
    }).catch(() => {
      this.showTip('解锁失败');
    });
  }

  /* 简单 toast 提示 */
  private showTip(msg: string): void {
    this.getUIContext().getPromptAction().showToast({ message: msg, duration: 2000 });
  }

  /* 中黄变干断语（基于 analyze 的变干六亲） */
  private zhonghuangTxt(): string {
    const a = this.zhonghuangAna;
    if (!a) {
      return '';
    }
    const lq = a.bianLq;
    let txt = '变干' + a.dun.bianGan + '为日干' + a.dun.dayGan + '之' + lq;
    if (lq === '官鬼') {
      txt += '（鬼贼，防官非疾病，宜寻子孙制化）';
    } else if (lq === '妻财') {
      txt += '（财，求财有机会，宜主动）';
    } else if (lq === '父母') {
      txt += '（父，得文书长辈之助）';
    } else if (lq === '子孙') {
      txt += '（子，逢凶有解）';
    } else {
      txt += '（比肩，同辈合作，防争夺）';
    }
    if (a.bianInChuan !== '') {
      txt += ' 变干入' + a.bianInChuan + '，事应之速。';
    } else {
      txt += ' 变干不入三传，事缓。';
    }
    if (a.changed.length > 0) {
      txt += ' 六亲视角变化' + a.changed.length + '宫（' + a.changed.join('') + '），中黄断课与此异。';
    }
    return txt;
  }

  /* 抓用神半模态内容（复用 YongShenSheet 组件） */
  @Builder
  private yongShenSheet() {
    if (this.chart) {
      YongShenSheet({
        chart: this.chart,
        zhanShi: this.zhanShi,
        leixiang: this.leixiang,
        xiangyi: this.xiangyi,
        hourZhi: this.hourZhi,
        affairName: this.affairName,
        yongShen: this.yongShen,
        anchor: this.anchor,
        onAffairChange: (n: string) => {
          this.pickYongShenAffair(n);
        },
        onYongShenChange: (ys: string, cs: string[]) => {
          this.yongShen = ys;
          this.cands = cs;
        },
        onAnchorChange: (v: string) => {
          this.anchor = v;
        },
        onPickZhi: (z: string, layer: string) => {
          this.pickCustomZhi(z, layer);
        },
        onClose: () => {
          this.showYongShen = false;
        }
      })
    }
  }
}

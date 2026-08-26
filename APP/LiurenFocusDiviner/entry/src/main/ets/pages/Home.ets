/**
 * Home —— 首页（起课台 + 三大入口）
 * ----------------------------------------------------------------------------
 * 职责：
 *  - 万年历选期（日期/时辰）—— 原 Index.dateCard/hourCard 逻辑
 *  - 三大入口：排盘（带日期时辰进 Index 自动出盘）/ 课例（进 Cases）/ 古籍（进 Ancient）
 * 数据：DataLoader 读 rawfile（cal/ 万年历）
 * 路由：getRouter().pushUrl(params) 传日期时辰到 Index
 * ArkTS 合规：零 any / unknown；显式类型
 */
import { common } from '@kit.AbilityKit';
import type { DayRec } from '../model/LiurenCore';
import { DataLoader } from '../model/DataLoader';

const MIN_YEAR: number = 1900;
const MAX_YEAR: number = 2060;
const HOURS: string[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const WEEK_HEADS: string[] = ['一', '二', '三', '四', '五', '六', '日'];

@Entry
@Component
struct Home {
  @State private year: number = 2026;
  @State private month: number = 1;
  @State private day: number = 1;
  @State private hourZhi: string = '午';
  @State private ready: boolean = false;
  @State private calData: Record<string, DayRec[]> = {};
  /* 已从路由收到日期参数（Index 返回）：为 true 时 initData 不再用当前时间覆盖 */
  private routeDateSet: boolean = false;
  /* 年份就地编辑 */
  @State private yearEditing: boolean = false;
  @State private yearEditVal: string = '';

  aboutToAppear(): void {
    /* 收 Index 返回时带回的日期参数（replaceUrl 回 Home） */
    this.applyRouteParams();
    this.initData();
  }

  /* 读取 Index 返回的日期时辰参数；无参数用当天 */
  private applyRouteParams(): void {
    try {
      const p = this.getUIContext().getRouter().getParams() as Record<string, Object>;
      if (!p) {
        return;
      }
      const yv = this.toNum(p['y']);
      const mv = this.toNum(p['m']);
      const dv = this.toNum(p['d']);
      const hv = p['hz'];
      if (yv !== -1 && yv >= MIN_YEAR && yv <= MAX_YEAR) {
        this.year = yv;
        this.routeDateSet = true;
      }
      if (mv !== -1 && mv >= 1 && mv <= 12) {
        this.month = mv;
        this.routeDateSet = true;
      }
      if (dv !== -1 && dv >= 1 && dv <= 31) {
        this.day = dv;
        this.routeDateSet = true;
      }
      if (typeof hv === 'string' && HOURS.indexOf(hv) >= 0) {
        this.hourZhi = hv;
        this.routeDateSet = true;
      }
    } catch (e) {
      /* 无参数或解析失败：使用默认日期 */
    }
  }

  /* 参数转数字：number 直接用；string 尝试 parseInt；失败返回 -1 */
  private toNum(v: Object): number {
    if (typeof v === 'number') {
      return v;
    }
    if (typeof v === 'string') {
      const n = parseInt(v);
      return isNaN(n) ? -1 : n;
    }
    return -1;
  }

  private async initData(): Promise<void> {
    const ctx = this.abilityCtx();
    if (!ctx) {
      return;
    }
    /* 仅无路由参数时用当前时间兜底；从 Index 返回已带参数则保留 */
    if (!this.routeDateSet) {
      const now = new Date();
      const y = now.getFullYear();
      this.year = (y < MIN_YEAR) ? MIN_YEAR : ((y > MAX_YEAR) ? MAX_YEAR : y);
      this.month = now.getMonth() + 1;
      this.day = now.getDate();
      const h = now.getHours();
      this.hourZhi = HOURS[Math.floor((h + 1) / 2) % 12];
    }
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

  private abilityCtx(): common.UIAbilityContext | null {
    const host = this.getUIContext().getHostContext();
    if (host) {
      return host as common.UIAbilityContext;
    }
    return null;
  }

  /* ---------------- 日期导航（与 Index 一致） ---------------- */

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

  private commitYearEdit(): void {
    this.yearEditing = false;
    const n = parseInt(this.yearEditVal);
    if (!isNaN(n) && n >= MIN_YEAR && n <= MAX_YEAR && n !== this.year) {
      this.year = n;
      this.syncCal();
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

  /* ---------------- 入口跳转 ---------------- */

  /* 排盘：带日期时辰进 Index（自动出盘）
     用 replaceUrl：避免页面栈中已有 Index 实例时被复用（复用会不重新读参数，盘不刷新） */
  private goChart(): void {
    if (!this.ready) {
      return;
    }
    const params: Record<string, Object> = {
      'y': this.year,
      'm': this.month,
      'd': this.day,
      'hz': this.hourZhi
    };
    this.getUIContext().getRouter().replaceUrl({
      url: 'pages/Index',
      params: params
    });
  }

  private goCases(): void {
    this.getUIContext().getRouter().pushUrl({ url: 'pages/Cases' });
  }

  private goAncient(): void {
    this.getUIContext().getRouter().pushUrl({ url: 'pages/Ancient' });
  }

  /* ---------------- 界面 ---------------- */

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

  /* 排盘主卡：金色渐变全宽 */
  @Builder
  private mainCard() {
    Row() {
      Column({ space: 6 }) {
        Text('排 盘')
          .fontSize(24)
          .fontWeight(FontWeight.Bold)
          .fontColor('#1A1410')
        Text('选好日期时辰 · 起课观盘')
          .fontSize(13)
          .fontColor('rgba(26,20,16,0.72)')
      }
      .alignItems(HorizontalAlign.Start)
      .layoutWeight(1)
      Blank()
      Text('☷')
        .fontSize(40)
        .fontColor('rgba(26,20,16,0.85)')
    }
    .width('100%')
    .padding({ left: 22, right: 22, top: 22, bottom: 22 })
    .borderRadius(18)
    .linearGradient({ angle: 120, colors: [['#F5D98E', 0.0], ['#D9A94E', 1.0]] })
    .shadow({ radius: 20, color: 'rgba(233,200,120,0.35)', offsetY: 6 })
  }

  build() {
    Column() {
      /* 根布局首个子元素 Text 渲染异常：首位置放空占位 Column，文字全部后移 */
      Column()
        .width('100%')
        .height(1)
      /* 品牌页头：竖排标题 + 副标语（独立 Text 避开 Row 布局问题；顶部留安全边距避让状态栏） */
      Text('六壬 · 起课台')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
        .fontColor('#E9C878')
        .letterSpacing(3)
        .margin({ left: 20, top: 72 })
      Text('月将加时 · 四课三传 · 神煞格局 · 读象直断')
        .fontSize(11)
        .fontColor('#8A7B5C')
        .letterSpacing(1)
        .margin({ left: 20, top: 4 })
      Divider()
        .color('rgba(233,200,120,0.2)')
        .margin({ top: 12 })

      Scroll() {
        Column({ space: 14 }) {
          this.dateCard()
          this.hourCard()

          Text(this.ready ? '选择日期时辰后，点「排盘」进入盘面' : '正在载入历法数据…')
            .fontSize(11)
            .fontColor('#6B5F45')
            .textAlign(TextAlign.Center)
            .width('100%')

          /* 排盘主卡 */
          Column() {
            this.mainCard()
          }
          .width('100%')
          .onClick(() => {
            this.goChart();
          })


          /* 课例卡（全宽内联） */
          Column({ space: 6 }) {
            Row() {
              Text('✦')
                .fontSize(26)
                .fontColor('#5FA394')
                .width(42)
                .textAlign(TextAlign.Center)
              Column({ space: 3 }) {
                Text('课 例 · 复盘')
                  .fontSize(17)
                  .fontWeight(FontWeight.Bold)
                  .fontColor('#F0D98C')
                Text('保存的排盘记录，点击一键恢复重排')
                  .fontSize(10)
                  .fontColor('#8A7B5C')
              }
              .alignItems(HorizontalAlign.Start)
              .layoutWeight(1)
              Blank()
              Text('›')
                .fontSize(22)
                .fontColor('#6B5F45')
            }
            .width('100%')
          }
          .width('100%')
          .padding({ left: 16, right: 16, top: 16, bottom: 16 })
          .borderRadius(16)
          .backgroundColor('#1C1A16')
          .border({ width: 1, color: 'rgba(233,200,120,0.16)' })
          .onClick(() => {
            this.goCases();
          })

          /* 古籍卡（全宽内联） */
          Column({ space: 6 }) {
            Row() {
              Text('❖')
                .fontSize(26)
                .fontColor('#7FA0B8')
                .width(42)
                .textAlign(TextAlign.Center)
              Column({ space: 3 }) {
                Text('古 籍 · 研习')
                  .fontSize(17)
                  .fontWeight(FontWeight.Bold)
                  .fontColor('#F0D98C')
                Text('中黄五变经全文，目录与逐篇阅读')
                  .fontSize(10)
                  .fontColor('#8A7B5C')
              }
              .alignItems(HorizontalAlign.Start)
              .layoutWeight(1)
              Blank()
              Text('›')
                .fontSize(22)
                .fontColor('#6B5F45')
            }
            .width('100%')
          }
          .width('100%')
          .padding({ left: 16, right: 16, top: 16, bottom: 16 })
          .borderRadius(16)
          .backgroundColor('#1C1A16')
          .border({ width: 1, color: 'rgba(233,200,120,0.16)' })
          .onClick(() => {
            this.goAncient();
          })

        }
        .width('100%')
        .padding({ left: 16, right: 16, top: 14, bottom: 72 })
      }
      .layoutWeight(1)
      .scrollBar(BarState.Off)
      .edgeEffect(EdgeEffect.Spring)
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#14120F')
    .expandSafeArea([SafeAreaType.SYSTEM], [SafeAreaEdge.TOP, SafeAreaEdge.BOTTOM])
  }
}

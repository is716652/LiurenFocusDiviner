/**
 * YongShenSheet —— 抓用神/读象 半模态容器（受控组件）
 * ----------------------------------------------------------------------------
 * 编排（自上而下）：迷你天地盘(高亮预览) → AffairChips(占事) → YongShenPills(用神候选)
 *                   → DongtaiChuan(动态三传) → JieDianCard(节点卡) → DuyuCard(读象)
 * 状态提升：affairName / yongShen / anchor 由父级(Index)持有，经 @Prop 传入 +
 * 回调更新 —— 关闭 Sheet 重开不丢选择；父级天地盘(PanDisk)同步高亮
 * 数据：由父级注入（chart + 4 个 rawfile JSON），内部用 YongShenCore 计算
 * 组件化：本文件只做编排与状态回传，各区块均为独立子组件
 */
import { LiurenCore } from '../model/LiurenCore';
import type { Chart } from '../model/LiurenCore';
import { YongShenCore } from '../model/YongShenCore';
import type {
  AffairCfg,
  DongtaiItem,
  DuyuPick,
  JieDianWord,
  YongShenCand
} from '../model/YongShenCore';
import { AffairChips } from './AffairChips';
import { YongShenPills } from './YongShenPills';
import { JieDianCard } from './JieDianCard';
import { DuyuCard } from './DuyuCard';
import { PanDisk } from './PanDisk';

/* 迷你四课展示行 */
interface KegMini {
  x: string;
  s: string;
}

/* 迷你三传行（字段全） */
interface MiniChuanRow {
  pos: string;
  gan: string;
  zhi: string;
  lq: string;
  jiang: string;
  shensha: string;
  kong: boolean;
}

/* 迷你四课行 */
interface MiniKegRow {
  kn: string;
  xGan: string;
  xZhi: string;
  sGan: string;
  sZhi: string;
  jiang: string;
  shensha: string;
}

@Component
export struct YongShenSheet {
  @Prop chart: Chart | null = null;
  @Prop zhanShi: Record<string, Object> = {};
  @Prop leixiang: Record<string, Object> = {};
  @Prop xiangyi: Record<string, Object> = {};
  @Prop hourZhi: string = '';
  /* 状态（由父级持有，受控） */
  @Prop affairName: string = '';
  @Prop @Watch('onYSChange') yongShen: string = '';
  @Prop anchor: string = '';
  /* 用神变化刷新标记（强制 Swiper 子页重建） */
  @State refreshTick: number = 0;
  /* 回调（回传父级） */
  onAffairChange: (name: string) => void = () => { };
  onYongShenChange: (yongShen: string, cands: string[]) => void = () => { };
  onAnchorChange: (v: string) => void = () => { };
  /* 外应取用：迷你盘点击 → 回传父级统一处理 */
  onPickZhi: (zhi: string, layer: string) => void = () => { };

  /* 关闭回调（自绘 ✕ 按钮；系统关闭按钮已关闭 showClose=false，避免与内容重叠） */
  onClose: () => void = () => { };

  /* 用神变化：强制迷你三传/四课重建 */
  private onYSChange(): void {
    this.refreshTick = this.refreshTick + 1;
  }

  /* ---------------- 派生数据（只读计算） ---------------- */

  private affairList(): string[] {
    const names: string[] = [];
    const all = YongShenCore.affairs();
    for (let i = 0; i < all.length; i++) {
      names.push(all[i].name);
    }
    return names;
  }

  private affCfg(): AffairCfg | null {
    if (this.affairName === '') {
      return null;
    }
    return YongShenCore.affairByName(this.affairName);
  }

  private cands(): YongShenCand[] {
    const c = this.chart;
    const aff = this.affCfg();
    if (!c || !aff) {
      return [];
    }
    return YongShenCore.candidates(c, aff);
  }

  private candZhis(): string[] {
    const list: string[] = [];
    const cs = this.cands();
    for (let i = 0; i < cs.length; i++) {
      list.push(cs[i].zhi);
    }
    return list;
  }

  /* 迷你四课数据：chart.kegs → {x:上神, s:下神}（第一课在右） */
  private kegList(): KegMini[] {
    const c = this.chart;
    const out: KegMini[] = [];
    if (!c) {
      return out;
    }
    for (let i = 3; i >= 0; i--) {
      out.push({ x: c.kegs[i].x, s: c.kegs[i].s });
    }
    return out;
  }

  /* 迷你三传行：六亲/天干/地支/神煞/位置/天将/空亡（初传在上） */
  private dongtaiRows(): MiniChuanRow[] {
    const c = this.chart;
    const out: MiniChuanRow[] = [];
    if (!c) {
      return out;
    }
    const items = YongShenCore.dongtai(c, this.yongShen);
    const posNames: string[] = ['初传', '中传', '末传'];
    for (let i = 0; i < items.length && i < 3; i++) {
      const it = items[i];
      const gan = it.gz.length > 0 ? it.gz.slice(0, 1) : '';
      const zhi = it.gz.length > 1 ? it.gz.slice(1) : '';
      const ss = (c.dx.shensha.byZhi[zhi] || []);
      const ssNames: string[] = [];
      for (let k = 0; k < ss.length; k++) {
        ssNames.push(ss[k].split('(')[0]);
      }
      const kong = c.dx.xunkong.indexOf(zhi) >= 0;
      out.push({
        pos: posNames[i],
        gan: gan,
        zhi: zhi,
        lq: it.lq,
        jiang: it.jiang,
        shensha: ssNames.join('·'),
        kong: kong
      });
    }
    return out;
  }

  /* 迷你四课行：第几课/上神干支/下神干支/神煞（第一课在右） */
  private kegRowsFull(): MiniKegRow[] {
    const c = this.chart;
    const out: MiniKegRow[] = [];
    if (!c) {
      return out;
    }
    for (let i = 3; i >= 0; i--) {
      const keg = c.kegs[i];
      const xZhi = keg.x;
      const sZhi = keg.s;
      const jiang = c.jiangMap[LiurenCore.gongOf(c.tp, xZhi)] || '';
      out.push({
        kn: '第' + (i + 1) + '课',
        xGan: '',
        xZhi: xZhi,
        sGan: '',
        sZhi: sZhi,
        jiang: jiang,
        shensha: ''
      });
    }
    return out;
  }

  private dongtai(): DongtaiItem[] {
    const c = this.chart;
    if (!c || this.yongShen === '') {
      return [];
    }
    return YongShenCore.dongtai(c, this.yongShen);
  }

  private words(): JieDianWord[] {
    const c = this.chart;
    if (!c || this.yongShen === '') {
      return [];
    }
    return YongShenCore.jieDianWords(c, this.yongShen, this.leixiang);
  }

  private boom(): string[] {
    const c = this.chart;
    if (!c || this.yongShen === '') {
      return [];
    }
    const nd = c.dx.nodes[this.yongShen];
    const rel = c.dx.relations[this.yongShen];
    const out: string[] = [];
    if (nd.kong) {
      out.push('落空（虚而不实，等出空）');
    }
    if (rel.chong) {
      out.push('被' + rel.chong + '冲（提前反转）');
    }
    if (rel.he) {
      out.push('合' + rel.he + '（缓势被绊）');
    }
    if (rel.hai) {
      out.push('害' + rel.hai);
    }
    if (rel.xing.length > 0) {
      out.push('刑' + rel.xing.join(''));
    }
    const gk = YongShenCore.liuqinOf(c, this.yongShen);
    out.push('与日干：' + gk);
    return out;
  }

  private shenshaTxt(): string {
    const c = this.chart;
    if (!c || this.yongShen === '') {
      return '';
    }
    const ss = c.dx.shensha.byZhi[this.yongShen] || [];
    if (ss.length === 0) {
      return '无凶煞';
    }
    const names: string[] = [];
    for (let i = 0; i < ss.length; i++) {
      names.push(ss[i].split('(')[0]);
    }
    return '带' + names.join('·');
  }

  private nodeHead(): string {
    const c = this.chart;
    if (!c || this.yongShen === '') {
      return '';
    }
    const nd = c.dx.nodes[this.yongShen];
    const cur = YongShenCore.findCand(this.cands(), this.yongShen);
    const jiang = cur && cur.jiang !== '' ? cur.jiang : '';
    const g = c.dun[this.yongShen] || '';
    const lq = YongShenCore.liuqinOf(c, this.yongShen);
    return g + this.yongShen + ' · ' + lq + (jiang !== '' ? ' · 乘' + jiang : '') +
      ' · ' + nd.wangShuai + (nd.kong ? ' 空' : '');
  }

  private duyuList(): string[] {
    const aff = this.affCfg();
    if (!aff) {
      return [];
    }
    return YongShenCore.duyuOf(aff.name);
  }

  private duyuPick(): DuyuPick | null {
    const c = this.chart;
    const aff = this.affCfg();
    if (!c || !aff || this.yongShen === '') {
      return null;
    }
    return YongShenCore.selectDuyu(c, aff, this.cands(), this.yongShen, this.xiangyi);
  }

  /* ---------------- 交互（全部回传父级） ---------------- */

  private pickAffair(name: string): void {
    /* 父级负责：设置 affairName 并重算用神（沿用旧用神或取首候选），
       父级状态更新会自动触发主页面 PanDisk 与迷你盘重绘 */
    this.onAffairChange(name);
  }

  private pickYongShen(zhi: string): void {
    this.onYongShenChange(zhi, this.candZhis());
  }

  private pickAnchor(v: string): void {
    this.onAnchorChange((this.anchor === v) ? '' : v);
  }

  /* ---------------- 布局 ---------------- */

  build() {
    Column({ space: 12 }) {
      /* 标题栏（自绘 ✕ 关闭，不依赖系统关闭按钮，杜绝与内容重叠） */
      Row() {
        Text('抓用神 · 读象')
          .fontSize(17)
          .fontWeight(FontWeight.Bold)
          .fontColor('#F0D98C')
        Blank()
        Text('盘起于 ' + this.dateStr())
          .fontSize(11)
          .fontColor('#8A7B5C')
          .maxLines(1)
        Text('✕')
          .fontSize(16)
          .fontColor('#8A7B5C')
          .padding({ left: 12, right: 4, top: 4, bottom: 4 })
          .onClick(() => {
            this.onClose();
          })
      }
      .width('100%')
      .padding({ bottom: 4, right: 8 })
      .border({ width: { bottom: 1 }, color: 'rgba(233,200,120,0.20)' })

      Scroll() {
        Column({ space: 12 }) {
          /* 迷你盘预览：Swiper 三页（动态三传默认 / 天地盘 / 四课，左右滑动） */
          if (this.chart && (this.affairName !== '' || this.yongShen !== '')) {
            Column({ space: 4 }) {
              Row() {
                Text('盘面预览')
                  .fontSize(11)
                  .fontColor('#8A7B5C')
                Blank()
                Text(this.yongShen !== '' ? '当前用神 ' + this.yongShen + ' 宫' : '左右滑看 三传/盘/四课')
                  .fontSize(10)
                  .fontColor('#A8843C')
              }
              .width('100%')
              Swiper() {
                /* 页0 动态三传（默认；随用神；上下结构：初传在上） */
                Column({ space: 3 }) {
                  ForEach(this.dongtaiRows(), (tr: MiniChuanRow, ti: number) => {
                    Row({ space: 3 }) {
                      Text((ti === 0 ? '★ ' : '') + tr.pos)
                        .fontSize(8)
                        .fontColor(ti === 0 ? '#F0D98C' : '#8A7B5C')
                        .fontWeight(ti === 0 ? FontWeight.Bold : FontWeight.Normal)
                        .width(22)
                      Text(tr.gan)
                        .fontSize(11)
                        .fontWeight(FontWeight.Bold)
                        .fontColor('#F0D98C')
                        .width(14)
                      Text(tr.zhi)
                        .fontSize(12)
                        .fontWeight(FontWeight.Bold)
                        .fontColor('#F0D98C')
                        .width(18)
                      Text(tr.lq)
                        .fontSize(9)
                        .fontColor('#A8843C')
                        .width(24)
                      Text(tr.jiang)
                        .fontSize(9)
                        .fontColor('#C4B183')
                        .layoutWeight(1)
                      Text(tr.shensha)
                        .fontSize(8)
                        .fontColor(tr.kong ? '#D0704A' : '#6B5F45')
                        .layoutWeight(1)
                    }
                    .width('100%')
                    .padding({ top: 3, bottom: 3, left: 4, right: 4 })
                    .borderRadius(5)
                    .backgroundColor(ti === 0 ? 'rgba(240,217,140,0.14)' : 'rgba(233,200,120,0.07)')
                  }, (tr: MiniChuanRow, ti: number) => 'mr' + this.refreshTick + ti + tr.pos)
                  Text(this.yongShen !== '' ? '动态三传 · 以' + this.yongShen + '为用神（初传在上）' : '选用神后生成动态三传')
                    .fontSize(8)
                    .fontColor('#6B5F45')
                    .width('100%')
                    .textAlign(TextAlign.Center)
                }
                .width(150)
                /* 页1 天地盘（点盘换用神） */
                PanDisk({
                  chart: this.chart,
                  yongShen: this.yongShen,
                  cands: this.candZhis(),
                  onPickZhi: (z: string, layer: string) => {
                    this.onPickZhi(z, layer);
                  }
                })
                  .width(150)
                /* 页2 迷你四课（横排4课，每列 天将/上神支/下神支；第一课在右；高度一致） */
                Column({ space: 3 }) {
                  Row({ space: 3 }) {
                    ForEach(this.kegRowsFull(), (kr: MiniKegRow, ki: number) => {
                      Column({ space: 3 }) {
                        Text(ki === 3 ? '★' : ' ')
                          .fontSize(9)
                          .fontColor('#F0D98C')
                          .height(12)
                        Text(kr.jiang !== '' ? kr.jiang : '—')
                          .fontSize(10)
                          .fontWeight(ki === 3 ? FontWeight.Bold : FontWeight.Medium)
                          .fontColor(ki === 3 ? '#F0D98C' : (kr.jiang !== '' && LiurenCore.JIANG_JX[kr.jiang] === '凶' ? '#D0704A' : '#E9C878'))
                          .maxLines(1)
                          .textOverflow({ overflow: TextOverflow.Ellipsis })
                        Text(kr.xZhi)
                          .fontSize(14)
                          .fontWeight(FontWeight.Bold)
                          .fontColor('#F0D98C')
                        Text(kr.sZhi)
                          .fontSize(14)
                          .fontWeight(FontWeight.Bold)
                          .fontColor('#F0D98C')
                      }
                      .layoutWeight(1)
                      .padding({ top: 4, bottom: 6, left: 2, right: 2 })
                      .borderRadius(5)
                      .backgroundColor(ki === 3 ? 'rgba(240,217,140,0.16)' : 'rgba(233,200,120,0.07)')
                      .border({ width: ki === 3 ? 1 : 0, color: '#F0D98C' })
                      .constraintSize({ minHeight: 82 })
                    }, (kr: MiniKegRow, ki: number) => 'kr' + this.refreshTick + ki + kr.kn)
                  }
                  .width('100%')
                  Text('四课（右边是第一课 · 天将/上神/下神）· 左右滑切')
                    .fontSize(8)
                    .fontColor('#6B5F45')
                    .width('100%')
                    .textAlign(TextAlign.Center)
                }
                .width(150)
              }
              .width(150)
              .height(170)
              .indicator(true)
              .loop(false)
              .onChange((idx: number) => {
              })
            }
            .width('100%')
            .padding(12)
            .borderRadius(12)
            .backgroundColor('#211E18')
            .border({ width: 1, color: 'rgba(233,200,120,0.18)' })
            if (this.chart) {
              Text('点盘任一支 = 外应取用（天盘优先）')
                .fontSize(9)
                .fontColor('#6B5F45')
                .lineHeight(12)
                .width('100%')
                .textAlign(TextAlign.Center)
            }
          }

          AffairChips({
            names: this.affairList(),
            selected: this.affairName,
            cfg: this.affCfg(),
            onPick: (n: string) => {
              this.pickAffair(n);
            }
          })

          if (this.affairName !== '') {
            YongShenPills({
              cands: this.cands(),
              selected: this.yongShen,
              onPick: (z: string) => {
                this.pickYongShen(z);
              }
            })
          }

          if (this.yongShen !== '') {
            JieDianCard({
              head: this.nodeHead(),
              words: this.words(),
              boom: this.boom(),
              shensha: this.shenshaTxt(),
              anchor: this.anchor,
              onAnchor: (v: string) => {
                this.pickAnchor(v);
              }
            })
          }

          DuyuCard({
            duyu: this.duyuList(),
            pick: this.duyuPick()
          })
        }
        .width('100%')
      }
      .scrollable(ScrollDirection.Vertical)
      .scrollBar(BarState.Auto)
      .edgeEffect(EdgeEffect.Spring)
      .layoutWeight(1)
      .width('100%')
    }
    .width('100%')
    .height('100%')
    .padding({ left: 16, right: 16, top: 14, bottom: 16 })
    .backgroundColor('#1C1A16')
  }

  private dateStr(): string {
    const c = this.chart;
    if (!c) {
      return '';
    }
    return c.r.d + ' ' + c.hourGan + this.hourZhi + '时';
  }
}

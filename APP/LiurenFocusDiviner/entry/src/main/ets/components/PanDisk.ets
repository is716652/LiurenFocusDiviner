/**
 * PanDisk —— 天地盘 Canvas（静态不旋转）
 * 布局（由外到内）：天将(最外·接天盘外) -> 天盘支(外圈) -> 遁干(中圈) -> 地盘支(内圈) -> 中心月将
 * 旬空支自动降暗；天将按吉凶着色（吉金/凶朱砂）
 * 抓用神联动：yongShen=当前用神(实心金圈+标记)、cands=候选地支(细虚线圈)
 * 外应取用：点击盘面任一支 → onPickZhi(zhi, layer) 回调（天盘支优先，地盘支亦可）
 * v3：字号按 densityPixels 换算（Canvas px 为物理像素）
 */
import { display } from '@kit.ArkUI';
import { LiurenCore } from '../model/LiurenCore';
import type { Chart, ZhonghuangDun, ZhonghuangAnalyze } from '../model/LiurenCore';

@Component
export struct PanDisk {
  @Prop @Watch('onChartChange') chart: Chart | null = null;
  @Prop @Watch('onHighlightChange') yongShen: string = '';
  @Prop @Watch('onHighlightChange') cands: string[] = [];
  /* 遁干显示模式：'常遁'=传统日干遁（默认）| '中黄'=时干遁盘（中黄）；旬只用于空亡，不作天干模式 */
  @Prop @Watch('onHighlightChange') zhonghuangMode: string = '常遁';
  /* 中黄天干两遁数据（父级传入 ZhonghuangDun；null=不启用） */
  @Prop @Watch('onHighlightChange') zhonghuang: ZhonghuangDun | null = null;
  /* 中黄完整分析（可选；用于身/变/传标记） */
  @Prop @Watch('onHighlightChange') zhonghuangAna: ZhonghuangAnalyze | null = null;
  /* 辅助层开关：显地盘干（铜绿）/ 显本位神（暗金）——与主信息颜色区分 */
  @Prop @Watch('onHighlightChange') showDunDi: boolean = false;
  @Prop @Watch('onHighlightChange') showBenshen: boolean = false;
  /* 点击回调：zhi=命中的地支（天盘支或地盘支），layer='天盘'|'地盘'；默认空函数=不启用点击 */
  onPickZhi: (zhi: string, layer: string) => void = () => { };
  private settings: RenderingContextSettings = new RenderingContextSettings(true);
  private ctx: CanvasRenderingContext2D = new CanvasRenderingContext2D(this.settings);
  private zhi: string[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  build() {
    Canvas(this.ctx)
      .width('100%')
      .aspectRatio(1)
      .onReady(() => {
        this.drawDisk();
      })
      .onClick((e: ClickEvent) => {
        this.hitTest(e.x, e.y);
      })
  }

  private onChartChange(): void {
    if (this.ctx.width > 0) {
      this.drawDisk();
    }
  }

  /* 用神高亮变化：重绘盘面 */
  private onHighlightChange(): void {
    if (this.ctx.width > 0) {
      this.drawDisk();
    }
  }

  private drawDisk(): void {
    const c = this.chart;
    if (!c) {
      return;
    }
    const ctx = this.ctx;
    const w = ctx.width;
    const h = ctx.height;
    if (w <= 0) {
      return;
    }
    const cx = w / 2;
    const cy = h / 2;
    const gold = '#E9C878';
    const goldBright = '#F0D98C';
    const dim = '#8A7448';
    const faint = '#6B5F45';
    const cinnabar = '#C0704A';
    const line = 'rgba(233,200,120,0.30)';
    const kongList: string[] = c.dx.xunkong;
    ctx.clearRect(0, 0, w, h);

    /* vp → 物理像素：ctx.font 的 px 是物理像素，而 ctx.width 是 vp，
       高密度屏(≈3x)下必须乘 densityPixels，否则文字显示只有 1/3 大小 */
    let d: number = 3;
    try {
      d = display.getDefaultDisplaySync().densityPixels;
    } catch (e) {
      d = 3;
    }
    const fontPx = (vp: number): string => (vp * d) + 'px sans-serif';
    const boldPx = (vp: number): string => 'bold ' + (vp * d) + 'px sans-serif';

    /* 外圈六十刻度（拟六甲） */
    ctx.strokeStyle = 'rgba(233,200,120,0.22)';
    ctx.lineWidth = 1;
    const tickR = w * 0.478;
    for (let i = 0; i < 60; i++) {
      const ang = (i / 60) * Math.PI * 2 - Math.PI / 2;
      const r1 = (i % 5 === 0) ? tickR - w * 0.016 : tickR - w * 0.008;
      ctx.beginPath();
      ctx.moveTo(cx + r1 * Math.cos(ang), cy + r1 * Math.sin(ang));
      ctx.lineTo(cx + tickR * Math.cos(ang), cy + tickR * Math.sin(ang));
      ctx.stroke();
    }

    /* 四正方位（外圈标注：午南在上 / 子北在下 / 卯东在左 / 酉西在右）
       方位字挂在正位支上：子(index0)=北、卯(3)=东、午(6)=南、酉(9)=西 */
    ctx.font = fontPx(w * 0.028);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fwName: string[] = ['北', '', '', '东', '', '', '南', '', '', '西', '', ''];
    for (let i = 0; i < 12; i++) {
      const nm = fwName[i];
      if (nm === '') {
        continue;
      }
      const a = -Math.PI / 2 + (i - 6) * Math.PI / 6;
      const r = w * 0.492;
      ctx.fillStyle = '#C4A25C';
      ctx.fillText(nm, cx + r * Math.cos(a), cy + r * Math.sin(a));
    }

    /* 子午 / 卯酉 十字轴线（细虚线，标示四正） */
    ctx.strokeStyle = 'rgba(233,200,120,0.20)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, cy - w * 0.40);
    ctx.lineTo(cx, cy + w * 0.40);
    ctx.moveTo(cx - w * 0.40, cy);
    ctx.lineTo(cx + w * 0.40, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    /* 环线 */
    const rings: number[] = [0.455, 0.372, 0.295, 0.215];
    for (let i = 0; i < rings.length; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, w * rings[i], 0, Math.PI * 2);
      ctx.strokeStyle = line;
      ctx.lineWidth = (i === 0) ? 1.5 : 1;
      ctx.stroke();
    }

    /* 十二宫位（传统盘面，由外到内）：
       天将(最外·接天盘外) → 天盘支(外圈) → 遁干(中圈) → 地盘支(内圈) → 中心月将
       方位约定：午(正南)在上、子(正北)在下、卯(东)在左、酉(西)在右
       角度：午(index6)=-90°(上)，顺行 → 未→申→酉(0°)→…→子(90°下) */
    for (let i = 0; i < 12; i++) {
      const ang = -Math.PI / 2 + (i - 6) * Math.PI / 6;
      const gongZhi = this.zhi[i];
      const tianPan = c.tp[gongZhi];
      const jiang = c.jiangMap[gongZhi];
      const isKong = kongList.indexOf(tianPan) >= 0;

      /* 天将（最外圈，2字，接天盘外） */
      const rJ = w * 0.412;
      const jx = cx + rJ * Math.cos(ang);
      const jy = cy + rJ * Math.sin(ang);
      ctx.fillStyle = (LiurenCore.JIANG_JX[jiang] === '吉') ? '#C4A25C' : cinnabar;
      ctx.font = fontPx(w * 0.048);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(jiang, jx, jy);

      /* 天盘支（外圈，1字，旬空降暗；月将加时后天盘加临于地盘宫位） */
      const rT = w * 0.335;
      const tx = cx + rT * Math.cos(ang);
      const ty = cy + rT * Math.sin(ang);
      ctx.beginPath();
      ctx.arc(tx, ty, w * 0.032, 0, Math.PI * 2);
      ctx.fillStyle = isKong ? 'rgba(120,110,90,0.25)' : 'rgba(240,217,140,0.16)';
      ctx.fill();
      ctx.fillStyle = isKong ? '#7A6E55' : goldBright;
      ctx.font = fontPx(w * 0.06);
      ctx.fillText(tianPan, tx, ty);

      /* 遁干（中圈，天盘支之干）：常遁为主；中黄开时同宫并排小字显示中黄干
         注：四课三传的天干皆为天盘支之干，故中圈标天盘支的遁干（dun[tianPan]），非地盘宫 */
      const rG = w * 0.255;
      const changGan = c.dun[tianPan];
      const zhOn = this.zhonghuang !== null && (this.zhonghuangMode === '中黄' || this.zhonghuangMode === '时遁');
      const zhGan = zhOn && this.zhonghuang ? this.zhonghuang.shiDun[tianPan] : '';
      if (zhOn && zhGan !== '' && zhGan !== changGan) {
        /* 同宫双干：沿切线微偏，常遁在左/上，中黄在右/下；字号都略收，避免误以为邻宫 */
        const off = 0.052;
        const gx1 = cx + rG * Math.cos(ang - off);
        const gy1 = cy + rG * Math.sin(ang - off);
        const gx2 = cx + rG * Math.cos(ang + off);
        const gy2 = cy + rG * Math.sin(ang + off);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = faint;
        ctx.font = fontPx(w * 0.038);
        ctx.fillText(changGan, gx1, gy1);
        ctx.fillStyle = '#C4A25C';
        ctx.font = fontPx(w * 0.038);
        ctx.fillText(zhGan, gx2, gy2);
      } else {
        const gx = cx + rG * Math.cos(ang);
        const gy = cy + rG * Math.sin(ang);
        ctx.fillStyle = zhOn ? '#C4A25C' : faint;
        ctx.font = fontPx(w * 0.044);
        ctx.fillText(zhOn ? zhGan : changGan, gx, gy);
      }

      /* 地盘十二支（内圈，固定，1字） */
      const rD = w * 0.165;
      const dx = cx + rD * Math.cos(ang);
      const dy = cy + rD * Math.sin(ang);
      ctx.beginPath();
      ctx.arc(dx, dy, w * 0.026, 0, Math.PI * 2);
      ctx.fillStyle = (i % 2 === 0) ? 'rgba(233,200,120,0.20)' : 'rgba(233,200,120,0.10)';
      ctx.fill();
      ctx.fillStyle = (i % 2 === 0) ? gold : dim;
      ctx.font = fontPx(w * 0.068);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(gongZhi, dx, dy);

      /* 中黄标记（仅中黄开）：身=日干寄宫，变=占时/变干宫，传=变干入三传；单字符号，详细看宫情条 */
      if (zhOn && this.zhonghuang) {
        const dayJi = LiurenCore.JI_GONG[c.r.dg] || '';
        const bianGong = this.zhonghuang.hourZhi;
        const inChuan = this.zhonghuangAna !== null && this.zhonghuangAna.bianInChuan !== '';
        const rM = w * 0.136;
        ctx.font = fontPx(w * 0.023);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (gongZhi === dayJi) {
          ctx.fillStyle = '#E9C878';
          ctx.fillText('身', cx + rM * Math.cos(ang - 0.075), cy + rM * Math.sin(ang - 0.075));
        }
        if (gongZhi === bianGong) {
          ctx.fillStyle = '#C4A25C';
          ctx.fillText('变', cx + rM * Math.cos(ang + 0.075), cy + rM * Math.sin(ang + 0.075));
          if (inChuan) {
            ctx.fillStyle = '#F0D98C';
            ctx.fillText('传', cx + rM * Math.cos(ang + 0.150), cy + rM * Math.sin(ang + 0.150));
          }
        }
      }

      /* 辅助层：地盘干（中圈内沿，铜绿小字；默认关，主盘可开） */
      if (this.showDunDi) {
        const rDD = w * 0.215;
        const ddx = cx + rDD * Math.cos(ang);
        const ddy = cy + rDD * Math.sin(ang);
        ctx.fillStyle = '#7FA69A';
        ctx.font = fontPx(w * 0.034);
        ctx.fillText(c.dun[gongZhi], ddx, ddy);
      }
      /* 辅助层：本位神（内圈外沿，暗金极小字；默认关） */
      if (this.showBenshen) {
        const rBS = w * 0.128;
        const bx = cx + rBS * Math.cos(ang);
        const by = cy + rBS * Math.sin(ang);
        ctx.fillStyle = '#8A7448';
        ctx.font = fontPx(w * 0.026);
        ctx.fillText(LiurenCore.BENSHEN[gongZhi] || '', bx, by);
      }
    }

    /* 抓用神高亮：候选细虚线圈（天盘支位置），当前用神实心金圈+标记 */
    if (this.yongShen !== '' || this.cands.length > 0) {
      const hiR = w * 0.335; /* 与天盘支同圈 */
      /* 反查：天盘支 X 落在哪个地盘宫（角度） */
      const gongOfTp = (tpZ: string): number => {
        for (let k = 0; k < 12; k++) {
          if (c.tp[this.zhi[k]] === tpZ) {
            return k;
          }
        }
        return -1;
      };
      /* 候选：细虚线圈 */
      for (let k = 0; k < this.cands.length; k++) {
        const cz = this.cands[k];
        if (cz === this.yongShen) {
          continue;
        }
        const gi = gongOfTp(cz);
        if (gi < 0) {
          continue;
        }
        const a = -Math.PI / 2 + (gi - 6) * Math.PI / 6;
        const hx = cx + hiR * Math.cos(a);
        const hy = cy + hiR * Math.sin(a);
        ctx.beginPath();
        ctx.arc(hx, hy, w * 0.052, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(233,200,120,0.60)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      /* 当前用神：实心金圈 + 标记 */
      if (this.yongShen !== '') {
        const gi = gongOfTp(this.yongShen);
        if (gi >= 0) {
          const a = -Math.PI / 2 + (gi - 6) * Math.PI / 6;
          const hx = cx + hiR * Math.cos(a);
          const hy = cy + hiR * Math.sin(a);
          ctx.beginPath();
          ctx.arc(hx, hy, w * 0.06, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(240,217,140,0.25)';
          ctx.fill();
          ctx.strokeStyle = '#F0D98C';
          ctx.lineWidth = 2.4;
          ctx.stroke();
          ctx.fillStyle = '#F0D98C';
          ctx.font = fontPx(w * 0.03);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('用神', hx, hy - w * 0.075);
        }
      }
    }

    /* 中心：月将 + 日干 */
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.092, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(233,200,120,0.18)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.062, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(233,200,120,0.55)';
    ctx.fill();
    ctx.fillStyle = '#8A7448';
    ctx.font = fontPx(w * 0.034);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('月将', cx, cy - w * 0.036);
    ctx.fillStyle = '#FDF3D0';
    ctx.font = boldPx(w * 0.07);
    ctx.fillText(c.yj.zhi, cx, cy - w * 0.004);
    ctx.fillStyle = '#F0D98C';
    ctx.font = fontPx(w * 0.03);
    ctx.fillText('日干 ' + c.r.dg, cx, cy + w * 0.052);
  }

  /* 点击命中测试：坐标 → 地支（外应取用）
     圈层（与绘制一致）：天盘支 r≈0.335w（优先）、地盘支 r≈0.165w
     命中判定：距离在圈层半径 ± 容差内；角度换算地支 index（午=6 上，顺行） */
  private hitTest(x: number, y: number): void {
    const c = this.chart;
    if (!c) {
      return;
    }
    const w = this.ctx.width;
    if (w <= 0) {
      return;
    }
    const cx = w / 2;
    const cy = w / 2;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    /* 命中圈层（含容差）：天盘支优先 */
    let layer = '';
    if (dist >= w * 0.26 && dist <= w * 0.41) {
      layer = '天盘';
    } else if (dist >= w * 0.10 && dist <= w * 0.22) {
      layer = '地盘';
    } else {
      return;
    }
    /* 角度 → 地支 index：午(6)=-90°(上)，顺行
       数学角（atan2 y 向下为正）→ 地支：idx = 6 + round((ang + PI/2) / (PI/6)) mod 12 */
    const ang = Math.atan2(dy, dx);
    let idx = 6 + Math.round((ang + Math.PI / 2) / (Math.PI / 6));
    idx = ((idx % 12) + 12) % 12;
    const gongZhi = this.zhi[idx];
    const zhi = (layer === '天盘') ? (c.tp[gongZhi] || gongZhi) : gongZhi;
    this.onPickZhi(zhi, layer);
  }
}

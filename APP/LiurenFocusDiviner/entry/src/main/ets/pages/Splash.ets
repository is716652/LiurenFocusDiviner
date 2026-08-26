/**
 * 引导页（Splash）v3：墨夜鎏金 · 沉浸光感
 *  - 径向金辉光晕 + 分层残影环（纵深）
 *  - Canvas 天盘：六十刻度环 + 四正方位 + 地盘十二支（午上子下）+ 旋转天盘 + 中心炁点（光晕）
 *  - 字号按 densityPixels 放大（Canvas px 为物理像素，高密度屏必须换算）
 * 点击「进入」→ pages/Index
 */
import { display } from '@kit.ArkUI';
import { common } from '@kit.AbilityKit';
import { PayGate } from '../pay/PayGate';

@Entry
@Component
struct Splash {
  private settings: RenderingContextSettings = new RenderingContextSettings(true);
  private ctx: CanvasRenderingContext2D = new CanvasRenderingContext2D(this.settings);
  private zhi: string[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  @State private angle: number = 0;
  private timer: number = -1;

  aboutToAppear(): void {
    /* 付费门禁初始化（免费模式全开放；付费模式读本地+尝试恢复购买） */
    const host = this.getUIContext().getHostContext();
    if (host) {
      PayGate.init(host as common.UIAbilityContext);
    }
    this.timer = setInterval(() => {
      this.angle = (this.angle + 0.5) % 360;
      if (this.ctx.width > 0) {
        this.drawDisk();
      }
    }, 50);
  }

  aboutToDisappear(): void {
    if (this.timer > 0) {
      clearInterval(this.timer);
    }
  }

  build() {
    Stack({ alignContent: Alignment.Center }) {
      // 底层：深墨渐变（夜幕）
      Column()
        .width('100%')
        .height('100%')
        .linearGradient({
          angle: 165,
          colors: [['#16130F', 0.0], ['#0B0A08', 0.62], ['#1E1508', 1.0]]
        })

      // 金色光晕（顶部天光）
      Column()
        .width('100%')
        .height('62%')
        .translate({ y: -120 })
        .radialGradient({
          center: [0.5, 0.32],
          radius: 0.9,
          colors: [['rgba(233,200,120,0.26)', 0.0], ['rgba(233,200,120,0.05)', 0.55], ['rgba(233,200,120,0)', 1.0]]
        })

      // 天盘（Canvas，含旋转）
      Canvas(this.ctx)
        .width('74%')
        .aspectRatio(1)
        .onReady(() => {
          this.drawDisk();
        })

      // 标题区
      Column({ space: 10 }) {
        Text('大六壬')
          .fontSize(48)
          .fontWeight(FontWeight.Bold)
          .fontColor('#F0D98C')
          .letterSpacing(14)
          .shadow({ radius: 24, color: 'rgba(233,200,120,0.45)', offsetY: 2 })
        Text('读象工作台 · 管辂一系')
          .fontSize(14)
          .fontColor('#C4B183')
          .letterSpacing(6)
      }
      .translate({ y: -208 })

      // 金线分隔
      Row()
        .width(96)
        .height(2)
        .linearGradient({ angle: 0, colors: [['rgba(233,200,120,0)', 0.0], ['#E9C878', 0.5], ['rgba(233,200,120,0)', 1.0]] })
        .translate({ y: -150 })

      // 进入按钮
      Button('进 入')
        .width(224)
        .height(54)
        .fontSize(20)
        .fontWeight(FontWeight.Medium)
        .fontColor('#1A1410')
        .linearGradient({ angle: 90, colors: [['#F5D98E', 0.0], ['#D9A94E', 1.0]] })
        .borderRadius(27)
        .shadow({ radius: 22, color: 'rgba(233,200,120,0.40)', offsetY: 6 })
        .translate({ y: 252 })
        .onClick(() => {
          this.getUIContext().getRouter().replaceUrl({ url: 'pages/Home' });
        })

      // 底部小字 + 合规链接
      Column({ space: 8 }) {
        Text('以炁为基 · 四课三传 · 神煞格局 · 读象直断')
          .fontSize(12)
          .fontColor('#6B5F45')
          .letterSpacing(2)
        /* 合规链接：隐私政策 · 用户协议 */
        Row({ space: 24 }) {
          Text('隐私政策')
            .fontSize(12)
            .fontColor('#8A7B5C')
            .onClick(() => {
              this.getUIContext().getRouter().pushUrl({ url: 'pages/Legal/PrivacyPolicy' });
            })
          Text('|')
            .fontSize(12)
            .fontColor('#4A4030')
          Text('用户协议')
            .fontSize(12)
            .fontColor('#8A7B5C')
            .onClick(() => {
              this.getUIContext().getRouter().pushUrl({ url: 'pages/Legal/UserAgreement' });
            })
        }
      }
      .translate({ y: 320 })
    }
    .width('100%')
    .height('100%')
    .expandSafeArea([SafeAreaType.SYSTEM], [SafeAreaEdge.TOP, SafeAreaEdge.BOTTOM])
  }

  /** 天盘绘制：刻度环 + 地盘十二支 + 旋转天盘支 + 中心炁 */
  private drawDisk(): void {
    const ctx = this.ctx;
    const w = ctx.width;
    const h = ctx.height;
    if (w <= 0) {
      return;
    }
    const cx = w / 2;
    const cy = h / 2;
    const gold = '#E9C878';
    const dim = '#8A7448';
    const line = 'rgba(233,200,120,0.30)';
    ctx.clearRect(0, 0, w, h);

    /* vp → 物理像素：Canvas 的 px 是物理像素，高密度屏必须乘 densityPixels */
    let d: number = 3;
    try {
      d = display.getDefaultDisplaySync().densityPixels;
    } catch (e) {
      d = 3;
    }
    const fontPx = (vp: number): string => (vp * d) + 'px sans-serif';
    const boldPx = (vp: number): string => 'bold ' + (vp * d) + 'px sans-serif';

    // 残影大环（纵深，低透明度）
    ctx.strokeStyle = 'rgba(233,200,120,0.06)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy - h * 0.06, w * 0.60, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(233,200,120,0.10)';
    ctx.beginPath();
    ctx.arc(cx, cy - h * 0.03, w * 0.48, 0, Math.PI * 2);
    ctx.stroke();

    // 外圈刻度（六十，拟六甲）
    ctx.strokeStyle = 'rgba(233,200,120,0.22)';
    ctx.lineWidth = 1;
    const tickR = w * 0.475;
    for (let i = 0; i < 60; i++) {
      const ang = (i / 60) * Math.PI * 2 - Math.PI / 2;
      const r1 = (i % 5 === 0) ? tickR - w * 0.018 : tickR - w * 0.010;
      ctx.beginPath();
      ctx.moveTo(cx + r1 * Math.cos(ang), cy + r1 * Math.sin(ang));
      ctx.lineTo(cx + tickR * Math.cos(ang), cy + tickR * Math.sin(ang));
      ctx.stroke();
    }

    // 主圆环
    const rings: number[] = [0.42, 0.36, 0.29, 0.15, 0.10];
    for (let i = 0; i < rings.length; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, w * rings[i], 0, Math.PI * 2);
      ctx.strokeStyle = line;
      ctx.lineWidth = (i === 0) ? 1.5 : 1;
      ctx.stroke();
    }

    /* 四正方位（外圈标注：午南在上 / 子北在下 / 卯东在左 / 酉西在右） */
    ctx.font = fontPx(13);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fwName: string[] = ['北', '', '', '东', '', '', '南', '', '', '西', '', ''];
    for (let i = 0; i < 12; i++) {
      const nm = fwName[i];
      if (nm === '') {
        continue;
      }
      const a = -Math.PI / 2 + (i - 6) * Math.PI / 6;
      const r = w * 0.46;
      ctx.fillStyle = 'rgba(196,162,92,0.85)';
      ctx.fillText(nm, cx + r * Math.cos(a), cy + r * Math.sin(a));
    }

    // 地盘十二支（内圈，固定；午上子下：午在正上 -90°，顺行）
    for (let i = 0; i < 12; i++) {
      const ang = -Math.PI / 2 + (i - 6) * Math.PI / 6;
      const r = w * 0.115;
      const x = cx + r * Math.cos(ang);
      const y = cy + r * Math.sin(ang);
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = (i % 2 === 0) ? 'rgba(233,200,120,0.20)' : 'rgba(233,200,120,0.10)';
      ctx.fill();
      ctx.fillStyle = (i % 2 === 0) ? gold : dim;
      ctx.font = fontPx(17);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.zhi[i], x, y);
    }

    // 天盘十二支（外圈，旋转；同方位约定，随天盘整体旋转）
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((this.angle * Math.PI) / 180);
    for (let i = 0; i < 12; i++) {
      const ang = -Math.PI / 2 + (i - 6) * Math.PI / 6;
      const r = w * 0.185;
      const x = r * Math.cos(ang);
      const y = r * Math.sin(ang);
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(240,217,140,0.16)';
      ctx.fill();
      ctx.fillStyle = '#F0D98C';
      ctx.font = fontPx(15);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.zhi[i], x, y);
    }
    ctx.restore();

    // 中心炁点（光晕）
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.085, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(233,200,120,0.18)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.052, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(233,200,120,0.55)';
    ctx.fill();
    ctx.fillStyle = '#FDF3D0';
    ctx.font = boldPx(24);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('炁', cx, cy);
  }
}

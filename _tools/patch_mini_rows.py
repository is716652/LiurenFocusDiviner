# -*- coding: utf-8 -*-
"""补丁：YongShenSheet 迷你三传改上下结构（字段全）+ 迷你四课补全（4课+标注）"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\components\YongShenSheet.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    # ① 迷你三传页（页0）：上下结构，每行 位置/天干/地支/六亲/天将/神煞/空亡
    old0 = """                /* 页0 动态三传（默认；随用神） */
                Column({ space: 4 }) {
                  Row({ space: 4 }) {
                    ForEach(this.dongtai(), (dt: DongtaiItem) => {
                      Column({ space: 2 }) {
                        Text(dt.gz)
                          .fontSize(13)
                          .fontWeight(FontWeight.Bold)
                          .fontColor('#F0D98C')
                        Text(dt.lq + (dt.jiang !== '' ? '·' + dt.jiang : ''))
                          .fontSize(9)
                          .fontColor('#C4B183')
                      }
                      .layoutWeight(1)
                      .padding({ top: 6, bottom: 6 })
                      .borderRadius(6)
                      .backgroundColor('rgba(233,200,120,0.08)')
                    }, (dt: DongtaiItem) => 'dm' + dt.gz)
                  }
                  .width('100%')
                  Text(this.yongShen !== '' ? '动态三传（以' + this.yongShen + '为初传）' : '三传 · 选用神后动态')
                    .fontSize(9)
                    .fontColor('#6B5F45')
                    .width('100%')
                    .textAlign(TextAlign.Center)
                }
                .width(150)"""
    assert s.count(old0) == 1, 'p0: %d' % s.count(old0)
    new0 = """                /* 页0 动态三传（默认；随用神；上下结构：初传在上） */
                Column({ space: 3 }) {
                  ForEach(this.dongtaiRows(), (tr: MiniChuanRow) => {
                    Row({ space: 3 }) {
                      Text(tr.pos)
                        .fontSize(8)
                        .fontColor('#8A7B5C')
                        .width(18)
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
                    .backgroundColor('rgba(233,200,120,0.07)')
                  }, (tr: MiniChuanRow) => 'mr' + tr.pos)
                  Text(this.yongShen !== '' ? '动态三传 · 以' + this.yongShen + '为用神（初传在上）' : '选用神后生成动态三传')
                    .fontSize(8)
                    .fontColor('#6B5F45')
                    .width('100%')
                    .textAlign(TextAlign.Center)
                }
                .width(150)"""
    s = s.replace(old0, new0)

    # ② 迷你四课页（页2）：4 课完整，每课 第X课/上神干/上神支/下神/神煞
    old2 = """                /* 页2 迷你四课（第一课在右，与主盘一致） */
                Column({ space: 4 }) {
                  Row({ space: 4 }) {
                    ForEach(this.kegList(), (kg: KegMini) => {
                      Column({ space: 2 }) {
                        Text(kg.x)
                          .fontSize(13)
                          .fontWeight(FontWeight.Bold)
                          .fontColor('#F0D98C')
                        Text('—')
                          .fontSize(8)
                          .fontColor('#6B5F45')
                        Text(kg.s)
                          .fontSize(12)
                          .fontColor('#C4B183')
                      }
                      .layoutWeight(1)
                      .padding({ top: 6, bottom: 6 })
                      .borderRadius(6)
                      .backgroundColor('rgba(233,200,120,0.08)')
                    }, (kg: KegMini) => 'km' + kg.x + kg.s)
                  }
                  .width('100%')
                  Text('四课（上神/下神）· 左右滑切')
                    .fontSize(9)
                    .fontColor('#6B5F45')
                    .width('100%')
                    .textAlign(TextAlign.Center)
                }
                .width(150)"""
    assert s.count(old2) == 1, 'p2: %d' % s.count(old2)
    new2 = """                /* 页2 迷你四课（第一课在右；每课 第X课/上神干支/下神/神煞） */
                Column({ space: 3 }) {
                  ForEach(this.kegRowsFull(), (kr: MiniKegRow) => {
                    Row({ space: 3 }) {
                      Text(kr.kn)
                        .fontSize(8)
                        .fontColor('#8A7B5C')
                        .width(22)
                      Text(kr.xGan + kr.xZhi)
                        .fontSize(11)
                        .fontWeight(FontWeight.Bold)
                        .fontColor('#F0D98C')
                        .width(28)
                      Text('/')
                        .fontSize(9)
                        .fontColor('#6B5F45')
                      Text(kr.sGan + kr.sZhi)
                        .fontSize(11)
                        .fontColor('#C4B183')
                        .layoutWeight(1)
                      Text(kr.shensha)
                        .fontSize(8)
                        .fontColor('#6B5F45')
                        .layoutWeight(1)
                    }
                    .width('100%')
                    .padding({ top: 3, bottom: 3, left: 4, right: 4 })
                    .borderRadius(5)
                    .backgroundColor('rgba(233,200,120,0.07)')
                  }, (kr: MiniKegRow) => 'kr' + kr.kn)
                  Text('四课（上神/下神）· 左右滑切')
                    .fontSize(8)
                    .fontColor('#6B5F45')
                    .width('100%')
                    .textAlign(TextAlign.Center)
                }
                .width(150)"""
    s = s.replace(old2, new2)

    # ③ 数据方法：dongtaiRows（三传带全字段）+ kegRowsFull（四课带全字段）
    old_m = """  private dongtai(): DongtaiItem[] {"""
    assert s.count(old_m) == 1, 'm: %d' % s.count(old_m)
    new_m = """  /* 迷你三传行：六亲/天干/地支/神煞/位置/天将/空亡（初传在上） */
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
      const xGan = c.dun[xZhi];
      const sGan = (c.dun[sZhi] || '');
      const ss = (c.dx.shensha.byZhi[xZhi] || []);
      const ssNames: string[] = [];
      for (let k = 0; k < ss.length; k++) {
        ssNames.push(ss[k].split('(')[0]);
      }
      out.push({
        kn: '第' + (i + 1) + '课',
        xGan: xGan,
        xZhi: xZhi,
        sGan: sGan,
        sZhi: sZhi,
        shensha: ssNames.join('·')
      });
    }
    return out;
  }

  private dongtai(): DongtaiItem[] {"""
    s = s.replace(old_m, new_m)

    # ④ 接口：MiniChuanRow + MiniKegRow（KegMini 后）
    old_iface = """/* 迷你四课展示行 */
interface KegMini {
  x: string;
  s: string;
}"""
    assert s.count(old_iface) == 1, 'iface: %d' % s.count(old_iface)
    new_iface = old_iface + """

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

/* 迷你四课行（字段全） */
interface MiniKegRow {
  kn: string;
  xGan: string;
  xZhi: string;
  sGan: string;
  sZhi: string;
  shensha: string;
}"""
    s = s.replace(old_iface, new_iface)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('MINI ROWS PATCH OK')

if __name__ == '__main__':
    main()
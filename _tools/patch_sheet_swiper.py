# -*- coding: utf-8 -*-
"""补丁：YongShenSheet 迷你盘 → Swiper 三页（天地盘/四课/三传 滑动切换）"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\components\YongShenSheet.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    # ① 迷你盘区块替换为 Swiper
    old = """          /* 迷你天地盘预览：选占事或外应取用（有用神）即显示 */
          if (this.chart && (this.affairName !== '' || this.yongShen !== '')) {
            Column({ space: 4 }) {
              Row() {
                Text('盘面预览')
                  .fontSize(11)
                  .fontColor('#8A7B5C')
                Blank()
                Text('当前用神 ' + this.yongShen + ' 宫')
                  .fontSize(10)
                  .fontColor('#A8843C')
              }
              .width('100%')
              PanDisk({
                chart: this.chart,
                yongShen: this.yongShen,
                cands: this.candZhis(),
                onPickZhi: (z: string, layer: string) => {
                  this.onPickZhi(z, layer);
                }
              })
                .width(150)
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
          }"""
    assert s.count(old) == 1, 'old: %d' % s.count(old)
    new = """          /* 迷你盘预览：Swiper 三页（天地盘/四课/三传 左右滑动切换） */
          if (this.chart && (this.affairName !== '' || this.yongShen !== '')) {
            Column({ space: 4 }) {
              Row() {
                Text('盘面预览')
                  .fontSize(11)
                  .fontColor('#8A7B5C')
                Blank()
                Text(this.yongShen !== '' ? '当前用神 ' + this.yongShen + ' 宫' : '左右滑看盘/四课/三传')
                  .fontSize(10)
                  .fontColor('#A8843C')
              }
              .width('100%')
              Swiper() {
                /* 页0 天地盘 */
                PanDisk({
                  chart: this.chart,
                  yongShen: this.yongShen,
                  cands: this.candZhis(),
                  onPickZhi: (z: string, layer: string) => {
                    this.onPickZhi(z, layer);
                  }
                })
                  .width(150)
                /* 页1 迷你四课（第一课在右，与主盘一致） */
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
                  Text('四课（上神/下神）· 左右滑切天地盘·三传')
                    .fontSize(9)
                    .fontColor('#6B5F45')
                    .width('100%')
                    .textAlign(TextAlign.Center)
                }
                .width(150)
                /* 页2 迷你三传（随用神动态） */
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
                .width(150)
              }
              .width(150)
              .height(170)
              .indicator(true)
              .loop(false)
              .onChange((idx: number) => {
                /* 切页无需额外逻辑 */
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
          }"""
    s = s.replace(old, new)

    # ② 加 KegMini 接口 + kegList 方法（DongtaiItem 已导入）
    old_iface = """/* 神煞分组（日支 / 月将 / 初传） */"""
    assert s.count(old_iface) == 1, 'iface: %d' % s.count(old_iface)
    # 找组件内方法区，加 kegList
    old_m = """  private dongtai(): DongtaiItem[] {"""
    assert s.count(old_m) == 1, 'm: %d' % s.count(old_m)
    new_m = """  /* 迷你四课数据：chart.kegs → {x:上神, s:下神} */
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

  private dongtai(): DongtaiItem[] {"""
    s = s.replace(old_m, new_m)

    # ③ 文件顶部加 KegMini 接口（在 import 后）
    old_imp = """import type {
  AffairCfg,
  DongtaiItem,
  DuyuPick,
  JieDianWord,
  YongShenCand
} from '../model/YongShenCore';"""
    assert s.count(old_imp) == 1, 'imp: %d' % s.count(old_imp)
    new_imp = old_imp + """

/* 迷你四课展示行 */
interface KegMini {
  x: string;
  s: string;
}"""
    s = s.replace(old_imp, new_imp)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('SHEET SWIPER PATCH OK')

if __name__ == '__main__':
    main()

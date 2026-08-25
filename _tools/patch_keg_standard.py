# -*- coding: utf-8 -*-
"""补丁：迷你四课 = 每列 天将/上神支/下神支（去天干神煞，高度一致，补十二天神）"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\components\YongShenSheet.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    # ① 数据方法：加 jiang，去掉 shensha/sGan
    old = """  private kegRowsFull(): MiniKegRow[] {
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
  }"""
    assert s.count(old) == 1, 'data: %d' % s.count(old)
    new = """  private kegRowsFull(): MiniKegRow[] {
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
  }"""
    s = s.replace(old, new)

    # ② UI：每列 天将/上神支/下神支（三行，高度一致）
    old_ui = """                /* 页2 迷你四课（横排4课，每课一列；第一课在右） */
                Column({ space: 3 }) {
                  Row({ space: 3 }) {
                    ForEach(this.kegRowsFull(), (kr: MiniKegRow) => {
                      Column({ space: 2 }) {
                        Text(kr.kn)
                          .fontSize(8)
                          .fontColor('#8A7B5C')
                        Text(kr.xGan + kr.xZhi)
                          .fontSize(12)
                          .fontWeight(FontWeight.Bold)
                          .fontColor('#F0D98C')
                        Text('—')
                          .fontSize(8)
                          .fontColor('#6B5F45')
                        Text(kr.sGan + kr.sZhi)
                          .fontSize(11)
                          .fontColor('#C4B183')
                        Text(kr.shensha)
                          .fontSize(7)
                          .fontColor('#6B5F45')
                          .maxLines(2)
                          .textOverflow({ overflow: TextOverflow.Ellipsis })
                      }
                      .layoutWeight(1)
                      .padding({ top: 4, bottom: 4, left: 2, right: 2 })
                      .borderRadius(5)
                      .backgroundColor('rgba(233,200,120,0.07)')
                    }, (kr: MiniKegRow) => 'kr' + kr.kn)
                  }
                  .width('100%')
                  Text('四课（上神/下神）· 左右滑切')
                    .fontSize(8)
                    .fontColor('#6B5F45')
                    .width('100%')
                    .textAlign(TextAlign.Center)
                }
                .width(150)"""
    assert s.count(old_ui) == 1, 'ui: %d' % s.count(old_ui)
    new_ui = """                /* 页2 迷你四课（横排4课，每列 天将/上神支/下神支；第一课在右；高度一致） */
                Column({ space: 3 }) {
                  Row({ space: 3 }) {
                    ForEach(this.kegRowsFull(), (kr: MiniKegRow) => {
                      Column({ space: 3 }) {
                        Text(kr.jiang !== '' ? kr.jiang : '—')
                          .fontSize(10)
                          .fontWeight(FontWeight.Medium)
                          .fontColor(kr.jiang !== '' && LiurenCore.JIANG_JX[kr.jiang] === '凶' ? '#D0704A' : '#E9C878')
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
                      .padding({ top: 6, bottom: 6, left: 2, right: 2 })
                      .borderRadius(5)
                      .backgroundColor('rgba(233,200,120,0.07)')
                      .constraintSize({ minHeight: 78 })
                    }, (kr: MiniKegRow) => 'kr' + kr.kn)
                  }
                  .width('100%')
                  Text('四课（天将/上神/下神）· 左右滑切')
                    .fontSize(8)
                    .fontColor('#6B5F45')
                    .width('100%')
                    .textAlign(TextAlign.Center)
                }
                .width(150)"""
    s = s.replace(old_ui, new_ui)

    # ③ 接口：jiang 字段
    old_iface = """/* 迷你四课行（字段全） */
interface MiniKegRow {
  kn: string;
  xGan: string;
  xZhi: string;
  sGan: string;
  sZhi: string;
  shensha: string;
}"""
    assert s.count(old_iface) == 1, 'iface: %d' % s.count(old_iface)
    new_iface = """/* 迷你四课行 */
interface MiniKegRow {
  kn: string;
  xGan: string;
  xZhi: string;
  sGan: string;
  sZhi: string;
  jiang: string;
  shensha: string;
}"""
    s = s.replace(old_iface, new_iface)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('KEG STANDARD PATCH OK')

if __name__ == '__main__':
    main()
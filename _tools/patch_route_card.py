# -*- coding: utf-8 -*-
"""补丁：Index.ets 加「解读路线」入口卡（读象/毕法/中黄 三条路线速览+切换）
位置：盘态区之后、神煞区之前
交互：三个路线标签 → 展开对应路线的速览（读象=抓用神入口、毕法=教练摘要、中黄=先锋链路摘要）
"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Index.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    # ① 状态：路线标签
    old_state = """  /* 中黄研习：遁干模式（旬/日遁/时遁）+ 两遁数据 + 完整分析 */
  @State private zhonghuangMode: string = '旬';
  @State private zhonghuang: ZhonghuangDun | null = null;
  @State private zhonghuangAna: ZhonghuangAnalyze | null = null;"""
    assert s.count(old_state) == 1, 'state: %d' % s.count(old_state)
    new_state = old_state + """
  /* 解读路线：当前展开的路线（读象/毕法/中黄；空=全收起） */
  @State private route: string = '';"""
    s = s.replace(old_state, new_state)

    # ② 盘态区后插路线入口卡（神煞区前）
    old_anchor = """      /* 神煞 */
      Column({ space: 8 }) {
        Row() {
          Text('神煞')"""
    assert s.count(old_anchor) == 1, 'anchor: %d' % s.count(old_anchor)
    route_card = """      /* 解读路线：读象/毕法/中黄 三条路线速览（点击切换；四课三传先看，路线按需深入） */
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
          Text('神煞')"""
    s = s.replace(old_anchor, route_card)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('ROUTE CARD PATCH OK')

if __name__ == '__main__':
    main()

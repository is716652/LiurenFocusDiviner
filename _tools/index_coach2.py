# -*- coding: utf-8 -*-
"""Index.ets：毕法教练栏 UI（组合断 + 建议汇总）"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Index.ets"
t = io.open(p, encoding="utf-8").read()

old = """        if (this.cur().dx.bifa.length === 0) {
          Text('本课无毕法格局命中')
            .fontSize(12)
            .fontColor('#5A4F3D')
            .margin({ top: 2 })
        }"""
new = """        /* 毕法教练栏（组合断 + 建议汇总；付费模式未解锁时不显示） */
        if (this.coach && PayGate.isUnlocked(PayConfig.F_BIFA) && this.coach.items.length > 0) {
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
            if (this.coach.advice.length > 0) {
              Text('建议：' + this.coach.advice.join('；'))
                .fontSize(11)
                .fontColor('#B8A97F')
                .lineHeight(16)
                .width('100%')
            }
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
        }"""
if old in t:
    t = t.replace(old, new)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK coach bar")
else:
    print("MISS coach bar")

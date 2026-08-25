# -*- coding: utf-8 -*-
"""鸿蒙 Index.ets：nianmingAdvice 调用传用神 + 显示互动关系"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Index.ets"
t = io.open(p, encoding="utf-8").read()

# 1. doChart 里的调用（补用神参数：当前 yongShen）
old1 = """      this.nianming = null;
      if (this.nianZhi !== '') {
        this.nianming = LiurenCore.nianmingAdvice(c, this.nianZhi);
      }"""
new1 = """      this.nianming = null;
      if (this.nianZhi !== '') {
        this.nianming = LiurenCore.nianmingAdvice(c, this.nianZhi, this.yongShen);
      }"""
if old1 in t:
    t = t.replace(old1, new1)
    print("OK doChart")
else:
    print("MISS doChart")

# 2. 年命 chips 点击调用（补用神参数）
old2 = """                    .onClick(() => {
                      this.nianZhi = z;
                      const c = this.chart;
                      if (c) {
                        this.nianming = LiurenCore.nianmingAdvice(c, z);
                      }
                    })"""
new2 = """                    .onClick(() => {
                      this.nianZhi = z;
                      const c = this.chart;
                      if (c) {
                        this.nianming = LiurenCore.nianmingAdvice(c, z, this.yongShen);
                      }
                    })"""
if old2 in t:
    t = t.replace(old2, new2)
    print("OK chips")
else:
    print("MISS chips")

# 3. 年命显示：加互动关系行（rel 显示）
old3 = """            if (this.nianming) {
              Text('年命' + this.nianming.nianZhi + ' · 上神' + this.nianming.shangShen +
                '（' + this.nianming.liuqin + '）' + (this.nianming.kong ? '·空' : '') +
                ' ' + this.nianming.wangShuai)
                .fontSize(11)
                .fontColor('#C4B183')
                .lineHeight(16)
                .width('100%')"""
new3 = """            if (this.nianming) {
              Text('年命' + this.nianming.nianZhi + ' · 上神' + this.nianming.shangShen +
                '（' + this.nianming.liuqin + '）' + (this.nianming.kong ? '·空' : '') +
                ' ' + this.nianming.wangShuai +
                (this.nianming.rel !== '' ? ' · 与用神' + this.nianming.rel : ''))
                .fontSize(11)
                .fontColor('#C4B183')
                .lineHeight(16)
                .width('100%')"""
if old3 in t:
    t = t.replace(old3, new3)
    print("OK display rel")
else:
    print("MISS display rel")

io.open(p, "w", encoding="utf-8").write(t)
print("done")

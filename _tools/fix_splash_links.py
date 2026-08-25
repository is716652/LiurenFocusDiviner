# -*- coding: utf-8 -*-
"""Splash.ets：底部加 隐私政策/用户协议 链接"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Splash.ets"
t = io.open(p, encoding="utf-8").read()

old = """      // 底部小字
      Text('以炁为基 · 四课三传 · 神煞格局 · 读象直断')
        .fontSize(12)
        .fontColor('#6B5F45')
        .letterSpacing(2)
        .translate({ y: 336 })
    }"""
new = """      // 底部小字 + 合规链接
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
    }"""
if old in t:
    t = t.replace(old, new)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK splash links")
else:
    print("MISS")

# -*- coding: utf-8 -*-
"""补丁：古籍案例速排 选择行改为横向滚动（12干支不超屏）
每行结构从 Row{标签 ForEach(chips)} 改为 Row{标签 + Scroll横向{Row(chips)}}
"""
import io
import re

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Index.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    # 通用处理：对每对 「Text('X') + ForEach(...chips...)」 的 Row 加横向 Scroll
    # 匹配模式：标签行 + ForEach 块（含 onClick 设置 this.ancientX）
    # 用行级处理：找到 7 个 ForEach(ancient 前缀) 的父 Row，改造

    # 逐行模式：每一组 = Row({space:6}) { Text(标签)  ForEach(HOURS/GAN...) {...} }
    # 手动精确替换 7 处（月将/日干/日支/占时/年干/年支/月支）

    # ① 月将行
    old1 = """              /* 月将 */
              Row({ space: 6 }) {
                Text('月将').fontSize(11).fontColor('#8A7B5C')
                ForEach(HOURS, (z: string) => {
                  Text(z)
                    .fontSize(12)
                    .fontColor(this.ancientMj === z ? '#1A1410' : '#C4B183')
                    .backgroundColor(this.ancientMj === z ? '#F0D98C' : 'rgba(138,123,92,0.12)')
                    .borderRadius(8)
                    .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                    .onClick(() => { this.ancientMj = z; })
                }, (z: string) => 'amj' + z)
              }
              .width('100%')"""
    new1 = """              /* 月将（横向滚动） */
              Row() {
                Text('月将').fontSize(11).fontColor('#8A7B5C').margin({ right: 6 })
                Scroll() {
                  Row({ space: 6 }) {
                    ForEach(HOURS, (z: string) => {
                      Text(z)
                        .fontSize(12)
                        .fontColor(this.ancientMj === z ? '#1A1410' : '#C4B183')
                        .backgroundColor(this.ancientMj === z ? '#F0D98C' : 'rgba(138,123,92,0.12)')
                        .borderRadius(8)
                        .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                        .onClick(() => { this.ancientMj = z; })
                    }, (z: string) => 'amj' + z)
                  }
                }
                .scrollable(ScrollDirection.Horizontal)
                .scrollBar(BarState.Off)
                .layoutWeight(1)
              }
              .width('100%')"""
    assert s.count(old1) == 1, 'mj: %d' % s.count(old1)
    s = s.replace(old1, new1)

    # ② 日干行
    old2 = """              /* 日干 */
              Row({ space: 6 }) {
                Text('日干').fontSize(11).fontColor('#8A7B5C')
                ForEach(LiurenCore.GAN, (g: string) => {
                  Text(g)
                    .fontSize(12)
                    .fontColor(this.ancientDg === g ? '#1A1410' : '#C4B183')
                    .backgroundColor(this.ancientDg === g ? '#F0D98C' : 'rgba(138,123,92,0.12)')
                    .borderRadius(8)
                    .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                    .onClick(() => { this.ancientDg = g; })
                }, (g: string) => 'adg' + g)
              }
              .width('100%')"""
    new2 = """              /* 日干（横向滚动） */
              Row() {
                Text('日干').fontSize(11).fontColor('#8A7B5C').margin({ right: 6 })
                Scroll() {
                  Row({ space: 6 }) {
                    ForEach(LiurenCore.GAN, (g: string) => {
                      Text(g)
                        .fontSize(12)
                        .fontColor(this.ancientDg === g ? '#1A1410' : '#C4B183')
                        .backgroundColor(this.ancientDg === g ? '#F0D98C' : 'rgba(138,123,92,0.12)')
                        .borderRadius(8)
                        .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                        .onClick(() => { this.ancientDg = g; })
                    }, (g: string) => 'adg' + g)
                  }
                }
                .scrollable(ScrollDirection.Horizontal)
                .scrollBar(BarState.Off)
                .layoutWeight(1)
              }
              .width('100%')"""
    assert s.count(old2) == 1, 'dg: %d' % s.count(old2)
    s = s.replace(old2, new2)

    # ③ 日支行
    old3 = """              /* 日支 */
              Row({ space: 6 }) {
                Text('日支').fontSize(11).fontColor('#8A7B5C')
                ForEach(HOURS, (z: string) => {
                  Text(z)
                    .fontSize(12)
                    .fontColor(this.ancientDz === z ? '#1A1410' : '#C4B183')
                    .backgroundColor(this.ancientDz === z ? '#F0D98C' : 'rgba(138,123,92,0.12)')
                    .borderRadius(8)
                    .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                    .onClick(() => { this.ancientDz = z; })
                }, (z: string) => 'adz' + z)
              }
              .width('100%')"""
    new3 = """              /* 日支（横向滚动） */
              Row() {
                Text('日支').fontSize(11).fontColor('#8A7B5C').margin({ right: 6 })
                Scroll() {
                  Row({ space: 6 }) {
                    ForEach(HOURS, (z: string) => {
                      Text(z)
                        .fontSize(12)
                        .fontColor(this.ancientDz === z ? '#1A1410' : '#C4B183')
                        .backgroundColor(this.ancientDz === z ? '#F0D98C' : 'rgba(138,123,92,0.12)')
                        .borderRadius(8)
                        .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                        .onClick(() => { this.ancientDz = z; })
                    }, (z: string) => 'adz' + z)
                  }
                }
                .scrollable(ScrollDirection.Horizontal)
                .scrollBar(BarState.Off)
                .layoutWeight(1)
              }
              .width('100%')"""
    assert s.count(old3) == 1, 'dz: %d' % s.count(old3)
    s = s.replace(old3, new3)

    # ④ 占时行
    old4 = """              /* 占时 */
              Row({ space: 6 }) {
                Text('占时').fontSize(11).fontColor('#8A7B5C')
                ForEach(HOURS, (z: string) => {
                  Text(z)
                    .fontSize(12)
                    .fontColor(this.ancientHz === z ? '#1A1410' : '#C4B183')
                    .backgroundColor(this.ancientHz === z ? '#F0D98C' : 'rgba(138,123,92,0.12)')
                    .borderRadius(8)
                    .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                    .onClick(() => { this.ancientHz = z; })
                }, (z: string) => 'ahz' + z)
              }
              .width('100%')"""
    new4 = """              /* 占时（横向滚动） */
              Row() {
                Text('占时').fontSize(11).fontColor('#8A7B5C').margin({ right: 6 })
                Scroll() {
                  Row({ space: 6 }) {
                    ForEach(HOURS, (z: string) => {
                      Text(z)
                        .fontSize(12)
                        .fontColor(this.ancientHz === z ? '#1A1410' : '#C4B183')
                        .backgroundColor(this.ancientHz === z ? '#F0D98C' : 'rgba(138,123,92,0.12)')
                        .borderRadius(8)
                        .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                        .onClick(() => { this.ancientHz = z; })
                    }, (z: string) => 'ahz' + z)
                  }
                }
                .scrollable(ScrollDirection.Horizontal)
                .scrollBar(BarState.Off)
                .layoutWeight(1)
              }
              .width('100%')"""
    assert s.count(old4) == 1, 'hz: %d' % s.count(old4)
    s = s.replace(old4, new4)

    # ⑤ 年干行（选填，小chips）
    old5 = """              Row({ space: 6 }) {
                Text('年干(选)').fontSize(10).fontColor('#6B5F45')
                ForEach(LiurenCore.GAN, (g: string) => {
                  Text(g)
                    .fontSize(11)
                    .fontColor(this.ancientYG === g ? '#1A1410' : '#8A7B5C')
                    .backgroundColor(this.ancientYG === g ? '#F0D98C' : 'rgba(107,95,69,0.2)')
                    .borderRadius(6)
                    .padding({ left: 5, right: 5, top: 1, bottom: 1 })
                    .onClick(() => { this.ancientYG = (this.ancientYG === g) ? '' : g; })
                }, (g: string) => 'ayg' + g)
              }
              .width('100%')"""
    new5 = """              Row() {
                Text('年干(选)').fontSize(10).fontColor('#6B5F45').margin({ right: 6 })
                Scroll() {
                  Row({ space: 6 }) {
                    ForEach(LiurenCore.GAN, (g: string) => {
                      Text(g)
                        .fontSize(11)
                        .fontColor(this.ancientYG === g ? '#1A1410' : '#8A7B5C')
                        .backgroundColor(this.ancientYG === g ? '#F0D98C' : 'rgba(107,95,69,0.2)')
                        .borderRadius(6)
                        .padding({ left: 5, right: 5, top: 1, bottom: 1 })
                        .onClick(() => { this.ancientYG = (this.ancientYG === g) ? '' : g; })
                    }, (g: string) => 'ayg' + g)
                  }
                }
                .scrollable(ScrollDirection.Horizontal)
                .scrollBar(BarState.Off)
                .layoutWeight(1)
              }
              .width('100%')"""
    assert s.count(old5) == 1, 'yg: %d' % s.count(old5)
    s = s.replace(old5, new5)

    # ⑥ 年支行
    old6 = """              Row({ space: 6 }) {
                Text('年支(选)').fontSize(10).fontColor('#6B5F45')
                ForEach(HOURS, (z: string) => {
                  Text(z)
                    .fontSize(11)
                    .fontColor(this.ancientYZ === z ? '#1A1410' : '#8A7B5C')
                    .backgroundColor(this.ancientYZ === z ? '#F0D98C' : 'rgba(107,95,69,0.2)')
                    .borderRadius(6)
                    .padding({ left: 5, right: 5, top: 1, bottom: 1 })
                    .onClick(() => { this.ancientYZ = (this.ancientYZ === z) ? '' : z; })
                }, (z: string) => 'ayz' + z)
              }
              .width('100%')"""
    new6 = """              Row() {
                Text('年支(选)').fontSize(10).fontColor('#6B5F45').margin({ right: 6 })
                Scroll() {
                  Row({ space: 6 }) {
                    ForEach(HOURS, (z: string) => {
                      Text(z)
                        .fontSize(11)
                        .fontColor(this.ancientYZ === z ? '#1A1410' : '#8A7B5C')
                        .backgroundColor(this.ancientYZ === z ? '#F0D98C' : 'rgba(107,95,69,0.2)')
                        .borderRadius(6)
                        .padding({ left: 5, right: 5, top: 1, bottom: 1 })
                        .onClick(() => { this.ancientYZ = (this.ancientYZ === z) ? '' : z; })
                    }, (z: string) => 'ayz' + z)
                  }
                }
                .scrollable(ScrollDirection.Horizontal)
                .scrollBar(BarState.Off)
                .layoutWeight(1)
              }
              .width('100%')"""
    assert s.count(old6) == 1, 'yz: %d' % s.count(old6)
    s = s.replace(old6, new6)

    # ⑦ 月支行
    old7 = """              Row({ space: 6 }) {
                Text('月支(选)').fontSize(10).fontColor('#6B5F45')
                ForEach(HOURS, (z: string) => {
                  Text(z)
                    .fontSize(11)
                    .fontColor(this.ancientMZ === z ? '#1A1410' : '#8A7B5C')
                    .backgroundColor(this.ancientMZ === z ? '#F0D98C' : 'rgba(107,95,69,0.2)')
                    .borderRadius(6)
                    .padding({ left: 5, right: 5, top: 1, bottom: 1 })
                    .onClick(() => { this.ancientMZ = (this.ancientMZ === z) ? '' : z; })
                }, (z: string) => 'amz' + z)
              }
              .width('100%')"""
    new7 = """              Row() {
                Text('月支(选)').fontSize(10).fontColor('#6B5F45').margin({ right: 6 })
                Scroll() {
                  Row({ space: 6 }) {
                    ForEach(HOURS, (z: string) => {
                      Text(z)
                        .fontSize(11)
                        .fontColor(this.ancientMZ === z ? '#1A1410' : '#8A7B5C')
                        .backgroundColor(this.ancientMZ === z ? '#F0D98C' : 'rgba(107,95,69,0.2)')
                        .borderRadius(6)
                        .padding({ left: 5, right: 5, top: 1, bottom: 1 })
                        .onClick(() => { this.ancientMZ = (this.ancientMZ === z) ? '' : z; })
                    }, (z: string) => 'amz' + z)
                  }
                }
                .scrollable(ScrollDirection.Horizontal)
                .scrollBar(BarState.Off)
                .layoutWeight(1)
              }
              .width('100%')"""
    assert s.count(old7) == 1, 'mz: %d' % s.count(old7)
    s = s.replace(old7, new7)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('SCROLL ROWS PATCH OK')

if __name__ == '__main__':
    main()

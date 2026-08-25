# -*- coding: utf-8 -*-
"""补丁：Index.ets 加辅助层开关（地盘干/本位神）到天盘标题栏"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Index.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    # ① 状态
    old_state = """  /* 古籍案例速排：输入月将/日干支/占时(+可选年/月) 反推完整盘面 */
  @State private showAncient: boolean = false;"""
    assert s.count(old_state) == 1, 'state: %d' % s.count(old_state)
    new_state = """  /* 古籍案例速排：输入月将/日干支/占时(+可选年/月) 反推完整盘面 */
  @State private showAncient: boolean = false;
  /* 盘面辅助层开关：显地盘干/显本位神（颜色区分主辅） */
  @State private showDunDi: boolean = false;
  @State private showBenshen: boolean = false;"""
    s = s.replace(old_state, new_state)

    # ② 天盘标题栏：在遁干模式切换后加辅助层开关（需定位现有模式切换块）
    old_switch = """          /* 遁干模式切换（同屏看盘；看盘免费=不受解锁限制，仅收费版显示；中黄断语块仍锁定） */
          if (PayConfig.paidVisible() && this.zhonghuang) {
            Row({ space: 4 }) {
              ForEach(['旬', '日遁', '时遁'], (m: string) => {
                Text(m)
                  .fontSize(10)
                  .fontColor(this.zhonghuangMode === m ? '#1A1410' : '#C4B183')
                  .backgroundColor(this.zhonghuangMode === m ? '#F0D98C' : 'rgba(138,123,92,0.12)')
                  .borderRadius(8)
                  .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                  .onClick(() => {
                    this.zhonghuangMode = m;
                  })
              }, (m: string) => 'topzh' + m)
            }
            .margin({ left: 6 })
          }"""
    assert s.count(old_switch) == 1, 'switch: %d' % s.count(old_switch)
    new_switch = """          /* 遁干模式切换 + 辅助层开关（看盘免费；中黄断语块仍锁定） */
          if (PayConfig.paidVisible() && this.zhonghuang) {
            Row({ space: 4 }) {
              ForEach(['旬', '日遁', '时遁'], (m: string) => {
                Text(m)
                  .fontSize(10)
                  .fontColor(this.zhonghuangMode === m ? '#1A1410' : '#C4B183')
                  .backgroundColor(this.zhonghuangMode === m ? '#F0D98C' : 'rgba(138,123,92,0.12)')
                  .borderRadius(8)
                  .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                  .onClick(() => {
                    this.zhonghuangMode = m;
                  })
              }, (m: string) => 'topzh' + m)
            }
            .margin({ left: 6 })
          } else if (!PayConfig.paidVisible()) {
            /* 免费版：仅辅助层开关（无中黄） */
            Row({ space: 4 }) {
              Text('地盘干')
                .fontSize(10)
                .fontColor(this.showDunDi ? '#7FA69A' : '#6B5F45')
                .borderRadius(8)
                .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                .onClick(() => {
                  this.showDunDi = !this.showDunDi;
                })
              Text('本位')
                .fontSize(10)
                .fontColor(this.showBenshen ? '#8A7448' : '#6B5F45')
                .borderRadius(8)
                .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                .onClick(() => {
                  this.showBenshen = !this.showBenshen;
                })
            }
            .margin({ left: 6 })
          }
          /* 收费版：中黄模式下叠加辅助层开关 */
          if (PayConfig.paidVisible() && this.zhonghuang) {
            Row({ space: 4 }) {
              Text('地盘干')
                .fontSize(10)
                .fontColor(this.showDunDi ? '#7FA69A' : '#6B5F45')
                .borderRadius(8)
                .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                .onClick(() => {
                  this.showDunDi = !this.showDunDi;
                })
              Text('本位')
                .fontSize(10)
                .fontColor(this.showBenshen ? '#8A7448' : '#6B5F45')
                .borderRadius(8)
                .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                .onClick(() => {
                  this.showBenshen = !this.showBenshen;
                })
            }
            .margin({ left: 6 })
          }"""
    s = s.replace(old_switch, new_switch)

    # ③ 主盘 PanDisk 传 showDunDi/showBenshen
    old_pan = """            zhonghuangMode: this.zhonghuangMode,
            zhonghuang: this.zhonghuang,
            onPickZhi: (z: string, layer: string) => {"""
    assert s.count(old_pan) == 1, 'pan: %d' % s.count(old_pan)
    new_pan = """            zhonghuangMode: this.zhonghuangMode,
            zhonghuang: this.zhonghuang,
            showDunDi: this.showDunDi,
            showBenshen: this.showBenshen,
            onPickZhi: (z: string, layer: string) => {"""
    s = s.replace(old_pan, new_pan)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('LAYER SWITCH PATCH OK')

if __name__ == '__main__':
    main()

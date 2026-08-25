# -*- coding: utf-8 -*-
"""Index.ets：毕法区底部加年命适配块（12 支 chips + 建议显示）"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Index.ets"
t = io.open(p, encoding="utf-8").read()

old = """        }, (hit: BifaHit) => 'b' + hit.序)
      }
      .width('100%')
      .padding(12)
      .borderRadius(16)
      .backgroundColor('#1C1A16')
      .border({ width: 1, color: 'rgba(233,200,120,0.14)' })
    }
    .width('100%')
  }

  @Builder
  private pillar(label: string, value: string) {"""
new = """        }, (hit: BifaHit) => 'b' + hit.序)

        /* 年命适配（付费门禁；选年命看个性化建议） */
        if (PayGate.isUnlocked(PayConfig.F_BIFA)) {
          Column({ space: 6 }) {
            Row() {
              Text('年命适配')
                .fontSize(11)
                .fontColor('#8A7B5C')
              Blank()
              Text('选年命地支 · 看个性化建议')
                .fontSize(10)
                .fontColor('#5A4F3D')
            }
            .width('100%')
            Scroll() {
              Row({ space: 6 }) {
                ForEach(HOURS, (z: string) => {
                  Text(z)
                    .fontSize(12)
                    .fontColor(this.nianZhi === z ? '#1A1410' : '#C4B183')
                    .backgroundColor(this.nianZhi === z ? '#F0D98C' : 'rgba(138,123,92,0.12)')
                    .borderRadius(12)
                    .padding({ left: 10, right: 10, top: 4, bottom: 4 })
                    .onClick(() => {
                      this.nianZhi = z;
                      const c = this.chart;
                      if (c) {
                        this.nianming = LiurenCore.nianmingAdvice(c, z);
                      }
                    })
                }, (z: string) => 'nz' + z)
              }
              .padding({ left: 2, right: 2, top: 2, bottom: 2 })
            }
            .scrollable(ScrollDirection.Horizontal)
            .scrollBar(BarState.Off)
            .width('100%')
            if (this.nianming) {
              Text('年命' + this.nianming.nianZhi + ' · 上神' + this.nianming.shangShen +
                '（' + this.nianming.liuqin + '）' + (this.nianming.kong ? '·空' : '') +
                ' ' + this.nianming.wangShuai)
                .fontSize(11)
                .fontColor('#C4B183')
                .lineHeight(16)
                .width('100%')
              Text(this.nianming.advice)
                .fontSize(12)
                .fontColor('#F0D98C')
                .lineHeight(18)
                .width('100%')
            }
          }
          .width('100%')
          .padding({ top: 8 })
          .border({ width: { top: 1 }, color: 'rgba(233,200,120,0.15)' })
        }
      }
      .width('100%')
      .padding(12)
      .borderRadius(16)
      .backgroundColor('#1C1A16')
      .border({ width: 1, color: 'rgba(233,200,120,0.14)' })
    }
    .width('100%')
  }

  @Builder
  private pillar(label: string, value: string) {"""
if old in t:
    t = t.replace(old, new)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK nianming block")
else:
    print("MISS nianming block")

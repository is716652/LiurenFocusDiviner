# -*- coding: utf-8 -*-
"""Index.ets：教练栏加分组解读 + 年命适配（状态+chips+建议）"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Index.ets"
t = io.open(p, encoding="utf-8").read()

# 1. import NianmingAdvice 类型
old_imp = """import type {
  BifaDetail,
  BifaHit,
  Chart,
  ChartInput,
  CoachResult,
  DayRec,
  Keg,
  YearGcObj,
  YueJiangSeg
} from '../model/LiurenCore';"""
new_imp = """import type {
  BifaDetail,
  BifaHit,
  Chart,
  ChartInput,
  CoachResult,
  DayRec,
  Keg,
  NianmingAdvice,
  YearGcObj,
  YueJiangSeg
} from '../model/LiurenCore';"""
if old_imp in t:
    t = t.replace(old_imp, new_imp)
    print("OK import")
else:
    print("MISS import")

# 2. 状态：年命
old_state = """  @State private coachData: Record<string, Object> = {};
  @State private coach: CoachResult | null = null;"""
new_state = """  @State private coachData: Record<string, Object> = {};
  @State private coach: CoachResult | null = null;
  @State private nianZhi: string = '';
  @State private nianming: NianmingAdvice | null = null;"""
if old_state in t:
    t = t.replace(old_state, new_state)
    print("OK state")
else:
    print("MISS state")

# 3. doChart 计算 coach 处重置年命
old_chart = """      this.coach = LiurenCore.bifaCoach(c.dx.bifa, this.coachData);"""
new_chart = """      this.coach = LiurenCore.bifaCoach(c.dx.bifa, this.coachData);
      this.nianming = null;
      if (this.nianZhi !== '') {
        this.nianming = LiurenCore.nianmingAdvice(c, this.nianZhi);
      }"""
if old_chart in t:
    t = t.replace(old_chart, new_chart)
    print("OK chart")
else:
    print("MISS chart")

# 4. 教练栏加分组解读
old_group = """            if (this.coach.advice.length > 0) {
              Text('建议：' + this.coach.advice.join('；'))
                .fontSize(11)
                .fontColor('#B8A97F')
                .lineHeight(16)
                .width('100%')
            }"""
new_group = """            if (this.coach.groups.length > 0) {
              ForEach(this.coach.groups, (g: string) => {
                Text('· ' + g)
                  .fontSize(11)
                  .fontColor('#C4B183')
                  .lineHeight(16)
                  .width('100%')
              }, (g: string) => g)
            }
            if (this.coach.advice.length > 0) {
              Text('建议：' + this.coach.advice.join('；'))
                .fontSize(11)
                .fontColor('#B8A97F')
                .lineHeight(16)
                .width('100%')
            }"""
if old_group in t:
    t = t.replace(old_group, new_group)
    print("OK groups")
else:
    print("MISS groups")

# 5. 毕法区末尾加年命块（在毕法格局 ForEach 之后、区块结束前）
#    找毕法区块结束（.border({ width: 1, color: 'rgba(233,200,120,0.14)' }) 后跟下一个注释）
old_end = """          .padding(12)
          .borderRadius(12)
          .backgroundColor('#211E18')
          .border({ width: 1, color: 'rgba(233,200,120,0.18)' })
          .onClick(() => {
            this.expandedBifa = (this.expandedBifa === hit.序) ? -1 : hit.序;
          })"""
if old_end in t:
    # 找到毕法 ForEach 结束后，追加年命块 —— 用更精确的锚点：ForEach 结束后的 "}"
    print("MISS anchor-end (manual)")
else:
    print("anchor-end not found")

io.open(p, "w", encoding="utf-8").write(t)
print("done")

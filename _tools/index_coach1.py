# -*- coding: utf-8 -*-
"""Index.ets：毕法教练栏接入（加载 coachData + 教练栏 UI + CoachResult 计算）"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Index.ets"
t = io.open(p, encoding="utf-8").read()

# 1. import 类型：CoachResult
old_imp = """import type {
  BifaDetail,
  BifaHit,
  Chart,
  ChartInput,
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
  YearGcObj,
  YueJiangSeg
} from '../model/LiurenCore';"""
if old_imp in t:
    t = t.replace(old_imp, new_imp)
    print("OK import type")
else:
    print("MISS import type")

# 2. 状态字段（bifaDetails 后加 coachData + coach）
old_state = """  @State private expandedBifa: number = -1;
  @State private bifaDetails: BifaDetail[] = [];"""
new_state = """  @State private expandedBifa: number = -1;
  @State private bifaDetails: BifaDetail[] = [];
  @State private coachData: Record<string, Object> = {};
  @State private coach: CoachResult | null = null;"""
if old_state in t:
    t = t.replace(old_state, new_state)
    print("OK state")
else:
    print("MISS state")

# 3. initData 加载 coachData
old_load = """    try {
      this.leixiang = await DataLoader.loadLeixiang(ctx);
      this.xiangyi = await DataLoader.loadXiangyi(ctx);
    } catch (e) {
      /* 类象库/管辂象意缺失：节点卡与选句兜底为空 */
    }"""
new_load = """    try {
      this.leixiang = await DataLoader.loadLeixiang(ctx);
      this.xiangyi = await DataLoader.loadXiangyi(ctx);
    } catch (e) {
      /* 类象库/管辂象意缺失：节点卡与选句兜底为空 */
    }
    try {
      this.coachData = await DataLoader.loadBifaCoach(ctx);
    } catch (e) {
      /* 毕法教练数据缺失：教练栏兜底为空 */
    }"""
if old_load in t:
    t = t.replace(old_load, new_load)
    print("OK load")
else:
    print("MISS load")

# 4. doChart 里计算 coach（在 bifaDetails 赋值处）
old_chart = """      this.bifaDetails = LiurenCore.renderBifaForChuans(c, c.dx, c.sanchuan.chuans, '');"""
new_chart = """      this.bifaDetails = LiurenCore.renderBifaForChuans(c, c.dx, c.sanchuan.chuans, '');
      this.coach = LiurenCore.bifaCoach(c.dx.bifa, this.coachData);"""
if old_chart in t:
    t = t.replace(old_chart, new_chart)
    print("OK coach calc")
else:
    print("MISS coach calc")

io.open(p, "w", encoding="utf-8").write(t)
print("done")

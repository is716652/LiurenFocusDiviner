# -*- coding: utf-8 -*-
"""Index.ets：抓用神状态提升（受控）+ 迷你盘预览联动"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Index.ets"
t = io.open(p, encoding="utf-8").read()

# 1. 状态字段替换
old1 = """  /* 抓用神高亮联动：当前用神 + 候选地支（Sheet 内切换时更新，PanDisk 同步高亮） */
  @State private hiYongShen: string = '';
  @State private hiCands: string[] = [];"""
new1 = """  /* 抓用神（受控状态，关闭 Sheet 重开不丢）：
     affairName=当前占事 / yongShen=当前用神 / anchor=锚定象；
     cands=候选地支（派生，供 PanDisk 高亮） */
  @State private affairName: string = '';
  @State private yongShen: string = '';
  @State private anchor: string = '';
  @State private cands: string[] = [];"""

# 2. PanDisk 传参
old2 = "          PanDisk({ chart: this.cur(), yongShen: this.hiYongShen, cands: this.hiCands })"
new2 = "          PanDisk({ chart: this.cur(), yongShen: this.yongShen, cands: this.cands })"

# 3. YongShenSheet 传参（@Builder yongShenSheet）
old3 = """      YongShenSheet({
        chart: this.chart,
        zhanShi: this.zhanShi,
        leixiang: this.leixiang,
        xiangyi: this.xiangyi,
        hourZhi: this.hourZhi,
        onYongShenChange: (ys: string, cs: string[]) => {
          this.hiYongShen = ys;
          this.hiCands = cs;
        }
      })"""
new3 = """      YongShenSheet({
        chart: this.chart,
        zhanShi: this.zhanShi,
        leixiang: this.leixiang,
        xiangyi: this.xiangyi,
        hourZhi: this.hourZhi,
        affairName: this.affairName,
        yongShen: this.yongShen,
        anchor: this.anchor,
        onAffairChange: (n: string) => {
          this.pickYongShenAffair(n);
        },
        onYongShenChange: (ys: string, cs: string[]) => {
          this.yongShen = ys;
          this.cands = cs;
        },
        onAnchorChange: (v: string) => {
          this.anchor = v;
        }
      })"""

ok = True
for i, (old, new) in enumerate([(old1, new1), (old2, new2), (old3, new3)], 1):
    if old in t:
        t = t.replace(old, new)
        print("OK block", i)
    else:
        print("MISS block", i)
        ok = False

# 4. 新增 pickYongShenAffair 方法（放在 yongShenSheet @Builder 之前）
method = """
  /* 选占事：重算候选并用神（沿用旧用神或取首候选），同步更新盘面高亮 */
  private pickYongShenAffair(name: string): void {
    this.affairName = name;
    this.anchor = '';
    const c = this.chart;
    const aff = YongShenCore.affairByName(name);
    if (!c || !aff) {
      this.yongShen = '';
      this.cands = [];
      return;
    }
    const cs = YongShenCore.candidates(c, aff);
    const list: string[] = [];
    for (let i = 0; i < cs.length; i++) {
      list.push(cs[i].zhi);
    }
    this.cands = list;
    if (list.length === 0) {
      this.yongShen = '';
      return;
    }
    let keep = '';
    for (let i = 0; i < list.length; i++) {
      if (list[i] === this.yongShen) {
        keep = this.yongShen;
        break;
      }
    }
    this.yongShen = keep !== '' ? keep : list[0];
  }

  /* 抓用神半模态内容（复用 YongShenSheet 组件） */
  @Builder
  private yongShenSheet() {"""

if "  /* 抓用神半模态内容（复用 YongShenSheet 组件） */\n  @Builder\n  private yongShenSheet() {" in t:
    t = t.replace("  /* 抓用神半模态内容（复用 YongShenSheet 组件） */\n  @Builder\n  private yongShenSheet() {", method)
    print("OK method")
else:
    print("MISS method anchor")
    ok = False

if ok:
    io.open(p, "w", encoding="utf-8").write(t)
    print("done")
else:
    print("NOT WRITTEN")

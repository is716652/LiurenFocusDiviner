# -*- coding: utf-8 -*-
"""核心：毕法教练层 —— bifaCoach（组合断 + 吉凶汇总 + 行动建议）"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\core\liuren-core.ts"
t = io.open(p, encoding="utf-8").read()

# 1. 接口定义（在 BifaDetail 接口后加）
anchor_iface = """/* 毕法格局·定位渲染明细 */
interface BifaDetail {"""
new_iface = """/* 毕法教练：单格局教练条目 */
interface CoachItem {
  "序": number;
  "法名": string;
  "吉凶": string;   /* 吉 / 凶 / 中 */
  "倾向": string;
  "建议": string;
}

/* 毕法教练：综合结果（组合断） */
interface CoachResult {
  items: CoachItem[];
  ji: number;       /* 吉格局数 */
  xiong: number;    /* 凶格局数 */
  zhong: number;    /* 中格局数 */
  summary: string;  /* 组合断语 */
  advice: string[]; /* 行动建议（去重汇总） */
}

/* 毕法格局·定位渲染明细 */
interface BifaDetail {"""
if anchor_iface in t:
    t = t.replace(anchor_iface, new_iface)
    print("OK iface")
else:
    print("MISS iface")

# 2. renderBifa 后加 bifaCoach
old_rb = """  /* 本课毕法渲染（aff 显式传入，替代原全局 curAffair） */
  static renderBifa(c: ChartCore, dx: Duxiang, aff: string): BifaDetail[] {
    return LiurenCore.renderBifaForChuans(c, dx, c.sanchuan.chuans, aff);
  }
}"""
new_rb = """  /* 本课毕法渲染（aff 显式传入，替代原全局 curAffair） */
  static renderBifa(c: ChartCore, dx: Duxiang, aff: string): BifaDetail[] {
    return LiurenCore.renderBifaForChuans(c, dx, c.sanchuan.chuans, aff);
  }

  /* ---------------- 毕法教练层（组合断 + 吉凶汇总 + 行动建议） ----------------
     coachData：rawfile/rule/毕法教练.json 的 {"格局":[{序,法名,吉凶,倾向,建议}]}
     输入 hits（本课或动态三传命中的 BifaHit[]），输出组合教练卡 */
  static bifaCoach(hits: BifaHit[], coachData: Record<string, Object>): CoachResult {
    const list = (coachData["格局"] as Record<string, Object>[]) || [];
    const items: CoachItem[] = [];
    let ji = 0, xiong = 0, zhong = 0;
    const adviceSet: string[] = [];
    hits.forEach((hit: BifaHit) => {
      for (let i = 0; i < list.length; i++) {
        const it = list[i] as Record<string, Object>;
        if (Number(it["序"]) === hit["序"]) {
          const item: CoachItem = {
            "序": hit["序"],
            "法名": String(it["法名"] || hit["法名"]),
            "吉凶": String(it["吉凶"] || "中"),
            "倾向": String(it["倾向"] || ""),
            "建议": String(it["建议"] || "")
          };
          items.push(item);
          if (item["吉凶"] === "吉") {
            ji++;
          } else if (item["吉凶"] === "凶") {
            xiong++;
          } else {
            zhong++;
          }
          if (item["建议"] !== "" && adviceSet.indexOf(item["建议"]) < 0) {
            adviceSet.push(item["建议"]);
          }
          break;
        }
      }
    });
    /* 组合断语 */
    let summary = "";
    if (items.length === 0) {
      summary = "本课无毕法格局命中，以四课三传与盘态常规推断。";
    } else {
      const tags: string[] = [];
      if (ji > 0) {
        tags.push(ji + " 吉");
      }
      if (xiong > 0) {
        tags.push(xiong + " 凶");
      }
      if (zhong > 0) {
        tags.push(zhong + " 中");
      }
      summary = "命中 " + items.length + " 格局（" + tags.join(" · ") + "）" +
        (xiong > ji ? "，凶象偏重，宜守不宜进。" : (ji > xiong ? "，吉象为主，可乘势而为。" : "，吉凶参半，审慎处之。"));
    }
    const out: CoachResult = { items: items, ji: ji, xiong: xiong, zhong: zhong, summary: summary, advice: adviceSet };
    return out;
  }
}"""
if old_rb in t:
    t = t.replace(old_rb, new_rb)
    print("OK bifaCoach")
else:
    print("MISS renderBifa")

io.open(p, "w", encoding="utf-8").write(t)
print("done")

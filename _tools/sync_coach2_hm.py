# -*- coding: utf-8 -*-
"""鸿蒙 LiurenCore.ets：同步毕法教练升级（CoachItem.类 + groups + nianmingAdvice）"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\model\LiurenCore.ets"
t = io.open(p, encoding="utf-8").read()

# 1. 接口升级
old_iface = """/* 毕法教练：单格局教练条目 */
export interface CoachItem {
  "序": number;
  "法名": string;
  "吉凶": string;
  "倾向": string;
  "建议": string;
}

/* 毕法教练：综合结果（组合断） */
export interface CoachResult {
  items: CoachItem[];
  ji: number;
  xiong: number;
  zhong: number;
  summary: string;
  advice: string[];
}"""
new_iface = """/* 毕法教练：单格局教练条目 */
export interface CoachItem {
  "序": number;
  "法名": string;
  "吉凶": string;
  "类": string;
  "倾向": string;
  "建议": string;
}

/* 毕法教练：综合结果（组合断 + 分组解读） */
export interface CoachResult {
  items: CoachItem[];
  ji: number;
  xiong: number;
  zhong: number;
  summary: string;
  groups: string[];
  advice: string[];
}

/* 年命适配建议 */
export interface NianmingAdvice {
  nianZhi: string;
  shangShen: string;
  liuqin: string;
  kong: boolean;
  wangShuai: string;
  advice: string;
}"""
if old_iface in t:
    t = t.replace(old_iface, new_iface)
    print("OK iface")
else:
    print("MISS iface")

# 2. bifaCoach 升级（替换现有实现）
old_coach = """  static bifaCoach(hits: BifaHit[], coachData: Record<string, Object>): CoachResult {
    const list = (coachData["格局"] as Record<string, Object>[]) || [];
    const items: CoachItem[] = [];
    let ji = 0, xiong = 0, zhong = 0;
    const adviceSet: string[] = [];
    for (let hi = 0; hi < hits.length; hi++) {
      const hit = hits[hi];
      for (let i = 0; i < list.length; i++) {
        const it = list[i] as Record<string, Object>;
        if (Number(it["序"]) === hit.序) {
          const item: CoachItem = {
            "序": hit.序,
            "法名": String(it["法名"] || hit.法名),
            "吉凶": String(it["吉凶"] || "中"),
            "倾向": String(it["倾向"] || ""),
            "建议": String(it["建议"] || "")
          };
          items.push(item);
          if (item.吉凶 === "吉") {
            ji++;
          } else if (item.吉凶 === "凶") {
            xiong++;
          } else {
            zhong++;
          }
          if (item.建议 !== "" && adviceSet.indexOf(item.建议) < 0) {
            adviceSet.push(item.建议);
          }
          break;
        }
      }
    }
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
  }"""
new_coach = """  static bifaCoach(hits: BifaHit[], coachData: Record<string, Object>): CoachResult {
    const list = (coachData["格局"] as Record<string, Object>[]) || [];
    const items: CoachItem[] = [];
    let ji = 0, xiong = 0, zhong = 0;
    const adviceSet: string[] = [];
    for (let hi = 0; hi < hits.length; hi++) {
      const hit = hits[hi];
      for (let i = 0; i < list.length; i++) {
        const it = list[i] as Record<string, Object>;
        if (Number(it["序"]) === hit.序) {
          const item: CoachItem = {
            "序": hit.序,
            "法名": String(it["法名"] || hit.法名),
            "吉凶": String(it["吉凶"] || "中"),
            "类": String(it["类"] || "杂"),
            "倾向": String(it["倾向"] || ""),
            "建议": String(it["建议"] || "")
          };
          items.push(item);
          if (item.吉凶 === "吉") {
            ji++;
          } else if (item.吉凶 === "凶") {
            xiong++;
          } else {
            zhong++;
          }
          if (item.建议 !== "" && adviceSet.indexOf(item.建议) < 0) {
            adviceSet.push(item.建议);
          }
          break;
        }
      }
    }
    let summary = "";
    const groups: string[] = [];
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
      const seen: string[] = [];
      for (let gi = 0; gi < items.length; gi++) {
        const it = items[gi];
        const cls = it.类;
        if (seen.indexOf(cls) < 0) {
          seen.push(cls);
          const same: CoachItem[] = [];
          for (let si = 0; si < items.length; si++) {
            if (items[si].类 === cls) {
              same.push(items[si]);
            }
          }
          const names: string[] = [];
          for (let si = 0; si < same.length; si++) {
            names.push(same[si].法名);
          }
          let hasXiong = false;
          let hasJi = false;
          for (let si = 0; si < same.length; si++) {
            if (same[si].吉凶 === "凶") {
              hasXiong = true;
            }
            if (same[si].吉凶 === "吉") {
              hasJi = true;
            }
          }
          let line = "";
          if (cls === "课体") {
            line = "课体上" + (hasXiong ? "主伏藏反复" : "有动象") + "（" + names.join("、") + "）";
          } else if (cls === "空亡" || cls === "旬空") {
            line = "空亡之象突出（" + names.join("、") + "），事多虚而不实";
          } else if (cls === "官鬼" || cls === "天将") {
            line = "官鬼天将带凶（" + names.join("、") + "），防是非病伤";
          } else if (cls === "贵人") {
            line = "贵人相关（" + names.join("、") + "），宜投贵干谒";
          } else if (cls === "禄马") {
            line = "禄马并见（" + names.join("、") + "），进退有凭";
          } else if (cls === "三传") {
            line = "三传结构（" + names.join("、") + "），定事之始终";
          } else if (cls === "脱耗") {
            line = "脱耗之象（" + names.join("、") + "），防虚耗失脱";
          } else if (cls === "六合") {
            line = "和合之象（" + names.join("、") + "），利合作";
          } else {
            line = names.join("、") + "（" + (hasXiong ? "偏凶" : (hasJi ? "偏吉" : "中平")) + "）";
          }
          groups.push(line);
        }
      }
    }
    const out: CoachResult = { items: items, ji: ji, xiong: xiong, zhong: zhong, summary: summary, groups: groups, advice: adviceSet };
    return out;
  }

  /* 年命适配建议：年命地支 → 年命上神 + 六亲 + 空亡/旺衰 + 建议 */
  static nianmingAdvice(c: Chart, nianZhi: string): NianmingAdvice {
    const shang = c.tp[nianZhi] || nianZhi;
    const w = LiurenCore.WX[shang];
    const dw = LiurenCore.WXG[c.r.dg];
    let lq = "";
    if (w === dw) {
      lq = "兄弟";
    } else if (LiurenCore.KE[dw] === w) {
      lq = "妻财";
    } else if (LiurenCore.KE[w] === dw) {
      lq = "官鬼";
    } else if (LiurenCore.SHENG(dw) === w) {
      lq = "子孙";
    } else {
      lq = "父母";
    }
    const nd: NodeState = c.dx.nodes[shang] || LiurenCore.EMPTY_NODE;
    const kong = nd.kong;
    const ws = nd.wangShuai || "";
    let advice = "";
    if (kong) {
      advice = "年命上神逢空，谋事易落空，宜缓不宜急，待出空再动。";
    } else if (lq === "官鬼") {
      advice = "年命上神为日干之官鬼，防是非官灾，谋事宜谨慎低调。";
    } else if (lq === "妻财") {
      advice = "年命上神为日干之财，谋利有机会，宜主动求财。";
    } else if (lq === "子孙") {
      advice = "年命上神为日干之子孙，有救应化解之力，逢凶可解。";
    } else if (lq === "父母") {
      advice = "年命上神为日干之父母，得文书长辈之助，利求名。";
    } else {
      advice = "年命上神为日干之比肩，得同辈助力，利合作共事。";
    }
    if (ws === "旺" || ws === "相") {
      advice += " 年命上神旺相，助力坚实。";
    } else if (ws === "死" || ws === "囚") {
      advice += " 年命上神衰弱，助力有限。";
    }
    const out: NianmingAdvice = {
      nianZhi: nianZhi,
      shangShen: shang,
      liuqin: lq,
      kong: kong,
      wangShuai: ws,
      advice: advice
    };
    return out;
  }"""
if old_coach in t:
    t = t.replace(old_coach, new_coach)
    print("OK bifaCoach+nianming hm")
else:
    print("MISS bifaCoach hm")

io.open(p, "w", encoding="utf-8").write(t)
print("done")

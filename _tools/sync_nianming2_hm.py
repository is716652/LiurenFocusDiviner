# -*- coding: utf-8 -*-
"""鸿蒙 LiurenCore.ets：同步 nianmingAdvice 升级（互动断）"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\model\LiurenCore.ets"
t = io.open(p, encoding="utf-8").read()

# 1. 接口升级
old_iface = """/* 年命适配建议 */
export interface NianmingAdvice {
  nianZhi: string;
  shangShen: string;
  liuqin: string;
  kong: boolean;
  wangShuai: string;
  advice: string;
}"""
new_iface = """/* 年命适配建议（含与用神互动断） */
export interface NianmingAdvice {
  nianZhi: string;
  shangShen: string;
  liuqin: string;
  kong: boolean;
  wangShuai: string;
  yongShen: string;
  rel: string;
  interact: string;
  advice: string;
}"""
if old_iface in t:
    t = t.replace(old_iface, new_iface)
    print("OK iface")
else:
    print("MISS iface")

# 2. 方法升级
old_fn = """  /* 年命适配建议：年命地支 → 年命上神 + 六亲 + 空亡/旺衰 + 建议 */
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
new_fn = """  /* 年命适配建议（含与用神互动断）：年命地支 → 上神+六亲+空亡/旺衰 + 生克用神 + 建议 */
  static nianmingAdvice(c: Chart, nianZhi: string, yongShenZhi: string): NianmingAdvice {
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
    let rel = "";
    let interact = "";
    if (yongShenZhi !== "") {
      const ysWx = LiurenCore.WX[yongShenZhi];
      if (ysWx !== "" && w !== "") {
        if (LiurenCore.SHENG(w) === ysWx) {
          rel = "我生";
          interact = "年命上神生用神（" + shang + "生" + yongShenZhi + "），命主主动推动此占之事，亲力亲为有助成事。";
        } else if (LiurenCore.SHENG(ysWx) === w) {
          rel = "生我";
          interact = "用神生年命上神（" + yongShenZhi + "生" + shang + "），此事反哺命主，纵有波折终得滋养。";
        } else if (LiurenCore.KE[w] === ysWx) {
          rel = "我克";
          interact = "年命上神克用神（" + shang + "克" + yongShenZhi + "），命主能掌控此事，宜主动出击。";
        } else if (LiurenCore.KE[ysWx] === w) {
          rel = "克我";
          interact = "用神克年命上神（" + yongShenZhi + "克" + shang + "），此事克制命主，宜谨慎回避锋芒。";
        } else {
          rel = "比和";
          interact = "年命上神与用神比和（" + shang + "与" + yongShenZhi + "同气），事与命主相合，进展平稳。";
        }
      }
    }
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
    if (interact !== "") {
      advice += " " + interact;
    }
    const out: NianmingAdvice = {
      nianZhi: nianZhi,
      shangShen: shang,
      liuqin: lq,
      kong: kong,
      wangShuai: ws,
      yongShen: yongShenZhi,
      rel: rel,
      interact: interact,
      advice: advice
    };
    return out;
  }"""
if old_fn in t:
    t = t.replace(old_fn, new_fn)
    print("OK nianming hm")
else:
    print("MISS nianming hm")

io.open(p, "w", encoding="utf-8").write(t)
print("done")

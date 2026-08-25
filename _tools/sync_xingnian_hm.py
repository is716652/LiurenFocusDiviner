# -*- coding: utf-8 -*-
"""鸿蒙 LiurenCore.ets：同步行年（XingNianResult + xingNian）"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\model\LiurenCore.ets"
t = io.open(p, encoding="utf-8").read()

# 1. 接口
old_iface = """/* 毕法格局·定位渲染明细 */
export interface BifaDetail {"""
new_iface = """/* 行年（小运）结果 */
export interface XingNianResult {
  birthYear: number;
  gender: string;
  benMingGan: string;
  benMingZhi: string;
  shun: boolean;
  xingNianZhi: string;
  shangShen: string;
  liuqin: string;
  kong: boolean;
  wangShuai: string;
  advice: string;
}

/* 毕法格局·定位渲染明细 */
export interface BifaDetail {"""
if old_iface in t:
    t = t.replace(old_iface, new_iface)
    print("OK iface")
else:
    print("MISS iface")

# 2. xingNian 方法（nianmingAdvice 后）
old_fn = """    const out: NianmingAdvice = {
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
new_fn = """    const out: NianmingAdvice = {
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
  }

  /* 行年（小运）：出生年 + 今年 + 性别 → 本命支 + 行年支 + 行年上神 + 建议
     本命支公式 (year-4)%12（1984 甲子=子）；顺逆：阳干男顺女逆 / 阴干男逆女顺 */
  static xingNian(c: Chart, birthYear: number, currentYear: number, gender: string): XingNianResult {
    const G = LiurenCore.GAN;
    const Z = LiurenCore.ZHI;
    const gan = G[((birthYear - 4) % 10 + 10) % 10];
    const benMingZhi = Z[((birthYear - 4) % 12 + 12) % 12];
    const yangGan = !!LiurenCore.G_YANG[gan];
    const isMale = gender === "男";
    const shun = yangGan ? isMale : !isMale;
    const sui = currentYear - birthYear + 1;
    const startIdx = Z.indexOf(benMingZhi);
    const step = (shun ? 1 : -1);
    const xingIdx = ((startIdx + step * (sui - 1)) % 12 + 12) % 12;
    const xingNianZhi = Z[xingIdx];
    const shang = c.tp[xingNianZhi] || xingNianZhi;
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
    let advice = "";
    if (nd.kong) {
      advice = "行年上神逢空，今年之事易落空，宜缓不宜急。";
    } else if (lq === "官鬼") {
      advice = "行年上神为日干之官鬼，今年防是非官灾，行事低调。";
    } else if (lq === "妻财") {
      advice = "行年上神为日干之财，今年求财有机会，宜主动。";
    } else if (lq === "子孙") {
      advice = "行年上神为日干之子孙，今年逢凶有解，贵人小辈相助。";
    } else if (lq === "父母") {
      advice = "行年上神为日干之父母，今年得长辈文书之助。";
    } else {
      advice = "行年上神为日干之比肩，今年得同辈助力，利合作。";
    }
    if (nd.wangShuai === "旺" || nd.wangShuai === "相") {
      advice += " 行年上神旺相，今年运势得力。";
    } else if (nd.wangShuai === "死" || nd.wangShuai === "囚") {
      advice += " 行年上神衰弱，今年宜守不宜攻。";
    }
    const out: XingNianResult = {
      birthYear: birthYear,
      gender: gender,
      benMingGan: gan,
      benMingZhi: benMingZhi,
      shun: shun,
      xingNianZhi: xingNianZhi,
      shangShen: shang,
      liuqin: lq,
      kong: nd.kong,
      wangShuai: nd.wangShuai,
      advice: advice
    };
    return out;
  }"""
if old_fn in t:
    t = t.replace(old_fn, new_fn)
    print("OK xingNian hm")
else:
    print("MISS nianming hm end")

io.open(p, "w", encoding="utf-8").write(t)
print("done")

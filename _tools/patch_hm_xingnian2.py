# -*- coding: utf-8 -*-
"""补丁：鸿蒙 LiurenCore.ets 行年升级 —— 接口扩展 + JIANG_WARN + xingNian 细化
第17批：行年与用神互动断 + 行年断流年细化（太岁/乘将）"""
import io, sys

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\model\LiurenCore.ets'

def read(p):
    with io.open(p, 'r', encoding='utf-8') as f:
        return f.read()

def write(p, s):
    with io.open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(s)

def rep(s, old, new, must=True):
    n = s.count(old)
    if n == 0:
        if must:
            raise SystemExit('NOT FOUND:\n' + old[:200])
        return s
    if n > 1:
        raise SystemExit('AMBIGUOUS (' + str(n) + 'x):\n' + old[:200])
    return s.replace(old, new)

def main():
    s = read(P)

    # ① 接口扩展
    old_iface = """/* 行年（小运）结果 */
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
}"""
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
  yongShen: string;
  rel: string;
  interact: string;
  taiSui: string;
  tsRel: string;
  tsNote: string;
  jiang: string;
  jiangJx: string;
  jiangNote: string;
  advice: string;
}"""
    s = rep(s, old_iface, new_iface)

    # ② JIANG_WARN 表（JIANG_JX 后）
    old_jx = """  static readonly JIANG_JX: Record<string, string> = {
    "贵人": "吉", "天后": "吉", "太阴": "吉", "玄武": "凶", "太常": "吉", "白虎": "凶",
    "天空": "凶", "青龙": "吉", "勾陈": "凶", "六合": "吉", "朱雀": "凶", "螣蛇": "凶"
  };"""
    new_jx = old_jx + """
  /* 凶将警示词（乘凶将断语用） */
  static readonly JIANG_WARN: Record<string, string> = {
    "玄武": "盗失暗昧", "白虎": "伤病血光", "天空": "虚诈落空",
    "勾陈": "拖延争斗", "朱雀": "口舌是非", "螣蛇": "虚惊怪异"
  };"""
    s = rep(s, old_jx, new_jx)

    # ③ xingNian 方法整体替换（鸿蒙版：点访问接口字段）
    old_fn = s[s.index('  /* 行年（小运）：'):s.index('  /* 行年（小运）：')] if '  /* 行年（小运）：' in s else None
    # 找到方法起始注释
    start_marker = '  /* 行年（小运）：出生年 + 今年 + 性别'
    if start_marker in s:
        i0 = s.index(start_marker)
        # 方法结束：类末尾的 "  }\n}" —— 定位到文件最后的 "  }\n}"
        tail = s.rindex('\n  }\n}')
        i1 = tail
        s = s[:i0] + NEW_FN + s[i1 + 1:]
    else:
        raise SystemExit('xingNian method start marker not found')

    write(P, s)
    print('PATCH OK')

NEW_FN = """  /* 行年（小运）：出生年 + 今年 + 性别 + 用神 → 本命/行年/上神 + 互动断 + 流年细化
     本命支公式 (year-4)%12（1984 甲子=子）；顺逆：阳干男顺女逆 / 阴干男逆女顺
     细化：行年上神与用神互动（生克）+ 与太岁关系（值/冲/合/生/克）+ 乘将吉凶 */
  static xingNian(c: Chart, birthYear: number, currentYear: number, gender: string, yongShenZhi: string): XingNianResult {
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
    /* ---- ① 行年上神与用神互动（生克） ---- */
    let rel = "";
    let interact = "";
    const ys = yongShenZhi ? yongShenZhi : "";
    if (ys !== "") {
      const ysWx = LiurenCore.WX[ys];
      if (ysWx !== "" && w !== "") {
        if (LiurenCore.SHENG(w) === ysWx) {
          rel = "我生";
          interact = "行年上神生用神（" + shang + "生" + ys + "），今年之运主动推动此事，宜亲力亲为。";
        } else if (LiurenCore.SHENG(ysWx) === w) {
          rel = "生我";
          interact = "用神生行年上神（" + ys + "生" + shang + "），此事反哺今年之运，纵有波折终得滋养。";
        } else if (LiurenCore.KE[w] === ysWx) {
          rel = "我克";
          interact = "行年上神克用神（" + shang + "克" + ys + "），今年能掌控此事，宜主动出击。";
        } else if (LiurenCore.KE[ysWx] === w) {
          rel = "克我";
          interact = "用神克行年上神（" + ys + "克" + shang + "），此事克制今年之运，宜谨慎回避锋芒。";
        } else {
          rel = "比和";
          interact = "行年上神与用神比和（" + shang + "与" + ys + "同气），事与今年之运相合，进展平稳。";
        }
      }
    }
    /* ---- ② 与太岁关系（流年吉凶） ---- */
    const taiSuiZhi = Z[((currentYear - 4) % 12 + 12) % 12];
    const gx: JiChuSection = LiurenCore.rules.duxiang.基础关系 || {};
    const chongMap: Record<string, string> = gx.六冲 || {};
    const heMap: Record<string, string> = gx.六合 || {};
    let tsRel = "";
    let tsNote = "";
    if (shang === taiSuiZhi) {
      tsRel = "值太岁";
      tsNote = "行年上神临太岁，今年岁星当头，动静宜郑重，忌轻举妄动。";
    } else if (chongMap[shang] === taiSuiZhi) {
      tsRel = "冲太岁";
      tsNote = "行年上神冲太岁，今年多变动冲击，出行远行宜慎，防外伤口舌。";
    } else if (heMap[shang] === taiSuiZhi) {
      tsRel = "合太岁";
      tsNote = "行年上神合太岁，今年得岁星眷顾，人缘合作顺遂，利成事。";
    } else if (w !== "") {
      const tw = LiurenCore.WX[taiSuiZhi];
      if (tw !== "") {
        if (LiurenCore.SHENG(w) === tw) {
          tsRel = "生太岁";
          tsNote = "行年上神生太岁，今年运势向岁星进献，付出多而回报在后，宜积蓄。";
        } else if (LiurenCore.SHENG(tw) === w) {
          tsRel = "太岁生";
          tsNote = "太岁生行年上神，今年得岁星生扶，根基稳固，逢凶化吉。";
        } else if (LiurenCore.KE[w] === tw) {
          tsRel = "克太岁";
          tsNote = "行年上神克太岁，今年有犯岁之象，宜低调谦和，防与上位冲突。";
        } else if (LiurenCore.KE[tw] === w) {
          tsRel = "太岁克";
          tsNote = "太岁克行年上神，今年运势受岁星压制，宜守不宜攻，慎防官非。";
        } else {
          tsRel = "比和";
          tsNote = "行年上神与太岁比和，今年运势平稳，无大波折。";
        }
      }
    }
    /* ---- ③ 行年上神乘将（吉凶天将） ---- */
    const jiang = c.jiangMap[LiurenCore.gongOf(c.tp, shang)] || "";
    const jiangJx = jiang ? (LiurenCore.JIANG_JX[jiang] || "") : "";
    let jiangNote = "";
    if (jiang !== "") {
      if (jiangJx === "吉") {
        jiangNote = "行年上神乘吉将" + jiang + "，今年得助力，诸事顺遂。";
      } else if (jiangJx === "凶") {
        jiangNote = "行年上神乘凶将" + jiang + "，今年防" + LiurenCore.JIANG_WARN[jiang] + "，宜谨慎。";
      } else {
        jiangNote = "行年上神乘" + jiang + "，今年平稳中带变数。";
      }
    }
    /* ---- 综合建议 ---- */
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
    if (interact !== "") {
      advice += " " + interact;
    }
    if (tsNote !== "") {
      advice += " " + tsNote;
    }
    if (jiangNote !== "") {
      advice += " " + jiangNote;
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
      yongShen: ys,
      rel: rel,
      interact: interact,
      taiSui: taiSuiZhi,
      tsRel: tsRel,
      tsNote: tsNote,
      jiang: jiang,
      jiangJx: jiangJx,
      jiangNote: jiangNote,
      advice: advice
    };
    return out;
  }
"""

if __name__ == '__main__':
    main()

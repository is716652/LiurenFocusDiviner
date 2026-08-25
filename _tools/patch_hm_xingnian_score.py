# -*- coding: utf-8 -*-
"""补丁：鸿蒙 LiurenCore.ets 行年吉凶量化 —— 接口 + CoreRules + XN_SCORE_DEFAULT + 评分"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\model\LiurenCore.ets'

def read(p):
    with io.open(p, 'r', encoding='utf-8') as f:
        return f.read()

def write(p, s):
    with io.open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(s)

def rep(s, old, new):
    n = s.count(old)
    if n != 1:
        raise SystemExit('EXPECT 1 got %d:\n%s' % (n, old[:150]))
    return s.replace(old, new)

def main():
    s = read(P)

    # ① CoreRules 加 xingnian 可选
    s = rep(s, """export interface CoreRules {
  duxiang: DuxiangRulesRaw;
  shensha: ShenshaRulesRaw;
  bifa: BifaRulesRaw;
}""", """export interface XingNianScoreRule {
  liuQin: Record<string, number>;
  kong: number;
  wangShuai: Record<string, number>;
  taiSui: Record<string, number>;
  jiangJx: Record<string, number>;
  bands: ScoreBand[];
}

export interface ScoreBand {
  min: number;
  label: string;
}

export interface CoreRules {
  duxiang: DuxiangRulesRaw;
  shensha: ShenshaRulesRaw;
  bifa: BifaRulesRaw;
  xingnian?: XingNianScoreRule;
}""")

    # ② XingNianResult 加 score/band
    s = rep(s, """  jiang: string;
  jiangJx: string;
  jiangNote: string;
  advice: string;
}""", """  jiang: string;
  jiangJx: string;
  jiangNote: string;
  score: number;
  band: string;
  advice: string;
}""")

    # ③ JIANG_WARN 后加 XN_SCORE_DEFAULT
    s = rep(s, """  /* 凶将警示词（乘凶将断语用） */
  static readonly JIANG_WARN: Record<string, string> = {
    "玄武": "盗失暗昧", "白虎": "伤病血光", "天空": "虚诈落空",
    "勾陈": "拖延争斗", "朱雀": "口舌是非", "螣蛇": "虚惊怪异"
  };""", """  /* 凶将警示词（乘凶将断语用） */
  static readonly JIANG_WARN: Record<string, string> = {
    "玄武": "盗失暗昧", "白虎": "伤病血光", "天空": "虚诈落空",
    "勾陈": "拖延争斗", "朱雀": "口舌是非", "螣蛇": "虚惊怪异"
  };
  /* 行年吉凶打分默认表（宿主 init 注入 行年打分.json 覆盖） */
  static readonly XN_SCORE_DEFAULT: XingNianScoreRule = {
    liuQin: { "官鬼": -2, "妻财": 2, "子孙": 2, "父母": 1, "兄弟": 0 },
    kong: -2,
    wangShuai: { "旺": 1, "相": 1, "休": 0, "囚": -1, "死": -1 },
    taiSui: { "值太岁": -1, "冲太岁": -2, "合太岁": 2, "生太岁": 0, "太岁生": 1, "克太岁": -1, "太岁克": -2, "比和": 0 },
    jiangJx: { "吉": 2, "凶": -2, "": 0 },
    bands: [
      { min: 4, label: "大吉" },
      { min: 1, label: "吉" },
      { min: -2, label: "平" },
      { min: -5, label: "凶" },
      { min: -99, label: "大凶" }
    ]
  };""")

    # ④ 乘将断语后插入评分逻辑
    s = rep(s, """      } else {
        jiangNote = "行年上神乘" + jiang + "，今年平稳中带变数。";
      }
    }
    /* ---- 综合建议 ---- */""", """      } else {
        jiangNote = "行年上神乘" + jiang + "，今年平稳中带变数。";
      }
    }
    /* ---- ④ 行年吉凶量化：五层分值汇总 → 档位（打分表数据驱动） ---- */
    const rule: XingNianScoreRule = LiurenCore.rules.xingnian || LiurenCore.XN_SCORE_DEFAULT;
    let score = (rule.liuQin[lq] || 0);
    if (nd.kong) {
      score += rule.kong;
    }
    score += (rule.wangShuai[nd.wangShuai] || 0);
    score += (rule.taiSui[tsRel] || 0);
    score += (rule.jiangJx[jiangJx] || 0);
    let band = "";
    for (let i = 0; i < rule.bands.length; i++) {
      if (score >= rule.bands[i].min) {
        band = rule.bands[i].label;
        break;
      }
    }
    if (band === "") {
      band = "平";
    }
    /* ---- 综合建议 ---- */""")

    # ⑤ 返回值加 score/band
    s = rep(s, """      jiang: jiang,
      jiangJx: jiangJx,
      jiangNote: jiangNote,
      advice: advice
    };""", """      jiang: jiang,
      jiangJx: jiangJx,
      jiangNote: jiangNote,
      score: score,
      band: band,
      advice: advice
    };""")

    write(P, s)
    print('HM CORE PATCH OK')

if __name__ == '__main__':
    main()

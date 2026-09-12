/* ============================================================================
 * pan/dx —— 盘态（旺衰 / 气机点 / 关系 / 助日 / 年命 / 行年）
 * ----------------------------------------------------------------------------
 * 不变量：旺衰休囚死规则；只读宿主注入的规则表。
 * 由单体核心按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ==========================================================================*/

class LrDx {
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
  };

  static readonly YUE_LING: Record<string, Record<string, string>> = (() => {
    const m: Record<string, Record<string, string>> = {};
    const wx5: string[] = ["木", "火", "土", "金", "水"];
    LrBase.ZHI.forEach((z: string) => {
      const ling = LrBase.WX[z];
      const st: Record<string, string> = {};
      wx5.forEach((w: string) => {
        if (w === ling) {
          st[w] = "旺";
        } else if (LrBase.SHENG(ling) === w) {
          st[w] = "相";
        } else if (LrBase.SHENG(w) === ling) {
          st[w] = "休";
        } else if (LrBase.KE[w] === ling) {
          st[w] = "囚";
        } else {
          st[w] = "死";
        }
      });
      m[z] = st;
    });
    return m;
  })();

  static readonly QIJI_GONG: Record<string, Record<string, string>> = (() => {
    const gongs: string[] = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"];
    const yangS: Record<string, string> = { "甲": "亥", "丙": "寅", "戊": "寅", "庚": "巳", "壬": "申" };
    const yinS: Record<string, string> = { "乙": "午", "丁": "酉", "己": "酉", "辛": "子", "癸": "卯" };
    const m: Record<string, Record<string, string>> = {};
    const yangG: string[] = ["甲", "丙", "戊", "庚", "壬"];
    const yinG: string[] = ["乙", "丁", "己", "辛", "癸"];
    yangG.forEach((g: string) => {
      const o: Record<string, string> = {};
      const s = LrBase.ZHI.indexOf(yangS[g]);
      gongs.forEach((n: string, i: number) => {
        o[LrBase.ZHI[(s + i) % 12]] = n;
      });
      m[g] = o;
    });
    yinG.forEach((g: string) => {
      const o: Record<string, string> = {};
      const s = LrBase.ZHI.indexOf(yinS[g]);
      gongs.forEach((n: string, i: number) => {
        o[LrBase.ZHI[(s - i + 12) % 12]] = n;
      });
      m[g] = o;
    });
    return m;
  })();


  /* 地支十二宫（按地支五行统一长生，水土同宫；六壬盘面常用）：
     木(寅卯)长生亥 · 火(巳午)长生寅 · 金(申酉)长生巳 · 水土(子丑辰未戌亥)长生申 */
  static readonly ZHI_GONG: Record<string, Record<string, string>> = (() => {
    const gongs: string[] = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"];
    const changSheng: Record<string, string> = { "木": "亥", "火": "寅", "金": "巳", "水": "申", "土": "申" };
    const m: Record<string, Record<string, string>> = {};
    LrBase.ZHI.forEach((z: string) => {
      const wx = LrBase.WX[z];
      const s = LrBase.ZHI.indexOf(changSheng[wx]);
      const o: Record<string, string> = {};
      gongs.forEach((n: string, i: number) => {
        o[LrBase.ZHI[(s + i) % 12]] = n;
      });
      m[z] = o;
    });
    return m;
  })();

  static EMPTY_NODE: NodeState = { wangShuai: "", qiJi: "", kong: false };

  /* ---------------- 基础五行/关系工具 ---------------- */

  /* ---------------- 盘态计算 ---------------- */
  /* 旺衰表（读 rules.duxiang["旺衰休囚死"].旺衰） */
  static wangT(): Record<string, Record<string, string>> {
    const top = LiurenCore.rules.duxiang["旺衰休囚死"];
    if (!top) {
      return {};
    }
    const t = top["旺衰"];
    if (!t) {
      return {};
    }
    return t;
  }

  /* 年支（兼容字符串/对象形态） */
  static yearZhiOf(r: DayRec): string {
    if (typeof r.ygc === "string") {
      return r.ygc.slice(1);
    }
    const obj = r.ygc;
    if (obj) {
      return obj.z;
    }
    return "";
  }


  static computeDuxiang(c: ChartCore): Duxiang {
    const gx = LiurenCore.rules.duxiang["基础关系"] || {};
    const r = c.r;
    const kx = LrShensha.XUN_KONG[r.dg + r.dz] || [];
    const yz = r.mz;
    const dwW = (LrDx.wangT()[r.dg] || {})[yz] || "";
    const qj = LrDx.QIJI_GONG[r.dg] || {};
    const nodes: Record<string, NodeState> = {};
    LrBase.ZHI.forEach((z: string) => {
      nodes[z] = {
        wangShuai: (LrDx.YUE_LING[yz] || {})[LrBase.WX[z]] || "",
        qiJi: qj[z] || "",
        kong: kx.includes(z)
      };
    });
    /* 月将助日 */
    const yjZ = c.yj.zhi;
    const yjGong = LrBase.gongOf(c.tp, yjZ);
    const yjWx = LrBase.WX[yjZ];
    const dgWx = LrBase.WXG[r.dg];
    const yjState: YueJiangStateDx = {
      zhi: yjZ,
      gong: yjGong,
      kong: kx.includes(yjZ),
      wangShuai: nodes[yjZ].wangShuai,
      linGan: (yjGong === LrBase.JI_GONG[r.dg]),
      shengGan: (LrBase.SHENG(yjWx) === dgWx),
      keGan: (LrBase.KE[yjWx] === dgWx),
      faYong: (c.sanchuan.chuans[0].z === yjZ),
      zhu: false
    };
    yjState.zhu = (yjState.linGan || yjState.shengGan || yjState.faYong ||
      yjState.wangShuai === "旺" || yjState.wangShuai === "相") && !(yjState.keGan || yjState.kong);
    /* 贵人助日（贵人布列宫位；防御：布列异常时降级为空状态） */
    const guiGong = LrBase.gongOf(c.jiangMap, "贵人");
    const guiNd: NodeState = LrBase.ZHI.includes(guiGong) ? nodes[guiGong] : LrDx.EMPTY_NODE;
    const guiWx = LrBase.WX[guiGong] || "";
    const gr: GuirenStateDx = {
      zhi: guiGong,
      kong: !!guiNd.kong,
      wangShuai: guiNd.wangShuai || "",
      linGan: (guiGong === LrBase.JI_GONG[r.dg]),
      shengGan: !!(guiWx && LrBase.SHENG(guiWx) === dgWx),
      keGan: !!(guiWx && LrBase.KE[guiWx] === dgWx),
      faYong: (c.sanchuan.chuans[0].z === guiGong),
      zhu: false
    };
    gr.zhu = (gr.linGan || gr.shengGan || gr.faYong ||
      gr.wangShuai === "旺" || gr.wangShuai === "相") &&
      !(gr.keGan || gr.kong || gr.wangShuai === "死" || gr.wangShuai === "囚");
    /* 关系：12支 冲/合/害/刑 */
    const relations: Record<string, Relation> = {};
    LrBase.ZHI.forEach((z: string) => {
      relations[z] = {
        chong: (gx["六冲"] || {})[z] || null,
        he: (gx["六合"] || {})[z] || null,
        hai: (gx["六害"] || {})[z] || null,
        xing: (gx["三刑"] || {})[z] || []
      };
    });
    const dx: Duxiang = {
      xunkong: kx,
      monthZhi: yz,
      dayWangShuai: dwW,
      nodes: nodes,
      relations: relations,
      yuejiang: yjState,
      guiren: gr,
      shensha: LiurenCore.computeShensha(c),
      bifa: []
    };
    /* 本课格局（静态，供参考）：原 checkBifa(Object.assign({},c,{dx})) 的直接等价 */
    dx.bifa = LiurenCore.bifaForChuans(LrDx.withDx(c, dx), c.sanchuan.chuans);
    return dx;
  }

  /* 浅拷贝 ChartCore + dx -> Chart（供需要 c.dx 的格局判定使用） */
  static withDx(c: ChartCore, dx: Duxiang): Chart {
    const copy: Chart = {
      r: c.r,
      yj: c.yj,
      tp: c.tp,
      kegs: c.kegs,
      dun: c.dun,
      dunXun: c.dunXun,
      sanchuan: c.sanchuan,
      jiangMap: c.jiangMap,
      gui: c.gui,
      shun: c.shun,
      night: c.night,
      hourGan: c.hourGan,
      dx: dx
    };
    return copy;
  }


  static nianmingAdvice(c: Chart, nianZhi: string, yongShenZhi: string): NianmingAdvice {
    const shang = c.tp[nianZhi] || nianZhi;
    const w = LrBase.WX[shang];
    const dw = LrBase.WXG[c.r.dg];
    let lq = "";
    if (w === dw) {
      lq = "兄弟";
    } else if (LrBase.KE[dw] === w) {
      lq = "妻财";
    } else if (LrBase.KE[w] === dw) {
      lq = "官鬼";
    } else if (LrBase.SHENG(dw) === w) {
      lq = "子孙";
    } else {
      lq = "父母";
    }
    const nd: NodeState = c.dx.nodes[shang] || LrDx.EMPTY_NODE;
    const kong = nd.kong;
    const ws = nd.wangShuai || "";
    /* 年命上神与用神互动：生克关系 */
    let rel = "";
    let interact = "";
    if (yongShenZhi !== "") {
      const ysWx = LrBase.WX[yongShenZhi];
      if (ysWx !== "" && w !== "") {
        if (LrBase.SHENG(w) === ysWx) {
          rel = "我生";
          interact = "古籍云：年命上神生用神（" + shang + "生" + yongShenZhi + "），主命主推动此事、亲历有成之象。";
        } else if (LrBase.SHENG(ysWx) === w) {
          rel = "生我";
          interact = "用神生年命上神（" + yongShenZhi + "生" + shang + "），此事反哺命主，纵有波折终得滋养。";
        } else if (LrBase.KE[w] === ysWx) {
          rel = "我克";
          interact = "古籍云：年命上神克用神（" + shang + "克" + yongShenZhi + "），主命主能掌控此事之象。";
        } else if (LrBase.KE[ysWx] === w) {
          rel = "克我";
          interact = "古籍云：用神克年命上神（" + yongShenZhi + "克" + shang + "），主此事克命主，宜避其锋之诫仅作文献参考。";
        } else {
          rel = "比和";
          interact = "年命上神与用神比和（" + shang + "与" + yongShenZhi + "同气），事与命主相合，进展平稳。";
        }
      }
    }
    /* 基础建议 */
    let advice = "";
    if (kong) {
      advice = "古籍云：年命上神逢空，主事象易落空，缓急之机可参出空。";
    } else if (lq === "官鬼") {
      advice = "古籍云：年命上神临官鬼，主是非压力之象（传统文化参考，非现实判断）。";
    } else if (lq === "妻财") {
      advice = "古籍云：年命上神临妻财，主财利机缘之象。";
    } else if (lq === "子孙") {
      advice = "古籍云：年命上神临子孙，主救应化解之象。";
    } else if (lq === "父母") {
      advice = "古籍云：年命上神临父母，主文书长辈扶助之象。";
    } else {
      advice = "古籍云：年命上神临比肩，主同辈扶助、合作共事之象。";
    }
    if (ws === "旺" || ws === "相") {
      advice += " 年命上神旺相，古籍谓助力较实。";
    } else if (ws === "死" || ws === "囚") {
      advice += " 年命上神衰弱，古籍谓助力有限。";
    }
    if (interact !== "") {
      advice += " " + interact;
    }
    if (advice !== "") {
      advice = "按六壬法诀：" + advice;
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
  }

  /* ---------------- 行年（小运） ----------------
     birthYear 出生年（如 1990）、currentYear 今年（盘之太岁年）、gender 男/女、yongShenZhi 用神支（可选）
     本命支公式：(year-4)%12（1984 甲子=0 子）
     顺逆：阳干（甲丙戊庚壬）男顺女逆；阴干（乙丁己辛癸）男逆女顺
     流年细化：行年上神与用神互动（生克）+ 与太岁关系（值/冲/合/生/克）+ 乘将吉凶 */

  static xingNian(c: Chart, birthYear: number, currentYear: number, gender: string, yongShenZhi: string): XingNianResult {
    const G = LrBase.GAN;
    const Z = LrBase.ZHI;
    const gan = G[((birthYear - 4) % 10 + 10) % 10];
    const benMingZhi = Z[((birthYear - 4) % 12 + 12) % 12];
    const yangGan = !!LrBase.G_YANG[gan];
    const isMale = gender === "男";
    const shun = yangGan ? isMale : !isMale;   /* 阳男顺/阴女顺；阳女逆/阴男逆 */
    const sui = currentYear - birthYear + 1;    /* 虚岁 */
    const startIdx = Z.indexOf(benMingZhi);
    const step = (shun ? 1 : -1);
    const xingIdx = ((startIdx + step * (sui - 1)) % 12 + 12) % 12;
    const xingNianZhi = Z[xingIdx];
    /* 行年上神 */
    const shang = c.tp[xingNianZhi] || xingNianZhi;
    const w = LrBase.WX[shang];
    const dw = LrBase.WXG[c.r.dg];
    let lq = "";
    if (w === dw) {
      lq = "兄弟";
    } else if (LrBase.KE[dw] === w) {
      lq = "妻财";
    } else if (LrBase.KE[w] === dw) {
      lq = "官鬼";
    } else if (LrBase.SHENG(dw) === w) {
      lq = "子孙";
    } else {
      lq = "父母";
    }
    const nd: NodeState = c.dx.nodes[shang] || LrDx.EMPTY_NODE;
    /* ---- ① 行年上神与用神互动（生克） ---- */
    let rel = "";
    let interact = "";
    const ys = yongShenZhi ? yongShenZhi : "";
    if (ys !== "") {
      const ysWx = LrBase.WX[ys];
      if (ysWx !== "" && w !== "") {
        if (LrBase.SHENG(w) === ysWx) {
          rel = "我生";
          interact = "古籍云：行年上神生用神（" + shang + "生" + ys + "），主今年之运推动此事之象。";
        } else if (LrBase.SHENG(ysWx) === w) {
          rel = "生我";
          interact = "用神生行年上神（" + ys + "生" + shang + "），此事反哺今年之运，纵有波折终得滋养。";
        } else if (LrBase.KE[w] === ysWx) {
          rel = "我克";
          interact = "古籍云：行年上神克用神（" + shang + "克" + ys + "），主今年能掌控此事之象。";
        } else if (LrBase.KE[ysWx] === w) {
          rel = "克我";
          interact = "古籍云：用神克行年上神（" + ys + "克" + shang + "），主此事克今年之运，避锋之诫仅作文献参考。";
        } else {
          rel = "比和";
          interact = "行年上神与用神比和（" + shang + "与" + ys + "同气），事与今年之运相合，进展平稳。";
        }
      }
    }
    /* ---- ② 与太岁关系（流年吉凶） ----
       太岁支 = 今年地支（currentYear 取支）；冲/合查基础关系表，五行生克判吉凶 */
    const taiSuiZhi = Z[((currentYear - 4) % 12 + 12) % 12];
    const gx = (LiurenCore.rules.duxiang["基础关系"] || {}) as JiChuSection;
    const chongMap: Record<string, string> = gx["六冲"] || {};
    const heMap: Record<string, string> = gx["六合"] || {};
    let tsRel = "";
    let tsNote = "";
    if (shang === taiSuiZhi) {
      tsRel = "值太岁";
      tsNote = "古籍云：行年上神临太岁，岁星当头，主动静郑重之象。";
    } else if (chongMap[shang] === taiSuiZhi) {
      tsRel = "冲太岁";
      tsNote = "古籍云：行年上神冲太岁，主变动冲击之象；远行外伤诸说仅作文献参考。";
    } else if (heMap[shang] === taiSuiZhi) {
      tsRel = "合太岁";
      tsNote = "古籍云：行年上神合太岁，主岁星眷顾、人缘合作之象。";
    } else if (w !== "") {
      const tw = LrBase.WX[taiSuiZhi];
      if (tw !== "") {
        if (LrBase.SHENG(w) === tw) {
          tsRel = "生太岁";
          tsNote = "古籍云：行年上神生太岁，主付出在前、回报在后之象。";
        } else if (LrBase.SHENG(tw) === w) {
          tsRel = "太岁生";
          tsNote = "古籍云：太岁生行年上神，主岁星生扶、根基渐固之象。";
        } else if (LrBase.KE[w] === tw) {
          tsRel = "克太岁";
          tsNote = "古籍云：行年上神克太岁，主犯岁之嫌；与上位冲突之说仅作文献参考。";
        } else if (LrBase.KE[tw] === w) {
          tsRel = "太岁克";
          tsNote = "古籍云：太岁克行年上神，主岁星压制、官非慎防之诫（传统文化参考）。";
        } else {
          tsRel = "比和";
          tsNote = "古籍云：行年上神与太岁比和，主运势平稳之象。";
        }
      }
    }
    /* ---- ③ 行年上神乘将（吉凶天将） ---- */
    const jiang = c.jiangMap[LrBase.gongOf(c.tp, shang)] || "";
    const jiangJx = jiang ? (LrJiang.JIANG_JX[jiang] || "") : "";
    let jiangNote = "";
    if (jiang !== "") {
      if (jiangJx === "吉") {
        jiangNote = "古籍云：行年上神乘吉将" + jiang + "，主助力之象。";
      } else if (jiangJx === "凶") {
        jiangNote = "古籍云：行年上神乘凶将" + jiang + "，主" + LrJiang.JIANG_WARN[jiang] + "之诫（文献参考）。";
      } else {
        jiangNote = "古籍云：行年上神乘" + jiang + "，主平稳中带变数之象。";
      }
    }
    /* ---- ④ 行年吉凶量化：五层分值汇总 → 档位（打分表数据驱动） ---- */
    const rule: XingNianScoreRule = LiurenCore.rules.xingnian || LrDx.XN_SCORE_DEFAULT;
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
    /* ---- 综合建议 ---- */
    let advice = "";
    if (nd.kong) {
      advice = "古籍云：行年上神逢空，主事象易落空，缓急可参出空。";
    } else if (lq === "官鬼") {
      advice = "古籍云：行年上神临官鬼，主是非压力之象（传统文化参考，非现实判断）。";
    } else if (lq === "妻财") {
      advice = "古籍云：行年上神临妻财，主财利机缘之象。";
    } else if (lq === "子孙") {
      advice = "古籍云：行年上神临子孙，主救应化解、小辈扶助之象。";
    } else if (lq === "父母") {
      advice = "古籍云：行年上神临父母，主长辈文书扶助之象。";
    } else {
      advice = "古籍云：行年上神临比肩，主同辈助力、合作之象。";
    }
    if (nd.wangShuai === "旺" || nd.wangShuai === "相") {
      advice += " 行年上神旺相，古籍谓运势得力。";
    } else if (nd.wangShuai === "死" || nd.wangShuai === "囚") {
      advice += " 行年上神衰弱，古籍谓宜守之象。";
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
    if (advice !== "") {
      advice = "按六壬法诀：" + advice;
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
      score: score,
      band: band,
      advice: advice
    };
    return out;
  }
  /* ==================== 规则表健康自述（§14 纪律：缺表照旧出盘，但必须查得出来） ====================
     读的就是引擎真正使用的路径（与各 compute* 里的读法一致），不做任何兜底；
     缺表 → loaded=false 且 note 说明；表在但无条目 → loaded=true / entries=0（「本来就该空」）。
     宿主 UI 依此显示「规则数据：已加载 N/N 表 ✓」并展开缺表清单。 */
  static ruleHealth(): RuleHealthItem[] {
    const out: RuleHealthItem[] = [];
    const push = (key: string, label: string, v: Object | null | undefined, note: string): void => {
      let entries = 0;
      let loaded = false;
      if (v != null) {
        if (Array.isArray(v)) { entries = v.length; loaded = true; }
        else {
          const ks = Object.keys(v);
          entries = ks.length;
          loaded = true;
        }
      }
      out.push({ key: key, label: label, loaded: loaded, entries: entries, note: loaded ? "" : note });
    };
    const top = LiurenCore.rules.duxiang || {};
    const wsSec = top["旺衰休囚死"];
    push("duxiang.旺衰休囚死.旺衰", "旺衰休囚死（旺衰表）", wsSec ? wsSec["旺衰"] : null,
      "旺衰休囚死.json 顶层键「旺衰」未加载：旺衰栏不可用（盘仍可照旧排出）");
    push("duxiang.十二宫气机点", "十二宫气机点", top["十二宫气机点"],
      "十二宫气机点.json 未加载：气机点栏不可用");
    push("duxiang.空亡规则", "空亡规则", top["空亡规则"],
      "空亡规则.json 未加载：空亡规则出处不可用");
    push("duxiang.助日规则", "助日规则", top["助日规则"],
      "助日规则.json 未加载：助日说明不可用");
    push("duxiang.基础关系", "基础关系（六冲/六合/六害/三刑）", top["基础关系"],
      "基础关系.json 未加载：盘态关系栏不可用");
    const ss = LiurenCore.rules.shensha || {};
    push("shensha.神煞", "神煞起法", ss["神煞"],
      "神煞起法.json 顶层键「神煞」未加载：神煞栏不可用（不是「本课无神煞」）");
    const bf = LiurenCore.rules.bifa || {};
    push("bifa.一百法", "毕法赋一百法", bf["一百法"],
      "毕法赋一百法.json 顶层键「一百法」未加载：毕法栏不可用（不是「本课未命中」）");
    const xn: XingNianScoreRule | undefined = LiurenCore.rules.xingnian;
    const xnOk = !!xn && xn.kong !== undefined && Array.isArray(xn.bands) && xn.bands.length > 0;
    push("xingnian", "行年打分表", xnOk ? xn : null,
      "行年打分.json 键缺失（kong/bands 等）：行年栏不可用（会抛错，宿主不得静默吞掉）");
    return out;
  }

  /* 只列未加载项（UI 的缺表清单 / 顶部一次性提示 / 日志用） */
  static missingRules(): RuleHealthItem[] {
    return LrDx.ruleHealth().filter((x: RuleHealthItem) => !x.loaded);
  }

  /* ==================== 点宫速查卡（只读接口，§14.4） ====================
     入参：chart、地盘宫（若传天盘支则先反查其地盘宫）、当前用神支（可空）。
     纯读盘 + 查表，不改盘、不写状态；气机点取 QIJI_GONG（日干十二宫），
     与 computeDuxiang 里 nodes[].qiJi 同源，保证速查卡与盘面一致。 */
  static palaceLookup(c: Chart, gongOrZhi: string, yongShenZhi: string): PalaceLookup {
    const G = LrBase.ZHI;
    let gong: string = gongOrZhi;
    if (G.indexOf(gong) < 0) { gong = ""; }
    if (c.tp[gong] === undefined) { gong = LrBase.gongOf(c.tp, gongOrZhi); }
    const tianZhi: string = c.tp[gong] || gong;
    const nd: NodeState = c.dx.nodes[tianZhi] || c.dx.nodes[gong] || LrDx.EMPTY_NODE;
    const wx: string = LrBase.WX[tianZhi] || "";
    const dwx: string = LrBase.WXG[c.r.dg] || "";
    const yangZhi: Record<string, number> = { "子": 1, "寅": 1, "辰": 1, "午": 1, "申": 1, "戌": 1 };
    /* 与日干：六亲 + 生克（同一套五行口径，与 yongshen 的 liuqinOf 一致） */
    let liuQin: string = "";
    if (wx !== "" && dwx !== "") {
      if (wx === dwx) { liuQin = "比肩"; }
      else if (LrBase.KE[dwx] === wx) { liuQin = "妻财"; }
      else if (LrBase.KE[wx] === dwx) { liuQin = "官鬼"; }
      else if (LrBase.SHENG(dwx) === wx) { liuQin = "子孙"; }
      else { liuQin = "父母"; }
    }
    let relGan: string = "";
    if (wx !== "" && dwx !== "") {
      if (wx === dwx) { relGan = "比和"; }
      else if (LrBase.SHENG(wx) === dwx) { relGan = "生干"; }
      else if (LrBase.KE[wx] === dwx) { relGan = "克干"; }
      else if (LrBase.SHENG(dwx) === wx) { relGan = "干生"; }
      else { relGan = "干克"; }
    }
    /* 与用神：同为五行生克（未选用神时显式说明，不留白） */
    let relYs: string = "未选用神";
    if (yongShenZhi !== "" && G.indexOf(yongShenZhi) >= 0) {
      const wy: string = LrBase.WX[yongShenZhi] || "";
      if (wx !== "" && wy !== "") {
        if (wx === wy) { relYs = "比和"; }
        else if (LrBase.SHENG(wx) === wy) { relYs = "生用神"; }
        else if (LrBase.KE[wx] === wy) { relYs = "克用神"; }
        else if (LrBase.SHENG(wy) === wx) { relYs = "用神生"; }
        else { relYs = "用神克"; }
      }
    }
    /* 该支在本课的角色 */
    const chuanZhi: string[] = c.sanchuan.chuans.map((x: Chuan) => x.z);
    const chuIdx: number = chuanZhi.indexOf(tianZhi);
    const inChuan: string = chuIdx >= 0 ? ["初传", "中传", "末传"][chuIdx] : "未入传";
    const ji: string = LrBase.JI_GONG[c.r.dg] || "";
    const yjGong: string = LrBase.gongOf(c.tp, c.yj.zhi);
    const guiGong: string = LrBase.gongOf(c.jiangMap, "贵人");
    const isYs: boolean = yongShenZhi !== "" && yongShenZhi === tianZhi;
    const parts: string[] = [];
    parts.push("地盘" + gong + "宫");
    if (gong === ji) { parts.push("日干寄宫"); }
    if (tianZhi === c.r.dz) { parts.push("临日支"); }
    parts.push(inChuan);
    if (isYs) { parts.push("当前用神"); }
    if (gong === yjGong) { parts.push("月将宫"); }
    if (gong === guiGong) { parts.push("贵人宫"); }
    const role: PalaceRole = {
      asGong: gong,
      inChuan: inChuan,
      isYongShen: isYs,
      isRiGanGong: gong === ji,
      isRiZhi: tianZhi === c.r.dz,
      isYueJiang: gong === yjGong,
      isGuiRen: gong === guiGong,
      text: parts.join(" · ")
    };
    const out: PalaceLookup = {
      gong: gong,
      tianZhi: tianZhi,
      wuXing: wx,
      yinYang: yangZhi[tianZhi] ? "阳" : "阴",
      liuQin: liuQin,
      relToRiGan: relGan,
      relToYongShen: relYs,
      qiJi: (LrDx.QIJI_GONG[c.r.dg] || {})[tianZhi] || "",
      kong: nd.kong,
      shensha: c.dx.shensha.byZhi[tianZhi] || [],
      jiang: c.jiangMap[gong] || "",
      dun: c.dunXun[tianZhi] || "",
      dunRi: c.dun[gong] || "",
      dunShi: LrDungan.dunMap(c.hourGan)[gong] || "",
      role: role
    };
    return out;
  }
}

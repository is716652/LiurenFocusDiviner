/**
 * YongShenCore —— 抓用神/读象 纯逻辑核心（ArkTS 合规）
 * ----------------------------------------------------------------------------
 * 职责（与 Web 端「抓用神模块」同构，供鸿蒙端 UI 组件消费）：
 *  - candidates(chart, aff)：占事 → 类神候选（六亲地支 + 地支取象 + 天将布列反查）
 *  - dongtai(chart, zhi)：以某支为用神 → 动态三传（传来递生）+ 每传天将/六亲
 *  - jieDianWords(chart, zhi, leixiang)：用神节点卡 → 类象词云（天将/地支/天干/纳音）
 *  - selectDuyu(chart, aff, cands, zhi, xiangyi)：管辂象意选句（盘态信号匹配 + 古籍收光句）
 *  - liuqinOf(chart, zhi)：某支相对日干的六亲
 * 数据：由宿主注入（init）—— 占事体系 / 管辂类神取用 / 类象库 / 管辂象意 均为 rawfile JSON
 * ArkTS 合规：零 any / unknown；显式接口；中文键用点访问（arkts-no-props-by-index）
 */
import { LiurenCore } from './LiurenCore';
import type { Chart } from './LiurenCore';

/* 用神候选 */
export interface YongShenCand {
  zhi: string;
  type: string;   /* "六"=六亲地支 "象"=地支取象 "将"=天将布列宫位 */
  jiang: string;  /* 该宫所乘天将（无则空串） */
}

/* 动态三传（传来递生） */
export interface DongtaiItem {
  zhi: string;
  gz: string;     /* 遁干+支 */
  jiang: string;  /* 所乘天将 */
  lq: string;     /* 六亲 */
  pos: string;    /* 初传·用神·事起 / 中传·事中 / 末传·事终 */
}

/* 节点卡词云项 */
export interface JieDianWord {
  k: string;      /* 标签：将·白虎 / 申·物象 / 纳音·… */
  v: string;      /* 值：象义短句 */
}

/* 读象选句结果 */
export interface DuyuPick {
  shouGuang: string;   /* 古籍收光句 */
  items: DuyuItem[];   /* 选中断语 */
}

export interface DuyuItem {
  ge: string;    /* 歌诀 */
  yi: string;    /* 释义（截断） */
  ev: string[];  /* 命中依据（乘XX/用神XX/落空/旺相/带神煞） */
}

/* 选句打分项（内部排序用） */
export interface ScoredItem {
  e: Record<string, Object>;
  s: number;
}

/* 占事配置（从占事体系 JSON 提取） */
export interface AffairCfg {
  name: string;
  liuqin: string[];
  jiang: string[];
  zhi: string[];
  note: string;
  guMenlei: string[];
  scene: string[];
  info: string;
}

/* 天将类象（节点卡词云用） */
const TIANJIANG_LEIXIANG: Record<string, string> = {
  "贵人": "尊贵提携", "腾蛇": "虚惊怪异", "朱雀": "文书口舌", "六合": "和合媒合",
  "勾陈": "争斗官讼", "青龙": "财喜酒食", "天空": "欺诈虚妄", "白虎": "病伤血光",
  "太常": "印绶宴席", "玄武": "盗贼暗昧", "太阴": "阴私妇人", "天后": "妇人恩泽"
};

/* 占事 → 管辂神书组合读象（原文要点；管辂象意库之外的精炼句） */
const GUANLU_DUYU: Record<string, string[]> = {
  "求财": ["青龙乘旺气克日，主因财物官司，或因官司破财", "青龙入空仍作我财，一半可得一半可谐", "财临命上最可取，更喜生和合与比"],
  "求官": ["贵入于空，干贵反凶，当谒莫谒", "太常入空作官不逢，虽有禄马亦莫腾通", "太阳发用作贵人官星克干，日干得时旺相，独掌朝纲"],
  "婚姻": ["六合与日相生所求和合，若克日忌和合", "天后不克日往来相生，宜求婚姻", "青龙见破则婚姻公文案卷不行"],
  "疾病": ["白虎二死作空刑，克日辰年病必死", "白虎见空见凶不凶，宜于出往反得其功", "病符加支发用，主人口妻妾灾"],
  "官司": ["勾陈建干克日主官灾凶事", "朱雀克日主口舌官事", "贵人克日主官灾，与日相生旺凡事吉"],
  "出行": ["申为道路之神，用乘丁马必有所往", "午为马为路，发用为日鬼刑害干支，遭马而伤", "天喜带马入传来，一带行人信息至"],
  "失物": ["玄武乘卯酉横截主盗贼", "空亡作鬼带五盗玄耗，其贼自空中而来", "玄武恶神与日干不相克刑何畏"],
  "学业": ["朱雀乘水火土支干，太岁贵人相生日辰，主有权柄文字至身", "朱入于空旺文不就", "太阳皇书天诏旺，女人封赠"],
  "家宅": ["支为房屋却相生，必定人家屋宇宽", "二死加支宅死人", "午临金上人家退，破耗凶亡并其位"],
  "行人": ["初支末干带马人还，或丁或喜喜至无难", "游子斩关空亡入传，天涯尚远书也无还", "白入道神子午申，丁马必是问行人"],
  "六畜": ["占六畜逢空看地分，栏加不得地必损伤", "栏加得地临生气虽空不妨"],
  "求谋": ["传来递生，末生中中生初初生干，犹外人之推荐我", "六合与日相生所求和合", "日上神合命上神此年喜事眷自生"]
};

/* 占事 → 象意门类（管辂象意库选句范围） */
const AFFAIR_XIANGYI: Record<string, string[]> = {
  "求财": ["求财", "杂占"], "求官": ["杂占总诀"], "婚姻": ["婚姻"], "疾病": ["杂占总诀", "杂占"],
  "官司": ["杂占"], "出行": ["杂占"], "失物": ["杂占二"], "学业": ["杂占总诀"],
  "家宅": ["杂占"], "行人": ["杂占"], "六畜": ["杂占二"], "求谋": ["谋事"]
};

/* 占事关键词（句内命中加分，按占事语义粗配） */
const AFFAIR_KW: Record<string, string[]> = {
  "求财": ["财", "金", "商", "货", "酒"], "求官": ["官", "禄", "功名", "贵", "印"], "婚姻": ["婚", "妻", "夫", "嫁", "姻", "媒"],
  "疾病": ["病", "死", "医", "药", "产"], "官司": ["讼", "官符", "口舌", "争", "狱"], "出行": ["行", "路", "马", "出", "舟", "船"],
  "失物": ["失", "盗", "贼", "藏", "偷"], "学业": ["书", "文", "印", "学", "榜"], "家宅": ["宅", "家", "屋", "门", "户"],
  "行人": ["归", "还", "回", "人", "客"], "六畜": ["畜", "牛", "马", "犬", "猪", "羊"], "求谋": ["谋", "求", "合", "事", "成"]
};

/* 日干五行 → 各六亲地支（与 Web 端 LIUQIN_ZHI 一致） */
const LIUQIN_ZHI: Record<string, Record<string, string[]>> = {
  "木": { "妻财": ["辰", "戌", "丑", "未"], "官鬼": ["申", "酉"], "父母": ["亥", "子"], "比肩": ["寅", "卯"], "子孙": ["巳", "午"] },
  "火": { "妻财": ["申", "酉"], "官鬼": ["亥", "子"], "父母": ["寅", "卯"], "比肩": ["巳", "午"], "子孙": ["辰", "戌", "丑", "未"] },
  "土": { "妻财": ["亥", "子"], "官鬼": ["寅", "卯"], "父母": ["巳", "午"], "比肩": ["辰", "戌", "丑", "未"], "子孙": ["申", "酉"] },
  "金": { "妻财": ["寅", "卯"], "官鬼": ["巳", "午"], "父母": ["辰", "戌", "丑", "未"], "比肩": ["申", "酉"], "子孙": ["亥", "子"] },
  "水": { "妻财": ["巳", "午"], "官鬼": ["辰", "戌", "丑", "未"], "父母": ["申", "酉"], "比肩": ["亥", "子"], "子孙": ["寅", "卯"] }
};

/* 占事体系原始数据（宿主注入） */
export interface ZhanShiRaw {
  "占事大类"?: Record<string, Object>[];
}

export interface XiangyiRaw {
  "杂占总诀"?: Record<string, Object>[];
  "杂占"?: Record<string, Object>[];
  "求财"?: Record<string, Object>[];
  "谋事"?: Record<string, Object>[];
  "胎产"?: Record<string, Object>[];
  "婚姻"?: Record<string, Object>[];
  "杂占二"?: Record<string, Object>[];
}

export class YongShenCore {
  /* 宿主注入的占事体系（12 大类，原始 JSON） */
  static zhanShi: Record<string, Object> = {};

  /* ---------------- 占事体系解析 ---------------- */

  /* 从占事体系 JSON 提取 12 大类配置 */
  static affairs(): AffairCfg[] {
    const list = (YongShenCore.zhanShi["占事大类"] as Record<string, Object>[]) || [];
    const out: AffairCfg[] = [];
    for (let i = 0; i < list.length; i++) {
      const it = list[i] as Record<string, Object>;
      const name = String(it["名称"] || '');
      const ys = (it["用神"] as Record<string, Object>) || {};
      const lq = (ys["六亲"] as string[]) || [];
      const jg = (ys["天将"] as string[]) || [];
      const zz = (ys["地支"] as string[]) || [];
      const cfg: AffairCfg = {
        name: name,
        liuqin: lq,
        jiang: jg,
        zhi: zz,
        note: String(it["断语倾向注"] || ''),
        guMenlei: (it["古门类"] as string[]) || [],
        scene: (it["场景提示词"] as string[]) || [],
        info: String(it["信息提示"] || '')
      };
      out.push(cfg);
    }
    return out;
  }

  /* 按名称取占事配置（未命中返回 null） */
  static affairByName(name: string): AffairCfg | null {
    const all = YongShenCore.affairs();
    for (let i = 0; i < all.length; i++) {
      if (all[i].name === name) {
        return all[i];
      }
    }
    return null;
  }

  /* 管辂神书组合读象（固定精炼句，供「古籍断法选句」区展示） */
  static duyuOf(name: string): string[] {
    const arr = GUANLU_DUYU[name];
    return arr ? arr : [];
  }

  /* ---------------- 类神候选 ---------------- */

  /* 占事 → 候选列表：六亲地支 + 地支取象 + 天将布列宫位（去重） */
  static candidates(c: Chart, aff: AffairCfg): YongShenCand[] {
    const dw = LiurenCore.WXG[c.r.dg];
    const lqTable = LIUQIN_ZHI[dw] || {};
    const cands: YongShenCand[] = [];

    /* 1. 六亲类神地支 */
    for (let i = 0; i < aff.liuqin.length; i++) {
      const lq = aff.liuqin[i];
      const zs = lqTable[lq] || [];
      for (let j = 0; j < zs.length; j++) {
        YongShenCore.pushCand(cands, zs[j], "六", '');
      }
    }
    /* 2. 地支取象（并入候选，标注"象"） */
    for (let i = 0; i < aff.zhi.length; i++) {
      YongShenCore.pushCand(cands, aff.zhi[i], "象", '');
    }
    /* 3. 天将类神：按布列位置反查（jiangMap[地盘宫]=天将 → 天将所在宫位） */
    for (let i = 0; i < aff.jiang.length; i++) {
      const j = aff.jiang[i];
      const gong = LiurenCore.gongOf(c.jiangMap, j);
      if (gong !== j && gong !== null) {
        YongShenCore.pushCand(cands, gong, "将", j);
      }
    }
    /* 补充：候选宫位的乘将标注（天将候选已带；六/象候选查 jiangMap） */
    for (let i = 0; i < cands.length; i++) {
      if (cands[i].jiang === '') {
        const g = c.jiangMap[cands[i].zhi] || '';
        cands[i] = { zhi: cands[i].zhi, type: cands[i].type, jiang: g };
      }
    }
    return cands;
  }

  private static pushCand(list: YongShenCand[], z: string, type: string, jiang: string): void {
    for (let i = 0; i < list.length; i++) {
      if (list[i].zhi === z) {
        return; /* 已存在：去重 */
      }
    }
    const it: YongShenCand = { zhi: z, type: type, jiang: jiang };
    list.push(it);
  }

  /* ---------------- 六亲 / 动态三传 ---------------- */

  /* 某支相对日干的六亲（五行生克） */
  static liuqinOf(c: Chart, z: string): string {
    const dw = LiurenCore.WXG[c.r.dg];
    const w = LiurenCore.WX[z];
    if (w === dw) {
      return "兄弟";
    }
    if (LiurenCore.KE[dw] === w) {
      return "妻财";
    }
    if (LiurenCore.KE[w] === dw) {
      return "官鬼";
    }
    if (LiurenCore.SHENG(dw) === w) {
      return "子孙";
    }
    return "父母";
  }

  /* 动态三传：以 zhi 为初传，传来递生（初→中：天盘覆初；中→末：天盘覆中） */
  static dongtai(c: Chart, zhi: string): DongtaiItem[] {
    const c1 = zhi;
    const c2 = c.tp[c1];
    const c3 = c.tp[c2];
    const dun = LiurenCore.dunMap(c.r.dg);
    const mk = (z: string, pos: string): DongtaiItem => {
      const gz = (dun[z] || '') + z;
      const jiang = c.jiangMap[LiurenCore.gongOf(c.tp, z)] || '';
      const it: DongtaiItem = { zhi: z, gz: gz, jiang: jiang, lq: YongShenCore.liuqinOf(c, z), pos: pos };
      return it;
    };
    const out: DongtaiItem[] = [];
    out.push(mk(c1, "初传 · 用神 · 事起"));
    out.push(mk(c2, "中传 · 事中"));
    out.push(mk(c3, "末传 · 事终"));
    return out;
  }

  /* ---------------- 用神节点卡：类象词云 ---------------- */

  /* 用神节点 → 词云：天将类象 / 地支象义特征+物象 / 天干类象 / 纳音象义 */
  static jieDianWords(c: Chart, z: string, leixiang: Record<string, Object>): JieDianWord[] {
    const words: JieDianWord[] = [];
    const g = c.dun[z] || '';
    const jiang = c.jiangMap[LiurenCore.gongOf(c.tp, z)] || '';
    /* 天将类象 */
    if (jiang !== '' && TIANJIANG_LEIXIANG[jiang]) {
      words.push(YongShenCore.w("将·" + jiang, TIANJIANG_LEIXIANG[jiang]));
    }
    /* 地支类象 */
    const dz = ((leixiang["地支类象"] as Record<string, Object>) || {})["地支"] as Record<string, Object>;
    const dzItem = (dz || {})[z] as Record<string, Object>;
    if (dzItem) {
      const feats = (dzItem["象义特征"] as string[]) || [];
      for (let i = 0; i < feats.length && i < 2; i++) {
        const p = YongShenCore.splitColon(feats[i]);
        words.push(YongShenCore.w(z + "·" + p[0], p[1]));
      }
      const wu = (dzItem["物象"] as string[]) || [];
      if (wu.length > 0) {
        words.push(YongShenCore.w(z + "·物象", YongShenCore.cut(wu.join("；"), 46)));
      }
    }
    /* 天干类象 */
    const tg = ((leixiang["天干类象"] as Record<string, Object>) || {})["天干"] as Record<string, Object>;
    const tgItem = (tg || {})[g] as Record<string, Object>;
    if (tgItem) {
      const detail = (tgItem["详细"] as string[]) || [];
      if (detail.length > 0) {
        words.push(YongShenCore.w(g + "·类象", YongShenCore.cut(detail.join("；"), 46)));
      }
    }
    /* 纳音象义 */
    const ny = ((leixiang["纳音象义"] as Record<string, Object>) || {})["六十甲子"] as Record<string, Object>;
    const nyItem = (ny || {})[g + z] as Record<string, Object>;
    if (nyItem && nyItem["纳音"]) {
      words.push(YongShenCore.w("纳音·" + String(nyItem["纳音"]), String(nyItem["象义"] || '')));
    }
    return words;
  }

  private static w(k: string, v: string): JieDianWord {
    const it: JieDianWord = { k: k, v: v };
    return it;
  }

  /* "标签：值" 拆分（首个：号） */
  private static splitColon(t: string): string[] {
    const i = t.indexOf("：");
    if (i > 0) {
      return [t.substring(0, i), t.substring(i + 1)];
    }
    return [t, ''];
  }

  /* 截断（超长加省略号） */
  private static cut(t: string, n: number): string {
    return t.length > n ? t.substring(0, n) + "…" : t;
  }

  /* ---------------- 管辂象意选句 ---------------- */

  /* 选句：按占事门类取库 → 盘态信号匹配打分 → 取最高两条（古籍收光句 + 命中依据） */
  static selectDuyu(c: Chart, aff: AffairCfg, cands: YongShenCand[], zhi: string,
    xiangyi: Record<string, Object>): DuyuPick {
    const cur = YongShenCore.findCand(cands, zhi);
    /* 池：占事 → 门类 → 象意条目 */
    const cats = aff.guMenlei.length > 0 ? aff.guMenlei : (AFFAIR_XIANGYI[aff.name] || ["杂占"]);
    const pool: Record<string, Object>[] = [];
    for (let i = 0; i < cats.length; i++) {
      const arr = (xiangyi[cats[i]] as Record<string, Object>[]) || [];
      for (let j = 0; j < arr.length; j++) {
        pool.push(arr[j]);
      }
    }
    /* 关键词：用神天将名 + 用神地支 + 占事关键词 */
    const kw: string[] = [];
    if (cur && cur.jiang !== '') {
      kw.push(cur.jiang);
    }
    kw.push(zhi);
    const affKw = AFFAIR_KW[aff.name] || [];
    /* 打分 */
    const scored: ScoredItem[] = [];
    for (let i = 0; i < pool.length; i++) {
      const e = pool[i];
      const t = String(e["歌诀"] || '') + String(e["释义"] || '');
      let s = 0;
      for (let k = 0; k < kw.length; k++) {
        if (kw[k] !== '' && t.indexOf(kw[k]) >= 0) {
          s += 3;
        }
      }
      for (let k = 0; k < affKw.length; k++) {
        if (t.indexOf(affKw[k]) >= 0) {
          s += 1;
        }
      }
      if (e["存疑"]) {
        s -= 2;
      }
      const it: ScoredItem = { e: e, s: s };
      scored.push(it);
    }
    YongShenCore.sortDesc(scored);
    const top = scored.slice(0, 8);
    if (top.length === 0) {
      const empty: DuyuPick = { shouGuang: '', items: [] };
      return empty;
    }
    const half = Math.max(1, Math.floor(top.length / 2));
    const pick0 = top[0].e;
    const pick1 = top[half].e;
    /* 命中依据 */
    const ev0 = YongShenCore.evidenceOf(c, pick0, cur, zhi);
    const ev1 = YongShenCore.evidenceOf(c, pick1, cur, zhi);
    const nd = c.dx.nodes[zhi];
    const jj = cur ? cur.jiang : '';
    const stateT = "用神" + (c.dun[zhi] || '') + zhi + (jj !== '' ? "乘" + jj : '') +
      "，临" + String(nd.qiJi || '?') + "（" + String(nd.wangShuai || '?') + "）" +
      (nd.kong ? "落空" : '');
    const ge0 = String(pick0["歌诀"] || pick0["释义"] || '').substring(0, 30);
    const shouGuang = stateT + "——「" + ge0 + "」";
    const items: DuyuItem[] = [
      YongShenCore.mkItem(pick0, ev0),
      YongShenCore.mkItem(pick1, ev1)
    ];
    const out: DuyuPick = { shouGuang: shouGuang, items: items };
    return out;
  }

  /* 命中依据：断语文本命中了哪些盘态信号 */
  private static evidenceOf(c: Chart, e: Record<string, Object>, cur: YongShenCand | null,
    zhi: string): string[] {
    const t = String(e["歌诀"] || '') + String(e["释义"] || '');
    const ev: string[] = [];
    if (cur && cur.jiang !== '' && t.indexOf(cur.jiang) >= 0) {
      ev.push("乘" + cur.jiang);
    }
    if (t.indexOf(zhi) >= 0) {
      ev.push("用神" + zhi);
    }
    const nd = c.dx.nodes[zhi];
    if (nd) {
      if (nd.kong && (t.indexOf("空") >= 0 || t.indexOf("虚") >= 0)) {
        ev.push("落空");
      }
      const ws = String(nd.wangShuai || '');
      if ((ws === "旺" || ws === "相") && t.indexOf("旺") >= 0) {
        ev.push("旺相");
      }
    }
    const ss = (c.dx.shensha.byZhi[zhi] as string[]) || [];
    for (let i = 0; i < ss.length; i++) {
      const short = ss[i].split("(")[0];
      if (short !== '' && t.indexOf(short) >= 0) {
        ev.push("带" + short);
      }
    }
    return ev;
  }

  private static mkItem(e: Record<string, Object>, ev: string[]): DuyuItem {
    const ge = String(e["歌诀"] || '（原歌诀缺失·物类断语）');
    const yi = YongShenCore.cut(String(e["释义"] || '（无释义）'), 150);
    const it: DuyuItem = { ge: ge, yi: yi, ev: ev };
    return it;
  }

  /* 在候选中查找某支（未命中返回 null） */
  static findCand(cands: YongShenCand[], zhi: string): YongShenCand | null {
    for (let i = 0; i < cands.length; i++) {
      if (cands[i].zhi === zhi) {
        return cands[i];
      }
    }
    return null;
  }

  /* 降序排序（按分数） */
  private static sortDesc(arr: ScoredItem[]): void {
    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = 0; j < arr.length - 1 - i; j++) {
        if (arr[j].s < arr[j + 1].s) {
          const t = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = t;
        }
      }
    }
  }
}

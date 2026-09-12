/* ============================================================================
 * pan/sanchuan —— 九宗门·三传取用（含涉害顺数＋复等）
 * ----------------------------------------------------------------------------
 * 不变量：规范《三传排法》；传本锚点见 _tests/_test_sanchuan_spec.js。
 * 由单体 LiurenCore.ets 按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ArkTS：原生 import/export；跨模块引用经门面 LiurenCore（与 .ts 侧同口径）。
 * 重新生成：node _tools/_ets_pipeline.js（勿手改本文件）
 * ==========================================================================*/

import type {
  Keg, Chuan, SanChuan, SheHaiItem
} from './types';
import { LiurenCore } from '../LiurenCore';
import { LrBase } from './liuren-const';

export class LrSanchuan {
  /* 九宗门零散写死项，抽为具名常量（与 core/liuren-core.js 同名常量对应） */
  static readonly MAOXING_ANCHOR: string = "酉";
  static readonly BA_ZHUAN_STEP: number = 3;
  static readonly JINGLAN_SHE: Record<string, string> = { "丑": "亥", "未": "巳" };
  static readonly ZI_XING: Record<string, number> = { "辰": 1, "午": 1, "酉": 1, "亥": 1 };

  /* 课体辅助静态表（《大六壬指南》三传排法规范） */
  static readonly XING_MAP: Record<string, string> = {
    "子": "卯", "卯": "子", "寅": "巳", "巳": "申", "申": "寅",
    "丑": "戌", "戌": "未", "未": "丑",
    "辰": "辰", "午": "午", "酉": "酉", "亥": "亥"
  };
  static readonly HE_GAN: Record<string, string> = {
    "甲": "己", "己": "甲", "乙": "庚", "庚": "乙",
    "丙": "辛", "辛": "丙", "丁": "壬", "壬": "丁",
    "戊": "癸", "癸": "戊"
  };
  static readonly QIAN_SANHE: Record<string, string> = {
    "子": "丑", "丑": "巳", "寅": "亥", "卯": "戌", "辰": "酉", "巳": "申",
    "午": "未", "未": "午", "申": "巳", "酉": "辰", "戌": "卯", "亥": "寅"
  };
  /* 驿马表（三合驿马）：申子辰马在寅、巳酉丑马在亥、寅午戌马在申、亥卯未马在巳 */
  static readonly MA_ZHI: Record<string, string> = {
    "申": "寅", "子": "寅", "辰": "寅",
    "巳": "亥", "酉": "亥", "丑": "亥",
    "寅": "申", "午": "申", "戌": "申",
    "亥": "巳", "卯": "巳", "未": "巳"
  };

  static validGanZhi(gan: string, zhi: string): boolean {
    if (LrBase.GAN.indexOf(gan) < 0 || LrBase.ZHI.indexOf(zhi) < 0) {
      return false;
    }
    const ganYang = !!LrBase.G_YANG[gan];
    const zhiYang = !!LrBase.YANG_ZHI[zhi];
    return ganYang === zhiYang;
  }

  /* dunChuan = 三传配干用表（旬遁） */
  static resolveSanchuan(dg: string, tp: Record<string, string>, kegs: Keg[], dunChuan: Record<string, string>): SanChuan {
    const Z = LrBase.ZHI;
    const yangGan = !!LrBase.G_YANG[dg];
    const ji = LrBase.JI_GONG[dg];
    const MENG: string[] = ["寅", "申", "巳", "亥"];
    const ZHONG: string[] = ["子", "午", "卯", "酉"];
    const chuanOf = (z: string): string => tp[z] || "";
    const chongZhi = (z: string): string => Z[(Z.indexOf(z) + 6) % 12];
    const newSc = (method: string, keti: string, c1: string, c2: string, c3: string): SanChuan => {
      const arr: string[] = [c1, c2, c3];
      const chuans: Chuan[] = arr.map((z: string): Chuan => ({ z: z, gz: dunChuan[z] + z }));
      return { method: method, keti: keti, chuans: chuans };
    };
    /* 中末＝初传之阴神（天盘覆盖） */
    const chain = (c1: string): SanChuan => newSc("", "", c1, chuanOf(c1), chuanOf(chuanOf(c1)));

    /* ---------- 结构判定 ---------- */
    let fuYin = true;
    let fanYin = true;
    for (let i = 0; i < Z.length; i++) {
      if (tp[Z[i]] !== Z[i]) {
        fuYin = false;
      }
      if (tp[Z[i]] !== Z[(i + 6) % 12]) {
        fanYin = false;
      }
    }

    /* ---------- 贼克候选（课1 下神为日干，ke 直接吃天干） ---------- */
    const down: number[] = [];
    const up: number[] = [];
    kegs.forEach((k: Keg, i: number) => {
      if (LrBase.ke(k.s, k.x)) {
        down.push(i);
      } else if (LrBase.ke(k.x, k.s)) {
        up.push(i);
      }
    });
    /* ---------- 遥克候选（第 2/3/4 课上神） ---------- */
    const haoshi: number[] = [];
    const danshe: number[] = [];
    for (let i = 1; i < kegs.length; i++) {
      if (LrBase.ke(kegs[i].x, dg)) {
        haoshi.push(i);
      }
      if (LrBase.ke(dg, kegs[i].x)) {
        danshe.push(i);
      }
    }
    /* ---------- 四课课数（按上神去重） ---------- */
    const uniqShang: string[] = [];
    kegs.forEach((k: Keg) => {
      if (uniqShang.indexOf(k.x) < 0) {
        uniqShang.push(k.x);
      }
    });
    const nSanKe: number = uniqShang.length;
    const baZhuan: boolean = (ji === kegs[2].s) && nSanKe === 2;   /* 干支同位、四课二课 */

    /* ---------- 取用工具 ---------- */
    const biList = (list: number[]): number[] => list.filter((i: number) => !!LrBase.YANG_ZHI[kegs[i].x] === yangGan);
    const yaoKeFirst = (): string => {
      const bi: number[] = biList(haoshi);
      return kegs[(bi.length > 0 ? bi : haoshi)[0]].x;
    };
    /* 涉害取用（《六壬指南》口径：**先判所临地盘宫孟/仲，再在同档内取深**）：
       一、见机（孟优先）：候中「所临地盘宫」属孟（寅申巳亥）者，只在此档内取用；
       二、察微（无孟则仲）：只取所临地盘宫属仲（子午卯酉）者；
       三、季档（无孟无仲）：档内即全部候——《指南》只言孟/仲而未及季，此处按**证据最弱假设**处理：
           既不擅自「径入缀瑕」（那等于在无证据处新增一步），也不擅自扩大候选；此档占进入涉害取用盘的
           540/4380（其候之临宫全为季，如甲丑日 子将丑时）。据《六壬大全》察微条「无孟取仲季用」；
       四、档内取深：档内候多于一个时，取「自所临地盘宫顺数地盘、止于本家，计地盘支克上神之数」最多者；
       五、仍等则缀瑕：阳日取日上神、阴日取辰上神（《六壬大全》「孟仲季复又相等，则阳日取干上神、
           阴日取支上神」）。
       原文依据（出处与行号见 大六壬文档/排盘/大六壬指南的四课三传的三传排法.md §3 校勘注二）：
       《六壬指南》第 24 行「先以寅申巳亥上乘之神为用……若孟神上无克贼则以子午卯酉上乘之神为用」；
       《六壬指南注解》第 37 行「涉害取法，只以孟仲季为准，不以涉害深浅为义，此《指南》所用之法，切记！」；
       《六壬经纬》第 58 行「先取寅申巳亥位上为初传。无寅申巳亥所乘，次取子午卯酉位上为初传」；
       传本课例 5 处：《六壬断案》143/183（癸卯日寅将辰时→丑/亥/酉）、180（己卯日亥将未时→未/亥/卯）、
       181（甲辰日戌将寅时→戌/午/寅）；《六壬指南注解》占验三十二（己亥日亥将未时→未/亥/卯）；
       《中黄五变经》16 释官讼门（癸卯日丑将卯时→丑/亥/酉）。
       **另一派（「取深优先」）并存登记**：《六壬大全》3640/3642 行本文与算例、《御定六壬直指》、《六壬心镜》、
       《六壬神定经》、《六壬粹言》正文、《六壬金铰剪》例1 等；两派在 17280 盘中 360 盘结论不同，
       其中「正月丁卯日丑时亥将」与「癸卯日丑将卯时」天盘与候选全同而两派相反，故本口径**非唯一正解**，
       只是本规范真源《六壬指南》一系的口径；细节与影响面见规范文档 §3 校勘注二。
       —— 禁止为迁就任何个别课例在此写死个案；取用只由 (日干阴阳, 四课, 天盘) 决定。 */
    const sheHai = (list: number[]): string => {
      const items: SheHaiItem[] = list.map((i: number): SheHaiItem => {
        const shang: string = kegs[i].x;
        const gong: string = LrBase.gongOf(tp, shang);   /* 上神所临地盘宫 */
        let cnt: number = 0;
        let cur: number = Z.indexOf(gong);
        for (let n = 0; n < 12; n++) {
          if (LrBase.ke(Z[cur], shang)) {
            cnt++;
          }
          if (Z[cur] === shang) {
            break;
          }
          cur = (cur + 1) % 12;                             /* 顺数地盘，止于本家 */
        }
        return { shang: shang, cnt: cnt, gong: gong };
      });
      /* 一/二/三：孟（见机）→ 仲（察微）→ 季 档 */
      let pool: SheHaiItem[] = items.filter((x: SheHaiItem) => MENG.indexOf(x.gong) >= 0);
      if (pool.length === 0) {
        pool = items.filter((x: SheHaiItem) => ZHONG.indexOf(x.gong) >= 0);
      }
      if (pool.length === 0) {
        pool = items;
      }
      /* 四：档内取深 */
      let max: number = -1;
      pool.forEach((x: SheHaiItem) => {
        if (x.cnt > max) {
          max = x.cnt;
        }
      });
      const top: SheHaiItem[] = pool.filter((x: SheHaiItem) => x.cnt === max);
      if (top.length === 1) {
        return top[0].shang;
      }
      /* 五：仍等 → 缀瑕（阳日取日上神、阴日取辰上神） */
      const fallback: string = yangGan ? kegs[0].x : kegs[2].x;
      const hit: SheHaiItem[] = top.filter((x: SheHaiItem) => x.shang === fallback);
      return hit.length > 0 ? hit[0].shang : top[0].shang;
    };
    /* 贼克/比用/涉害 三法取初传（返吟有克时复用）；取不到返回空串 */
    const zeiKeBiShe = (): string => {
      if (down.length === 1) {
        return kegs[down[0]].x;
      }
      if (down.length === 0 && up.length === 1) {
        return kegs[up[0]].x;
      }
      if (down.length + up.length >= 2) {
        const ks: number[] = down.length > 0 ? down : up;
        const bi: number[] = biList(ks);
        if (bi.length === 1) {
          return kegs[bi[0]].x;
        }
        return sheHai(bi.length > 1 ? bi : ks);
      }
      return "";
    };

    /* ---------- 1. 伏吟 ---------- */
    if (fuYin) {
      const k1: Keg = kegs[0];
      const c1: string = (LrBase.ke(k1.s, k1.x) || LrBase.ke(k1.x, k1.s)) ? k1.x : (yangGan ? k1.x : kegs[2].x);
      let c2: string = "";
      let c3: string = "";
      if (!!LrSanchuan.ZI_XING[c1]) {
        c2 = yangGan ? kegs[2].x : k1.x;
        c3 = LrSanchuan.XING_MAP[c2] || chongZhi(c2);          /* 规范：取中传之刑或冲 */
      } else {
        c2 = LrSanchuan.XING_MAP[c1] || c1;
        c3 = LrSanchuan.XING_MAP[c2] || c2;
      }
      return newSc("伏吟", "伏吟", c1, c2, c3);
    }

    /* ---------- 2. 返吟 ---------- */
    if (fanYin) {
      const zk: string = zeiKeBiShe();
      if (zk !== "" || haoshi.length > 0 || danshe.length > 0) {
        const first: string = zk !== "" ? zk : (haoshi.length > 0 ? yaoKeFirst() : kegs[danshe[0]].x);
        const sc: SanChuan = chain(first);
        sc.method = "返吟";
        sc.keti = "返吟";
        return sc;
      }
      /* 井栏射：初传取日支之驿马；中传取日支上神、末传取日干上神 */
      const she: string = LrSanchuan.JINGLAN_SHE[kegs[2].s] || kegs[2].x;
      return newSc("返吟", "返吟·井栏射", she, kegs[2].x, kegs[0].x);
    }

    /* ---------- 3. 八专（干支同位）：有克已由上面结构之外的贼克/比用/涉害处理，无克则用八专法 ---------- */
    if (baZhuan && down.length + up.length === 0) {
      const base: string = yangGan ? kegs[0].x : kegs[2].x;
      const idx: number = Z.indexOf(base);
      const step: number = LrSanchuan.BA_ZHUAN_STEP;            /* 3 位（含起点）→ 位移 2 */
      const c1: string = yangGan ? Z[(idx + step - 1) % 12] : Z[(idx - step + 1 + 12) % 12];
      return newSc("八专", "八专", c1, kegs[0].x, kegs[0].x);
    }

    /* ---------- 4. 别责（四课仅三课、无贼克无遥克） ---------- */
    if (nSanKe === 3 && down.length + up.length === 0 && haoshi.length === 0 && danshe.length === 0) {
      const c1: string = yangGan
        ? chuanOf(LrBase.JI_GONG[LrSanchuan.HE_GAN[dg]] || "")
        : chuanOf(LrSanchuan.QIAN_SANHE[kegs[2].s] || kegs[2].s);
      return newSc("别责", "别责", c1, kegs[0].x, kegs[0].x);
    }

    /* ---------- 5. 贼克 / 比用 / 涉害 ---------- */
    const c1zk: string = zeiKeBiShe();
    if (c1zk !== "") {
      let method: string = "涉害";
      if (down.length === 1) {
        method = "重审";
      } else if (down.length === 0 && up.length === 1) {
        method = "元首";
      } else {
        const ks: number[] = down.length > 0 ? down : up;
        method = biList(ks).length === 1 ? "比用" : "涉害";
      }
      const sc: SanChuan = chain(c1zk);
      sc.method = method;
      return sc;
    }

    /* ---------- 6. 遥克（蒿矢 / 弹射） ---------- */
    if (haoshi.length > 0) {
      const sc: SanChuan = chain(yaoKeFirst());
      sc.method = "遥克·蒿矢";
      return sc;
    }
    if (danshe.length > 0) {
      const sc: SanChuan = chain(kegs[danshe[0]].x);
      sc.method = "遥克·弹射";
      return sc;
    }

    /* ---------- 7. 昴星（无贼克无遥克、四课全） ---------- */
    const mx: string = yangGan ? tp[LrSanchuan.MAOXING_ANCHOR] : LrBase.gongOf(tp, LrSanchuan.MAOXING_ANCHOR);
    const ganShang: string = tp[ji];
    const zhiShang: string = tp[kegs[2].s];
    return newSc("昴星", yangGan ? "昴星·虎视转蓬" : "昴星·冬蛇掩目",
      mx, yangGan ? zhiShang : ganShang, yangGan ? ganShang : zhiShang);
  }
}

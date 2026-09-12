/* ============================================================================
 * bifa —— 毕法赋一百法命中 / 定位渲染 / 教练层
 * ----------------------------------------------------------------------------
 * 不变量：一百法规则（数据由宿主注入）。
 * 由单体 LiurenCore.ets 按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ArkTS：原生 import/export；跨模块引用经门面 LiurenCore（与 .ts 侧同口径）。
 * 重新生成：node _tools/_ets_pipeline.js（勿手改本文件）
 * ==========================================================================*/

import type {
  Chuan, NodeState, BifaHit, BifaDetail, CoachItem, CoachResult, Duxiang, ChartCore, Chart, JiChuSection, BifaRuleRaw
} from './pan/types';
import { LiurenCore } from './LiurenCore';
import { LrBase } from './pan/liuren-const';
import { LrDx } from './pan/dx';
import { LrSanchuan } from './pan/sanchuan';
import { LrXunkong } from './pan/xunkong';

export class LrBifa {
  /* 毕法赋格局识别（18 可判定格局；chu=三传数组[{z}]，可传本课或动态三传） */
  static bifaForChuans(c: Chart, chu: Chuan[]): BifaHit[] {
    const B = LiurenCore.rules.bifa.一百法 || [];
    const r = c.r;
    const dx = c.dx;
    const kegs = c.kegs;
    const c1 = chu[0].z;
    const c2 = chu[1].z;
    const c3 = chu[2].z;
    const ji = LrBase.JI_GONG[r.dg];
    const RILU: Record<string, string> = {
      "甲": "寅", "乙": "卯", "丙": "巳", "丁": "午", "戊": "巳",
      "己": "午", "庚": "申", "辛": "酉", "壬": "亥", "癸": "子"
    };
    const xun = LrXunkong.XUN_OF[r.dg + r.dz] || "";
    const xunWei = LrBase.ZHI[(LrBase.ZHI.indexOf(xun.slice(1)) + 9) % 12];
    const guiZhi = c.gui;
    const night = c.night;
    const yang = (z: string): boolean => !!LrBase.YANG_ZHI[z];
    const liuqinOf = (z: string): string => {
      const w = LrBase.WX[z];
      const dw = LrBase.WXG[r.dg];
      if (w === dw) {
        return "兄弟";
      }
      if (LrBase.KE[dw] === w) {
        return "妻财";
      }
      if (LrBase.KE[w] === dw) {
        return "官鬼";
      }
      if (LrBase.SHENG(dw) === w) {
        return "子孙";
      }
      return "父母";
    };
    const keZ = (a: string, b: string): boolean => LrBase.KE[LrBase.WX[a]] === LrBase.WX[b];
    const out: BifaHit[] = [];
    const hit = (no: number, note: string): void => {
      const f = B.find((x: BifaRuleRaw) => x.序 === no);
      if (f) {
        out.push({
          "序": no,
          "法名": f.法名 || "",
          "赋文": (f.赋文 || "").replace(/。$/, ""),
          "判": note
        });
      }
    };
    if (c1 === LrBase.ZHI[(LrBase.ZHI.indexOf(ji) + 1) % 12] &&
        c3 === LrBase.ZHI[(LrBase.ZHI.indexOf(ji) - 1 + 12) % 12]) {
      hit(1, "初引末从");
    }
    if (kegs[0].x === xunWei && kegs[2].x === xun.slice(1)) {
      hit(2, "干上旬尾·支上旬首");
    }
    if ((night && guiZhi === LrBase.GUIREN[r.dg][0]) || (!night && guiZhi === LrBase.GUIREN[r.dg][1])) {
      if (LrBase.gongOf(c.jiangMap, "贵人") === ji) {
        hit(3, "帘幕贵人临干");
      }
    }
    const all: string[] = [ji, r.dz, kegs[0].x, kegs[1].x, kegs[2].x, kegs[3].x, c1, c2, c3];
    if (all.every((z: string) => yang(z))) {
      hit(5, "干支课传皆阳");
    }
    if (all.every((z: string) => !yang(z))) {
      hit(6, "干支课传皆阴");
    }
    if (kegs[0].x === RILU[r.dg] && (dx.dayWangShuai === "旺" || dx.dayWangShuai === "相")) {
      hit(7, "干上禄旺");
    }
    if (kegs[2].x === RILU[r.dg]) {
      hit(8, "日禄临支");
    }
    const fwd = c2 === LrBase.ZHI[(LrBase.ZHI.indexOf(c1) + 1) % 12] &&
      c3 === LrBase.ZHI[(LrBase.ZHI.indexOf(c2) + 1) % 12];
    const bwd = c2 === LrBase.ZHI[(LrBase.ZHI.indexOf(c1) - 1 + 12) % 12] &&
      c3 === LrBase.ZHI[(LrBase.ZHI.indexOf(c2) - 1 + 12) % 12];
    const chKong = chu.some((x: Chuan) => dx.xunkong.includes(x.z));
    if (fwd && chKong) {
      hit(17, "顺连茹逢空");
    }
    if (bwd && chKong) {
      hit(18, "逆连茹逢空");
    }
    const lq: string[] = chu.map((x: Chuan) => liuqinOf(x.z));
    if (lq.every((x: string) => x === "妻财") && liuqinOf(kegs[0].x) === "官鬼") {
      hit(27, "三传皆财·干上鬼");
    }
    if (lq.every((x: string) => x === "官鬼") && liuqinOf(kegs[0].x) === "妻财") {
      hit(28, "三传皆鬼·干上财");
    }
    if (keZ(c1, c2) && keZ(c2, c3) && keZ(c1, c3)) {
      hit(32, "三传递相克");
    }
    if (c1 === xunWei) {
      hit(38, "旬尾发用(闭口)");
    }
    const zhiMa: Record<string, string> = {
      "申": "寅", "子": "寅", "辰": "寅", "亥": "巳", "卯": "巳", "未": "巳",
      "寅": "申", "午": "申", "戌": "申", "巳": "亥", "酉": "亥", "丑": "亥"
    };
    if (kegs[0].x === zhiMa[r.dz] && kegs[2].x === RILU[r.dg]) {
      hit(41, "干支互换禄马");
    }
    const zhiMu: Record<string, string> = {
      "申": "辰", "子": "辰", "辰": "辰", "亥": "未", "卯": "未", "未": "未",
      "寅": "戌", "午": "戌", "戌": "戌", "巳": "丑", "酉": "丑", "丑": "丑"
    };
    if (kegs[2].x === zhiMu[r.dz] && c.yj.zhi === zhiMu[r.dz]) {
      hit(60, "支墓临支且为月将");
    }
    const ganMu: Record<string, string> = {
      "甲": "未", "乙": "未", "丙": "戌", "丁": "戌", "戊": "戌",
      "己": "戌", "庚": "丑", "辛": "丑", "壬": "辰", "癸": "辰"
    };
    if (kegs[0].x === ganMu[r.dg] && c.jiangMap[LrBase.gongOf(c.tp, kegs[0].x)] === "白虎") {
      hit(61, "干上墓乘白虎");
    }
    const huZhi = LrBase.gongOf(c.jiangMap, "白虎");
    const huDun = c.dun[huZhi] || "";
    if (huDun && LrBase.KE[LrBase.WXG[huDun]] === LrBase.WXG[r.dg]) {
      hit(69, "白虎乘" + huDun + "遁鬼");
    }
    if (liuqinOf(kegs[2].x) === "官鬼" || liuqinOf(kegs[3].x) === "官鬼") {
      hit(70, "官鬼临三四课");
    }
    /* ---- 课体格（依赖 keti 课体识别层，第六批接入） ---- */
    const keti = c.sanchuan.keti || "";
    /* 第54法 虎视逢虎：昴星课且干支上乘白虎 */
    if (keti.indexOf("昴星") >= 0) {
      const ganShangJiang = c.jiangMap[LrBase.gongOf(c.tp, kegs[0].x)] || "";
      const zhiShangJiang = c.jiangMap[LrBase.gongOf(c.tp, kegs[2].x)] || "";
      if (ganShangJiang === "白虎" || zhiShangJiang === "白虎") {
        hit(54, "虎视逢虎（昴星课干支乘白虎）");
      }
    }
    /* 第89法 任信丁马：伏吟课且逢六丁神或驿马（须言动）
       六丁神 = 旬内遁干为丁之支（旬首支顺数3：甲→乙→丙→丁） */
    if (keti === "伏吟") {
      const zhiMa = LrSanchuan.MA_ZHI[r.dz] || "";
      const xun = LrXunkong.XUN_OF[r.dg + r.dz] || "";
      const dingZhi = xun.length >= 2
        ? LrBase.ZHI[(LrBase.ZHI.indexOf(xun[1]) + 3) % 12] : "";
      const six: string[] = [ji, r.dz, kegs[0].x, kegs[1].x, kegs[2].x, kegs[3].x, c1, c2, c3];
      let hasDing = false;
      for (let i = 0; i < six.length; i++) {
        if (dingZhi !== "" && six[i] === dingZhi) {
          hasDing = true;
          break;
        }
      }
      let hasMa = false;
      for (let i = 0; i < six.length; i++) {
        if (six[i] === zhiMa) {
          hasMa = true;
          break;
        }
      }
      if (hasDing || hasMa) {
        hit(89, "任信丁马（伏吟逢丁/马，须言动）");
      }
    }
    /* 第22法 上下皆合：干支上神互为六合（如乙酉丙申戊申辛卯壬寅五日伏吟类） */
    const gx22: JiChuSection = LiurenCore.rules.duxiang.基础关系 || {};
    const lh = gx22.六合 || {};
    const ganShang = kegs[0].x;
    const zhiShang = kegs[2].x;
    const liuhe = (z: string): string => lh[z] || "";
    const shangHe = (liuhe(ganShang) === zhiShang || liuhe(zhiShang) === ganShang);
    if (shangHe) {
      hit(22, "上下皆合（干支上神互为六合）");
    }
    /* 第82法 不行传者：中末传空亡，其传不行，吉凶但以初传为断 */
    const chuanKong = chu.filter((x: Chuan) => dx.xunkong.includes(x.z)).length;
    if (chuanKong >= 2 && !dx.xunkong.includes(c1)) {
      hit(82, "不行传者（中末空亡，考初传）");
    }
    /* ---- 复合格局（第八批接入，不依赖课体） ---- */
    /* 第4法 催官使者：日鬼乘白虎临日干（干上神为日鬼且乘白虎） */
    const ganShangJ = c.jiangMap[LrBase.gongOf(c.tp, kegs[0].x)] || "";
    if (liuqinOf(kegs[0].x) === "官鬼" && ganShangJ === "白虎") {
      hit(4, "催官使者（日鬼乘白虎临干）");
    }
    /* 第11法 众鬼虽彰：三传皆日鬼 且 干上为子孙（制鬼） */
    const lqAll = chu.map((x: Chuan) => liuqinOf(x.z));
    if (lqAll.every((x: string) => x === "官鬼") && liuqinOf(kegs[0].x) === "子孙") {
      hit(11, "众鬼虽彰全不畏（三传皆鬼·干上子孙制之）");
    }
    /* 第31法 三传递生：初中末递生日干（末生中·中生初·初生日干，或反序） */
    const shengOf = (a: string, b: string): boolean => LrBase.SHENG(LrBase.WX[a]) === LrBase.WX[b];
    const dgWx = LrBase.WXG[r.dg];
    const chuanWx = chu.map((x: Chuan) => LrBase.WX[x.z]);
    const shengGan = (z: string): boolean => LrBase.SHENG(LrBase.WX[z]) === dgWx;
    const diSheng = (shengOf(c3, c2) && shengOf(c2, c1) && shengGan(c1));
    const diSheng2 = (shengOf(c1, c2) && shengOf(c2, c3) && shengGan(c3));
    if (diSheng || diSheng2) {
      hit(31, "三传递生（传来递生·有人举荐）");
    }
    /* 第33法 有始无终：初传为日长生、末传为日墓（先甜后苦） */
    const qj33 = LrDx.QIJI_GONG[r.dg] || {};
    const csZ = LrDx.findZhiOfGong(qj33, "长生");
    const muZ = LrDx.findZhiOfGong(qj33, "墓");
    if (csZ !== "" && muZ !== "" && c1 === csZ && c3 === muZ) {
      hit(33, "有始无终（初长生·末墓，先甜后苦）");
    }
    /* ---- 脱败逃生组（第十批接入） ---- */
    const ganS = kegs[0].x;
    const zhiS = kegs[2].x;
    const ganWx = LrBase.WXG[r.dg];
    const zhiWx = LrBase.WX[r.dz];
    const shengWx = (a: string, b: string): boolean => {
      const wa = LrBase.WX[a] || LrBase.WXG[a] || "";
      const wb = LrBase.WX[b] || LrBase.WXG[b] || "";
      return wa !== "" && wb !== "" && LrBase.SHENG(wa) === wb;
    };
    const tuoGan = (z: string): boolean => shengWx(z, r.dg);
    const tuoZhi = (z: string): boolean => shengWx(z, r.dz);
    const shengGan2 = (z: string): boolean => shengWx(z, r.dg);
    /* 第9法 避难逃生：三传皆无益（每传或空亡/日鬼/脱气），干上逢生可救 */
    const chuWorthless = chu.every((x: Chuan) =>
      dx.xunkong.includes(x.z) || liuqinOf(x.z) === "官鬼" || shengWx(x.z, r.dg));
    if (chuWorthless && shengGan2(ganS) && !dx.xunkong.includes(ganS)) {
      hit(9, "避难逃生（三传无益·干上逢生可救）");
    }
    /* 第35法 人宅受脱：干支上皆乘脱气（干上生日干 且 支上生日支） */
    if (tuoGan(ganS) && tuoZhi(zhiS)) {
      hit(35, "人宅受脱（干支上皆脱气，古籍有防失盗之诫）");
    }
    /* 第36法 干支皆败：干上=日干败地 且 支上=日支败地（沐浴；ZHI_GONG 地支表） */
    const qj36 = LrDx.QIJI_GONG[r.dg] || {};
    const ganBai = LrDx.findZhiOfGong(qj36, "沐浴");
    const zj36 = LrDx.ZHI_GONG[r.dz] || {};
    const zhiBai = LrDx.findZhiOfGong(zj36, "沐浴");
    if (ganBai !== "" && zhiBai !== "" && ganS === ganBai && zhiS === zhiBai) {
      hit(36, "干支皆败（干支上皆逢败地·百事倾颓）");
    }
    /* 第15法 脱上逢脱：日干生干上神，干上神又生其上神（层层脱耗） */
    const ganS2 = c.tp[ganS];
    if (shengWx(r.dg, ganS) && ganS2 !== "" && shengWx(ganS, ganS2)) {
      hit(15, "脱上逢脱（干生上神·上神又生，古籍有防虚诈之诫）");
    }
    return out;
  }

  static renderBifaForChuans(c: ChartCore, dx: Duxiang, chu: Chuan[], aff: string): BifaDetail[] {
    const B = LiurenCore.rules.bifa.一百法 || [];
    const r = c.r;
    const kegs = c.kegs;
    const kong = (z: string): boolean => dx.xunkong.includes(z);
    const jiangOf = (z: string): string => c.jiangMap[LrBase.gongOf(c.tp, z)] || "";
    const wsMap: Record<string, string> = { "旺": "旺相", "相": "旺相", "休": "休囚", "囚": "休囚", "死": "衰死" };
    const zhiMa: Record<string, string> = {
      "申": "寅", "子": "寅", "辰": "寅", "亥": "巳", "卯": "巳", "未": "巳",
      "寅": "申", "午": "申", "戌": "申", "巳": "亥", "酉": "亥", "丑": "亥"
    };
    const dingMa = ((): string => {
      const zkeys = Object.keys(dx.shensha.byZhi);
      for (let i = 0; i < zkeys.length; i++) {
        const z = zkeys[i];
        if (dx.shensha.byZhi[z].includes("旬丁(丁马)")) {
          return z;
        }
      }
      return "";
    })();
    const liuqinOf = (z: string): string => {
      const w = LrBase.WX[z];
      const dw = LrBase.WXG[r.dg];
      if (w === dw) {
        return "兄弟";
      }
      if (LrBase.KE[dw] === w) {
        return "妻财";
      }
      if (LrBase.KE[w] === dw) {
        return "官鬼";
      }
      if (LrBase.SHENG(dw) === w) {
        return "子孙";
      }
      return "父母";
    };
    const out: BifaDetail[] = [];
    const hits = LiurenCore.bifaForChuans(LrDx.withDx(c, dx), chu);
    hits.forEach((hit: BifaHit) => {
      const f = B.find((x: BifaRuleRaw) => x.序 === hit.序);
      if (!f) {
        return;
      }
      const loc: Record<string, string> = (f.判定 && f.判定.定位) || {};
      /* 焦点支：各格局取关键盘位 */
      let fz = "";
      const no = hit.序;
      if (no === 1) {
        fz = chu[0].z;
      } else if (no === 2) {
        fz = kegs[0].x;
      } else if (no === 3) {
        fz = LrBase.gongOf(c.jiangMap, "贵人");
      } else if (no === 5 || no === 6 || no === 32 || no === 38) {
        fz = chu[0].z;
      } else if (no === 7 || no === 27 || no === 28 || no === 41 || no === 61) {
        fz = kegs[0].x;
      } else if (no === 8 || no === 60) {
        fz = kegs[2].x;
      } else if (no === 17 || no === 18) {
        const kongChuan = chu.find((x: Chuan) => kong(x.z));
        fz = kongChuan ? kongChuan.z : "";
      } else if (no === 69) {
        fz = LrBase.gongOf(c.jiangMap, "白虎");
      } else if (no === 70) {
        fz = (liuqinOf(kegs[2].x) === "官鬼") ? kegs[2].x : kegs[3].x;
      }
      const nd: NodeState = dx.nodes[fz] || LrDx.EMPTY_NODE;
      const rep: Record<string, string> = {
        "{支}": fz || "—",
        "{乘将}": fz ? jiangOf(fz) : "—",
        "{月建}": dx.monthZhi,
        "{太岁}": LrDx.yearZhiOf(r),
        "{初传}": chu[0] ? chu[0].z : "",
        "{中传}": chu[1] ? chu[1].z : "",
        "{末传}": chu[2] ? chu[2].z : "",
        "{丁马}": dingMa || "—"
      };
      const fill = (t: string): string => {
        if (!t) {
          return "";
        }
        const jz = fz ? jiangOf(fz) : "";
        const isKong = kong(fz);
        const ws = wsMap[nd.wangShuai] || "";
        const yz2 = LrDx.yearZhiOf(r);
        const segs: string[] = String(t).match(/[^；。]*[；。]/g) || [String(t)];
        const fillOut: string[] = [];
        segs.forEach((seg: string) => {
          const sep = seg.slice(-1);
          const cc = seg.slice(0, -1).trim();
          if (!cc) {
            return;
          }
          let kept = true;
          let rest = cc;
          const m1 = cc.match(/^若乘将为(.+?)，/);
          if (m1) {
            const wants = m1[1].split(/[或、/]/).map((s: string) => s.trim()).filter((s: string) => s.length > 0);
            kept = wants.some((w: string) => jz.includes(w));
            rest = cc.slice(m1[0].length);
          } else {
            const m2 = cc.match(/^若(逢空|未空)，/);
            if (m2) {
              kept = (m2[1] === "逢空") === isKong;
              rest = cc.slice(m2[0].length);
            } else {
              const m3 = cc.match(/^若(旺相|休囚|衰死)(?:或(旺相|休囚|衰死))*，/);
              if (m3) {
                const vals: string[] = [];
                if (m3[1]) {
                  vals.push(m3[1]);
                }
                if (m3[2]) {
                  vals.push(m3[2]);
                }
                kept = vals.includes(ws);
                rest = cc.slice(m3[0].length);
              } else {
                const m4 = cc.match(/^若临(月建|太岁)，/);
                if (m4) {
                  const ref = m4[1] === "月建" ? dx.monthZhi : yz2;
                  kept = fz === ref;
                  rest = cc.slice(m4[0].length);
                } else {
                  const m5 = cc.match(/^若逢丁马，/);
                  if (m5) {
                    kept = !!dingMa && fz === dingMa;
                    rest = cc.slice(m5[0].length);
                  }
                }
              }
            }
          }
          if (kept && rest) {
            fillOut.push(rest.replace(/\{支\}|\{乘将\}|\{月建\}|\{太岁\}|\{初传\}|\{中传\}|\{末传\}|\{丁马\}/g, (mm: string) => rep[mm]) + sep);
          }
        });
        return fillOut.join("");
      };
      const layer: Record<string, string> = {};
      const layerKeys: string[] = ["定性", "定象", "定时", "定策", "定级"];
      layerKeys.forEach((k: string) => {
        layer[k] = fill(loc[k]) || "";
      });
      const apply: string[] = (f.判定 && f.判定.适用占事) || [];
      const relevant = !apply.length || apply.includes(aff);
      out.push({
        "序": no,
        "法名": f.法名 || "",
        "赋文": (f.赋文 || "").replace(/。$/, ""),
        "判": hit.判,
        "焦点": fz,
        layer: layer,
        "相关": relevant,
        "适用": apply
      });
    });
    return out;
  }

  /* 本课毕法渲染（aff 显式传入，替代原全局 curAffair） */
  static renderBifa(c: ChartCore, dx: Duxiang, aff: string): BifaDetail[] {
    return LiurenCore.renderBifaForChuans(c, dx, c.sanchuan.chuans, aff);
  }

  /* ---------------- 毕法教练层（组合断 + 吉凶汇总 + 行动建议） ---------------- */
  static bifaCoach(hits: BifaHit[], coachData: Record<string, Object>): CoachResult {
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
        (xiong > ji ? "，古籍谓凶象偏重。" : (ji > xiong ? "，古籍谓吉象为主。" : "，古籍谓吉凶参半。"));
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
            line = "官鬼天将带凶（" + names.join("、") + "），古籍主是非病伤之诫";
          } else if (cls === "贵人") {
            line = "贵人相关（" + names.join("、") + "），古籍主干谒扶助之象";
          } else if (cls === "禄马") {
            line = "禄马并见（" + names.join("、") + "），进退有凭";
          } else if (cls === "三传") {
            line = "三传结构（" + names.join("、") + "），定事之始终";
          } else if (cls === "脱耗") {
            line = "脱耗之象（" + names.join("、") + "），古籍主虚耗失脱之诫";
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
}

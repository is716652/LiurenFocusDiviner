"use strict";
/* ============================================================================
 * liuren-core.ts —— 大六壬核心引擎（纯计算，无 DOM）
 * ----------------------------------------------------------------------------
 * 从 UI/大六壬万年历起课.html 抽取的纯计算逻辑：
 *   常量 / 排盘引擎(wutun·hourGan·wxOf·ke·dunMap·findYuejiang·buildChart·
 *   resolveSanchuan·gongOf) / 盘态计算(WANG_T·XUN_KONG·YUE_LING·QIJI_GONG·
 *   XUN_OF·computeShensha·bifaForChuans·computeDuxiang·renderBifaForChuans·
 *   renderBifa)
 *
 * ArkTS 兼容子集：
 *   - 零 any / unknown；全部函数参数与返回显式类型
 *   - 全部数据结构 interface；查表用 Record<string,T>
 *   - 不用 for-in 遍历对象（用 Object.keys）
 *   - 不用内联对象字面量类型（全部走 interface）
 *   - class 静态方法内调用其它静态方法一律 LiurenCore.xxx()
 *
 * 编译（浏览器全局脚本，无 import/export，供 <script> 加载）：
 *   本文件无 import/export，故 module commonjs 也产出纯全局脚本（无 wrapper）：
 *   npx tsc core/liuren-core.ts --target ES2017 --module commonjs --strict --noImplicitAny
 *   node --check core/liuren-core.js
 *   （注：TypeScript 5.x 已移除 --module none 与 --outFile；单文件编译产物即 core/liuren-core.js）
 *
 * 宿主注入规则数据（原 window.DUXIANG_RULES / SHENSHA_RULES / BIFA）：
 *   LiurenCore.init({ duxiang: window.DUXIANG_RULES,
 *                     shensha: window.SHENSHA_RULES,
 *                     bifa:    window.BIFA });
 * ==========================================================================*/
/* ============================== 核心类 ============================== */
class LiurenCore {
    static init(rules) {
        LiurenCore.rules = rules;
    }
    /* ---------------- 基础五行/关系工具 ---------------- */
    static SHENG(a) {
        const map = { "木": "火", "火": "土", "土": "金", "金": "水", "水": "木" };
        return map[a];
    }
    /* 反查：tp/jiangMap 值 -> 键（地盘宫） */
    static gongOf(tp, z) {
        const keys = Object.keys(tp);
        for (let i = 0; i < keys.length; i++) {
            if (tp[keys[i]] === z) {
                return keys[i];
            }
        }
        return z;
    }
    /* ---------------- 排盘引擎 ---------------- */
    /* 五子元遁首干：日干 -> 遁首 */
    static wutun(g) {
        const map = {
            "甲": "甲", "己": "甲", "乙": "丙", "庚": "丙",
            "丙": "戊", "辛": "戊", "丁": "庚", "壬": "庚",
            "戊": "壬", "癸": "壬"
        };
        return map[g];
    }
    /* 时干：日干 + 时辰 -> 时干 */
    static hourGan(dg, hz) {
        return LiurenCore.GAN[(LiurenCore.GAN.indexOf(LiurenCore.wutun(dg)) + LiurenCore.ZHI.indexOf(hz)) % 10];
    }
    /* ---------------- 中黄五变经 · 天干两遁 ----------------
       体：日干遁盘（旬遁之外的本体能量） = dunMap(日干)
       用：时干遁盘（中黄盘，断课核心）   = dunMap(时干)，时干=c.hourGan（引擎已算）
       变干：中黄盘中占时支对应的干（断课核心枢纽）
       算法经文课例验证：庚辰日未时/庚子日申时/己未日巳时/戊戌日未时 12 项全通过 */
    static zhonghuangDun(c, hourZhi) {
        const dayGan = c.r.dg;
        const riDun = LiurenCore.dunMap(dayGan); /* 体：日干遁盘 */
        const sg = c.hourGan; /* 时干（引擎已算） */
        const shiDun = LiurenCore.dunMap(sg); /* 用：时干遁盘（中黄盘） */
        const bianGan = shiDun[hourZhi]; /* 变干：中黄盘占时支之干 */
        const out = {
            dayGan: dayGan,
            hourZhi: hourZhi,
            shiGan: sg,
            riDun: riDun,
            shiDun: shiDun,
            bianGan: bianGan
        };
        return out;
    }
    /* ---------------- 中黄五变经 · 完整分析 ----------------
       双视角六亲对比（旬遁 vs 中黄时遁）+ 变干主线 + 建合检测
       输入：盘 + 占时支；输出：ZhonghuangAnalyze（供 UI 展示，可与读象/气机点配合） */
    static zhonghuangAnalyze(c, hourZhi) {
        const z = LiurenCore.zhonghuangDun(c, hourZhi);
        const dayGan = c.r.dg;
        const dwx = LiurenCore.WXG[dayGan];
        const liuqinOf = (gan) => {
            const w = LiurenCore.WXG[gan];
            if (w === dwx) {
                return "比肩";
            }
            else if (LiurenCore.KE[dwx] === w) {
                return "妻财";
            }
            else if (LiurenCore.KE[w] === dwx) {
                return "官鬼";
            }
            else if (LiurenCore.SHENG(dwx) === w) {
                return "子孙";
            }
            return "父母";
        };
        /* ① 双视角对比：每宫 旬遁干六亲 vs 中黄时遁干六亲 */
        const items = [];
        const changed = [];
        LiurenCore.ZHI.forEach((gz) => {
            const xunGan = c.dun[gz]; /* 旬遁干（传统盘） */
            const zhGan = z.shiDun[gz]; /* 中黄时遁干 */
            const xunLq = liuqinOf(xunGan);
            const zhLq = liuqinOf(zhGan);
            const isChanged = xunLq !== zhLq;
            if (isChanged) {
                changed.push(gz);
            }
            const it = {
                gong: gz,
                xunGan: xunGan,
                zhGan: zhGan,
                xunLq: xunLq,
                zhLq: zhLq,
                changed: isChanged
            };
            items.push(it);
        });
        /* ② 变干主线：变干落宫/乘将/三传位置 */
        const bianGong = hourZhi;
        const bianJiang = c.jiangMap[LiurenCore.gongOf(c.tp, z.bianGan)] || "";
        /* 变干是否在三传中 */
        let chuanPos = "";
        for (let i = 0; i < c.sanchuan.chuans.length; i++) {
            const chz = c.sanchuan.chuans[i].z;
            if (z.shiDun[chz] === z.bianGan) {
                chuanPos = ["初传", "中传", "末传"][i];
                break;
            }
        }
        /* ③ 建合检测：日遁干 × 时遁干 天干五合（重点看日上/支上/变干宫/三传） */
        const jianhe = [];
        const checkHe = (gz, label) => {
            const rg = z.riDun[gz];
            const sg2 = z.shiDun[gz];
            if (LiurenCore.HE_GAN[rg] === sg2) {
                jianhe.push({ pos: label, gong: gz, riGan: rg, shiGan: sg2, type: "建合" });
            }
        };
        checkHe(c.kegs[0].x, "日上"); /* 日上神宫位（干上） */
        checkHe(c.kegs[2].x, "支上"); /* 支上神宫位 */
        checkHe(hourZhi, "变干宫"); /* 变干所在宫 */
        for (let i = 0; i < c.sanchuan.chuans.length; i++) {
            checkHe(c.sanchuan.chuans[i].z, ["初传", "中传", "末传"][i]);
        }
        const out = {
            dun: z,
            cmp: items,
            changed: changed,
            bianGong: bianGong,
            bianJiang: bianJiang,
            bianLq: liuqinOf(z.bianGan),
            bianInChuan: chuanPos,
            jianhe: jianhe
        };
        return out;
    }
    /* ---------------- 古籍案例校验 ----------------
       1) validGanZhi：干支阴阳匹配（阳干配阳支，60甲子合法组合）
       2) validYuejiangForMonth：月将与月支匹配（太阳过宫，月支逆行一位为当月月将）
         寅月→亥将、卯月→戌将、辰月→酉将、巳月→申将、午月→未将、未月→午将、
         申月→巳将、酉月→辰将、戌月→卯将、亥月→寅将、子月→丑将、丑月→子将 */
    static validGanZhi(gan, zhi) {
        if (LiurenCore.GAN.indexOf(gan) < 0 || LiurenCore.ZHI.indexOf(zhi) < 0) {
            return false;
        }
        const ganYang = !!LiurenCore.G_YANG[gan];
        const zhiYang = !!LiurenCore.YANG_ZHI[zhi];
        return ganYang === zhiYang;
    }
    static yuejiangForMonth(monthZhi) {
        /* 月将 = 太阳过宫（中气换将）。建月→月将 对应（寅月亥将、卯月戌将…子月丑将） */
        const m = {
            "寅": "亥", "卯": "戌", "辰": "酉", "巳": "申",
            "午": "未", "未": "午", "申": "巳", "酉": "辰",
            "戌": "卯", "亥": "寅", "子": "丑", "丑": "子"
        };
        return m[monthZhi] || "";
    }
    static validYuejiangForMonth(monthZhi, mjZhi) {
        return LiurenCore.yuejiangForMonth(monthZhi) === mjZhi;
    }
    /* ---------------- 古籍案例起盘 ----------------
       古代案例：月将 + 日干支 + 占时（必需）；年干支/月支 可选。
       天地盘/四课/三传/天将 只需必需项即可完整还原；
       年干支可选 → 太岁等年系神煞完整；缺失则降级（ygc 置空）。
       月支可选 → 月建/旺衰更准；缺失则用月将支近似。
       入参：mjZhi=月将支、dg/dz=日干支、hourZhi=占时支、
             yearGan/yearZhi=年干支（可选，空=降级）、monthZhi=月支（可选，空=月将支近似） */
    static buildChartAncient(mjZhi, dg, dz, hourZhi, yearGan = "", yearZhi = "", monthZhi = "") {
        const mj = LiurenCore.ZHI.indexOf(mjZhi);
        if (mj < 0) {
            return null;
        }
        const r = {
            d: dg + dz + "日",
            dg: dg,
            dz: dz,
            mg: "",
            mz: (monthZhi !== "" && LiurenCore.ZHI.indexOf(monthZhi) >= 0) ? monthZhi : mjZhi,
            ygc: (yearGan !== "" && yearZhi !== "") ? (yearGan + yearZhi) : ""
        };
        const yj = { jiang: "", zhi: mjZhi, term: "古籍案例" };
        /* 天盘：月将加占时 */
        const zs = LiurenCore.ZHI.indexOf(hourZhi);
        const tp = {};
        LiurenCore.ZHI.forEach((z, i) => {
            tp[z] = LiurenCore.ZHI[(mj + (i - zs) + 12) % 12];
        });
        /* 四课 */
        const g1 = tp[LiurenCore.JI_GONG[dg]];
        const g2 = tp[g1];
        const g3 = tp[dz];
        const g4 = tp[g3];
        const kegs = [
            { x: g1, s: dg },
            { x: g2, s: g1 },
            { x: g3, s: dz },
            { x: g4, s: g3 }
        ];
        /* 遁干 */
        const dun = LiurenCore.dunMap(dg);
        /* 三传九宗门 */
        const sanchuan = LiurenCore.resolveSanchuan(dg, tp, kegs, dun);
        /* 天将 */
        const night = !(LiurenCore.ZHI.indexOf(hourZhi) >= 3 && LiurenCore.ZHI.indexOf(hourZhi) <= 8);
        const gui = night ? LiurenCore.GUIREN[dg][1] : LiurenCore.GUIREN[dg][0];
        const guiGong = LiurenCore.gongOf(tp, gui);
        const guiIdx = LiurenCore.ZHI.indexOf(guiGong);
        const shun = guiIdx === 11 || guiIdx <= 4;
        const order = shun ? LiurenCore.JIANG_SHUN : LiurenCore.JIANG_NI;
        const jiangMap = {};
        for (let k = 0; k < 12; k++) {
            const g = shun
                ? LiurenCore.ZHI[(LiurenCore.ZHI.indexOf(guiGong) + k) % 12]
                : LiurenCore.ZHI[(LiurenCore.ZHI.indexOf(guiGong) - k + 12) % 12];
            jiangMap[g] = order[k];
        }
        const core = {
            r: r,
            yj: yj,
            tp: tp,
            kegs: kegs,
            dun: dun,
            sanchuan: sanchuan,
            jiangMap: jiangMap,
            gui: gui,
            shun: shun,
            night: night,
            hourGan: LiurenCore.hourGan(dg, hourZhi)
        };
        const dx = LiurenCore.computeDuxiang(core);
        const chart = {
            r: r,
            yj: yj,
            tp: tp,
            kegs: kegs,
            dun: dun,
            sanchuan: sanchuan,
            jiangMap: jiangMap,
            gui: gui,
            shun: shun,
            night: night,
            hourGan: core.hourGan,
            dx: dx
        };
        return chart;
    }
    static wxOf(x) {
        return LiurenCore.WX[x] || LiurenCore.WXG[x];
    }
    /* 相克判断：a 克 b */
    static ke(a, b) {
        return LiurenCore.KE[LiurenCore.wxOf(a)] === LiurenCore.wxOf(b);
    }
    /* 五子元遁：日干 -> {地支:遁干} */
    static dunMap(dg) {
        const zi = LiurenCore.wutun(dg);
        const ziIdx = LiurenCore.GAN.indexOf(zi);
        const m = {};
        LiurenCore.ZHI.forEach((z, i) => {
            m[z] = LiurenCore.GAN[(ziIdx + i) % 10];
        });
        return m;
    }
    /* 精确月将：用时辰中点时刻查 yjAll（全量 1900~2060）；无数据时按中气直查（近似兜底） */
    static findYuejiang(dateStr, hourZhi, yjAll) {
        const mid = {
            "子": "00:00", "丑": "02:00", "寅": "04:00", "卯": "06:00",
            "辰": "08:00", "巳": "10:00", "午": "12:00", "未": "14:00",
            "申": "16:00", "酉": "18:00", "戌": "20:00", "亥": "22:00"
        };
        const ts = dateStr + " " + mid[hourZhi] + ":00";
        if (yjAll) {
            for (let i = 0; i < yjAll.length; i++) {
                const s = yjAll[i];
                if (ts >= s.st && ts < s.en) {
                    return { jiang: s.j, zhi: s.z, term: s.t };
                }
            }
            const last = yjAll[yjAll.length - 1];
            if (ts >= last.st) {
                return { jiang: last.j, zhi: last.z, term: last.t };
            }
            return { jiang: "神后", zhi: "子", term: "大寒" };
        }
        const ZQ = {
            1: ["神后", "子"], 2: ["登明", "亥"], 3: ["河魁", "戌"], 4: ["从魁", "酉"],
            5: ["传送", "申"], 6: ["小吉", "未"], 7: ["胜光", "午"], 8: ["太乙", "巳"],
            9: ["天罡", "辰"], 10: ["太冲", "卯"], 11: ["功曹", "寅"], 12: ["大吉", "丑"]
        };
        const m = parseInt(dateStr.slice(5, 7), 10);
        return { jiang: ZQ[m][0], zhi: ZQ[m][1], term: "" };
    }
    /* 按日期查日历记录（跨年度） */
    static findDayRec(date, calData) {
        const y = date.slice(0, 4);
        const arr = calData[y];
        if (!arr) {
            return null;
        }
        const found = arr.find((r) => r.d === date);
        return found ? found : null;
    }
    /* 主入口：完整排盘（含 dx 盘态） */
    static buildChart(input) {
        const r = LiurenCore.findDayRec(input.date, input.calData);
        if (r === null) {
            return null;
        }
        const yj = LiurenCore.findYuejiang(input.date, input.hourZhi, input.yjAll);
        /* 天盘：月将加占时 */
        const mj = LiurenCore.ZHI.indexOf(yj.zhi);
        const zs = LiurenCore.ZHI.indexOf(input.hourZhi);
        const tp = {};
        LiurenCore.ZHI.forEach((z, i) => {
            tp[z] = LiurenCore.ZHI[(mj + (i - zs) + 12) % 12];
        });
        /* 四课 */
        const g1 = tp[LiurenCore.JI_GONG[r.dg]];
        const g2 = tp[g1];
        const g3 = tp[r.dz];
        const g4 = tp[g3];
        const kegs = [
            { x: g1, s: r.dg },
            { x: g2, s: g1 },
            { x: g3, s: r.dz },
            { x: g4, s: g3 }
        ];
        /* 遁干 */
        const dun = LiurenCore.dunMap(r.dg);
        /* 三传九宗门 */
        const sanchuan = LiurenCore.resolveSanchuan(r.dg, tp, kegs, dun);
        /* 天将：贵加占时（昼=卯-申 index3-8，夜=酉-寅 index9-11,0-2）
           贵人 = 天盘上的一支（如甲日昼贵丑）；月将加时后天盘丑落在哪个地盘宫，
           就从那个宫起布十二天将（贵人加临于占时宫位 = 贵人支随天盘加时后落宫） */
        const night = !(LiurenCore.ZHI.indexOf(input.hourZhi) >= 3 && LiurenCore.ZHI.indexOf(input.hourZhi) <= 8);
        const gui = night ? LiurenCore.GUIREN[r.dg][1] : LiurenCore.GUIREN[r.dg][0];
        const guiGong = LiurenCore.gongOf(tp, gui);
        /* 顺逆只看贵人落宫（天盘贵人支所落的地盘宫）的天门地户分野：
           亥子丑寅卯辰(index 11,0,1,2,3,4) 顺布；巳午未申酉戌(index 5-10) 逆布 */
        const guiIdx = LiurenCore.ZHI.indexOf(guiGong);
        const shun = guiIdx === 11 || guiIdx <= 4;
        const order = shun ? LiurenCore.JIANG_SHUN : LiurenCore.JIANG_NI;
        const jiangMap = {};
        for (let k = 0; k < 12; k++) {
            const g = shun
                ? LiurenCore.ZHI[(LiurenCore.ZHI.indexOf(guiGong) + k) % 12]
                : LiurenCore.ZHI[(LiurenCore.ZHI.indexOf(guiGong) - k + 12) % 12];
            jiangMap[g] = order[k];
        }
        const core = {
            r: r,
            yj: yj,
            tp: tp,
            kegs: kegs,
            dun: dun,
            sanchuan: sanchuan,
            jiangMap: jiangMap,
            gui: gui,
            shun: shun,
            night: night,
            hourGan: LiurenCore.hourGan(r.dg, input.hourZhi)
        };
        const dx = LiurenCore.computeDuxiang(core);
        const chart = {
            r: r,
            yj: yj,
            tp: tp,
            kegs: kegs,
            dun: dun,
            sanchuan: sanchuan,
            jiangMap: jiangMap,
            gui: gui,
            shun: shun,
            night: night,
            hourGan: core.hourGan,
            dx: dx
        };
        return chart;
    }
    /* ---------------- 九宗门·课体识别层（《大六壬指南》三传排法规范） ----------------
       优先级 1→9：贼克(重审/元首) → 比用 → 涉害 → 遥克(蒿矢/弹射) → 昴星 → 别责 → 八专 → 伏吟 → 返吟
       keti：伏吟/返吟/八专/别责/昴星（虎视转蓬/冬蛇掩目）等课体名；普通课为"" */
    static resolveSanchuan(dg, tp, kegs, dun) {
        const Z = LiurenCore.ZHI;
        const yangGan = !!LiurenCore.G_YANG[dg];
        const ji = LiurenCore.JI_GONG[dg];
        /* 伏吟：天盘与地盘完全重合（tp[z]===z 全同） */
        let fuYin = true;
        for (let i = 0; i < Z.length; i++) {
            if (tp[Z[i]] !== Z[i]) {
                fuYin = false;
                break;
            }
        }
        /* 返吟：天盘与地盘互冲（tp[z] 为 z 之冲） */
        let fanYin = true;
        for (let i = 0; i < Z.length; i++) {
            const zz = Z[i];
            const chong = LiurenCore.ZHI[(LiurenCore.ZHI.indexOf(zz) + 6) % 12];
            if (tp[zz] !== chong) {
                fanYin = false;
                break;
            }
        }
        /* 八专：干支同位（日干寄宫 === 日支，如甲寅/丁未），四课仅 2 课；须无贼克 */
        const baZhuan = (ji === kegs[2].s);
        /* 四课去重后课数（别责=3 课、八专=2 课） */
        const uniqKegs = [];
        for (let i = 0; i < kegs.length; i++) {
            let dup = false;
            for (let j = 0; j < uniqKegs.length; j++) {
                if (uniqKegs[j].x === kegs[i].x && uniqKegs[j].s === kegs[i].s) {
                    dup = true;
                    break;
                }
            }
            if (!dup) {
                uniqKegs.push(kegs[i]);
            }
        }
        const nUniq = uniqKegs.length;
        /* 贼克：下贼上 / 上克下 */
        const down = [];
        const up = [];
        kegs.forEach((k, i) => {
            if (LiurenCore.ke(k.s, k.x)) {
                down.push(i);
            }
            else if (LiurenCore.ke(k.x, k.s)) {
                up.push(i);
            }
        });
        /* 遥克（第 2/3/4 课上神 遥克日干 = 蒿矢；日干遥克上神 = 弹射） */
        const haoshi = [];
        const danshe = [];
        kegs.forEach((k, i) => {
            if (i > 0 && LiurenCore.ke(k.x, dg)) {
                haoshi.push(i);
            }
            if (i > 0 && LiurenCore.ke(dg, k.x)) {
                danshe.push(i);
            }
        });
        /* 三传工具：中末传 = 天盘覆盖 */
        const chuanOf = (z) => tp[z] || "";
        const mk = (c1, c2, c3) => {
            const arr = [c1, c2, c3];
            const chuans = arr.map((z) => ({ z: z, gz: dun[z] + z }));
            return { method: "", keti: "", chuans: chuans };
        };
        let method = "";
        let keti = "";
        let c1 = "", c2 = "", c3 = "";
        /* ---------- 8. 伏吟 ---------- */
        if (fuYin) {
            keti = "伏吟";
            /* 初传：第1课有贼克按贼克，无则阳日取日干上神、阴日取日支上神 */
            const k1 = kegs[0];
            let fuyinC1 = "";
            if (LiurenCore.ke(k1.s, k1.x)) {
                fuyinC1 = k1.x;
            }
            else if (LiurenCore.ke(k1.x, k1.s)) {
                fuyinC1 = k1.x;
            }
            else {
                fuyinC1 = yangGan ? k1.x : kegs[2].x;
            }
            /* 自刑：辰午酉亥 */
            const ziXing = fuyinC1 === "辰" || fuyinC1 === "午" || fuyinC1 === "酉" || fuyinC1 === "亥";
            if (ziXing) {
                c1 = fuyinC1;
                c2 = yangGan ? kegs[2].x : k1.x; /* 自刑：阳日取日支上神、阴日取日干上神 */
                c3 = chuanOf(c2) !== "" ? chuanOf(c2) : c2; /* 取中传之刑或冲 */
            }
            else {
                c1 = fuyinC1;
                c2 = LiurenCore.XING_MAP[c1] || c1;
                c3 = LiurenCore.XING_MAP[c2] || c2;
            }
            method = "伏吟";
            const out = mk(c1, c2, c3);
            out.method = method;
            out.keti = keti;
            return out;
        }
        /* ---------- 9. 返吟 ---------- */
        if (fanYin) {
            keti = "返吟";
            if (down.length + up.length > 0 || haoshi.length > 0 || danshe.length > 0) {
                /* 有贼克/遥克：按对应法取初传 */
                const ks = down.length > 0 ? down : (up.length > 0 ? up : (haoshi.length > 0 ? haoshi : danshe));
                c1 = kegs[ks[0]].x;
                c2 = chuanOf(c1);
                c3 = chuanOf(c2);
                method = "返吟";
            }
            else {
                /* 无贼克（井栏射）：丑日取亥、未日取巳 */
                keti = "返吟·井栏射";
                if (kegs[2].s === "丑") {
                    c1 = "亥";
                }
                else if (kegs[2].s === "未") {
                    c1 = "巳";
                }
                else {
                    c1 = kegs[2].x;
                }
                c2 = chuanOf(kegs[2].s);
                c3 = chuanOf(kegs[0].x);
                method = "返吟";
            }
            const out = mk(c1, c2, c3);
            out.method = method;
            out.keti = keti;
            return out;
        }
        /* ---------- 7. 八专 ---------- */
        if (baZhuan && down.length + up.length === 0 && haoshi.length === 0 && danshe.length === 0) {
            keti = "八专";
            /* 阳日：日干上神顺数3；阴日：日支上神逆数3（无贼克才入八专） */
            const base = yangGan ? kegs[0].x : kegs[2].x;
            const idx = Z.indexOf(base);
            c1 = yangGan ? Z[(idx + 3) % 12] : Z[(idx - 3 + 12) % 12];
            c2 = kegs[0].x; /* 中末固定取日干上神 */
            c3 = kegs[0].x;
            method = "八专";
            const out = mk(c1, c2, c3);
            out.method = method;
            out.keti = keti;
            return out;
        }
        /* ---------- 6. 别责 ---------- */
        if (nUniq <= 3 && down.length + up.length === 0 && haoshi.length === 0 && danshe.length === 0) {
            keti = "别责";
            /* 阳日：日干相合处地盘上神；阴日：日支前三合处地盘上神 */
            if (yangGan) {
                const he = LiurenCore.HE_GAN[dg] || "";
                c1 = chuanOf(LiurenCore.JI_GONG[he] || he);
            }
            else {
                const qianSanHe = LiurenCore.QIAN_SANHE[kegs[2].s] || kegs[2].s;
                c1 = chuanOf(qianSanHe);
            }
            c2 = kegs[0].x; /* 中末固定取日干上神 */
            c3 = kegs[0].x;
            method = "别责";
            const out = mk(c1, c2, c3);
            out.method = method;
            out.keti = keti;
            return out;
        }
        /* ---------- 1-5. 贼克 / 比用 / 涉害 / 遥克 / 昴星（普通课） ---------- */
        if (down.length === 1 && up.length === 0) {
            method = "重审";
            c1 = kegs[down[0]].x;
        }
        else if (down.length === 0 && up.length === 1) {
            method = "元首";
            c1 = kegs[up[0]].x;
        }
        else if (down.length + up.length >= 2) {
            const ks = down.length > 0 ? down : up;
            const bi = ks.filter((i) => !!LiurenCore.YANG_ZHI[kegs[i].x] === yangGan);
            if (bi.length === 1) {
                method = "比用";
                c1 = kegs[bi[0]].x;
            }
            else if (bi.length > 1) {
                method = "涉害";
                let best = -1;
                let bestK = null;
                bi.forEach((i) => {
                    const shang = kegs[i].x;
                    const xia = kegs[i].s;
                    let cnt = 0;
                    let cur = Z.indexOf(xia);
                    while (Z[cur] !== shang) {
                        if (LiurenCore.ke(Z[cur], shang)) {
                            cnt++;
                        }
                        cur = (cur + 1) % 12;
                    }
                    if (cnt > best) {
                        best = cnt;
                        bestK = shang;
                    }
                });
                c1 = bestK === null ? "" : bestK;
            }
            else {
                method = "涉害";
                c1 = kegs[ks[0]].x;
            }
        }
        else if (haoshi.length > 0) {
            method = "遥克·蒿矢";
            const pick = haoshi.filter((i) => !!LiurenCore.YANG_ZHI[kegs[i].x] === yangGan);
            c1 = kegs[(pick.length ? pick[0] : haoshi[0])].x;
        }
        else if (danshe.length > 0) {
            method = "遥克·弹射";
            c1 = kegs[danshe[0]].x;
        }
        else {
            /* 昴星 */
            method = "昴星";
            keti = yangGan ? "昴星·虎视转蓬" : "昴星·冬蛇掩目";
            if (yangGan) {
                c1 = tp["酉"];
            }
            else {
                c1 = Z[(Z.indexOf("酉") - 3 + 12) % 12];
            }
        }
        /* 中末传 */
        if (method === "昴星") {
            c2 = yangGan ? tp[kegs[2].s] : tp[ji];
            c3 = yangGan ? tp[ji] : tp[kegs[2].s];
        }
        else {
            c2 = chuanOf(c1);
            c3 = chuanOf(c2);
        }
        const arr = [c1, c2, c3];
        const chuans = arr.map((z) => ({ z: z, gz: dun[z] + z }));
        return { method: method, keti: keti, chuans: chuans };
    }
    /* ---------------- 盘态计算 ---------------- */
    /* 旺衰表（读 rules.duxiang["旺衰休囚死"].旺衰） */
    static wangT() {
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
    static yearZhiOf(r) {
        if (typeof r.ygc === "string") {
            return r.ygc.slice(1);
        }
        const obj = r.ygc;
        if (obj) {
            return obj.z;
        }
        return "";
    }
    /* 神煞起法（35 神煞，查表自 神煞起法.json） */
    static computeShensha(c) {
        const S = LiurenCore.rules.shensha["神煞"] || {};
        const r = c.r;
        const yz = LiurenCore.yearZhiOf(r);
        const mz = r.mz;
        const dg = r.dg;
        const dz = r.dz;
        const xun = LiurenCore.XUN_OF[dg + dz] || "";
        const byZhi = {};
        LiurenCore.ZHI.forEach((z) => {
            byZhi[z] = [];
        });
        const list = [];
        const keys = Object.keys(S);
        for (let ki = 0; ki < keys.length; ki++) {
            const nm = keys[ki];
            const s = S[nm];
            let v = null;
            const b = s["基准"] || "";
            const biao = s["表"] || {};
            if (b === "年支") {
                v = biao[yz];
            }
            else if (b === "月支") {
                /* 月煞表键=月份1..12（寅月=1），季煞表键=月支 */
                const mNo = (LiurenCore.ZHI.indexOf(mz) - LiurenCore.ZHI.indexOf("寅") + 12) % 12 + 1;
                v = (biao[String(mNo)] !== undefined) ? biao[String(mNo)] : biao[mz];
            }
            else if (b === "日干") {
                v = biao[dg];
            }
            else if (b === "日支") {
                v = biao[dz];
            }
            else if (b === "旬") {
                v = biao[xun];
            }
            if (v == null || v === "") {
                continue;
            }
            const zhis = String(v).split("");
            zhis.forEach((z) => {
                if (byZhi[z]) {
                    byZhi[z].push(nm);
                }
            });
            list.push({ name: nm, zhi: zhis.join(""), ji: s["吉凶"] || "", conf: s["置信度"] || "" });
        }
        return { byZhi: byZhi, list: list };
    }
    /* 毕法赋格局识别（18 可判定格局；chu=三传数组[{z}]，可传本课或动态三传） */
    static bifaForChuans(c, chu) {
        const B = LiurenCore.rules.bifa["一百法"] || [];
        const r = c.r;
        const dx = c.dx;
        const kegs = c.kegs;
        const c1 = chu[0].z;
        const c2 = chu[1].z;
        const c3 = chu[2].z;
        const ji = LiurenCore.JI_GONG[r.dg];
        const RILU = {
            "甲": "寅", "乙": "卯", "丙": "巳", "丁": "午", "戊": "巳",
            "己": "午", "庚": "申", "辛": "酉", "壬": "亥", "癸": "子"
        };
        const xun = LiurenCore.XUN_OF[r.dg + r.dz] || "";
        const xunWei = LiurenCore.ZHI[(LiurenCore.ZHI.indexOf(xun.slice(1)) + 9) % 12];
        const guiZhi = c.gui;
        const night = c.night;
        const yang = (z) => !!LiurenCore.YANG_ZHI[z];
        const liuqinOf = (z) => {
            const w = LiurenCore.WX[z];
            const dw = LiurenCore.WXG[r.dg];
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
        };
        const keZ = (a, b) => LiurenCore.KE[LiurenCore.WX[a]] === LiurenCore.WX[b];
        const out = [];
        const hit = (no, note) => {
            const f = B.find((x) => x["序"] === no);
            if (f) {
                out.push({
                    "序": no,
                    "法名": f["法名"] || "",
                    "赋文": (f["赋文"] || "").replace(/。$/, ""),
                    "判": note
                });
            }
        };
        if (c1 === LiurenCore.ZHI[(LiurenCore.ZHI.indexOf(ji) + 1) % 12] &&
            c3 === LiurenCore.ZHI[(LiurenCore.ZHI.indexOf(ji) - 1 + 12) % 12]) {
            hit(1, "初引末从");
        }
        if (kegs[0].x === xunWei && kegs[2].x === xun.slice(1)) {
            hit(2, "干上旬尾·支上旬首");
        }
        if ((night && guiZhi === LiurenCore.GUIREN[r.dg][0]) || (!night && guiZhi === LiurenCore.GUIREN[r.dg][1])) {
            if (LiurenCore.gongOf(c.jiangMap, "贵人") === ji) {
                hit(3, "帘幕贵人临干");
            }
        }
        const all = [ji, r.dz, kegs[0].x, kegs[1].x, kegs[2].x, kegs[3].x, c1, c2, c3];
        if (all.every((z) => yang(z))) {
            hit(5, "干支课传皆阳");
        }
        if (all.every((z) => !yang(z))) {
            hit(6, "干支课传皆阴");
        }
        if (kegs[0].x === RILU[r.dg] && (dx.dayWangShuai === "旺" || dx.dayWangShuai === "相")) {
            hit(7, "干上禄旺");
        }
        if (kegs[2].x === RILU[r.dg]) {
            hit(8, "日禄临支");
        }
        const fwd = c2 === LiurenCore.ZHI[(LiurenCore.ZHI.indexOf(c1) + 1) % 12] &&
            c3 === LiurenCore.ZHI[(LiurenCore.ZHI.indexOf(c2) + 1) % 12];
        const bwd = c2 === LiurenCore.ZHI[(LiurenCore.ZHI.indexOf(c1) - 1 + 12) % 12] &&
            c3 === LiurenCore.ZHI[(LiurenCore.ZHI.indexOf(c2) - 1 + 12) % 12];
        const chKong = chu.some((x) => dx.xunkong.includes(x.z));
        if (fwd && chKong) {
            hit(17, "顺连茹逢空");
        }
        if (bwd && chKong) {
            hit(18, "逆连茹逢空");
        }
        const lq = chu.map((x) => liuqinOf(x.z));
        if (lq.every((x) => x === "妻财") && liuqinOf(kegs[0].x) === "官鬼") {
            hit(27, "三传皆财·干上鬼");
        }
        if (lq.every((x) => x === "官鬼") && liuqinOf(kegs[0].x) === "妻财") {
            hit(28, "三传皆鬼·干上财");
        }
        if (keZ(c1, c2) && keZ(c2, c3) && keZ(c1, c3)) {
            hit(32, "三传递相克");
        }
        if (c1 === xunWei) {
            hit(38, "旬尾发用(闭口)");
        }
        const zhiMa = {
            "申": "寅", "子": "寅", "辰": "寅", "亥": "巳", "卯": "巳", "未": "巳",
            "寅": "申", "午": "申", "戌": "申", "巳": "亥", "酉": "亥", "丑": "亥"
        };
        if (kegs[0].x === zhiMa[r.dz] && kegs[2].x === RILU[r.dg]) {
            hit(41, "干支互换禄马");
        }
        const zhiMu = {
            "申": "辰", "子": "辰", "辰": "辰", "亥": "未", "卯": "未", "未": "未",
            "寅": "戌", "午": "戌", "戌": "戌", "巳": "丑", "酉": "丑", "丑": "丑"
        };
        if (kegs[2].x === zhiMu[r.dz] && c.yj.zhi === zhiMu[r.dz]) {
            hit(60, "支墓临支且为月将");
        }
        const ganMu = {
            "甲": "未", "乙": "未", "丙": "戌", "丁": "戌", "戊": "戌",
            "己": "戌", "庚": "丑", "辛": "丑", "壬": "辰", "癸": "辰"
        };
        if (kegs[0].x === ganMu[r.dg] && c.jiangMap[LiurenCore.gongOf(c.tp, kegs[0].x)] === "白虎") {
            hit(61, "干上墓乘白虎");
        }
        const huZhi = LiurenCore.gongOf(c.jiangMap, "白虎");
        const huDun = c.dun[huZhi] || "";
        if (huDun && LiurenCore.KE[LiurenCore.WXG[huDun]] === LiurenCore.WXG[r.dg]) {
            hit(69, "白虎乘" + huDun + "遁鬼");
        }
        if (liuqinOf(kegs[2].x) === "官鬼" || liuqinOf(kegs[3].x) === "官鬼") {
            hit(70, "官鬼临三四课");
        }
        /* ---- 课体格（依赖 keti 课体识别层，第六批接入） ---- */
        const keti = c.sanchuan.keti || "";
        /* 第54法 虎视逢虎：昴星课且干支上乘白虎 */
        if (keti.indexOf("昴星") >= 0) {
            const ganShangJiang = c.jiangMap[LiurenCore.gongOf(c.tp, kegs[0].x)] || "";
            const zhiShangJiang = c.jiangMap[LiurenCore.gongOf(c.tp, kegs[2].x)] || "";
            if (ganShangJiang === "白虎" || zhiShangJiang === "白虎") {
                hit(54, "虎视逢虎（昴星课干支乘白虎）");
            }
        }
        /* 第89法 任信丁马：伏吟课且逢六丁神或驿马（须言动）
           六丁神 = 旬内遁干为丁之支（旬首支顺数3：甲→乙→丙→丁） */
        if (keti === "伏吟") {
            const zhiMa = LiurenCore.MA_ZHI[r.dz] || "";
            const xun = LiurenCore.XUN_OF[r.dg + r.dz] || "";
            const dingZhi = xun.length >= 2
                ? LiurenCore.ZHI[(LiurenCore.ZHI.indexOf(xun[1]) + 3) % 12] : "";
            const six = [ji, r.dz, kegs[0].x, kegs[1].x, kegs[2].x, kegs[3].x, c1, c2, c3];
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
        const lh = (LiurenCore.rules.duxiang["基础关系"] || {})["六合"] || {};
        const ganShang = kegs[0].x;
        const zhiShang = kegs[2].x;
        const liuhe = (z) => lh[z] || "";
        const shangHe = (liuhe(ganShang) === zhiShang || liuhe(zhiShang) === ganShang);
        if (shangHe) {
            hit(22, "上下皆合（干支上神互为六合）");
        }
        /* 第82法 不行传者：中末传空亡，其传不行，吉凶但以初传为断 */
        const chuanKong = chu.filter((x) => dx.xunkong.includes(x.z)).length;
        if (chuanKong >= 2 && !dx.xunkong.includes(c1)) {
            hit(82, "不行传者（中末空亡，考初传）");
        }
        /* ---- 复合格局（第八批接入，不依赖课体） ---- */
        /* 第4法 催官使者：日鬼乘白虎临日干（干上神为日鬼且乘白虎） */
        const ganShangJ = c.jiangMap[LiurenCore.gongOf(c.tp, kegs[0].x)] || "";
        if (liuqinOf(kegs[0].x) === "官鬼" && ganShangJ === "白虎") {
            hit(4, "催官使者（日鬼乘白虎临干）");
        }
        /* 第11法 众鬼虽彰：三传皆日鬼 且 干上为子孙（制鬼） */
        const lqAll = chu.map((x) => liuqinOf(x.z));
        if (lqAll.every((x) => x === "官鬼") && liuqinOf(kegs[0].x) === "子孙") {
            hit(11, "众鬼虽彰全不畏（三传皆鬼·干上子孙制之）");
        }
        /* 第31法 三传递生：初中末递生日干（末生中·中生初·初生日干，或反序） */
        const shengOf = (a, b) => LiurenCore.SHENG(LiurenCore.WX[a]) === LiurenCore.WX[b];
        const dgWx = LiurenCore.WXG[r.dg];
        const chuanWx = chu.map((x) => LiurenCore.WX[x.z]);
        const shengGan = (z) => LiurenCore.SHENG(LiurenCore.WX[z]) === dgWx;
        const diSheng = (shengOf(c3, c2) && shengOf(c2, c1) && shengGan(c1));
        const diSheng2 = (shengOf(c1, c2) && shengOf(c2, c3) && shengGan(c3));
        if (diSheng || diSheng2) {
            hit(31, "三传递生（传来递生·有人举荐）");
        }
        /* 第33法 有始无终：初传为日长生、末传为日墓（先甜后苦） */
        const qj33 = LiurenCore.QIJI_GONG[r.dg] || {};
        const changShengZ = Object.keys(qj33).find((z) => qj33[z] === "长生") || "";
        const muZ = Object.keys(qj33).find((z) => qj33[z] === "墓") || "";
        if (changShengZ !== "" && muZ !== "" && c1 === changShengZ && c3 === muZ) {
            hit(33, "有始无终（初长生·末墓，先甜后苦）");
        }
        /* ---- 脱败逃生组（第十批接入） ---- */
        const ganS = kegs[0].x;
        const zhiS = kegs[2].x;
        const ganWx = LiurenCore.WXG[r.dg];
        const zhiWx = LiurenCore.WX[r.dz];
        /* 五行生克：a 生 b（a 为地支/天干，b 为天干或地支，自动取对应五行） */
        const shengWx = (a, b) => {
            const wa = LiurenCore.WX[a] || LiurenCore.WXG[a] || "";
            const wb = LiurenCore.WX[b] || LiurenCore.WXG[b] || "";
            return wa !== "" && wb !== "" && LiurenCore.SHENG(wa) === wb;
        };
        const tuoGan = (z) => shengWx(z, r.dg); /* 上神生日干 = 脱 */
        const tuoZhi = (z) => shengWx(z, r.dz); /* 上神生日支 = 脱 */
        const shengGan2 = (z) => shengWx(z, r.dg); /* 生我 */
        /* 第9法 避难逃生：三传皆无益（每传或空亡/日鬼/脱气），干上逢生可救 */
        const chuWorthless = chu.every((x) => dx.xunkong.includes(x.z) || liuqinOf(x.z) === "官鬼" || shengWx(x.z, r.dg));
        if (chuWorthless && shengGan2(ganS) && !dx.xunkong.includes(ganS)) {
            hit(9, "避难逃生（三传无益·干上逢生可救）");
        }
        /* 第35法 人宅受脱：干支上皆乘脱气（干上生日干 且 支上生日支） */
        if (tuoGan(ganS) && tuoZhi(zhiS)) {
            hit(35, "人宅受脱（干支上皆脱气，古籍有防失盗之诫）");
        }
        /* 第36法 干支皆败：干上=日干败地 且 支上=日支败地（沐浴；ZHI_GONG 地支表） */
        const qj36 = LiurenCore.QIJI_GONG[r.dg] || {};
        const ganBai = Object.keys(qj36).find((z) => qj36[z] === "沐浴") || "";
        const zj36 = LiurenCore.ZHI_GONG[r.dz] || {};
        const zhiBai = Object.keys(zj36).find((z) => zj36[z] === "沐浴") || "";
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
    /* 盘态主计算：旬空/旺衰/气机点/冲合刑害/月将·贵人助日 + 本课毕法格局 */
    static computeDuxiang(c) {
        const gx = LiurenCore.rules.duxiang["基础关系"] || {};
        const r = c.r;
        const kx = LiurenCore.XUN_KONG[r.dg + r.dz] || [];
        const yz = r.mz;
        const dwW = (LiurenCore.wangT()[r.dg] || {})[yz] || "";
        const qj = LiurenCore.QIJI_GONG[r.dg] || {};
        const nodes = {};
        LiurenCore.ZHI.forEach((z) => {
            nodes[z] = {
                wangShuai: (LiurenCore.YUE_LING[yz] || {})[LiurenCore.WX[z]] || "",
                qiJi: qj[z] || "",
                kong: kx.includes(z)
            };
        });
        /* 月将助日 */
        const yjZ = c.yj.zhi;
        const yjGong = LiurenCore.gongOf(c.tp, yjZ);
        const yjWx = LiurenCore.WX[yjZ];
        const dgWx = LiurenCore.WXG[r.dg];
        const yjState = {
            zhi: yjZ,
            gong: yjGong,
            kong: kx.includes(yjZ),
            wangShuai: nodes[yjZ].wangShuai,
            linGan: (yjGong === LiurenCore.JI_GONG[r.dg]),
            shengGan: (LiurenCore.SHENG(yjWx) === dgWx),
            keGan: (LiurenCore.KE[yjWx] === dgWx),
            faYong: (c.sanchuan.chuans[0].z === yjZ),
            zhu: false
        };
        yjState.zhu = (yjState.linGan || yjState.shengGan || yjState.faYong ||
            yjState.wangShuai === "旺" || yjState.wangShuai === "相") && !(yjState.keGan || yjState.kong);
        /* 贵人助日（贵人布列宫位；防御：布列异常时降级为空状态） */
        const guiGong = LiurenCore.gongOf(c.jiangMap, "贵人");
        const guiNd = LiurenCore.ZHI.includes(guiGong) ? nodes[guiGong] : LiurenCore.EMPTY_NODE;
        const guiWx = LiurenCore.WX[guiGong] || "";
        const gr = {
            zhi: guiGong,
            kong: !!guiNd.kong,
            wangShuai: guiNd.wangShuai || "",
            linGan: (guiGong === LiurenCore.JI_GONG[r.dg]),
            shengGan: !!(guiWx && LiurenCore.SHENG(guiWx) === dgWx),
            keGan: !!(guiWx && LiurenCore.KE[guiWx] === dgWx),
            faYong: (c.sanchuan.chuans[0].z === guiGong),
            zhu: false
        };
        gr.zhu = (gr.linGan || gr.shengGan || gr.faYong ||
            gr.wangShuai === "旺" || gr.wangShuai === "相") &&
            !(gr.keGan || gr.kong || gr.wangShuai === "死" || gr.wangShuai === "囚");
        /* 关系：12支 冲/合/害/刑 */
        const relations = {};
        LiurenCore.ZHI.forEach((z) => {
            relations[z] = {
                chong: (gx["六冲"] || {})[z] || null,
                he: (gx["六合"] || {})[z] || null,
                hai: (gx["六害"] || {})[z] || null,
                xing: (gx["三刑"] || {})[z] || []
            };
        });
        const dx = {
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
        dx.bifa = LiurenCore.bifaForChuans(LiurenCore.withDx(c, dx), c.sanchuan.chuans);
        return dx;
    }
    /* 浅拷贝 ChartCore + dx -> Chart（供需要 c.dx 的格局判定使用） */
    static withDx(c, dx) {
        const copy = {
            r: c.r,
            yj: c.yj,
            tp: c.tp,
            kegs: c.kegs,
            dun: c.dun,
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
    /* 毕法格局·定位渲染：对每个命中格局确定焦点支，填入 定性/定象/定时/定策/定级；
       chu 可传本课或动态三传；aff 为当前占事（用于适用过滤，原全局 curAffair 抽为参数） */
    static renderBifaForChuans(c, dx, chu, aff) {
        const B = LiurenCore.rules.bifa["一百法"] || [];
        const r = c.r;
        const kegs = c.kegs;
        const kong = (z) => dx.xunkong.includes(z);
        const jiangOf = (z) => c.jiangMap[LiurenCore.gongOf(c.tp, z)] || "";
        const wsMap = { "旺": "旺相", "相": "旺相", "休": "休囚", "囚": "休囚", "死": "衰死" };
        const zhiMa = {
            "申": "寅", "子": "寅", "辰": "寅", "亥": "巳", "卯": "巳", "未": "巳",
            "寅": "申", "午": "申", "戌": "申", "巳": "亥", "酉": "亥", "丑": "亥"
        };
        const dingMa = (() => {
            const zkeys = Object.keys(dx.shensha.byZhi);
            for (let i = 0; i < zkeys.length; i++) {
                const z = zkeys[i];
                if (dx.shensha.byZhi[z].includes("旬丁(丁马)")) {
                    return z;
                }
            }
            return "";
        })();
        const liuqinOf = (z) => {
            const w = LiurenCore.WX[z];
            const dw = LiurenCore.WXG[r.dg];
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
        };
        const out = [];
        const hits = LiurenCore.bifaForChuans(LiurenCore.withDx(c, dx), chu);
        hits.forEach((hit) => {
            const f = B.find((x) => x["序"] === hit["序"]);
            if (!f) {
                return;
            }
            const loc = (f["判定"] && f["判定"]["定位"]) || {};
            /* 焦点支：各格局取关键盘位 */
            let fz = "";
            const no = hit["序"];
            if (no === 1) {
                fz = chu[0].z;
            }
            else if (no === 2) {
                fz = kegs[0].x;
            }
            else if (no === 3) {
                fz = LiurenCore.gongOf(c.jiangMap, "贵人");
            }
            else if (no === 5 || no === 6 || no === 32 || no === 38) {
                fz = chu[0].z;
            }
            else if (no === 7 || no === 27 || no === 28 || no === 41 || no === 61) {
                fz = kegs[0].x;
            }
            else if (no === 8 || no === 60) {
                fz = kegs[2].x;
            }
            else if (no === 17 || no === 18) {
                const kongChuan = chu.find((x) => kong(x.z));
                fz = kongChuan ? kongChuan.z : "";
            }
            else if (no === 69) {
                fz = LiurenCore.gongOf(c.jiangMap, "白虎");
            }
            else if (no === 70) {
                fz = (liuqinOf(kegs[2].x) === "官鬼") ? kegs[2].x : kegs[3].x;
            }
            const nd = dx.nodes[fz] || LiurenCore.EMPTY_NODE;
            const rep = {
                "{支}": fz || "—",
                "{乘将}": fz ? jiangOf(fz) : "—",
                "{月建}": dx.monthZhi,
                "{太岁}": LiurenCore.yearZhiOf(r),
                "{初传}": chu[0] ? chu[0].z : "",
                "{中传}": chu[1] ? chu[1].z : "",
                "{末传}": chu[2] ? chu[2].z : "",
                "{丁马}": dingMa || "—"
            };
            const fill = (t) => {
                if (!t) {
                    return "";
                }
                const jz = fz ? jiangOf(fz) : "";
                const isKong = kong(fz);
                const ws = wsMap[nd.wangShuai] || "";
                const yz2 = LiurenCore.yearZhiOf(r);
                const segs = String(t).match(/[^；。]*[；。]/g) || [String(t)];
                const fillOut = [];
                segs.forEach((seg) => {
                    const sep = seg.slice(-1);
                    const cc = seg.slice(0, -1).trim();
                    if (!cc) {
                        return;
                    }
                    let kept = true;
                    let rest = cc;
                    const m1 = cc.match(/^若乘将为(.+?)，/);
                    if (m1) {
                        const wants = m1[1].split(/[或、/]/).map((s) => s.trim()).filter((s) => s.length > 0);
                        kept = wants.some((w) => jz.includes(w));
                        rest = cc.slice(m1[0].length);
                    }
                    else {
                        const m2 = cc.match(/^若(逢空|未空)，/);
                        if (m2) {
                            kept = (m2[1] === "逢空") === isKong;
                            rest = cc.slice(m2[0].length);
                        }
                        else {
                            const m3 = cc.match(/^若(旺相|休囚|衰死)(?:或(旺相|休囚|衰死))*，/);
                            if (m3) {
                                const vals = [];
                                if (m3[1]) {
                                    vals.push(m3[1]);
                                }
                                if (m3[2]) {
                                    vals.push(m3[2]);
                                }
                                kept = vals.includes(ws);
                                rest = cc.slice(m3[0].length);
                            }
                            else {
                                const m4 = cc.match(/^若临(月建|太岁)，/);
                                if (m4) {
                                    const ref = m4[1] === "月建" ? dx.monthZhi : yz2;
                                    kept = fz === ref;
                                    rest = cc.slice(m4[0].length);
                                }
                                else {
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
                        fillOut.push(rest.replace(/\{支\}|\{乘将\}|\{月建\}|\{太岁\}|\{初传\}|\{中传\}|\{末传\}|\{丁马\}/g, (mm) => rep[mm]) + sep);
                    }
                });
                return fillOut.join("");
            };
            const layer = {};
            const layerKeys = ["定性", "定象", "定时", "定策", "定级"];
            layerKeys.forEach((k) => {
                layer[k] = fill(loc[k]) || "";
            });
            const apply = (f["判定"] && f["判定"]["适用占事"]) || [];
            const relevant = !apply.length || apply.includes(aff);
            out.push({
                "序": no,
                "法名": f["法名"] || "",
                "赋文": (f["赋文"] || "").replace(/。$/, ""),
                "判": hit["判"],
                "焦点": fz,
                layer: layer,
                "相关": relevant,
                "适用": apply
            });
        });
        return out;
    }
    /* 本课毕法渲染（aff 显式传入，替代原全局 curAffair） */
    static renderBifa(c, dx, aff) {
        return LiurenCore.renderBifaForChuans(c, dx, c.sanchuan.chuans, aff);
    }
    /* ---------------- 毕法教练层（组合断 + 吉凶汇总 + 行动建议） ----------------
       coachData：rawfile/rule/毕法教练.json 的 {"格局":[{序,法名,吉凶,倾向,建议}]}
       输入 hits（本课或动态三传命中的 BifaHit[]），输出组合教练卡 */
    static bifaCoach(hits, coachData) {
        const list = coachData["格局"] || [];
        const items = [];
        let ji = 0, xiong = 0, zhong = 0;
        const adviceSet = [];
        hits.forEach((hit) => {
            for (let i = 0; i < list.length; i++) {
                const it = list[i];
                if (Number(it["序"]) === hit["序"]) {
                    const item = {
                        "序": hit["序"],
                        "法名": String(it["法名"] || hit["法名"]),
                        "吉凶": String(it["吉凶"] || "中"),
                        "类": String(it["类"] || "杂"),
                        "倾向": String(it["倾向"] || ""),
                        "建议": String(it["建议"] || "")
                    };
                    items.push(item);
                    if (item["吉凶"] === "吉") {
                        ji++;
                    }
                    else if (item["吉凶"] === "凶") {
                        xiong++;
                    }
                    else {
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
        const groups = [];
        if (items.length === 0) {
            summary = "本课无毕法格局命中，以四课三传与盘态常规推断。";
        }
        else {
            const tags = [];
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
            /* 分组解读：同类格局归并（保留出现顺序，去重） */
            const seen = [];
            items.forEach((it) => {
                const cls = it["类"];
                if (seen.indexOf(cls) < 0) {
                    seen.push(cls);
                    const same = items.filter((x) => x["类"] === cls);
                    const names = same.map((x) => x["法名"]).join("、");
                    const tones = same.map((x) => x["吉凶"]);
                    const hasXiong = tones.indexOf("凶") >= 0;
                    const hasJi = tones.indexOf("吉") >= 0;
                    let line = "";
                    if (cls === "课体") {
                        line = "课体上" + (hasXiong ? "主伏藏反复" : "有动象") + "（" + names + "）";
                    }
                    else if (cls === "空亡" || cls === "旬空") {
                        line = "空亡之象突出（" + names + "），事多虚而不实";
                    }
                    else if (cls === "官鬼" || cls === "天将") {
                        line = "官鬼天将带凶（" + names + "），古籍主是非病伤之诫";
                    }
                    else if (cls === "贵人") {
                        line = "贵人相关（" + names + "），古籍主干谒扶助之象";
                    }
                    else if (cls === "禄马") {
                        line = "禄马并见（" + names + "），进退有凭";
                    }
                    else if (cls === "三传") {
                        line = "三传结构（" + names + "），定事之始终";
                    }
                    else if (cls === "脱耗") {
                        line = "脱耗之象（" + names + "），古籍主虚耗失脱之诫";
                    }
                    else if (cls === "六合") {
                        line = "和合之象（" + names + "），利合作";
                    }
                    else {
                        line = names + "（" + (hasXiong ? "偏凶" : (hasJi ? "偏吉" : "中平")) + "）";
                    }
                    groups.push(line);
                }
            });
        }
        const out = { items: items, ji: ji, xiong: xiong, zhong: zhong, summary: summary, groups: groups, advice: adviceSet };
        return out;
    }
    /* ---------------- 年命适配建议 ----------------
       nianZhi：年命地支（如子）；c：完整盘（ChartCore + dx 由 withDx 提供）
       输出：年命上神 + 六亲 + 空亡/旺衰 + 适配建议 */
    static nianmingAdvice(c, nianZhi, yongShenZhi) {
        const shang = c.tp[nianZhi] || nianZhi;
        const w = LiurenCore.WX[shang];
        const dw = LiurenCore.WXG[c.r.dg];
        let lq = "";
        if (w === dw) {
            lq = "兄弟";
        }
        else if (LiurenCore.KE[dw] === w) {
            lq = "妻财";
        }
        else if (LiurenCore.KE[w] === dw) {
            lq = "官鬼";
        }
        else if (LiurenCore.SHENG(dw) === w) {
            lq = "子孙";
        }
        else {
            lq = "父母";
        }
        const nd = c.dx.nodes[shang] || LiurenCore.EMPTY_NODE;
        const kong = nd.kong;
        const ws = nd.wangShuai || "";
        /* 年命上神与用神互动：生克关系 */
        let rel = "";
        let interact = "";
        if (yongShenZhi !== "") {
            const ysWx = LiurenCore.WX[yongShenZhi];
            if (ysWx !== "" && w !== "") {
                if (LiurenCore.SHENG(w) === ysWx) {
                    rel = "我生";
                    interact = "古籍云：年命上神生用神（" + shang + "生" + yongShenZhi + "），主命主推动此事、亲历有成之象。";
                }
                else if (LiurenCore.SHENG(ysWx) === w) {
                    rel = "生我";
                    interact = "用神生年命上神（" + yongShenZhi + "生" + shang + "），此事反哺命主，纵有波折终得滋养。";
                }
                else if (LiurenCore.KE[w] === ysWx) {
                    rel = "我克";
                    interact = "古籍云：年命上神克用神（" + shang + "克" + yongShenZhi + "），主命主能掌控此事之象。";
                }
                else if (LiurenCore.KE[ysWx] === w) {
                    rel = "克我";
                    interact = "古籍云：用神克年命上神（" + yongShenZhi + "克" + shang + "），主此事克命主，宜避其锋之诫仅作文献参考。";
                }
                else {
                    rel = "比和";
                    interact = "年命上神与用神比和（" + shang + "与" + yongShenZhi + "同气），事与命主相合，进展平稳。";
                }
            }
        }
        /* 基础建议 */
        let advice = "";
        if (kong) {
            advice = "古籍云：年命上神逢空，主事象易落空，缓急之机可参出空。";
        }
        else if (lq === "官鬼") {
            advice = "古籍云：年命上神临官鬼，主是非压力之象（传统文化参考，非现实判断）。";
        }
        else if (lq === "妻财") {
            advice = "古籍云：年命上神临妻财，主财利机缘之象。";
        }
        else if (lq === "子孙") {
            advice = "古籍云：年命上神临子孙，主救应化解之象。";
        }
        else if (lq === "父母") {
            advice = "古籍云：年命上神临父母，主文书长辈扶助之象。";
        }
        else {
            advice = "古籍云：年命上神临比肩，主同辈扶助、合作共事之象。";
        }
        if (ws === "旺" || ws === "相") {
            advice += " 年命上神旺相，古籍谓助力较实。";
        }
        else if (ws === "死" || ws === "囚") {
            advice += " 年命上神衰弱，古籍谓助力有限。";
        }
        if (interact !== "") {
            advice += " " + interact;
        }
        if (advice !== "") {
            advice = "按六壬法诀：" + advice;
        }
        const out = {
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
    static xingNian(c, birthYear, currentYear, gender, yongShenZhi) {
        const G = LiurenCore.GAN;
        const Z = LiurenCore.ZHI;
        const gan = G[((birthYear - 4) % 10 + 10) % 10];
        const benMingZhi = Z[((birthYear - 4) % 12 + 12) % 12];
        const yangGan = !!LiurenCore.G_YANG[gan];
        const isMale = gender === "男";
        const shun = yangGan ? isMale : !isMale; /* 阳男顺/阴女顺；阳女逆/阴男逆 */
        const sui = currentYear - birthYear + 1; /* 虚岁 */
        const startIdx = Z.indexOf(benMingZhi);
        const step = (shun ? 1 : -1);
        const xingIdx = ((startIdx + step * (sui - 1)) % 12 + 12) % 12;
        const xingNianZhi = Z[xingIdx];
        /* 行年上神 */
        const shang = c.tp[xingNianZhi] || xingNianZhi;
        const w = LiurenCore.WX[shang];
        const dw = LiurenCore.WXG[c.r.dg];
        let lq = "";
        if (w === dw) {
            lq = "兄弟";
        }
        else if (LiurenCore.KE[dw] === w) {
            lq = "妻财";
        }
        else if (LiurenCore.KE[w] === dw) {
            lq = "官鬼";
        }
        else if (LiurenCore.SHENG(dw) === w) {
            lq = "子孙";
        }
        else {
            lq = "父母";
        }
        const nd = c.dx.nodes[shang] || LiurenCore.EMPTY_NODE;
        /* ---- ① 行年上神与用神互动（生克） ---- */
        let rel = "";
        let interact = "";
        const ys = yongShenZhi ? yongShenZhi : "";
        if (ys !== "") {
            const ysWx = LiurenCore.WX[ys];
            if (ysWx !== "" && w !== "") {
                if (LiurenCore.SHENG(w) === ysWx) {
                    rel = "我生";
                    interact = "古籍云：行年上神生用神（" + shang + "生" + ys + "），主今年之运推动此事之象。";
                }
                else if (LiurenCore.SHENG(ysWx) === w) {
                    rel = "生我";
                    interact = "用神生行年上神（" + ys + "生" + shang + "），此事反哺今年之运，纵有波折终得滋养。";
                }
                else if (LiurenCore.KE[w] === ysWx) {
                    rel = "我克";
                    interact = "古籍云：行年上神克用神（" + shang + "克" + ys + "），主今年能掌控此事之象。";
                }
                else if (LiurenCore.KE[ysWx] === w) {
                    rel = "克我";
                    interact = "古籍云：用神克行年上神（" + ys + "克" + shang + "），主此事克今年之运，避锋之诫仅作文献参考。";
                }
                else {
                    rel = "比和";
                    interact = "行年上神与用神比和（" + shang + "与" + ys + "同气），事与今年之运相合，进展平稳。";
                }
            }
        }
        /* ---- ② 与太岁关系（流年吉凶） ----
           太岁支 = 今年地支（currentYear 取支）；冲/合查基础关系表，五行生克判吉凶 */
        const taiSuiZhi = Z[((currentYear - 4) % 12 + 12) % 12];
        const gx = (LiurenCore.rules.duxiang["基础关系"] || {});
        const chongMap = gx["六冲"] || {};
        const heMap = gx["六合"] || {};
        let tsRel = "";
        let tsNote = "";
        if (shang === taiSuiZhi) {
            tsRel = "值太岁";
            tsNote = "古籍云：行年上神临太岁，岁星当头，主动静郑重之象。";
        }
        else if (chongMap[shang] === taiSuiZhi) {
            tsRel = "冲太岁";
            tsNote = "古籍云：行年上神冲太岁，主变动冲击之象；远行外伤诸说仅作文献参考。";
        }
        else if (heMap[shang] === taiSuiZhi) {
            tsRel = "合太岁";
            tsNote = "古籍云：行年上神合太岁，主岁星眷顾、人缘合作之象。";
        }
        else if (w !== "") {
            const tw = LiurenCore.WX[taiSuiZhi];
            if (tw !== "") {
                if (LiurenCore.SHENG(w) === tw) {
                    tsRel = "生太岁";
                    tsNote = "古籍云：行年上神生太岁，主付出在前、回报在后之象。";
                }
                else if (LiurenCore.SHENG(tw) === w) {
                    tsRel = "太岁生";
                    tsNote = "古籍云：太岁生行年上神，主岁星生扶、根基渐固之象。";
                }
                else if (LiurenCore.KE[w] === tw) {
                    tsRel = "克太岁";
                    tsNote = "古籍云：行年上神克太岁，主犯岁之嫌；与上位冲突之说仅作文献参考。";
                }
                else if (LiurenCore.KE[tw] === w) {
                    tsRel = "太岁克";
                    tsNote = "古籍云：太岁克行年上神，主岁星压制、官非慎防之诫（传统文化参考）。";
                }
                else {
                    tsRel = "比和";
                    tsNote = "古籍云：行年上神与太岁比和，主运势平稳之象。";
                }
            }
        }
        /* ---- ③ 行年上神乘将（吉凶天将） ---- */
        const jiang = c.jiangMap[LiurenCore.gongOf(c.tp, shang)] || "";
        const jiangJx = jiang ? (LiurenCore.JIANG_JX[jiang] || "") : "";
        let jiangNote = "";
        if (jiang !== "") {
            if (jiangJx === "吉") {
                jiangNote = "古籍云：行年上神乘吉将" + jiang + "，主助力之象。";
            }
            else if (jiangJx === "凶") {
                jiangNote = "古籍云：行年上神乘凶将" + jiang + "，主" + LiurenCore.JIANG_WARN[jiang] + "之诫（文献参考）。";
            }
            else {
                jiangNote = "古籍云：行年上神乘" + jiang + "，主平稳中带变数之象。";
            }
        }
        /* ---- ④ 行年吉凶量化：五层分值汇总 → 档位（打分表数据驱动） ---- */
        const rule = LiurenCore.rules.xingnian || LiurenCore.XN_SCORE_DEFAULT;
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
        }
        else if (lq === "官鬼") {
            advice = "古籍云：行年上神临官鬼，主是非压力之象（传统文化参考，非现实判断）。";
        }
        else if (lq === "妻财") {
            advice = "古籍云：行年上神临妻财，主财利机缘之象。";
        }
        else if (lq === "子孙") {
            advice = "古籍云：行年上神临子孙，主救应化解、小辈扶助之象。";
        }
        else if (lq === "父母") {
            advice = "古籍云：行年上神临父母，主长辈文书扶助之象。";
        }
        else {
            advice = "古籍云：行年上神临比肩，主同辈助力、合作之象。";
        }
        if (nd.wangShuai === "旺" || nd.wangShuai === "相") {
            advice += " 行年上神旺相，古籍谓运势得力。";
        }
        else if (nd.wangShuai === "死" || nd.wangShuai === "囚") {
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
        const out = {
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
}
/* ---------------- 常量（自 HTML 常量块） ---------------- */
LiurenCore.GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
LiurenCore.ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
LiurenCore.JI_GONG = {
    "甲": "寅", "乙": "辰", "丙": "巳", "丁": "未", "戊": "巳",
    "己": "未", "庚": "申", "辛": "戌", "壬": "亥", "癸": "丑"
};
LiurenCore.WX = {
    "子": "水", "丑": "土", "寅": "木", "卯": "木", "辰": "土", "巳": "火",
    "午": "火", "未": "土", "申": "金", "酉": "金", "戌": "土", "亥": "水"
};
LiurenCore.WXG = {
    "甲": "木", "乙": "木", "丙": "火", "丁": "火", "戊": "土",
    "己": "土", "庚": "金", "辛": "金", "壬": "水", "癸": "水"
};
LiurenCore.KE = {
    "木": "土", "土": "水", "水": "火", "火": "金", "金": "木"
};
LiurenCore.GUIREN = {
    "甲": ["丑", "未"], "戊": ["丑", "未"], "庚": ["丑", "未"],
    "乙": ["子", "申"], "己": ["子", "申"],
    "丙": ["亥", "酉"], "丁": ["亥", "酉"],
    "壬": ["巳", "卯"], "癸": ["巳", "卯"], "辛": ["午", "寅"]
};
LiurenCore.JIANG_SHUN = ["贵人", "螣蛇", "朱雀", "六合", "勾陈", "青龙", "天空", "白虎", "太常", "玄武", "太阴", "天后"];
LiurenCore.JIANG_NI = ["贵人", "天后", "太阴", "玄武", "太常", "白虎", "天空", "青龙", "勾陈", "六合", "朱雀", "螣蛇"];
LiurenCore.BENSHEN = {
    "子": "天后", "丑": "贵人", "寅": "青龙", "卯": "六合", "辰": "勾陈", "巳": "螣蛇",
    "午": "朱雀", "未": "太常", "申": "白虎", "酉": "太阴", "戌": "天空", "亥": "玄武"
};
LiurenCore.JIANG_JX = {
    "贵人": "吉", "天后": "吉", "太阴": "吉", "玄武": "凶", "太常": "吉", "白虎": "凶",
    "天空": "凶", "青龙": "吉", "勾陈": "凶", "六合": "吉", "朱雀": "凶", "螣蛇": "凶"
};
/* 凶将警示词（乘凶将断语用） */
LiurenCore.JIANG_WARN = {
    "玄武": "盗失暗昧", "白虎": "伤病血光", "天空": "虚诈落空",
    "勾陈": "拖延争斗", "朱雀": "口舌是非", "螣蛇": "虚惊怪异"
};
/* 行年吉凶打分默认表（宿主 init 注入 行年打分.json 覆盖） */
LiurenCore.XN_SCORE_DEFAULT = {
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
LiurenCore.YANG_ZHI = { "子": 1, "寅": 1, "辰": 1, "午": 1, "申": 1, "戌": 1 };
LiurenCore.G_YANG = { "甲": 1, "丙": 1, "戊": 1, "庚": 1, "壬": 1 };
/* ---------------- 规则数据（宿主 init 注入） ---------------- */
LiurenCore.rules = { duxiang: {}, shensha: {}, bifa: {} };
/* ---------------- 盘态静态表（与 HTML 的 WANG_T/XUN_KONG/YUE_LING/QIJI_GONG/XUN_OF 一致） ---------------- */
LiurenCore.XUN_KONG = (() => {
    const m = {};
    const t = [
        ["甲子", "戌亥"], ["甲戌", "申酉"], ["甲申", "午未"],
        ["甲午", "辰巳"], ["甲辰", "寅卯"], ["甲寅", "子丑"]
    ];
    t.forEach((pair) => {
        const jia = pair[0];
        const kk = pair[1];
        const j = LiurenCore.GAN.indexOf(jia[0]);
        const z = LiurenCore.ZHI.indexOf(jia[1]);
        for (let i = 0; i < 10; i++) {
            m[LiurenCore.GAN[(j + i) % 10] + LiurenCore.ZHI[(z + i) % 12]] = kk.split("");
        }
    });
    return m;
})();
LiurenCore.YUE_LING = (() => {
    const m = {};
    const wx5 = ["木", "火", "土", "金", "水"];
    LiurenCore.ZHI.forEach((z) => {
        const ling = LiurenCore.WX[z];
        const st = {};
        wx5.forEach((w) => {
            if (w === ling) {
                st[w] = "旺";
            }
            else if (LiurenCore.SHENG(ling) === w) {
                st[w] = "相";
            }
            else if (LiurenCore.SHENG(w) === ling) {
                st[w] = "休";
            }
            else if (LiurenCore.KE[w] === ling) {
                st[w] = "囚";
            }
            else {
                st[w] = "死";
            }
        });
        m[z] = st;
    });
    return m;
})();
LiurenCore.QIJI_GONG = (() => {
    const gongs = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"];
    const yangS = { "甲": "亥", "丙": "寅", "戊": "寅", "庚": "巳", "壬": "申" };
    const yinS = { "乙": "午", "丁": "酉", "己": "酉", "辛": "子", "癸": "卯" };
    const m = {};
    const yangG = ["甲", "丙", "戊", "庚", "壬"];
    const yinG = ["乙", "丁", "己", "辛", "癸"];
    yangG.forEach((g) => {
        const o = {};
        const s = LiurenCore.ZHI.indexOf(yangS[g]);
        gongs.forEach((n, i) => {
            o[LiurenCore.ZHI[(s + i) % 12]] = n;
        });
        m[g] = o;
    });
    yinG.forEach((g) => {
        const o = {};
        const s = LiurenCore.ZHI.indexOf(yinS[g]);
        gongs.forEach((n, i) => {
            o[LiurenCore.ZHI[(s - i + 12) % 12]] = n;
        });
        m[g] = o;
    });
    return m;
})();
/* 地支十二宫（按地支五行统一长生，水土同宫；六壬盘面常用）：
   木(寅卯)长生亥 · 火(巳午)长生寅 · 金(申酉)长生巳 · 水土(子丑辰未戌亥)长生申 */
LiurenCore.ZHI_GONG = (() => {
    const gongs = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"];
    const changSheng = { "木": "亥", "火": "寅", "金": "巳", "水": "申", "土": "申" };
    const m = {};
    LiurenCore.ZHI.forEach((z) => {
        const wx = LiurenCore.WX[z];
        const s = LiurenCore.ZHI.indexOf(changSheng[wx]);
        const o = {};
        gongs.forEach((n, i) => {
            o[LiurenCore.ZHI[(s + i) % 12]] = n;
        });
        m[z] = o;
    });
    return m;
})();
LiurenCore.XUN_OF = (() => {
    const m = {};
    const t = ["甲子", "甲戌", "甲申", "甲午", "甲辰", "甲寅"];
    t.forEach((jia) => {
        const j = LiurenCore.GAN.indexOf(jia[0]);
        const z = LiurenCore.ZHI.indexOf(jia[1]);
        for (let i = 0; i < 10; i++) {
            m[LiurenCore.GAN[(j + i) % 10] + LiurenCore.ZHI[(z + i) % 12]] = jia;
        }
    });
    return m;
})();
LiurenCore.EMPTY_NODE = { wangShuai: "", qiJi: "", kong: false };
/* 驿马表（三合驿马）：申子辰马在寅、巳酉丑马在亥、寅午戌马在申、亥卯未马在巳 */
LiurenCore.MA_ZHI = {
    "申": "寅", "子": "寅", "辰": "寅",
    "巳": "亥", "酉": "亥", "丑": "亥",
    "寅": "申", "午": "申", "戌": "申",
    "亥": "巳", "卯": "巳", "未": "巳"
};
/* 课体辅助静态表（《大六壬指南》三传排法规范） */
/* 刑：子刑卯、卯刑子、寅刑巳、巳刑申、申刑寅、丑刑戌、戌刑未、未刑丑、辰午酉亥自刑 */
LiurenCore.XING_MAP = {
    "子": "卯", "卯": "子", "寅": "巳", "巳": "申", "申": "寅",
    "丑": "戌", "戌": "未", "未": "丑",
    "辰": "辰", "午": "午", "酉": "酉", "亥": "亥"
};
/* 干合：甲己合、乙庚合、丙辛合、丁壬合、戊癸合 */
LiurenCore.HE_GAN = {
    "甲": "己", "己": "甲", "乙": "庚", "庚": "乙",
    "丙": "辛", "辛": "丙", "丁": "壬", "壬": "丁",
    "戊": "癸", "癸": "戊"
};
/* 支前三合：子合丑、丑合巳、寅合亥、卯合戌、辰合酉、巳合申、午合未、未合午、申合巳、酉合辰、戌合卯、亥合寅 */
LiurenCore.QIAN_SANHE = {
    "子": "丑", "丑": "巳", "寅": "亥", "卯": "戌", "辰": "酉", "巳": "申",
    "午": "未", "未": "午", "申": "巳", "酉": "辰", "戌": "卯", "亥": "寅"
};
/* 天将类象（节点卡词云用） */
const TIANJIANG_LEIXIANG = {
    "贵人": "尊贵提携", "腾蛇": "虚惊怪异", "朱雀": "文书口舌", "六合": "和合媒合",
    "勾陈": "争斗官讼", "青龙": "财喜酒食", "天空": "欺诈虚妄", "白虎": "病伤血光",
    "太常": "印绶宴席", "玄武": "盗贼暗昧", "太阴": "阴私妇人", "天后": "妇人恩泽"
};
/* 占事 → 管辂神书组合读象（原文要点；管辂象意库之外的精炼句） */
const GUANLU_DUYU = {
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
const AFFAIR_XIANGYI = {
    "求财": ["求财", "杂占"], "求官": ["杂占总诀"], "婚姻": ["婚姻"], "疾病": ["杂占总诀", "杂占"],
    "官司": ["杂占"], "出行": ["杂占"], "失物": ["杂占二"], "学业": ["杂占总诀"],
    "家宅": ["杂占"], "行人": ["杂占"], "六畜": ["杂占二"], "求谋": ["谋事"]
};
/* 占事关键词（句内命中加分，按占事语义粗配） */
const AFFAIR_KW = {
    "求财": ["财", "金", "商", "货", "酒"], "求官": ["官", "禄", "功名", "贵", "印"], "婚姻": ["婚", "妻", "夫", "嫁", "姻", "媒"],
    "疾病": ["病", "死", "医", "药", "产"], "官司": ["讼", "官符", "口舌", "争", "狱"], "出行": ["行", "路", "马", "出", "舟", "船"],
    "失物": ["失", "盗", "贼", "藏", "偷"], "学业": ["书", "文", "印", "学", "榜"], "家宅": ["宅", "家", "屋", "门", "户"],
    "行人": ["归", "还", "回", "人", "客"], "六畜": ["畜", "牛", "马", "犬", "猪", "羊"], "求谋": ["谋", "求", "合", "事", "成"]
};
/* 日干五行 → 各六亲地支（与 Web 端 LIUQIN_ZHI 一致） */
const LIUQIN_ZHI = {
    "木": { "妻财": ["辰", "戌", "丑", "未"], "官鬼": ["申", "酉"], "父母": ["亥", "子"], "比肩": ["寅", "卯"], "子孙": ["巳", "午"] },
    "火": { "妻财": ["申", "酉"], "官鬼": ["亥", "子"], "父母": ["寅", "卯"], "比肩": ["巳", "午"], "子孙": ["辰", "戌", "丑", "未"] },
    "土": { "妻财": ["亥", "子"], "官鬼": ["寅", "卯"], "父母": ["巳", "午"], "比肩": ["辰", "戌", "丑", "未"], "子孙": ["申", "酉"] },
    "金": { "妻财": ["寅", "卯"], "官鬼": ["巳", "午"], "父母": ["辰", "戌", "丑", "未"], "比肩": ["申", "酉"], "子孙": ["亥", "子"] },
    "水": { "妻财": ["巳", "午"], "官鬼": ["辰", "戌", "丑", "未"], "父母": ["申", "酉"], "比肩": ["亥", "子"], "子孙": ["寅", "卯"] }
};
class YongShenCore {
    /* ---------------- 占事体系解析 ---------------- */
    /* 从占事体系 JSON 提取 12 大类配置 */
    static affairs() {
        const list = YongShenCore.zhanShi["占事大类"] || [];
        const out = [];
        for (let i = 0; i < list.length; i++) {
            const it = list[i];
            const name = String(it["名称"] || '');
            const ys = it["用神"] || {};
            const lq = ys["六亲"] || [];
            const jg = ys["天将"] || [];
            const zz = ys["地支"] || [];
            const cfg = {
                name: name,
                liuqin: lq,
                jiang: jg,
                zhi: zz,
                note: String(it["断语倾向注"] || ''),
                guMenlei: it["古门类"] || [],
                scene: it["场景提示词"] || [],
                info: String(it["信息提示"] || '')
            };
            out.push(cfg);
        }
        return out;
    }
    /* 按名称取占事配置（未命中返回 null） */
    static affairByName(name) {
        const all = YongShenCore.affairs();
        for (let i = 0; i < all.length; i++) {
            if (all[i].name === name) {
                return all[i];
            }
        }
        return null;
    }
    /* 管辂神书组合读象（固定精炼句，供「读象直断」区展示） */
    static duyuOf(name) {
        const arr = GUANLU_DUYU[name];
        return arr ? arr : [];
    }
    /* ---------------- 类神候选 ---------------- */
    /* 占事 → 候选列表：六亲地支 + 地支取象 + 天将布列宫位（去重） */
    static candidates(c, aff) {
        const dw = LiurenCore.WXG[c.r.dg];
        const lqTable = LIUQIN_ZHI[dw] || {};
        const cands = [];
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
    static pushCand(list, z, type, jiang) {
        for (let i = 0; i < list.length; i++) {
            if (list[i].zhi === z) {
                return; /* 已存在：去重 */
            }
        }
        const it = { zhi: z, type: type, jiang: jiang };
        list.push(it);
    }
    /* ---------------- 六亲 / 动态三传 ---------------- */
    /* 某支相对日干的六亲（五行生克） */
    static liuqinOf(c, z) {
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
    static dongtai(c, zhi) {
        const c1 = zhi;
        const c2 = c.tp[c1];
        const c3 = c.tp[c2];
        const dun = LiurenCore.dunMap(c.r.dg);
        const mk = (z, pos) => {
            const gz = (dun[z] || '') + z;
            const jiang = c.jiangMap[LiurenCore.gongOf(c.tp, z)] || '';
            const it = { zhi: z, gz: gz, jiang: jiang, lq: YongShenCore.liuqinOf(c, z), pos: pos };
            return it;
        };
        const out = [];
        out.push(mk(c1, "初传 · 用神 · 事起"));
        out.push(mk(c2, "中传 · 事中"));
        out.push(mk(c3, "末传 · 事终"));
        return out;
    }
    /* ---------------- 用神节点卡：类象词云 ---------------- */
    /* 用神节点 → 词云：天将类象 / 地支象义特征+物象 / 天干类象 / 纳音象义 */
    static jieDianWords(c, z, leixiang) {
        const words = [];
        const g = c.dun[z] || '';
        const jiang = c.jiangMap[LiurenCore.gongOf(c.tp, z)] || '';
        /* 天将类象 */
        if (jiang !== '' && TIANJIANG_LEIXIANG[jiang]) {
            words.push(YongShenCore.w("将·" + jiang, TIANJIANG_LEIXIANG[jiang]));
        }
        /* 地支类象 */
        const dz = (leixiang["地支类象"] || {})["地支"];
        const dzItem = (dz || {})[z];
        if (dzItem) {
            const feats = dzItem["象义特征"] || [];
            for (let i = 0; i < feats.length && i < 2; i++) {
                const p = YongShenCore.splitColon(feats[i]);
                words.push(YongShenCore.w(z + "·" + p[0], p[1]));
            }
            const wu = dzItem["物象"] || [];
            if (wu.length > 0) {
                words.push(YongShenCore.w(z + "·物象", YongShenCore.cut(wu.join("；"), 46)));
            }
        }
        /* 天干类象 */
        const tg = (leixiang["天干类象"] || {})["天干"];
        const tgItem = (tg || {})[g];
        if (tgItem) {
            const detail = tgItem["详细"] || [];
            if (detail.length > 0) {
                words.push(YongShenCore.w(g + "·类象", YongShenCore.cut(detail.join("；"), 46)));
            }
        }
        /* 纳音象义 */
        const ny = (leixiang["纳音象义"] || {})["六十甲子"];
        const nyItem = (ny || {})[g + z];
        if (nyItem && nyItem["纳音"]) {
            words.push(YongShenCore.w("纳音·" + String(nyItem["纳音"]), String(nyItem["象义"] || '')));
        }
        return words;
    }
    static w(k, v) {
        const it = { k: k, v: v };
        return it;
    }
    /* "标签：值" 拆分（首个：号） */
    static splitColon(t) {
        const i = t.indexOf("：");
        if (i > 0) {
            return [t.substring(0, i), t.substring(i + 1)];
        }
        return [t, ''];
    }
    /* 截断（超长加省略号） */
    static cut(t, n) {
        return t.length > n ? t.substring(0, n) + "…" : t;
    }
    /* ---------------- 管辂象意选句 ---------------- */
    /* 选句：按占事门类取库 → 盘态信号匹配打分 → 取最高两条（收光一句 + 命中依据）
       tick：换一条的轮换索引（Web 端"🔄 换一条"用）；anchor：锚定象名（可空） */
    static selectDuyu(c, aff, cands, zhi, xiangyi, tick, anchor) {
        const cur = YongShenCore.findCand(cands, zhi);
        /* 池：占事 → 门类 → 象意条目 */
        const cats = aff.guMenlei.length > 0 ? aff.guMenlei : (AFFAIR_XIANGYI[aff.name] || ["杂占"]);
        const pool = [];
        for (let i = 0; i < cats.length; i++) {
            const arr = xiangyi[cats[i]] || [];
            for (let j = 0; j < arr.length; j++) {
                pool.push(arr[j]);
            }
        }
        /* 关键词：用神天将名 + 用神地支 + 占事关键词 */
        const kw = [];
        if (cur && cur.jiang !== '') {
            kw.push(cur.jiang);
        }
        kw.push(zhi);
        const affKw = AFFAIR_KW[aff.name] || [];
        /* 打分 */
        const scored = [];
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
            const it = { e: e, s: s };
            scored.push(it);
        }
        YongShenCore.sortDesc(scored);
        const top = scored.slice(0, 8);
        if (top.length === 0) {
            const empty = { shouGuang: '', items: [] };
            return empty;
        }
        const half = Math.max(1, Math.floor(top.length / 2));
        const k = tick % top.length;
        const pick0 = top[k].e;
        const pick1 = top[(k + half) % top.length].e;
        /* 命中依据 */
        const ev0 = YongShenCore.evidenceOf(c, pick0, cur, zhi);
        const ev1 = YongShenCore.evidenceOf(c, pick1, cur, zhi);
        const nd = c.dx.nodes[zhi];
        const jj = cur ? cur.jiang : '';
        const stateT = "用神" + (c.dun[zhi] || '') + zhi + (jj !== '' ? "乘" + jj : '') +
            "，临" + String(nd.qiJi || '?') + "（" + String(nd.wangShuai || '?') + "）" +
            (nd.kong ? "落空" : '') + (anchor ? "·落象『" + anchor + "』" : '');
        const ge0 = String(pick0["歌诀"] || pick0["释义"] || '').substring(0, 30);
        const shouGuang = stateT + "——「" + ge0 + "」";
        const items = [
            YongShenCore.mkItem(pick0, ev0),
            YongShenCore.mkItem(pick1, ev1)
        ];
        const out = { shouGuang: shouGuang, items: items };
        return out;
    }
    /* 命中依据：断语文本命中了哪些盘态信号 */
    static evidenceOf(c, e, cur, zhi) {
        const t = String(e["歌诀"] || '') + String(e["释义"] || '');
        const ev = [];
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
        const ss = c.dx.shensha.byZhi[zhi] || [];
        for (let i = 0; i < ss.length; i++) {
            const short = ss[i].split("(")[0];
            if (short !== '' && t.indexOf(short) >= 0) {
                ev.push("带" + short);
            }
        }
        return ev;
    }
    static mkItem(e, ev) {
        const ge = String(e["歌诀"] || '（原歌诀缺失·物类断语）');
        const yi = YongShenCore.cut(String(e["释义"] || '（无释义）'), 150);
        const it = { ge: ge, yi: yi, ev: ev };
        return it;
    }
    /* 在候选中查找某支（未命中返回 null） */
    static findCand(cands, zhi) {
        for (let i = 0; i < cands.length; i++) {
            if (cands[i].zhi === zhi) {
                return cands[i];
            }
        }
        return null;
    }
    /* 降序排序（按分数） */
    static sortDesc(arr) {
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
/* 宿主注入的占事体系（12 大类，原始 JSON） */
YongShenCore.zhanShi = {};

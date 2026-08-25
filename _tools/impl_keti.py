# -*- coding: utf-8 -*-
"""核心：九宗门课体识别层（按《大六壬指南》三传排法规范）
   1. SanChuan 增加 keti 字段
   2. resolveSanchuan 重写：伏吟/返吟/别责/八专/昴星 独立识别
   3. 新增辅助：课体判定 + 刑/冲/干合/支前三合表"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\core\liuren-core.ts"
t = io.open(p, encoding="utf-8").read()

# ---------- 1. SanChuan 接口加 keti ----------
old_iface = """/* 三传九宗门结果 */
interface SanChuan {
  method: string;
  chuans: Chuan[];
}"""
new_iface = """/* 三传九宗门结果 */
interface SanChuan {
  method: string;
  keti: string;      /* 课体名（伏吟/返吟/八专/别责/昴星/…；普通课为""） */
  chuans: Chuan[];
}"""
if old_iface in t:
    t = t.replace(old_iface, new_iface)
    print("OK iface")
else:
    print("MISS iface")

# ---------- 2. 替换 resolveSanchuan ----------
old_start = "  /* 九宗门全部逻辑：贼克/比用/涉害/遥克/昴星（别责/八专/伏吟/返吟 走昴星等兜底分支） */\n  static resolveSanchuan(dg: string, tp: Record<string, string>, kegs: Keg[], dun: Record<string, string>): SanChuan {"
old_end_marker = "    const chuans: Chuan[] = arr.map((z: string): Chuan => ({ z: z, gz: dun[z] + z }));\n    return { method: method, chuans: chuans };\n  }"

i0 = t.find(old_start)
i1 = t.find(old_end_marker)
if i0 < 0 or i1 < 0:
    print("MISS resolveSanchuan block", i0, i1)
else:
    i1 = i1 + len(old_end_marker)
    new_method = '''  /* ---------------- 九宗门·课体识别层（《大六壬指南》三传排法规范） ----------------
     优先级 1→9：贼克(重审/元首) → 比用 → 涉害 → 遥克(蒿矢/弹射) → 昴星 → 别责 → 八专 → 伏吟 → 返吟
     keti：伏吟/返吟/八专/别责/昴星（虎视转蓬/冬蛇掩目）等课体名；普通课为"" */
  static resolveSanchuan(dg: string, tp: Record<string, string>, kegs: Keg[], dun: Record<string, string>): SanChuan {
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
    /* 八专：干支同位（日干寄宫 === 日支），四课仅 2 课 */
    const baZhuan = (ji === kegs[0].s && ji === kegs[2].s);
    /* 四课去重后课数（别责=3 课、八专=2 课） */
    const uniqKegs: Keg[] = [];
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
    const down: number[] = [];
    const up: number[] = [];
    kegs.forEach((k: Keg, i: number) => {
      if (LiurenCore.ke(k.s, k.x)) {
        down.push(i);
      } else if (LiurenCore.ke(k.x, k.s)) {
        up.push(i);
      }
    });
    /* 遥克（第 2/3/4 课上神 遥克日干 = 蒿矢；日干遥克上神 = 弹射） */
    const haoshi: number[] = [];
    const danshe: number[] = [];
    kegs.forEach((k: Keg, i: number) => {
      if (i > 0 && LiurenCore.ke(k.x, dg)) {
        haoshi.push(i);
      }
      if (i > 0 && LiurenCore.ke(dg, k.x)) {
        danshe.push(i);
      }
    });

    /* 三传工具：中末传 = 天盘覆盖 */
    const chuanOf = (z: string): string => tp[z] || "";
    const mk = (c1: string, c2: string, c3: string): SanChuan => {
      const arr: string[] = [c1, c2, c3];
      const chuans: Chuan[] = arr.map((z: string): Chuan => ({ z: z, gz: dun[z] + z }));
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
      } else if (LiurenCore.ke(k1.x, k1.s)) {
        fuyinC1 = k1.x;
      } else {
        fuyinC1 = yangGan ? k1.x : kegs[2].x;
      }
      /* 自刑：辰午酉亥 */
      const ziXing = fuyinC1 === "辰" || fuyinC1 === "午" || fuyinC1 === "酉" || fuyinC1 === "亥";
      if (ziXing) {
        c1 = fuyinC1;
        c2 = yangGan ? kegs[2].x : k1.x;   /* 自刑：阳日取日支上神、阴日取日干上神 */
        c3 = chuanOf(c2) !== "" ? chuanOf(c2) : c2;  /* 取中传之刑或冲 */
      } else {
        c1 = fuyinC1;
        c2 = LiurenCore.XING_MAP[c1] || c1;
        c3 = LiurenCore.XING_MAP[c2] || c2;
      }
      method = "伏吟";
      const out: SanChuan = mk(c1, c2, c3);
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
      } else {
        /* 无贼克（井栏射）：丑日取亥、未日取巳 */
        keti = "返吟·井栏射";
        if (kegs[2].s === "丑") {
          c1 = "亥";
        } else if (kegs[2].s === "未") {
          c1 = "巳";
        } else {
          c1 = kegs[2].x;
        }
        c2 = chuanOf(kegs[2].s);
        c3 = chuanOf(k1x(kegs, dg));
        method = "返吟";
      }
      const out: SanChuan = mk(c1, c2, c3);
      out.method = method;
      out.keti = keti;
      return out;
    }

    /* ---------- 7. 八专 ---------- */
    if (baZhuan) {
      keti = "八专";
      /* 阳日：日干上神顺数3；阴日：日支上神逆数3（无贼克才入八专） */
      const base = yangGan ? kegs[0].x : kegs[2].x;
      const idx = Z.indexOf(base);
      c1 = yangGan ? Z[(idx + 3) % 12] : Z[(idx - 3 + 12) % 12];
      c2 = kegs[0].x;   /* 中末固定取日干上神 */
      c3 = kegs[0].x;
      method = "八专";
      const out: SanChuan = mk(c1, c2, c3);
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
      } else {
        const qianSanHe = LiurenCore.QIAN_SANHE[kegs[2].s] || kegs[2].s;
        c1 = chuanOf(qianSanHe);
      }
      c2 = kegs[0].x;   /* 中末固定取日干上神 */
      c3 = kegs[0].x;
      method = "别责";
      const out: SanChuan = mk(c1, c2, c3);
      out.method = method;
      out.keti = keti;
      return out;
    }

    /* ---------- 1-5. 贼克 / 比用 / 涉害 / 遥克 / 昴星（普通课） ---------- */
    if (down.length === 1 && up.length === 0) {
      method = "重审";
      c1 = kegs[down[0]].x;
    } else if (down.length === 0 && up.length === 1) {
      method = "元首";
      c1 = kegs[up[0]].x;
    } else if (down.length + up.length >= 2) {
      const ks = down.length > 0 ? down : up;
      const bi = ks.filter((i: number) => !!LiurenCore.YANG_ZHI[kegs[i].x] === yangGan);
      if (bi.length === 1) {
        method = "比用";
        c1 = kegs[bi[0]].x;
      } else if (bi.length > 1) {
        method = "涉害";
        let best = -1;
        let bestK: string | null = null;
        bi.forEach((i: number) => {
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
      } else {
        method = "涉害";
        c1 = kegs[ks[0]].x;
      }
    } else if (haoshi.length > 0) {
      method = "遥克·蒿矢";
      const pick = haoshi.filter((i: number) => !!LiurenCore.YANG_ZHI[kegs[i].x] === yangGan);
      c1 = kegs[(pick.length ? pick[0] : haoshi[0])].x;
    } else if (danshe.length > 0) {
      method = "遥克·弹射";
      c1 = kegs[danshe[0]].x;
    } else {
      /* 昴星 */
      method = "昴星";
      keti = yangGan ? "昴星·虎视转蓬" : "昴星·冬蛇掩目";
      if (yangGan) {
        c1 = tp["酉"];
      } else {
        c1 = Z[(Z.indexOf("酉") - 3 + 12) % 12];
      }
    }
    /* 中末传 */
    if (method === "昴星") {
      c2 = yangGan ? tp[kegs[2].s] : tp[ji];
      c3 = yangGan ? tp[ji] : tp[kegs[2].s];
    } else {
      c2 = chuanOf(c1);
      c3 = chuanOf(c2);
    }
    const arr: string[] = [c1, c2, c3];
    const chuans: Chuan[] = arr.map((z: string): Chuan => ({ z: z, gz: dun[z] + z }));
    return { method: method, keti: keti, chuans: chuans };
  }

  /* 返吟井栏射末传辅助：日干上神 */
  function k1x(kegs: Keg[], dg: string): string {
    return kegs[0].x;
  }
'''
    t = t[:i0] + new_method + t[i1:]
    print("OK resolveSanchuan replaced")

# ---------- 3. 新增静态表：XING_MAP / HE_GAN / QIAN_SANHE ----------
anchor = "  /* ---------------- 盘态计算 ---------------- */"
addition = """  /* 课体辅助静态表（《大六壬指南》三传排法规范） */
  /* 刑：子刑卯、卯刑子、寅刑巳、巳刑申、申刑寅、丑刑戌、戌刑未、未刑丑、辰午酉亥自刑 */
  static readonly XING_MAP: Record<string, string> = {
    "子": "卯", "卯": "子", "寅": "巳", "巳": "申", "申": "寅",
    "丑": "戌", "戌": "未", "未": "丑",
    "辰": "辰", "午": "午", "酉": "酉", "亥": "亥"
  };
  /* 干合：甲己合、乙庚合、丙辛合、丁壬合、戊癸合 */
  static readonly HE_GAN: Record<string, string> = {
    "甲": "己", "己": "甲", "乙": "庚", "庚": "乙",
    "丙": "辛", "辛": "丙", "丁": "壬", "壬": "丁",
    "戊": "癸", "癸": "戊"
  };
  /* 支前三合：子合丑、丑合巳、寅合亥、卯合戌、辰合酉、巳合申、午合未、未合午、申合巳、酉合辰、戌合卯、亥合寅 */
  static readonly QIAN_SANHE: Record<string, string> = {
    "子": "丑", "丑": "巳", "寅": "亥", "卯": "戌", "辰": "酉", "巳": "申",
    "午": "未", "未": "午", "申": "巳", "酉": "辰", "戌": "卯", "亥": "寅"
  };

"""
if anchor in t:
    t = t.replace(anchor, addition + anchor)
    print("OK tables")
else:
    print("MISS tables anchor")

io.open(p, "w", encoding="utf-8").write(t)
print("done")

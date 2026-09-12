/* 三传（九宗门）规范符合性对账：规范参考实现 ↔ 引擎
 * ----------------------------------------------------------------------------
 * 规范真源：大六壬文档/排盘/大六壬指南的四课三传的三传排法.md
 * 做法：把规范逐条实现成参考实现（本文件内），与引擎的 resolveSanchuan 在全枚举上对比：
 *       60 日 × 12 月将 × 12 占时 = 8640 盘；逐盘比「宗门名 / 初传 / 中传 / 末传」。
 * 用法：node _tests/_test_sanchuan_spec.js [--verbose]
 * 退出码：存在不一致即 1（便于当门禁用）。
 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'core', 'liuren-core.js'), 'utf-8'), { filename: 'liuren-core.js' });
const R = path.join(ROOT, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'resources', 'rawfile', 'rule');
const load = (f) => JSON.parse(fs.readFileSync(path.join(R, f), 'utf-8'));
LiurenCore.init({
  duxiang: {
    '旺衰休囚死': { '旺衰': load('旺衰休囚死.json')['旺衰'] },
    '十二宫气机点': load('十二宫气机点.json'),
    '空亡规则': load('空亡规则.json'),
    '助日规则': load('助日规则.json'),
    '基础关系': load('基础关系.json')
  },
  shensha: { '神煞': load('神煞起法.json')['神煞'] },
  bifa: { '一百法': load('毕法赋一百法.json')['一百法'] }
});

const Z = LiurenCore.ZHI;
const GANS = '甲乙丙丁戊己庚辛壬癸'.split('');
const ZHI = Z;
const VERBOSE = process.argv.includes('--verbose');
const isGan = (c) => GANS.indexOf(c) >= 0;
const chong = (z) => Z[(Z.indexOf(z) + 6) % 12];
const ke = (a, b) => LiurenCore.ke(a, b);
const yangGanOf = (dg) => !!LiurenCore.G_YANG[dg];
const MENG = ['寅', '申', '巳', '亥'];
const ZHONG = ['子', '午', '卯', '酉'];
const JI4 = ['辰', '戌', '丑', '未'];
const ZI_XING = LiurenCore.ZI_XING;

/** 规范参考实现：返回 { method, chuans:[c1,c2,c3] } */
function specRef(dg, dz, tp, kegs) {
  const yang = yangGanOf(dg);
  const ji = LiurenCore.JI_GONG[dg];
  const zhiOf = (s) => (isGan(s) ? LiurenCore.JI_GONG[s] : s);
  const chuanOf = (z) => tp[z] || '';
  const mk = (m, a, b, c) => ({ method: m, chuans: [a, b, c] });

  /* 结构判定 */
  const fuYin = Z.every((z) => tp[z] === z);
  const fanYin = Z.every((z) => tp[z] === chong(z));
  /* 贼克候选（下神为日干时按寄宫） */
  const down = [], up = [];
  kegs.forEach((k, i) => {
    if (ke(k.s, k.x)) down.push(i);
    else if (ke(k.x, k.s)) up.push(i);
  });
  const ks = down.length > 0 ? down : up;
  const bi = ks.filter((i) => !!LiurenCore.YANG_ZHI[kegs[i].x] === yang);
  /* 遥克：第 2/3/4 课上神 */
  const haoshi = [], danshe = [];
  kegs.forEach((k, i) => {
    if (i === 0) return;
    if (ke(k.x, dg)) haoshi.push(i);
    if (ke(dg, k.x)) danshe.push(i);
  });
  /* 四课去重课数 */
  const uniq = [];
  kegs.forEach((k) => { if (!uniq.some((u) => u.x === k.x)) uniq.push(k); });   /* 四课按上神去重（课数即上神数） */
  const nUniq = uniq.length;
  const baZhuan = (ji === kegs[2].s);

  /* 伏吟（规范 §8） */
  if (fuYin) {
    const k1 = kegs[0];
    let c1;
    if (ke(k1.s, k1.x) || ke(k1.x, k1.s)) c1 = k1.x;
    else c1 = yang ? k1.x : kegs[2].x;
    let c2, c3;
    if (ZI_XING[c1]) {
      c2 = yang ? kegs[2].x : k1.x;
      c3 = LiurenCore.XING_MAP[c2] || chong(c2);          /* 规范：取中传之刑或冲 */
    } else {
      c2 = LiurenCore.XING_MAP[c1] || c1;
      c3 = LiurenCore.XING_MAP[c2] || c2;
    }
    return mk('伏吟', c1, c2, c3);
  }
  /* 返吟（规范 §9） */
  if (fanYin) {
    if (down.length + up.length > 0 || haoshi.length > 0 || danshe.length > 0) {
      let c1;
      if (down.length === 1) c1 = kegs[down[0]].x;                       /* 贼克法（重审） */
      else if (down.length === 0 && up.length === 1) c1 = kegs[up[0]].x;
      else if (down.length + up.length >= 2) {
        if (bi.length === 1) c1 = kegs[bi[0]].x;
        else c1 = sheHaiPick(bi.length > 0 ? bi : ks, kegs, tp, dg);
      } else if (haoshi.length > 0) {
        const p = haoshi.filter((i) => !!LiurenCore.YANG_ZHI[kegs[i].x] === yang);
        c1 = kegs[(p.length ? p : haoshi)[0]].x;
      } else {
        c1 = kegs[danshe[0]].x;
      }
      return mk('返吟', c1, chuanOf(c1), chuanOf(chuanOf(c1)));
    }
    const c1 = LiurenCore.JINGLAN_SHE[kegs[2].s] || kegs[2].x;
    return mk('返吟', c1, kegs[2].x, kegs[0].x);            /* 规范：中取日支上神、末取日干上神 */
  }
  /* 八专（规范 §7，四课 2 课、干支同位、无贼克无遥克） */
  if (baZhuan && nUniq === 2 && down.length + up.length === 0 && haoshi.length === 0 && danshe.length === 0) {
    const base = yang ? kegs[0].x : kegs[2].x;
    const idx = Z.indexOf(base);
    const c1 = yang ? Z[(idx + 2) % 12] : Z[(idx - 2 + 12) % 12];   /* 规范：顺/逆数「3 个神煞」（含起点） */
    return mk('八专', c1, kegs[0].x, kegs[0].x);
  }
  /* 别责（规范 §6，四课 3 课、无贼克无遥克） */
  if (nUniq === 3 && down.length + up.length === 0 && haoshi.length === 0 && danshe.length === 0) {
    let c1;
    if (yang) c1 = chuanOf(LiurenCore.JI_GONG[LiurenCore.HE_GAN[dg]] || '');
    else c1 = chuanOf(LiurenCore.QIAN_SANHE[kegs[2].s] || kegs[2].s);
    return mk('别责', c1, kegs[0].x, kegs[0].x);
  }
  /* 贼克 / 比用 / 涉害（规范 §1-3） */
  if (down.length === 1) return mk('重审', kegs[down[0]].x, chuanOf(kegs[down[0]].x), chuanOf(chuanOf(kegs[down[0]].x)));
  if (down.length === 0 && up.length === 1) return mk('元首', kegs[up[0]].x, chuanOf(kegs[up[0]].x), chuanOf(chuanOf(kegs[up[0]].x)));
  if (down.length + up.length >= 2) {
    if (bi.length === 1) { const c1 = kegs[bi[0]].x; return mk('比用', c1, chuanOf(c1), chuanOf(chuanOf(c1))); }
    const c1 = sheHaiPick(bi.length > 0 ? bi : ks, kegs, tp, dg);
    return mk('涉害', c1, chuanOf(c1), chuanOf(chuanOf(c1)));
  }
  /* 遥克（规范 §4） */
  if (haoshi.length > 0) {
    const p = haoshi.filter((i) => !!LiurenCore.YANG_ZHI[kegs[i].x] === yang);
    const c1 = kegs[(p.length ? p : haoshi)[0]].x;
    return mk('遥克·蒿矢', c1, chuanOf(c1), chuanOf(chuanOf(c1)));
  }
  if (danshe.length > 0) {
    const c1 = kegs[danshe[0]].x;
    return mk('遥克·弹射', c1, chuanOf(c1), chuanOf(chuanOf(c1)));
  }
  /* 昴星（规范 §5） */
  const c1 = LiurenCore.maoxingFirst(tp, yang);
  const ganShang = tp[ji], zhiShang = tp[kegs[2].s];
  return mk('昴星', c1, yang ? zhiShang : ganShang, yang ? ganShang : zhiShang);
}

/** 涉害：顺数取深 → 复等（孟/仲/季，缀瑕按阳日干上神、阴日支上神） */
function sheHaiPick(cand, kegs, tp, dg) {
  const yang = yangGanOf(dg);
  const zhiOf = (s) => (isGan(s) ? LiurenCore.JI_GONG[s] : s);
  const items = cand.map((i) => {
    const shang = kegs[i].x;
    const gong = LiurenCore.gongOf(tp, shang);         /* 上神所临地盘宫 */
    let cnt = 0, cur = Z.indexOf(gong);
    for (let n = 0; n < 12; n++) {
      if (ke(Z[cur], shang)) cnt++;
      if (Z[cur] === shang) break;
      cur = (cur + 1) % 12;                            /* 规范：顺数 */
    }
    return { shang: shang, cnt: cnt };
  });
  const max = Math.max(...items.map((x) => x.cnt));
  const top = items.filter((x) => x.cnt === max);
  if (top.length === 1) return top[0].shang;
  let pool = top.filter((x) => MENG.indexOf(x.shang) >= 0);
  if (!pool.length) pool = top.filter((x) => ZHONG.indexOf(x.shang) >= 0);
  if (!pool.length) pool = top;                         /* 缀瑕 */
  if (pool.length === 1) return pool[0].shang;
  const fallback = yang ? kegs[0].x : kegs[2].x;        /* 阳日取日上神、阴日取辰上神 */
  const hit = pool.filter((x) => x.shang === fallback);
  return hit.length ? hit[0].shang : pool[0].shang;
}

/* ---------------- 全枚举对账 ---------------- */
const diffs = new Map();   /* key: 宗门 + 项 → count */
const samples = new Map();
let total = 0, bad = 0;
for (const dg of GANS) {
  for (const dz of ZHI) {
    for (const mj of ZHI) {
      for (const hour of ZHI) {
        const c = LiurenCore.buildChartAncient(mj, dg, dz, hour, '', '', '');
        if (!c) continue;
        total++;
        const ref = specRef(dg, dz, c.tp, c.kegs);
        const eng = c.sanchuan;
        const engCh = eng.chuans.map((x) => x.z);
        const items = [];
        if (eng.method !== ref.method) items.push({ k: '宗门', e: eng.method, r: ref.method });
        ['初传', '中传', '末传'].forEach((nm, i) => {
          if (engCh[i] !== ref.chuans[i]) items.push({ k: nm, e: engCh[i], r: ref.chuans[i] });
        });
        if (!items.length) continue;
        bad++;
        items.forEach((it) => {
          const key = it.k + '@' + eng.method;
          diffs.set(key, (diffs.get(key) || 0) + 1);
          if (!samples.has(key)) samples.set(key, dg + dz + '日 ' + mj + '将 ' + hour + '时  引擎 ' + it.e + ' / 规范 ' + it.r);
        });
      }
    }
  }
}

console.log('三传规范符合性对账（规范：大六壬指南四课三传三传排法）');
console.log('  枚举盘数：' + total + '   与规范不一致：' + bad + '（' + (100 * bad / total).toFixed(1) + '%）\n');
if (!bad) { console.log('全部一致 ✓'); process.exit(0); }
const rows = [...diffs.entries()].sort((a, b) => b[1] - a[1]);
console.log('  不一致分类            次数   示例');
for (const [k, n] of rows) {
  console.log('  ' + k.padEnd(20) + String(n).padStart(6) + '   ' + (VERBOSE ? samples.get(k) : ''));
}
process.exit(1);

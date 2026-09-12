/* 三传（九宗门）规范符合性对账：规范参考实现 ↔ 引擎
 * ----------------------------------------------------------------------------
 * 规范真源：大六壬文档/排盘/大六壬指南的四课三传的三传排法.md
 * 做法：把规范逐条实现成参考实现（本文件内），与引擎的 resolveSanchuan 在全枚举上对比（实际 17280 盘：
 *       10 日干 × 12 日支 × 12 月将 × 12 占时）；逐盘比「宗门名 / 初传 / 中传 / 末传」。
 *       参考实现不调用引擎的取用封装（昴星独立写为 tp['酉'] / gongOf(tp,'酉')），避免循环校验。
 * 另附传本锚点断言（《六壬断案》88 / 165 / 93 + 《中黄五变经》乙亥/丙子/辛酉涉害三例
 *       + 2026-09-12 涉害口径订正后新增的 5 处：《六壬断案》180 / 181 / 143(=183)、
 *       《六壬指南注解》占验三十二、《中黄五变经》癸卯日例，原文行号见文件末尾 ANCHORS）：
 *       期望值取自古籍原文课式图，与参考实现相互独立，两侧必须同时通过。
 * 涉害取用口径（2026-09-12 按《六壬指南》订正）：**先判所临地盘宫 孟（见机）→ 仲（察微）→ 季 档，
 *       档内再取涉害最深者，仍相等则缀瑕**。原文：《六壬指南》第 24 行「先以寅申巳亥上乘之神为用……
 *       若孟神上无克贼则以子午卯酉上乘之神为用」；《六壬指南注解》第 37 行「涉害取法，只以孟仲季为准，
 *       不以涉害深浅为义，此《指南》所用之法，切记！」；《六壬经纬》第 58 行；传本课例 5 处（ANCHORS）。
 *       并存之另一派「取深优先」（《六壬大全》3640/3642 行本文与算例、《御定六壬直指》、《心镜》、
 *       《神定经》、《粹言》正文、《金铰剪》例1）与本次口径在 17280 盘中 360 盘结论不同
 *       （「正月丁卯日丑时亥将」与「癸卯日丑将卯时」天盘与候选全同而两派相反），已并列登记于
 *       `_tests/_data/sanchuan_kaiyi.json` 与规范文档 §3 校勘注二——**不得为迁就任何个别课例写死个案**。
 * 用法：node _tests/_test_sanchuan_spec.js [--verbose]
 * 退出码：存在不一致或锚点未过即 1（便于当门禁用）。
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
  /* 八专（规范 §7）：四课 2 课、干支同位、无贼克。
     规范 §7 判定条件只写「且无贼克」，未写「无遥克」；四课既已不全（二课），不复取遥克：
     有贼克仍走贼克/比用/涉害（见下文 §1-3），无贼克即取八专。
     传本佐证：《六壬断案》88）甲寅日未将戌时（第2/3/4课上神申遥克日干）原文仍标「八专」、
             三传 丑/亥/亥；165）甲寅日未将卯时（上神戌为日干所克）原文仍标「八专」、三传 申/午/午。 */
  if (baZhuan && nUniq === 2 && down.length + up.length === 0) {
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
  /* 昴星（规范 §5）：独立实现，不调用引擎的任何取用封装
     阳日（虎视转蓬）＝地盘「酉」位对应的上神（tp[酉]）；
     阴日（冬蛇掩目）＝天盘「酉」位对应的下神（gongOf 反查：天盘酉所压之地盘支） */
  const c1 = yang ? tp['酉'] : LiurenCore.gongOf(tp, '酉');
  const ganShang = tp[ji], zhiShang = tp[kegs[2].s];
  return mk('昴星', c1, yang ? zhiShang : ganShang, yang ? ganShang : zhiShang);
}

/** 涉害（规范 §3；2026-09-12 按《六壬指南》订正为「孟仲季优先」）：
 *  一/二/三：先按「上神所临地盘宫」分档——孟（见机）→ 仲（察微）→ 无孟无仲时档内即全部候（季档）；
 *  四：档内候多于一个时，取涉害最深者（自所临地盘宫顺数地盘、止于本家，计地盘支克上神之数）；
 *  五：仍相等 → 缀瑕（阳日取日上神、阴日取辰上神）。 */
function sheHaiPick(cand, kegs, tp, dg) {
  const yang = yangGanOf(dg);
  const items = cand.map((i) => {
    const shang = kegs[i].x;
    const gong = LiurenCore.gongOf(tp, shang);         /* 上神所临地盘宫 */
    let cnt = 0, cur = Z.indexOf(gong);
    for (let n = 0; n < 12; n++) {
      if (ke(Z[cur], shang)) cnt++;
      if (Z[cur] === shang) break;
      cur = (cur + 1) % 12;                            /* 规范：顺数地盘，止于本家 */
    }
    return { shang: shang, cnt: cnt, gong: gong };
  });
  let pool = items.filter((x) => MENG.indexOf(x.gong) >= 0);                 /* 见机：所临地盘宫属孟 */
  if (!pool.length) pool = items.filter((x) => ZHONG.indexOf(x.gong) >= 0);  /* 察微：属仲 */
  if (!pool.length) pool = items;                                           /* 季档：无孟无仲 */
  const max = Math.max(...pool.map((x) => x.cnt));                          /* 档内取深 */
  const top = pool.filter((x) => x.cnt === max);
  if (top.length === 1) return top[0].shang;
  const fallback = yang ? kegs[0].x : kegs[2].x;        /* 缀瑕：阳日取日上神、阴日取辰上神 */
  const hit = top.filter((x) => x.shang === fallback);
  return hit.length ? hit[0].shang : top[0].shang;
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
console.log('  枚举盘数：' + total + '   与规范不一致：' + bad + '（' + (100 * bad / total).toFixed(1) + '%）');
if (!bad) {
  console.log('  全枚举与规范一致 ✓');
} else {
  console.log('');
  const rows = [...diffs.entries()].sort((a, b) => b[1] - a[1]);
  console.log('  不一致分类            次数   示例');
  for (const [k, n] of rows) {
    console.log('  ' + k.padEnd(20) + String(n).padStart(6) + '   ' + (VERBOSE ? samples.get(k) : ''));
  }
}

/* ---------------- 传本锚点断言（原文可核；与上文规范参考实现相互独立） ----------------
   古籍原文：大六壬文档/古籍原文-易藏-术数/六壬断案-宋-邵彦和/六壬断案-宋-邵彦和.utf8.txt
   《中黄五变经》经文：大六壬文档/中黄五变经/经文/（涉害「复等→见机/察微」判所临地盘宫孟/仲的口径锚点，
   这四例曾把旧实现（判上神自身孟/仲）打回；改动此口径必须先过这四例） */
const ANCHORS = [
  {
    tag: '断案88 甲寅日未将戌时',
    mj: '未', dg: '甲', dz: '寅', hour: '戌',
    method: '八专', chuans: ['丑', '亥', '亥'],
    src: '断案第893行「88）王法司……戊申年六月甲寅日未将戌时。……八专，寡宿，闭口」；'
       + '课式图三传：财 空丑 空 初／父 癸亥 常 中／父 癸亥 常 末（本盘上神申遥克日干甲，原文仍作八专）'
  },
  {
    tag: '断案165 甲寅日未将卯时',
    mj: '未', dg: '甲', dz: '寅', hour: '卯',
    method: '八专', chuans: ['申', '午', '午'],
    src: '断案第1681行「165）王县丞……戊申年六月甲寅日未将卯时。……八专，帷簿，励德」；'
       + '课式图三传：鬼 庚申 龙 初／子 戊午 虎 中／子 戊午 虎 末（本盘上神戌为日干甲所克，原文仍作八专）'
  },
  {
    tag: '断案93 丁未日午将子时',
    mj: '午', dg: '丁', dz: '未', hour: '子',
    method: '返吟', chuans: ['巳', '丑', '丑'],
    src: '断案第945行「93）童巡检……己酉年八月丁未日午将子时。……反吟，八专，井栏射，励德」；'
       + '课式图三传：兄 乙巳 常 初／子 癸丑 陈 中／子 癸丑 陈 末'
  },
  {
    tag: '中黄·乙亥日丑将巳时（涉害·复等取地盘孟位）',
    mj: '丑', dg: '乙', dz: '亥', hour: '巳',
    method: '涉害', chuans: ['未', '卯', '亥'],
    src: '《中黄五变经》经文 16.释官讼门第十六.md 第218行「假令壬子人十一月将乙亥日巳时占」；'
       + '该文件第227-232行三传表：初 未／中 卯／末 亥。'
       + '本课下贼无、上克下在课3（未/亥）与课4（卯/未），比用留未、卯；二者涉害深浅相等（各 2），'
       + '复等须判「上神所临地盘宫」：未临地盘亥（孟）、卯临地盘未（季）→ 取孟＝未（见机）。'
  },
  {
    tag: '中黄·丙子日丑将午时（涉害·复等取地盘孟位）',
    mj: '丑', dg: '丙', dz: '子', hour: '午',
    method: '涉害', chuans: ['子', '未', '寅'],
    src: '《中黄五变经》经文 8.论人形貌第八.md 第88行「假令十一月将丙子日午时」；'
       + '该文件第97-102行三传表：初 子／中 未／末 寅。'
       + '本课上克下四课全，比用留子、寅；二者涉害深浅相等（各 2），'
       + '复等判所临地盘宫：子临地盘巳（孟）、寅临地盘未（季）→ 取孟＝子（见机）。'
  },
  {
    tag: '中黄·辛酉日丑将申时（涉害·深浅不等，须取深）',
    mj: '丑', dg: '辛', dz: '酉', hour: '申',
    method: '涉害', chuans: ['未', '子', '巳'],
    src: '《中黄五变经》经文 16.释官讼门第十六.md 第111行「假令乙巳人十一月将辛酉日申时」；'
       + '该文件第120-125行三传表：初 未／中 子／末 巳。'
       + '本课下贼在课1（卯/辛）、课3（寅/酉）、课4（未/寅），上克下在课2（申/卯）；'
       + '比用按阴日留卯、未；被取材的 未 同时是「涉害最深」（受克 2 > 卯 0）且「临孟」（未临地盘寅）。'
       + '注：此例**两派同解**（取深派取未、孟仲季派亦取未），不能据以判别两派口径，'
       + '旧注「复等不得以孟压过取深」属过度推断，已撤。'
  },
  {
    tag: '断案180 己卯日亥将未时（涉害·孟仲季优先）',
    mj: '亥', dg: '己', dz: '卯', hour: '未',
    method: '涉害', chuans: ['未', '亥', '卯'],
    src: '断案第1901行「188)某占失羊，己卯日亥将未时。（申酉空亡，子丑落空），渉害，比用，曲直，乱首，不备。」；'
       + '第1904-1906行三传：兄 癸未 龙 初／财 乙亥 蛇 中／鬼 己卯 玄 末；'
       + '第1908行释文「春占曲直课，未加卯作龙为用，其羊不失」与初传未乘青龙互证，'
       + '课体「曲直」即亥卯未木局。候选：亥临地盘未（季、受克2）与未临地盘卯（仲、受克1）'
       + '——取深派取亥、孟仲季派取未，**书取未**。'
  },
  {
    tag: '断案181 甲辰日戌将寅时（涉害·孟仲季优先）',
    mj: '戌', dg: '甲', dz: '辰', hour: '寅',
    method: '涉害', chuans: ['戌', '午', '寅'],
    src: '断案第1911行「189）某占失狗，甲辰日戌将寅时。（寅卯空亡，戌亥落空），渉害，炎上，狡童，斩关。」；'
       + '第1914-1916行三传：财 庚戌 六 初／子 丙午 后 中／兄 空寅 虎 末；'
       + '第1918行释文「戌为类神，加日」「寅反作虎在未传克戌」；课体「炎上」即寅午戌火局。'
       + '候选：戌临地盘寅（孟、受克2）与子临地盘辰（季、受克3）'
       + '——取深派取子（→润下局，与书自标课体「炎上」互斥）、孟仲季派取戌，**书取戌**。'
  },
  {
    tag: '断案143(=183) 癸卯日寅将辰时（涉害·孟仲季优先）',
    mj: '寅', dg: '癸', dz: '卯', hour: '辰',
    method: '涉害', chuans: ['丑', '亥', '酉'],
    src: '断案第1530行「150）曹将仕……己酉年癸卯日寅将辰时。……渉害，极阴，间传，循环。」'
       + '与第1930行「191）某占捕逃有罪人，己酉年十月癸卯日寅将辰时。……渉害，极阴。」'
       + '（同一课两处记载、三传相同）；两处三传行皆作：官/鬼 辛丑 陈 初／兄 己亥 空 中／父 丁酉 常 末。'
       + '第1937行释文「此课干来加支，即发用」（癸寄丑、丑临卯，故丑即发用）直证初传为丑。'
       + '候选：丑临地盘卯（仲、受克1）与亥临地盘丑（季、受克4）'
       + '——取深派取亥、孟仲季派取丑，**书取丑**。'
  },
  {
    tag: '指南注解占验三十一 癸酉日戌将卯时（涉害·孟仲季优先）',
    mj: '戌', dg: '癸', dz: '酉', hour: '卯',
    method: '涉害', chuans: ['卯', '戌', '巳'],
    src: '《六壬指南注解》明·陈公献 第1701行「占验三十一、辛卯三月癸酉日乙卯时……涉害、斩关，戌亥空、巳午落空」；'
       + '第1703-1705行三传：子 卯 朱 初／官 戌 虎 中／财 巳 贵 末'
       + '（六亲 子孙/官鬼/妻财 于癸水日相符、与旬遁亦合）。'
       + '课式环行「龙 子丑寅卯 朱」＝天盘子临地盘巳 → 位移 7、月将戌（占时卯）；'
       + '四课 申/癸 卯/申 辰/酉 亥/辰 与书逐位相同。'
       + '候选：卯临地盘申（孟、受克2）与亥临地盘辰（季、受克3）'
       + '——取深派取亥、孟仲季派取卯，**书取卯**。'
  },
  {
    tag: '中黄·癸卯日丑将卯时（涉害·孟仲季优先；即 sanchuan_kaiyi.json 结案例）',
    mj: '丑', dg: '癸', dz: '卯', hour: '卯',
    method: '涉害', chuans: ['丑', '亥', '酉'],
    src: '《中黄五变经》经文 16.释官讼门第十六.md 第183行「假令壬子人十一月将癸卯日卯时占」；'
       + '书上三传 丑/亥/酉，课文「此课初传丑为勾陈，加卯建得癸丑为木临门」。'
       + '本科与《六壬大全》第3642行所举「正月丁卯日丑时亥将」天盘、涉害候选完全相同'
       + '（丑临地盘卯仲受克1／亥临地盘丑季受克4），而两书答案相反（大全 亥酉未／中黄 丑亥酉）'
       + '——本锚点即「孟仲季优先」派的书证，与并存之「取深优先」派互斥，详见规范文档 §3 校勘注二。'
  },
  {
    tag: '指南注解占验三十二 己亥日亥将未时（涉害·孟仲季优先）',
    mj: '亥', dg: '己', dz: '亥', hour: '未',
    method: '涉害', chuans: ['未', '亥', '卯'],
    src: '《六壬指南注解》明·陈公献 第1712行「占验三十二、癸未正月己亥日辛未时……涉害、曲直、回环」；'
       + '第1714-1716行三传：比 乙未 青 初／财 己亥 蛇 中／鬼 癸卯 玄 末'
       + '（遁干 乙/己/癸 与己亥日旬遁逐字相符，三重自证三传无误）。'
       + '天盘位移 4（正月亥将、辛未时），四课 亥/己 卯/亥 卯/亥 未/卯 与书逐位相同；'
       + '候选：亥临地盘未（季、受克2）与未临地盘卯（仲、受克1）；'
       + '第1719行释文「龙神发用，传课结成官局」与「未乘青龙」互证初传未（书自标天将未宫＝青龙）。'
       + '——取深派取亥、孟仲季派取未，**书取未**；本项目规范真源（《六壬指南》）自家占例即此口径。'
  }
];
console.log('\n传本锚点：');
let anchorBad = 0;
for (const a of ANCHORS) {
  const c = LiurenCore.buildChartAncient(a.mj, a.dg, a.dz, a.hour, '', '', '');
  const got = c ? c.sanchuan.chuans.map((x) => x.z).join('/') : '(空盘)';
  const gotM = c ? c.sanchuan.method : '(空盘)';
  const exp = a.chuans.join('/');
  const ok = got === exp && gotM === a.method;
  if (!ok) anchorBad++;
  console.log('  ' + (ok ? 'PASS ' : 'FAIL ') + a.tag + ' → ' + gotM + ' ' + got + '（原文 ' + a.method + ' ' + exp + '）');
  if (!ok) console.log('        出处：' + a.src);
}
console.log('\n  锚点：' + (ANCHORS.length - anchorBad) + '/' + ANCHORS.length + (anchorBad ? ' 未全过' : ' 全过 ✓'));
process.exit(bad === 0 && anchorBad === 0 ? 0 : 1);

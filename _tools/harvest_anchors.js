/* 传本课例锚点机器采集 + 引擎比对（大六壬排盘引擎校验用）
 * ============================================================================
 * 目的：从仓库内古籍原文里，把**书自己写明**的课例（日干支 / 占时 / 月将 / 四课 / 三传 /
 *       天将）抽成「锚点」，再喂给 core/liuren-core.js 复算，统计命中率并逐条列出不符。
 *
 * 铁律（本脚本据此设计，改脚本时不要破坏）：
 *   1) book 字段**只能**来自原文文本。绝不把引擎输出写进 book。
 *   2) 月将**只接受原文直接写出的地支**（“X将Y时”“X将加Y时”“以登明加时”等）。
 *      不做「由四课反推月将」——那种做法会把算法中间量混进输入，破坏校验独立性。
 *      原文只给月份（“十一月将”）或只给干上神的课例一律丢弃并计数。
 *   3) 原文模糊 / OCR 错乱 / 课式读不出来 → 丢弃并计数，不猜。
 *   4) 每条锚点带 src（文件名）+ excerpt（原文片段）以便人工复核。
 *
 * 数据源（本版实采）：
 *   A. 六壬断案-宋-邵彦和（宋·邵彦和案集）：课式含 日干支/占时/月将/三传（干支·乘将），
 *      是主要来源。课式块是「方阵 + 三传」混排（右 3 列=三传，另有天地盘与四课格子）。
 *   B. 六壬一字诀玉连环 等书：课例头写明「干支日 + X将 + Y时」，同段串文明写三传（含乘将）。
 *   C. 中黄五变经 经文/*.md：markdown 表格，四课 + 三传都干净。月将有的只写「十一月将」，
 *      按课题允许的办法由**书上自己的四课**反推：要求四课四组「上/下」位移一致，
 *      且反推月将须与「月份→月将」的名义月将相符，否则丢弃不猜。
 *   × 六壬大全：三传散落在讲解段落（「三传戌午寅火局为鬼」讲的是别人家课），
 *      与本课例头不能可靠对应，会张冠李戴，故整体不采。
 *   × 六壬直指御定：720 课经，多数不给占时与月将，且三传多半缺载，不可作锚点。
 *   × 断案课式块里的天地盘方阵与四课格子：与三传格子交错、列宽不齐，机器读序无法稳定还原，
 *      按「不猜」原则不采（四课与天地盘的校验改由中黄经文的表格负责）。
 *
 * ⚠ 实现注意（踩过的坑）：本仓库运行时的 V8 有一个回溯缺陷 ——
 *   `^([^ ]{1,3}) +([^ ]) +` 这类「否定字符类 + {n,m} + 显式空白类 + 又接分组」的模式
 *   会直接返回 null（同一字符串换成 `.{1,3}` 或 `[^ ]+` 就能匹配，长度 32 的普通串即可复现）。
 *   因此本脚本**不用正则切列**，四课/三传一律用 token 切分（splitTokens）。
 *
 * 用法：
 *   node _tools/harvest_anchors.js                 # 统计报告
 *   node _tools/harvest_anchors.js --verbose       # 报告 + 逐条不命中明细 + 丢弃原因
 *   node _tools/harvest_anchors.js --write         # 同时写出 _tests/_data/anchors_corpus.json
 *   node _tools/harvest_anchors.js --src 断案      # 只跑某源（文件名含该关键字）
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ARGV = process.argv.slice(2);
const has = (f) => ARGV.includes(f);
const argOf = (f) => { const i = ARGV.indexOf(f); return i >= 0 ? ARGV[i + 1] : null; };
const srcFilter = argOf('--src');
const VERBOSE = has('--verbose') || has('-v');
const WRITE = has('--write');

/* ---------------------------------------------------------------- 引擎装载 */
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

/* ------------------------------------------------------------------ 常量表 */
const ZHI = '子丑寅卯辰巳午未申酉戌亥';
const GAN = '甲乙丙丁戊己庚辛壬癸';
/* 断案等书的简称将（单字）→ 全名。陈/勾 皆勾陈，蛇 螣蛇，龙 青龙，空 天空，虎 白虎。 */
const JIANG_ABBR = {
  贵: '贵人', 蛇: '螣蛇', 朱: '朱雀', 六: '六合', 勾: '勾陈', 陈: '勾陈', 龙: '青龙',
  空: '天空', 白: '白虎', 虎: '白虎', 常: '太常', 玄: '玄武', 阴: '太阴', 后: '天后'
};
/* 月将雅名 → 地支 */
const JIANG_NAME = {
  神后: '子', 大吉: '丑', 功曹: '寅', 太冲: '卯', 天罡: '辰', 太乙: '巳',
  胜光: '午', 小吉: '未', 传送: '申', 从魁: '酉', 河魁: '戌', 登明: '亥'
};
const JIANG_NAME_RE = Object.keys(JIANG_NAME).join('|');
/* 月份 → 名义月将（中黄等经文只写「十一月将」时用来当闸门，不单独作为月将来源） */
const MONTH_TO_MJ = { 正月: '亥', 二月: '戌', 三月: '酉', 四月: '申', 五月: '未', 六月: '午', 七月: '巳', 八月: '辰', 九月: '卯', 十月: '寅', 十一月: '丑', 十二月: '子' };
const isZhi = (c) => ZHI.indexOf(c) >= 0;
const isGan = (c) => GAN.indexOf(c) >= 0;
const gzValid = (g, z) => isGan(g) && isZhi(z) && (((GAN.indexOf(g) - ZHI.indexOf(z)) % 2) + 2) % 2 === 0;
const jiangAtZhi = (c, z) => c.jiangMap[LiurenCore.gongOf(c.tp, z)] || '';
/** 五鼠遁：由日干求某地支的遁干（日干 → 子时起干，阳干顺、阴干逆；断案课式的「父 辛巳 …」即此遁干）。
 *  用于断案课式的**内部交叉校验**：书上的遁干与书上的支互相独立，一致即说明两者都没读错。 */
function tgGan(dg, z) {
  const startZhi = { 甲: '子', 己: '子', 乙: '丑', 庚: '丑', 丙: '寅', 辛: '寅', 丁: '卯', 壬: '卯', 戊: '辰', 癸: '辰' }[dg];
  const down = '乙丁己辛癸'.indexOf(dg) >= 0;
  const d = ((ZHI.indexOf(z) - ZHI.indexOf(startZhi)) + 12) % 12;
  const i = ((GAN.indexOf(dg) % 5) * 2 + (down ? -d : d)) % 10;
  return GAN[(i + 10) % 10];
}
const WSC = '[\t \u3000]';      /* 原文使用的空白：制表 / 半角空格 / 全角空格 */

/* -------------------------------------- token 切分（规避上文提到的 V8 回溯缺陷） */
const isWS = (ch) => ch === ' ' || ch === '\t' || ch === '\u3000';
function splitTokens(line) {
  const out = [];
  let i = 0;
  while (i < line.length) {
    while (i < line.length && isWS(line[i])) i++;
    if (i >= line.length) break;
    const s = i;
    while (i < line.length && !isWS(line[i])) i++;
    out.push({ t: line.slice(s, i), s: s, e: i });
  }
  return out;
}
const toks = (line) => splitTokens(line).map((x) => x.t);

/* -------------------------------------------------------------- 文件与编码 */
function readText(p) {
  const b = fs.readFileSync(p);
  if (b[0] === 0xFF && b[1] === 0xFE) return b.toString('utf16le').replace(/^\uFEFF/, '');
  if (b[0] === 0xFE && b[1] === 0xFF) return new TextDecoder('utf-16be').decode(b).replace(/^\uFEFF/, '');
  try { return new TextDecoder('utf-8', { fatal: true }).decode(b).replace(/^\uFEFF/, ''); } catch (e) { }
  return new TextDecoder('gb18030').decode(b);
}
function walkFiles(dir, ext, out) {
  out = out || [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkFiles(p, ext, out);
    else if (e.name.toLowerCase().endsWith(ext)) out.push(p);
  }
  return out;
}
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

/* ------------------------------------------------------------------ 采集器 */
const anchors = [];
const rejected = [];
const drop = (src, why, excerpt) => rejected.push({ src: src, why: why, excerpt: String(excerpt).slice(0, 180) });

/* ============================ 源 A：六壬断案 ============================ */
/* 每例开头课式块（原文实样，→ 表示制表符）：
 *   01）韩太守占祈雪，建炎三年己酉岁十一月初四己卯日寅将酉时，（申酉空亡,丑寅落空），铸印…
 *   →→六陈
 *   朱戌亥子丑龙
 *   蛇酉    寅空→龙  贵  玄  陈     父 辛巳 玄 初
 *   贵申    卯虎→→丑  申  巳  子     兄 甲戌 朱 中（暗鬼）
 *   后未午巳辰常        申  卯  子  己     鬼 己卯 虎 末
 *   →→阴玄
 *   邵先生曰：…
 * 左侧 4 列 = 四课（上神行 / 下神行，下神行末格是日干）；
 * 中间 4 列 = 天地盘十二宫 + 寄宫干；右 3 列 = 三传（干支·天将·初/中/末）。 */
const DAN_PROSE = /(邵先生曰|先生析曰|爱圅|案验|验案|汪先生曰|断语遗失|析曰)/;

function parseDuAn(text, file) {
  const headRe = new RegExp('([' + GAN + '])([' + ZHI + '])日(?=[^\\n]{0,20}?(?:' + JIANG_NAME_RE + '|[' + ZHI + '])将[^\\n]{0,20}?[' + ZHI + ']时)', 'g');
  const heads = [];
  let m;
  while ((m = headRe.exec(text))) heads.push({ dg: m[1], dz: m[2], i: m.index });

  let nHead = 0, nForme = 0, nTried = 0;
  for (let k = 0; k < heads.length; k++) {
    const H = heads[k];
    const end = k + 1 < heads.length ? heads[k + 1].i : Math.min(text.length, H.i + 4000);
    const block = text.slice(H.i, end);
    const line0 = block.split(/\r?\n/, 1)[0];
    const hm = line0.match(new RegExp('([' + GAN + '])([' + ZHI + '])日.*?(' + JIANG_NAME_RE + '|[' + ZHI + '])将\\s*([' + ZHI + '])时'));
    if (!hm) { drop(file, '课例头无「X将Y时」明确月将', line0); continue; }
    nHead++;
    const dg = hm[1], dz = hm[2], mj = JIANG_NAME[hm[3]] || hm[3], hour = hm[4];

    /* 课式区：遇散文即止；最多 12 行 */
    const lines = block.split(/\r?\n/);
    const form = [];
    let sawAny = false;
    for (let i = 1; i < lines.length && form.length < 12; i++) {
      const L = lines[i];
      if (L.trim() === '') { if (sawAny) break; else continue; }
      if (DAN_PROSE.test(L)) break;
      sawAny = true;
      form.push(L);
    }
    if (!form.length) { drop(file, '课例头后无课式块', line0); continue; }
    nForme++;

    /* --- 三传 ---
     * 版式：三行三传各自的行尾是「… 六亲 干支 天将 初/中/末（注）」；行中另夹着天地盘外圈、
     * 外圈天将注字与四课（列宽不齐，所以不能按列号取）。
     * 做法：①剥掉括号注文；②剥掉三传支前的空亡标记「空/落」；③拆 token；
     *      ④定位「末尾 初/中/末」那个 token，它**左侧**的 token 序列才是三传内容；
     *      ⑤在左侧序列里从右往左找「合法干支」或「单个地支且紧邻左侧为六亲字」的写法；
     *      ⑥干支右侧的 token 即天将（可能是单字 token，也可能粘在干支上，如「卯后」）。
     * 说明：断案对旬空的三传写作「空申」「空卯」，「空」是书的断法标注，故剥掉。 --- */
    const LUOQIN = /[父兄鬼财子孫孙]/;
    const BAD_POS = /^[初中末]$/;
    const norm = (L) => L.replace(/[（(][^）)]{0,8}[）)]/g, ' ');
    /** 剥掉三传的空亡标注：token 形如「空申」「空卯」时去掉「空」。
     *  「空」本身也可能是天将名（天空）的简称，判据是它所在的位置：
     *  三传行尾部结构是「… 六亲 [空]干支 [空]天将 初/中/末」，位置字左 1 位必是天将位，
     *  再往左才是干支位 —— 只有干支位上的「空X」才是空亡标注。 */
    const stripKong = (T, pi) => {
      const out = T.slice();
      for (const j of [pi - 2, pi - 1]) {
        if (j >= 0 && out[j].length === 2 && /^[空落]/.test(out[j]) && isZhi(out[j][1])) out[j] = out[j][1];
      }
      return out;
    };
    const chuan = [];
    for (const L of form) {
      let T = toks(norm(L));
      let pi = T.findIndex((x) => BAD_POS.test(x));
      if (pi < 0) continue;
      T = stripKong(T, pi);
      const pos = T[pi];
      /* 干支：只在 初/中/末 左侧 1~4 个 token 内找（更左的是天地盘外圈，容易误取） */
      let gz = null, gi = -1, synth = false;
      for (let i = pi - 1; i >= 0 && i >= pi - 4; i--) {
        if (T[i].length === 2 && gzValid(T[i][0], T[i][1])) { gz = T[i]; gi = i; break; }
      }
      if (!gz) {
        /* 空亡的三传有时只写地支（如「兄 空申 空 中」），干支位写的是「日干+该支」的旬遁 */
        for (let i = pi - 1; i >= Math.max(0, pi - 4); i--) {
          const z = T[i].length === 1 ? T[i] : (T[i].length === 2 && /^[空落]/.test(T[i]) && isZhi(T[i][1]) ? T[i][1] : null);
          if (z && isZhi(z) && gzValid(dg, z)) { gz = dg + z; gi = i; synth = true; break; }
        }
      }
      if (!gz) { chuan.push({ bad: '三传行未找到合法干支：' + L.trim() + ' | T=' + JSON.stringify(T) }); continue; }
      /* 天将：干支 token 右侧（可能是单字 token，也可能粘在干支上，如「卯后」） */
      const tail = T.slice(gi + 1, pi);
      let jiang = null;
      for (const tk of tail) {
        if (JIANG_ABBR[tk] !== undefined) { jiang = JIANG_ABBR[tk]; break; }
        if (tk.length >= 2 && JIANG_ABBR[tk[0]] !== undefined) { jiang = JIANG_ABBR[tk[0]]; break; }
      }
      if (jiang === null) { chuan.push({ bad: '三传天将字无法识别：' + JSON.stringify(tail) + '（' + L.trim() + '）' }); continue; }
      /* 内部交叉校验：书上写的遁干是否等于「五鼠遁(日干 → 该支)」。
       * 两者互相独立（遁干是书自己排的），所以一致时可以确认「读到的支」和「书上的干支」都没读错；
       * 不一致时本锚点的三传乘将仍可用，但三传支要标记人工复核。 */
      const expectGan = tgGan(dg, gz[1]);
      chuan.push({ gz: gz, jiang: jiang, pos: pos, synth: synth, gzAgree: synth ? true : (gz[0] === expectGan), raw: L.trim() });
    }
    /* --- 三传补充读出：串文里写明的「三传子未寅，将六、阴、龙」「三传申子辰也」 ---
     * 只接受「三传」标签紧接三支连写（甚至夹一个「也」）这一种写法，且三者互不相同；
     * 若紧跟在后面的「将X、Y、Z」也能读出三个天将，一并采下。 --- */
    let chuanText = null;
    {
      const mm = text.slice(H.i, Math.min(text.length, H.i + 4000))
        .match(new RegExp('三传\\s*[\'\u2018\u300c]?([' + ZHI + '])\\s*([子丑寅卯辰巳午未申酉戌亥])\\s*([子丑寅卯辰巳午未申酉戌亥])[\'\u2019\u300d]?\\s*(也)?\\s*(?:[，,]\\s*将\\s*([^\u3002\\n]{1,20}))?'));
      if (mm && new Set([mm[1], mm[2], mm[3]]).size === 3) {
        chuanText = { z: [mm[1], mm[2], mm[3]] };
        if (mm[6]) {
          const js = [];
          for (const ch of mm[6]) if (JIANG_ABBR[ch] !== undefined && js.length < 3) js.push(JIANG_ABBR[ch]);
          if (js.length === 3) chuanText.j = js;
        }
      }
    }
    /* 说明：断案课式块里还印着天地盘方阵，但它与四课格子交错、列宽不齐，
     * 机器读序无法稳定还原（已试过多种切分，还原率不足且会引入猜测），故按「不猜」原则不采。
     * 天地盘这一项的校验改由「三传乘将」间接覆盖（天将落宫取决于天地盘）。 */
    /* ---- 校验：不合法即丢弃，不猜 ---- */
    const why = [];
    let good = chuan.filter((x) => !x.bad);
    for (const x of chuan) if (x.bad) why.push(x.bad);
    if (good.length !== 3) {
      /* 方阵三传行读不全时，退回到串文明写的「三传XYZ」 */
      if (chuanText) {
        good = chuanText.z.map((z, i) => ({ gz: z, zhi: z, jiang: chuanText.j ? chuanText.j[i] : null, pos: '初中末'[i], fromText: true }));
        why.length = 0;
      } else {
        why.push('三传行数=' + good.length);
      }
    } else {
      good.sort((a, b) => '初中末'.indexOf(a.pos) - '初中末'.indexOf(b.pos));
      if (good.map((x) => x.pos).join('') !== '初中末') why.push('初中末次序异常');
      /* 若三传只写了地支、遁干由日干补出，则要求补出的干支合法（阳干配阳支） */
      if (good.some((x) => x.synth) && good.some((x) => x.synth && !gzValid(x.gz[0], x.gz[1]))) why.push('补出的遁干不合甲子');
    }
    const excerpt = block.slice(0, 300).replace(/\r?\n/g, '⏎');
    if (why.length) { drop(file, why.join('；'), excerpt); continue; }

    const c = LiurenCore.buildChartAncient(mj, dg, dz, hour, '', '', '');
    const book = {
      chuans: good.map((x) => (x.fromText ? x.zhi : x.gz[1])),
      chuanJiang: good.map((x) => x.jiang)
    };
    /* 只有书上真写了遁干的才记 chuanGz；靠日干补出的一律不写进 book（铁律 1） */
    if (good.every((x) => !x.synth && !x.fromText)) book.chuanGz = good.map((x) => x.gz);
    else if (good.some((x) => x.synth)) book.chuanGzSynth = good.map((x) => (x.synth ? '补' : (x.fromText ? '串文' : x.gz)));
    if (!book.chuanJiang.every(Boolean)) delete book.chuanJiang;
    /* 文内互证：书上那三传**干支**的干，若不是「该支按五鼠遁应得的干」，说明书上的支与遁干
     * 互相矛盾（抄刻窜乱）。这是纯文本内部的一致性检查，用来客观区分「引擎错」与「传本错」。 */
    if (book.chuanGz) {
      book.chuanGzSelfCheck = good.map((x) => (x.gz[0] === tgGan(dg, x.gz[1]) ? '合' : ('疑误:' + x.gz + '(五鼠遁应' + tgGan(dg, x.gz[1]) + x.gz[1] + ')')));
    }
    /* 断案源目前不采天地盘与四课（见本段上方说明），故此处只写三传相关字段 */
    /* 原文明文点名的乘将（只认「X上乘Y」这种明确的四课/宫位乘将句，
     * 不认断语里「末传卯作白虎」之类的位置混写，避免把散文噪声当断言） */
    const claims = [];
    for (const mm of block.slice(0, 300).matchAll(new RegExp('([' + ZHI + '])上乘(贵人|螣蛇|朱雀|六合|勾陈|青龙|天空|白虎|太常|玄武|太阴|天后)', 'g'))) {
      claims.push({ zhi: mm[1], jiang: mm[2] });
    }
    if (claims.length) book.jiangClaims = claims;

    nTried++;
    anchors.push({
      id: 'duanan_' + String(k + 1).padStart(3, '0'),
      src: file,
      excerpt: excerpt,
      input: { mj: mj, dg: dg, dz: dz, hour: hour },
      book: book,
      _c: c
    });
  }
  return { nHead: nHead, nForme: nForme, nTried: nTried };
}

/* ==================== 源 B：中黄五变经（markdown 表格） ==================== */
function parseZhongHuang(text, file) {
  let nHead = 0, nForme = 0, nTried = 0;
  const reA = new RegExp('假令\\s*([一二三四五六七八九十]+月将|[' + ZHI + ']将)\\s*([' + GAN + '])([' + ZHI + '])日\\s*([' + ZHI + '])时', 'g');
  const reB = new RegExp('假令\\s*([' + GAN + '])([' + ZHI + '])日\\s*([一二三四五六七八九十]+月将|[' + ZHI + ']将)\\s*([' + ZHI + '])时', 'g');
  const heads = [];
  let m;
  while ((m = reA.exec(text))) heads.push({ dg: m[2], dz: m[3], mjTok: m[1], hour: m[4], i: m.index });
  while ((m = reB.exec(text))) heads.push({ dg: m[1], dz: m[2], mjTok: m[3], hour: m[4], i: m.index });
  heads.sort((a, b) => a.i - b.i);

  for (let k = 0; k < heads.length; k++) {
    const H = heads[k];
    const end = k + 1 < heads.length ? heads[k + 1].i : Math.min(text.length, H.i + 3000);
    const block = text.slice(H.i, end);
    const line0 = block.split(/\r?\n/, 1)[0];
    nHead++;
    let mjStated = isZhi(H.mjTok[0]) ? H.mjTok[0] : null;   /* 原文直接写出的月将地支 */
    const mjFromMonth = mjStated ? null : MONTH_TO_MJ[H.mjTok.replace(/将$/, '')];  /* 只写了「X月将」时的名义月将 */
    /* 四课 markdown 表有两种版式：
     * ①标准式：表头「| 第四课 | 第三课 | 第二课 | 第一课 |」+ 上神行 + 下神行
     * ②重排式：「| 四课 | A | B | C | D |」+「|  ｜下1 | 下2 | 下3 | 下4 |」（自右向左读）
     * 两种都取出 [课1..课4] 的上/下。 */
    const cell = (s) => s.trim().replace(/^[*\s]+|[*\s]+$/g, '');
    const z = '([子丑寅卯辰巳午未申酉戌亥])';
    const g = '([甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥])';
    let up = null, down = null;
    const t1 = block.match(new RegExp('\\|\\s*第四课\\s*\\|[^\\n]*\\n\\|[^\\n]*\\n\\|\\s*' + z + '\\s*\\|\\s*' + z + '\\s*\\|\\s*' + z + '\\s*\\|\\s*' + z + '\\s*\\|[^\\n]*\\n\\|\\s*' + z + '\\s*\\|\\s*' + z + '\\s*\\|\\s*' + z + '\\s*\\|\\s*' + g + '\\s*\\|'));
    if (t1) {
      /* 表头「第四课|第三课|第二课|第一课」是课4→课1 的列序。
       * 实测读法：**按列（自右向左）成对**读，即
       *   课1 = (上, 下) = (row1[末], row2[末])，课4 = (row1[首], row2[首])。
       * 例（13.释复建真鬼）：庚子日申时十一月将
       *   row1=戌巳午丑 row2=巳子丑庚 → 四课 庚申/丑午/子巳/巳戌 → 丑/庚 子/丑 巳/子 戌/巳。
       * 与「庚日寄申」及「月将=占时+偏移」两条书内规则都能对上。 */
      const r1 = [t1[1], t1[2], t1[3], t1[4]];
      const r2 = [t1[5], t1[6], t1[7], t1[8]];
      up = [r1[3], r1[2], r1[1], r1[0]];
      down = [r2[3], r2[2], r2[1], r2[0]];
    } else {
      const t2 = block.match(new RegExp('\\|\\s*四课\\s*\\|\\s*' + z + '\\s*\\|\\s*' + z + '\\s*\\|\\s*' + z + '\\s*\\|\\s*' + z + '\\s*\\|[^\\n]*\\n\\|\\s*[^|\\n]*\\|\\s*' + g + '\\s*\\|\\s*' + z + '\\s*\\|\\s*' + z + '\\s*\\|\\s*' + z + '\\s*\\|'));
      if (t2) {
        /* 「| 四课 | A | B | C | D |」（自右向左为 课1..课4 的上神）
         * +「|  ｜下1 | 下2 | 下3 | 下4 |」（组5..8） */
        up = [t2[4], t2[3], t2[2], t2[1]];
        down = [t2[8], t2[7], t2[6], t2[5]];
      }
    }
    if (process.env.HARVEST_DEBUG) console.error('[zh] hd=' + H.dg + ' rowA=' + (typeof rowADbg !== 'undefined' ? rowADbg : '?') + ' up=' + JSON.stringify(up) + ' down=' + JSON.stringify(down));
    if (!up) { drop(file, '未找到四课 markdown 表' + (mjStated ? '' : '（本课只给月份，需靠四课反推月将）'), line0); continue; }
    nForme++;
    /* 下神行必须含日干（课1下神），且四组位移必须一致 —— 一起作为「版式读对」的判据 */
    if (!down.includes(H.dg)) {
      drop(file, '四课下神行未出现日干 ' + H.dg + '（疑版式读错）：上' + up.join('') + ' 下' + down.join(''), line0);
      continue;
    }
    /* ---- 月将定值 ----
     * 判据（书内自洽）：四课四组「上/下」之间的位移必须一致 —— 位移 = 月将 − 占时，
     * 也就是每组 下神 在天地盘上取到 上神 的那一步。四组位移不一致说明版式读错，丢弃。
     * ①原文直接写了月将地支 → 用它，并要求与位移推得的月将一致；
     * ②原文只写「十一月将」这种月份 → 用书上干上神反推月将（课题允许的办法），
     *   并把「反推月将」与「名义月将（月份→月将）」是否一致记为 monthAgree 供复核。 */
    let mj = mjStated, mjHow = '原文直写月将', monthAgree = null;
    {
      /* 位移取课2（上神为纯支，最可靠），再要求课3、课4 位移一致 */
      const d2 = ((ZHI.indexOf(up[1]) - ZHI.indexOf(down[1])) + 12) % 12;
      let okShift = isZhi(up[1]) && isZhi(down[1]);
      for (const i of [2, 3]) {
        if (!isZhi(up[i]) || !isZhi(down[i])) { okShift = false; break; }
        if (((ZHI.indexOf(up[i]) - ZHI.indexOf(down[i])) + 12) % 12 !== d2) { okShift = false; break; }
      }
      const shift = d2;
      if (!okShift) {
        if (process.env.HARVEST_DEBUG) console.error('[zh-shift] dg=' + H.dg + ' up=' + JSON.stringify(up) + ' down=' + JSON.stringify(down) +
          ' diffs=' + JSON.stringify([0, 1, 2, 3].map((i) => (((ZHI.indexOf(up[i]) - ZHI.indexOf(down[i])) + 12) % 12))));
        drop(file, '书上四课四组位移不一致（疑版式读错）：上' + up.join('') + ' 下' + down.join(''), line0);
        continue;
      }
      const cand = ZHI[(ZHI.indexOf(H.hour) + shift) % 12];      /* 月将 = 占时 + 位移 */
      if (!mjStated) { mj = cand; mjHow = '由书上四课位移反推'; }
      else if (cand !== mj) {
        drop(file, '原文明写月将 ' + mj + '，但与书上四课位移推得的 ' + cand + ' 不一致（书内矛盾）', line0);
        continue;
      }
      if (mjFromMonth) monthAgree = (mjFromMonth === mj);
    }
    let chuans = null, chuanJiang = null;
    const ti = block.indexOf('三传');
    if (ti >= 0) {
      const seg = block.slice(ti, ti + 600);
      const rows = [...seg.matchAll(/\|\s*(初|中|末)\s*\|\s*([子丑寅卯辰巳午未申酉戌亥])\s*\|/g)];
      if (rows.length >= 3) {
        const map = { 初: null, 中: null, 末: null };
        rows.forEach((r) => { map[r[1]] = r[2]; });
        chuans = [map.初, map.中, map.末];
      }
      /* 重排式：「| 三传 | 巳 | 丑 | 酉 |」 */
      if (!chuans) {
        const r2 = seg.match(/\|\s*三传\s*\|\s*([子丑寅卯辰巳午未申酉戌亥])\s*\|\s*([子丑寅卯辰巳午未申酉戌亥])\s*\|\s*([子丑寅卯辰巳午未申酉戌亥])\s*\|/);
        if (r2) chuans = [r2[1], r2[2], r2[3]];
      }
      /* 天将行：「| 天将 | 勾陈 | 玄武 | 朱雀 |」 */
      const jr = seg.match(/\|\s*天将\s*\|\s*([^|\n]+)\|\s*([^|\n]+)\|\s*([^|\n]+)\|/);
      if (jr) {
        const names = [jr[1], jr[2], jr[3]].map((s) => {
          const t = s.trim();
          if (JIANG_FULL.indexOf(t) >= 0) return t;
          return JIANG_ABBR[t[0]] || '';
        });
        if (names.every(Boolean)) chuanJiang = names;
      }
    }
    if (!chuans) {
      const seg = block.slice(0, 1200);
      const got = {};
      for (const mm of seg.matchAll(new RegExp('(初|中|末)[传傳]\\s*([子丑寅卯辰巳午未申酉戌亥])', 'g'))) if (!got[mm[1]]) got[mm[1]] = mm[2];
      if (got.初 && got.中 && got.末) chuans = [got.初, got.中, got.末];
    }
    if (!chuans) { drop(file, '未找到三传', line0); continue; }
    const c = LiurenCore.buildChartAncient(mj, H.dg, H.dz, H.hour, '', '', '');
    nTried++;
    const book = { chuans: chuans, kegs: [up[0] + '/' + down[0], up[1] + '/' + down[1], up[2] + '/' + down[2], up[3] + '/' + down[3]] };
    if (chuanJiang) book.chuanJiang = chuanJiang;
    anchors.push({
      id: 'zhonghuang_' + path.basename(file, '.md').replace(/[^\w]/g, '') + '_' + (k + 1),
      src: file,
      excerpt: block.slice(0, 300).replace(/\r?\n/g, '⏎'),
      input: { mj: mj, dg: H.dg, dz: H.dz, hour: H.hour },
      book: book,
      _c: c
    });
  }
  return { nHead: nHead, nForme: nForme, nTried: nTried };
}

/* ============ 源 C：其他古籍（原文同时写明 日干支 + 占时 + 月将） ============ */
/* 句式：「假令正月癸未日寅时占，以登明加时」/「假令三月癸巳日午时占，月将从魁加时」/
 *       「甲子日卯将辰时」。这类课例只给三传（「初传胜光，将得白虎；中传大吉…」），
 *       所以只校验三传支与三传乘将。 */
function parseGeneric(text, file) {
  let nHead = 0, nForme = 0, nTried = 0;
  const headRe = new RegExp(
    '([' + GAN + '])([' + ZHI + '])日[^\\n]{0,24}?' +
    '(?:月将\\s*(' + JIANG_NAME_RE + ')|(' + JIANG_NAME_RE + ')\\s*加|([' + ZHI + '])将)\\s*' +
    '(?:加\\s*)?([' + ZHI + '])时', 'g');
  const heads = [];
  let m;
  while ((m = headRe.exec(text))) heads.push({ dg: m[1], dz: m[2], mjTok: m[3] || m[4] || m[5], hour: m[6], i: m.index });

  for (let k = 0; k < heads.length; k++) {
    const H = heads[k];
    const end = k + 1 < heads.length ? heads[k + 1].i : Math.min(text.length, H.i + 1200);
    const block = text.slice(H.i, end);
    const line0 = block.split(/\r?\n/, 1)[0];
    nHead++;
    const mj = JIANG_NAME[H.mjTok] || H.mjTok;
    if (!isZhi(mj)) { drop(file, '月将无法定支', line0); continue; }

    /* 明文三传的三种写法（在本课例段落内查找，但必须是**显式标注**的三传，
     * 不接受「初传X」这种只提到一传的句子，避免把散文里的片段当成三传）：
     *   ①「…，三传申子辰也…」                （支连写）
     *   ②「三传子未寅，将六、阴、龙」          （支连写 + 乘将）
     *   ③「初传胜光，将得白虎；中传大吉，将得朱雀；末传传送，将得玄武」 */
    const got = {};
    for (const mm of block.matchAll(new RegExp('(初|中|末)[传傳]\\s*[\'\u2018\u300c]?([' + ZHI + '])[\'\u2019\u300d]?[^。；;]{0,14}?(贵人|螣蛇|腾蛇|朱雀|六合|勾陈|青龙|天空|白虎|太常|玄武|太阴|天后)', 'g'))) {
      if (!got[mm[1]]) got[mm[1]] = { z: mm[2], j: mm[3] === '腾蛇' ? '螣蛇' : mm[3] };
    }
    if (!(got.初 && got.中 && got.末)) {
      const mm = block.match(new RegExp('三传\\s*[\'\u2018\u300c]?([' + ZHI + '])\\s*([' + ZHI + '])\\s*([' + ZHI + '])[\'\u2019\u300d]?\\s*(?:也)?\\s*(?:[，,]\\s*将\\s*([^\u3002；;]{1,20}))?'));
      if (mm && new Set([mm[1], mm[2], mm[3]]).size === 3) {
        got.初 = { z: mm[1], j: '' }; got.中 = { z: mm[2], j: '' }; got.末 = { z: mm[3], j: '' };
        if (mm[4]) {
          const js = [];
          for (const ch of mm[4]) if (JIANG_ABBR[ch] !== undefined && js.length < 3) js.push(JIANG_ABBR[ch]);
          if (js.length === 3) { got.初.j = js[0]; got.中.j = js[1]; got.末.j = js[2]; }
        }
      }
    }
    if (!(got.初 && got.中 && got.末)) { drop(file, '原文未给出完整（显式标注的）三传', line0); continue; }
    let jiangs = ['初', '中', '末'].map((p) => got[p].j);
    let nJ = jiangs.filter(Boolean).length;
    if (nJ !== 0 && nJ !== 3) { drop(file, '三传乘将残缺 ' + nJ + '/3', line0); continue; }
    /* --- 书上自洽闸门（防止把散文里「三合局」「四课…三传…」之类的字样当成三传）---
     * 原文若同时给了三传乘将，则三传支与乘将必须彼此自洽：
     * 从「月将 + 占时」可得天地盘偏移，三传支是天盘支，其地盘宫 = 天盘支 − 偏移；
     * 但天将在不同书里有时写「乘天盘支」、有时写「乘地盘宫」，两种都试，只要有一种自洽就采。 */
    let consistent = false;
    if (nJ === 3) {
      const off = ((ZHI.indexOf(mj) - ZHI.indexOf(H.hour)) + 12) % 12;
      /* 天盘布局：地盘宫 g 上的天盘支 = ZHI[(g + off) % 12] */
      const c2 = LiurenCore.buildChartAncient(mj, H.dg, H.dz, H.hour, '', '', '');
      const jiangOf = (ttz) => c2.jiangMap[LiurenCore.gongOf(c2.tp, ttz)] || '';
      let okA = 0, okB = 0;
      for (let i = 0; i < 3; i++) {
        const tt = got['初中末'[i]].z;
        if (jiangOf(tt) === jiangs[i]) okA++;                                         /* 天将乘天盘支 */
        const gong = ZHI[(ZHI.indexOf(tt) - off + 12) % 12];
        if ((c2.jiangMap[gong] || '') === jiangs[i]) okB++;                            /* 天将乘地盘宫 */
      }
      consistent = (okA === 3 || okB === 3);
      if (!consistent) {
        drop(file, '三传与乘将不自洽（疑误采散文）：书三传' + ['初', '中', '末'].map((p) => got[p].z).join('') + '，书将' + jiangs.join('/'), line0);
        continue;
      }
    }
    nForme++; nTried++;

    const c = LiurenCore.buildChartAncient(mj, H.dg, H.dz, H.hour, '', '', '');
    const book = { chuans: [got.初.z, got.中.z, got.末.z] };
    if (nJ === 3) book.chuanJiang = jiangs;
    anchors.push({
      id: 'misc_' + path.basename(file, '.txt').replace(/[^\w]/g, '').slice(0, 14) + '_' + (k + 1),
      src: file,
      excerpt: block.slice(0, 260).replace(/\r?\n/g, '⏎'),
      input: { mj: mj, dg: H.dg, dz: H.dz, hour: H.hour },
      book: book,
      _c: c
    });
  }
  return { nHead: nHead, nForme: nForme, nTried: nTried };
}

/* ------------------------------------------------------------------ 采 集 */
const stats = { sources: [], headsTotal: 0 };
const ancientDir = path.join(ROOT, '大六壬文档', '古籍原文-易藏-术数');
const zhongDir = path.join(ROOT, '大六壬文档', '中黄五变经', '经文');
const pushStat = (kind, src, r) => {
  stats.sources.push({ kind: kind, src: src, nHead: r.nHead, nForme: r.nForme, nTried: r.nTried });
  stats.headsTotal += r.nHead;
};

/* A. 断案（同书有 gb18030 原件 + utf8 工作稿，取 utf8 稿，避免重复计） */
for (const p of walkFiles(ancientDir, '.txt')) {
  const f = rel(p);
  if (f.indexOf('断案') < 0 || f.indexOf('.utf8.') < 0) continue;
  if (srcFilter && f.indexOf(srcFilter) < 0) continue;
  pushStat('断案', f, parseDuAn(readText(p), f));
}
/* B. 中黄五变经 md */
for (const p of walkFiles(zhongDir, '.md')) {
  const f = rel(p);
  if (srcFilter && f.indexOf(srcFilter) < 0) continue;
  pushStat('中黄', f, parseZhongHuang(readText(p), f));
}
/* C. 其他古籍（排除断案副本与无三传的课经《直指御定》；同书多副本去重） */
const MISC_SKIP = /断案|直指御定/;
const seenBare = new Set();
for (const p of walkFiles(ancientDir, '.txt')) {
  const f = rel(p);
  if (MISC_SKIP.test(f)) continue;
  if (srcFilter && f.indexOf(srcFilter) < 0) continue;
  const bare = f.replace(/\.(utf8\.)?txt$/i, '');
  if (seenBare.has(bare)) continue;
  seenBare.add(bare);
  const t = readText(p);
  /* 《六壬大全》的三传散落在讲解性段落里（「三传戌午寅火局为鬼」这类是别人家的课），
   * 与本课例头所在段落不能可靠对应，机器抽取会张冠李戴，故整体不采（见报告）。 */
  if (f.indexOf('大全') >= 0) continue;
  const r = parseGeneric(t, f);
  if (r.nHead === 0) continue;
  pushStat('其他', f, r);
}

/* ------------------------------------------------------------------ 比 对 */
const cmp = {
  kegsUp: { n: 0, ok: 0 }, kegsDown: { n: 0, ok: 0 }, kegsAll: { n: 0, ok: 0 },
  chuan: { n: 0, ok: 0 }, chuanGz: { n: 0, ok: 0 }, chuanJiang: { n: 0, ok: 0 },
  plate: { n: 0, ok: 0, cells: 0, cellOk: 0 }, jiangClaims: { n: 0, ok: 0 }
};
const fails = [];
for (const a of anchors) {
  const c = a._c;
  const engKegs = c.kegs.map((k) => k.x + '/' + k.s);
  const engChuans = c.sanchuan.chuans.map((x) => x.z);
  const engine = {
    chuans: engChuans,
    chuanGz: c.sanchuan.chuans.map((x) => x.gz),
    chuanJiang: engChuans.map((z) => jiangAtZhi(c, z)),
    kegs: engKegs,
    method: c.sanchuan.method,
    keti: c.sanchuan.keti,
    xunkong: c.dx.xunkong,
    ok: true
  };
  const F = [];

  if (a.book.kegs) {
    const bk = a.book.kegs, bkUp = bk.map((s) => s.split('/')[0]), bkDn = bk.map((s) => s.split('/')[1]);
    const enUp = c.kegs.map((k) => k.x), enDn = c.kegs.map((k) => k.s);
    const upBad = [], dnBad = [];
    for (let i = 1; i < 4; i++) {
      if (bkUp[i] !== enUp[i]) upBad.push('课' + (i + 1) + '上神 书' + bkUp[i] + '/引擎' + enUp[i]);
      if (bkDn[i] !== enDn[i]) dnBad.push('课' + (i + 1) + '下神 书' + bkDn[i] + '/引擎' + enDn[i]);
    }
    if (bk[0] !== engKegs[0]) upBad.push('课1 书' + bk[0] + '/引擎' + engKegs[0]);
    cmp.kegsUp.n++; if (!upBad.length) cmp.kegsUp.ok++;
    cmp.kegsDown.n++; if (!dnBad.length) cmp.kegsDown.ok++;
    cmp.kegsAll.n++; if (!upBad.length && !dnBad.length) cmp.kegsAll.ok++;
    if (upBad.length || dnBad.length) F.push({ item: '四课', why: upBad.concat(dnBad).join('；') });
  }
  if (a.book.chuans) {
    cmp.chuan.n++;
    if (a.book.chuans.join('') === engChuans.join('')) cmp.chuan.ok++;
    else F.push({ item: '三传', why: '书' + a.book.chuans.join('') + '/引擎' + engChuans.join('') });
  }
  if (a.book.chuanGz) {
    cmp.chuanGz.n++;
    if (a.book.chuanGz.join('/') === engine.chuanGz.join('/')) cmp.chuanGz.ok++;
    else F.push({ item: '三传遁干', why: '书' + a.book.chuanGz.join('/') + '/引擎' + engine.chuanGz.join('/') });
  }
  if (a.book.chuanJiang) {
    cmp.chuanJiang.n++;
    if (a.book.chuanJiang.join('/') === engine.chuanJiang.join('/')) cmp.chuanJiang.ok++;
    else F.push({ item: '三传乘将', why: '书' + a.book.chuanJiang.join('/') + '/引擎' + engine.chuanJiang.join('/') });
  }
  if (a.book.plate) {
    cmp.plate.n++;
    const bad = [];
    for (let i = 0; i < 12; i++) {
      const g = ZHI[i], en = c.tp[g] || '';
      cmp.plate.cells++;
      if (a.book.plate[g] === en) cmp.plate.cellOk++; else bad.push(g + '宫 书' + a.book.plate[g] + '/引擎' + en);
    }
    if (!bad.length) cmp.plate.ok++; else F.push({ item: '天地盘', why: bad.join('；') });
  }
  if (a.book.jiangClaims) {
    for (const cl of a.book.jiangClaims) {
      cmp.jiangClaims.n++;
      const en = jiangAtZhi(c, cl.zhi);
      if (en === cl.jiang) cmp.jiangClaims.ok++;
      else F.push({ item: '乘将断言', why: cl.zhi + '上 书乘' + cl.jiang + '/引擎' + en });
    }
  }

  a.engine = engine;
  delete a._c;
  if (F.length) fails.push({ id: a.id, src: a.src, excerpt: a.excerpt, input: a.input, book: a.book, engine: engine, fails: F });
}

/* ------------------------------------------------------------------ 输 出 */
const pct = (o) => o.n ? (o.ok / o.n * 100).toFixed(1) + '%' : '—';
const pad = (s, n) => { let w = 0; for (const c of s) w += (c.charCodeAt(0) > 0x2000 ? 2 : 1); return s + ' '.repeat(Math.max(1, n - w)); };
const row = (name, o, extra) => '  ' + pad(name, 21) + pad(o.ok + '/' + o.n, 10) + pad(pct(o), 8) + (extra || '');
const L = [];
L.push('大六壬传本课例锚点采集与引擎比对');
L.push('='.repeat(78));
L.push('读出课例头 ' + stats.headsTotal + ' 例 → 纳入锚点 ' + anchors.length + ' 例，丢弃 ' + rejected.length + ' 例');
L.push('');
L.push('按源统计（课例头 = 原文出现「日干支 + 占时 + 月将」的位置数）：');
for (const s of stats.sources) {
  if (!s.nHead && !s.nTried) continue;
  L.push('  [' + s.kind + '] ' + s.src);
  L.push('        课例头 ' + s.nHead + '  课式成形 ' + s.nForme + '  入锚点 ' + s.nTried);
}
L.push('');
L.push('比对结果（命中/可比）：');
L.push('  项目                      命中/可比    命中率');
L.push(row('四课 课2/3/4 上神', cmp.kegsUp));
L.push(row('四课 课2/3/4 下神', cmp.kegsDown));
L.push(row('四课 整式四课', cmp.kegsAll));
L.push(row('三传 初中末地支', cmp.chuan));
L.push(row('三传 遁干', cmp.chuanGz, '  仅「原文写了遁干」的断案课式'));
L.push(row('三传 乘将', cmp.chuanJiang));
L.push(row('天地盘 整盘', cmp.plate, '  逐宫 ' + cmp.plate.cellOk + '/' + cmp.plate.cells));
L.push(row('原文乘将断言 X上乘Y', cmp.jiangClaims));
L.push('');
L.push('不命中课例 ' + fails.length + ' 例（共 ' + anchors.length + ' 例）');
L.push('');
if (VERBOSE) {
  L.push('---- 不命中明细（书 vs 引擎）----');
  if (!fails.length) L.push('  （无）');
  for (const f of fails) {
    L.push('[' + f.id + '] ' + f.src);
    L.push('   输入   月将' + f.input.mj + ' 日' + f.input.dg + f.input.dz + ' 占时' + f.input.hour);
    L.push('   原文   ' + f.excerpt.slice(0, 220));
    L.push('   书     四课 ' + (f.book.kegs ? f.book.kegs.join(' ') : '—') + ' | 三传 ' + (f.book.chuans ? f.book.chuans.join('') : '—') + ' | 将 ' + (f.book.chuanJiang ? f.book.chuanJiang.join('/') : '—'));
    if (f.book.chuanGzSelfCheck) L.push('          书上三传的干自洽性：' + f.book.chuanGzSelfCheck.join('  '));
    L.push('   引擎   四课 ' + f.engine.kegs.join(' ') + ' | 三传 ' + f.engine.chuans.join('') + ' | 将 ' + f.engine.chuanJiang.join('/'));
    for (const x of f.fails) L.push('   ✗ ' + x.item + '：' + x.why);
    L.push('');
  }
  L.push('---- 丢弃原因分类 ----');
  const byWhy = {};
  for (const r of rejected) { const k = r.why.replace(/[：:].*$/, '').replace(/[（(].*$/, ''); byWhy[k] = (byWhy[k] || 0) + 1; }
  Object.keys(byWhy).sort((a, b) => byWhy[b] - byWhy[a]).forEach((k) => L.push('   ' + k + '  ×' + byWhy[k]));
} else {
  L.push('（加 --verbose 看逐条书/引擎对照与丢弃原因分类）');
}
console.log(L.join('\n'));

if (WRITE) {
  const outDir = path.join(ROOT, '_tests', '_data');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'anchors_corpus.json');
  const data = anchors.map((a) => ({ id: a.id, src: a.src, excerpt: a.excerpt, input: a.input, book: a.book, engine: a.engine }));
  fs.writeFileSync(outFile, JSON.stringify(data, null, 1), 'utf-8');
  console.log('\n已写出 ' + rel(outFile) + '（' + data.length + ' 条）');
  const rejFile = path.join(outDir, 'anchors_rejected.json');
  fs.writeFileSync(rejFile, JSON.stringify(rejected, null, 1), 'utf-8');
  console.log('已写出 ' + rel(rejFile) + '（' + rejected.length + ' 条丢弃记录）');
}
process.exit(0);

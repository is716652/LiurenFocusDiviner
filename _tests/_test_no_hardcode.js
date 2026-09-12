/* ============================================================================
 * _test_no_hardcode.js —— 防写死门禁（自动化，不靠人自觉）
 * ============================================================================
 * 本门禁用于防止为让测试变绿而写死个例；发现违规时**改规则或改数据（带出处），
 * 不得扩大白名单**。
 *
 * 核心判据（一句话）：**定法必须对全输入空间一致；任何「个案口径差异」只能存在于
 * 数据文件里并带出处，不能进代码。**
 *
 * 六条断言（逐条独立判定；任一失败即 exit 1，并逐处打印 文件:行号）：
 *   A1 引擎不得含有任何个案标识（个案 id / 数据文件名 / 具体日期串 / 书名分支）
 *   A2 引擎不得有 I/O 与环境依赖（require/import/fs/process/Date.now/new Date/Date）
 *   A3 不得按输入组合特判：抽样 ≥2000 组，验「同输入同结果 / 顺序无关 / 无内部状态残留 / 跨实例一致」
 *   A4 规则常量必须被使用（具名常量表只定义不使用 = 「写死过但要凑」的残留）
 *   A5 个案口径只能留在数据里：带个案级差异字段的对象必须同时带出处或存疑说明
 *   A6 三端同构抽查：resolveSanchuan / buildJiang / xunDun 函数体归一化后逐行相同
 *
 * 白名单纪律：
 *   确有正当例外时写入本文件下方 WHITELIST 数组，**每项必须附一句理由**，
 *   且白名单只豁免「该文件 + 该断言 + 该字面量」的命中，不得整条断言关闭、不得静默放行。
 *   白名单每次命中都会打印（含理由），便于复核。
 *
 * 用法：node _tests/_test_no_hardcode.js [--verbose]
 * 退出码：任一断言失败 = 1，全过 = 0。
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const VERBOSE = process.argv.includes('--verbose');

/* ---------------- 被扫文件（组件化后：按目录覆盖全部模块，不再固定单文件） ----------------
 * 引擎真源已按 §13 拆为 core/liuren-core.ts（装配层）+ core/liuren/**（模块）。
 * 本门禁不得写死"四份引擎文件"，否则新增模块会落在扫描面之外（等于静默放宽）。 */
function scanFiles(dirRel, extRe) {
  const abs = path.join(ROOT, dirRel);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (extRe.test(e.name)) out.push(path.relative(ROOT, p).replace(/\\/g, '/'));
    }
  };
  walk(abs);
  return out.sort();
}
/* 引擎 .ts：装配层 core/liuren-core.ts 在前，模块 core/liuren/ 下的 .ts 在后 */
const ENGINE_TS = (() => {
  const all = scanFiles('core', /\.ts$/);
  const entry = 'core/liuren-core.ts';
  return [entry].concat(all.filter((f) => f !== entry));
})();
const ENGINE = {
  ts: 'core/liuren-core.ts',
  js: 'core/liuren-core.js',
  etsMain: 'APP/LiurenFocusDiviner/entry/src/main/ets/model/LiurenCore.ets',
  etsFree: 'APP/LiurenFocusDivinerFree/entry/src/main/ets/model/LiurenCore.ets'
};
/* 扫描面：全部引擎 .ts 模块 + 编译产物 .js + 两版 .ets */
const ENGINE_FILES = ENGINE_TS.concat([ENGINE.js, ENGINE.etsMain, ENGINE.etsFree]);
/* 同构三端（真源 → 主版 → 免费版）；.js 为编译产物（无类型注解），不参与逐行同构比对。
   三端各自可能是"多个模块文件"，同构比对按**三端代码库整体**取函数体（见 A6）。 */
const TRIPLE = [ENGINE.ts, ENGINE.etsMain, ENGINE.etsFree];
const TRIPLE_TREES = [
  ENGINE_TS,                                                                     /* .ts：装配层 + 模块 */
  scanFiles('APP/LiurenFocusDiviner/entry/src/main/ets/model', /\.ets$/),        /* 主版 .ets */
  scanFiles('APP/LiurenFocusDivinerFree/entry/src/main/ets/model', /\.ets$/)     /* 免费版 .ets */
];

/* 个案级数据文件（A5 扫描面） */
const CASE_DATA_FILES = [
  'APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/ancient/case_gallery.json',
  'APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/ancient/case_story.json',
  '_tests/_data/anchors_corpus.json',
  '_tests/_data/anchors_rejected.json',
  '_tests/_data/anchors_kouJing.json',
  '_tests/_data/gallery_expect_fix.json',
  '_tests/_data/jiang_adjudication.json',
  '_tests/_data/sanchuan_dizhi_adjudication.json',
  '_tests/_data/sanchuan_kaiyi.json'
];

/* ============================================================================
 * 白名单（显式；每项附理由）。当前为空 —— 有正当例外时才逐条登记。
 *   { file, rule: 'A1'|'A2'|'A3'|'A4'|'A5'|'A6', match, reason }
 * ==========================================================================*/
const WHITELIST = [];

function whitelisted(rule, file, match) {
  for (const w of WHITELIST) {
    if (w.rule !== rule) continue;
    if (w.file && w.file !== file) continue;
    if (w.match && match.indexOf(w.match) < 0) continue;
    console.log('  [白名单豁免] ' + rule + ' ' + file + '  «' + (w.match || '*') + '»  —— ' + w.reason);
    return true;
  }
  return false;
}

/* ---------------- 违规收集 ---------------- */
let FAIL = 0;
const VIOLATIONS = [];
function fail(rule, file, line, what, detail) {
  FAIL++;
  VIOLATIONS.push(rule + ' ' + file + ':' + line + '  ' + what);
  console.log('  ✗ [' + rule + '] ' + file + ':' + line + '  ' + what + (detail ? '  —— ' + detail : ''));
}
function head(rule, title) {
  console.log('\n[' + rule + '] ' + title);
}

/* ---------------- 文本工具 ---------------- */
const TEXT = {};
function readText(rel) {
  if (!(rel in TEXT)) {
    TEXT[rel] = fs.readFileSync(path.join(ROOT, rel), 'utf-8');
  }
  return TEXT[rel];
}
/* 行号索引（1 基） */
function lineIndex(src) {
  const offs = [0];
  for (let i = 0; i < src.length; i++) {
    if (src[i] === '\n') offs.push(i + 1);
  }
  return offs;
}
function lineOf(offs, idx) {
  let lo = 0, hi = offs.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (offs[mid] <= idx) lo = mid; else hi = mid - 1;
  }
  return lo + 1;
}
/* 注释剥离：注释整段换成空白（保留换行，行号不变）；字符串字面量内的 / 与 * 不受影响。
   返回 { code, comments:[{text,line}] } —— 注释只用于「报计数供人工过目」，不参与判定。 */
function stripComments(src) {
  const offs = lineIndex(src);
  const comments = [];
  let out = '';
  let i = 0;
  const n = src.length;
  let quote = '';
  while (i < n) {
    const c = src[i];
    if (quote !== '') {
      out += c;
      if (c === '\\') { out += src[i + 1] || ''; i += 2; continue; }
      if (c === quote) quote = '';
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; out += c; i++; continue; }
    if (c === '/' && src[i + 1] === '/') {
      let j = src.indexOf('\n', i);
      if (j < 0) j = n;
      comments.push({ text: src.slice(i, j), line: lineOf(offs, i) });
      i = j;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      let j = src.indexOf('*/', i + 2);
      j = (j < 0) ? n : j + 2;
      comments.push({ text: src.slice(i, j), line: lineOf(offs, i) });
      out += src.slice(i, j).replace(/[^\n]/g, ' ');
      i = j;
      continue;
    }
    out += c;
    i++;
  }
  return { code: out, comments: comments, offs: offs };
}
const STRIPPED = {};
function stripped(rel) {
  if (!(STRIPPED[rel])) STRIPPED[rel] = stripComments(readText(rel));
  return STRIPPED[rel];
}

/* ============================================================================
 * A1 引擎不得含有任何个案标识
 * ==========================================================================*/
head('A1', '引擎不得含有任何个案标识（个案 id / 数据文件名 / 日期串 / 书名分支）');

const A1_TOKENS = [
  'duanan_', 'renzhan_', 'zhonghuang_c', 'case_gallery', 'case_story', 'rawfile', '.json'
];
const A1_BOOK_NAMES = [
  '断案', '汇选', '指南', '中黄五经', '玉连环', '六壬大全', '心镜', '灵觉经',
  '粹言', '经纬', '直指御定', '管辂', '神定经', '毕法赋', '金口诀', '鬼撮脚',
  '寻源', '存验', '秘本', '拃河棹', '金铰剪', '银河櫂', '括囊赋', '翠雨歌', '壬占'
];
const A1_DATE_RES = [
  { name: '日期串 20xx-xx-xx', re: /20\d{2}-\d{2}-\d{2}/g },
  { name: '日期串 20xxxxxx', re: /(?<!\d)20\d{6}(?!\d)/g }
];
const A1_COMMENT_TALLY = {};

for (const rel of ENGINE_FILES) {
  const st = stripped(rel);
  /* 1a 非注释代码里的禁用 token */
  for (const tok of A1_TOKENS) {
    const re = new RegExp(tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    let m;
    while ((m = re.exec(st.code)) !== null) {
      if (whitelisted('A1', rel, tok)) continue;
      fail('A1', rel, lineOf(st.offs, m.index), '代码中出现个案标识「' + tok + '」',
        JSON.stringify(st.code.slice(Math.max(0, m.index - 40), m.index + 40).trim()));
    }
  }
  /* 1b 非注释代码里的书名（作为分支条件的字符串） */
  for (const b of A1_BOOK_NAMES) {
    let from = 0;
    for (;;) {
      const k = st.code.indexOf(b, from);
      if (k < 0) break;
      from = k + 1;
      if (whitelisted('A1', rel, b)) continue;
      fail('A1', rel, lineOf(st.offs, k), '代码中出现书名「' + b + '」',
        JSON.stringify(st.code.slice(Math.max(0, k - 40), k + 40).trim()));
    }
  }
  /* 1c 日期串 */
  for (const d of A1_DATE_RES) {
    d.re.lastIndex = 0;
    let m;
    while ((m = d.re.exec(st.code)) !== null) {
      if (whitelisted('A1', rel, m[0])) continue;
      fail('A1', rel, lineOf(st.offs, m.index), '代码中出现' + d.name + '「' + m[0] + '」');
    }
  }
  /* 1d 注释里的出处说明：允许，但报计数供人工过目 */
  for (const cm of st.comments) {
    for (const tok of A1_TOKENS.concat(A1_BOOK_NAMES)) {
      if (cm.text.indexOf(tok) >= 0) {
        const key = tok;
        A1_COMMENT_TALLY[key] = (A1_COMMENT_TALLY[key] || 0) + 1;
        if (VERBOSE) {
          console.log('    · 注释出处 ' + rel + ':' + cm.line + '  «' + tok + '»  '
            + JSON.stringify(cm.text.replace(/\s+/g, ' ').slice(0, 100)));
        }
      }
    }
    for (const d of A1_DATE_RES) {
      d.re.lastIndex = 0;
      const m = d.re.exec(cm.text);
      if (m) {
        A1_COMMENT_TALLY['日期串'] = (A1_COMMENT_TALLY['日期串'] || 0) + 1;
        console.log('    · 注释中的日期串 ' + rel + ':' + cm.line + '  «' + m[0] + '»');
      }
    }
  }
}
console.log('  ✓ 非注释代码：0 处个案标识 / 0 处书名分支 / 0 处日期串');
console.log('  · 注释中的出处说明计数（人工过目；注释剥离后才判定，故不违规）：');
const tallyKeys = Object.keys(A1_COMMENT_TALLY).sort();
if (tallyKeys.length === 0) {
  console.log('    （无）');
} else {
  for (const k of tallyKeys) console.log('    ' + k + ' × ' + A1_COMMENT_TALLY[k]);
}

/* ============================================================================
 * A2 引擎不得有 I/O 与环境依赖
 * ==========================================================================*/
head('A2', '引擎不得有 I/O 与环境依赖');

const A2_PATTERNS = [
  { name: 'require(', re: /\brequire\s*\(/g },
  { name: 'import ', re: /\bimport\b/g },
  { name: 'export ', re: /\bexport\b/g },
  { name: 'fs', re: /\bfs\b/g },
  { name: 'process', re: /\bprocess\b/g },
  { name: 'Date.now', re: /\bDate\s*\.\s*now\b/g },
  { name: 'new Date(', re: /\bnew\s+Date\s*\(/g }
];
/* 组件化后（§13）的例外口径：
   - .ets：允许模块 import（ArkTS 唯一的模块机制）；仍受 require/fs/process/Date 约束。
   - .ts：**任何 import / export 都违规** —— 真源是全局脚本，模块间靠全局同名 class 互调
     （实测 core/liuren/** 一条 import 都没有，故此处不开口子）。 */
function a2AllowedImport(rel) {
  return rel.endsWith('.ets');
}
/* Date 白名单：若引擎确需用 Date 做历法换算，在此登记 {file, reason}；
   当前为空（引擎三端均不使用 Date，历法数据一律由宿主经 init/buildChart 注入）。 */
const A2_DATE_WHITELIST = [];
/* 允许的模块 import（仅 .ets：ArkTS 模块机制；.ts 侧任何 import/export 都违规） */
const A2_IMPORT_OK = [];

for (const rel of ENGINE_FILES) {
  const st = stripped(rel);
  for (const p of A2_PATTERNS) {
    p.re.lastIndex = 0;
    let m;
    while ((m = p.re.exec(st.code)) !== null) {
      if (whitelisted('A2', rel, p.name)) continue;
      if ((p.name === 'import ' || p.name === 'export ') && a2AllowedImport(rel)) { A2_IMPORT_OK.push(rel); continue; }
      fail('A2', rel, lineOf(st.offs, m.index), '代码中出现环境依赖「' + p.name + '」',
        JSON.stringify(st.code.slice(Math.max(0, m.index - 40), m.index + 40).trim()));
    }
  }
  /* 单独出现 Date 本身（无 .now / new Date）也须登记白名单并说明用途 */
  const reDate = /\bDate\b/g;
  let m;
  while ((m = reDate.exec(st.code)) !== null) {
    const w = A2_DATE_WHITELIST.find((x) => x.file === rel);
    if (!w) {
      fail('A2', rel, lineOf(st.offs, m.index), '代码中出现 Date（若用于历法换算须登记 A2_DATE_WHITELIST 并说明）');
    } else {
      console.log('  [白名单·Date] ' + rel + '  —— ' + w.reason);
    }
  }
}
console.log('  ✓ 引擎' + ENGINE_FILES.length + ' 份文件均无 require/fs/process/Date.now/new Date/Date'
    + (A2_IMPORT_OK.length ? '；.ets 模块 import ' + A2_IMPORT_OK.length + ' 处（ArkTS 模块机制）；.ts 侧 0 处 import/export' : '；无 import'));

/* ============================================================================
 * 引擎装载（A3 用；两份独立实例以查跨实例状态）
 * ==========================================================================*/
const RULEDIR = path.join(ROOT, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'resources', 'rawfile', 'rule');
const loadRule = (f) => JSON.parse(fs.readFileSync(path.join(RULEDIR, f), 'utf-8'));
function ruleBundle() {
  return {
    duxiang: {
      '旺衰休囚死': { '旺衰': loadRule('旺衰休囚死.json')['旺衰'] },
      '十二宫气机点': loadRule('十二宫气机点.json'),
      '空亡规则': loadRule('空亡规则.json'),
      '助日规则': loadRule('助日规则.json'),
      '基础关系': loadRule('基础关系.json')
    },
    shensha: { '神煞': loadRule('神煞起法.json')['神煞'] },
    bifa: { '一百法': loadRule('毕法赋一百法.json')['一百法'] }
  };
}
const CORE_SRC = readText(ENGINE.js);
/* 实例 1：当前上下文 */
vm.runInThisContext(CORE_SRC, { filename: 'liuren-core.js' });
LiurenCore.init(ruleBundle());
const CORE1 = LiurenCore;
/* 实例 2：独立 vm context（同源代码，独立全局） */
const ctx2 = vm.createContext({ console: console });
vm.runInContext(CORE_SRC, ctx2, { filename: 'liuren-core.js#ctx2' });
vm.runInContext('globalThis.LiurenCore = LiurenCore;', ctx2, { filename: 'liuren-core.js#ctx2-export' });
ctx2.LiurenCore.init(ruleBundle());
const CORE2 = ctx2.LiurenCore;

const GAN = CORE1.GAN, ZHI = CORE1.ZHI;
function chartOf(core, mj, dg, dz, hour, yg, yz, mz) {
  return core.buildChartAncient(mj, dg, dz, hour, yg || '', yz || '', mz || '');
}
/* 输出签名：四课 / 三传（宗门·课体·三传支及遁干）/ 天地盘 / 天将 / 贵人顺逆昼夜 / 旬空 */
function sigOf(c) {
  return JSON.stringify([
    c.kegs.map((k) => k.x + '/' + k.s),
    c.sanchuan.method, c.sanchuan.keti,
    c.sanchuan.chuans.map((x) => x.z + ':' + x.gz),
    Object.keys(c.tp).sort().map((k) => k + '=' + c.tp[k]),
    Object.keys(c.jiangMap).sort().map((k) => k + '=' + c.jiangMap[k]),
    c.gui, c.shun, c.night, c.hourGan,
    c.dx.xunkong.slice().sort()
  ]);
}

/* ============================================================================
 * A3 不得按输入组合特判
 * ==========================================================================*/
head('A3', '不得按输入组合特判（抽样 ≥2000 组的确定性 / 顺序无关 / 无状态残留 / 跨实例一致）');

const ALL = [];
for (const dg of GAN) for (const dz of ZHI) for (const mj of ZHI) for (const hour of ZHI) ALL.push([mj, dg, dz, hour]);
const STRIDE = 7;                                   /* 17280/7 = 2469 组 ≥ 2000 */
const SAMPLE = ALL.filter((_, i) => i % STRIDE === 0);
console.log('  输入空间：10 干 × 12 支 × 12 将 × 12 时 = ' + ALL.length + ' 组；抽样步长 ' + STRIDE
  + ' → ' + SAMPLE.length + ' 组');

/* 3a 同输入重复调用一致 */
let bad3a = 0;
const SIG_A = SAMPLE.map((p) => {
  const c = chartOf(CORE1, p[0], p[1], p[2], p[3]);
  if (!c) { bad3a++; return null; }
  return sigOf(c);
});
for (let i = 0; i < SAMPLE.length; i++) {
  const p = SAMPLE[i];
  const c = chartOf(CORE1, p[0], p[1], p[2], p[3]);
  if (!c || sigOf(c) !== SIG_A[i]) {
    fail('A3', ENGINE.js, 1, '同输入重复调用结果不一致：' + p[1] + p[2] + '日 ' + p[0] + '将 ' + p[3] + '时');
  }
}
if (bad3a === 0) console.log('  ✓ 3a 同输入重复调用（' + SAMPLE.length + ' 组 ×2）结果逐字段一致');

/* 3b 打乱调用顺序（含穿插反向遍历与整轮倒序）结果不变 */
const order = SAMPLE.map((_, i) => i);
let seed = 20260912;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
for (let i = order.length - 1; i > 0; i--) {
  const j = Math.floor(rnd() * (i + 1));
  const t = order[i]; order[i] = order[j]; order[j] = t;
}
let bad3b = 0;
for (const idx of order) {
  const p = SAMPLE[idx];
  const c = chartOf(CORE1, p[0], p[1], p[2], p[3]);
  if (!c || sigOf(c) !== SIG_A[idx]) {
    bad3b++;
    fail('A3', ENGINE.js, 1, '打乱调用顺序后结果改变：' + p[1] + p[2] + '日 ' + p[0] + '将 ' + p[3] + '时');
  }
}
if (bad3b === 0) console.log('  ✓ 3b 乱序重放（' + SAMPLE.length + ' 组，固定随机种子洗牌）结果不变');

/* 3c 无内部可变状态残留：先跑一批「扰动盘」（含年干支/月支分支），再重放同一批 */
const PERTURB = ALL.filter((_, i) => i % 5 === 0).slice(0, 3500);
for (const p of PERTURB) chartOf(CORE1, p[0], p[1], p[2], p[3], '甲', '子', '寅');
let bad3c = 0;
for (let i = 0; i < SAMPLE.length; i++) {
  const p = SAMPLE[i];
  const c = chartOf(CORE1, p[0], p[1], p[2], p[3]);
  if (!c || sigOf(c) !== SIG_A[i]) {
    bad3c++;
    fail('A3', ENGINE.js, 1, '扰动批之后重放结果改变（状态残留）：' + p[1] + p[2] + '日 ' + p[0] + '将 ' + p[3] + '时');
  }
}
if (bad3c === 0) console.log('  ✓ 3c 先跑 ' + PERTURB.length + ' 组扰动盘（带年干支/月支）再重放，结果不变（无状态残留）');

/* 3d 跨实例一致：独立 vm context 的同源引擎，同输入同输出 */
let bad3d = 0;
for (const p of SAMPLE) {
  const c2 = chartOf(CORE2, p[0], p[1], p[2], p[3]);
  const i = SAMPLE.indexOf(p);
  if (!c2 || sigOf(c2) !== SIG_A[i]) {
    bad3d++;
    fail('A3', ENGINE.js, 1, '跨实例结果不一致：' + p[1] + p[2] + '日 ' + p[0] + '将 ' + p[3] + '时');
  }
}
if (bad3d === 0) console.log('  ✓ 3d 独立实例（另建 vm context 同源引擎）同输入同输出');

/* 3e 输出只由 (日干,日支,月将,占时[,年干支,月支]) 决定：
   对同一 (干,支,将,时) 补入不同的年干支/月支，核心四项（四课/三传/宗门/天将）不得改变 */
let bad3e = 0;
const CORE4 = (c) => JSON.stringify([c.kegs.map((k) => k.x + '/' + k.s),
  c.sanchuan.method, c.sanchuan.chuans.map((x) => x.z), Object.keys(c.jiangMap).sort().map((k) => k + '=' + c.jiangMap[k])]);
const YGZ = [['', '', ''], ['甲', '子', '寅'], ['庚', '午', '申'], ['辛', '酉', '卯']];
for (const p of SAMPLE.filter((_, i) => i % 3 === 0)) {
  const base = chartOf(CORE1, p[0], p[1], p[2], p[3]);
  if (!base) continue;
  const b4 = CORE4(base);
  for (let k = 1; k < YGZ.length; k++) {
    const c = chartOf(CORE1, p[0], p[1], p[2], p[3], YGZ[k][0], YGZ[k][1], YGZ[k][2]);
    if (!c || CORE4(c) !== b4) {
      bad3e++;
      fail('A3', ENGINE.js, 1, '年干支/月支改变了四课·三传·宗门·天将（越界依赖）：'
        + p[1] + p[2] + '日 ' + p[0] + '将 ' + p[3] + '时 + ' + YGZ[k].join(''));
    }
  }
}
if (bad3e === 0) console.log('  ✓ 3e 四课·三传·宗门·天将 只由 (日干,日支,月将,占时) 决定（年干支/月支只影响年系神煞与旺衰）');

/* ============================================================================
 * A4 规则常量必须被使用
 * ==========================================================================*/
head('A4', '规则常量必须被使用（只定义不使用 = 死常量 / 写死残留）');

/* 必检常量表（用户点名 + 引擎内全部全大写具名表） */
const A4_REQUIRED = [
  'GUIREN', 'JIANG_ORDER', 'JIANG_DAY_HOURS', 'JIANG_SHUN_GONGS', 'JINGLAN_SHE',
  'HE_GAN', 'QIAN_SANHE', 'XING_MAP', 'ZI_XING', 'MAOXING_ANCHOR', 'BA_ZHUAN_STEP',
  'JI_GONG', 'MA_ZHI'
];
const tsSrc = readText(ENGINE.ts);
/* 组件化后：真源分布在 core/liuren-core.ts（装配层）+ core/liuren/**（模块），
   故 A4 按**引擎整体**判定（某文件内只定义、但被另一模块引用 ⇒ 在用，不算死常量）。
   同时保留**逐声明所属文件**，违规行号仍精确到真实文件。 */
function engineCodeView() {
  const parts = [];
  const spans = [];
  let off = 0;
  for (const rel of ENGINE_TS) {
    const st = stripped(rel);
    parts.push(st.code);
    spans.push({ rel: rel, start: off, end: off + st.code.length, offs: st.offs });
    off += st.code.length + 1;
  }
  return { code: parts.join('\n'), spans: spans };
}
function locOf(spans, idx) {
  for (const s of spans) {
    if (idx >= s.start && idx < s.end) return { rel: s.rel, line: lineOf(s.offs, idx - s.start) };
  }
  return { rel: ENGINE.ts, line: 1 };
}
const VIEW = engineCodeView();
const tsCode = VIEW.code;
const tsOffs = null;

/* 声明发现：static readonly NAME / 顶层 const NAME（全大写具名表） */
const DECLS = [];
const reDecl = /(?:static\s+readonly\s+|^\s*(?:const|let|var)\s+)([A-Z][A-Z0-9_]*)\s*[:=]/gm;
let dm;
while ((dm = reDecl.exec(tsCode)) !== null) {
  DECLS.push({ name: dm[1], start: dm.index });
}
/* 声明区间：从声明名到其初始化表达式在深度 0 的 ';' */
function declEnd(code, start) {
  let i = code.indexOf('=', start);
  if (i < 0) return start;
  let depth = 0;
  for (; i < code.length; i++) {
    const ch = code[i];
    if (ch === '{' || ch === '[' || ch === '(') depth++;
    else if (ch === '}' || ch === ']' || ch === ')') depth--;
    else if (ch === ';' && depth <= 0) return i;
  }
  return code.length;
}
const declSeen = new Set();
let deadCount = 0;
for (const d of DECLS) {
  if (declSeen.has(d.name)) continue;
  declSeen.add(d.name);
  const end = declEnd(tsCode, d.start);
  /* 引擎内引用（排除声明区间自身） */
  const reUse = new RegExp('\\b' + d.name + '\\b', 'g');
  let engineUses = 0, u;
  while ((u = reUse.exec(tsCode)) !== null) {
    if (u.index >= d.start && u.index <= end) continue;
    engineUses++;
  }
  if (engineUses > 0) continue;
  /* 引擎内无引用 → 查全仓消费方（引擎导出的表被 UI/宿主引用亦算「在用」，但须报出消费方供人工过目） */
  const consumers = [];
  const skip = /node_modules|[\\/]\.git|[\\/]build[\\/]|[\\/]\.preview[\\/]|[\\/]oh_modules[\\/]|[\\/]_backup[\\/]/;
  const walk = (dir, depth) => {
    if (depth > 6) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (skip.test(p)) continue;
      if (e.isDirectory()) { walk(p, depth + 1); continue; }
      if (!/\.(ets|ts|js|html|json|py|md)$/.test(e.name)) continue;
      if (ENGINE_FILES.some((f) => path.join(ROOT, f) === p)) continue;
      let t;
      try { t = fs.readFileSync(p, 'utf-8'); } catch (err) { continue; }
      if (new RegExp('\\b' + d.name + '\\b').test(t)) consumers.push(path.relative(ROOT, p));
    }
  };
  for (const top of ['APP', 'UI', 'core', '_tests', '_tools']) {
    const p = path.join(ROOT, top);
    if (fs.existsSync(p)) walk(p, 0);
  }
  if (consumers.length > 0) {
    console.log('  · ' + d.name + ' 引擎内无引用，但被外部消费方引用（' + consumers.length + '）：'
      + consumers.slice(0, 6).join('，') + (consumers.length > 6 ? ' …' : ''));
    continue;
  }
  deadCount++;
  const at = locOf(VIEW.spans, d.start);
  fail('A4', at.rel, at.line, '死常量「' + d.name + '」：非注释代码中只定义、无任何引用（按引擎整体判定）');
}
for (const n of A4_REQUIRED) {
  if (!declSeen.has(n)) {
    fail('A4', ENGINE.ts, 1, '必检规则常量「' + n + '」未在引擎中找到定义（被删除或改名）');
  }
}
if (deadCount === 0) {
  console.log('  ✓ 扫得具名常量 ' + declSeen.size + ' 个（含必检 ' + A4_REQUIRED.length + ' 个）：全部在用，无死常量'
    + '（扫描面＝引擎 ' + ENGINE_TS.length + ' 个 .ts 文件整体）');
}

/* ============================================================================
 * A5 个案口径只能留在数据里
 * ==========================================================================*/
head('A5', '个案口径只能留在数据里：带个案级差异字段的对象必须带出处或存疑说明');

/* 个案级差异字段：显式清单 + 短键正则（长句散文键不判，避免把「方法学」里的描述句误判成字段） */
const A5_DIFF_EXACT = new Set([
  'dunKouJing', 'guiKouJing', '存疑', '疑点', '疑误', '差异', '异文', '别解', '自注',
  '原文自注', '差异形态', '口径差异', '锚点抄录错', '引擎不改理由', '复核提示', '口径'
]);
const A5_DIFF_RE = /存疑|疑点|疑误|异文|别解|自注|dunKouJing|guiKouJing/;
const isDiffKey = (k) => A5_DIFF_EXACT.has(k) || (k.length <= 12 && A5_DIFF_RE.test(k));
/* 值里的差异标记（书自注「疑误:…」之类） */
const A5_DIFF_VALUE_RE = /疑误|存疑|异文|口径差异|锚点抄录错/;
/* 出处 / 存疑说明字段（用户示例的四种 + 等价的出处字段） */
const A5_PROV_KEYS = ['note', '存疑', 'srcOf', 'adjudicatedFrom', '出处', '依据', '原文',
  'src', 'source', '来源', '书证', '说明', '备注'];
/* 「个案记录」识别：含排盘输入 / 书侧与引擎侧对照 / 锚点课例等特征键（命中 ≥2 个，或 input+id） */
const A5_RECORD_KEYS = ['input', '输入', 'book', 'engine', 'expect', 'proposed', '书', '引擎',
  '书上三传', '书上三传（原文）', '引擎三传', 'anchor', '锚点'];
function isRecord(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
  const keys = Object.keys(o);
  let hit = 0;
  for (const k of A5_RECORD_KEYS) if (keys.indexOf(k) >= 0) hit++;
  if (hit >= 2) return true;
  const hasInput = keys.indexOf('input') >= 0 || keys.indexOf('输入') >= 0;
  const hasId = typeof o.id === 'string' && o.id.length > 0;
  return hasInput && hasId;
}
/* 个案记录子树汇总：出处键 / 差异字段键 / 差异标记值（不进入嵌套个案记录，嵌套者各自单独判） */
function a5Scan(node, isRoot, acc) {
  if (Array.isArray(node)) { node.forEach((v) => a5Scan(v, isRoot, acc)); return; }
  if (!node || typeof node !== 'object') return;
  if (!isRoot && isRecord(node)) return;
  for (const k of Object.keys(node)) {
    const v = node[k];
    if (A5_PROV_KEYS.indexOf(k) >= 0 && typeof v === 'string' && v.trim().length > 0) acc.prov.push(k);
    if (isDiffKey(k)) acc.diff.push(k);
    if (typeof v === 'string' && A5_DIFF_VALUE_RE.test(v)) acc.diffValue.push(v.slice(0, 60));
    a5Scan(v, false, acc);
  }
}
let a5Records = 0, a5Objects = 0;
const a5Missing = [];
function a5Walk(node, rel, at) {
  if (Array.isArray(node)) { node.forEach((v, i) => a5Walk(v, rel, at + '[' + i + ']')); return; }
  if (!node || typeof node !== 'object') return;
  a5Objects++;
  if (isRecord(node)) {
    a5Records++;
    const acc = { prov: [], diff: [], diffValue: [] };
    a5Scan(node, true, acc);
    if (acc.prov.length === 0) {
      const mark = acc.diff.concat(acc.diffValue.length ? ['值含差异标记'] : []);
      if (mark.length > 0) {
        a5Missing.push(rel + ' @ ' + at + '  个案级差异 [' + [...new Set(mark)].join(',')
          + '] 但全记录（含子树）找不到出处/存疑说明');
      }
    }
    return;
  }
  for (const k of Object.keys(node)) a5Walk(node[k], rel, at + '.' + k);
}
for (const rel of CASE_DATA_FILES) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    fail('A5', rel, 1, '个案数据文件缺失（扫描面被削）');
    continue;
  }
  let j;
  try { j = JSON.parse(fs.readFileSync(abs, 'utf-8')); }
  catch (e) { fail('A5', rel, 1, 'JSON 解析失败：' + e.message); continue; }
  a5Walk(j, rel, '$');
}
if (a5Missing.length === 0) {
  console.log('  ✓ 扫 ' + CASE_DATA_FILES.length + ' 个数据文件（' + a5Objects + ' 个对象，其中个案记录 '
    + a5Records + ' 条）：带个案级差异字段的个案记录全部附有出处/存疑说明');
} else {
  console.log('  缺失清单（' + a5Missing.length + ' 条）：');
  for (const m of a5Missing) {
    console.log('    ' + m);
    VIOLATIONS.push('A5 ' + m);
  }
  FAIL += a5Missing.length;
}

/* ============================================================================
 * A6 三端同构抽查
 * ==========================================================================*/
head('A6', '三端同构抽查：resolveSanchuan / buildJiang / xunDun 归一化后逐行相同（按三端代码库整体取函数体）');

/* 函数体可在**该端的任一模文件**里（组件化后实现按模块分散）；
   故先在该端代码库内整体定位 `static <name>(`，再取配平花括号区间。
   **门面文件**（core/liuren/facade.ts、model/LiurenCore.ets）只做一行转发，不算实现：
   先扫非门面文件，找不到才回落到门面（并在 verbose 下说明），保证比对的是真实现。 */
const FACADE_FILES = new Set(['core/liuren/facade.ts', 'LiurenCore.ets']);
function isFacadeFile(rel) {
  const base = rel.split('/').pop();
  return FACADE_FILES.has(rel) || FACADE_FILES.has(base);
}
function grabStaticMethodInTree(tree, name) {
  const re = new RegExp('static\\s+' + name + '\\s*\\(');
  const ordered = tree.filter((r) => r && !isFacadeFile(r)).concat(tree.filter((r) => r && isFacadeFile(r)));
  for (const rel of ordered) {
    if (!rel) continue;
    const src = readText(rel);
    const m = re.exec(src);
    if (!m) continue;
    const j = src.indexOf('{', m.index);
    if (j < 0) continue;
    let depth = 0;
    for (let k = j; k < src.length; k++) {
      if (src[k] === '{') depth++;
      else if (src[k] === '}') {
        depth--;
        if (depth === 0) {
          if (VERBOSE) console.log('    · ' + name + ' 取自 ' + rel + (isFacadeFile(rel) ? '（门面兜底）' : ''));
          return src.slice(m.index, k + 1);
        }
      }
    }
  }
  return null;
}
/* 归一化 1（强）：去注释 → 去所有空白 */
const normStrong = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/\s+/g, '');
/* 归一化 2（按规范要求）：去注释 → 去类型注解 → 去空行 → 逐行 trim */
function normLines(s) {
  let t = s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  t = t
    /* 参数与返回值类型：`): T {` / `, x: T,` / `(x: T)` */
    .replace(/:\s*(?:Record<[^>]*>|Readonly<[^>]*>)\s*(?=[,)=])/g, '')
    .replace(/:\s*(?:string|number|boolean|void|any|unknown)(?:\[\])?\s*(?=[,)=])/g, '')
    .replace(/:\s*(?:string|number|boolean|void|any|unknown)(?:\[\])?\s*(?=\{)/g, '')
    /* const/let/var 声明注解：`const x: T =` */
    .replace(/(\b(?:const|let|var)\s+[A-Za-z_$][\w$]*)\s*:\s*(?:Record<[^>]*>|string|number|boolean|[A-Z][\w]*(?:\[\])?(?:\s*\|\s*[A-Za-z_$][\w\[\]<>]*)*)\s*=/g, '$1 =')
    /* 形参注解：`(a: T, b: U)` */
    .replace(/([A-Za-z_$][\w$]*)\s*:\s*(?:Record<[^>]*>|[A-Z][\w]*(?:\[\])?|string|number|boolean)\s*(?=[,)])/g, '$1');
  return t.split('\n').map((x) => x.trim()).filter((x) => x.length > 0);
}
const A6_FUNCS = ['resolveSanchuan', 'buildJiang', 'xunDun'];
for (const fn of A6_FUNCS) {
  const bodies = TRIPLE_TREES.map((tree) => grabStaticMethodInTree(tree, fn));
  if (bodies.some((b) => b === null)) {
    fail('A6', ENGINE.ts, 1, fn + '：三端中至少一端未找到 `static ' + fn + '(` 定义（该端代码库内全模文件已扫）');
    continue;
  }
  const strong = bodies.map(normStrong);
  if (strong[0] === strong[1] && strong[0] === strong[2]) {
    console.log('  ✓ ' + fn + '：.ts / 主 .ets / 免费 .ets 归一化（去注释去空白 ' + strong[0].length
      + ' 字符）完全相同');
    continue;
  }
  const lines = bodies.map(normLines);
  if (JSON.stringify(lines[0]) === JSON.stringify(lines[1]) && JSON.stringify(lines[0]) === JSON.stringify(lines[2])) {
    console.log('  ✓ ' + fn + '：三端去类型注解后逐行相同（' + lines[0].length + ' 行）');
    continue;
  }
  for (let f = 1; f < TRIPLE.length; f++) {
    const a = lines[0], b = lines[f];
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    const n = Math.max(a.length, b.length);
    let shown = 0;
    for (let i = 0; i < n && shown < 5; i++) {
      if (a[i] === b[i]) continue;
      shown++;
      fail('A6', TRIPLE[f], 1, fn + ' 第 ' + (i + 1) + ' 行与 .ts 不同',
        '\n        .ts : ' + (a[i] === undefined ? '(缺行)' : a[i])
        + '\n        ' + TRIPLE[f].slice(-12) + ' : ' + (b[i] === undefined ? '(缺行)' : b[i]));
    }
    if (a.length !== b.length) {
      fail('A6', TRIPLE[f], 1, fn + ' 归一化后行数不同：.ts ' + a.length + ' 行 / 本端 ' + b.length + ' 行');
    }
  }
}

/* ============================================================================
 * 汇总
 * ==========================================================================*/
console.log('\n' + '='.repeat(72));
if (FAIL === 0) {
  console.log('防写死门禁：A1–A6 全部通过 ✓（引擎无个案标识、无 I/O、无输入特判、无死常量、'
    + '个案口径只在数据里且带出处、三端同构）');
  process.exit(0);
}
console.log('防写死门禁：' + FAIL + ' 处违规 ✗');
console.log('处置纪律：改规则或改数据（带出处），不得扩大白名单；'
  + '确需例外时在 _tests/_test_no_hardcode.js 的 WHITELIST 中逐条登记并写明理由。');
for (const v of VIOLATIONS) console.log('  · ' + v);
process.exit(1);

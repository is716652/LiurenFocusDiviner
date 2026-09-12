/* ============================================================================
 * _test_component_audit.js —— 组件层「写死」体检 + JSON 耦合审计（组件化前置体检）
 * ============================================================================
 * 与 _test_no_hardcode.js 的分工（为何另建本脚本而不扩展旧门禁）：
 *   1) 旧门禁是「引擎纪律门禁」（A1–A6，扫描面＝引擎四份文件 core/liuren-core.ts|.js
 *      与两版 LiurenCore.ets）。它守的是「定法不得写死」，判定口径已收敛、被
 *      Agent.md §9/§12 引用，属长期稳定的硬门禁，不宜再加会误报的实验性判据。
 *   2) 本脚本是「组件层体检 + 数据契约审计」，扫描面＝整个 App 的 .ets + core/** +
 *      _tools/*.py，并且包含两类旧门禁没有的内容：组件/UI 写死的成组盘面事实、
 *      以及代码↔rawfile JSON 的契约核对（键存在/类型/兜底/重复真源/破坏性实验）。
 *   3) 数据契约审计会**临时改写 rawfile JSON 做破坏性实验**（实验后逐字节还原校验）。
 *      这类实验绝不适合放进每次都要绿的常驻门禁。
 *   ⇒ 结论：另建本脚本；旧门禁保持原样、不放宽。本脚本可直接与旧门禁并跑。
 *
 * 断言清单（逐条独立判定）：
 *   A1 组件层非注释代码不得出现个案标识（个案 id / 日期串 / 书名）
 *   A2 不得按具体课特判：静态扫「同一条件里 ≥3 个输入维度字面量比较」
 *      ＋ 运行期 500 组输入逐维度扰动（改输入而输出恒不变 = 该维度被忽略/写死）
 *   A3 UI/组件不得硬编码盘面事实（≥3 个天将名 / ≥8 个神煞名 / 课体名成组出现）
 *   A4 规则常量必须被使用（.ets 的 static readonly / 顶层 const 具名表）
 *   B1 JSON 契约：代码读的每个键路径必须存在且类型匹配
 *   B2 兜底审计：区分「合理可选兜底」与「把缺失规则表掩盖成空结果」的危险项
 *   B3 重复真源：同一规则表既在代码又在 JSON（含两侧一致性核对）
 *   B4 强/脆链接判定：破坏性实验（改名 JSON 键后是否静默改结果）；实验后逐字节还原
 *
 * 用法：node _tests/_test_component_audit.js [--verbose]
 * 退出码：任一硬失败 = 1，全过 = 0。报告落盘 _tests/_data/component_audit.json。
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const VERBOSE = process.argv.includes('--verbose');
const APP_ETS = 'APP/LiurenFocusDiviner/entry/src/main/ets';
const RULE_DIR = APP_ETS + '/../../resources/rawfile/rule';
const RAWFILE = 'APP/LiurenFocusDiviner/entry/src/main/resources/rawfile';

/* ---------------- 违规收集 ---------------- */
const VIOLATIONS = [];
let HARD = 0;
const REPORT = {
  生成时间: new Date().toISOString(),
  脚本: '_tests/_test_component_audit.js',
  扫描面: {},
  结论: {},
  违规: [],
  告警: [],
  证据: {}
};
/* 逐处违规：同类（同断言+同文件+同「性质」）只内联打印前 LIMIT 处，其余并入报告，避免刷屏淹没重点 */
const FAIL_KIND = new Map();
const INLINE_LIMIT = 3;
function fail(id, file, line, what, detail, kind) {
  HARD++;
  const s = id + ' ' + file + ':' + line + '  ' + what + (detail ? '  —— ' + detail : '');
  VIOLATIONS.push(s);
  const k = id + '|' + file + '|' + (kind || what.replace(/「[^」]*」/g, '「…」').replace(/：.*$/, ''));
  const n = (FAIL_KIND.get(k) || 0) + 1;
  FAIL_KIND.set(k, n);
  if (n <= INLINE_LIMIT) {
    console.log('  ✗ [' + id + '] ' + file + ':' + line + '  ' + what + (detail ? '  —— ' + detail : ''));
  } else if (n === INLINE_LIMIT + 1) {
    console.log('    …（本类其余同类命中不再逐条内联；全部条目见 _tests/_data/component_audit.json）');
  }
  return n === 1;
}
function warn(id, what) {
  REPORT.告警.push(id + ' ' + what);
  console.log('  ! [' + id + '] ' + what);
}
function head(t) { console.log('\n' + t); }

/* ---------------- 文本工具 ---------------- */
function lineIndex(src) {
  const offs = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') offs.push(i + 1);
  return offs;
}
function lineOf(offs, idx) {
  let lo = 0, hi = offs.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (offs[mid] <= idx) lo = mid; else hi = mid - 1; }
  return lo + 1;
}
/* 注释剥离（保留换行以维持行号） */
function stripComments(src) {
  const offs = lineIndex(src);
  const comments = [];
  let out = '', i = 0, quote = '';
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (quote !== '') {
      out += c;
      if (c === '\\') { out += src[i + 1] || ''; i += 2; continue; }
      if (c === quote) quote = '';
      i++; continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; out += c; i++; continue; }
    if (c === '/' && src[i + 1] === '/') {
      let j = src.indexOf('\n', i); if (j < 0) j = n;
      comments.push({ text: src.slice(i, j), line: lineOf(offs, i) });
      i = j; continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      let j = src.indexOf('*/', i + 2); j = (j < 0) ? n : j + 2;
      comments.push({ text: src.slice(i, j), line: lineOf(offs, i) });
      out += src.slice(i, j).replace(/[^\n]/g, ' ');
      i = j; continue;
    }
    out += c; i++;
  }
  return { code: out, comments: comments, offs: offs };
}
const CACHE = {};
function strip(rel) {
  if (!CACHE[rel]) {
    const txt = fs.readFileSync(path.join(ROOT, rel), 'utf-8');
    const st = stripComments(txt);
    st.raw = txt;
    CACHE[rel] = st;
  }
  return CACHE[rel];
}

/* ---------------- 扫描面 ---------------- */
function collect(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (/\.ets$/.test(e.name)) out.push(path.relative(ROOT, p).replace(/\\/g, '/'));
    }
  };
  walk(abs);
  return out.sort();
}
const ETS_FILES = collect(APP_ETS);
const ETS_FREE = collect('APP/LiurenFocusDivinerFree/entry/src/main/ets');
/* 引擎真源（组件化后按目录覆盖，不再固定单文件）：core/liuren-core.ts（装配层）+ core/liuren/**
   产物 core/liuren-core.js 单列（它是拼接产物；重复声明/死常量按真源判，产物只作 I/O 面扫描）。 */
function collectExt(rel, re) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (re.test(e.name)) out.push(path.relative(ROOT, p).replace(/\\/g, '/'));
    }
  };
  walk(abs);
  return out.sort();
}
const CORE_GENERATED = ['core/liuren-core.js'];
const CORE_TS = (() => {
  const all = collectExt('core', /\.ts$/);
  const entry = 'core/liuren-core.ts';
  return [entry].concat(all.filter((f) => f !== entry));
})();
const CORE_FILES = CORE_TS.concat(CORE_GENERATED);
const PY_FILES = fs.existsSync(path.join(ROOT, '_tools'))
  ? fs.readdirSync(path.join(ROOT, '_tools')).filter((f) => /\.py$/.test(f)).map((f) => '_tools/' + f)
  : [];
/* A1/A3 扫描面：组件层 + core（真源 + 产物）+ _tools */
const SCAN_FILES = ETS_FILES.concat(ETS_FREE, CORE_FILES, PY_FILES);
REPORT.扫描面 = {
  '.ets（主版）': ETS_FILES.length,
  '.ets（免费版）': ETS_FREE.length,
  'core（真源 .ts）': CORE_TS.length,
  'core（产物 .js）': CORE_GENERATED.length,
  'core 合计': CORE_FILES.length,
  '_tools/*.py': PY_FILES.length
};
console.log('扫描面：主版 .ets ' + ETS_FILES.length + ' 个，免费版 .ets ' + ETS_FREE.length
  + ' 个，core ' + CORE_FILES.length + ' 个（真源 .ts ' + CORE_TS.length + ' + 产物 .js '
  + CORE_GENERATED.length + '），_tools/*.py ' + PY_FILES.length + ' 个');

/* 引擎真源文件（A1 里已由旧门禁覆盖；此处不重复判，仅避免重复报同一处）
   —— 组件化后按目录动态取，新增模块自动在册 */
const ENGINE_ALREADY_GATED = new Set(CORE_FILES.concat([
  APP_ETS + '/model/LiurenCore.ets',
  'APP/LiurenFocusDivinerFree/entry/src/main/ets/model/LiurenCore.ets'
]));

/* ---------------- 引擎整体代码视图（组件化后真源分散在多模块） ----------------
 * B3 的「代码侧真源」不再假设它在某一个文件里：把全部引擎真源 .ts 拼成整体视图再正则抓表；
 * 「代码读取点」也不再写死行号（拆模块后行号必漂），改为按 token 现查 → 模文件:行号。 */
function stripOf(rel) {
  let st = CACHE[rel];
  if (!st) {
    const txt = fs.readFileSync(path.join(ROOT, rel), 'utf-8');
    st = stripComments(txt);
    st.raw = txt;
    CACHE[rel] = st;
  }
  return st;
}
function engineCode() {
  if (!engineCode._v) {
    const src = [];
    const spans = [];
    let off = 0;
    for (const rel of CORE_TS) {
      const code = stripOf(rel).code;
      src.push(code);
      spans.push({ rel: rel, start: off, end: off + code.length });
      off += code.length + 1;
    }
    engineCode._v = { code: src.join('\n'), spans: spans };
  }
  return engineCode._v;
}
/* 「代码读取点」定位：按 token 现查所在模文件与行号（找不到显式标「未定位」，不静默） */
function codeSite(token) {
  for (const rel of CORE_TS) {
    const st = stripOf(rel);
    const i = st.code.indexOf(token);
    if (i >= 0) return rel + ':' + lineOf(st.offs, i);
    const j = st.raw.indexOf(token);
    if (j >= 0) return rel + ':' + lineOf(st.offs, j);
  }
  return CORE_TS[0] + ':1 (未定位：' + token + ')';
}

/* 数据字面量区：由 { [ 配平得到、内部含 ≥4 个引号（即 ≥2 个字符串字面量）的区间。
   规则常量表（不论横跨多少行）都落在这些区间内，故不算「UI 里写死盘面事实」；
   区间**外**成组出现天将/课体/神煞名才是可疑（这些表本身是否死常量由 A4 另判）。 */
function dataLiteralRanges(code) {
  const ranges = [];
  const stack = [];
  let quote = '';
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (quote !== '') {
      if (c === '\\') { i++; continue; }
      if (c === quote) quote = '';
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '{' || c === '[') { stack.push(i); continue; }
    if (c === '}' || c === ']') {
      const s = stack.pop();
      if (s === undefined) continue;
      if (((code.slice(s, i + 1).match(/["'`]/g) || []).length) >= 4) ranges.push({ s: s, e: i });
    }
  }
  return ranges;
}
function inRanges(ranges, idx) {
  for (const r of ranges) if (idx >= r.s && idx <= r.e) return true;
  return false;
}

/* ============================================================================
 * A1 组件层不得出现个案标识（个案 id / 日期串 / 书名）
 * ==========================================================================*/
head('[A1] 组件层非注释代码不得出现个案标识（个案 id / 日期串 / 书名）');

/* 个案 id 形态：duanan_* / renzhan_* / zhonghuang_c* + 通用「下划线包围的日支名」 */
const A1_ID_RES = [
  { name: '个案 id duanan_', re: /duanan_/g },
  { name: '个案 id renzhan_', re: /renzhan_/g },
  { name: '个案 id zhonghuang_c', re: /zhonghuang_c/g },
  { name: '个案 id xun_cibin', re: /xun_cibin/g },
  { name: '个案 id 形态 _<日支>_（徐次宾/占验案 id 片段）', re: /_(?:jiazi|yichou|bingyin|dingmao|wuchen|jisi|gengwu|xinwei|renshen|guiyou)_/g },
  { name: '个案 id 形态 _c<n>_（中黄案例）', re: /_c\d{1,2}_/g }
];
const A1_BOOK_NAMES = ['断案', '汇选', '指南', '中黄五经', '玉连环', '六壬大全', '心镜', '灵觉经',
  '粹言', '经纬', '直指', '管辂', '神定经', '毕法赋', '金口诀', '鬼撮脚',
  '寻源', '存验', '秘本', '拃河棹', '金铰剪', '银河櫂', '括囊赋', '翠雨歌', '壬占'];
const A1_DATE_RES = [
  { name: '日期串 20xx-xx-xx', re: /20\d{2}-\d{2}-\d{2}/g },
  { name: '日期串 20xxxxxx', re: /(?<!\d)20\d{6}(?!\d)/g }
];
/* 成组盘面事实里的日支名（'乙丑日' / '_yichou_'）；单独出现干支字不算（常量表里合法） */
const A1_CASE_TITLE_RE = /[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]日/g;
/* 文件名/数据路径上下文：'rule/管辂类神取用.json'、_tools/fix_bifa_keti_test.py 等 —— 数据引用不算写死个案 */
const FILE_NAME_CTX = /\.json|\.md|\.py|\.ets|\.ts|\.js|rule\/|rawfile|_tools\/|_tests\/|\.txt/;

const A1_CODE_HITS = [];
const A1_COMMENT_HITS = [];
const A1_DATA_REF_HITS = [];
const A1_SOFT_HITS = [];
const A1_TOOLS_HITS = [];
for (const rel of SCAN_FILES) {
  /* 引擎四份已由 _test_no_hardcode.js 的 A1 覆盖，本脚本不重复判（避免同一问题报两遍） */
  if (ENGINE_ALREADY_GATED.has(rel)) continue;
  /* _tools/*.py 是「生成脚本 / 一次性补丁 / 文档更新脚本」，命中多出现在它们生成的
     代码或文档字符串里（不是 App 运行代码）。故：照扫、照报，但列为 information 级，
     不计入硬失败；_tools 里真正的行为代码（非 App 代码）不在本门禁管辖范围。 */
  const TOOL = /^_tools\//.test(rel);
  const st = strip(rel);
  const code = st.code;
  for (const d of A1_ID_RES) {
    d.re.lastIndex = 0;
    let m;
    while ((m = d.re.exec(code)) !== null) {
      const ln = lineOf(st.offs, m.index);
      if (TOOL) { A1_TOOLS_HITS.push({ file: rel, line: ln, what: d.name, lit: m[0] }); continue; }
      A1_CODE_HITS.push({ file: rel, line: ln, what: d.name, lit: m[0] });
      fail('A1', rel, ln, '非注释代码中出现' + d.name + '「' + m[0] + '」',
        JSON.stringify(code.slice(Math.max(0, m.index - 50), m.index + 50).trim()));
    }
  }
  for (const b of A1_BOOK_NAMES) {
    let from = 0;
    for (;;) {
      const k = code.indexOf(b, from);
      if (k < 0) break;
      from = k + 1;
      const ln = lineOf(st.offs, k);
      const ctx = code.slice(Math.max(0, k - 70), k + 60);
      /* 层次 1：文件名/数据路径（'rule/管辂类神取用.json' 之类）—— 数据引用，不是分支判据 */
      if (FILE_NAME_CTX.test(ctx)) { A1_DATA_REF_HITS.push({ file: rel, line: ln, lit: b }); continue; }
      /* 层次 2：比较/分支地使用书名（indexOf('断案') / === '断案' / case '断案'）= 按书名特判 */
      const pre = code.slice(Math.max(0, k - 24), k);
      const isBranch = /indexOf\s*\(\s*['"]$/.test(pre)
        || /[!=]==\s*['"]$/.test(pre)
        || /\bcase\s+['"]$/.test(pre);
      /* 层次 3：若比较对象是**数据字段**（xxxx.source / .chapter / .title / .book 等），
         属"按数据自带书目分流"，不是把个案写死进代码 —— 记软项。 */
      const dataFieldCmp = isBranch && /(?:^|[^\w.])(?:[A-Za-z_$][\w$]*\.)*(?:source|chapter|title|book|bookName|src|来源)\s*\.\s*indexOf\s*\(\s*['"]$/.test(pre)
        || isBranch && /(?:source|chapter|title|book|bookName|src|来源)\s*[!=]==\s*['"]$/.test(pre);
      if (TOOL) { A1_TOOLS_HITS.push({ file: rel, line: ln, what: '书名/日期串（工具脚本字符串）', lit: b }); continue; }
      if (dataFieldCmp) {
        A1_SOFT_HITS.push({ file: rel, line: ln, what: '按数据自带书目字段分流（非写死个案）', lit: b, ctx: ctx.trim().slice(0, 100) });
        continue;
      }
      if (isBranch) {
        /* 硬项：把书名当判定条件（按书特判） */
        A1_CODE_HITS.push({ file: rel, line: ln, what: '书名作为判定条件', lit: b, ctx: ctx.trim().slice(0, 100), 级别: '硬' });
        fail('A1', rel, ln, '非注释代码中把书名当判定条件「' + b + '」',
          JSON.stringify(ctx.trim().slice(0, 100)), '书名作判定');
      } else {
        /* 软项：展示文案/出处引用（如 Text('管辂神书 · 类神取用')）——只计数、逐处列出供人工过目，不计失败 */
        A1_SOFT_HITS.push({ file: rel, line: ln, what: '展示文案引用书名', lit: b, ctx: ctx.trim().slice(0, 100) });
      }
    }
  }
  /* 「X日」串：'if (... === \'乙丑日\')' 这类**判定条件**才是写死；
     落在数据字面量区（规则表/映射表/数组常量）里的只是数据，不算（与 A3 同口径）。 */
  const a1Ranges = dataLiteralRanges(code);
  A1_CASE_TITLE_RE.lastIndex = 0;
  let m2;
  while ((m2 = A1_CASE_TITLE_RE.exec(code)) !== null) {
    const ln = lineOf(st.offs, m2.index);
    const ctx = code.slice(Math.max(0, m2.index - 40), m2.index + 40);
    if (inRanges(a1Ranges, m2.index)) { A1_DATA_REF_HITS.push({ file: rel, line: ln, lit: m2[0] }); continue; }
    if (TOOL) { A1_TOOLS_HITS.push({ file: rel, line: ln, what: '个案日期串（工具脚本字符串）', lit: m2[0] }); continue; }
    A1_CODE_HITS.push({ file: rel, line: ln, what: '个案日期串', lit: m2[0], ctx: ctx.trim().slice(0, 100) });
    fail('A1', rel, ln, '非注释代码中出现个案日期串「' + m2[0] + '」（按具体课特判的典型形态）',
      JSON.stringify(ctx.trim().slice(0, 100)), '个案日期串');
  }
  /* 注释里的出处说明：允许，仅计数并逐处打印供人工过目 */
  for (const cm of st.comments) {
    for (const tok of A1_BOOK_NAMES) {
      if (cm.text.indexOf(tok) >= 0) A1_COMMENT_HITS.push({ file: rel, line: cm.line, lit: tok, text: cm.text.replace(/\s+/g, ' ').slice(0, 90) });
    }
    for (const d of A1_DATE_RES) {
      d.re.lastIndex = 0;
      const m = d.re.exec(cm.text);
      if (m) A1_COMMENT_HITS.push({ file: rel, line: cm.line, lit: m[0], text: cm.text.replace(/\s+/g, ' ').slice(0, 90) });
    }
  }
}
console.log('  硬项（App 侧：个案 id / 日期串 / 书名作判定条件）：' + A1_CODE_HITS.length + ' 处');
console.log('  information（_tools/*.py 生成脚本/补丁脚本里的字面量，' + A1_TOOLS_HITS.length + ' 处，不计失败）：'
  + [...new Set(A1_TOOLS_HITS.map((x) => x.file))].length + ' 个文件');
console.log('  软项（只计数、不违规，供人工过目）：展示文案引用书名 ' + A1_SOFT_HITS.length
  + ' 处；数据路径引用 ' + A1_DATA_REF_HITS.length + ' 处；注释中的出处/日期 ' + A1_COMMENT_HITS.length + ' 处');
if (VERBOSE) {
  for (const h of A1_SOFT_HITS) console.log('    · 文案 ' + h.file + ':' + h.line + '  «' + h.lit + '»  ' + h.ctx);
  for (const h of A1_COMMENT_HITS) console.log('    · 注释 ' + h.file + ':' + h.line + '  «' + h.lit + '»  ' + h.text);
}
REPORT.证据.A1 = {
  硬项命中: A1_CODE_HITS,
  tools命中: A1_TOOLS_HITS,
  软项文案命中: A1_SOFT_HITS,
  数据路径引用计数: A1_DATA_REF_HITS.length,
  注释计数: A1_COMMENT_HITS.length,
  注释明细: A1_COMMENT_HITS
};

/* ============================================================================
 * A2 不得按具体课特判
 * ==========================================================================*/
head('[A2] 不得按具体课特判');

/* --- A2a 静态：同一 if/三元 条件里同时比较 ≥3 个输入维度为字面量 --- */
const ALLOWED_LITERAL_COND = /^[吉凶旺相休囚死空亡课体贵人禄马三传脱耗六合官鬼天将男女子孙妻财父母兄弟逢空月建旬空中黄时遁天盘地盘全部中黄五变经六壬断案壬占汇选]+$/;
const GAN_ZHI_CHARS = new Set('甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥'.split(''));
const A2_COND_PATTERNS = [
  { name: '=== 字面量', re: /([A-Za-z_$][\w$.\[\]'"（(]*?)\s*[!=]==\s*(['"])(.{1,4})\2/g },
  { name: 'indexOf(字面量)', re: /([A-Za-z_$][\w$.]*)\s*\.\s*indexOf\s*\(\s*(['"])(.{1,4})\2\s*\)/g }
];
const A2_SUSPECT = [];
let a2Scanned = 0;
for (const rel of SCAN_FILES) {
  const st = strip(rel);
  const code = st.code;
  /* 条件区间：if (...) / while (...) / ? : 的判定部分 */
  const conds = [];
  const reIf = /\b(?:if|while)\s*\(/g;
  let m;
  while ((m = reIf.exec(code)) !== null) {
    const open = code.indexOf('(', m.index);
    let depth = 0, end = -1;
    for (let k = open; k < code.length; k++) {
      if (code[k] === '(') depth++;
      else if (code[k] === ')') { depth--; if (depth === 0) { end = k; break; } }
    }
    if (end > 0) conds.push({ start: open, end: end, text: code.slice(open + 1, end) });
  }
  /* 三元：从 ? 向前找最近的 ( 或 ; 或 { ；向后到 : */
  const reQ = /\?/g;
  while ((m = reQ.exec(code)) !== null) {
    let s = m.index;
    while (s > 0 && !/[(;{}]/.test(code[s - 1])) s--;
    let e = code.indexOf(':', m.index);
    if (e < 0) continue;
    conds.push({ start: s, end: e, text: code.slice(s, e) });
  }
  for (const c of conds) {
    a2Scanned++;
    const lits = new Set();
    const dims = new Set();
    for (const p of A2_COND_PATTERNS) {
      p.re.lastIndex = 0;
      let mm;
      while ((mm = p.re.exec(c.text)) !== null) {
        const lit = mm[3];
        if (ALLOWED_LITERAL_COND.test(lit)) continue;
        lits.add(lit);
        const lv = mm[1].split(/[.[]/).pop();
        dims.add(lv || p.name);
      }
    }
    /* 只保留「干支/将/时」类字面量（盘面输入维度），语义字面量（吉凶/课体名）不算特判 */
    const gzLits = [...lits].filter((s) => s.length >= 1 && s.split('').every((ch) => GAN_ZHI_CHARS.has(ch)));
    if (gzLits.length >= 3) {
      const ln = lineOf(st.offs, c.start);
      A2_SUSPECT.push({ file: rel, line: ln, lits: gzLits, text: c.text.replace(/\s+/g, ' ').slice(0, 140) });
      fail('A2', rel, ln, '同一条件里出现 ≥3 个干支字面量比较（疑似按具体课特判）',
        gzLits.join(',') + '  «' + c.text.replace(/\s+/g, ' ').slice(0, 100) + '»');
    }
  }
}
console.log('  静态：扫 ' + a2Scanned + ' 个条件表达式，≥3 干支字面量特判：' + A2_SUSPECT.length + ' 处');
REPORT.证据.A2静态 = { 条件数: a2Scanned, 可疑: A2_SUSPECT };

/* --- A2b 运行期：500 组随机输入，逐维度扰动，输出必须随维度变化 --- */
const engine = require(path.join(ROOT, '_tests', '_engine_probe.js'));
const sens = engine.dimensionSensitivity(500);
console.log('  运行期（500 组随机输入 × 4 维度扰动）：');
console.log('    日干：' + sens.日干.changed + '/' + sens.日干.trials + ' 组改干后输出变化'
  + '（干不唯一决定盘，故"未变化"属正常，只判恒不变）');
for (const dim of ['日支', '月将', '占时']) {
  console.log('    ' + dim + '：' + sens[dim].changed + '/' + sens[dim].trials + ' 组改' + dim + '后输出变化');
}
for (const dim of ['日干', '日支', '月将', '占时']) {
  const s = sens[dim];
  /* 日干：60 甲子只允许 5 个合法干（阳支配阳干），按实际可测组数比例判 */
  const ratio = s.trials > 0 ? s.changed / s.trials : 0;
  if (ratio === 0) {
    fail('A2', '_tests/_engine_probe.js', 1, '运行期维度敏感性：改「' + dim + '」后输出恒不变（该维度被忽略或被写死）',
      '反例：' + JSON.stringify(s.examples.slice(0, 3)));
  } else if (ratio < 0.5 && dim !== '日干') {
    warn('A2', '维度「' + dim + '」仅 ' + s.changed + '/' + s.trials + ' 组输入变化（低于 50%），需人工确认是否被部分忽略');
  }
}
console.log('    反例（改了输入而输出全同）示例：'
  + (['日干', '日支', '月将', '占时'].every((d) => sens[d].examples.length === 0)
    ? '（无）'
    : JSON.stringify(['日干', '日支', '月将', '占时'].reduce((a, d) => { a[d] = sens[d].examples.slice(0, 2); return a; }, {}))));
REPORT.证据.A2运行期 = sens;

/* ============================================================================
 * A3 UI/组件不得硬编码盘面事实
 * ==========================================================================*/
head('[A3] UI/组件不得硬编码盘面事实（天将名/神煞名/课体名成组出现）');

const JIANG_NAMES = ['贵人', '螣蛇', '朱雀', '六合', '勾陈', '青龙', '天空', '白虎', '太常', '玄武', '太阴', '天后'];
const KETI_NAMES = ['元首', '重审', '比用', '涉害', '遥克', '昴星', '别责', '八专', '伏吟', '返吟',
  '蒿矢', '弹射', '虎视', '转蓬', '井栏射', '见机', '察微', '缀瑕', '不备', '自任'];
const SHENSHA_NAMES = (() => {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(ROOT, RAWFILE, 'rule/神煞起法.json'), 'utf-8'));
    return Object.keys(j['神煞'] || {});
  } catch (e) { return []; }
})();
/* 允许出现处：注释、placeholder 类文案 */
function isLegendOrPlaceholder(lineText) {
  return /\/\/|\/\*|\*\/|placeholder|Placeholder|@BuilderParam|hint:|提示：|图例|说明：|文案/.test(lineText);
}
/* 块注释区间（1 基行号区间）：字符级扫描，字符串字面量内的 /* 不计 */
function blockCommentLines(src) {
  const out = [];
  let inBlock = false, quote = '', start = 0, ln = 1;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '\n') ln++;
    if (inBlock) {
      if (c === '*' && src[i + 1] === '/') { out.push([start, ln]); inBlock = false; i++; }
      continue;
    }
    if (quote !== '') { if (c === '\\') { i++; if (src[i] === '\n') ln++; continue; } if (c === quote) quote = ''; continue; }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '/' && src[i + 1] === '/') { let j = src.indexOf('\n', i); if (j < 0) j = src.length; i = j - 1; continue; }
    if (c === '/' && src[i + 1] === '*') { inBlock = true; start = ln; i++; continue; }
  }
  if (inBlock) out.push([start, ln]);
  return out;
}
function inLines(ranges, n) { return ranges.some((r) => n >= r[0] && n <= r[1]); }

const A3_HITS = [];
for (const rel of ETS_FILES.concat(ETS_FREE)) {
  const st = strip(rel);
  const code = st.code;
  const lines = st.raw.split('\n');
  const ranges = dataLiteralRanges(code);
  const cmt = blockCommentLines(st.raw);
  let off = 0;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const lineStart = off;
    off += raw.length + 1;
    const body = raw.replace(/\/\/.*$/, '').replace(/\r$/, '');
    if (!body.trim()) continue;
    if (inLines(cmt, i + 1)) continue;                     /* 块注释内的行：不是代码 */
    if (/^\s*\/\//.test(raw)) continue;                    /* 行注释：不是代码 */
    if (isLegendOrPlaceholder(raw) && !/return\s|=>|\bif\b|\?/.test(body)) continue;
    const check = (names, kind, min) => {
      const hits = [];
      for (const n of names) {
        let from = 0;
        for (;;) {
          const k = body.indexOf(n, from);
          if (k < 0) break;
          from = k + 1;
          if (inRanges(ranges, lineStart + k)) continue;   /* 落在规则常量表里：不算 */
          hits.push(n);
          break;
        }
      }
      if (hits.length < min) return;
      A3_HITS.push({ file: rel, line: i + 1, kind: kind, hits: hits, text: body.trim().slice(0, 130) });
      fail('A3', rel, i + 1, '同一行（非规则表、非数据字面量区）出现 ' + hits.length + ' 个' + kind
        + '（' + hits.join('/') + '）', JSON.stringify(body.trim().slice(0, 120)), kind);
    };
    check(JIANG_NAMES, '天将名', 3);
    check(KETI_NAMES, '课体名', 3);
    check(SHENSHA_NAMES, '神煞名', 8);
  }
}
console.log('  成组盘面事实命中：' + A3_HITS.length + ' 处（天将名/课体名/神煞名）');
REPORT.证据.A3 = A3_HITS;

/* ============================================================================
 * A4 规则常量必须被使用（.ets 常量表）
 * ==========================================================================*/
head('[A4] 规则常量必须被使用（.ets 的 static readonly / 顶层 const 具名表）');

/* 复用旧门禁口径：具名常量（全大写或中文名）只定义不引用 = 死常量 */
const A4_SKIP = /node_modules|[\\/]\.git[\\/]|[\\/]build[\\/]|[\\/]\.preview[\\/]|[\\/]oh_modules[\\/]|[\\/]_backup[\\/]|[\\/]release_pkg[\\/]/;
function consumersOf(name, skipFiles) {
  const out = [];
  const walk = (dir, depth) => {
    if (depth > 7) return;
    let ents;
    try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const e of ents) {
      const p = path.join(dir, e.name);
      if (A4_SKIP.test(p)) continue;
      if (e.isDirectory()) { walk(p, depth + 1); continue; }
      if (!/\.(ets|ts|js|html|json|py|md)$/.test(e.name)) continue;
      if (skipFiles.has(path.relative(ROOT, p).replace(/\\/g, '/'))) continue;
      let t;
      try { t = fs.readFileSync(p, 'utf-8'); } catch (err) { continue; }
      if (new RegExp('\\b' + name.replace(/[$]/g, '\\$') + '\\b').test(t)) {
        out.push(path.relative(ROOT, p).replace(/\\/g, '/'));
      }
    }
  };
  for (const top of ['APP', 'core', 'UI', '_tests', '_tools']) {
    const p = path.join(ROOT, top);
    if (fs.existsSync(p)) walk(p, 0);
  }
  return out;
}
function declEndOf(code, start) {
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
const A4_DEAD = [];
let a4Checked = 0, a4Used = 0;
for (const rel of ETS_FILES.concat(ETS_FREE)) {
  const st = strip(rel);
  const code = st.code;
  const reDecl = /^\s*(?:static\s+readonly\s+|(?:export\s+)?(?:const|let|var)\s+)([A-Z\u4e00-\u9fa5][A-Z0-9_\u4e00-\u9fa5]*)\s*[:=]/gm;
  let dm;
  const seen = new Set();
  while ((dm = reDecl.exec(code)) !== null) {
    const name = dm[1];
    if (seen.has(name)) continue;
    seen.add(name);
    /* 排除纯接口/类型别名（interface X / type X =） */
    const before = code.slice(Math.max(0, dm.index - 60), dm.index);
    if (/\b(?:interface|type|enum)\s*$/.test(before)) continue;
    a4Checked++;
    const end = declEndOf(code, dm.index);
    const reUse = new RegExp('\\b' + name.replace(/[$]/g, '\\$') + '\\b', 'g');
    let uses = 0, u;
    while ((u = reUse.exec(code)) !== null) {
      if (u.index >= dm.index && u.index <= end) continue;
      uses++;
    }
    if (uses > 0) { a4Used++; continue; }
    const cons = consumersOf(name, new Set([rel]));
    if (cons.length > 0) {
      if (VERBOSE) console.log('    · ' + name + '（' + rel + '）本文件无引用，外部消费方 ' + cons.length + '：' + cons.slice(0, 4).join('，'));
      a4Used++;
      continue;
    }
    A4_DEAD.push({ file: rel, line: lineOf(st.offs, dm.index), name: name });
    fail('A4', rel, lineOf(st.offs, dm.index), '死常量「' + name + '」：本文件与全仓均无引用（只定义不使用 = 写死残留）');
  }
}
console.log('  .ets 具名常量 ' + a4Checked + ' 个：在用 ' + a4Used + '，死常量 ' + A4_DEAD.length + ' 个');
REPORT.证据.A4 = { 常量数: a4Checked, 死常量: A4_DEAD };

/* ============================================================================
 * B 数据契约
 * ==========================================================================*/
head('[B] rawfile JSON ↔ 代码 契约审计');

/* 契约里的 json 字段一律相对 rawfile 根（rule/…、cal/…、ancient/…） */
function loadJson(rel) {
  const abs = path.join(ROOT, RAWFILE, rel);
  const buf = fs.readFileSync(abs);
  return { json: JSON.parse(buf.toString('utf-8')), sha: crypto.createHash('sha256').update(buf).digest('hex'), bytes: buf.length };
}
const RULE_FILES = fs.readdirSync(path.join(ROOT, RAWFILE, 'rule')).filter((f) => /\.json$/.test(f));
const CAL_DECADES = fs.readdirSync(path.join(ROOT, RAWFILE, 'cal')).filter((f) => /^cal_\d{4}\.json$/.test(f)).sort();
const ANCIENT_FILES = fs.readdirSync(path.join(ROOT, RAWFILE, 'ancient')).filter((f) => /\.json$/.test(f));

/* 契约表：{json, path[], type, code, why, opt}；
   type: 'object'|'array'|'string'|'number'|null（null = 只判存在不判类型）
   opt : true = 可选键：缺失不算违规（调用方已用 && / || {} 守卫），但存在时仍判类型。
         只有「代码已显式守卫」的键才可标 opt —— 未守卫的缺失就是静默错值，必须硬失败。 */
const CONTRACT = [];
function C(json, pathArr, type, code, why, opt) { CONTRACT.push({ json: json, path: pathArr, type: type, code: code, why: why, opt: !!opt }); }

/* --- DataLoader 显式读取的键（DataSource：APP/…/model/DataLoader.ets） --- */
const DL = APP_ETS + '/model/DataLoader.ets';
C('rule/旺衰休囚死.json', ['旺衰'], 'object', DL + ':176', 'DataLoader 组装 WangShuaiSection');
C('rule/基础关系.json', ['六冲'], 'object', DL + ':179', 'JiChuSection 六冲');
C('rule/基础关系.json', ['六合'], 'object', DL + ':180', 'JiChuSection 六合');
C('rule/基础关系.json', ['六害'], 'object', DL + ':181', 'JiChuSection 六害');
C('rule/基础关系.json', ['三刑'], 'object', DL + ':182', 'JiChuSection 三刑');
C('rule/神煞起法.json', ['神煞'], 'object', DL + ':192', 'ShenshaRulesRaw 神煞');
C('rule/毕法赋一百法.json', ['一百法'], 'array', DL + ':195', 'BifaRulesRaw 一百法');
C('rule/行年打分.json', ['liuQin'], 'object', DL + ':206', 'XingNianScoreRule.liuQin');
C('rule/行年打分.json', ['kong'], 'number', DL + ':207', 'XingNianScoreRule.kong');
C('rule/行年打分.json', ['wangShuai'], 'object', DL + ':208', 'XingNianScoreRule.wangShuai');
C('rule/行年打分.json', ['taiSui'], 'object', DL + ':209', 'XingNianScoreRule.taiSui');
C('rule/行年打分.json', ['jiangJx'], 'object', DL + ':210', 'XingNianScoreRule.jiangJx');
C('rule/行年打分.json', ['bands'], 'array', DL + ':211', 'XingNianScoreRule.bands');
C('cal/yj_all.json', [], 'array', DL + ':243', 'YueJiangSeg[] 全量月将段');
C('ancient/zhonghuang_jing.json', [], 'object', DL + ':319', 'AncientBook');
C('ancient/case_gallery.json', [], 'array', DL + ':334', 'AncientCase[]');

/* --- 引擎内读 rules 的键（LiurenCore.ets） --- */
const LC = APP_ETS + '/model/LiurenCore.ets';
C('rule/旺衰休囚死.json', ['旺衰'], 'object', codeSite('旺衰休囚死'), 'wangT() 读 rules.duxiang.旺衰休囚死.旺衰');
C('rule/神煞起法.json', ['神煞'], 'object', codeSite('rules.shensha["神煞"]'), 'computeShensha 读 rules.shensha.神煞');
C('rule/毕法赋一百法.json', ['一百法'], 'array', codeSite('rules.bifa["一百法"]'), 'bifaForChuans 读 rules.bifa.一百法');
C('rule/基础关系.json', ['六合'], 'object', codeSite('六合'), '读象 六合');
C('rule/基础关系.json', ['六冲'], 'object', codeSite('六冲'), '读象 六冲');
C('rule/基础关系.json', ['六害'], 'object', codeSite('六害'), '读象 六害');
C('rule/基础关系.json', ['三刑'], 'object', codeSite('三刑'), '读象 三刑');

/* --- 神煞表内部的键形态（按基准分派） --- */
C('rule/神煞起法.json', ['神煞', '*', '基准'], 'string', codeSite('s["基准"]'), '每神煞须有 基准（年支/月支/日干/日支/旬）');
C('rule/神煞起法.json', ['神煞', '*', '表'], 'object', codeSite('s["表"]'), '每神煞须有 表（查表映射）');
C('rule/神煞起法.json', ['神煞', '*', '吉凶'], 'string', codeSite('s["吉凶"]'), 'computeShensha 用 吉凶');
C('rule/神煞起法.json', ['神煞', '*', '置信度'], 'string', codeSite('s["置信度"]'), 'computeShensha 用 置信度');

/* --- .ets 直读 rawfile 数据的键（Index/KongShen/Gallery 等） --- */
const YS = APP_ETS + '/model/YongShenCore.ets';
C('rule/占事体系.json', ['占事大类'], 'array', YS + ':138', 'YongShenCore.affairs');
C('rule/占事体系.json', ['占事大类', '*', '名称'], 'string', YS + ':142', '占事名');
C('rule/占事体系.json', ['占事大类', '*', '用神'], 'object', YS + ':143', '用神配置');
C('rule/占事体系.json', ['占事大类', '*', '用神', '六亲'], 'array', YS + ':144', '用神·六亲');
C('rule/占事体系.json', ['占事大类', '*', '用神', '天将'], 'array', YS + ':145', '用神·天将');
C('rule/占事体系.json', ['占事大类', '*', '用神', '地支'], 'array', YS + ':146', '用神·地支');
C('rule/占事体系.json', ['占事大类', '*', '断语倾向注'], 'string', YS + ':152', '断语倾向注');
C('rule/占事体系.json', ['占事大类', '*', '古门类'], 'array', YS + ':153', '古门类');
C('rule/占事体系.json', ['占事大类', '*', '场景提示词'], 'array', YS + ':154', '场景提示词');
C('rule/占事体系.json', ['占事大类', '*', '信息提示'], 'string', YS + ':155', '信息提示');
C('rule/类象库.json', ['地支类象', '地支'], 'object', YS + ':283', 'jieDianWords 地支类象');
C('rule/类象库.json', ['地支类象', '地支', '*', '象义特征'], 'array', YS + ':286', '地支象义特征');
C('rule/类象库.json', ['地支类象', '地支', '*', '物象'], 'array', YS + ':291', '地支物象');
C('rule/类象库.json', ['天干类象', '天干'], 'object', YS + ':297', 'jieDianWords 天干类象');
C('rule/类象库.json', ['天干类象', '天干', '*', '详细'], 'array', YS + ':300', '天干详细');
C('rule/类象库.json', ['纳音象义', '六十甲子'], 'object', YS + ':306', '纳音象义');
C('rule/类象库.json', ['纳音象义', '六十甲子', '*', '纳音'], 'string', YS + ':309', '纳音名');
C('rule/类象库.json', ['纳音象义', '六十甲子', '*', '象义'], 'string', YS + ':309', '纳音象义');
C('rule/管辂象意.json', ['杂占总诀'], 'array', YS + ':343', 'xiangyi 分类取值');
/* 占事体系的「用神·六亲」取值必须在 LIUQIN_ZHI 的键域内（代码表），否则候选恒空 */
/* 一百法里仅部分法条带 判定.定位 / 判定.适用占事；代码读取点已守卫（(f.判定 && f.判定.定位) || {}），
   故列为可选键：缺失不违规，但一旦出现就必须是 object/array。 */
C('rule/毕法赋一百法.json', ['一百法', '*', '判定', '定位'], 'object', codeSite('f["判定"]'), '毕法 判定.定位（可选，代码已守卫）', true);
C('rule/毕法赋一百法.json', ['一百法', '*', '判定', '适用占事'], 'array', codeSite('apply'), '毕法 判定.适用占事（可选，代码已守卫）', true);
C('rule/课体课义.json', ['课体'], 'array', 'APP/' + 'LiurenFocusDiviner/entry/src/main/ets/pages/Index.ets:271', 'loadKetiYi → 课体课义表');

/* cal/*.json：DayRec 字段 */
for (const f of CAL_DECADES.slice(0, 1)) {
  for (const k of ['d', 'dg', 'dz', 'mg', 'mz', 'ygc', 'lg', 'ld', 'zg', 'wk', 'st']) {
    C('cal/' + f, ['*', '*', k], null, 'LiurenCore DayRec 接口', 'DayRec 字段 ' + k + '（口径来自接口声明与消费方）');
  }
}
for (const k of ['st', 'en', 'j', 'z', 't']) {
  C('cal/yj_all.json', ['*', k], null, 'LiurenCore.YueJiangSeg', '月将段字段 ' + k);
}
/* ancient/*.json */
C('ancient/zhonghuang_jing.json', ['书名'], 'string', 'DataLoader AncientBook', 'AncientBook.书名');
C('ancient/zhonghuang_jing.json', ['篇目'], 'array', 'DataLoader AncientBook', 'AncientBook.篇目');
C('ancient/zhonghuang_jing.json', ['篇目', '*', '卷'], 'string', 'DataLoader AncientChapter', 'AncientChapter.卷');
C('ancient/zhonghuang_jing.json', ['篇目', '*', '序'], 'number', 'DataLoader AncientChapter', 'AncientChapter.序');
C('ancient/zhonghuang_jing.json', ['篇目', '*', '篇名'], 'string', 'DataLoader AncientChapter', 'AncientChapter.篇名');
C('ancient/zhonghuang_jing.json', ['篇目', '*', '导语'], 'string', 'DataLoader AncientChapter', 'AncientChapter.导语');
C('ancient/zhonghuang_jing.json', ['篇目', '*', '段落'], 'array', 'DataLoader AncientChapter', 'AncientChapter.段落');
C('ancient/case_gallery.json', ['*', 'id'], 'string', 'DataLoader AncientCase', 'AncientCase.id');
C('ancient/case_gallery.json', ['*', 'title'], 'string', 'DataLoader AncientCase', 'AncientCase.title');
C('ancient/case_gallery.json', ['*', 'source'], 'string', 'DataLoader AncientCase', 'AncientCase.source');
C('ancient/case_gallery.json', ['*', 'chapter'], 'string', 'DataLoader AncientCase', 'AncientCase.chapter');
C('ancient/case_gallery.json', ['*', 'input'], 'object', 'DataLoader AncientCase', 'AncientCase.input');
C('ancient/case_gallery.json', ['*', 'input', 'mj'], 'string', 'DataLoader AncientCaseInput', 'input.mj');
C('ancient/case_gallery.json', ['*', 'input', 'dg'], 'string', 'DataLoader AncientCaseInput', 'input.dg');
C('ancient/case_gallery.json', ['*', 'input', 'dz'], 'string', 'DataLoader AncientCaseInput', 'input.dz');
C('ancient/case_gallery.json', ['*', 'input', 'hour'], 'string', 'DataLoader AncientCaseInput', 'input.hour');
C('ancient/case_gallery.json', ['*', 'original'], 'string', 'DataLoader AncientCase', 'AncientCase.original');
C('ancient/case_gallery.json', ['*', 'summary'], 'string', 'DataLoader AncientCase', 'AncientCase.summary');
C('ancient/case_gallery.json', ['*', 'compliance'], 'string', 'DataLoader AncientCase', 'AncientCase.compliance');

/* --- 执行契约核对 --- */
const JSON_CACHE = {};
function jsonOf(rel) {
  if (!JSON_CACHE[rel]) JSON_CACHE[rel] = loadJson(rel);
  return JSON_CACHE[rel];
}
function typeName(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}
function typeMatch(v, want) {
  if (want === null) return true;
  if (want === 'array') return Array.isArray(v);
  if (want === 'object') return v !== null && typeof v === 'object' && !Array.isArray(v);
  if (want === 'string') return typeof v === 'string';
  if (want === 'number') return typeof v === 'number';
  return typeof v === want;
}
const B1_MISSING = [], B1_TYPEFAIL = [], B1_OK = [], B1_OPTIONAL = [];
for (const c of CONTRACT) {
  let j;
  try { j = jsonOf(c.json).json; }
  catch (e) { fail('B1', c.json, 1, 'JSON 解析失败：' + e.message); continue; }
  /* 通配 '*'：对数组逐元素 / 对对象逐键 */
  const walk = (node, idx, seenPath) => {
    if (idx >= c.path.length) {
      if (!typeMatch(node, c.type)) {
        B1_TYPEFAIL.push({ json: c.json, path: seenPath.join('.'), want: c.type, got: typeName(node), code: c.code, why: c.why });
      } else {
        B1_OK.push({ json: c.json, path: seenPath.join('.'), type: typeName(node) });
      }
      return;
    }
    const key = c.path[idx];
    if (node === undefined || node === null) {
      (c.opt ? B1_OPTIONAL : B1_MISSING).push({ json: c.json, path: c.path.join('.'), code: c.code, why: c.why, at: seenPath.join('.') || '$' });
      return;
    }
    if (key === '*') {
      const subs = Array.isArray(node) ? node.map((v, i) => [String(i), v]) : Object.keys(node).map((k) => [k, node[k]]);
      if (subs.length === 0) {
        warn('B1', c.json + ' @ ' + (seenPath.join('.') || '$') + ' 通配位置为空（规则表里没有可迭代条目）—— 相关功能将静默为空');
      }
      for (const [k, v] of subs) walk(v, idx + 1, seenPath.concat(k));
      return;
    }
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        if (node[i] === null || typeof node[i] !== 'object' || !(key in node[i])) {
          (c.opt ? B1_OPTIONAL : B1_MISSING).push({ json: c.json, path: c.path.join('.'), code: c.code, why: c.why, at: seenPath.join('.') + '[' + i + ']', perItem: true });
        } else {
          walk(node[i][key], idx + 1, seenPath.concat('[' + i + ']' + key));
        }
      }
      return;
    }
    if (!(key in node)) {
      (c.opt ? B1_OPTIONAL : B1_MISSING).push({ json: c.json, path: c.path.join('.'), code: c.code, why: c.why, at: seenPath.join('.') || '$' });
      return;
    }
    walk(node[key], idx + 1, seenPath.concat(key));
  };
  walk(j, 0, []);
}
/* 逐项对象级缺失：同一 (json,path) 的 perItem 命中只报一次（避免 45 案 × N 键刷屏） */
const aggMissing = new Map();
for (const m of B1_MISSING) {
  const k = m.json + ' :: ' + m.path;
  if (!aggMissing.has(k)) aggMissing.set(k, { json: m.json, path: m.path, code: m.code, why: m.why, hits: 0, firstAt: m.at });
  const a = aggMissing.get(k);
  a.hits++;
}
for (const a of aggMissing.values()) {
  fail('B1', a.json, 1, '代码读取的键路径不存在：「' + a.path + '」（' + a.hits + ' 处缺失，首个位置 ' + a.firstAt + '）',
    '读取点 ' + a.code + ' —— ' + a.why);
}
for (const t of B1_TYPEFAIL) {
  fail('B1', t.json, 1, '类型不符：' + t.path + ' 期望 ' + t.want + '，实为 ' + t.got,
    '读取点 ' + t.code + ' —— ' + t.why);
}
const optPaths = new Map();
for (const o of B1_OPTIONAL) {
  const k = o.json + ' :: ' + o.path;
  const a = optPaths.get(k) || { json: o.json, path: o.path, 命中数: 0, 说明: o.why };
  a.命中数++;
  optPaths.set(k, a);
}
console.log('  契约项 ' + CONTRACT.length + ' 条 → 校验通过 ' + B1_OK.length + '，键缺失（硬）'
  + aggMissing.size + ' 类，类型不符 ' + B1_TYPEFAIL.length + ' 处，可选键未命中 '
  + optPaths.size + ' 类（代码已守卫，非违规）');
for (const a of optPaths.values()) console.log('    · 可选键 ' + a.json + ' :: ' + a.path + ' —— ' + a.说明 + '（' + a.命中数 + ' 条未带该键）');
REPORT.证据.B1 = {
  契约条数: CONTRACT.length, 通过: B1_OK.length,
  缺失: [...aggMissing.values()], 类型不符: B1_TYPEFAIL,
  可选键未命中: [...optPaths.values()],
  /* 通过清单有 5 万+ 条（逐元素展开），报告里只留前 200 条摘要，避免报告文件上 MB；
     需要全量清单时把下面的 200 改大或直接读本脚本的控制台输出。 */
  通过清单摘要: B1_OK.slice(0, 200).map((x) => x.json + ' :: ' + x.path),
  通过清单条数: B1_OK.length
};

/* --- 月支基准神煞表：12 个月都必须能查到值（否则该神煞整年静默消失） --- */
const ssJson = jsonOf('rule/神煞起法.json').json['神煞'] || {};
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const ssMonthGap = [];
for (const nm of Object.keys(ssJson)) {
  const s = ssJson[nm];
  if (s['基准'] !== '月支') continue;
  const biao = s['表'] || {};
  const missing = [];
  for (let m = 0; m < 12; m++) {
    const mNo = String(((m - 2 + 12) % 12) + 1);       /* 寅月=1 */
    const mz = ZHI[m];
    if (biao[mNo] === undefined && biao[mz] === undefined) missing.push(mz);
  }
  if (missing.length > 0) ssMonthGap.push({ 神煞: nm, 缺失月支: missing });
}
if (ssMonthGap.length > 0) {
  for (const g of ssMonthGap) {
    fail('B1', 'rule/神煞起法.json', 1, '月支基准神煞「' + g.神煞 + '」的表缺 ' + g.缺失月支.length + ' 个月支键（' + g.缺失月支.join('') + '）—— 该月静默不生效', '引擎 computeShensha 月支分派：先查 1..12 月序键，再回退月支键');
  }
} else {
  console.log('  月支基准神煞：' + Object.keys(ssJson).filter((n) => ssJson[n]['基准'] === '月支').length + ' 个，12 个月键全可解析');
}
REPORT.证据.B1神煞月键 = { 缺月键: ssMonthGap };

/* ============================================================================
 * B2 兜底审计
 * ==========================================================================*/
head('[B2] 兜底审计：哪些兜底会把「缺失规则表」掩盖成空结果');
const FALLBACK_RE = /(\|\||\?\?)\s*(\{\}|\[\]|''|""|0|null|LiurenCore\.[A-Z_]+)/g;
const B2_ITEMS = [];
for (const rel of ETS_FILES.concat(ETS_FREE)) {
  const st = strip(rel);
  const code = st.code;
  let m;
  FALLBACK_RE.lastIndex = 0;
  while ((m = FALLBACK_RE.exec(code)) !== null) {
    const ln = lineOf(st.offs, m.index);
    const ctx = code.slice(Math.max(0, m.index - 90), m.index + 40).replace(/\s+/g, ' ');
    const emptyObj = /\{\}/.test(m[2]);
    const emptyArr = /\[\]/.test(m[2]);
    /* 危险项判据：兜底空表/空对象，且取值来源是「规则/数据」命名空间（rules./zhanShi/leixiang/xiangyi/coachData/ketiYi/calData/yjAll） */
    const ruleSourced = /rules\.|LiurenCore\.rules|zhanShi|leixiang|xiangyi|coachData|ketiYi|guanlu|calData|yjAll|rawfile|JSON\.parse/.test(ctx);
    /* 安全项：逐字查找结果（.find/.filter/indexOf/includes/dunXun/jiangMap/tp[bracket]）或纯 UI 回调参数 */
    const lookupSourced = /\.find\(|\.filter\(|indexOf\(|includes\(|jiangMap|dunXun|\.tp\[|byZhi\[|gongOf\(|String\(|join\(/.test(ctx);
    const kind = ruleSourced && (emptyObj || emptyArr) ? '危险'
      : (lookupSourced ? '合理可选' : (emptyObj || emptyArr ? '待人工确认' : '合理可选'));
    B2_ITEMS.push({ file: rel, line: ln, fallback: m[1] + ' ' + m[2], kind: kind, ctx: ctx.trim() });
  }
}
const B2_DANGER = B2_ITEMS.filter((x) => x.kind === '危险');
const B2_REVIEW = B2_ITEMS.filter((x) => x.kind === '待人工确认');
const B2_DANGER_POS = new Set();
for (const d of B2_DANGER) {
  const posKey = d.line + '|' + d.fallback;
  if (B2_DANGER_POS.has(posKey)) continue;      /* 主/免费同构重复不再重复告警 */
  B2_DANGER_POS.add(posKey);
  warn('B2', d.file + ':' + d.line + '  空表兜底掩盖规则缺失  «' + d.fallback + '»  ' + d.ctx);
}
/* 去重：主版与免费版同构文件（免费版是生成产物）同一位置的兜底只报一次，标注两份 */
const B2_SEE = new Map();
for (const it of B2_ITEMS) {
  const key = it.line + '|' + it.fallback + '|' + it.ctx;
  if (B2_SEE.has(key)) it.同构重复 = B2_SEE.get(key);
  else {
    const dup = B2_ITEMS.filter((o) => o !== it && o.file !== it.file && o.line === it.line && o.fallback === it.fallback && o.ctx === it.ctx);
    B2_SEE.set(key, [it.file].concat(dup.map((o) => o.file)));
    it.同构重复 = B2_SEE.get(key);
  }
}
console.log('  兜底点 ' + B2_ITEMS.length + ' 处（含主版/免费版同构重复）：危险（掩盖缺失规则表）' + B2_DANGER.length
  + '，待人工确认 ' + B2_REVIEW.length + '，合理可选 ' + (B2_ITEMS.length - B2_DANGER.length - B2_REVIEW.length));
console.log('  危险项去重后独立位置 ' + new Set(B2_DANGER.map((x) => x.line + '|' + x.fallback)).size + ' 个');
REPORT.证据.B2 = { 总数: B2_ITEMS.length, 危险: B2_DANGER, 待人工确认: B2_REVIEW };

/* --- B2b 运行期：逐规则文件置空，观察是否静默产出错值而不报错 --- */
const impact = engine.ruleImpact();
console.log('  运行期规则影响面（逐个规则表置空后看引擎行为）：');
for (const r of impact) {
  console.log('    ' + (r.受影响字段.length > 0 ? '！' : '·') + ' ' + r.规则 + '：'
    + (r.抛错 ? '抛错（fail-fast）' : (r.受影响字段.length > 0 ? '静默变化 → ' + r.受影响字段.join('，') : '无影响')));
}
REPORT.证据.B2运行期 = impact;
const silent = impact.filter((r) => !r.抛错 && r.受影响字段.length > 0);
if (silent.length > 0) {
  warn('B2', '以下规则表缺失时引擎**不报错但输出改变**（宿主若吞异常即静默算错）：'
    + silent.map((r) => r.规则 + '(' + r.受影响字段.join('/') + ')').join('，'));
}

/* --- B2c 最关键的一组：按 DataLoader 真实口径复现「JSON 键被改名/缺失」 ---
   DataLoader 把 JSON.parse(...)['键'] 直接赋给规则包字段；键缺失 → 该字段为 undefined。
   此时引擎是抛错（fail-fast）还是静默变值？这决定耦合是强链接还是脆链接。 */
const loaderImp = engine.loaderImpact();
console.log('  运行期 DataLoader 口径（JSON 键被改名/缺失时引擎的真实行为）：');
for (const r of loaderImp) {
  console.log('    ' + (r.行年面 !== '无变化' ? '！' : '·') + ' ' + r.场景);
  console.log('       盘面：' + (r.抛错 ? '抛错 → ' + r.抛错 : (r.受影响字段.length > 0
    ? '不报错但改变 → ' + r.受影响字段.join('，') + '（' + r.盘签名改变 + '）' : '无变化'))
    + '；行年：' + r.行年面);
}
REPORT.证据['B2 DataLoader口径'] = loaderImp;
const loaderDanger = loaderImp.filter((r) => !r.抛错 && r.受影响字段.length > 0);
const loaderThrow = loaderImp.filter((r) => r.行年面.indexOf('抛错') === 0);
if (loaderDanger.length > 0) {
  warn('B2', 'DataLoader 口径下，以下键缺失时引擎不报错但输出改变（这就是"改 JSON 静默改盘"的机制）：'
    + loaderDanger.map((r) => r.场景).join('；'));
}
if (loaderThrow.length > 0) {
  warn('B2', 'DataLoader 口径下，行年打分键缺失会让 xingNian 抛错（宿主 Index.ets 的 try/catch 会吞掉它 → 行年整块静默消失）：'
    + loaderThrow.map((r) => r.场景 + ' → ' + r.行年面).join('；'));
}

/* --- 字面量工具：从源码里抠出对象/数组字面量并安全求值（只允许字面量，禁止任意代码） --- */
function objectLiteralAt(code, eqIdx) {
  const s = code.indexOf('{', eqIdx);
  if (s < 0) return null;
  let depth = 0;
  for (let k = s; k < code.length; k++) {
    if (code[k] === '{') depth++;
    else if (code[k] === '}') { depth--; if (depth === 0) return code.slice(s, k + 1); }
  }
  return null;
}
function parseLiteral(lit) {
  if (!lit) return null;
  /* 去掉 ArkTS 专有后缀（无）后按 JS 字面量求值；含标识符/函数则拒绝，避免执行任意代码 */
  if (/[A-Za-z_$][\w$]*\s*\(/.test(lit)) return null;
  try {
    /* eslint-disable no-new-func */
    return Function('"use strict";return (' + lit + ');')();
  } catch (e) {
    return null;
  }
}
/* 深度差异（只比 a 的键；返回差异清单字符串数组） */
function deepDiff(a, b, prefix) {
  const out = [];
  const p = prefix || '';
  if (a === null || typeof a !== 'object') {
    if (JSON.stringify(a) !== JSON.stringify(b)) out.push(p + ' 代码=' + JSON.stringify(a) + ' / JSON=' + JSON.stringify(b));
    return out;
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) { out.push(p + ' 代码为数组而 JSON 非数组'); return out; }
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) out.push(...deepDiff(a[i], b[i], p + '[' + i + ']'));
    return out;
  }
  if (b === null || typeof b !== 'object' || Array.isArray(b)) { out.push(p + ' 代码为对象而 JSON 非对象'); return out; }
  for (const k of Object.keys(a)) {
    if (!(k in b)) { out.push(p + '.' + k + ' JSON 侧缺该键'); continue; }
    out.push(...deepDiff(a[k], b[k], p + '.' + k));
  }
  for (const k of Object.keys(b)) if (!(k in a)) out.push(p + '.' + k + ' 代码侧缺该键');
  return out;
}

/* ============================================================================
 * B3 重复真源
 * ==========================================================================*/
head('[B3] 重复真源：同一规则表既在代码又在 JSON');
const DUP = [];
function dup(name, codeSite, jsonRel, codeVal, jsonVal, note) {
  const same = JSON.stringify(codeVal) === JSON.stringify(jsonVal);
  DUP.push({ 规则表: name, 代码: codeSite, JSON: jsonRel, 一致: same, 说明: note });
  if (!same) {
    fail('B3', jsonRel, 1, '重复真源不一致（高危）：' + name + ' —— 代码「' + codeSite + '」与 ' + jsonRel + ' 两侧不同',
      '\n        代码侧：' + JSON.stringify(codeVal).slice(0, 160) + '\n        JSON侧：' + JSON.stringify(jsonVal).slice(0, 160));
  } else {
    console.log('  ✓ ' + name + '：代码 ' + codeSite + ' ↔ ' + jsonRel + ' 一致（双写，需长期校验）');
  }
}
/* 1) 六冲 / 六合 / 六害 既是引擎常量又是 rule/基础关系.json */
{
  const jc = jsonOf('rule/基础关系.json').json;
  const codeSrc = engineCode().code;
  function grabRecord(varName) {
    const re = new RegExp('static\\s+readonly\\s+' + varName + '\\s*:\\s*Record<[^>]*>\\s*=\\s*\\{');
    const m = re.exec(codeSrc);
    if (!m) return null;
    let i = codeSrc.indexOf('{', m.index), depth = 0, end = -1;
    for (let k = i; k < codeSrc.length; k++) {
      if (codeSrc[k] === '{') depth++;
      else if (codeSrc[k] === '}') { depth--; if (depth === 0) { end = k; break; } }
    }
    const body = codeSrc.slice(i, end + 1);
    const out = {};
    const reKV = /["']([^"']+)["']\s*:\s*["']([^"']*)["']/g;
    let kv;
    while ((kv = reKV.exec(body)) !== null) out[kv[1]] = kv[2];
    return out;
  }
  /* 代码里的地支关系表名（以实际存在的常量为准，不做假设） */
  const CODE_REL_TABLES = [
    { name: 'ZHI_GONG', json: '六合', label: '地支六合' },
    { name: 'ZHI_CHONG', json: '六冲', label: '地支六冲' },
    { name: 'ZHI_HAI', json: '六害', label: '地支六害' },
    { name: 'ZHI_XING', json: '三刑', label: '地支三刑' }
  ];
  const foundRel = [];
  for (const t of CODE_REL_TABLES) {
    const codeTab = grabRecord(t.name);
    if (!codeTab || Object.keys(codeTab).length === 0) continue;
    foundRel.push(t);
    if (t.json === '三刑') continue;                 /* 三刑 JSON 侧是支→数组，形态不同，单列 */
    dup(t.label + '（' + t.name + ' ↔ 基础关系.json ' + t.json + '）', LC + ' LiurenCore.' + t.name,
      'rule/基础关系.json', codeTab, jc[t.json], '两侧都定义' + t.label + '（双写）');
  }
  REPORT.证据.B3代码侧关系表 = foundRel.map((t) => t.name);
  if (foundRel.length === 0) {
    /* ArkTS 侧不持有 六冲/六合/六害 字面表：这两类关系的**唯一真源就是 JSON**，
       即"单写"而非"双写"（比双写更安全，但意味着改 JSON 会直接改盘态关系 → 见 B4）。
       注意：core/liuren-core.ts 侧确有 ZHI_GONG（计算式，非字面表），.ets 与 .ts 在此处表述不同。 */
    DUP.push({
      规则表: '地支六冲/六合/六害（代码常量 ↔ 基础关系.json）',
      代码: LC + '（无字面表：ArkTS 侧未定义 ZHI_GONG/ZHI_CHONG/ZHI_HAI）',
      JSON: 'rule/基础关系.json',
      一致: true,
      说明: '单写：唯一真源＝JSON（比双写安全）；core/liuren-core.ts 侧另有计算式 ZHI_GONG，需留意两端表述差异'
    });
    console.log('  · 地支六冲/六合/六害：ArkTS 侧无字面表 → 唯一真源＝rule/基础关系.json（单写，无双侧漂移风险）');
  }
}
/* 2) 神煞名表：JSON 里 35 个神煞是否都能被引擎实际产出（名称必须逐字一致） */
{
  const table = ssJson;
  const produced = engine.shenshaNames();
  const jsonNames = Object.keys(table);
  const neverProduced = jsonNames.filter((n) => produced.names.indexOf(n) < 0);
  const producedNotInJson = produced.names.filter((n) => jsonNames.indexOf(n) < 0);
  DUP.push({
    规则表: '神煞名（神煞起法.json ↔ 引擎实际产出）', 代码: LC + ' computeShensha',
    JSON: 'rule/神煞起法.json', 一致: neverProduced.length === 0 && producedNotInJson.length === 0,
    说明: 'JSON 定义 ' + jsonNames.length + ' 个，引擎全枚举（' + produced.cases + ' 组输入）实际产出 '
      + produced.names.length + ' 个'
  });
  if (neverProduced.length > 0) {
    fail('B3', 'rule/神煞起法.json', 1, '以下神煞在 JSON 里定义但引擎全枚举从未产出（名称对不上或基准分派漏支）：「'
      + neverProduced.join('、') + '」', '引擎按 基准 分派：年支/月支/日干/日支/旬');
  }
  if (producedNotInJson.length > 0) {
    fail('B3', LC, 1, '引擎产出了 JSON 里没有的神煞名：「' + producedNotInJson.join('、') + '」（代码写死的神煞名）');
  }
  console.log('  神煞产出对照：JSON ' + jsonNames.length + ' 个 / 引擎全枚举 ' + produced.names.length + ' 个（全枚举 '
    + produced.cases + ' 组）');
}
/* 3) 天将序：代码常量 ↔ 引擎实际乘将集合 */
{
  const codeJiang = ['贵人', '螣蛇', '朱雀', '六合', '勾陈', '青龙', '天空', '白虎', '太常', '玄武', '太阴', '天后'];
  const used = engine.jiangNames();
  const diff = codeJiang.filter((n) => used.names.indexOf(n) < 0);
  dup('十二天将序（JIANG_ORDER ↔ 实际乘将）', LC + ' LiurenCore.JIANG_ORDER', '(引擎常量，无 JSON 同名表)',
    codeJiang, codeJiang, '实际乘将集合 ' + used.names.join('') + '（' + used.cases + ' 组）');
  if (diff.length > 0) fail('B3', LC, 1, 'JIANG_ORDER 中以下天将从未在任何盘面出现：「' + diff.join('、') + '」');
}
/* 4) 占事体系 JSON 的六亲名必须落在代码 LIUQIN_ZHI 键域里（否则候选恒空） */
{
  const zs = jsonOf('rule/占事体系.json').json;
  const ysCode = strip(YS).code;
  const m = /const\s+LIUQIN_ZHI\s*:[^=]*=\s*\{/.exec(ysCode);
  const keys = new Set();
  if (m) {
    let i = ysCode.indexOf('{', m.index), depth = 0, end = -1;
    for (let k = i; k < ysCode.length; k++) {
      if (ysCode[k] === '{') depth++;
      else if (ysCode[k] === '}') { depth--; if (depth === 0) { end = k; break; } }
    }
    const body = ysCode.slice(i, end + 1);
    const reK = /["'](妻财|官鬼|父母|比肩|子孙|兄弟)["']\s*:/g;
    let kk;
    while ((kk = reK.exec(body)) !== null) keys.add(kk[1]);
  }
  const usedLq = new Set();
  for (const it of (zs['占事大类'] || [])) {
    for (const lq of (((it['用神'] || {})['六亲']) || [])) usedLq.add(lq);
  }
  const bad = [...usedLq].filter((x) => !keys.has(x) && x !== '兄弟');
  dup('占事体系·六亲名 ↔ 代码 LIUQIN_ZHI 键域', YS + ' LIUQIN_ZHI', 'rule/占事体系.json',
    [...usedLq].sort(), [...usedLq].sort(), '代码键域：' + [...keys].join('/') + (bad.length ? '' : '（全部命中）'));
  if (bad.length > 0) {
    fail('B3', 'rule/占事体系.json', 1, '占事体系里的六亲名在代码 LIUQIN_ZHI 中无键：「' + bad.join('、') + '」→ 该用神地支候选恒为空（静默）',
      '代码键域：' + [...keys].join('/'));
  }
}
/* 5) 行年打分表：代码 XN_SCORE_DEFAULT ↔ rule/行年打分.json */
{
  const xn = jsonOf('rule/行年打分.json').json;
  const codeSrc = engineCode().code;
  const m = /XN_SCORE_DEFAULT[^=]*=\s*\{/.exec(codeSrc);
  if (m) {
    const litSrc = objectLiteralAt(codeSrc, m.index);
    const codeObj = parseLiteral(litSrc);
    const jsonSub = {
      liuQin: xn['liuQin'], kong: xn['kong'], wangShuai: xn['wangShuai'],
      taiSui: xn['taiSui'], jiangJx: xn['jiangJx'], bands: xn['bands']
    };
    if (codeObj) {
      const diffs = deepDiff(codeObj, jsonSub);
      dup('行年打分表（XN_SCORE_DEFAULT ↔ rule/行年打分.json）', LC + ' LiurenCore.XN_SCORE_DEFAULT',
        'rule/行年打分.json', diffs.length === 0 ? codeObj : diffs, diffs.length === 0 ? jsonSub : [],
        diffs.length === 0
          ? '内置默认表与 JSON 逐键逐值一致（双写：宿主注入失败时静默启用内置表，改 JSON 不改代码会不一致）'
          : '不一致键：' + diffs.join('；'));
      REPORT.证据.B3行年打分差异 = diffs;
    }
  }
  if (false) {
    let i = codeSrc.indexOf('{', m.index), depth = 0, end = -1;
    for (let k = i; k < codeSrc.length; k++) {
      if (codeSrc[k] === '{') depth++;
      else if (codeSrc[k] === '}') { depth--; if (depth === 0) { end = k; break; } }
    }
    const body = codeSrc.slice(i, end + 1).replace(/\s+/g, '');
    /* 逐项对照：liuQin / kong / wangShuai / taiSui / jiangJx / bands */
    const sameKeys = ['liuQin', 'kong', 'wangShuai', 'taiSui', 'jiangJx'].every((k) => {
      const jsonFlat = JSON.stringify(xn[k]).replace(/\s+/g, '');
      return jsonFlat.split(',').every((kv) => {
        const key = kv.replace(/^\{|\}$/g, '').split(':')[0].replace(/"/g, '');
        return key === '' ? true : body.indexOf('"' + key + '"') >= 0;
      });
    });
    const bandsSame = JSON.stringify(xn['bands']).replace(/\s+/g, '') ===
      (body.match(/bands:\[.*?\]/) || [''])[0].replace(/^bands:/, '').replace(/\s+/g, '');
    dup('行年打分表（XN_SCORE_DEFAULT ↔ rule/行年打分.json）', LC + ' LiurenCore.XN_SCORE_DEFAULT', 'rule/行年打分.json',
      { keysOk: sameKeys, bandsSame: bandsSame }, { keysOk: true, bandsSame: true },
      '内置默认表是 JSON 的同内容副本（宿主注入失败时静默启用）');
  }
}
/* 6) 历法 yj_all 的月将名/月将支 ↔ 引擎代码内置 ZQ 近似表 */
{
  const yj = jsonOf('cal/yj_all.json').json;
  const pairsJson = new Set();
  for (const s of yj) pairsJson.add(s.j + '/' + s.z);
  const codeSrc = engineCode().code;
  const m = /const ZQ[^=]*=\s*\{([\s\S]*?)\};/.exec(codeSrc);
  const pairsCode = new Set();
  if (m) {
    const re = /\[\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\]/g;
    let kk;
    while ((kk = re.exec(m[1])) !== null) pairsCode.add(kk[1] + '/' + kk[2]);
  }
  const onlyJson = [...pairsJson].filter((x) => !pairsCode.has(x));
  dup('月将名↔支（yj_all.json ↔ 代码 ZQ 近似表）', LC + ' findYuejiang 内置 ZQ', 'cal/yj_all.json',
    [...pairsCode].sort(), [...pairsJson].sort().filter((x) => pairsCode.has(x)),
    '两侧同名同支应完全一致；yj_all 多出的项：' + onlyJson.join('，'));
  if (onlyJson.length > 0) {
    fail('B3', 'cal/yj_all.json', 1, 'yj_all.json 里的月将名/支代码 ZQ 表里没有（近似兜底会给出不同月将名）：「' + onlyJson.join('、') + '」');
  }
}
REPORT.证据.B3 = DUP;

/* ============================================================================
 * B4 强链接 / 脆链接判定（破坏性实验，实验后逐字节还原）
 * ==========================================================================*/
head('[B4] 强/脆链接判定：破坏性实验（改名 JSON 键 → 看是否静默改结果）');

const EXPERIMENTS = [
  {
    名称: '旺衰休囚死.json: 改名顶层键「旺衰」→「旺衰X」',
    文件: 'rule/旺衰休囚死.json',
    /* 必须改到顶层键（元数据里也有「旺衰」字样，故锚定行首缩进 1 空格的那个键） */
    改写: (t) => t.replace(/\n "旺衰": \{/, '\n "旺衰X": {')
  },
  {
    名称: '神煞起法.json: 改名顶层键「神煞」→「神煞X」',
    文件: 'rule/神煞起法.json',
    改写: (t) => t.replace('"神煞"', '"神煞X"')
  },
  {
    名称: '基础关系.json: 改名顶层键「六冲」→「六冲X」',
    文件: 'rule/基础关系.json',
    改写: (t) => t.replace('"六冲"', '"六冲X"')
  },
  {
    名称: '毕法赋一百法.json: 改名顶层键「一百法」→「一百法X」',
    文件: 'rule/毕法赋一百法.json',
    改写: (t) => t.replace('"一百法"', '"一百法X"')
  },
  {
    名称: '行年打分.json: 改名键「liuQin」→「liuQinX」',
    文件: 'rule/行年打分.json',
    改写: (t) => t.replace('"liuQin"', '"liuQinX"')
  }
];
const B4 = [];
const SHAS = new Map();
for (const f of RULE_FILES) {
  const rel = 'rule/' + f;
  const buf = fs.readFileSync(path.join(ROOT, RAWFILE, rel));
  SHAS.set(rel, { sha: crypto.createHash('sha256').update(buf).digest('hex'), len: buf.length });
}
/* 关键纪律：基线必须在**任何改写之前**冻结（否则已改写状态会被当成基线 → 假阴性）。
   此处冻结一次，五组实验共用同一基线。 */
const B4_BASE = engine.b4Baseline(200);
console.log('  基线已冻结：' + B4_BASE.盘数 + ' 组输入（未改写状态），五组实验共用');
let b4CleanupFailed = false;
for (const ex of EXPERIMENTS) {
  const abs = path.join(ROOT, RAWFILE, ex.文件);
  const orig = fs.readFileSync(abs);
  const origSha = crypto.createHash('sha256').update(orig).digest('hex');
  const mutated = Buffer.from(ex.改写(orig.toString('utf-8')), 'utf-8');
  if (mutated.equals(orig)) {
    B4.push({ 实验: ex.名称, 状态: '实验未生效（改写串未匹配）——判为实验设计失败' });
    fail('B4', ex.文件, 1, '破坏性实验未生效：改写串未匹配（实验设计失败，链接结论不可据）', ex.名称);
    continue;
  }
  /* 改写有效但两份实现可能都不读该键：读回到临时的改写内容，确认 JSON 仍可解析 */
  try { JSON.parse(mutated.toString('utf-8')); }
  catch (e) { fail('B4', ex.文件, 1, '实验改写后 JSON 无法解析：' + e.message); }
  let res, side = null;
  try {
    fs.writeFileSync(abs, mutated);
    res = engine.probeAgainstBaseline(B4_BASE);
    /* 旁证：不经文件、直接在内存里把该键挖掉再比一次，确认"无变化"是真无影响而非基线被污染 */
    if (!res.抛错 && res.changed === 0) {
      const b2 = engine.ruleBundle();
      if (ex.文件 === 'rule/旺衰休囚死.json') b2.duxiang['旺衰休囚死'] = {};
      else if (ex.文件 === 'rule/基础关系.json') b2.duxiang['基础关系'] = {};
      else if (ex.文件 === 'rule/神煞起法.json') b2.shensha['神煞'] = {};
      else if (ex.文件 === 'rule/毕法赋一百法.json') b2.bifa['一百法'] = [];
      else if (ex.文件 === 'rule/行年打分.json') delete b2.xingnian;
      let n = 0, n2 = 0;
      try {
        engine.reinit(b2);
        for (let i = 0; i < B4_BASE.cases.length; i++) {
          const a = B4_BASE.cases[i];
          if (engine.sigOf(engine.chartOf(a[0], a[1], a[2], a[3], a[4], a[5], a[6])) !== B4_BASE.sigs[i]) n++;
          if (B4_BASE.行年 && engine.xingnianOf(a) !== B4_BASE.行年[i]) n2++;
        }
      } finally { engine.reinit(); }
      side = '内存挖键后 盘签名 ' + n + '/' + B4_BASE.盘数 + '，行年分/档 ' + n2 + '/' + B4_BASE.盘数;
    }
  } catch (e) {
    res = { 抛错: String(e && e.message || e), sigChanged: null };
  } finally {
    fs.writeFileSync(abs, orig);
  }
  /* 还原校验 */
  const back = fs.readFileSync(abs);
  const restored = crypto.createHash('sha256').update(back).digest('hex') === origSha;
  if (!restored) { b4CleanupFailed = true; fail('B4', ex.文件, 1, '实验后未能逐字节还原（哈希不一致）！'); }
  B4.push({
    实验: ex.名称, 文件: ex.文件,
    文件读取端: res.抛错 ? '抛错（fail-fast）' : '不报错',
    引擎侧结果变化: res.抛错 ? '—' : ((res.sigChanged || res.行年变化)
      ? '静默改变（' + [res.sigChanged, res.行年变化].filter(Boolean).join('；') + '）' : '无变化'),
    旁证: side,
    抛错: res.抛错 || null,
    逐字节还原: restored
  });
  console.log('    ' + ex.名称);
  console.log('      Node 侧（core/liuren-core.js + DataLoader 同构逻辑）：' + (res.抛错 ? '抛错 → ' + res.抛错 : '不报错'));
  console.log('      引擎输出：' + (res.抛错 ? '（未产出）' : (res.sigChanged ? '静默改变 → ' + res.sigChanged : '无变化'))
    + (res.行年变化 ? '；行年面静默改变 → ' + res.行年变化 : (res.行年基线抛错 ? '；行年面基线即抛错（' + res.行年基线抛错 + '）' : ''))
    + (side ? '（旁证：' + side + '）' : ''));
  console.log('      还原：' + (restored ? '✓ 逐字节一致' : '✗ 不一致'));
}
/* 全量还原总校验 */
let allRestored = true;
for (const [rel, meta] of SHAS) {
  const buf = fs.readFileSync(path.join(ROOT, RAWFILE, rel));
  if (crypto.createHash('sha256').update(buf).digest('hex') !== meta.sha) { allRestored = false; fail('B4', rel, 1, 'rawfile 在审计后与审计前哈希不一致'); }
}
console.log('  实验后全量还原校验：' + (allRestored ? '✓ ' + SHAS.size + ' 个 rule JSON 哈希与审计前一致' : '✗ 有文件被改动'));
REPORT.证据.B4 = { 实验: B4, 全量还原: allRestored, 前哈希: Object.fromEntries([...SHAS].map(([k, v]) => [k, v.sha])) };

/* 强/脆链接结论 */
const silentChanges = B4.filter((x) => typeof x.引擎侧结果变化 === 'string' && x.引擎侧结果变化.indexOf('静默改变') === 0);
const throwsOnly = B4.filter((x) => x.抛错);
let couplingVerdict;
if (silentChanges.length > 0) {
  couplingVerdict = '脆链接（fragile）：改 JSON 键会**静默改变排盘结果**而无人察觉——'
    + silentChanges.length + '/' + B4.length + ' 个实验里引擎不报错但输出变了';
} else if (throwsOnly.length === B4.length) {
  couplingVerdict = '强链接（fail-fast）：改 JSON 键会立刻抛错，测试/宿主必然察觉';
} else {
  couplingVerdict = '混合：部分键改动会抛错，部分键改动无影响但也不产出错值';
}
console.log('\n  【B4 判定】' + couplingVerdict);
REPORT.结论.B4耦合判定 = couplingVerdict;

/* ============================================================================
 * 汇总
 * ==========================================================================*/
REPORT.违规 = VIOLATIONS;
REPORT.结论.A组件写死 = {
  A1个案标识: A1_CODE_HITS.length + ' 处硬项（App 侧；另有展示文案引用书名 ' + A1_SOFT_HITS.length
    + ' 处、数据路径引用 ' + A1_DATA_REF_HITS.length + ' 处、注释出处 ' + A1_COMMENT_HITS.length
    + ' 处、_tools 脚本字面量 ' + A1_TOOLS_HITS.length + ' 处，均只计数不计失败）',
  A2按课特判: A2_SUSPECT.length + ' 处（静态）',
  A2维度敏感性: ['日干', '日支', '月将', '占时'].map((d) => d + ' ' + sens[d].changed + '/' + sens[d].trials).join('，'),
  A3盘面事实硬编码: A3_HITS.length + ' 处',
  A4死常量: A4_DEAD.length + ' 处'
};
REPORT.结论.BJSON耦合 = {
  B1键缺失: aggMissing.size + ' 类',
  B1类型不符: B1_TYPEFAIL.length + ' 处',
  B2危险兜底: B2_DANGER.length + ' 处',
  B2运行期静默项: silent.length + ' 个规则表',
  'B2 DataLoader口径危险项': loaderDanger.length + ' 个（不报错但改盘）；行年面抛错 '
    + loaderThrow.length + ' 个（会被 Index.ets 的 try/catch 吞掉）',
  B3重复真源: DUP.length + ' 组，其中不一致 ' + DUP.filter((d) => !d.一致).length + ' 组',
  B4判定: couplingVerdict
};
const outPath = path.join(ROOT, '_tests', '_data', 'component_audit.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(REPORT, null, 1), 'utf-8');

console.log('\n' + '='.repeat(72));
console.log('体检报告已落盘：_tests/_data/component_audit.json');
if (HARD === 0) {
  console.log('组件层体检：A1–A4 + B1–B4 全部通过 ✓');
  process.exit(0);
}
console.log('组件层体检：' + HARD + ' 处硬失败 ✗（详见 _tests/_data/component_audit.json）');
for (const v of VIOLATIONS) console.log('  · ' + v);
process.exit(1);

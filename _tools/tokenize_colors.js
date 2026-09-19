/* ⚠ 一次性迁移脚本（已执行完毕）。**调色板真源是 resources/{base,dark}/element/color.json 本身**，
   不要以本脚本为真源，也不要在日常改色时改这里 —— 它的作用是留下"这批令牌当初怎么来的"记录。
   现状由门禁保证：_tests/_test_color_tokens.js（令牌表对齐 / 未登记色值 / 运行时取色名 / 死令牌）。 */
/* ============================================================================
 * tokenize_colors.js —— 把字面色值/字号机械替换为资源令牌（第 2 步的正式工具）
 * ----------------------------------------------------------------------------
 * 为什么不是一次性脚本：第一次尝试一刀切 → 编译 2231 错（见下）。故规则按**位置类型**分档。
 *
 * 【v2 位置判定】不再用单一"前有 ( 或 : 、后有 ) 或 ,"的正则（它漏掉三元分支、return 位），
 * 改为对每个字面色值做**位置判定**，只有能证明"该位置接受 Resource"才替换：
 *   证法 A（API 白名单）：字面值所在的最内层调用括号，其函数名属于接受 ResourceColor 的属性
 *                         （fontColor / backgroundColor / border({color}) / color …）
 *   证法 B（同层已令牌）：字面值是三元分支，另一分支已经是 $r('app.color.*')
 *                         —— 该位置既然已接受 Resource，本分支必然也接受
 * 两条证法都不成立 → 不替换（宁漏不错：漏掉的记入残留清单，由"未声明字面色值"门禁看住）
 *
 * 反例（**不能**替换，会编译失败），已由位置判定挡住：
 *   private gzColor(pos: string): string { return '#F0D98C'; }   ← 返回类型是 string
 *   @Prop color: string = '#E9C878';                             ← 属性声明为 string
 *   EntryAbility 系统栏 API 要 string；Legal 页把色值拼进说明文字
 *
 * 用法：
 *   node _tools/tokenize_colors.js            # 执行替换（改 .ets）
 *   node _tools/tokenize_colors.js --dry      # 只报告将要替换多少处，不改文件
 *   node _tools/tokenize_colors.js --dry --explain   # 另打印每处残留的"为何不替换"
 * 回滚：git checkout -- APP/LiurenFocusDiviner/entry/src/main/ets
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const ETS = path.join(ROOT, 'APP/LiurenFocusDiviner/entry/src/main/ets');
const RES = path.join(ROOT, 'APP/LiurenFocusDiviner/entry/src/main/resources');
const DRY = process.argv.indexOf('--dry') >= 0;
const EXPLAIN = process.argv.indexOf('--explain') >= 0;

/* 明确排除的文件（路径子串匹配）：三类"不能用 Resource"的位置 */
const EXCLUDE = [
  'entryability/EntryAbility.ets',        /* ② 系统栏 API 要 string */
  'pages/Legal/UserAgreement.ets',        /* ① 富文本长文本拼接 */
  'pages/Legal/PrivacyPolicy.ets'         /* ① 同上 */
  /* components/AncientCaseGallery.ets：曾因"属性声明为 string"排除；2026-09-18 复测其颜色
   * 帮助函数（routeColor/roleColor）已升级为 ResourceColor、自身 @State 只有 4 个文本 string，
   * 故重新纳入，以构建结果为准。 */
];

/* 证法 A 白名单：ArkUI 中参数类型为 ResourceColor 的属性/组件方法名 */
const API_OK = new Set([
  'fontColor', 'backgroundColor', 'borderColor', 'color', 'selectedColor', 'caretColor',
  'placeholderColor', 'symbolColor', 'dividerColor', 'shadow', 'border', 'divider',
  'outline', 'linearGradient', 'radialGradient', 'sweepGradient'
]);

const val2tok = new Map();
for (const t of JSON.parse(fs.readFileSync(path.join(RES, 'dark/element/color.json'), 'utf-8')).color) {
  const v = String(t.value).toUpperCase();
  if (!val2tok.has(v)) val2tok.set(v, t.name);
}
const size2tok = new Map();
for (const f of JSON.parse(fs.readFileSync(path.join(RES, 'base/element/float.json'), 'utf-8')).float) {
  const m = /^(\d+)fp$/.exec(String(f.value));
  if (m && !size2tok.has(m[1])) size2tok.set(m[1], f.name);
}
function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out); else if (/\.ets$/.test(e.name)) out.push(p);
  }
  return out;
}
function rgba2argb(s) {
  const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+)\s*)?\)/i.exec(s);
  if (!m) return '';
  const hex = (n) => ('0' + Number(n).toString(16)).slice(-2).toUpperCase();
  const a = m[4] === undefined ? 255 : Math.round(Number(m[4]) * 255);
  return '#' + hex(a) + hex(m[1]) + hex(m[2]) + hex(m[3]);
}

/* 整段字符串就是一个色值（引号紧贴值，故富文本/拼接天然不匹配） */
const LIT = /(['"])(#[0-9A-Fa-f]{6,8}|rgba?\([^)'"]*\))\1/g;

/* 证法 A：从字面值向左找"最内层未闭合的 ( "，取其函数名 */
function enclosingCall(line, idx) {
  let depth = 0;
  for (let i = idx - 1; i >= 0; i--) {
    const ch = line[i];
    if (ch === ')') depth++;
    else if (ch === '(') {
      if (depth === 0) {
        const m = /([A-Za-z_$][\w$]*)\s*$/.exec(line.slice(0, i));
        return m ? m[1] : '';
      }
      depth--;
    }
  }
  return '';
}

/* 证法 B：本字面值是三元分支，且另一分支已是 app.color 令牌 */
function ternarySibling(line, idx) {
  const before = line.slice(0, idx);
  const after = line.slice(idx);
  const hasTok = (s) => /\$r\(\s*['"]app\.color\./.test(s);
  /* 真分支：... ? 'x' : <另一分支> */
  let m = /\?([^?.]?)\s*$/.exec(before);
  if (m && hasTok(after)) return '真分支（假分支已是令牌）';
  /* 假分支：... ? <真分支> : 'x' */
  if (/:\s*$/.test(before) && /\?[^?:]*:\s*$/.test(before) && hasTok(before)) return '假分支（真分支已是令牌）';
  return '';
}

/* 证法 C：字面值所在函数的**返回类型是 ResourceColor**（帮助函数升级后新增的位置类型）。
 * 例：private toneOf(t: string): ResourceColor { return '#E8C46A'; } —— 该位置接受 Resource。
 * 缺这条判定时，这类站点一直换不掉（值明明已经有令牌）—— 门禁 _test_color_tokens.js 早就有它。 */
function inResourceColorFn(lines, lineNo) {
  for (let i = lineNo - 1; i >= 0; i--) {
    const m = /^\s*(?:private|public|protected)?\s*(?:static\s+)?[A-Za-z_$][\w$]*\s*\([^()]*\)\s*:\s*([A-Za-z_$][\w$|<>\[\]\s]*?)\s*\{/.exec(lines[i]);
    if (!m) continue;
    let depth = 0;
    for (let j = i; j < lines.length; j++) {
      depth += (lines[j].match(/\{/g) || []).length - (lines[j].match(/\}/g) || []).length;
      if (depth <= 0) return j >= lineNo && /ResourceColor/.test(m[1]);
    }
    return false;
  }
  return false;
}

let files = 0, colorSites = 0, fontSites = 0, skippedLines = 0, residual = 0;
const perFile = [];
const residualRows = [];
const reasonTally = new Map();

for (const f of walk(ETS)) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  if (EXCLUDE.some((x) => rel.indexOf(x) >= 0)) continue;
  const short = rel.replace('APP/LiurenFocusDiviner/entry/src/main/ets/', '');
  const raw = fs.readFileSync(f, 'utf-8');
  const eol = raw.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/);
  let n = 0, touched = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!LIT.test(line) && !/fontSize\(\d+\)/.test(line)) continue;
    LIT.lastIndex = 0;
    if (/linearGradient|colors:\s*\[/.test(line) || line.indexOf('`') >= 0) { skippedLines++; continue; }
    const unsafe = /style=|<\/?[a-zA-Z]/.test(line) || /['"]\s*\+\s*['"]|\+\s*['"]#/.test(line);

    /* 逐处判定；从右往左替换以免位移 */
    const sites = [];
    let m;
    LIT.lastIndex = 0;
    while ((m = LIT.exec(line)) !== null) sites.push({ idx: m.index, len: m[0].length, lit: m[2] });
    let out = line;
    for (let k = sites.length - 1; k >= 0; k--) {
      const s = sites[k];
      const callee = enclosingCall(line, s.idx);
      const byApi = API_OK.has(callee);
      const byFn = byApi ? false : inResourceColorFn(lines, i);
      const bySib = (byApi || byFn) ? '' : ternarySibling(line, s.idx);
      const tok = val2tok.get(/^rgba?\(/i.test(s.lit) ? rgba2argb(s.lit) : s.lit.toUpperCase());
      let why = '';
      if (unsafe) why = '富文本/拼接行';
      else if (!byApi && !byFn && !bySib) why = callee ? '最内层调用 ' + callee + '() 非颜色属性' : '不在颜色属性实参位';
      else if (!tok) why = '无对应令牌';
      if (why) {
        residual++;
        reasonTally.set(why, (reasonTally.get(why) || 0) + 1);
        if (EXPLAIN) residualRows.push('  ' + short + ': ' + line.trim().slice(0, 110) + '   <= ' + why);
        continue;
      }
      out = out.slice(0, s.idx) + '$r(\'app.color.' + tok + '\')' + out.slice(s.idx + s.len);
      n++; colorSites++;
    }
    out = out.replace(/fontSize\((\d+)\)/g, (all, sz) => {
      const tok = size2tok.get(sz);
      if (!tok) return all;
      n++; fontSites++;
      return 'fontSize($r(\'app.float.' + tok + '\'))';
    });
    if (out !== line) { lines[i] = out; touched = true; }
  }
  if (n > 0) perFile.push(short + ' ' + n + ' 处');
  if (touched) { files++; if (!DRY) fs.writeFileSync(f, lines.join(eol), 'utf-8'); }
}
console.log((DRY ? '[干跑] ' : '') + '替换：文件 ' + files + ' 个，色值 ' + colorSites + ' 处，字号 ' + fontSites + ' 处；跳过整行 ' + skippedLines + '（渐变/模板串）');
console.log('未替换的字面色值（证法不成立，属"位置类型为 string / 非颜色属性"）：' + residual + ' 处');
console.log('排除文件：' + EXCLUDE.join('  '));
console.log('改动最多的文件：' + perFile.slice(0, 8).join(' ｜ '));
if (EXPLAIN) { console.log('--- 残留明细 ---'); console.log(residualRows.join('\n')); }
console.log('--- 未替换原因分布 ---');
for (const [k, v] of [...reasonTally].sort((a, b) => b[1] - a[1])) console.log('  ' + v + ' × ' + k);
if (DRY) console.log('（--dry 未写盘）');

/* ============================================================================
 * _test_color_tokens.js —— 颜色令牌门禁（两条规则）
 * ----------------------------------------------------------------------------
 * 为什么需要（2026-09-18 补，用户决策"保留 13 个半透明令牌"后补上新增风险面）：
 *   ① 令牌表对齐：`base/element/color.json` 与 `dark/element/color.json` 的令牌名必须一致。
 *      深色 qualifier 缺键时会**回落到 base 值** ⇒ 该令牌不随主题变化。base 现在装的是浅色值
 *      （将来），一条只在 base 里有、dark 里没有的令牌，在深色主题下会显示浅色值 —— 静默看错。
 *   ② 未登记字面色值：可令牌化的位置上不得再出现写死色值。
 *      本次令牌化把 448 行色值换成了 $r(...)，但**没有任何门禁**阻止有人再加一个新的写死色值
 *      （`_test_no_hardcode.js` 里零条颜色规则，我 grep 过）。
 *      判定与 `_tools/tokenize_colors.js` 同一套"位置判定"（证法 A/B/C），故不会误报
 *      富文本、canvas、模板串、渐变数组这类**本来就换不了**的位置。
 *
 * 判定口径（只有能证明"该位置接受 Resource"才算可令牌化）：
 *   证法 A：最内层调用括号的函数名 ∈ ResourceColor 属性白名单
 *   证法 B：紧邻的三元兄弟分支已经是 $r('app.color.*')
 *   证法 C：所在函数的返回类型是 ResourceColor（本次把 14 个帮助函数升级后新增的一条）
 * 三条都不成立 ⇒ 该位置换不成令牌，**不算违规**（例如 canvas 的 ctx.fillStyle 要 string）。
 *
 * 白名单（`ALLOW`）：确实还没令牌、且已登记过的低频色值。key 用"色值"而不是行号，
 *   行号会漂、色值不会；每一条都要写明原因。
 * 用法：node _tests/_test_color_tokens.js [--report]（--report 只打印清单，不判失败）
 * ==========================================================================*/
'use strict';
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');
const ETS = path.join(ROOT, 'APP/LiurenFocusDiviner/entry/src/main/ets');
const RES = path.join(ROOT, 'APP/LiurenFocusDiviner/entry/src/main/resources');
const REPORT = process.argv.includes('--report');

/* 位置判定用：接受 ResourceColor 的属性 */
const API_OK = new Set(['fontColor', 'backgroundColor', 'borderColor', 'color', 'selectedColor',
  'caretColor', 'placeholderColor', 'symbolColor', 'dividerColor', 'shadow', 'border', 'divider',
  'outline', 'linearGradient', 'radialGradient', 'sweepGradient']);
/* 明确排除的文件（三类"不能用 Resource"的位置；与 tokenize_colors.js 保持一致） */
const EXCLUDE_FILES = ['entryability/EntryAbility.ets', 'pages/Legal/UserAgreement.ets',
  'pages/Legal/PrivacyPolicy.ets'];

/* 已登记的低频字面色值：确实还没有令牌（不是漏了）。key = 大写色值 */
const ALLOW = new Map([
  /* 2026-09-18 清空：原先登记的"待定"色值**已全部建令牌**
   * （_tools/pending_colors.js 16 个 + _tools/case_palette.js 15 个案卷色），
   * 可令牌化位置上已 0 处未登记。留着空转的白名单只会掩盖"以后有人再写死"的回归。
   * 若确需保留字面色值，加进来时必须写明原因。 */
]);

const LIT = /(['"])(#[0-9A-Fa-f]{6,8}|rgba?\([^)'"]*\))\1/g;
const BACK = 2000;

function walk(d, out = []) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else if (/\.ets$/.test(e.name)) out.push(p); } return out; }
function enclosingCall(text, idx) {
  let depth = 0;
  for (let i = idx - 1; i >= 0; i--) {
    const ch = text[i];
    if (ch === ')') depth++;
    else if (ch === '(') { if (depth === 0) { const m = /([A-Za-z_$][\w$]*)\s*$/.exec(text.slice(0, i)); return m ? m[1] : ''; } depth--; }
  }
  return '';
}
function ternarySibling(text, idx) {
  const TOK = "\\$r\\(\\s*['\"]app\\.color\\.[^)]*\\)";
  const before = text.slice(Math.max(0, idx - 400), idx), after = text.slice(idx, idx + 400);
  const afterLit = after.replace(/^(['"])[^'"]*\1/, '');
  if (new RegExp('^\\s*:\\s*' + TOK).test(afterLit)) return true;
  if (new RegExp(TOK + '\\s*:\\s*$').test(before)) return true;
  return false;
}
/** 证法 C：字面值所在函数的返回类型是不是 ResourceColor */
function inResourceColorFn(lines, lineNo) {
  for (let i = lineNo - 1; i >= 0; i--) {
    const m = lines[i].match(/^\s*(?:private|public|protected)?\s*(?:static\s+)?[A-Za-z_$][\w$]*\s*\([^()]*\)\s*:\s*([A-Za-z_$][\w$|<>\[\]\s]*?)\s*\{/);
    if (!m) continue;
    /* 找到最近的函数声明后，必须确认它**包住**当前行 */
    let depth = 0;
    for (let j = i; j < lines.length; j++) {
      depth += (lines[j].match(/\{/g) || []).length - (lines[j].match(/\}/g) || []).length;
      if (depth <= 0) return j >= lineNo && /ResourceColor/.test(m[1]);
    }
    return false;
  }
  return false;
}

/* ---------- 规则 ①：令牌表对齐 ---------- */
function loadTokens(theme) {
  const p = path.join(RES, theme, 'element/color.json');
  const m = new Map();
  for (const t of JSON.parse(fs.readFileSync(p, 'utf-8')).color) m.set(t.name, String(t.value));
  return m;
}
const base = loadTokens('base'), dark = loadTokens('dark');
const onlyBase = [...base.keys()].filter((k) => !dark.has(k));
const onlyDark = [...dark.keys()].filter((k) => !base.has(k));

/* ---------- 规则 ②：可令牌化位置上的字面色值 ---------- */
const hits = [];
for (const f of walk(ETS)) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const short = rel.replace('APP/LiurenFocusDiviner/entry/src/main/ets/', '');
  if (EXCLUDE_FILES.some((x) => rel.indexOf(x) >= 0)) continue;
  const lines = fs.readFileSync(f, 'utf-8').split(/\r?\n/);
  let ctx = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const full = ctx + line, off = ctx.length;
    ctx = (ctx + line + '\n').slice(-BACK);
    if (!/'#|'rgba/.test(line)) continue;
    if (/linearGradient|colors:\s*\[/.test(line) || line.indexOf('`') >= 0) continue;   /* 渐变/模板串：换不了 */
    if (/style=|<\/?[a-zA-Z]/.test(line)) continue;                                     /* 富文本行 */
    if (/['"]\s*\+\s*['"]|\+\s*['"]#/.test(line)) continue;                             /* 拼接行 */
    LIT.lastIndex = 0; let m;
    while ((m = LIT.exec(line)) !== null) {
      const lit = m[2];
      const abs = off + m.index;
      const callee = enclosingCall(full, abs);
      const ok = API_OK.has(callee) || ternarySibling(full, abs) || inResourceColorFn(lines, i);
      if (!ok) continue;                                                                /* 位置本来就不接受 Resource */
      hits.push({ file: short, line: i + 1, lit, why: API_OK.has(callee) ? 'API:' + callee : (ternarySibling(full, abs) ? '三元兄弟' : '返回 ResourceColor') });
    }
  }
}
const allowed = hits.filter((h) => ALLOW.has(h.lit.toUpperCase()));
const bad = hits.filter((h) => !ALLOW.has(h.lit.toUpperCase()));

console.log('=== 颜色令牌门禁 ===');
console.log('① 令牌表对齐：base ' + base.size + ' 个 / dark ' + dark.size + ' 个');
if (onlyBase.length) console.log('   ✗ 只在 base 里（深色会回落成浅色值）：' + onlyBase.join(', '));
if (onlyDark.length) console.log('   ✗ 只在 dark 里（浅色会回落成深色值）：' + onlyDark.join(', '));
if (!onlyBase.length && !onlyDark.length) console.log('   ✓ 两侧令牌名完全一致');
console.log('② 未登记字面色值：可令牌化位置上共 ' + hits.length + ' 处；其中已登记 ' + allowed.length + ' 处、未登记 ' + bad.length + ' 处');
/* "待定"条目每次运行都打印：它们确实是还没令牌的色值，属于**公开放弃**而非偷偷放过 ——
 * 写浅色值时必须逐个处理（新增令牌 or 并入最近令牌），否则浅色主题下它们仍是深色值。 */
const pending = [...new Set(allowed.map((h) => h.lit.toUpperCase()))].filter((v) => (ALLOW.get(v) || '').indexOf('待定') === 0);
if (pending.length) {
  console.log('   ⚠ 其中 ' + pending.length + ' 个色值仍是「待定」（浅色值阶段必须处理）：');
  for (const v of pending) console.log('      ' + v.padEnd(24) + ALLOW.get(v));
}
if (REPORT) {
  console.log('\n--- 已登记（白名单，非漏网） ---');
  for (const h of allowed) console.log('  ' + h.lit + '  ' + h.file + ':' + h.line + '  [' + h.why + ']');
  console.log('\n--- 未登记（会被判失败） ---');
  for (const h of bad) console.log('  ' + h.lit + '  ' + h.file + ':' + h.line + '  [' + h.why + ']');
  process.exit(0);
}
if (bad.length) {
  console.log('\n✗ 有 ' + bad.length + ' 处可令牌化的字面色值没登记（请改用 $r(\'app.color.…\') 或登记进 ALLOW 并写明原因）：');
  for (const h of bad.slice(0, 20)) console.log('  ' + h.lit + '  ' + h.file + ':' + h.line + '  [' + h.why + ']');
  if (bad.length > 20) console.log('  …其余 ' + (bad.length - 20) + ' 处见 --report');
}
const fail = bad.length + onlyBase.length + onlyDark.length;
console.log(fail ? '\n颜色令牌门禁：FAIL' : '\n颜色令牌门禁：PASS');
process.exit(fail ? 1 : 0);

/* ============================================================================
 * tokenize_colors.js —— 把字面色值/字号机械替换为资源令牌（第 2 步的正式工具）
 * ----------------------------------------------------------------------------
 * 为什么不是一次性脚本：第一次尝试一刀切 → 编译 2231 错（见下）。故规则按**位置类型**分档，
 * 并允许按文件排除；每次跑完必须构建，把残留的编译错文件加进 EXCLUDE 再来。
 *
 * 安全规则（只在"整段字符串就是一个值"的位置替换）：
 *   '#'RRGGBB 必须紧贴 ( 或 : 或 , ，且后面紧跟 ) 或 , —— 富文本/拼接里的色值天然不满足，被跳过
 * 明确排除（三类位置不能用 Resource）：
 *   ① 富文本/长文本拼接（Legal 页把色值拼进说明文字）—— 语法会崩
 *   ② 系统栏 API（EntryAbility 设状态栏颜色）—— 该 API 参数类型是 string，不认 Resource
 *   ③ 组件属性声明为 string 的（构建报 "Type 'string | Resource' is not assignable to type 'string'"）
 * 用法：
 *   node _tools/tokenize_colors.js            # 执行替换（改 .ets）
 *   node _tools/tokenize_colors.js --dry      # 只报告将要替换多少处，不改文件
 * 回滚：git checkout -- APP/LiurenFocusDiviner/entry/src/main/ets
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const ETS = path.join(ROOT, 'APP/LiurenFocusDiviner/entry/src/main/ets');
const RES = path.join(ROOT, 'APP/LiurenFocusDiviner/entry/src/main/resources');
const DRY = process.argv.indexOf('--dry') >= 0;

/* 明确排除的文件（路径子串匹配）：三类"不能用 Resource"的位置 */
const EXCLUDE = [
  'entryability/EntryAbility.ets',        /* ② 系统栏 API 要 string */
  'pages/Legal/UserAgreement.ets',        /* ① 富文本长文本拼接 */
  'pages/Legal/PrivacyPolicy.ets'         /* ① 同上 */,
  'components/AncientCaseGallery.ets'      /* ③ 属性声明为 string（Resource 不可赋） */
];

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
const SAFE = /(\(\s*|:\s*)(['"])(#[0-9A-Fa-f]{6,8}|rgba?\([^)'"]*\))\2(\s*[,)]|\s*$)/g;

let files = 0, colorHits = 0, fontHits = 0, skipped = 0;
const perFile = [];
for (const f of walk(ETS)) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  if (EXCLUDE.some((x) => rel.indexOf(x) >= 0)) continue;
  const raw = fs.readFileSync(f, 'utf-8');
  const eol = raw.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/);
  let n = 0, touched = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/linearGradient|colors:\s*\[/.test(line) || line.indexOf('`') >= 0) { skipped++; continue; }
    const unsafe = /style=|<\/?[a-zA-Z]/.test(line) || /['"]\s*\+\s*['"]|\+\s*['"]#/.test(line);
    const out = line.replace(SAFE, (all, pre, q, lit, post) => {
      const tok = val2tok.get(/^rgba?\(/i.test(lit) ? rgba2argb(lit) : lit.toUpperCase());
      if (!tok || unsafe) { skipped++; return all; }
      n++; return pre + '$r(\'app.color.' + tok + '\')' + post;
    }).replace(/fontSize\((\d+)\)/g, (all, sz) => {
      const tok = size2tok.get(sz);
      if (!tok) return all;
      n++; return 'fontSize($r(\'app.float.' + tok + '\'))';
    });
    if (out !== line) { lines[i] = out; touched = true; if (/app\.color/.test(out)) colorHits++; else fontHits++; }
  }
  if (n > 0) { perFile.push(rel.replace('APP/LiurenFocusDiviner/entry/src/main/ets/', '') + ' ' + n + ' 处'); }
  if (touched) { files++; if (!DRY) fs.writeFileSync(f, lines.join(eol), 'utf-8'); }
}
console.log((DRY ? '[干跑] ' : '') + '替换：文件 ' + files + ' 个，共 ' + (colorHits + fontHits) + ' 行命中；跳过 ' + skipped + ' 行（渐变/模板串/富文本/无映射）');
console.log('排除文件：' + EXCLUDE.join('  '));
console.log('改动最多的文件：' + perFile.slice(0, 8).join(' ｜ '));
if (DRY) console.log('（--dry 未写盘）');

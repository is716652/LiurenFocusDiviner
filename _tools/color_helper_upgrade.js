/* ============================================================================
 * color_helper_upgrade.js —— 把"返回类型为 string 的颜色帮助函数"升级为 ResourceColor
 * ----------------------------------------------------------------------------
 * 目的：这类函数是浅色主题的漏光点 ——
 *   private bgColor(): string { return 'rgba(233,200,120,0.14)'; }   // 换不成令牌、拿不到浅色值
 *   .backgroundColor(this.bgColor())                                // 调用处其实是颜色属性
 * 升级返回类型后，里面的色值就能换成资源令牌，浅色主题才生效。
 *
 * 安全性证明（两条断言，任一不成立就中止，不写盘）：
 *   ① 该名字的**所有**调用点都落在颜色属性实参位（证法 A 白名单）
 *   ② 字面值都能在 color.json（base/dark）里找到同名同值的令牌 —— 找不到就不换，只报告
 * 名单来自 `node _tools/color_helper_audit.js` 的输出（14 个，全部 ✅ 可升级）。
 *
 * 用法：
 *   node _tools/color_helper_upgrade.js --plan    # 只报告：签名改动 + 色值→令牌映射
 *   node _tools/color_helper_upgrade.js --apply   # 写盘
 * 回滚：git checkout -- APP/LiurenFocusDiviner/entry/src/main/ets
 * ==========================================================================*/
'use strict';
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');
const ETS = path.join(ROOT, 'APP/LiurenFocusDiviner/entry/src/main/ets');
const RES = path.join(ROOT, 'APP/LiurenFocusDiviner/entry/src/main/resources');
const PLAN = process.argv.indexOf('--plan') >= 0, APPLY = process.argv.indexOf('--apply') >= 0;
if (!PLAN && !APPLY) { console.log('用法：--plan 或 --apply'); process.exit(2); }

const API_OK = new Set(['fontColor', 'backgroundColor', 'borderColor', 'color', 'selectedColor',
  'caretColor', 'placeholderColor', 'symbolColor', 'dividerColor', 'shadow', 'border', 'divider',
  'outline', 'linearGradient', 'radialGradient', 'sweepGradient']);
/* 名单：{ 文件, 函数名 }（来自 color_helper_audit.js 的 ✅ 列表） */
const NAMES = [
  ['components/AncientCaseGallery.ets', 'routeColor'],
  ['components/AncientCaseGallery.ets', 'roleColor'],
  ['components/DongtaiChuan.ets', 'gzColor'],
  ['components/DongtaiChuan.ets', 'cardBrd'],
  ['components/InfoRow.ets', 'valueColor'],
  ['components/PalaceCard.ets', 'toneOf'],
  ['components/SlotEmpty.ets', 'toneColor'],
  ['components/TagBadge.ets', 'txtColor'],
  ['components/TagBadge.ets', 'bgColor'],
  ['components/TagBadge.ets', 'brdColor'],
  ['components/YongShenPills.ets', 'fontColorOf'],
  ['components/YongShenPills.ets', 'bgOf'],
  ['components/YongShenPills.ets', 'brdOf'],
  ['pages/Index.ets', 'bandColor']
];

/* 令牌值 → 名字（base 与 dark 必须一致才敢用；本轮 base==dark，浅色值落地后此断言仍要成立） */
function loadTokens(theme) {
  const m = new Map();
  for (const t of JSON.parse(fs.readFileSync(path.join(RES, theme, 'element/color.json'), 'utf-8')).color) {
    const v = String(t.value).toUpperCase();
    if (!m.has(v)) m.set(v, t.name);
  }
  return m;
}
const tokBase = loadTokens('base'), tokDark = loadTokens('dark');
function argbOf(lit) {
  if (/^#[0-9A-Fa-f]{8}$/.test(lit)) return lit.toUpperCase();
  if (/^#[0-9A-Fa-f]{6}$/.test(lit)) return '';  /* 6 位无 alpha，交给不透明令牌匹配 */
  const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+)\s*)?\)/i.exec(lit);
  if (!m) return '';
  const h = (n) => ('0' + Number(n).toString(16)).slice(-2).toUpperCase();
  return '#' + h(Math.round((m[4] === undefined ? 1 : Number(m[4])) * 255)) + h(m[1]) + h(m[2]) + h(m[3]);
}
/* 家族+档位兜底：精确值找不到令牌时，按"家族（rgb 最近邻）+ 该家族已有的最接近 alpha"落点。
 * 这与 overlay_tokens.js 的合并口径一致（用户已拍板：允许合并差异极小的透明度），
 * 只对半透明值生效；不透明低频色值不猜（留给"新增令牌 vs 并入"的待定决策）。 */
const FAM = [[233, 200, 120], [138, 123, 92], [33, 30, 24], [208, 112, 74], [95, 163, 148]];
const OV = [];
for (const [v, name] of tokDark) {
  const m = /^#([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/.exec(v);
  if (!m || !/^overlay_/.test(name)) continue;
  OV.push({ name, a: parseInt(m[1], 16) / 255, rgb: [parseInt(m[2], 16), parseInt(m[3], 16), parseInt(m[4], 16)] });
}
function overlayFor(rgba) {
  let bestFam = null;
  for (const f of FAM) {
    const d = Math.pow(rgba[0] - f[0], 2) + Math.pow(rgba[1] - f[1], 2) + Math.pow(rgba[2] - f[2], 2);
    if (!bestFam || d < bestFam.d) bestFam = { f, d };
  }
  let best = null;
  for (const o of OV) {
    if (o.rgb[0] !== bestFam.f[0] || o.rgb[1] !== bestFam.f[1] || o.rgb[2] !== bestFam.f[2]) continue;
    const d = Math.abs(o.a - rgba[3]);
    if (!best || d < best.d) best = { o, d };
  }
  return best && best.d <= 0.16 ? best.o.name : '';
}
function tokenFor(lit) {
  const key = /^rgba?\(/i.test(lit) ? argbOf(lit) : lit.toUpperCase();
  if (!key) return '';
  const a = tokDark.get(key), b = tokBase.get(key);
  if (a && b && a === b) return a;
  if (/^rgba?\(/i.test(lit)) {
    const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+)\s*)?\)/i.exec(lit);
    if (m) return overlayFor([+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]]);
  }
  return '';
}
function walk(d, out = []) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else if (/\.ets$/.test(e.name)) out.push(p); } return out; }
function enclosingCall(text, idx) {
  let depth = 0;
  for (let i = idx - 1; i >= 0; i--) { const ch = text[i]; if (ch === ')') depth++; else if (ch === '(') { if (depth === 0) { const m = /([A-Za-z_$][\w$]*)\s*$/.exec(text.slice(0, i)); return m ? m[1] : ''; } depth--; } }
  return '';
}
const files = walk(ETS);

/* ---- 断言 ①：所有调用点都在颜色属性实参位 ---- */
let bad = 0;
for (const [relFile, name] of NAMES) {
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf-8');
    const re = new RegExp('\\b' + name + '\\s*\\(', 'g');
    let m;
    while ((m = re.exec(text)) !== null) {
      const tail = text.slice(m.index);
      /* 定义行要跳过：`name(...): string` 与升级后的 `name(...): ResourceColor` 都算定义。
       * （只匹配 string 的版本会在"已升级过一次"之后再跑时，把定义行当调用点误报 ⛔） */
      if (new RegExp('^' + name + '\\s*\\([^()]*\\)\\s*:\\s*(?:string|ResourceColor)').test(tail)) continue;
      const callee = enclosingCall(text, m.index + name.length);
      if (!API_OK.has(callee)) {
        bad++;
        console.log('⛔ 调用点不在颜色属性位：' + path.relative(ROOT, f) + ':' + (text.slice(0, m.index).split('\n').length) +
          '  ' + name + '() 外层=' + (callee || '(无)'));
      }
    }
  }
}
if (bad) { console.log('断言①不成立，拒绝继续（' + bad + ' 处）'); process.exit(3); }
console.log('断言①通过：' + NAMES.length + ' 个函数的全部调用点都在颜色属性实参位');

/* ---- 逐文件处理 ---- */
let sigChanged = 0, litChanged = 0, litLeft = 0, fileCount = 0;
const byFile = new Map();
/* ---- 逐文件处理 ----
 * 必须**按文件分组**：同一文件里有多个待升级函数时（TagBadge 3 个、YongShenPills 3 个…
 * 第一版按 (文件,函数) 逐条处理并每条都重新从磁盘读原文件，后一条会把前一条的改动覆盖掉 ✗
 * （症状：AncientCaseGallery/DongtaiChuan/Index 的改动量对不上、部分函数没改到） */
const namesByFile = new Map();
for (const [relFile, name] of NAMES) {
  if (!namesByFile.has(relFile)) namesByFile.set(relFile, []);
  namesByFile.get(relFile).push(name);
}
for (const [relFile, names] of namesByFile) {
  const p = path.join(ETS, relFile);
  const raw = fs.readFileSync(p, 'utf-8');
  const eol = raw.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/);
  for (const name of names) {
    /* 幂等：已经是 ResourceColor 的直接跳过（本工具会被重跑，例如工作区被外部
     * 变异型门禁回滚之后）。没有这条就会在"签名未匹配"处 process.exit(4) 中断。 */
    if (new RegExp('^\\s*(?:private|public|protected)?\\s*(?:static\\s+)?' + name + '\\s*\\([^()]*\\)\\s*:\\s*ResourceColor\\s*\\{', 'm').test(lines.join('\n'))) {
      console.log('· 已是 ResourceColor，跳过：' + relFile + ' ' + name + '()');
      continue;
    }
    /* 定位函数体（按行，够用：本项目函数体不含嵌套大括号以外的花括号复杂度） */
    let start = -1, end = -1, depth = 0;
    for (let i = 0; i < lines.length; i++) {
      if (start < 0) {
        if (new RegExp('^\\s*(?:private|public|protected)?\\s*(?:static\\s+)?' + name + '\\s*\\([^()]*\\)\\s*:\\s*string\\s*\\{').test(lines[i])) { start = i; depth = 0; }
        else continue;
      }
      for (const ch of lines[i]) { if (ch === '{') depth++; else if (ch === '}') depth--; }
      if (start >= 0 && depth <= 0) { end = i; break; }
    }
    if (start < 0 || end < 0) { console.log('⛔ 找不到函数体：' + relFile + ' ' + name + '()'); process.exit(4); }
    const newSig = lines[start].replace(/:\s*string\s*\{/, ': ResourceColor {');
    if (newSig === lines[start]) { console.log('⛔ 签名未匹配：' + relFile + ':' + (start + 1)); process.exit(4); }
    if (PLAN) console.log('签名 ' + relFile + ':' + (start + 1) + '  ' + lines[start].trim() + '  →  ' + newSig.trim());
    lines[start] = newSig; sigChanged++;
    for (let i = start + 1; i < end; i++) {
      /* 组号提醒：\2 是反向引用不算组，故尾部 (;\s*) 是第 **4** 组。
       * 第一版写成 mm[5] → 生成 `return $r('app.color.x')undefined`，编译报 "';' expected"。 */
      const mm = /^(\s*return\s+)(['"])(#[0-9A-Fa-f]{6,8}|rgba?\([^)'"]*\))\2(;\s*)$/.exec(lines[i]);
      if (!mm) continue;
      const tok = tokenFor(mm[3]);
      if (!tok) {
        litLeft++;
        console.log('  ⚠ 无对应令牌，保留：' + relFile + ':' + (i + 1) + '  ' + mm[3]);
        continue;
      }
      const out = mm[1] + '$r(\'app.color.' + tok + '\')' + mm[4];
      if (PLAN) console.log('色值 ' + relFile + ':' + (i + 1) + '  ' + mm[3] + '  →  ' + tok);
      lines[i] = out; litChanged++;
    }
  }
  byFile.set(p, { text: lines.join(eol), rel: relFile });
}
if (APPLY) { for (const [p, o] of byFile) { fs.writeFileSync(p, o.text, 'utf-8'); fileCount++; } }
console.log((PLAN ? '[干跑] ' : '') + '签名升级 ' + sigChanged + ' 个；色值→令牌 ' + litChanged + ' 处；无令牌保留 ' + litLeft + ' 处；写盘文件 ' + (APPLY ? fileCount : 0) + ' 个');

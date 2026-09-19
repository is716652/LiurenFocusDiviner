/* ============================================================================
 * overlay_tokens.js —— 半透明色值 → 语义令牌（第 2 步的第 3 批，rgba 专用）
 * ----------------------------------------------------------------------------
 * 背景：50 个不透明色值已令牌化；剩下 65 种 rgba 半透明值没有令牌。
 *       浅色主题要能用，这批必须令牌化，否则浅底上会出现深色块。
 *
 * 设计（用户 2026-09-16 决策：合并成少量语义令牌，不要逐值保真）：
 *   家族 = 该 App 实际在用的 5 个半透明基色：金 #E9C878 / 褐金 #8A7B5C /
 *          墨 #211E18 / 朱 #D0704A / 青 #5FA394
 *   档位 = 每家族 3 档（弱/中/强）。**每档的 alpha 不是手调的**，而是从该家族
 *          实际出现的 alpha 里暴力挑选"按站点数加权 |Δα| 最小"的 3 个刻度。
 *   家族归属 = 最近邻 rgb 距离 + 人工覆盖表（最近邻会把 #D0AA4A 这个金判成朱）
 *
 * 与 tokenize_colors.js 的分工：
 *   本工具只管"没有对应令牌的 rgba"；值已等于某个既有令牌时不重复建令牌。
 *   位置判定与 tokenize_colors.js 一致（见那里的说明），且**跨行**回溯
 *   （多行 builder 属性 .border({\n color: 'rgba(…)'\n}) 才判得出来）。
 *
 * 用法：
 *   node _tools/overlay_tokens.js --plan     # 只报告：定稿令牌表 + 落点 + 偏差 + 白名单
 *   node _tools/overlay_tokens.js --apply    # 写入 color.json（base+dark）并替换 .ets
 * 回滚：git checkout -- APP/LiurenFocusDiviner/entry/src
 * ==========================================================================*/
'use strict';
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');
const ETS = path.join(ROOT, 'APP/LiurenFocusDiviner/entry/src/main/ets');
const RES = path.join(ROOT, 'APP/LiurenFocusDiviner/entry/src/main/resources');
const PLAN = process.argv.indexOf('--plan') >= 0;
const APPLY = process.argv.indexOf('--apply') >= 0;
if (!PLAN && !APPLY) { console.log('用法：--plan 或 --apply'); process.exit(2); }

const EXCLUDE = [
  'entryability/EntryAbility.ets',
  'pages/Legal/UserAgreement.ets',
  'pages/Legal/PrivacyPolicy.ets',
];
const API_OK = new Set(['fontColor', 'backgroundColor', 'borderColor', 'color', 'selectedColor',
  'caretColor', 'placeholderColor', 'symbolColor', 'dividerColor', 'shadow', 'border', 'divider',
  'outline', 'linearGradient', 'radialGradient', 'sweepGradient']);
const LIT = /(['"])(#[0-9A-Fa-f]{6,8}|rgba?\([^)'"]*\))\1/g;
const BACK = 2000;
const FAM = [
  { key: 'gold', rgb: [233, 200, 120] },
  { key: 'olive', rgb: [138, 123, 92] },
  { key: 'ink', rgb: [33, 30, 24] },
  { key: 'cinnabar', rgb: [208, 112, 74] },
  { key: 'teal', rgb: [95, 163, 148] }
];
const OVERRIDE = { '208,170,74': 'gold' };   /* 最近邻会判成朱，实际是金 */
const OPAQUE_MIN = 0.70;                      /* 近不透明实心填充不进令牌表 */
const ROLE = ['weak', 'mid', 'strong'];

/* 既有令牌值 → 令牌名（用来避免重复建令牌） */
const val2tok = new Map();
for (const t of JSON.parse(fs.readFileSync(path.join(RES, 'dark/element/color.json'), 'utf-8')).color) {
  const v = String(t.value).toUpperCase();
  if (!val2tok.has(v)) val2tok.set(v, t.name);
}
function rgba2argb(s) {
  const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+)\s*)?\)/i.exec(s);
  if (!m) return '';
  const hex = (n) => ('0' + Number(n).toString(16)).slice(-2).toUpperCase();
  const a = m[4] === undefined ? 255 : Math.round(Number(m[4]) * 255);
  return '#' + hex(a) + hex(m[1]) + hex(m[2]) + hex(m[3]);
}
function walk(d, out = []) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else if (/\.ets$/.test(e.name)) out.push(p); } return out; }
function enclosingCall(text, idx) {
  let depth = 0;
  for (let i = idx - 1; i >= 0; i--) {
    const ch = text[i];
    if (ch === ')') depth++;
    else if (ch === '(') {
      if (depth === 0) { const m = /([A-Za-z_$][\w$]*)\s*$/.exec(text.slice(0, i)); return m ? m[1] : ''; }
      depth--;
    }
  }
  return '';
}
/* 证法 B：本字面值是三元分支，且**同层另一分支就是 app.color 令牌**（不是"附近某个令牌"）
 * 只有"紧邻的兄弟分支是令牌"才证明该位置接受 Resource。
 * 曾经写成 `/\?[^?:]*:\s*$/`（只看三元形状、不看兄弟是不是令牌），
 * 结果把 `isKong ? 'rgba(a)' : 'rgba(b)'` 这种纯字面值三元误判为安全 → 编译错。 */
function ternarySibling(text, idx) {
  const TOK = "\\$r\\(\\s*['\"]app\\.color\\.[^)]*\\)";
  const before = text.slice(Math.max(0, idx - 400), idx), after = text.slice(idx, idx + 400);
  const afterLit = after.replace(/^(['"])[^'"]*\1/, '');
  if (new RegExp('^\\s*:\\s*' + TOK).test(afterLit)) return true;   /* 真分支：… : $r(…) */
  if (new RegExp(TOK + '\\s*:\\s*$').test(before)) return true;      /* 假分支：$r(…) : … */
  return false;
}
function parseRgba(lit) {
  const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+)\s*)?\)/i.exec(lit);
  return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
}
function famOf(rgba) {
  const k = rgba.r + ',' + rgba.g + ',' + rgba.b;
  if (OVERRIDE[k]) return FAM.find((f) => f.key === OVERRIDE[k]);
  let best = null;
  for (const f of FAM) {
    const d = Math.pow(rgba.r - f.rgb[0], 2) + Math.pow(rgba.g - f.rgb[1], 2) + Math.pow(rgba.b - f.rgb[2], 2);
    if (!best || d < best.d) best = { f, d };
  }
  return best.f;
}
const composite = (c, a, bg) => [0, 1, 2].map((i) => Math.round(a * c[i] + (1 - a) * bg[i]));
const DARK_BG = [20, 18, 15];
const toArgb = (rgb, a) => '#' + ('0' + Math.round(a * 255).toString(16).toUpperCase()).slice(-2) +
  rgb.map((n) => ('0' + n.toString(16).toUpperCase()).slice(-2)).join('');

/* ===== 采集：可令牌化的 rgba 站点 + 白名单 ===== */
const sites = [], whitelist = [];
for (const f of walk(ETS)) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const short = rel.replace('APP/LiurenFocusDiviner/entry/src/main/ets/', '');
  const excluded = EXCLUDE.some((x) => rel.indexOf(x) >= 0);
  const lines = fs.readFileSync(f, 'utf-8').split(/\r?\n/);
  let ctx = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const full = ctx + line, off = ctx.length;
    ctx = (ctx + line + '\n').slice(-BACK);
    if (!/rgba?\(/i.test(line)) continue;
    if (/linearGradient|colors:\s*\[/.test(line) || line.indexOf('`') >= 0) { if (!excluded) whitelist.push([short + ':' + (i + 1), '渐变/模板串']); continue; }
    const unsafe = /style=|<\/?[a-zA-Z]/.test(line) || /['"]\s*\+\s*['"]|\+\s*['"]#/.test(line);
    LIT.lastIndex = 0; let m;
    while ((m = LIT.exec(line)) !== null) {
      const lit = m[2];
      if (!/^rgba?\(/i.test(lit)) continue;
      const rgba = parseRgba(lit);
      if (!rgba) continue;
      const abs = off + m.index;
      if (excluded) { whitelist.push([short + ':' + (i + 1), '排除文件（属性声明为 string / 富文本）']); continue; }
      const callee = enclosingCall(full, abs);
      if (!API_OK.has(callee) && !ternarySibling(full, abs)) {
        whitelist.push([short + ':' + (i + 1), callee ? '最内层 ' + callee + '() 非颜色属性' : '局部量/帮助函数返回值（声明为 string）']);
        continue;
      }
      if (unsafe) { whitelist.push([short + ':' + (i + 1), '拼接行']); continue; }
      if (val2tok.has(rgba2argb(lit))) { whitelist.push([short + ':' + (i + 1), '值等于既有令牌 ' + val2tok.get(rgba2argb(lit))]); continue; }
      sites.push({ short, ln: i + 1, lit, rgba, fam: famOf(rgba) });
    }
  }
}

/* ===== 逐家族挑 alpha 刻度（加权 |Δα| 最小） =====
 * 迭代两步，直到没有站点被剔除：
 *   ① 挑 3 档（暴力枚举实际出现的 alpha）
 *   ② 把 |Δα| > TOL 的离群站点剔到白名单（例如金的 0.85 实心填充，与 0.35 强档差 0.50）
 * 家族所有站点都 ≥ OPAQUE_MIN（近不透明）时，说明它是"遮罩"而不是"淡淡的一层"，
 * 此时**不建 3 档**，只建一个 overlay_<族>_scrim（取加权平均 alpha）——否则会造出
 * 三个 0.72/0.80/0.85 这种几乎一样的令牌，是令牌膨胀而不是合并。
 */
const TOL = 0.12;
const table = [];
for (const f of FAM) {
  let mine = sites.filter((s) => s.fam.key === f.key);
  let c = null, b1 = 0, b2 = 0, scrim = false;
  for (let iter = 0; iter < 5; iter++) {
    if (!mine.length) break;
    if (mine.every((s) => s.rgba.a >= OPAQUE_MIN)) {
      const wsum = mine.reduce((acc, s) => acc + s.rgba.a, 0);
      c = [wsum / mine.length, 0, 0]; b1 = 0; b2 = 0; scrim = true;
      break;
    }
    scrim = false;
    const alphas = [...new Set(mine.map((s) => s.rgba.a))].sort((a, b) => a - b);
    let best = null;
    for (const a1 of alphas) for (const a2 of alphas) for (const a3 of alphas) {
      if (!(a1 <= a2 && a2 <= a3)) continue;
      const cc = [a1, a2, a3];
      for (const x of alphas) for (const y of alphas) {
        if (x > y) continue;
        let cost = 0;
        for (const s of mine) cost += Math.abs(s.rgba.a - cc[s.rgba.a <= x ? 0 : (s.rgba.a <= y ? 1 : 2)]);
        if (!best || cost < best.cost) best = { cost, c: cc, b1: x, b2: y };
      }
    }
    c = best.c; b1 = best.b1; b2 = best.b2;
    const drop = mine.filter((s) => Math.abs(s.rgba.a - c[s.rgba.a <= b1 ? 0 : (s.rgba.a <= b2 ? 1 : 2)]) > TOL);
    if (!drop.length) break;
    for (const s of drop) whitelist.push([s.short + ':' + s.ln, '离三档过远（Δα>' + TOL + '）的实心填充 rgba(' + s.rgba.r + ',' + s.rgba.g + ',' + s.rgba.b + ',' + s.rgba.a + ')']);
    mine = mine.filter((s) => drop.indexOf(s) < 0);
  }
  if (mine.length) table.push({ f, c, b1, b2, scrim, mine });
}
const tokName = (t, i) => 'overlay_' + t.f.key + '_' + (t.scrim ? 'scrim' : ROLE[i]);
const tokOf = (t, alpha) => (t.scrim ? tokName(t, 0) : tokName(t, alpha <= t.b1 ? 0 : (alpha <= t.b2 ? 1 : 2)));
/* 站点级映射表：apply 只认这张表，保证"计划里剔除的站点，替换时也不会被替换" */
const litKey = (rgba) => rgba.r + ',' + rgba.g + ',' + rgba.b + '@' + rgba.a;
const litMap = new Map();
for (const t of table) for (const s of t.mine) litMap.set(litKey(s.rgba), tokOf(t, s.rgba.a));

if (PLAN) {
  console.log('=== 定稿令牌表（暗色值 = 现值合并，零观感设计改动） ===');
  let tokCount = 0;
  for (const t of table) {
    for (let i = 0; i < (t.scrim ? 1 : 3); i++) {
      tokCount++;
      const list = t.mine.filter((s) => tokOf(t, s.rgba.a) === tokName(t, i));
      const maxA = list.length ? Math.max(...list.map((s) => Math.abs(s.rgba.a - t.c[i]))) : 0;
      const maxC = list.length ? Math.max(...list.map((s) => {
        const b4 = composite([s.rgba.r, s.rgba.g, s.rgba.b], s.rgba.a, DARK_BG);
        const af = composite(t.f.rgb, t.c[i], DARK_BG);
        return Math.max(Math.abs(b4[0] - af[0]), Math.abs(b4[1] - af[1]), Math.abs(b4[2] - af[2]));
      })) : 0;
      console.log('  ' + tokName(t, i).padEnd(24) + toArgb(t.f.rgb, t.c[i]) + '  α=' + t.c[i].toFixed(2) +
        String(list.length).padStart(5) + ' 处   最大Δα ' + maxA.toFixed(2) + '   最大Δ合成色 ' + String(maxC).padStart(3));
    }
  }
  console.log('令牌 ' + tokCount + ' 个；可令牌化 ' + table.reduce((a, t) => a + t.mine.length, 0) + ' 处；白名单 ' + whitelist.length + ' 处');
  const ranked = [];
  for (const t of table) for (const s of t.mine) {
    const i = t.scrim ? 0 : (s.rgba.a <= t.b1 ? 0 : (s.rgba.a <= t.b2 ? 1 : 2));
    const b4 = composite([s.rgba.r, s.rgba.g, s.rgba.b], s.rgba.a, DARK_BG);
    const af = composite(t.f.rgb, t.c[i], DARK_BG);
    ranked.push({ s, d: Math.max(...[0, 1, 2].map((k) => Math.abs(b4[k] - af[k]))), tok: tokOf(t, s.rgba.a) });
  }
  ranked.sort((a, b) => b.d - a.d);
  console.log('--- 观感变化最大的 12 处（Δ = 合成到暗底后的最大通道差，满值 255） ---');
  for (const r of ranked.slice(0, 12)) {
    console.log('  Δ' + String(r.d).padStart(3) + '  ' + r.s.short + ':' + r.s.ln + '  rgba(' + r.s.rgba.r + ',' + r.s.rgba.g + ',' + r.s.rgba.b + ',' + r.s.rgba.a + ') → ' + r.tok);
  }
  console.log('--- 跳过原因分布 ---');
  const wc = new Map();
  for (const w of whitelist) wc.set(w[1].replace(/rgba\(.*/, 'rgba(…)'), (wc.get(w[1].replace(/rgba\(.*/, 'rgba(…)')) || 0) + 1);
  for (const [k, v] of [...wc].sort((a, b) => b[1] - a[1])) console.log('  ' + String(v).padStart(3) + ' × ' + k);
  process.exit(0);
}

/* ===== 写入令牌 ===== */
const newTokens = [];
for (const t of table) for (let i = 0; i < (t.scrim ? 1 : 3); i++) newTokens.push({ name: tokName(t, i), value: toArgb(t.f.rgb, t.c[i]) });
for (const theme of ['base', 'dark']) {
  const p = path.join(RES, theme, 'element/color.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf-8'));
  for (const nt of newTokens) {
    const ex = j.color.find((c) => c.name === nt.name);
    if (ex) ex.value = nt.value; else j.color.push({ name: nt.name, value: nt.value });
  }
  j.color.sort((a, b) => (a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)));
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n', 'utf-8');
}
console.log('已写入令牌 ' + newTokens.length + ' 个 → base + dark 各一份');
for (const nt of newTokens) console.log('  ' + nt.name.padEnd(24) + nt.value);

/* ===== 替换 .ets ===== */
let files = 0, n = 0;
const perFile = [];
for (const f of walk(ETS)) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const short = rel.replace('APP/LiurenFocusDiviner/entry/src/main/ets/', '');
  if (EXCLUDE.some((x) => rel.indexOf(x) >= 0)) continue;
  const raw = fs.readFileSync(f, 'utf-8');
  const eol = raw.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/);
  let ctx = '', touched = false, cnt = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const full = ctx + line, off = ctx.length;
    ctx = (ctx + line + '\n').slice(-BACK);
    if (!/rgba?\(/i.test(line)) continue;
    if (/linearGradient|colors:\s*\[/.test(line) || line.indexOf('`') >= 0) continue;
    const unsafe = /style=|<\/?[a-zA-Z]/.test(line) || /['"]\s*\+\s*['"]|\+\s*['"]#/.test(line);
    if (unsafe) continue;
    LIT.lastIndex = 0; let m;
    const spots = [];
    while ((m = LIT.exec(line)) !== null) {
      const lit = m[2];
      if (!/^rgba?\(/i.test(lit)) continue;
      const rgba = parseRgba(lit);
      if (!rgba) continue;
      const abs = off + m.index;
      const callee = enclosingCall(full, abs);
      if (!API_OK.has(callee) && !ternarySibling(full, abs)) continue;
      if (val2tok.has(rgba2argb(lit))) continue;
      const tok = litMap.get(litKey(rgba));
      if (!tok) continue;
      spots.push({ idx: m.index, len: m[0].length, tok });
    }
    let out = line;
    for (let k = spots.length - 1; k >= 0; k--) {
      out = out.slice(0, spots[k].idx) + '$r(\'app.color.' + spots[k].tok + '\')' + out.slice(spots[k].idx + spots[k].len);
      n++; cnt++;
    }
    if (out !== line) { lines[i] = out; touched = true; }
  }
  if (touched) { fs.writeFileSync(f, lines.join(eol), 'utf-8'); files++; perFile.push(short + ' ' + cnt + ' 处'); }
}
console.log('替换 .ets：' + files + ' 个文件 ' + n + ' 处');
console.log('改动最多的文件：' + perFile.slice(0, 10).join(' ｜ '));

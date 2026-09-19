/* ============================================================================
 * panlayer_contrast.js —— 天地盘（Canvas）逐层取色对比度 / 层间可分辨性【报告】
 * ----------------------------------------------------------------------------
 * 为什么单独一个工具：`contrast_audit.js` 只扫声明式 UI 的 `fontColor(...)`；而天地盘是
 *   Canvas 绘制（`ctx.fillStyle = tok(res, '令牌名')`）——**整块盘面不在它的扫描面内**。
 *   于是"每层对底色够不够"与"同宫四层彼此分得开吗"这两件事，此前**一次都没被量过**
 *   （Agent.md §11 B 类第 1 条就是它）。
 *
 * 本工具**只报告、不判否**（退出码恒 0）。理由：层间"彼此可分辨"的阈值是产品口径
 *   （WCAG 只定义"文字对底色"，没有定义"层与层"），尚未拍板；拍板后再加判据、注册进
 *   `check_all.js`，并**必须补变异验证** —— 否则就是又一道永远为绿的假门禁（§3.3 第 1/4 条）。
 *
 * 用法：
 *   node _tools/panlayer_contrast.js                       # 双主题
 *   node _tools/panlayer_contrast.js --theme base          # 只看浅色
 *   node _tools/panlayer_contrast.js --json                # 机器可读
 *
 * 口径（三条都是踩过的）：
 *   · **必须解析局部别名**：绘制代码里 `const goldBright = tok(res,'brand_gold_bright')` 之后
 *     用的是变量名，只认 `tok(...)` 会漏掉一半层色（第一版就漏了：天盘支看起来没有亮金、天将没有朱砂）。
 *   · 只把 `ctx.fillStyle/strokeStyle = …` 当站点；`const X = tok(...)` 是**别名定义**，不是站点。
 *   · 底色取"盘面可能落在的候选底色"（pan_core / ink_bg / ink_card / ink_surface），按**最差**那个报；
 *     半透明令牌先合成到底色再算（与 contrast_audit.js 同口径）。
 *   · 层归属按绘制代码里的**层注释**（以层名开头的那种）判定；归不上层的站点单独计数，不静默丢弃。
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAN = path.join(ROOT, 'APP/LiurenFocusDiviner/entry/src/main/ets/components/PanDisk.ets');
const RES = path.join(ROOT, 'APP/LiurenFocusDiviner/entry/src/main/resources');

/* 层名（注释以这些词开头即认定为"层注释"；顺序即优先级） */
const LAYER_KEYS = [
  ['天将', '天将'],
  ['天盘支', '天盘支'],
  ['遁干', '遁干'],
  ['地盘十二支', '地盘支'],
  ['地盘支', '地盘支'],
  ['中黄标记', '中黄标记'],
  ['辅助层', '辅助层'],
  ['抓用神', '用神高亮'],
];
/* 同宫四层（"由外到内"的传统层次），层间可分辨性只在这四层之间谈 */
const MAIN_LAYERS = ['天将', '天盘支', '遁干', '地盘支'];
/* 盘面可能落在的候选底色（取其最差） */
const BG_CANDIDATES = ['pan_core', 'ink_bg', 'ink_card', 'ink_surface'];

function loadTokens(theme) {
  const p = path.join(RES, theme, 'element', 'color.json');
  const m = new Map();
  for (const t of JSON.parse(fs.readFileSync(p, 'utf-8')).color) m.set(t.name, String(t.value).toUpperCase());
  return m;
}
const TOKENS = { dark: loadTokens('dark'), base: loadTokens('base') };

/* ---------- WCAG 2.1 相对亮度 ---------- */
function parseColor(s) {
  const v = String(s).trim();
  let m = v.match(/^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{6})$/);   /* 8 位 ARGB（令牌的半透明写法）*/
  if (m) return { r: parseInt(m[2].substr(0, 2), 16), g: parseInt(m[2].substr(2, 2), 16), b: parseInt(m[2].substr(4, 2), 16), a: parseInt(m[1], 16) / 255 };
  m = v.match(/^#([0-9A-Fa-f]{6})$/);
  if (m) return { r: parseInt(m[1].substr(0, 2), 16), g: parseInt(m[1].substr(2, 2), 16), b: parseInt(m[1].substr(4, 2), 16), a: 1 };
  m = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  return null;
}
function composite(fg, bg) {
  const a = fg.a === undefined ? 1 : fg.a;
  return { r: Math.round(fg.r * a + bg.r * (1 - a)), g: Math.round(fg.g * a + bg.g * (1 - a)), b: Math.round(fg.b * a + bg.b * (1 - a)), a: 1 };
}
function lum(c) {
  const f = (x) => { const v = x / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}
function contrast(a, b) {
  const la = lum(a), lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
const hex = (c) => '#' + [c.r, c.g, c.b].map((x) => x.toString(16).toUpperCase().padStart(2, '0')).join('');

/* ---------- 解析 PanDisk.ets ---------- */
/** 局部别名：`const gold = tok(res, 'brand_gold');` → gold → brand_gold */
function aliasMap(lines) {
  const m = new Map();
  const re = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::\s*[^=]+)?=\s*tok\(\s*res\s*,\s*'([A-Za-z0-9_]+)'\s*\)/;
  for (const l of lines) {
    const x = l.match(re);
    if (x && !m.has(x[1])) m.set(x[1], x[2]);
  }
  return m;
}

function sitesIn(file) {
  const lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/);
  const aliases = aliasMap(lines);
  const out = [];
  const unresolved = [];
  let layer = '（未归类）';
  let buf = null;      /* 块注释缓冲：只认"以层名开头"的注释 */
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (buf === null && line.indexOf('/*') >= 0) buf = line.slice(line.indexOf('/*') + 2);
    else if (buf !== null) buf += ' ' + line;
    if (buf !== null && line.indexOf('*/') >= 0) {
      const text = buf.slice(0, buf.indexOf('*/')).replace(/^\s+/, '');
      for (const [key, name] of LAYER_KEYS) {
        if (text.indexOf(key) === 0) { layer = name; break; }
      }
      buf = null;
    }
    const isFill = line.indexOf('ctx.fillStyle') >= 0;
    const isStroke = !isFill && line.indexOf('ctx.strokeStyle') >= 0;
    if (!isFill && !isStroke) continue;          /* 别名定义行不是站点 */
    const prop = isFill ? 'fill' : 'stroke';
    const rhs = line.slice(line.indexOf('=', line.indexOf('Style')) + 1);
    const q = rhs.indexOf('?');
    const colon = q >= 0 ? rhs.indexOf(':', q) : -1;
    const cond = q >= 0 ? rhs.slice(0, q).trim().replace(/^\(|\)$/g, '') : '';
    const found = [];
    const reTok = /tok\(\s*res\s*,\s*'([A-Za-z0-9_]+)'\s*\)/g;
    let m;
    while ((m = reTok.exec(rhs)) !== null) found.push({ idx: m.index, token: m[1], via: '' });
    for (const [name, token] of aliases) {
      const reA = new RegExp('(?<![\\w$.])' + name + '(?![\\w$])', 'g');
      let a;
      while ((a = reA.exec(rhs)) !== null) found.push({ idx: a.index, token, via: name });
    }
    if (!found.length) { unresolved.push(i + 1); continue; }
    found.sort((a, b) => a.idx - b.idx);
    for (const f of found) {
      const branch = (q < 0 || colon < 0) ? '直接' : (f.idx > q && f.idx < colon ? '条件真' : (f.idx > colon ? '条件假' : '条件式'));
      out.push({ line: i + 1, token: f.token, via: f.via, layer, branch, cond, prop });
    }
  }
  return { sites: out, unresolved, aliases };
}

const parsed = sitesIn(PAN);
const sites = parsed.sites;
const themeArg = (() => { const i = process.argv.indexOf('--theme'); return i >= 0 ? process.argv[i + 1] : null; })();
const THEMES = themeArg ? [themeArg] : ['dark', 'base'];
const asJson = process.argv.includes('--json');

const mark = {};     /* 每站点的双主题取值 */
const bgWorst = {};
for (const theme of THEMES) {
  const T = TOKENS[theme];
  const bgs = BG_CANDIDATES.filter((n) => T.has(n)).map((n) => ({ token: n, c: parseColor(T.get(n)) })).filter((x) => x.c);
  if (!bgs.length) continue;
  const brightest = bgs.reduce((a, b) => (lum(a.c) > lum(b.c) ? a : b));
  bgWorst[theme] = { token: brightest.token, hex: hex(brightest.c) };
  for (const s of sites) {
    const raw = T.get(s.token);
    const key = s.line + '|' + s.branch + '|' + s.token;
    if (!mark[key]) mark[key] = {};
    if (!raw) { mark[key][theme] = { missing: true }; continue; }
    const fg = parseColor(raw);
    let worst = null;
    for (const bg of bgs) {
      const f = fg.a < 1 ? composite(fg, bg.c) : fg;
      const r = contrast(f, bg.c);
      if (!worst || r < worst.r) worst = { r, bg: bg.token };
    }
    mark[key][theme] = { hex: hex(fg), a: fg.a, contrast: worst.r, bg: worst.bg };
  }
}

if (asJson) {
  console.log(JSON.stringify({
    file: path.relative(ROOT, PAN).replace(/\\/g, '/'),
    aliases: [...parsed.aliases.entries()],
    bgWorst,
    unresolvedLines: parsed.unresolved,
    sites: sites.map((s) => Object.assign({}, s, { val: mark[s.line + '|' + s.branch + '|' + s.token] || {} }))
  }, null, 2));
  process.exit(0);
}

/* ---------- 报告 ---------- */
console.log('=== 天地盘（Canvas）逐层取色报告 —— 只报告，不判否（层间阈值待拍板） ===');
console.log('扫描面：' + path.relative(ROOT, PAN).replace(/\\/g, '/') + '（ctx.fillStyle / strokeStyle = tok(res, 令牌名)）');
console.log('别名：' + (parsed.aliases.size ? [...parsed.aliases.entries()].map(([k, v]) => k + '→' + v).join('  ') : '（无）'));
console.log('站点：' + sites.length + ' 处（fill ' + sites.filter((s) => s.prop === 'fill').length
  + ' / stroke ' + sites.filter((s) => s.prop === 'stroke').length + '）'
  + '；未归层 ' + sites.filter((s) => s.layer === '（未归类）').length + ' 处'
  + '；无色的 Style 行 ' + parsed.unresolved.length + ' 处'
  + (parsed.unresolved.length ? '（行 ' + parsed.unresolved.join(',') + '）' : ''));
for (const t of THEMES) if (bgWorst[t]) console.log('主题 ' + t + '：候选底色取最亮者 ' + bgWorst[t].token + ' = ' + bgWorst[t].hex + '（其上对比度最不利）');

const byLayer = new Map();
for (const s of sites) {
  if (!byLayer.has(s.layer)) byLayer.set(s.layer, []);
  byLayer.get(s.layer).push(s);
}

console.log('\n【每层对底色】（同一层同名令牌只列一次；"条件"栏是它所在三元判的是什么）');
const seen = new Set();
const rows = [];
for (const [layer, list] of byLayer) {
  for (const s of list) {
    const k = layer + '|' + s.token + '|' + s.branch;
    if (seen.has(k)) continue;
    seen.add(k);
    rows.push({ layer, branch: s.branch, cond: s.cond, token: s.token, prop: s.prop, val: mark[s.line + '|' + s.branch + '|' + s.token] || {} });
  }
}
for (const r of rows) {
  const cond = r.branch === '直接' ? '直接' : r.branch + (r.cond ? '：' + r.cond.slice(0, 22) : '');
  let line = '  ' + r.layer.padEnd(8) + cond.padEnd(28) + r.token.padEnd(20);
  for (const t of THEMES) {
    const m = r.val[t] || {};
    if (m.missing) { line += '✗缺令牌'.padEnd(11) + '—'.padEnd(9); continue; }
    line += (m.hex + (m.a < 1 ? 'α' + m.a.toFixed(2) : '')).padEnd(11) + (m.contrast.toFixed(2) + ':1').padEnd(9);
  }
  line += (r.prop === 'stroke' ? '  （描边/结构线）' : '');
  console.log(line);
}

const allTokensOf = (L) => [...new Set((byLayer.get(L) || []).filter((s) => s.prop === 'fill').map((s) => s.token))];

console.log('\n【同宫四层彼此可分辨吗】（四层的 fill 令牌两两比；单元格 = dark / base 色差对比度）');
console.log('  层 → fill 令牌集：' + MAIN_LAYERS.map((L) => L + '=' + (allTokensOf(L).join('|') || '（无）')).join('   '));
const pairRows = [];
for (let i = 0; i < MAIN_LAYERS.length; i++) {
  for (let j = i + 1; j < MAIN_LAYERS.length; j++) {
    for (const t1 of allTokensOf(MAIN_LAYERS[i])) {
      for (const t2 of allTokensOf(MAIN_LAYERS[j])) {
        const cell = {};
        for (const theme of THEMES) {
          const T = TOKENS[theme];
          if (!T.has(t1) || !T.has(t2) || !bgWorst[theme]) continue;
          const bg = parseColor(T.get(bgWorst[theme].token));
          const c1 = parseColor(T.get(t1)), c2 = parseColor(T.get(t2));
          const f1 = c1.a < 1 ? composite(c1, bg) : c1;
          const f2 = c2.a < 1 ? composite(c2, bg) : c2;
          cell[theme] = { r: contrast(f1, f2), same: t1 === t2 };
        }
        pairRows.push({ a: MAIN_LAYERS[i], b: MAIN_LAYERS[j], t1, t2, cell });
      }
    }
  }
}
pairRows.sort((x, y) => (x.cell[THEMES[0]] ? x.cell[THEMES[0]].r : 99) - (y.cell[THEMES[0]] ? y.cell[THEMES[0]].r : 99));
for (const p of pairRows.filter((x) => THEMES.some((t) => x.cell[t] && x.cell[t].r < 2.0))) {
  const cells = THEMES.map((t) => (p.cell[t] ? p.cell[t].r.toFixed(2) + ':1' : '—')).join('  ');
  const same = THEMES.some((t) => p.cell[t] && p.cell[t].same) ? '   ← 同一令牌（颜色完全相同）' : '';
  console.log('  ' + (p.a + '(' + p.t1 + ')').padEnd(26) + ' vs ' + (p.b + '(' + p.t2 + ')').padEnd(26) + cells + same);
}
const low = pairRows.filter((p) => THEMES.some((t) => p.cell[t] && p.cell[t].r < 1.5));
console.log('  合计 ' + pairRows.length + ' 对；其中至少一个主题 <1.5:1 的 ' + low.length + ' 对'
  + '（颜色这条轴几乎不出力 —— 实际区分靠**半径位置 + 字号**）');
console.log('  各层半径/字号（PanDisk 源码）：天将 0.412w/0.048 · 天盘支 0.335w/0.06 · 遁干 0.255w/0.044 · 地盘支 0.165w/0.068');

console.log('\n【候选判据（待拍板；定了才写进门禁并补变异验证）】');
console.log('  A. 每层对底色：正文口径 ≥4.5:1、图标/大字口径 ≥3:1 —— 现状是否全部达标见上表；');
console.log('  B. 同宫相邻层"彼此可分辨"至少满足其一：①色差 ≥ 阈值（建议 1.5:1 或 2:1）②半径不同 ③字号不同；');
console.log('  C. 状态态不得与常态同色（"旬空降暗"若与常态同令牌，则它在颜色轴上等于没降）。');
console.log('\n  ⚠ 本工具不判否：改色/加令牌会改包（1.0.5 正在审核），故先出报告、不动颜色。');
process.exit(0);

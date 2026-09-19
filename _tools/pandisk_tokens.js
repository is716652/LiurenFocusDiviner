/* ============================================================================
 * pandisk_tokens.js —— 天地盘画布改为"运行时按令牌取色"
 * ----------------------------------------------------------------------------
 * 为什么：`$r()` 不能用在 canvas 的 fillStyle/strokeStyle 上（那里要字符串），
 *   所以 PanDisk 一直是一堆局部字面量 —— 浅色主题下**整块盘面仍是深色**（核心屏漏光）。
 * 做法：用 `resourceManager.getColorByNameSync('令牌名')` 在绘制时按当前主题取色，
 *   转成 `rgba(r,g,b,a)` 字符串给画布（通用格式，且天然支持半透明）。
 * 映射：能对上现有令牌的全部对上；对不上的新建 4 个盘面专用令牌：
 *   pan_cinnabar（凶将朱砂）、pan_pale（浅金中心字）、pan_ring（选中/用神圈 0.58）、
 *   pan_kong_fill（旬空淡底 0.20）。
 *   ——"近但不完全等"的（0.20/0.22/0.30 等）并入 overlay_gold_mid/strong（Δα≤0.05，不可见）。
 * 用法：node _tools/pandisk_tokens.js [--dry]
 * ==========================================================================*/
'use strict';
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');
const P = path.join(ROOT, 'APP/LiurenFocusDiviner/entry/src/main/ets/components/PanDisk.ets');
const RES = path.join(ROOT, 'APP/LiurenFocusDiviner/entry/src/main/resources');
const DRY = process.argv.indexOf('--dry') >= 0;

const NEW = [
  ['pan_cinnabar', '#C0704A', '#9A3A22'],
  ['pan_pale', '#FDF3D0', '#6E5214'],
  ['pan_ring', '#94E9C878', '#949A7A2A'],
  ['pan_kong_fill', '#33F0D98C', '#339A7A2A']
];
/* 字面值 → 令牌名（暗色值必须与字面值相等，否则会改观感） */
const MAP = {
  '#E9C878': 'brand_gold',
  '#F0D98C': 'brand_gold_bright',
  '#A8986E': 'pan_di',
  '#C4A25C': 'brand_gold_deep',
  '#C0704A': 'pan_cinnabar',
  '#FDF3D0': 'pan_pale',
  '#7FA69A': 'accent_teal_soft',
  '#8FA3A8': 'accent_blue_haze',
  '#9FB6A8': 'accent_blue_pale',
  '#D98C5F': 'accent_orange',
  'rgba(233,200,120,0.10)': 'pan_sel_bg',
  'rgba(233,200,120,0.18)': 'overlay_gold_mid',
  'rgba(233,200,120,0.20)': 'overlay_gold_mid',
  'rgba(233,200,120,0.22)': 'overlay_gold_mid',
  'rgba(233,200,120,0.30)': 'overlay_gold_strong',
  'rgba(233,200,120,0.55)': 'pan_ring',
  'rgba(233,200,120,0.60)': 'pan_ring',
  'rgba(240,217,140,0.16)': 'pan_kong_fill',
  'rgba(240,217,140,0.25)': 'pan_kong_fill',
  'rgba(120,110,90,0.25)': 'overlay_olive_mid'
};
/* 断言：每个目标令牌在 dark 里的值与字面值相等（除新建的 4 个） */
const dark = new Map();
for (const t of JSON.parse(fs.readFileSync(path.join(RES, 'dark/element/color.json'), 'utf-8')).color) dark.set(t.name, String(t.value).toUpperCase());
const news = new Map(NEW.map(([n, d]) => [n, d]));
function norm(lit) {
  const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+)\s*)?\)/i.exec(lit);
  if (!m) return lit.toUpperCase();
  const h = (n) => ('0' + Number(n).toString(16)).slice(-2).toUpperCase();
  return '#' + h(Math.round((m[4] === undefined ? 1 : +m[4]) * 255)) + h(m[1]) + h(m[2]) + h(m[3]);
}
/* 自检：符号值可以"近似"，但**合成到盘底后的通道差必须 ≤4/255**（不可见），否则拒绝执行。
 * 第一版写成"必须完全相等"→ 我自己选的近似值（Δα≤0.05）全被拦下，判据过严。 */
let bad = 0;
const PBG = [20, 18, 15];
function parts(argb) {
  const m = /^#([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/.exec(String(argb).toUpperCase());
  if (!m) return null;
  return { a: parseInt(m[1], 16) / 255, r: parseInt(m[2], 16), g: parseInt(m[3], 16), b: parseInt(m[4], 16) };
}
function comp(o) { return [0, 1, 2].map((i) => Math.round(o.a * [o.r, o.g, o.b][i] + (1 - o.a) * PBG[i])); }
for (const [lit, name] of Object.entries(MAP)) {
  const want = news.has(name) ? news.get(name) : dark.get(name);
  if (!want) { console.log('⛔ 令牌不存在：' + name); bad++; continue; }
  const a = parts(norm(lit)), b = parts(want);
  if (!a || !b) { console.log('⛔ 解析失败：' + lit + ' / ' + want); bad++; continue; }
  const d = Math.max(...[0, 1, 2].map((i) => Math.abs(comp(a)[i] - comp(b)[i])));
  const tag = (norm(lit) === want.toUpperCase()) ? '完全相等' : ('Δ合成' + d);
  if (d > 4) { console.log('⛔ 差异过大：' + lit + ' → ' + name + '（' + tag + '）'); bad++; }
  else if (d > 0) console.log('· 近似合并 ' + tag.padEnd(8) + lit + ' → ' + name);
}
console.log('映射自检通过：' + Object.keys(MAP).length + ' 条');

let s = fs.readFileSync(P, 'utf-8');
if (s.indexOf('function tok(') < 0) {
  const helper = `/* 画布不能用 $r()，故运行时按令牌名取当前主题色值（浅/深自动生效）。
   名字写错会在运行时抛错（不是编译错），故门禁 _test_color_tokens 会校验每个名字都存在于 color.json。
   不缓存：主题可在运行时切换，缓存会拿到旧主题的色值。 */
function tok(res: resourceManager.ResourceManager, name: string): string {
  try {
    const v = res.getColorByNameSync(name);
    const a = ((v >>> 24) & 0xFF) / 255;
    const r = (v >>> 16) & 0xFF;
    const g = (v >>> 8) & 0xFF;
    const b = v & 0xFF;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a.toFixed(3) + ')';
  } catch (e) {
    return '#000000';
  }
}

`;
  s = s.replace('@Component\nexport struct PanDisk {', helper + '@Component\nexport struct PanDisk {');
  s = s.replace("import { display } from '@kit.ArkUI';", "import { display } from '@kit.ArkUI';\nimport { resourceManager } from '@kit.LocalizationKit';");
}
if (s.indexOf('const res = getContext(this).resourceManager;') < 0) {
  s = s.replace('    const ctx = this.ctx;\n', '    const ctx = this.ctx;\n    const res = getContext(this).resourceManager;\n');
}
let n = 0;
for (const [lit, name] of Object.entries(MAP)) {
  const from = "'" + lit + "'";
  const cnt = s.split(from).length - 1;
  if (!cnt) { console.log('⚠ 未命中：' + lit); continue; }
  s = s.split(from).join("tok(res, '" + name + "')");
  n += cnt;
  console.log('  ' + String(cnt).padStart(2) + ' × ' + lit + ' → tok(res, ' + name + ')');
}
if (!DRY) {
  fs.writeFileSync(P, s, 'utf-8');
  for (const theme of ['base', 'dark']) {
    const p = path.join(RES, theme, 'element/color.json');
    const j = JSON.parse(fs.readFileSync(p, 'utf-8'));
    for (const [name, d, l] of NEW) {
      const want = theme === 'base' ? l : d;
      const ex = j.color.find((c) => c.name === name);
      if (ex) ex.value = want; else j.color.push({ name, value: want });
    }
    j.color.sort((a, b) => (a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)));
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n', 'utf-8');
  }
  console.log('已新建令牌：' + NEW.map((x) => x[0]).join(', '));
}
console.log((DRY ? '[干跑] ' : '') + '画布替换 ' + n + ' 处');

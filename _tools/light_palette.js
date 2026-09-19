/* ⚠ 一次性迁移脚本（已执行完毕）。**调色板真源是 resources/{base,dark}/element/color.json 本身**，
   不要以本脚本为真源，也不要在日常改色时改这里 —— 它的作用是留下"这批令牌当初怎么来的"记录。
   现状由门禁保证：_tests/_test_color_tokens.js（令牌表对齐 / 未登记色值 / 运行时取色名 / 死令牌）。 */
/* ============================================================================
 * light_palette.js —— 把浅色值写入 base/element/color.json（方案 A 偏金黄）
 * ----------------------------------------------------------------------------
 * 设计原则（按令牌**角色**给值，不是按名字猜）：
 *   ① 前景/文字类：深色主题里是"亮字"，浅色主题里必须**加深**才能压住浅底
 *      （金系尤其明显：#F0D98C 放白底上 1.2:1，必须压到 #7A5C18 级）
 *   ② 底色类：变浅（#14120F→#F2F0EB 等）
 *   ③ 填充类（gold fill，上面压深字）：**保持亮金**，两主题一致 —— 这是角色拆分换来的
 *   ④ 遮罩类：深色主题的"暗遮罩"在浅色主题必须变成"亮遮罩"，否则浅底上出现黑块
 *   ⑤ "金上的深字"（ink_page / ink_on_gold_text）两主题都必须保持深 → 主题无关
 * 只改 base 的值、不动令牌名，故 base/dark 仍然对齐（门禁规则①）。
 * 用法：node _tools/light_palette.js [--dry]
 * ==========================================================================*/
'use strict';
const fs = require('fs'); const path = require('path');
const P = path.join(__dirname, '..', 'APP/LiurenFocusDiviner/entry/src/main/resources/base/element/color.json');
const DRY = process.argv.includes('--dry');

/* 浅色值表（键 = 令牌名；未列出的令牌保持原值不动，例如填充类与"金上深字"） */
const LIGHT = {
  /* ① 前景 / 文字 */
  ink_text: '#1A1410',
  ink_text_bright: '#14100C',
  ink_text_body: '#3A332A',
  ink_text_muted: '#5A5145',
  ink_text_secondary: '#6B6152',
  ink_text_source: '#6E6446',
  state_warn_text: '#9A3A22',
  brand_gold: '#7E5F1A',
  brand_gold_bright: '#6E5214',
  brand_gold_deep: '#6E5214',
  brand_cinnabar: '#9A3A22',
  brand_verdigris: '#3F6F63',
  brand_porcelain: '#33556F',
  pan_tian: '#7A5C18',
  pan_di: '#6B6152',
  pan_jiang: '#5A5145',
  pan_ss: '#7E7565',
  pan_sel: '#7A5C18',
  pan_kong: '#9A3A22',
  /* ② 底色 */
  ink_bg: '#F2F0EB',
  ink_card: '#FBFAF7',
  ink_surface: '#FBFAF7',
  pan_bg: '#FBFAF7',
  pan_cell: '#FFFFFF',
  pan_core: '#F2F0EB',
  start_window_background: '#F2F0EB',
  /* ③ 线 / 分隔 */
  ink_divider: '#DED8CB',
  ink_hairline: '#C9C2B4',
  /* ④ 半透明覆盖（浅色下换"深颜料 + 相近 alpha"，否则浅底上几乎看不见） */
  overlay_gold_weak: '#2E7A5C18',
  overlay_gold_mid: '#477A5C18',
  overlay_gold_strong: '#8C6E5214',
  overlay_olive_weak: '#1F6B6152',
  overlay_olive_mid: '#336B6152',
  overlay_olive_strong: '#806B6152',
  overlay_ink_scrim: '#CCF2F0EB',
  overlay_cinnabar_weak: '#149A3A22',
  overlay_cinnabar_mid: '#479A3A22',
  overlay_cinnabar_strong: '#599A3A22',
  overlay_teal_weak: '#143F6F63',
  overlay_teal_mid: '#333F6F63',
  overlay_teal_strong: '#383F6F63',
  /* ⑤ 选中宫淡底 */
  pan_sel_bg: '#1F8A6A1E'
  /* 故意不动：accent_gold_fill / accent_gold_fill_bright（亮金填充，配深字，两主题一致）
   *           ink_page / ink_on_gold_text（金上的深字，两主题都必须深） */
};

const j = JSON.parse(fs.readFileSync(P, 'utf-8'));
const names = new Set(j.color.map((c) => c.name));
let n = 0;
const missing = [];
for (const [name, value] of Object.entries(LIGHT)) {
  if (!names.has(name)) { missing.push(name); continue; }
  const c = j.color.find((x) => x.name === name);
  if (c.value === value) continue;
  if (DRY) console.log('  ' + name.padEnd(24) + c.value + ' → ' + value);
  c.value = value; n++;
}
if (missing.length) { console.log('⛔ 表里有令牌名不存在：' + missing.join(', ')); process.exit(3); }
if (!DRY) fs.writeFileSync(P, JSON.stringify(j, null, 2) + '\n', 'utf-8');
console.log((DRY ? '[干跑] ' : '') + '浅色值写入 ' + n + ' 个令牌；未列出的保持原值（共 ' + j.color.length + ' 个）');

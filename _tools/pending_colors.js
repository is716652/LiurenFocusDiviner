/* ============================================================================
 * pending_colors.js —— 为"待定"低频色值建令牌（深色值=现值，浅色值按角色设计）
 * ----------------------------------------------------------------------------
 * 为什么必须建：这些值没有令牌 ⇒ 拿不到浅色值 ⇒ 浅色主题下仍是深色主题的亮色，
 * 实测就是对比度 1.4–2.5:1 的违规（对比度门禁逐条列出）。
 * 用户此前的取舍是"保留 13 个半透明令牌、不逐值拆"；这批是不透明低频色，
 * 并入最近令牌会造成 Δ11–49 的可见偏色，故按"每个值一个语义令牌"处理：
 *   · 深色值 = 现值 ⇒ **深色主题零观感变化**
 *   · 浅色值按角色给：文字类加深、填充类保持亮色、纸面/金上深字保持深（主题无关）
 * 用法：node _tools/pending_colors.js [--dry]
 * ==========================================================================*/
'use strict';
const fs = require('fs'); const path = require('path');
const RES = path.join(__dirname, '..', 'APP/LiurenFocusDiviner/entry/src/main/resources');
const DRY = process.argv.includes('--dry');
/* [令牌名, 深色值(=现值), 浅色值] */
const TABLE = [
  ['accent_teal_soft', '#7FA69A', '#3F6F63'],      /* 青绿文字（draft/提示） */
  ['accent_verdant', '#8FA88C', '#3F6F63'],        /* 吉绿文字 */
  ['accent_verdant_deep', '#33705E', '#3F6F63'],   /* 案卷占类色（绿） */
  ['accent_blue_grey', '#8A9BA8', '#33556F'],      /* 灰青文字 */
  ['accent_blue_haze', '#8FA3A8', '#33556F'],      /* 灰青文字（另一档） */
  ['accent_blue_pale', '#9FB6A8', '#33556F'],      /* 浅青灰文字 */
  ['accent_blue_deep', '#3E5C76', '#33556F'],      /* 案卷占类色（青） */
  ['accent_brown', '#8A5A2B', '#7A5C18'],          /* 案卷占类色（褐） */
  ['accent_orange', '#D98C5F', '#9A3A22'],         /* 橘（凶相文字） */
  ['accent_gold_soft', '#E8C46A', '#6E5214'],      /* 亮金文字（吉相） */
  ['accent_gold_amber', '#D9A94E', '#7A5C18'],     /* 深金（金卡描边/文字） */
  ['accent_gold_line', '#4A3A18', '#7A5C18'],      /* 暗金细线 */
  ['ink_text_paper', '#D8CBA8', '#3A332A'],        /* 米白文字 */
  ['ink_text_olive', '#9A8C6E', '#6B6152'],        /* 橄榄灰文字 */
  ['overlay_gold_solid', '#D9F0D98C', '#D9F0D98C'],/* 近不透明金实心填充（两主题一致） */
  ['overlay_cinnabar_edge', '#8CD0704A', '#8C9A3A22'] /* 朱色描边 0.55（浅色下更深） */
];
let added = 0, updated = 0;
for (const theme of ['base', 'dark']) {
  const p = path.join(RES, theme, 'element/color.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf-8'));
  for (const [name, dark, light] of TABLE) {
    const want = theme === 'base' ? light : dark;
    const ex = j.color.find((c) => c.name === name);
    if (ex) { if (ex.value !== want) { ex.value = want; updated++; } }
    else { j.color.push({ name, value: want }); added++; }
  }
  j.color.sort((a, b) => (a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)));
  if (!DRY) fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n', 'utf-8');
  console.log(theme + ' → 共 ' + j.color.length + ' 个令牌');
}
console.log((DRY ? '[干跑] ' : '') + '新增 ' + added + ' 条、改值 ' + updated + ' 条（表内 ' + TABLE.length + ' 个令牌）');

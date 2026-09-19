/* ============================================================================
 * case_palette.js —— 案卷页（AncientCaseGallery）"案卷纸/分类色"令牌
 * ----------------------------------------------------------------------------
 * 这批值一直没令牌，是因为它们在 routeColor/roleColor 这类**返回 ResourceColor 的函数**里
 * （tokenize_colors.js 原先缺"证法 C"判定，现已补上）。
 * 设计取态：案卷页在深色主题里本来就用**浅色纸面区块**（纸色卡 + 深字），
 * 所以这批"案卷色"属于**主题无关**的一层 —— 两主题同值，纸面永远是纸面。
 * 唯一的例外：#E08A7A 当文字用在浅粉底上（实测浅色主题 2.14:1），故浅色值加深为 #9A3A22。
 * 用法：node _tools/case_palette.js [--dry]
 * ==========================================================================*/
'use strict';
const fs = require('fs'); const path = require('path');
const RES = path.join(__dirname, '..', 'APP/LiurenFocusDiviner/entry/src/main/resources');
const DRY = process.argv.includes('--dry');
/* [令牌名, 深色值, 浅色值] —— 除注明者外两主题同值（主题无关的"案卷纸"层） */
const TABLE = [
  ['case_blue_deep', '#2F4A5F', '#2F4A5F'],           /* 案卷分类色（青，深底与青字共用） */
  ['case_red_deep', '#7A2E2E', '#7A2E2E'],            /* 案卷分类色（暗朱） */
  ['case_olive_deep', '#5A4F3D', '#5A4F3D'],          /* 案卷分类色（橄榄褐） */
  ['case_brown_deep', '#4A3F32', '#4A3F32'],          /* 案卷分类色（深褐，纸面文字） */
  ['case_red_soft', '#E08A7A', '#9A3A22'],            /* ⚠ 唯一需变浅色的：浅粉底上的文字 */
  ['case_snow', '#EEF3F6', '#EEF3F6'],                /* 雪白纸面 */
  ['case_transparent', '#00000000', '#00000000'],     /* 透明（渐变端点） */
  ['case_red_wash_08', '#14A63A2B', '#14A63A2B'],     /* 朱色淡底/描边 0.08 */
  ['case_red_wash_10', '#1AA63A2B', '#1AA63A2B'],     /* 0.10 */
  ['case_red_wash_15', '#26A63A2B', '#26A63A2B'],     /* 0.15 */
  ['case_red_wash_25', '#40A63A2B', '#40A63A2B'],     /* 0.25 */
  ['case_blue_wash_10', '#1A2F4A5F', '#1A2F4A5F'],    /* 青色淡底 0.10 */
  ['case_blue_wash_20', '#332F4A5F', '#332F4A5F'],    /* 0.20 */
  ['case_blue_haze_25', '#403E5C76', '#403E5C76'],    /* 灰青淡底 0.25 */
  ['case_darkred_wash_10', '#1A7A2E2E', '#1A7A2E2E']  /* 暗朱淡底 0.10 */
];
let added = 0;
for (const theme of ['base', 'dark']) {
  const p = path.join(RES, theme, 'element/color.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf-8'));
  for (const [name, dark, light] of TABLE) {
    const want = theme === 'base' ? light : dark;
    const ex = j.color.find((c) => c.name === name);
    if (ex) ex.value = want; else { j.color.push({ name, value: want }); added++; }
  }
  j.color.sort((a, b) => (a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)));
  if (!DRY) fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n', 'utf-8');
  console.log(theme + ' → 共 ' + j.color.length + ' 个令牌');
}
console.log((DRY ? '[干跑] ' : '') + '案卷色令牌 ' + TABLE.length + ' 个（新增 ' + added + '/主题）');

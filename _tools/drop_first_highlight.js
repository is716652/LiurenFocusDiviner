/* ============================================================================
 * drop_first_highlight.js —— 去掉"第一课/初传"的特殊背景（用户反馈：已无必要，且导致看不清）
 * ----------------------------------------------------------------------------
 * 用户反馈：初传与第一课的背景色与其它不同，导致**干支看不清**；当年是为了"第一眼看到"，现在没必要了。
 * 实测确认（我按 WCAG 算过）：
 *   干支颜色来自 Index.ets 的硬编码 `const color = 吉 ? '#E9C878' : '#D0704A'`（存进 ChuanRow.color: string）
 *   凶将朱砂 #D0704A 压普通卡（ink_surface #211E18）＝ 4.8:1（勉强过），
 *   但初传卡把底色换成金色淡底（合成 #453D29）→ 只剩 **3.1:1** ✗ 这就是"看不清"。
 * 改动：
 *   ① 去掉 highlight 的整块特殊样式（★、加粗、金色标题、金色淡底、加粗边框）→ 四课/三传统一外观
 *   ② 干支颜色改为**资源令牌**：吉 = brand_gold、凶 = brand_cinnabar（暗色值与原来完全相同 → 零观感变化），
 *      并把 ChuanRow.color / ChuanCard.color 的类型从 string 改为 ResourceColor（这样浅色主题才生效）
 * 用法：node _tools/drop_first_highlight.js [--dry]
 * ==========================================================================*/
'use strict';
const fs = require('fs'); const path = require('path');
const ETS = path.join(__dirname, '..', 'APP/LiurenFocusDiviner/entry/src/main/ets');
const DRY = process.argv.indexOf('--dry') >= 0;

/* 子串替换（与缩进无关，避免 CRLF/缩进差异导致漏改） */
const SUBS = [
  ['(this.highlight ? \'★ \' : \'\') + ', ''],
  ['.fontColor(this.highlight ? $r(\'app.color.brand_gold_bright\') : $r(\'app.color.ink_text_secondary\'))', '.fontColor($r(\'app.color.ink_text_secondary\'))'],
  ['.fontWeight(this.highlight ? FontWeight.Bold : FontWeight.Normal)', '.fontWeight(FontWeight.Normal)'],
  ['.backgroundColor(this.highlight ? $r(\'app.color.overlay_gold_mid\') : $r(\'app.color.ink_surface\'))', '.backgroundColor($r(\'app.color.ink_surface\'))'],
  ['.border({ width: this.highlight ? 1.5 : 1, color: this.highlight ? $r(\'app.color.brand_gold_bright\') : $r(\'app.color.overlay_gold_mid\') })',
   '.border({ width: 1, color: $r(\'app.color.overlay_gold_mid\') })']
];
function patch(rel, dropLines, subs) {
  const p = path.join(ETS, rel);
  let lines = fs.readFileSync(p, 'utf-8').split(/\r?\n/);
  const eol = fs.readFileSync(p, 'utf-8').indexOf('\r\n') >= 0 ? '\r\n' : '\n';
  let removed = 0, replaced = 0;
  lines = lines.filter((l) => {
    const hit = dropLines.some((d) => l.trim().startsWith(d));
    if (hit) removed++;
    return !hit;
  });
  let s = lines.join(eol);
  for (const [from, to] of subs) {
    const c = s.split(from).length - 1;
    if (c) { s = s.split(from).join(to); replaced += c; }
    else console.log('  ⚠ ' + rel + ' 未命中：' + from.slice(0, 50));
  }
  if (!DRY) fs.writeFileSync(p, s, 'utf-8');
  console.log('  ' + rel + '：删行 ' + removed + '、替换 ' + replaced);
}
console.log('① 三传卡 ChuanCard.ets');
patch('components/ChuanCard.ets', ['highlight=true：', '@Prop highlight: boolean = false;'], SUBS);
patch('components/ChuanCard.ets', [], [["@Prop color: string = '#E9C878';", "@Prop color: ResourceColor = $r('app.color.brand_gold');"]]);
console.log('② 四课卡 KegCard.ets');
patch('components/KegCard.ets', ['highlight=true：', '@Prop highlight: boolean = false;'], SUBS);
console.log('③ 排盘页 Index.ets');
let idx = fs.readFileSync(path.join(ETS, 'pages/Index.ets'), 'utf-8');
const eol = idx.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
let lines = idx.split(/\r?\n/);
let hit = 0;
for (let i = 0; i < lines.length; i++) {
  if (/^\s*color: string;\s*$/.test(lines[i])) { lines[i] = lines[i].replace('color: string;', 'color: ResourceColor;'); hit++; }
}
idx = lines.join(eol);
const oldColor = "const color = (LiurenCore.JIANG_JX[jiang] === '吉') ? '#E9C878' : '#D0704A';";
const newColor = "const color: ResourceColor = (LiurenCore.JIANG_JX[jiang] === '吉') ? $r('app.color.brand_gold') : $r('app.color.brand_cinnabar');";
if (idx.indexOf(oldColor) < 0) { console.log('  ⚠ 未找到干支颜色那行'); } else { idx = idx.split(oldColor).join(newColor); hit++; }
/* 调用点去掉 highlight: true（含独占一行的情况，顺带把上一行结尾的逗号去掉） */
let chuanHit = idx.split("mark: this.chuanRows()[0].mark, highlight: true })").length - 1;
idx = idx.split("mark: this.chuanRows()[0].mark, highlight: true })").join("mark: this.chuanRows()[0].mark })");
let kegHit = 0;
lines = idx.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === 'highlight: true })') {
    if (i > 0 && /,\s*$/.test(lines[i - 1])) lines[i - 1] = lines[i - 1].replace(/,\s*$/, '');
    lines.splice(i, 1); kegHit++; i--;
  }
}
idx = lines.join(eol);
if (!DRY) fs.writeFileSync(path.join(ETS, 'pages/Index.ets'), idx, 'utf-8');
console.log('  Index.ets：类型/颜色 ' + hit + ' 处、三传 highlight ' + chuanHit + ' 处、四课 highlight ' + kegHit + ' 处');
console.log(DRY ? '[干跑] 未写盘' : '完成');

/* 令牌角色审计：每个令牌被用在哪些属性位上（决定浅色值怎么给）
 * 关键判据：同一令牌同时当"底色"和"前景文字"用 = 角色冲突。
 *   底色类浅色值要变浅，前景文字类在浅色主题下往往要变深 —— 冲突就必须拆令牌。
 * 用法：node _tools/token_roles.js [--mixed]
 */
'use strict';
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');
const ETS = path.join(ROOT, 'APP/LiurenFocusDiviner/entry/src/main/ets');
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
const BG = new Set(['backgroundColor', 'pan_bg', 'background']);
const FG = new Set(['fontColor', 'color']);
const roles = new Map();
for (const f of walk(ETS)) {
  const short = path.relative(ROOT, f).replace(/\\/g, '/').replace('APP/LiurenFocusDiviner/entry/src/main/ets/', '');
  const text = fs.readFileSync(f, 'utf-8');
  const re = /\$r\('app\.color\.([A-Za-z0-9_]+)'\)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const tok = m[1];
    const attr = enclosingCall(text, m.index) || '(局部量/返回)';
    if (!roles.has(tok)) roles.set(tok, { tally: new Map(), files: new Set() });
    const r = roles.get(tok);
    r.tally.set(attr, (r.tally.get(attr) || 0) + 1);
    r.files.add(short);
  }
}
const onlyMixed = process.argv.includes('--mixed');
const rows = [...roles.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1);
console.log('令牌          底色  前景  边框  阴影  其他   判定');
const mixed = [];
for (const [tok, r] of rows) {
  const g = (k) => r.tally.get(k) || 0;
  const bg = g('backgroundColor'), fg = g('fontColor') + g('color');
  const bd = g('border') + g('borderColor') + g('divider') + g('outline');
  const sh = g('shadow'), other = [...r.tally].filter(([k]) => !['backgroundColor', 'fontColor', 'color', 'border', 'borderColor', 'divider', 'outline', 'shadow'].includes(k)).reduce((s, [, v]) => s + v, 0);
  const isMixed = bg > 0 && fg > 0;
  if (isMixed) mixed.push(tok);
  if (onlyMixed && !isMixed) continue;
  console.log('  ' + tok.padEnd(22) + String(bg).padStart(4) + String(fg).padStart(6) + String(bd).padStart(6) + String(sh).padStart(6) + String(other).padStart(6) + '   ' + (isMixed ? '⚠ 底色+前景混用' : (fg > 0 ? '前景' : (bg > 0 ? '底色' : (bd > 0 ? '边框' : '其他')))));
}
console.log('\n角色冲突（同一令牌既当底色又当前景）：' + (mixed.length ? mixed.join(', ') : '无'));

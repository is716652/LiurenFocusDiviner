/* 一次性：修 _picks_001_*.json 里的非法拼接 —— JSON 不支持 `"A" + "B"`
 * 把  "…"\r?\n\s*+ "…"  合并成一个字符串。
 * 用法: node _tools/_fix_json_concat.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const files = ['_picks_001_xingren.json', '_picks_001_yuanxing.json'];
let fixed = 0;
for (const f of files) {
  const P = path.join(__dirname, f);
  let s = fs.readFileSync(P, 'utf-8');
  const before = s;
  s = s.replace(/"\r?\n\s*\+ "/g, '');
  if (s !== before) {
    try {
      JSON.parse(s);
    } catch (e) {
      console.log('!! %s 合并后仍非法：%s', f, e.message);
      continue;
    }
    fs.writeFileSync(P, s);
    fixed += 1;
    console.log('已修 %s', f);
  } else {
    console.log('（%s 无需修）', f);
  }
  try {
    const j = JSON.parse(fs.readFileSync(P, 'utf-8'));
    console.log('   → JSON 合法，picks %d 条', (j.picks || []).length);
  } catch (e) {
    console.log('   !! 仍非法：%s', e.message);
  }
}
console.log('共修 %d 个文件', fixed);

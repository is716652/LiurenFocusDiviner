/* 一次性：去掉剧本数据 JSON 里的 markdown 粗体标记（**）
 * 为什么：App 侧 StoryPlay.cleanHint() 会把 ** 去掉，所以显示不受影响；
 * 但数据里留 markdown 会让"有的 hint 有标记、有的没有"不一致，且原型/App 两侧渲染路径不同，
 * 统一在数据层清掉最稳。
 * 用法: node _tools/_fix_md.js <json 路径>
 */
'use strict';
const fs = require('fs');
const path = require('path');
const P = path.resolve(process.argv[2] || '');
if (!P || !fs.existsSync(P)) {
  console.log('用法: node _tools/_fix_md.js <json 路径>');
  process.exit(2);
}
let s = fs.readFileSync(P, 'utf-8');
const before = (s.match(/\*\*/g) || []).length;
s = s.replace(/\*\*/g, '');
try {
  JSON.parse(s);
} catch (e) {
  console.log('!! 清洗后 JSON 非法，已中止：%s', e.message);
  process.exit(1);
}
if (before > 0) fs.writeFileSync(P, s);
console.log('%s：去掉 %d 处 markdown 粗体标记；JSON 合法', path.basename(P), Math.floor(before / 2));

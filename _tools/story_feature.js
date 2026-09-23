/* ============================================================================
 * story_feature.js —— 维护「剧情演绎」上架白名单（rawfile/ancient/story_featured.json）
 * ----------------------------------------------------------------------------
 * 为什么单独一个文件：组件层不得写死个案 id（门禁 A1 硬项），且"上哪些案"属**发布策略**、
 * 不属剧情内容 —— 故白名单落在数据里，本工具负责增删并做前置校验。
 *
 * 用法：
 *   node _tools/story_feature.js --list                  # 列出现有白名单
 *   node _tools/story_feature.js <案id> [<案id> ...]     # 加入
 *   node _tools/story_feature.js --remove <案id> [...]   # 移除
 *
 * 前置校验（不加就报错，避免"页面开出来是空白"）：
 *   · 案 id 必须同时存在于 case_gallery.json（取 input 复算盘面）与 case_story.json（取剧情）；
 *   · 该案的 input 必须齐全（mj/dg/dz/hour），否则盘面画不出；
 *   · 加入后必须仍能 JSON.parse。
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const RAW = path.join(__dirname, '..',
  'APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/ancient');
const P = path.join(RAW, 'story_featured.json');

const gallery = JSON.parse(fs.readFileSync(path.join(RAW, 'case_gallery.json'), 'utf-8'));
const stories = JSON.parse(fs.readFileSync(path.join(RAW, 'case_story.json'), 'utf-8')).stories;
const file = JSON.parse(fs.readFileSync(P, 'utf-8'));
const cur = Array.isArray(file.stories) ? file.stories.slice() : [];

const argv = process.argv.slice(2);
if (argv.length === 0 || argv[0] === '--list') {
  console.log('当前白名单（%d 案）：', cur.length);
  for (const id of cur) {
    const g = gallery.find((c) => c.id === id);
    console.log('   %-34s %s', id, g ? g.title : '!! 数据里找不到');
  }
  process.exit(0);
}

const remove = argv[0] === '--remove';
const ids = remove ? argv.slice(1) : argv;
if (ids.length === 0) {
  console.log('用法: node _tools/story_feature.js <案id> [...] ｜ --remove <案id> [...] ｜ --list');
  process.exit(2);
}

for (const id of ids) {
  if (!remove) {
    const g = gallery.find((c) => c.id === id);
    if (!g) {
      console.log('!! 该案不在 case_gallery.json 里，加进去页面会开成空白: %s', id);
      process.exit(1);
    }
    const i = g.input;
    if (!i || !i.mj || !i.dg || !i.dz || !i.hour) {
      console.log('!! 该案 input 不全（盘面画不出）: %s', id);
      process.exit(1);
    }
    if (!stories[id]) {
      console.log('!! 该案在 case_story.json 里没有剧情: %s', id);
      process.exit(1);
    }
    if (cur.indexOf(id) >= 0) {
      console.log('（已在白名单里，跳过）%s', id);
      continue;
    }
    cur.push(id);
    console.log('+ %s  %s', id, g.title);
  } else {
    const n = cur.indexOf(id);
    if (n < 0) {
      console.log('（不在白名单里，跳过）%s', id);
      continue;
    }
    cur.splice(n, 1);
    console.log('- %s', id);
  }
}

file.stories = cur;
const out = JSON.stringify(file, null, 2) + '\n';
try {
  JSON.parse(out);
} catch (e) {
  console.log('!! 写前 JSON 非法，已中止：%s', e.message);
  process.exit(1);
}
fs.writeFileSync(P, out);
console.log('已写回白名单：%d 案 → %s', cur.length, P);
console.log('（提示：白名单变化会影响 _tests/_test_story_play_data.js 的断言，跑一下它）');

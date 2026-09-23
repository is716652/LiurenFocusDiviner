/* ============================================================================
 * story_patch.js —— 把一案的新剧情数据段替换进 case_story.json（真源）
 * ----------------------------------------------------------------------------
 * 为什么不用"整文件重写"：case_story.json 有 41 案，原文件序列化风格与
 * JSON.stringify(x,null,2) 并不一致 —— 整文件重写会把另外 40 案一起重排，
 * diff 从"改一案"变成"改全库"，既不可读也容易掩盖误改。
 * 故本工具只定位该案的文本段（从 `"<id>": {` 到下一个案键），原地替换，
 * 并在写前自检：① 改后仍能解析；② **其他案逐字段未变**；③ 案数不变。
 *
 * 用法：
 *   node _tools/story_patch.js <案id> <数据json>          # 打补丁
 *   node _tools/story_patch.js <案id> <数据json> --dry    # 只看结果，不写
 * 数据 json 的结构 = 该案的剧情对象本身：{ brief, note, asks: [...] }
 *
 * 做剧情的纪律（被 _test_case_story.js / case_story_audit.js 硬判，先记在这里）：
 *   · clue.hint 只给**盘面事实与古法通则**，不得抄本案原文断语、不得提前揭应验 ——
 *     结论留到「呈上断语 → 揭古断」；
 *   · derived 支线的 hint 必须写明规则归属（"古法：…"），ending.text 不得含结论；
 *   · 文本里出现的神煞名要与复算名**精确一致**（如"旬丁(丁马)"不能简写成"旬丁"）；
 *   · 每条 clue 至少一个锚点，且锚点必须能在盘上点亮（先用 story_pan.js 核对）。
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const P = path.join(__dirname, '..',
  'APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/ancient/case_story.json');
const ID = process.argv[2];
const DATA = process.argv[3];
const DRY = process.argv.indexOf('--dry') >= 0;

if (!ID || !DATA) {
  console.log('用法: node _tools/story_patch.js <案id> <数据json> [--dry]');
  process.exit(2);
}
if (ID.indexOf('_') < 0) {
  console.log('!! 案 id 不像案 id（应形如 duanan_200_zhixian_shiwu）: %s', ID);
  process.exit(1);
}

const raw = fs.readFileSync(P, 'utf-8');
const j = JSON.parse(raw);
const NEW = JSON.parse(fs.readFileSync(path.resolve(DATA), 'utf-8'));

/* 数据形状自检 */
if (!NEW.brief || !Array.isArray(NEW.asks) || NEW.asks.length === 0) {
  console.log('!! 数据缺 brief 或 asks');
  process.exit(1);
}
for (const a of NEW.asks) {
  if (!a.id || !a.title || !Array.isArray(a.clues) || a.clues.length === 0) {
    console.log('!! 支线缺 id/title/clues: %s', JSON.stringify(a.id));
    process.exit(1);
  }
  for (const c of a.clues) {
    if (!c.id || !c.label || !Array.isArray(c.anchors) || c.anchors.length === 0) {
      console.log('!! 线索缺 id/label/anchors: %s/%s', a.id, c.id);
      process.exit(1);
    }
    for (const an of c.anchors) {
      if (!an.kind) {
        console.log('!! 锚点缺 kind: %s/%s', a.id, c.id);
        process.exit(1);
      }
    }
  }
}
console.log('数据形状 OK：%d 支线 / 共 %d 条线索 / %d 个锚点',
  NEW.asks.length,
  NEW.asks.reduce((s, a) => s + a.clues.length, 0),
  NEW.asks.reduce((s, a) => s + a.clues.reduce((t, c) => t + c.anchors.length, 0), 0));

/* ---- 段替换 ---- */
const keys = Object.keys(j.stories);
const idx = keys.indexOf(ID);
if (idx < 0) {
  console.log('!! 数据里没有该案: %s', ID);
  process.exit(1);
}
const start = raw.indexOf('"' + ID + '": {');
if (start < 0) {
  console.log('!! 原文里定位不到该案文本段');
  process.exit(1);
}
let end;
if (idx + 1 < keys.length) {
  end = raw.indexOf('"' + keys[idx + 1] + '": {', start);
} else {
  end = raw.lastIndexOf('\n  }');
}
if (end <= start) {
  console.log('!! 定位该案结束位置失败（end=%d start=%d）', end, start);
  process.exit(1);
}
const sep = (idx + 1 < keys.length) ? ',\n    ' : '\n  ';
const body = ('"' + ID + '": ' + JSON.stringify(NEW, null, 2))
  .split('\n').map((ln, n) => (n === 0 ? ln : '    ' + ln)).join('\n');
const out = raw.slice(0, start) + body + sep + raw.slice(end);

/* 写前自检 */
let parsed;
try {
  parsed = JSON.parse(out);
} catch (e) {
  console.log('!! 替换后 JSON 解析失败，已中止：%s', e.message);
  process.exit(1);
}
let changed = 0;
for (const k of keys) {
  if (k === ID) continue;
  if (JSON.stringify(parsed.stories[k]) !== JSON.stringify(j.stories[k])) changed += 1;
}
const sameCount = Object.keys(parsed.stories).length === keys.length;
console.log('替换后：案数 %d（原 %d）｜ 其他案被改动 %d 个（都应为"未变/0"）',
  Object.keys(parsed.stories).length, keys.length, changed);
if (changed !== 0 || !sameCount) {
  console.log('!! 自检未通过，已中止');
  process.exit(1);
}
if (!DRY) {
  fs.writeFileSync(P, out);
  console.log('已写回: %s', P);
} else {
  console.log('(--dry：未写回)');
}
console.log('记得接着跑：node _tests/_test_case_story.js ｜ node _tools/case_story_audit.js');

/* ============================================================================
 * story_drama.js —— 把「剧情演绎规格（drama）」合并进某一案的某条支线
 * ----------------------------------------------------------------------------
 * 背景：剧情演绎要从「线性线索列表」升级为「一案一结构的关卡式推演」。
 *   · 旧结构 clue[] 保留（老玩法与新案兜底），**不删**；
 *   · 新结构 drama 挂在 ask 上：entry[]（分级入口）+ route[]（成立路径，各带逐步反馈）。
 *   两者并存是过渡期安排：App 侧「有 drama 走新玩法，没有则退回 clues」。
 *
 * 用法：
 *   node _tools/story_drama.js <案id> <askid> <drama数据json> [--dry]
 *     例：node _tools/story_drama.js duanan_200_zhixian_shiwu original _tools/_drama_200.json
 *   node _tools/story_drama.js --list <案id>          # 看该案各支线现有 drama 概况
 *
 * 写入方式：读 case_story.json → 改内存里该案 → **只把该案那一段文本替换回去**
 *   （原文件序列化风格与 JSON.stringify(x,null,2) 不同，整文件重写会把另外 40 案一起重排）。
 * 写前自检：改后仍能解析 ｜ 其他案逐字段未变 ｜ 案数不变 ｜ 目标支线确实挂上了 drama。
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const P = path.join(__dirname, '..',
  'APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/ancient/case_story.json');
const argv = process.argv.slice(2);
const raw = fs.readFileSync(P, 'utf-8');
const j = JSON.parse(raw);
const keys = Object.keys(j.stories);

/* --list：看某案各支线的 drama 概况 */
if (argv[0] === '--list') {
  const id = argv[1];
  const st = j.stories[id];
  if (!st) {
    console.log('!! 无此案: ' + id);
    process.exit(1);
  }
  console.log('【' + id + '】');
  for (const a of st.asks) {
    const d = a.drama;
    if (!d) {
      console.log('   支线 ' + String(a.id).padEnd(10) + ' 无 drama（走旧玩法 clues ' + (a.clues || []).length + ' 条）');
      continue;
    }
    const L1 = (d.entries || []).filter((e) => e.level === 1).length;
    const L2 = (d.entries || []).filter((e) => e.level === 2).length;
    const steps = (d.routes || []).reduce((s, r) => s + (r.steps || []).length, 0);
    console.log('   支线 ' + String(a.id).padEnd(10) + ' kind=' + d.kind
      + ' ｜ 入口 ' + (d.entries || []).length + '（一级 ' + L1 + '／二级 ' + L2 + '）'
      + ' ｜ 路径 ' + (d.routes || []).length + ' ｜ 步数 ' + steps
      + ' ｜ 可取之象 ' + (d.picks || []).length);
    for (const r of (d.routes || [])) {
      console.log('        · ' + String(r.id).padEnd(16) + ' ' + String(r.kind).padEnd(10)
        + ' ' + (r.steps || []).length + ' 步');
    }
  }
  process.exit(0);
}

const ID = argv[0];
const ASK = argv[1];
const DATA = argv[2];
const DRY = argv.indexOf('--dry') >= 0;
if (!ID || !ASK || !DATA) {
  console.log('用法: node _tools/story_drama.js <案id> <askid> <drama数据json> [--dry]');
  process.exit(2);
}

const DRAMA = JSON.parse(fs.readFileSync(path.resolve(DATA), 'utf-8'));

/* ---- 数据形状自检：**分两档** ----
 *   关卡式（elements-circle / timeline / decision-qa / origin-trace）：入口 + 路径，
 *     硬规矩 = 恰好一条古籍原断、另一解须声明、一级入口须被路径用到、每步有锚点与 reply。
 *   自由取象（free-pick）——**同课异占专用**：异占没有古籍原断（它的性质是「同一张盘换一个
 *     方向看」），故不设路径、不设结论、不设对错，只有一份「可取之象」清单。
 *     硬给它造一条"正确路径"，等于替古人说话 —— 那正是要避免的。 */
const problems = [];
const FREE = DRAMA.kind === 'free-pick';
if (!DRAMA.kind) problems.push('缺 kind（玩法类型）');
if (!DRAMA.name) problems.push('缺 name（关卡名，App 直接显示）');
if (FREE) {
  if (!Array.isArray(DRAMA.picks) || DRAMA.picks.length < 3) {
    problems.push('free-pick 必须有 picks 且不少于 3 条（否则没得取）');
  }
  if (Array.isArray(DRAMA.routes) && DRAMA.routes.length > 0) {
    problems.push('free-pick 不得有 routes —— 异占没有"正确路径"，别替古人说话');
  }
  if (!DRAMA.note) problems.push('free-pick 必须写 note 声明「非古籍原断」（合规红线）');
  const seenPick = new Set();
  for (const p of (DRAMA.picks || [])) {
    if (!p.id || !p.name) problems.push('取象项缺 id/name');
    if (!p.anchor || !p.anchor.kind) problems.push('取象项 ' + p.id + ' 缺 anchor.kind');
    if (!p.reply) problems.push('取象项 ' + p.id + ' 缺 reply（取到之后说什么）');
    const kk = p.anchor ? (p.anchor.kind + '|' + (p.anchor.ref || '') + '|' + (p.anchor.pos || '')) : p.id;
    if (seenPick.has(kk)) problems.push('取象项 ' + p.id + ' 的锚点与另一条重复（同一处只需列一次）');
    seenPick.add(kk);
  }
  if (problems.length > 0) {
    console.log('!! free-pick 数据不合规，已中止：');
    for (const p of problems) console.log('   - ' + p);
    process.exit(1);
  }
  console.log('free-pick 形状 OK：可取之象 %d 条 ｜ 关卡名「%s」', DRAMA.picks.length, DRAMA.name);
} else {
if (!Array.isArray(DRAMA.entries) || DRAMA.entries.length === 0) problems.push('缺 entries');
if (!Array.isArray(DRAMA.routes) || DRAMA.routes.length === 0) problems.push('缺 routes');
for (const e of (DRAMA.entries || [])) {
  if (!e.id || !e.name) problems.push('入口缺 id/name');
  if (e.level !== 1 && e.level !== 2) problems.push('入口 ' + e.id + ' 的 level 必须是 1 或 2');
  if (!e.tag) problems.push('入口 ' + e.id + ' 缺 tag（原文所用／另一条路所用）');
  if (!e.anchor || !e.anchor.kind) problems.push('入口 ' + e.id + ' 缺 anchor.kind');
  if (!e.reply) problems.push('入口 ' + e.id + ' 缺 reply（点下去说什么）');
}
let hasAncient = 0;
for (const r of (DRAMA.routes || [])) {
  if (!r.id || !r.kind) problems.push('路径缺 id/kind');
  if (['古籍原断', '另一解', '说明性'].indexOf(r.kind) < 0) {
    problems.push('路径 ' + r.id + ' 的 kind 必须是 古籍原断／另一解／说明性');
  }
  if (r.kind === '古籍原断') hasAncient += 1;
  if (r.kind === '另一解' && !r.note) problems.push('路径 ' + r.id + ' 是另一解，必须写 note 声明非古籍原断');
  if (!Array.isArray(r.steps) || r.steps.length === 0) problems.push('路径 ' + r.id + ' 缺 steps');
  for (const s of (r.steps || [])) {
    if (!s.anchor || !s.anchor.kind) problems.push('路径 ' + r.id + ' 某步缺 anchor.kind');
    if (!s.reply) problems.push('路径 ' + r.id + ' 某步缺 reply');
  }
  if (!r.conclusion) problems.push('路径 ' + r.id + ' 缺 conclusion（走到头的断语）');
}
if (hasAncient !== 1) problems.push('必须**恰好有一条**「古籍原断」路径（现有 ' + hasAncient + ' 条）');
/* 一级入口至少被一条路径用到；二级入口出现条件可机检 */
const usedEntries = new Set();
for (const r of (DRAMA.routes || [])) for (const s of (r.steps || [])) if (s.entry) usedEntries.add(s.entry);
for (const e of (DRAMA.entries || [])) {
  if (e.level === 1 && usedEntries.size > 0 && !usedEntries.has(e.id)) {
    problems.push('一级入口 ' + e.id + ' 没有被任何路径用到（玩家点它必然无下文）');
  }
}
if (problems.length > 0) {
  console.log('!! drama 数据不合规，已中止：');
  for (const p of problems) console.log('   - ' + p);
  process.exit(1);
}
console.log('drama 形状 OK：入口 %d（一级 %d／二级 %d）｜ 路径 %d（古籍原断 1）｜ 步数 %d',
  DRAMA.entries.length,
  DRAMA.entries.filter((e) => e.level === 1).length,
  DRAMA.entries.filter((e) => e.level === 2).length,
  DRAMA.routes.length,
  DRAMA.routes.reduce((s, r) => s + r.steps.length, 0));
}

/* ---- 挂到目标支线 ---- */
const idx = keys.indexOf(ID);
if (idx < 0) {
  console.log('!! 无此案: %s', ID);
  process.exit(1);
}
const ask = j.stories[ID].asks.find((a) => a.id === ASK);
if (!ask) {
  console.log('!! 该案没有这条支线: %s（现有 %s）', ASK,
    j.stories[ID].asks.map((a) => a.id).join('/'));
  process.exit(1);
}
ask.drama = DRAMA;

/* ---- 段替换写回 ---- */
const start = raw.indexOf('"' + ID + '": {');
let end;
if (idx + 1 < keys.length) {
  end = raw.indexOf('"' + keys[idx + 1] + '": {', start);
} else {
  end = raw.lastIndexOf('\n  }');
}
if (start < 0 || end <= start) {
  console.log('!! 定位该案文本段失败');
  process.exit(1);
}
const sep = (idx + 1 < keys.length) ? ',\n    ' : '\n  ';
const body = ('"' + ID + '": ' + JSON.stringify(j.stories[ID], null, 2))
  .split('\n').map((ln, n) => (n === 0 ? ln : '    ' + ln)).join('\n');
const out = raw.slice(0, start) + body + sep + raw.slice(end);

/* ---- 写前自检 ---- */
let parsed;
try {
  parsed = JSON.parse(out);
} catch (e) {
  console.log('!! 替换后 JSON 非法，已中止：%s', e.message);
  process.exit(1);
}
let changed = 0;
for (const k of keys) {
  if (k === ID) continue;
  if (JSON.stringify(parsed.stories[k]) !== JSON.stringify(j.stories[k])) changed += 1;
}
const okAsk = parsed.stories[ID].asks.find((a) => a.id === ASK);
/* 关卡式看 routes，自由取象看 picks —— 两者任一挂上即算成功 */
const dOk = okAsk ? okAsk.drama : null;
const hasDrama = !!(dOk && ((dOk.routes && dOk.routes.length > 0) || (dOk.picks && dOk.picks.length > 0)));
console.log('替换后：案数 %d（原 %d）｜ 其他案被改动 %d 个 ｜ 目标支线挂上 drama: %s',
  Object.keys(parsed.stories).length, keys.length, changed, hasDrama);
if (changed !== 0 || !hasDrama || Object.keys(parsed.stories).length !== keys.length) {
  console.log('!! 自检未通过，已中止');
  process.exit(1);
}
if (!DRY) {
  fs.writeFileSync(P, out);
  console.log('已写回: %s', P);
} else {
  console.log('(--dry：未写回)');
}

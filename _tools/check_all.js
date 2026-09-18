/* ============================================================================
 * check_all.js —— 全部校验的唯一入口（2026-09-13 新增）
 * ----------------------------------------------------------------------------
 * 为什么要有它：门禁数量在增长（JS 测试 + python 校验 + 工具自检），散在多个目录、
 *   靠记忆挑着跑，必然出现「漏跑」与「不知道总共要多久」。本入口只做三件事：
 *   1) 按清单依次跑，**实测每项耗时**并汇总（回答「门禁会不会拖慢」）
 *   2) 任一失败即非零退出，并把失败项排在最前
 *   3) `--fast` 只跑快档（本地随手跑）、`--list` 打印清单（供 Agent.md 引用）
 *
 * 与真源的关系（松耦合）：本文件**不实现任何判定规则**，只做调度与计时。
 *   每条规则仍住在各自的门禁里；门禁需要规则时向真源取（例：verify_free_edition.py
 *   import sync_free_edition 的差异规则；ArkTS 门禁读 core/liuren/**）。
 *   新增/删除门禁只需改下面的清单（JS 测试为目录扫描，自动纳入）。
 * 用法：node _tools/check_all.js [--fast] [--only <名字子串>] [--list]
 *
 * ⚠ **绝对不要并发跑两次**（2026-09-18 血的教训）：
 *   gate_mutation_check.js 会**在原地变异**真源文件来验证门禁有效性，跑完再还原。
 *   两个 check_all 同时在跑时，A 的还原会把 B 的变异写回、或把 B 的改动当"原样"保存，
 *   结果是**工作区被静默污染**（实测：主版 pages/Index.ets 掉了 2 行、与 HEAD 不一致，
 *   于是 A3 门禁去报了"免费版"违规 —— 因为当时被变异的其实是主版）。
 *   故本脚本现在加文件锁：同一仓库同时只允许一个 check_all 在跑 ✗。
 *   另：`--only` 曾经**只过滤打印、不影响执行**（循环写的是 ITEMS 而不是 selected），
 *   于是"只跑一项"实际跑了全部 —— 也已修掉。
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const TESTS = path.join(ROOT, '_tests');
const fast = process.argv.includes('--fast');
const listOnly = process.argv.includes('--list');

/* ---- 并发锁：变异型门禁会改真源，绝不允许两个实例同时跑 ---- */
const LOCK = path.join(ROOT, '.check_all.lock');
if (!listOnly) {
  let alivePid = 0;
  try {
    const old = JSON.parse(fs.readFileSync(LOCK, 'utf-8'));
    try { process.kill(old.pid, 0); alivePid = old.pid; } catch (e) { alivePid = 0; }
    if (alivePid) {
      console.log('⛔ 已有一个 check_all 在跑（pid ' + alivePid + '）。'
        + '\n   gate_mutation_check 会原地变异真源文件，并发跑会静默污染工作区，故拒绝启动。'
        + '\n   若确认那个进程已死，删掉 ' + path.relative(ROOT, LOCK) + ' 再跑。');
      process.exit(9);
    }
  } catch (e) { /* 无锁或锁文件坏了：继续 */ }
  fs.writeFileSync(LOCK, JSON.stringify({ pid: process.pid, at: new Date().toISOString() }), 'utf-8');
  const release = () => { try { fs.unlinkSync(LOCK); } catch (e) {} };
  process.on('exit', release);
  process.on('SIGINT', () => { release(); process.exit(130); });
}

/* JS 门禁：目录扫描（不写死文件名，新增即纳入） */
function jsGates() {
  return fs.readdirSync(TESTS)
    .filter((f) => /^_test_.*\.js$/.test(f))
    .sort()
    .map((f) => ({ name: f, cmd: process.execPath, args: [path.join(TESTS, f)], slow: false }));
}
/* 非 JS 校验：这些是「工具/产物级」校验，位置固定，故显式列出（规则仍住各自文件里）。
   去重原则：**同一条判定只跑一次** —— verify_free_edition.py 内部已经复用
   sync_free_edition.diff_against()，故这里不再单列 `sync --check`（要单跑手敲即可）。 */
function toolChecks() {
  return [
    { name: 'verify_free_edition.py（内含 sync 差异规则干跑比对）', cmd: 'python', args: [path.join(ROOT, '_tools/verify_free_edition.py')], slow: false },
    { name: 'build_core.js --check', cmd: process.execPath, args: [path.join(ROOT, '_tools/build_core.js'), '--check'], slow: false },
    { name: '_api_parity.js（对外 API 只增不改）', cmd: process.execPath, args: [path.join(ROOT, '_tools/_api_parity.js')], slow: false },
    { name: 'verify_app_pkg.py（上传包级 16 项）', cmd: 'python', args: [path.join(ROOT, '_tools/verify_app_pkg.py')], slow: false },
    { name: 'case_story_audit.js（案例剧情批量填充审计）', cmd: process.execPath, args: [path.join(ROOT, '_tools/case_story_audit.js')], slow: false },
    { name: '_core_snapshot.js（行为快照 185981 条）', cmd: process.execPath, args: [path.join(ROOT, '_tools/_core_snapshot.js')], slow: true },
    { name: 'gate_mutation_check.js（门禁有效性自检：逐个变异后重跑对应门禁，故最慢）', cmd: process.execPath, args: [path.join(ROOT, '_tools/gate_mutation_check.js')], slow: true },
  ];
}

/* 含 500 组随机扰动/挖键实验的门禁约 40 s，归入慢档 */
const SLOW_TESTS = new Set(['_test_component_audit.js', '_test_core_regress.js']);
const ITEMS = jsGates().map((it) => (SLOW_TESTS.has(it.name) ? Object.assign({}, it, { slow: true }) : it))
  .concat(toolChecks());
const onlyIdx = process.argv.indexOf('--only');
const only = onlyIdx >= 0 ? (process.argv[onlyIdx + 1] || '') : '';
const selected = only ? ITEMS.filter((it) => it.name.indexOf(only) >= 0) : ITEMS;
if (listOnly) {
  console.log('清单共 ' + ITEMS.length + ' 项（慢档 ' + ITEMS.filter((i) => i.slow).length + ' 项）：');
  for (const it of ITEMS) console.log('  ' + (it.slow ? '[慢] ' : '     ') + it.name);
  process.exit(0);
}
if (selected.length === 0) {
  console.log('--only ' + only + ' 未匹配到任何项');
  process.exit(2);
}

const env = Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8' });
const results = [];
let n = 0;
/* 必须遍历 `selected` 而不是 `ITEMS`：第一版写的是 ITEMS，于是 `--only X` 只过滤打印、
 * 执行上仍跑全部（"只跑一项"实际跑了 42 项，还在我另开一个 check_all 时并发触发两次
 * 变异型门禁，把工作区静默污染了）。 */
for (const it of selected) {
  n++;
  if (fast && it.slow) { results.push({ ...it, ms: 0, code: 0, skipped: true }); continue; }
  const t0 = Date.now();
  const r = spawnSync(it.cmd, it.args, { cwd: ROOT, encoding: 'utf-8', env, maxBuffer: 1 << 26 });
  const ms = Date.now() - t0;
  const code = r.status === null ? -1 : r.status;
  results.push({ name: it.name, ms, code, slow: it.slow });
  const tail = ((r.stdout || '') + (r.stderr || '')).trim().split('\n').filter((l) => l.trim() !== '');
  const line = tail.length ? tail[tail.length - 1].trim() : '';
  process.stdout.write('[' + String(n).padStart(2) + '/' + selected.length + '] '
    + (code === 0 ? 'PASS' : 'FAIL') + '  ' + String(ms + 'ms').padStart(8) + '  ' + it.name
    + (code === 0 ? '' : '\n        ↳ ' + line.slice(0, 160)) + '\n');
}
const ran = results.filter((r) => !r.skipped);
const failed = results.filter((r) => !r.skipped && r.code !== 0);
const total = ran.reduce((s, r) => s + r.ms, 0);
console.log('\n合计 ' + ran.length + ' 项，耗时 ' + (total / 1000).toFixed(1) + ' s'
  + (fast ? '（--fast：已跳过 ' + results.filter((r) => r.skipped).length + ' 项慢档）' : '')
  + '；失败 ' + failed.length + ' 项');
if (failed.length) {
  console.log('失败清单：');
  for (const f of failed) console.log('  ✗ ' + f.name);
}
const slowest = ran.slice().sort((a, b) => b.ms - a.ms).slice(0, 5);
console.log('最慢 5 项：' + slowest.map((s) => s.name.replace(/\.js$|\.py$/, '') + ' ' + s.ms + 'ms').join(' · '));
process.exit(failed.length ? 1 : 0);

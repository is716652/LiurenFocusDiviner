/* ============================================================================
 * build_core.js —— 引擎真源 → 单一产物
 * ----------------------------------------------------------------------------
 * 真源按 Agent.md §13 拆为多模块（ArkTS 兼容子集：全局脚本、无 import/export）。
 * 模块间靠「全局同名 class」互调（门面 LiurenCore + 各模块 LrXxx），故产物必须是
 * **一个文件**；本脚本按固定顺序拼装成 core/liuren-core.ts，再交给 tsc 产出
 * core/liuren-core.js（Node 测试与 Web 端只加载这一个文件，加载方式不变）。
 *
 *   node _tools/build_core.js          # 拼装 → tsc → node --check
 *   node _tools/build_core.js --check  # 只校验真源齐备与产物是否最新
 *
 * 纪律：core/liuren-core.ts 是**装配产物**（勿手改）；改规则请改 core/liuren/**。
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const ENTRY_REL = 'core/liuren-core.ts';
const ENTRY = path.join(ROOT, ENTRY_REL);
const OUT = path.join(ROOT, 'core', 'liuren-core.js');
const CHECK_ONLY = process.argv.includes('--check');

/* 装配顺序：类型在前 → 公共底座 → 定法模块 → 门面最后 */
const ORDER = [
  'core/liuren/types.ts',
  'core/liuren/liuren-const.ts',
  'core/liuren/pan/jigong.ts',
  'core/liuren/pan/xunkong.ts',
  'core/liuren/pan/jiang.ts',
  'core/liuren/pan/dungan.ts',
  'core/liuren/pan/sanchuan.ts',
  'core/liuren/pan/sike.ts',
  'core/liuren/pan/tiandipan.ts',
  'core/liuren/pan/shensha.ts',
  'core/liuren/pan/dx.ts',
  'core/liuren/bifa.ts',
  'core/liuren/zhonghuang.ts',
  'core/liuren/yongshen.ts',
  'core/liuren/facade.ts'
];
const BANNER = '/* ============================================================================\n'
  + ' * liuren-core.ts —— 【装配产物 · 勿手改】由 _tools/build_core.js 生成\n'
  + ' * ----------------------------------------------------------------------------\n'
  + ' * 真源：core/liuren/facade.ts（门面）+ core/liuren/**（各模块）\n'
  + ' * 装配顺序：' + ORDER.map((f) => f.replace('core/liuren/', '').replace('core/', '')).join(' → ') + '\n'
  + ' * 生成：node _tools/build_core.js\n'
  + ' * ==========================================================================*/\n';

/* ---- 真源齐备性 ---- */
const miss = ORDER.filter((f) => !fs.existsSync(path.join(ROOT, f)));
if (miss.length) {
  console.log('缺真源文件：' + miss.join(', '));
  process.exit(1);
}
/* 装配产物不得被当模块再次拼装（防自套娃） */
if (ORDER.indexOf(ENTRY_REL) >= 0) { console.log('装配顺序里不得包含产物自身'); process.exit(1); }

const parts = ORDER.map((f) => fs.readFileSync(path.join(ROOT, f), 'utf-8').replace(/\r\n/g, '\n'));
const body = (BANNER + parts.join('\n')).replace(/\n*$/, '\n');

if (CHECK_ONLY) {
  const cur = fs.existsSync(ENTRY) ? fs.readFileSync(ENTRY, 'utf-8').replace(/\r\n/g, '\n') : '';
  const upToDate = cur === body;
  console.log(upToDate ? 'core/liuren-core.ts 与真源一致 ✓' : 'core/liuren-core.ts 与真源不一致 ✗（请跑 node _tools/build_core.js）');
  process.exit(upToDate ? 0 : 1);
}

fs.writeFileSync(ENTRY, body, 'utf-8');
console.log('装配：' + ORDER.length + ' 个真源 → ' + ENTRY_REL + '（' + body.split('\n').length + ' 行）');

const tsc = path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
execFileSync(process.execPath, [tsc, ENTRY_REL, '--target', 'ES2017', '--module', 'commonjs',
  '--strict', '--noImplicitAny'], { cwd: ROOT, stdio: 'inherit' });
execFileSync(process.execPath, ['--check', 'core/liuren-core.js'], { cwd: ROOT, stdio: 'inherit' });
console.log('产物：core/liuren-core.js（' + fs.statSync(OUT).size + ' 字节，node --check 通过）');

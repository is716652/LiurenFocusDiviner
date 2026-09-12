/* ============================================================================
 * rebuild_core.js —— core 侧组件化重建【唯一入口】
 * ----------------------------------------------------------------------------
 * 按固定顺序跑完整条链（任一步失败即停，不留半成品）：
 *   1) _tools/_core_split.js        从 tag v1.0.4-pre-componentize 的单体切片出 core/liuren/**
 *   2) _tools/_core_api_extras.js   补组件化后新增的只读接口（ruleHealth/missingRules/palaceLookup）
 *   3) _tools/_core_assemble.js     门面常量绑定/模块别名、原 private → public、类型补声明
 *   4) _tools/build_core.js         装配 → tsc → 单一产物 core/liuren-core.js（并 node --check）
 *
 * 为什么必须一个入口：模块间靠**全局同名 class** 互调，任何一步漏跑都会生成
 * 「能编译但语义不全」的半成品产物，而测试仍然可能绿 —— 这种半成品最难查。
 *
 * 配套（不在本入口内，按需单独跑）：
 *   node _tools/_core_snapshot.js   行为快照比对（基线 _tests/_data/core_snapshot.json）
 *   node _tools/_api_parity.js      与 tag v1.0.4-pre-componentize 的产物比对外 API
 *   node _tools/build_core.js --check  人工改动检测（产物与真源不一致即 exit 1）
 * ArkTS 侧对称入口：node _tools/_ets_pipeline.js
 *
 * 用法：node _tools/rebuild_core.js
 * ==========================================================================*/
'use strict';
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
function run(label, script) {
  process.stdout.write('\n== ' + label + ' ==\n');
  execFileSync(process.execPath, [path.join(__dirname, script)], { cwd: ROOT, stdio: 'inherit' });
}
run('1/4 切片（单体 → core/liuren/**）', '_core_split.js');
run('2/4 补新增只读接口', '_core_api_extras.js');
run('3/4 门面/可见性/类型收尾', '_core_assemble.js');
run('4/4 装配 + 编译产物', 'build_core.js');
console.log('\ncore 侧重建完成。产物：core/liuren-core.js（单一文件，Node/Web 只加载它）');
console.log('建议接着跑：node _tools/_core_snapshot.js（行为快照）与 node _tools/_api_parity.js（对外 API）');

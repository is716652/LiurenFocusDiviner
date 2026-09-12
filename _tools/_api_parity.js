/* 临时：核对拆分后引擎的对外 API 与拆分前（HEAD 版产物）是否完全一致 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const { execFileSync } = require('child_process');

const oldSrc = execFileSync('git', ['show', 'HEAD:core/liuren-core.js'], { cwd: __dirname + '/..', maxBuffer: 64 * 1024 * 1024 }).toString('utf-8');
const newSrc = fs.readFileSync(__dirname + '/../core/liuren-core.js', 'utf-8');

function load(src, tag) {
  const ctx = vm.createContext({ console: console });
  vm.runInContext(src + '\nglobalThis.__X = [LiurenCore, YongShenCore];', ctx, { filename: tag });
  return ctx.__X;
}
const OLD = load(oldSrc, 'old');
const NEW = load(newSrc, 'new');
const names = (o) => Object.getOwnPropertyNames(o).filter((k) => k !== 'length' && k !== 'name' && k !== 'prototype');
for (let i = 0; i < 2; i++) {
  const tag = i === 0 ? 'LiurenCore' : 'YongShenCore';
  const a = names(OLD[i]), b = names(NEW[i]);
  const missing = a.filter((k) => b.indexOf(k) < 0);
  const added = b.filter((k) => a.indexOf(k) < 0);
  console.log('[' + tag + '] 旧 ' + a.length + ' 项 / 新 ' + b.length + ' 项');
  console.log('  缺失（对外 API 断开）：' + (missing.length ? missing.join(', ') : '（无）'));
  console.log('  新增（只增不改）：' + (added.length ? added.join(', ') : '（无）'));
}
/* 常量值逐项比对（引用不同不影响，逐项 JSON 比） */
const CONSTS = names(OLD[0]).filter((k) => /^[A-Z][A-Z0-9_]*$/.test(k));
let bad = 0;
for (const k of CONSTS) {
  const a = JSON.stringify(OLD[0][k]), b = JSON.stringify(NEW[0][k]);
  if (a !== b) { bad++; console.log('  ✗ 常量 ' + k + ' 值不同'); }
}
console.log('常量值逐项比对：' + (bad === 0 ? CONSTS.length + ' 项全部一致 ✓' : bad + ' 项不同 ✗'));
process.exit(bad === 0 ? 0 : 1);

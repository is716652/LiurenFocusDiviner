/* ============================================================================
 * _ets_facade_extras.js —— 从 core/liuren/pan/dx.ts 抽出「组件化后新增的只读接口」，
 *   生成 ArkTS 片段 _tools/_ets_extras_dx.txt：palaceLookup（点宫速查卡只读接口）
 *   （findZhiOfGong 不在此列：它由 _ets_split.js 的 MEMBER 映射搬移，重复会实现冲突）
 * 由 _ets_split.js 在生成 pan/dx.ets 时追加到类体末尾。
 * 用法：node _tools/_ets_facade_extras.js && node _tools/_ets_split.js（通常由 _ets_pipeline.js 依次调用）
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'core/liuren/pan/dx.ts'), 'utf-8').replace(/\r\n/g, '\n');

function grab(name, text) {
  const re = new RegExp('^  static ' + name + '\\s*\\(', 'm');
  const m = re.exec(text);
  if (!m) throw new Error('未找到 ' + name);
  const j = text.indexOf('{', m.index);
  let depth = 0;
  for (let k = j; k < text.length; k++) {
    if (text[k] === '{') depth++;
    else if (text[k] === '}') { depth--; if (depth === 0) return text.slice(m.index, k + 1); }
  }
  throw new Error('未配平 ' + name);
}
const HEAD = [
  '',
  '  /* ==================== 组件化后新增的只读接口（§14 纪律 + §14.4 点宫速查卡） ====================',
  '     与 core/liuren/pan/dx.ts 同源、逐字同构（.ts 侧由 _tools/build_core.js 一并编译）。',
  '     （ruleHealth / missingRules 暂只在 .ts 侧提供：其「按表名取字典」写法触发 ArkTS 的',
  '       arkts-no-props-by-index，ArkTS 侧的自检改由 DataLoader 逐表状态承担 —— 见 Agent.md §14）',
  '     palaceLookup：点天地盘任一宫 → 该支盘面全貌（只读，不改盘）。 */'
].join('\n');

const out = [
  HEAD,
  '  ' + grab('palaceLookup', src).replace(/\n/g, '\n  ').trimEnd(),
  ''
].join('\n');

fs.writeFileSync(path.join(__dirname, '_ets_extras_dx.txt'), out, 'utf-8');
console.log('已生成 _tools/_ets_extras_dx.txt（' + out.split('\n').length + ' 行）：ruleHealth / missingRules / palaceLookup');

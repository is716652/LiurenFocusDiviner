/* ============================================================================
 * gate_mutation_check.js —— 门禁有效性自检（变异测试）
 * ----------------------------------------------------------------------------
 * 为什么需要：门禁本身也会「悄悄失效」。组件化把扫描面从单体文件换成目录、
 * 又放宽过豁免面（实测 A3 的「规则表数据区」曾宽到把任何含 2 个字符串字面量的
 * 花括号块都豁免 —— Index.ets 里最大豁免区间覆盖全文 97%，A3 形同虚设），
 * 这类失效在普通跑绿里**看不出来**：门禁全绿只说明「没抓到东西」。
 * 做法：把可疑写法临时写进真实文件 → 跑门禁 → 期望结果 → **逐字节还原**。
 *   - 正例（P）：必须被拦下。拦不下 = 门禁有盲区。
 *   - 反例（N）：必须被放过。拦下了 = 门禁误报，会逼人绕过门禁（同样危险）。
 * 用法：node _tools/gate_mutation_check.js
 * 退出码：全部符合预期 = 0；否则 1（并逐条打印差异）
 * 注意：脚本会临时修改被测文件，但保证 finally 还原；请勿与构建/编辑并行运行。
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const G_HARDCODE = path.join(ROOT, '_tests', '_test_no_hardcode.js');
const G_COMPONENT = path.join(ROOT, '_tests', '_test_component_audit.js');

const ETS_MAIN = 'APP/LiurenFocusDiviner/entry/src/main/ets';
const TS_M = 'core/liuren/pan';

/* 死常量名动态拼装：本文件不得出现该字面量，否则 A4 会把它当「外部消费方」而放过 */
const DEAD_NAME = ['GMC', 'DEAD', 'Z9Q4', 'TABLE'].join('_');
/* 神煞名取自真实规则表键（rule/神煞起法.json），保证正例忠实 */
const SS8 = '太岁/岁破/病符/丧门/吊客/天喜/孤辰/寡宿'.split('/');

const P = (id, gate, file, text, note) => ({ id: id, kind: 'P', gate: gate, file: file, text: text, note: note });
const N = (id, gate, file, text, note) => ({ id: id, kind: 'N', gate: gate, file: file, text: text, note: note });

const CASES = [
  P('P1 个案日期串写进引擎模块', G_HARDCODE, TS_M + '/xunkong.ts',
    "\nconst GMC_DATE_STR = '2021-03-15';\n", 'A1'),
  P('P2 个案 id 写进引擎模块', G_HARDCODE, TS_M + '/jigong.ts',
    "\nconst GMC_CASE_ID = 'duanan_001_han_qixue';\n", 'A1'),
  P('P3 引擎模块出现值 import', G_HARDCODE, TS_M + '/dungan.ts',
    "\nimport * as gmcFs from 'fs';\n", 'A2'),
  P('P4 引擎模块出现环境依赖', G_HARDCODE, TS_M + '/sike.ts',
    '\nconst GMC_NOW = Date.now();\n', 'A2'),
  P('P5 引擎模块出现死常量', G_HARDCODE, TS_M + '/dungan.ts',
    '\nconst ' + DEAD_NAME + ' = { x: 1, y: 2, z: 3 };\n', 'A4'),
  P('P6 UI 页把天将名当映射表用（一行 3 个）', G_COMPONENT, ETS_MAIN + '/pages/Index.ets',
    "\nconst gmcPickJiang = (g: string): string => g === '甲' ? '贵人' : g === '乙' ? '螣蛇' : '朱雀';\n", 'A3 天将名'),
  P('P7 UI 页把课体名当映射表用（一行 3 个）', G_COMPONENT, ETS_MAIN + '/pages/Index.ets',
    "\nconst gmcPickKeti = (n: number): string => n === 1 ? '元首' : n === 2 ? '重审' : '涉害';\n", 'A3 课体名'),
  /* 神煞名正例必须写成「判断/映射」形态：数组字面量落在规则常量表豁免面（见 N3），
     文本上与合法表不可分，其是否多余由 A4 死常量判据兜底。 */
  P('P8 UI 页把神煞名成组当映射表用（一行 8 个）', G_COMPONENT, ETS_MAIN + '/pages/Index.ets',
    '\nconst gmcShenshaByGan = (g: string): string => ' + SS8.map((s, i) => "g === '" + String.fromCharCode(65 + i) + "' ? '" + s + "'").join(' : ') + " : '';\n", 'A3 神煞名'),

  N('N1 引擎给课体取变体名（正常命名，不是写死）', G_COMPONENT, ETS_MAIN + '/model/pan/sanchuan.ets',
    '\n  static gmcName(yangGan: boolean): string { return yangGan ? "昴星·虎视转蓬" : "昴星·冬蛇掩目"; }\n',
    '不应报 A3（引擎是名字的权威来源）'),
  N('N2 UI 里的文案举例（给用户看的）', G_COMPONENT, ETS_MAIN + '/pages/Index.ets',
    "\nconst gmcTip = (name: string): string => name !== '' ? '宗门法：' + name + '（贼克/比用/涉害/遥克…）' : '';\n",
    '不应报 A3（名字全在带文案标点的字符串里）'),
  N('N3 UI 里的规则常量表（数据字面量）', G_COMPONENT, ETS_MAIN + '/pages/Index.ets',
    "\nconst GMC_LEGEND_XXXX = ['贵人', '螣蛇', '朱雀', '六合'];\n",
    '不应报 A3（表达式位置的规则表；是否死常量由 A4 另判）'),
];

function runGate(gate) {
  try {
    const out = execFileSync(process.execPath, [gate], { cwd: ROOT, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out: out };
  } catch (e) {
    return { code: e.status === undefined ? 1 : e.status, out: (e.stdout || '') + (e.stderr || '') };
  }
}
function writeRetry(p, txt) {
  for (let i = 0; i < 6; i++) {
    try { fs.writeFileSync(p, txt); return; } catch (e) { if (i === 5) throw e; }
  }
}

/* 基线：两道门禁都必须先是绿的，否则变异测试无意义 */
for (const [g, label] of [[G_HARDCODE, '防写死门禁 A1–A6'], [G_COMPONENT, '组件层体检 A1–A4/B1–B4']]) {
  const r = runGate(g);
  console.log('基线 ' + label + '：' + (r.code === 0 ? '绿 ✓' : '红 ✗（先修门禁再跑本脚本）'));
  if (r.code !== 0) process.exit(2);
}

let fail = 0;
console.log('');
for (const c of CASES) {
  const p = path.join(ROOT, c.file.split('/').join(path.sep));
  const orig = fs.readFileSync(p, 'utf-8');
  let code = 0, out = '';
  try {
    writeRetry(p, orig.replace(/\s*$/, '\n') + c.text);
    const r = runGate(c.gate);
    code = r.code; out = r.out;
  } finally {
    writeRetry(p, orig);
  }
  const restored = fs.readFileSync(p, 'utf-8') === orig;
  const caught = code !== 0;
  const wantCaught = c.kind === 'P';
  const ok = caught === wantCaught && restored;
  if (!ok) fail++;
  const ev = (out.split(/\r?\n/).filter((x) => /✗/.test(x))[0] || '').trim().slice(0, 120);
  const verdict = wantCaught ? (caught ? '拦下 ✓' : '漏过 ✗（门禁盲区）') : (caught ? '误报 ✗（门禁过严）' : '放过 ✓');
  console.log((ok ? '  ✓ ' : '  ✗ ') + verdict + '  ' + c.id + '  [' + c.note + ']');
  if (!restored) console.log('      !!! 还原失败，请手工 git checkout 该文件 !!!');
  if (ev && (caught !== wantCaught)) console.log('      ' + ev);
}

const after = [[G_HARDCODE, '防写死门禁'], [G_COMPONENT, '组件层体检']].map(([g, l]) => l + '=' + (runGate(g).code === 0 ? '绿' : '红'));
console.log('\n还原后复跑：' + after.join('  '));
console.log(fail === 0 ? '门禁自检：' + CASES.length + ' 条全部符合预期 ✓（正例能拦、反例不冤枉）'
  : '门禁自检：' + fail + ' 条不符合预期 ✗');
process.exit(fail === 0 ? 0 : 1);

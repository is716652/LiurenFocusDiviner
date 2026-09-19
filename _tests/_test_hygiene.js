/**
 * _test_hygiene.js —— 代码卫生门禁（无用 import）
 * ----------------------------------------------------------------------------
 * 为什么需要：本轮靠一次性审计才发现 2 处无用 import（EntryAbility 的 ConfigurationConstant、
 *   PayGate 的 PayProduct）。没有门禁，它们还会再长出来 —— 而无用 import 会让读者以为
 *   "这个依赖还在用"，属于典型二义性。
 * 判定：每个 .ets 的 import 名单里，逐个名字在**该文件其它位置**（排除 import 行本身）是否出现。
 *   出现 ⇒ 在用；不出现 ⇒ 无用，判失败。
 * 已知边界（诚实声明）：这是**词法**判定，不解析类型/作用域。若某名字只在注释里出现，会被算作"在用"（漏报），
 *   但不会误报 —— 宁可漏报也不误伤。扫描面＝主版 .ets（免费版是拷贝，随主版一起过门禁）。
 * 用法：node _tests/_test_hygiene.js [--report]
 */
'use strict';
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');
const ETS = path.join(ROOT, 'APP/LiurenFocusDiviner/entry/src/main/ets');
const REPORT = process.argv.includes('--report');

function walk(d, out = []) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else if (/\.ets$/.test(e.name)) out.push(p); } return out; }

const hits = [];
let scanned = 0, imports = 0;
for (const f of walk(ETS)) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/').replace('APP/LiurenFocusDiviner/entry/src/main/ets/', '');
  const lines = fs.readFileSync(f, 'utf-8').split(/\r?\n/);
  scanned++;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    /* 只认静态 import：import [type] { A, B as C } from '...' / import X from '...' / import * as N from '...' */
    let names = [];
    const named = l.match(/^\s*import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+/);
    const def = l.match(/^\s*import\s+([A-Za-z_$][\w$]*)\s+from\s+/);
    const ns = l.match(/^\s*import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+/);
    if (named) names = named[1].split(',').map((x) => x.trim()).filter(Boolean).map((x) => x.split(/\s+as\s+/).pop().trim());
    else if (def) names = [def[1]];
    else if (ns) names = [ns[1]];
    else continue;
    imports += names.length;
    const rest = lines.filter((_, k) => k !== i).join('\n');
    for (const n of names) {
      if (!n) continue;
      const rx = new RegExp('(?<![\\w$.])' + n.replace(/[$]/g, '\\$') + '(?![\\w$])');
      if (!rx.test(rest)) hits.push({ file: rel, line: i + 1, name: n });
    }
  }
}
console.log('无用 import 门禁：扫描 ' + scanned + ' 个 .ets、' + imports + ' 个导入名');
if (hits.length) {
  console.log('✗ 发现 ' + hits.length + ' 处 import 了但正文未用：');
  for (const h of hits.slice(0, 20)) console.log('   ' + h.file + ':' + h.line + '  ' + h.name);
  if (hits.length > 20) console.log('   …其余 ' + (hits.length - 20) + ' 处');
} else console.log('✓ 无无用 import');
if (REPORT) process.exit(0);
process.exit(hits.length ? 1 : 0);

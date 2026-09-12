/* 临时脚本：跑全部 _tests/_test_*.js 并汇总（用完即删） */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const dir = path.join(ROOT, '_tests');
const files = fs.readdirSync(dir).filter((f) => /^_test_.*\.js$/.test(f)).sort();
const seen = process.argv[2] ? new RegExp(process.argv[2]) : null;
let bad = 0;
const failed = [];
for (const f of files) {
  if (seen && !seen.test(f)) continue;
  const t0 = Date.now();
  let out = '', code = 0;
  try {
    out = execFileSync(process.execPath, [path.join(dir, f)], { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    code = e.status === undefined ? -1 : e.status;
    out = String(e.stdout || '') + String(e.stderr || '');
  }
  const tail = out.trim().split('\n').slice(-1)[0] || '';
  const sec = ((Date.now() - t0) / 1000).toFixed(1);
  if (code !== 0) { bad++; failed.push(f); console.log('FAIL  ' + f.padEnd(34) + ' exit=' + code + '  (' + sec + 's)  ' + tail.slice(0, 110)); }
  else console.log('ok    ' + f.padEnd(34) + '(' + sec + 's)  ' + tail.slice(0, 110));
}
console.log('\n== 共 ' + files.length + ' 个测试，失败 ' + bad + ' 个 ==');
if (failed.length) console.log('失败清单：' + failed.join(', '));
process.exit(bad === 0 ? 0 : 1);

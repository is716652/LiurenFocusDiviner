// 临时校验：加载 HTML 内联脚本并语法检查
const fs = require('fs');
const s = fs.readFileSync('UI/大六壬万年历起课.html', 'utf8');
const m = s.match(/<script>([\s\S]*?)<\/script>/);
const js = m[1];
try {
  new Function(js);
  console.log('JS SYNTAX OK, len=' + js.length);
} catch (e) {
  console.log('SYNTAX ERROR:', e.message);
  process.exit(1);
}
console.log('pickCustomZhi:', s.includes('function pickCustomZhi'));
console.log('tian clicks:', (s.match(/pickCustomZhi\(tz,"天盘"\)/g) || []).length);
console.log('di clicks:', (s.match(/pickCustomZhi\(z,"地盘"\)/g) || []).length);

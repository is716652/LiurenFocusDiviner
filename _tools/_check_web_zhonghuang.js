// Web 中黄补丁验证
const fs = require('fs');
const s = fs.readFileSync('UI/大六壬万年历起课.html', 'utf8');
const m = s.match(/<script>([\s\S]*?)<\/script>/);
try {
  new Function(m[1]);
  console.log('Web JS OK, len=' + m[1].length);
} catch (e) {
  console.log('SYNTAX ERROR:', e.message);
  process.exit(1);
}
console.log('zhMode:', s.includes('let zhMode'));
console.log('renderZhonghuang:', s.includes('function renderZhonghuang'));
console.log('lsZhonghuang div:', s.includes('id="lsZhonghuang"'));
console.log('zh_shiDun:', s.includes('zh_shiDun'));

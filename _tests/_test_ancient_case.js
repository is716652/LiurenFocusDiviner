/* 古籍案例验证：五月甲戌日 未将 卯时，妇人三十五岁占，申酉空
   验证 buildChartAncient 还原完整盘面：四课/三传/旬空/天将 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const coreSrc = fs.readFileSync(path.join(__dirname, '..', 'core', 'liuren-core.js'), 'utf-8');
vm.runInThisContext(coreSrc, { filename: 'liuren-core.js' });

const R = 'D:/nutstore/HarmonyOS/GuoXue_Research/LargeLiuRen-Design/APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/rule';
const load = (f) => JSON.parse(fs.readFileSync(R + '/' + f, 'utf-8'));
LiurenCore.init({
  duxiang: { '旺衰休囚死': { '旺衰': load('旺衰休囚死.json')['旺衰'] }, '基础关系': load('基础关系.json') },
  shensha: { '神煞': load('神煞起法.json')['神煞'] },
  bifa: { '一百法': load('毕法赋一百法.json')['一百法'] }
});

let fail = 0;
const check = (name, cond, extra) => {
  if (!cond) { fail++; console.log('FAIL:', name, extra || ''); } else { console.log('OK  :', name); }
};

console.log('=== 案例：五月甲戌日 未将 卯时（妇人三十五岁占）===');
const c = LiurenCore.buildChartAncient('未', '甲', '戌', '卯');
if (!c) { console.log('FAIL: 起盘失败'); process.exit(1); }

console.log('\n--- 天地盘（月将未加卯时）---');
for (const z of LiurenCore.ZHI) {
  console.log('  地盘' + z + ' → 天盘' + c.tp[z]);
}
check('未加卯', c.tp['卯'] === '未');
check('申加辰', c.tp['辰'] === '申');
check('寅加戌', c.tp['戌'] === '寅');

console.log('\n--- 四课（右起第一课）---');
const kegs = c.kegs;
for (let i = 3; i >= 0; i--) {
  console.log('  第' + (i + 1) + '课: ' + kegs[i].x + ' / ' + kegs[i].s);
}
// 甲寄寅 → 干上=寅宫天盘=午
check('第一课 午/甲（干上=午）', kegs[0].x === '午' && kegs[0].s === '甲');
check('第二课 戌/午', kegs[1].x === '戌' && kegs[1].s === '午');
check('第三课 寅/戌（支上=寅）', kegs[2].x === '寅' && kegs[2].s === '戌');
check('第四课 午/寅', kegs[3].x === '午' && kegs[3].s === '寅');

console.log('\n--- 旬空 ---');
console.log('  旬空: ' + c.dx.xunkong.join(''));
check('旬空=申酉（案例"申酉空"）', c.dx.xunkong.indexOf('申') >= 0 && c.dx.xunkong.indexOf('酉') >= 0);

console.log('\n--- 三传（九宗门）---');
console.log('  课体: ' + (c.sanchuan.keti || '普通课'));
c.sanchuan.chuans.forEach((ch, i) => {
  console.log('  ' + ['初传', '中传', '末传'][i] + ': ' + ch.gz + ' 乘' + c.jiangMap[LiurenCore.gongOf(c.tp, ch.z)]);
});

console.log('\n--- 天将 ---');
console.log('  贵人: ' + c.gui + ' 落' + LiurenCore.gongOf(c.tp, c.gui) + '宫 ' + (c.shun ? '顺布' : '逆布'));
const jm = [];
for (const z of LiurenCore.ZHI) {
  jm.push(z + ':' + c.jiangMap[z]);
}
console.log('  ' + jm.join(' '));

console.log('\n--- 中黄先锋链路 ---');
const ana = LiurenCore.zhonghuangAnalyze(c, '卯');
console.log('  时干(甲日卯时): ' + ana.dun.shiGan);
console.log('  变干: ' + ana.dun.bianGan + '(' + ana.bianGong + '宫)' + (ana.bianJiang ? ' 乘' + ana.bianJiang : '') + ' 为日干之' + ana.bianLq);
console.log('  变化宫: ' + (ana.changed.length ? ana.changed.join('') : '无'));

console.log(fail === 0 ? '\nALL PASS' : '\nFAILED: ' + fail);
process.exit(fail === 0 ? 0 : 1);

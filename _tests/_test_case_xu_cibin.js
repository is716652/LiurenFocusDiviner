/* 古籍案例回归：七月 甲子日 午将 申时 占来意（徐次宾）
   原文断：来意因西南上紧速追捕一盗，坠马折伤右足，感风七日而殒。
   本测试只锁定“排盘/中黄/盘态”硬事实；来意读象规则（先锋门/方位/数目/风煞/救神）见末尾 TODO。 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.join(__dirname, '..');
const coreSrc = fs.readFileSync(path.join(root, 'core', 'liuren-core.js'), 'utf-8');
vm.runInThisContext(coreSrc, { filename: 'liuren-core.js' });

const R = path.join(root, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'resources', 'rawfile', 'rule');
const load = (f) => JSON.parse(fs.readFileSync(path.join(R, f), 'utf-8'));
LiurenCore.init({
  duxiang: {
    '旺衰休囚死': { '旺衰': load('旺衰休囚死.json')['旺衰'] },
    '十二宫气机点': load('十二宫气机点.json'),
    '空亡规则': load('空亡规则.json'),
    '助日规则': load('助日规则.json'),
    '基础关系': load('基础关系.json')
  },
  shensha: { '神煞': load('神煞起法.json')['神煞'] },
  bifa: { '一百法': load('毕法赋一百法.json')['一百法'] }
});

let fail = 0;
const check = (name, cond, extra) => {
  if (!cond) { fail++; console.log('FAIL:', name, extra || ''); } else { console.log('OK  :', name); }
};
const gongOf = (c, z) => LiurenCore.gongOf(c.tp, z);

console.log('=== 徐次宾案例：七月 甲子日 午将 申时 占来意 ===');
const c = LiurenCore.buildChartAncient('午', '甲', '子', '申', '', '', '申');
check('起盘成功', !!c);
if (!c) { process.exit(1); }

console.log('天盘: ' + LiurenCore.ZHI.map(z => z + '→' + c.tp[z]).join(' '));
console.log('四课: ' + c.kegs.map((k, i) => '课' + (i + 1) + ':' + k.x + '/' + k.s).join(' '));
console.log('三传: ' + c.sanchuan.chuans.map(x => x.gz + '乘' + c.jiangMap[gongOf(c, x.z)] + '@' + gongOf(c, x.z)).join(' → '));

/* 排盘硬事实 */
check('午将加申时（地盘申→天盘午）', c.tp['申'] === '午');
check('天盘子宫=戌（初传戌临子）', c.tp['子'] === '戌');
check('四课 子/甲 戌/子 戌/子 申/戌',
  c.kegs[0].x === '子' && c.kegs[0].s === '甲' &&
  c.kegs[1].x === '戌' && c.kegs[1].s === '子' &&
  c.kegs[2].x === '戌' && c.kegs[2].s === '子' &&
  c.kegs[3].x === '申' && c.kegs[3].s === '戌');
check('三传=戌申午', c.sanchuan.chuans.map(x => x.z).join('') === '戌申午');
check('三传遁干=甲戌/壬申/庚午', c.sanchuan.chuans.map(x => x.gz).join('/') === '甲戌/壬申/庚午');
check('初传戌乘玄武（财逢玄武=盗）', c.sanchuan.chuans[0].z === '戌' && c.jiangMap[gongOf(c, '戌')] === '玄武');
check('中传申乘白虎（传送带白虎=坠马/风）', c.sanchuan.chuans[1].z === '申' && c.jiangMap[gongOf(c, '申')] === '白虎');
check('末传午乘青龙（胜光火，秋囚死不论救）', c.sanchuan.chuans[2].z === '午' && c.jiangMap[gongOf(c, '午')] === '青龙');
check('旬空=戌亥（戌为足而空，古断仍取折足）', c.dx.xunkong.indexOf('戌') >= 0 && c.dx.xunkong.indexOf('亥') >= 0);
check('甲木七月=死，申金=旺（死木被旺金克）', c.dx.dayWangShuai === '死' && c.dx.nodes['申'].wangShuai === '旺');
check('午火七月=囚/死地（末传不作救神）', c.dx.nodes['午'].wangShuai === '囚' || c.dx.nodes['午'].wangShuai === '死');
check('昼占申时，贵人丑顺布', c.night === false && c.gui === '丑' && c.shun === true);

/* 中黄先锋链路：把“申时”译成引擎可读信号 */
const a = LiurenCore.zhonghuangAnalyze(c, '申');
console.log('中黄: 时干' + a.dun.shiGan + ' 变干' + a.dun.bianGan + '@' + a.bianGong + '宫 六亲' + a.bianLq + ' 入传' + (a.bianInChuan || '否'));
check('时干=壬（甲日申时）', a.dun.shiGan === '壬');
check('变干=戊落申宫（先锋门带财象）', a.dun.bianGan === '戊' && a.bianGong === '申');
check('变干戊为甲木妻财，且入中传', a.bianLq === '妻财' && String(a.bianInChuan).indexOf('中') >= 0);

/* TODO（读象引擎待补规则，当前不断言，只作验收锚点）：
   1) 先锋门：占时申=西南/传送/急动；七月申金旺，为风煞/刑杀。
   2) 事类：初传戌=日干之财，乘玄武=盗贼；财入盗手故“追捕一盗”。
   3) 过程：中传申=白虎+传送，旺金克死木=坠马；戌为足、临日支子之侧，伤右足。
   4) 转归：末传午=胜光火，七月囚死，不能制金救木。
   5) 应期：申数七；第七日庚午，庚再克甲、午火休囚不救，故七日殒。 */

console.log(fail === 0 ? '\nALL PASS' : '\nFAILED: ' + fail);
process.exit(fail === 0 ? 0 : 1);

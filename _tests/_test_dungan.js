/* 遁干口径 · 传本锚点校验（2026-09-10）
   口径依据：
     · 大六壬文档/古籍原文-易藏-术数/六壬集成五要权衡--佚名「遁干」：
       "须用旬遁……旬遁方有空亡，斯有断桥折腰及传不行、初空看中传诸格；若用时遁无空亡，并无此等格矣。"
     · 大六壬文档/中黄五变经/中黄五变经研读整理.md：「传统六壬用旬遁」；
       「旬遁＝三传/盘面配干（标准六壬）＝传统层」。
     · 中黄经自序（经文/0.序.md）："一般六壬演课中的天干均以日干支的旬遁来排，
       而《中黄经》却以日干及时干再演一次，五鼠遁来排天干"。
   规则：
     默认「旬遁」＝三传/盘面配干（传统层）；旬外二支为旬空，**本旬无干（留空）**；
     中黄层另有 dun（日干遁·体）与 dunShi（时干遁·用），仅供中黄双干与宫情。
   传本锚点：
     · 壬占汇选 035（丙寅日）：三传子未寅 → 甲子/辛未/丙寅
     · 壬占汇选 046（丁卯日）：三传巳戌卯 → 己巳/戌(空无干)/丁卯
     · 壬占汇选 052（戊辰日）：三传子申辰 → 甲子/壬申/戊辰
     · 六壬断案 001（己卯日）：三传巳戌卯 → 辛巳/甲戌/己卯
     · 中黄经文18（乙未日）：三传亥寅巳 → 己亥/壬寅/巳(空无干)，经文课式栏作「己、壬、（原阙）」
     · 中黄经文13（庚子日）：课式表用日干遁 → 辛巳/丙戌/己卯（case dunKouJing=rigan） */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.join(__dirname, '..');
vm.runInThisContext(fs.readFileSync(path.join(root, 'core', 'liuren-core.js'), 'utf-8'), { filename: 'liuren-core.js' });
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

/* ---------- 1. 旬遁表结构：旬内十支有干，旬外二支无干 ---------- */
console.log('--- 旬遁表 ---');
{
  const t = LiurenCore.xunDun('丙', '寅'); /* 甲子旬：戌亥空 */
  const gan = Object.keys(t).filter((z) => t[z] !== '');
  const kong = Object.keys(t).filter((z) => t[z] === '');
  check('丙寅日属甲子旬：子遁甲、申遁壬、寅遁丙', t['子'] === '甲' && t['申'] === '壬' && t['寅'] === '丙', JSON.stringify(t));
  check('旬外二支无干（戌、亥）', kong.length === 2 && kong.indexOf('戌') >= 0 && kong.indexOf('亥') >= 0, kong.join(''));
  check('表覆盖十二支', Object.keys(t).length === 12 && gan.length === 10);
  const t2 = LiurenCore.xunDun('乙', '未'); /* 甲午旬：辰巳空 */
  check('乙未日属甲午旬：亥遁己、寅遁壬、巳无干',
    t2['亥'] === '己' && t2['寅'] === '壬' && t2['巳'] === '' && t2['辰'] === '', JSON.stringify(t2));
}

/* ---------- 2. 传本三传遁干锚点 ---------- */
console.log('\n--- 传本锚点（三传遁干）---');
const ANCHORS = [
  ['汇选035 丙寅日申将丑时（运本课式图 甲子·辛未·丙寅）', '申', '丙', '寅', '丑', '甲子/辛未/丙寅', 'xun'],
  ['汇选046 丁卯日卯将戌时（课式图 己巳·戌·丁卯，戌空）', '卯', '丁', '卯', '戌', '己巳/戌/丁卯', 'xun'],
  ['汇选052 戊辰日酉将丑时（课式图 甲子·壬申·戊辰）', '酉', '戊', '辰', '丑', '甲子/壬申/戊辰', 'xun'],
  ['断案001 己卯日寅将酉时（课式图 辛巳·甲戌·己卯）', '寅', '己', '卯', '酉', '辛巳/甲戌/己卯', 'xun'],
  ['经文18 乙未日丑将卯时（课式栏 己、壬、（原阙））', '丑', '乙', '未', '卯', '己亥/壬寅/巳', 'xun'],
  ['经文13 庚子日丑将申时（课式表用日干遁 辛、丙）', '丑', '庚', '子', '申', '辛巳/丙戌/己卯', 'rigan']
];
for (const [name, mj, dg, dz, hour, want, kou] of ANCHORS) {
  const c = LiurenCore.buildChartAncient(mj, dg, dz, hour, '', '', '');
  const table = kou === 'rigan' ? c.dun : c.dunXun;
  const gz = c.sanchuan.chuans.map((x) => (table[x.z] || '') + x.z).join('/');
  check(name + ' → ' + gz, gz === want, '期望 ' + want + '，实际 ' + gz);
}

/* ---------- 3. 空亡可见性：旬遁下空亡支无干 ---------- */
console.log('\n--- 空亡可见性 ---');
{
  const c = LiurenCore.buildChartAncient('丑', '乙', '未', '卯', '', '', ''); /* 经文18：辰巳空，末传巳 */
  check('空亡支落传时 gz 只余地支（巳）', c.sanchuan.chuans[2].egz === undefined && c.sanchuan.chuans[2].gz === '巳', c.sanchuan.chuans[2].gz);
  check('非空亡传支仍带干（己亥、壬寅）', c.sanchuan.chuans[0].gz === '己亥' && c.sanchuan.chuans[1].gz === '壬寅');
  check('旬空表与旬遁表一致（辰巳空 ⇔ 辰巳无干）',
    c.dx.xunkong.join('') === '辰巳' && c.dunXun['辰'] === '' && c.dunXun['巳'] === '');
}

/* ---------- 4. 中黄层仍为五鼠遁（日干遁/时干遁） ---------- */
console.log('\n--- 中黄层（体/用）保留 ---');
{
  const c = LiurenCore.buildChartAncient('丑', '丙', '寅', '戌', '', '', '子'); /* 丙寅日 */
  check('dun（日干遁·体）仍在：丙日申遁丙', c.dun['申'] === '丙', c.dun['申']);
  check('dunXun（旬遁·传统层）：丙寅日申遁壬', c.dunXun['申'] === '壬', c.dunXun['申']);
  const a = LiurenCore.zhonghuangAnalyze(c, '戌');
  check('时干遁（用）仍由五鼠遁起：丙日戌时得戊', a.dun.shiGan === '戊', a.dun.shiGan);
}

/* ---------- 5. 实时起盘（buildChart）与抓用神动态三传同口径 ---------- */
console.log('\n--- 实时起盘 / 抓用神 ---');
{
  const cal = JSON.parse(fs.readFileSync(path.join(root, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'resources', 'rawfile', 'cal', 'cal_2020.json'), 'utf-8'));
  const yjAll = JSON.parse(fs.readFileSync(path.join(root, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'resources', 'rawfile', 'cal', 'yj_all.json'), 'utf-8'));
  const c = LiurenCore.buildChart({ date: '2026-01-01', hourZhi: '子', calData: { '2026': cal['2026'] }, yjAll: yjAll });
  check('实时盘带 dunXun（旬遁表）', !!c && !!c.dunXun && Object.keys(c.dunXun).length === 12);
  const table = c.dunXun;
  const ok = c.sanchuan.chuans.every((x) => x.gz === (table[x.z] || '') + x.z);
  check('实时盘三传 gz = 旬遁（' + c.sanchuan.chuans.map((x) => x.gz).join('/') + '）', ok);
  const dt = YongShenCore.dongtai(c, c.sanchuan.chuans[0].z);
  const okdt = dt.every((it) => it.gz === (table[it.zhi] || '') + it.zhi);
  check('抓用神动态三传 gz 同用旬遁（' + dt.map((x) => x.gz).join('/') + '）', okdt);
}

console.log(fail === 0 ? '\nALL PASS' : '\nFAILED: ' + fail);
process.exit(fail === 0 ? 0 : 1);

/* 古籍案例鉴赏批量反验
 * 数据源：APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/ancient/case_gallery.json
 * 方式：对每个案例 input 调 LiurenCore.buildChartAncient() 现场复算，与 expect 部分字段比对。
 * 说明：expect 允许只写部分字段；写了就必须一致。kegs 用引擎顺序（课1..课4），UI 展示时再右起排列。
 */
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

const galleryPath = path.join(root, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'resources', 'rawfile', 'ancient', 'case_gallery.json');
const cases = JSON.parse(fs.readFileSync(galleryPath, 'utf-8'));

let fail = 0;
const bad = (name, extra) => { fail++; console.log('FAIL:', name, extra || ''); };
const ok = (name) => { console.log('OK  :', name); };
const eqArr = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const gongOf = (c, z) => LiurenCore.gongOf(c.tp, z);
const hasPaidWord = (s) => /付费|解锁|会员|VIP|价格|购买/.test(s);

if (!Array.isArray(cases) || cases.length === 0) {
  bad('case_gallery.json 非空数组');
  process.exit(1);
}

const ids = {};
for (const item of cases) {
  console.log('\n=== ' + item.id + ' | ' + item.title + ' ===');
  if (!item.id || ids[item.id]) { bad('id 唯一非空', item.id); } else { ids[item.id] = true; ok('id 唯一'); }
  if (!item.title || !item.source || !item.chapter) { bad('基础字段 title/source/chapter'); } else { ok('基础字段'); }
  if (!item.input || !item.input.mj || !item.input.dg || !item.input.dz || !item.input.hour) {
    bad('input 缺 mj/dg/dz/hour');
    continue;
  }
  const inp = item.input;
  const c = LiurenCore.buildChartAncient(
    inp.mj,
    inp.dg,
    inp.dz,
    inp.hour,
    inp.yearGan ? inp.yearGan : '',
    inp.yearZhi ? inp.yearZhi : '',
    inp.monthZhi ? inp.monthZhi : ''
  );
  if (!c) { bad('buildChartAncient 起盘失败'); continue; }
  ok('起盘成功');

  const e = item.expect || {};
  const actualKegs = c.kegs.map(k => k.x + '/' + k.s);
  const actualChuans = c.sanchuan.chuans.map(x => x.z);
  const actualGz = c.sanchuan.chuans.map(x => x.gz);
  const actualJiang = actualChuans.map(z => c.jiangMap[gongOf(c, z)] || '');

  if (e.kegs && !eqArr(actualKegs, e.kegs)) { bad('四课', '实际=' + actualKegs.join(' ') + ' 期望=' + e.kegs.join(' ')); } else if (e.kegs) { ok('四课'); }
  if (e.chuans && !eqArr(actualChuans, e.chuans)) { bad('三传', '实际=' + actualChuans.join('') + ' 期望=' + e.chuans.join('')); } else if (e.chuans) { ok('三传'); }
  if (e.chuanGz && !eqArr(actualGz, e.chuanGz)) { bad('三传遁干', '实际=' + actualGz.join('/') + ' 期望=' + e.chuanGz.join('/')); } else if (e.chuanGz) { ok('三传遁干'); }
  if (e.chuanJiang && !eqArr(actualJiang, e.chuanJiang)) { bad('三传天将', '实际=' + actualJiang.join('/') + ' 期望=' + e.chuanJiang.join('/')); } else if (e.chuanJiang) { ok('三传天将'); }
  if (e.xunkong && !eqArr(c.dx.xunkong, e.xunkong)) { bad('旬空', '实际=' + c.dx.xunkong.join('') + ' 期望=' + e.xunkong.join('')); } else if (e.xunkong) { ok('旬空'); }
  if (e.dayWangShuai && c.dx.dayWangShuai !== e.dayWangShuai) { bad('日干旺衰', '实际=' + c.dx.dayWangShuai + ' 期望=' + e.dayWangShuai); } else if (e.dayWangShuai) { ok('日干旺衰'); }
  if (e.monthZhi) {
    const inMz = inp.monthZhi ? inp.monthZhi : '';
    if (inMz !== e.monthZhi) { bad('月令', 'input.monthZhi=' + inMz + ' 期望=' + e.monthZhi); } else { ok('月令'); }
  }
  if (e.method && c.sanchuan.method !== e.method) { bad('宗门法', '实际=' + c.sanchuan.method + ' 期望=' + e.method); } else if (e.method) { ok('宗门法'); }
  if (e.keti && c.sanchuan.keti !== e.keti) { bad('课体', '实际=' + c.sanchuan.keti + ' 期望=' + e.keti); } else if (e.keti) { ok('课体'); }

  if (e.zhonghuang) {
    const a = LiurenCore.zhonghuangAnalyze(c, inp.hour);
    if (!a) { bad('中黄分析失败'); } else {
      const z = e.zhonghuang;
      if (z.shiGan && a.dun.shiGan !== z.shiGan) { bad('中黄时干', '实际=' + a.dun.shiGan + ' 期望=' + z.shiGan); } else if (z.shiGan) { ok('中黄时干'); }
      if (z.bianGan && a.dun.bianGan !== z.bianGan) { bad('中黄变干', '实际=' + a.dun.bianGan + ' 期望=' + z.bianGan); } else if (z.bianGan) { ok('中黄变干'); }
      if (z.bianGong && a.bianGong !== z.bianGong) { bad('中黄变干落宫', '实际=' + a.bianGong + ' 期望=' + z.bianGong); } else if (z.bianGong) { ok('中黄变干落宫'); }
      if (z.bianLq && a.bianLq !== z.bianLq) { bad('中黄变干六亲', '实际=' + a.bianLq + ' 期望=' + z.bianLq); } else if (z.bianLq) { ok('中黄变干六亲'); }
      if (Object.prototype.hasOwnProperty.call(z, 'bianInChuan') && String(a.bianInChuan || '') !== String(z.bianInChuan || '')) {
        bad('中黄入传', '实际=' + String(a.bianInChuan || '') + ' 期望=' + String(z.bianInChuan || ''));
      } else if (Object.prototype.hasOwnProperty.call(z, 'bianInChuan')) { ok('中黄入传'); }
    }
  }

  /* 证据链（可选）：写了就必须能锚到复算盘 */
  if (item.reasoning) {
    const routes = { base: true, duxiang: true, zhonghuang: true, yongshen: true, bifa: true };
    let rBad = 0;
    const zhiSet = { 子: 1, 丑: 1, 寅: 1, 卯: 1, 辰: 1, 巳: 1, 午: 1, 未: 1, 申: 1, 酉: 1, 戌: 1, 亥: 1 };
    for (const r of item.reasoning) {
      if (!r.claim || !routes[r.route] || !Array.isArray(r.evidence) || r.evidence.length === 0) {
        rBad++;
        continue;
      }
      for (const ev of r.evidence) {
        if (!ev.view || !ev.kind || !ev.ref || !ev.why) { rBad++; continue; }
        if (ev.kind === 'chuan') {
          if (ev.pos) {
            const idx = ev.pos === '初传' ? 0 : (ev.pos === '中传' ? 1 : 2);
            if (actualChuans[idx] !== ev.ref) { rBad++; }
          } else if (actualChuans.indexOf(ev.ref) < 0) { rBad++; }
        } else if (ev.kind === 'jiang') {
          const parts = ev.ref.split('/');
          const zi = parts[0];
          const jj = parts[1] || '';
          const idx = actualChuans.indexOf(zi);
          if (idx < 0 || (jj !== '' && actualJiang[idx] !== jj)) { rBad++; }
        } else if (ev.kind === 'hour') {
          if (ev.ref !== inp.hour) { rBad++; }
        } else if (ev.kind === 'gong' || ev.kind === 'zhi') {
          if (!zhiSet[ev.ref]) { rBad++; }
        } else if (ev.kind === 'shiGan' || ev.kind === 'bianGan') {
          const a = LiurenCore.zhonghuangAnalyze(c, inp.hour);
          const vv = ev.kind === 'shiGan' ? (a ? a.dun.shiGan : '') : (a ? a.dun.bianGan : '');
          if (vv !== ev.ref) { rBad++; }
        }
      }
    }
    if (rBad > 0) { bad('证据链锚点', 'bad=' + rBad); } else { ok('证据链锚点'); }
  }

  const text = [item.title, item.original, item.summary, (item.chain || []).join(' '), item.compliance].join(' ');
  if (!item.original || !item.summary || !Array.isArray(item.chain) || item.chain.length === 0) { bad('展示字段 original/summary/chain'); } else { ok('展示字段'); }
  if (!item.compliance || item.compliance.indexOf('研习参考') < 0 || item.compliance.indexOf('不构成') < 0) { bad('compliance 免责口径'); } else { ok('compliance 免责口径'); }
  if (hasPaidWord(text)) { bad('出现付费/解锁/会员字样'); } else { ok('无付费字样'); }
}

console.log(fail === 0 ? '\nALL PASS (' + cases.length + ' cases)' : '\nFAILED: ' + fail);
process.exit(fail === 0 ? 0 : 1);

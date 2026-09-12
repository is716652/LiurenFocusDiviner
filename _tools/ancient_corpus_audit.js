/* 古籍课例批量对账（把「连续几例都不对」变成可量化的通过率）
 * ----------------------------------------------------------------------------
 * 目的：验证引擎的定法部分（天地盘 / 四课 / 三传 / 天将）是否与古籍课例一致。
 * 做法：
 *   1) 从原文抽课例：日干支 + 占时（+ 月将，若原文直接给了支）+ 课式（四课、三传、将）；
 *   2) **用书上给的四课反推天地盘偏移**（offset = 干上神 − 日干寄宫），
 *      再由 月将 = 占时 + offset 反推月将 → 不必依赖原文「几月将」的歧义写法；
 *   3) 用该输入复算引擎，逐项比对：四课（课3/课4 为真检验）、三传、原文点名的天将；
 *   4) 输出通过率与逐条失败明细（便于区分「引擎错」与「书版排印错」）。
 *
 * 用法：node _tools/ancient_corpus_audit.js [--verbose] [--file <关键字>]
 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'core', 'liuren-core.js'), 'utf-8'), { filename: 'liuren-core.js' });
const R = path.join(ROOT, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'resources', 'rawfile', 'rule');
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

const Z = LiurenCore.ZHI;
const VERBOSE = process.argv.includes('--verbose');
const fileFilter = (() => { const i = process.argv.indexOf('--file'); return i >= 0 ? process.argv[i + 1] : null; })();
const isZhi = (c) => Z.indexOf(c) >= 0;
const isGan = (c) => '甲乙丙丁戊己庚辛壬癸'.indexOf(c) >= 0;
const JIANG = LiurenCore.JIANG_ORDER;
const jiangAt = (c, z) => c.jiangMap[LiurenCore.gongOf(c.tp, z)] || '';

let cases = 0, checked4 = 0, checked3 = 0, checkedJ = 0, fail4 = 0, fail3 = 0, failJ = 0;
const failures = [];

/** 由日干求寄宫 */
function jiGong(dg) { return LiurenCore.JI_GONG[dg]; }

/** 抽「四课」：返回 { up: [课1..课4 上神], down: [课1..课4 下神/干] } 或 null */
function parseSiKe(block) {
  /* markdown 表格：两行各 4 格 */
  const tbl = block.match(/\|\s*第四课[\s\S]{0,400}?\|\s*([子丑寅卯辰巳午未申酉戌亥])\s*\|\s*([子丑寅卯辰巳午未申酉戌亥])\s*\|\s*([子丑寅卯辰巳午未申酉戌亥])\s*\|\s*([子丑寅卯辰巳午未申酉戌亥])\s*\|/);
  if (tbl) {
    const up = [tbl[4], tbl[3], tbl[2], tbl[1]];             /* 表格是 课4←课1 排列 */
    const after = block.slice(tbl.index + tbl[0].length);
    const row2 = after.match(/\|\s*([子丑寅卯辰巳午未申酉戌亥])\s*\|\s*([子丑寅卯辰巳午未申酉戌亥])\s*\|\s*([子丑寅卯辰巳午未申酉戌亥])\s*\|\s*([甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥])\s*\|/);
    if (row2) {
      const down = [row2[4], row2[3], row2[2], row2[1]];
      return { up: up, down: down };
    }
  }
  return null;
}

/** 抽「三传」：markdown 表格 初/中/末 行 */
function parseSanChuan(block) {
  const idx = block.indexOf('三传');
  if (idx < 0) return null;
  const tail = block.slice(idx, idx + 500);
  const rows = [...tail.matchAll(/\|\s*(初|中|末)\s*\|\s*([子丑寅卯辰巳午未申酉戌亥])\s*\|/g)];
  if (rows.length < 3) return null;
  const map = { 初: '', 中: '', 末: '' };
  rows.forEach((r) => { map[r[1]] = r[2]; });
  return [map.初, map.中, map.末];
}

/** 抽原文点名的天将（如「初传青龙」「将螣蛇为初传」「末传白虎」「酉作后发用」） */
function parseNamedJiang(text) {
  const out = [];
  const re = /(初传|中传|末传|发用)\s*(?:为|作|乘|是)?\s*(贵人|螣蛇|腾蛇|朱雀|六合|勾陈|青龙|天空|白虎|太常|玄武|太阴|天后)/g;
  let m;
  while ((m = re.exec(text))) out.push({ pos: m[1], jiang: m[2] === '腾蛇' ? '螣蛇' : m[2] });
  const re2 = /(贵人|螣蛇|腾蛇|朱雀|六合|勾陈|青龙|天空|白虎|太常|玄武|太阴|天后)\s*(?:为|作)?\s*(初传|中传|末传|发用)/g;
  while ((m = re2.exec(text))) out.push({ pos: m[2], jiang: m[1] === '腾蛇' ? '螣蛇' : m[1] });
  return out;
}

/* ==================== 源 A：中黄经文（markdown 表格，干净） ==================== */
const jingDir = path.join(ROOT, '大六壬文档', '中黄五变经', '经文');
if (fs.existsSync(jingDir)) {
  for (const fn of fs.readdirSync(jingDir).filter((f) => f.endsWith('.md'))) {
    if (fileFilter && fn.indexOf(fileFilter) < 0) continue;
    const text = fs.readFileSync(path.join(jingDir, fn), 'utf-8');
    const heads = [...text.matchAll(/假令[^\n]{0,40}?([甲乙丙丁戊己庚辛壬癸])([子丑寅卯辰巳午未申酉戌亥])日([子丑寅卯辰巳午未申酉戌亥])时/g)];
    for (let i = 0; i < heads.length; i++) {
      const h = heads[i];
      const block = text.slice(h.index, i + 1 < heads.length ? heads[i + 1].index : text.length);
      const sk = parseSiKe(block);
      const sc = parseSanChuan(block);
      if (!sk) continue;
      cases++;
      const dg = h[1], dz = h[2], hour = h[3];
      const off = (Z.indexOf(sk.up[0]) - Z.indexOf(jiGong(dg)) + 24) % 12;   /* 由干上神反推偏移 */
      const mj = Z[(Z.indexOf(hour) + off) % 12];
      const c = LiurenCore.buildChartAncient(mj, dg, dz, hour, '', '', '');
      const tag = fn + ' #' + (i + 1) + ' ' + dg + dz + '日 ' + mj + '将 ' + hour + '时';
      /* 四课：课1 上神由构造决定；课2/3/4 为独立检验 */
      const eng = c.kegs.map((k) => k.x);
      const engDown = c.kegs.map((k) => k.s);
      let bad = [];
      for (let k = 1; k < 4; k++) {
        if (eng[k] !== sk.up[k]) bad.push('课' + (k + 1) + '上神 书=' + sk.up[k] + ' 引擎=' + eng[k]);
        if (sk.down[k] !== engDown[k]) bad.push('课' + (k + 1) + '下 书=' + sk.down[k] + ' 引擎=' + engDown[k]);
      }
      checked4++;
      if (bad.length) { fail4++; failures.push({ tag: tag, kind: '四课', why: bad.join('；') }); }
      /* 三传 */
      if (sc) {
        const eng3 = c.sanchuan.chuans.map((x) => x.z);
        checked3++;
        if (eng3.join('') !== sc.join('')) { fail3++; failures.push({ tag: tag, kind: '三传', why: '书=' + sc.join('') + ' 引擎=' + eng3.join('') }); }
      }
    }
  }
}

/* ==================== 源 B：六壬断案（文本课式） ==================== */
const duanAn = (() => {
  const dir = path.join(ROOT, '大六壬文档', '古籍原文-易藏-术数');
  if (!fs.existsSync(dir)) return null;
  for (const d of fs.readdirSync(dir)) {
    if (d.indexOf('断案') < 0) continue;
    const p = path.join(dir, d);
    for (const f of fs.readdirSync(p)) if (f.endsWith('.txt')) return path.join(p, f);
  }
  return null;
})();
if (duanAn && (!fileFilter || '断案'.indexOf(fileFilter) >= 0)) {
  const text = fs.readFileSync(duanAn, 'utf-8');
  /* 课例头：…日X将Y时 或 月将Y时 */
  const heads = [...text.matchAll(/([甲乙丙丁戊己庚辛壬癸])([子丑寅卯辰巳午未申酉戌亥])日\s*([子丑寅卯辰巳午未申酉戌亥])将([子丑寅卯辰巳午未申酉戌亥])时/g)];
  for (let i = 0; i < heads.length; i++) {
    const h = heads[i];
    const block = text.slice(h.index, i + 1 < heads.length ? heads[i + 1].index : Math.min(text.length, h.index + 3000));
    /* 课式：三传行形如「六亲 干支 将 初」 */
    const chuan = [...block.matchAll(/(?:^|\s)(?:[子丑寅卯辰巳午未申酉戌亥][\u4e00-\u9fa5]?)?([空]?[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]{1,2})\s+(贵人|螣蛇|腾蛇|朱雀|六合|勾陈|青龙|天空|白虎|太常|玄武|太阴|天后)\s*(初|中|末)/g)];
    if (chuan.length < 3) continue;
    cases++;
    const dg = h[1], dz = h[2], mj = h[3], hour = h[4];
    const c = LiurenCore.buildChartAncient(mj, dg, dz, hour, '', '', '');
    const tag = '断案 ' + dg + dz + '日 ' + mj + '将 ' + hour + '时';
    const byPos = {};
    chuan.forEach((r) => {
      let gz = r[1];
      const z = gz[gz.length - 1];
      byPos[r[3]] = { z: z, jiang: r[2] === '腾蛇' ? '螣蛇' : r[2] };
    });
    const book3 = [byPos.初, byPos.中, byPos.末];
    if (book3.some((x) => !x)) continue;
    const eng3 = c.sanchuan.chuans;
    checked3++;
    const bz = book3.map((x) => x.z).join('');
    const ez = eng3.map((x) => x.z).join('');
    if (bz !== ez) { fail3++; failures.push({ tag: tag, kind: '三传', why: '书=' + bz + ' 引擎=' + ez }); }
    else {
      /* 三传支一致时，再比三传乘将（定法，非用神） */
      const bj = book3.map((x) => x.jiang).join('/');
      const ej = eng3.map((x) => jiangAt(c, x.z)).join('/');
      checkedJ++;
      if (bj !== ej) { failJ++; failures.push({ tag: tag, kind: '三传天将', why: '书=' + bj + ' 引擎=' + ej }); }
    }
  }
}

/* ==================== 输出 ==================== */
console.log('古籍课例批量对账（引擎定法：四课 / 三传 / 天将）\n');
console.log('  抽到课例        ：' + cases);
console.log('  比对四课        ：' + checked4 + '  不符 ' + fail4);
console.log('  比对三传        ：' + checked3 + '  不符 ' + fail3);
console.log('  比对三传天将    ：' + checkedJ + '  不符 ' + failJ);
if (failures.length) {
  console.log('\n失败明细：');
  for (const f of failures) console.log('  [' + f.kind + '] ' + f.tag + '\n      ' + f.why);
} else {
  console.log('\n全部一致 ✓');
}
process.exit((fail4 + fail3 + failJ) === 0 ? 0 : 1);

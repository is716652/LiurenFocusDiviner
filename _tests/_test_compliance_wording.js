/* ============================================================================
 * _test_compliance_wording.js —— 合规措辞门禁（Agent.md §14 / 鉴定报告 §7）
 * ----------------------------------------------------------------------------
 * 目的：把「哪些词能随包发出」变成可执行断言，防止八字/占卜类语汇与"行动建议体"悄悄回流。
 *
 * 判据分三层（都基于事实，不搞一刀切）：
 *   C1 **硬禁（八字专有语汇）**：`八字 / 日柱 / 日主 / 命宫 / 十神 / 比肩 / 劫财 / 伤官 / 正官 / 大运`
 *      —— 这些词在六壬里没有合法用法；命中的表/文件必须整改或写进白名单并给出理由。
 *      注：`食神`（管辂体系的神煞名）、`正财/偏财`（占事体系的财之来源对照）、`七杀`（古籍亦有"杀"义）
 *      属**歧义词**，不作硬禁，只在报告里计数供人工过目（本门禁的第一次运行就靠这条避免了误杀古籍原文）。
 *   C2 **算命/占卜类词**：`算命 / 占卜 / 预测 / 灵验 / 开光 / 转运 / 消灾 / 改命 / 法事`
 *      —— UI 文案（排除免责/合规句）**零容忍**；随包表命中即失败（元数据说明字段也含在内）。
 *   C3 **出处纪律**：自编整理表（非传本）必须带 `元数据.来源`（或对应小节有来源），
 *      否则其结论词无从溯源 —— 缺失即失败。
 *
 * 白名单：`_tests/_data/compliance_whitelist.json` = [{ file, word, why }]，每条必须写理由（≥6 字）。
 * 用法：node _tests/_test_compliance_wording.js
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RULEDIR = path.join(ROOT, 'APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/rule');
const UI_ETS = path.join(ROOT, 'APP/LiurenFocusDiviner/entry/src/main/ets');
const WL = path.join(__dirname, '_data/compliance_whitelist.json');

/* 传本层：内容来自古籍（含本项目整理的原文段落），允许出现古籍用词 */
const TRADITION = ['毕法赋一百法.json', '管辂象意.json', '管辂类神取用.json', '课体课义.json', '神煞起法.json'];
/* 自编整理表：必须带 元数据.来源 */
const COMPILED = ['十二宫气机点.json', '空亡规则.json', '助日规则.json', '旺衰休囚死.json', '基础关系.json',
  '占事体系.json', '类象库.json', '行年打分.json', '毕法教练.json'];

/* 注：`比肩` 已从硬禁中移除 —— 本项目把「比肩」用作**六亲名**（引擎 palaceLookup 的 liuQin 即为
   「比肩/妻财/官鬼/子孙/父母」），属六壬本义用法，不是八字专有语汇（门禁首次运行误杀过它）。 */
const HARD = /八字|日柱|日主|命宫|十神|劫财|伤官|正官|大运/;
const OCCULT = /算命|占卜|预测|灵验|开光|转运|消灾|改命|法事/;
const AMBIG = /食神|正财|偏财|七杀/;
const EXEMPT_LINE = /不构成|仅供|参考|免责|合规|不提供|不作|不得|本软件/;

let FAIL = 0;
const ok = (m) => console.log('  ✓ ' + m);
const bad = (m) => { FAIL++; console.log('  ✗ ' + m); };
const head = (t) => console.log('\n' + t);

const whitelist = fs.existsSync(WL) ? JSON.parse(fs.readFileSync(WL, 'utf-8')) : [];
const waived = (file, word) => whitelist.some((w) => w.file === file && w.word === word && (w.why || '').length >= 6);

function walkStrings(o, p, out) {
  if (o && typeof o === 'object') {
    for (const k of Object.keys(o)) walkStrings(o[k], p + '.' + k, out);
  } else if (typeof o === 'string') {
    out.push([p, o]);
  }
  return out;
}

/* ---------------- C1 硬禁：八字专有语汇 ---------------- */
head('[C1] 八字专有语汇（硬禁；此类词在六壬无合法用法）');
{
  let hits = 0;
  for (const f of fs.readdirSync(RULEDIR).filter((x) => /\.json$/.test(x)).sort()) {
    const j = JSON.parse(fs.readFileSync(path.join(RULEDIR, f), 'utf-8'));
    for (const [p, s] of walkStrings(j, '', [])) {
      const m = s.match(new RegExp(HARD.source, 'g'));
      if (!m) { continue; }
      const words = Array.from(new Set(m));
      for (const w of words) {
        if (waived(f, w)) { continue; }
        hits++;
        if (hits <= 12) { bad(f + p + ' 出现「' + w + '」：' + s.slice(0, 80)); }
      }
    }
  }
  if (hits === 0) { ok('随包规则表中无八字专有语汇'); }
}

/* ---------------- C2 算命/占卜类词 ---------------- */
head('[C2] 算命/占卜类词：UI 零容忍；随包表命中即失败');
{
  const files = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { walk(p); } else if (/\.ets$/.test(e.name)) { files.push(p); }
    }
  })(UI_ETS);
  let ui = 0;
  for (const f of files) {
    const lines = fs.readFileSync(f, 'utf-8').split(/\r?\n/);
    lines.forEach((L, i) => {
      const m = L.match(OCCULT);
      if (!m || EXEMPT_LINE.test(L)) { return; }
      ui++;
      if (ui <= 8) { bad('UI ' + path.relative(ROOT, f) + ':' + (i + 1) + ' 出现「' + m[0] + '」：' + L.trim().slice(0, 90)); }
    });
  }
  if (ui === 0) { ok('UI 文案（排除免责/合规句）无算命占卜类词'); }
  let tb = 0;
  for (const f of fs.readdirSync(RULEDIR).filter((x) => /\.json$/.test(x)).sort()) {
    const t = fs.readFileSync(path.join(RULEDIR, f), 'utf-8');
    const m = t.match(new RegExp(OCCULT.source, 'g'));
    if (!m) { continue; }
    const words = Array.from(new Set(m));
    for (const w of words) {
      if (waived(f, w)) { continue; }
      tb++;
      bad('规则表 ' + f + ' 出现「' + w + '」（' + m.length + ' 处）');
    }
  }
  if (tb === 0) { ok('随包规则表无算命占卜类词'); }
}

/* ---------------- C3 出处纪律 ---------------- */
head('[C3] 自编整理表必须带出处（元数据.来源）');
{
  /* 出处可以写在表内（元数据.来源），也可以登记在表外（_tests/_data/compliance_provenance.json）——
     后者是不得已的对策：随包表的顶层键会被消费方遍历，注入未预期的键会改变行为（实测快照变化，已回退）。 */
  const REG = path.join(__dirname, '_data/compliance_provenance.json');
  const reg = fs.existsSync(REG) ? (JSON.parse(fs.readFileSync(REG, 'utf-8'))['表'] || {}) : {};
  let miss = 0;
  for (const f of COMPILED) {
    const p = path.join(RULEDIR, f);
    if (!fs.existsSync(p)) { continue; }
    const j = JSON.parse(fs.readFileSync(p, 'utf-8'));
    const meta = j['元数据'] || {};
    const inFile = meta['来源'] || j['来源'] || '';
    const outFile = reg[f] || '';
    const okSrc = (typeof inFile === 'string' && inFile.length >= 4) || (typeof outFile === 'string' && outFile.length >= 4);
    if (!okSrc) {
      miss++;
      bad(f + ' 无可溯出处（表内 元数据.来源 或表外登记 compliance_provenance.json 二者需有其一）');
    } else if (typeof outFile === 'string' && outFile.length >= 4 && (typeof inFile !== 'string' || inFile.length < 4)) {
      console.log('  · ' + f + '：出处登记在表外 → ' + outFile.slice(0, 40));
    }
  }
  if (miss === 0) { ok('自编整理表均有出处'); }
}

/* ---------------- 计数报告（歧义词，不判否） ---------------- */
head('[报告] 歧义词计数（食神/正财/偏财/七杀：古籍与六壬本义中亦有用，供人工过目）');
{
  const rows = [];
  for (const f of fs.readdirSync(RULEDIR).filter((x) => /\.json$/.test(x)).sort()) {
    const t = fs.readFileSync(path.join(RULEDIR, f), 'utf-8');
    const m = t.match(new RegExp(AMBIG.source, 'g'));
    if (m) { rows.push(f + ' × ' + m.length + '（' + Array.from(new Set(m)).join('、') + '）'); }
  }
  if (rows.length === 0) { console.log('  · 无'); } else { rows.forEach((r) => console.log('  · ' + r)); }
}

console.log('');
if (FAIL > 0) {
  console.log('合规措辞门禁：不通过 ✗（' + FAIL + ' 项）');
  process.exit(1);
}
console.log('合规措辞门禁：通过 ✓（无八字专有语汇、无算命占卜类词、自编表均有出处）');

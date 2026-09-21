/* 临时变异探针（v7，最终）：判定口径与主测试一致，且**从沙箱取数据**（不能从 JSON 读，
   否则变异注入在沙箱里、判定看的是 JSON 原文，会假报"失效" —— v6 的错误）。 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const ui = path.join(ROOT, 'UI');
const html = fs.readFileSync(path.join(ui, '壬案推演原型.html'), 'utf-8');
const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])[0];
function makeEl(id) {
  return { id, innerHTML: '', textContent: '', className: '', value: '', disabled: false, dataset: {}, style: {}, onclick: null,
    querySelectorAll: () => [], querySelector: () => makeEl(id + '>*'), prepend: () => {}, appendChild: () => {}, addEventListener: () => {} };
}
function boot() {
  const els = {};
  const documentStub = { getElementById: (id) => (els[id] || (els[id] = makeEl(id))), createElement: (t) => makeEl(t), querySelectorAll: () => [] };
  const sandbox = { window: {}, document: documentStub, console: { log: () => {}, warn: () => {}, error: () => {} }, Math, JSON, Object, Array, String, Number, RegExp, Date, isNaN, parseInt, parseFloat, Set, setTimeout: (fn) => fn() };
  sandbox.window.document = documentStub;
  vm.createContext(sandbox);
  const cal = fs.readdirSync(path.join(ui, '_data')).filter((x) => /^cal_\d{4}s\.js$/.test(x)).sort();
  const files = ['_data/duxiang_rules.js', '_data/duxiang_leixiang.js', '_data/shensha_rules.js', '_data/bifa.js', '_data/bifa_coach.js', '_data/xingnian_score.js']
    .concat(cal.map((f) => '_data/' + f)).concat(['_data/yj_all.js', '../core/liuren-core.js', '_data/ancient_case_gallery.js', '_data/case_story.js', '_data/ouyu_cases.js']);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(ui, f), 'utf-8'), sandbox, { filename: f });
  vm.runInContext(inline, sandbox, { filename: 'inline' });
  return sandbox;
}
function collectAll(sb) {
  let rounds = 0;
  const need = () => sb.oyuWhereList().length;
  while (sb.oyuState().found.length < need() && rounds < 6) {
    const before = sb.oyuState().found.length;
    for (const s of sb.oyuSurfaces()) sb.tryOuyuPick(s.cands, s.label);
    rounds++;
    if (sb.oyuState().found.length === before) break;
  }
  return sb.oyuState();
}
/* 与主测试同一口径；断语列表**取自沙箱**（oyuLinks），与变异注入的是同一对象 */
function judge(sb) {
  const box = sb.document.getElementById('ouyuBox').innerHTML || '';
  const m = box.match(/<div class="oyu-chain">([\s\S]*?)<\/div>\s*<div class="oyu-done"/);
  const chainHtml = m ? m[1] : '';
  const tails = sb.oyuTailPatterns().filter((t) => chainHtml.indexOf(t) >= 0);
  const hints = sb.oyuLinks().map((k) => ({ id: k.id, hint: k.hint }));
  const htmlLinks = hints.filter((h) => !sb.oyuHintClean(h.hint)).map((h) => h.id);
  return { tails, htmlLinks, caught: tails.length > 0 || htmlLinks.length > 0 };
}
function run(tag, mutate) {
  const sb = boot();
  sb.oyuOpen('ouyu_20260921_ditie');
  const st = collectAll(sb);
  if (mutate) { mutate(sb); sb.renderAll(); }
  const j = judge(sb);
  const verdict = mutate ? (j.caught ? '✔ 断言有效（被抓到）' : '✘ 断言失效') : (j.caught ? '✘ 对照异常' : '✔ 对照正确');
  console.log(tag + ' | 尾巴 ' + JSON.stringify(j.tails) + ' | 含标签的断语 ' + JSON.stringify(j.htmlLinks) + '  ' + verdict);
}
run('[对照]');
run('[变异1] （出自《…》）', (sb) => { sb.oyuLinks()[0].hint += '（出自《大六壬指南》四课三传）'; });
run('[变异2] （古籍研习参考）', (sb) => { sb.oyuLinks()[0].hint += '（古籍研习参考）'; });
run('[变异3] <details> 依据块', (sb) => { sb.oyuLinks()[0].hint += '<details><summary>依据</summary>X</details>'; });
run('[变异4] （仅供参考）', (sb) => { sb.oyuLinks()[0].hint += '（仅供参考）'; });
run('[变异5] <b>加粗</b>', (sb) => { sb.oyuLinks()[0].hint += '<b>重点</b>'; });
run('[变异6] （按九宗门法）', (sb) => { sb.oyuLinks()[0].hint += '（按九宗门法）'; });
run('[变异7] （见前文）', (sb) => { sb.oyuLinks()[0].hint += '（见前文）'; });

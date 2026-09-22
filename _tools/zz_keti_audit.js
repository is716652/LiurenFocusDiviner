/* ============================================================================
 * zz_keti_audit.js —— 《六壬直指御定》「局」的对账与研究工具（**只读**）
 * ----------------------------------------------------------------------------
 * 背景（详见 大六壬文档/案例剧情/素材地基-古籍语料普查与入库管线.md §5）
 *   《六壬直指御定》不是案例书，而是 **720 局（60 日干支 × 12 局）的断语库**，
 *   每条形如「甲子日第一局 干上寅 / 课体：伏吟，元胎。/ 课义：… / 解曰：… / 断曰：… / 分占类…」。
 *
 *   **关键口径：「局」不含占时，一局 ≠ 一课。**
 *   一局 = (日干支 + 干上神) = 天地盘的相对结构；由于只固定「月将 − 占时」这个差值，
 *   一局实际覆盖 **12 个具体课**：四课/三传/九宗门课体完全相同，**天将只有昼/夜两套**。
 *   所以做剧情时：**局＝骨架，时辰＝分支**（书里也自己分昼夜：「昼占…夜占…」）。
 *
 * 用法
 *   node _tools/zz_keti_audit.js                 # 全量对账：717 局的课体一致率与差异模式
 *   node _tools/zz_keti_audit.js 甲子            # 只跑某日干支（如 甲子）
 *   node _tools/zz_keti_audit.js --expand 甲 子 寅   # 把一局展开成 12 个具体课（§5.2 那张表）
 *   node _tools/zz_keti_audit.js --one 甲 子 子      # 打印该局原文 + 引擎复算（四课/三传/天地盘）
 *
 * 实测结论（2026-09-22，717 条）
 *   九宗门课体一致 656/716 = 91.6%；差异 51 条里 **40 条是同一模式**：
 *   引擎按《六壬指南》口径在多课同支时进「涉害」，直指御定记作「比用/重审/元首」（本例三传相同）。
 *   → 属**待人工审定的口径分歧**；这 717 条同时是现成的**课体回归测试集**。
 *
 * 注意
 *   · 原文用**全角空格**（\u3000）分隔「X日第N局」与「干上Y」，脚本已归一为半角再匹配。
 *   · 引擎的九宗门课体在 `sanchuan.method`（元首/重审/比用/涉害/遥克/昴星/别责/八专/伏吟/返吟）；
 *     `sanchuan.keti` 只在伏吟/返吟/八专/别责/昴星时有值 —— 早期只看 keti 会误判为"引擎没有课体"。
 *   · 原文「课体：」行除九宗门外还并列大量**课格名**（斩关/励德/元胎/间传/不备…），引擎无识别层，
 *     本工具只统计、不参与对账。
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const UI = path.join(ROOT, 'UI', '_data');
const sandbox = { window: {}, console: { log: () => {}, warn: () => {}, error: () => {} } };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
for (const f of ['duxiang_rules.js', 'duxiang_leixiang.js', 'shensha_rules.js', 'bifa.js',
  'bifa_coach.js', 'xingnian_score.js']) {
  const p = path.join(UI, f);
  if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf-8'), sandbox, { filename: f });
}
vm.runInContext(fs.readFileSync(path.join(ROOT, 'core', 'liuren-core.js'), 'utf-8')
  + '\nglobalThis.__CORE = LiurenCore;', sandbox, { filename: 'liuren-core.js' });
const C = sandbox.__CORE;
C.init({ duxiang: sandbox.window.DUXIANG_RULES, shensha: sandbox.window.SHENSHA_RULES,
  bifa: sandbox.window.BIFA, xingnian: sandbox.window.XN_SCORE });

const ZHI = C.ZHI;
const JIGONG = { 甲: '寅', 乙: '辰', 丙: '巳', 戊: '巳', 丁: '未', 己: '未', 庚: '申', 辛: '戌', 壬: '亥', 癸: '丑' };
const KUI = ['元首', '重审', '比用', '涉害', '遥克', '昴星', '别责', '八专', '伏吟', '返吟'];
const NUM = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 十一: 11, 十二: 12 };
const JU = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
const BOOK = path.join(ROOT,
  '大六壬文档/古籍原文-易藏-术数/六壬直指御定-清-佚名/六壬直指御定-清-佚名.txt');
const TXT = fs.readFileSync(BOOK, 'utf8').replace(/^\ufeff/, '').replace(/\u3000/g, ' ');

/* 九宗门归一：原文常用别名 —— 知一=比用、无依=返吟、始入=重审；
   涉害细分见机/察微/缀瑕/复等、遥克细分蒿矢/弹射 */
const normKeti = (s) => {
  const t = (s || '').split(/[，,、]/)[0].trim();
  if (/伏吟/.test(t)) return '伏吟';
  if (/返吟|反吟|无依/.test(t)) return '返吟';
  if (/元首/.test(t)) return '元首';
  if (/重审|始入/.test(t)) return '重审';
  if (/比用|知一/.test(t)) return '比用';
  if (/涉害|见机|察微|缀瑕|复等/.test(t)) return '涉害';
  if (/蒿矢|弹射|遥克/.test(t)) return '遥克';
  if (/昴星/.test(t)) return '昴星';
  if (/别责/.test(t)) return '别责';
  if (/八专/.test(t)) return '八专';
  return t;
};
const normEng = (s) => (s || '').split(/[·，,]/)[0];
const deltaOf = (dg, gs) => (ZHI.indexOf(gs) - ZHI.indexOf(JIGONG[dg]) + 12) % 12;

function expand(dg, dz, gs) {
  const delta = deltaOf(dg, gs);
  console.log('=== %s%s日 · 干上%s（差值 m-t = %d）展开为 12 个具体课 ===', dg, dz, gs, delta);
  console.log('占时 月将 昼夜 干上 九宗门       三传    贵人/顺逆  子乘  寅乘  申乘  卯乘');
  const rows = [];
  for (let t = 0; t < 12; t += 1) {
    const hour = ZHI[t];
    const c = C.buildChartAncient(ZHI[(t + delta) % 12], dg, dz, hour);
    if (!c) continue;
    const jz = (z) => c.jiangMap[C.gongOf(c.tp, z)] || '—';
    rows.push({ hour, mj: ZHI[(t + delta) % 12], night: c.night, gs: c.kegs[0].x,
      method: c.sanchuan.method, chuan: c.sanchuan.chuans.map((x) => x.z).join(''),
      kegs: c.kegs.map((k) => k.x + '/' + k.s).join(','),
      jz: jz('子'), jy: jz('寅'), js: jz('申'), jm: jz('卯'),
      cj: c.sanchuan.chuans.map((x) => jz(x.z)).join('/') });
    const r = rows[rows.length - 1];
    console.log('%s    %s    %s   %s   %s  %s   %s%s   %s  %s  %s  %s',
      r.hour, r.mj, r.night ? '夜' : '昼', r.gs, r.method.padEnd(8), r.chuan, '?',
      c.shun ? '顺' : '逆', r.jz, r.jy, r.js, r.jm);
  }
  const uniq = (f) => Array.from(new Set(rows.map(f)));
  console.log('\n--- 12 个课：不变量与变量 ---');
  console.log('干上神   : %s  %s', uniq((r) => r.gs).join(','), uniq((r) => r.gs).length === 1 ? '恒定' : '不恒定');
  console.log('三传     : %s  %s', uniq((r) => r.chuan).join(','), uniq((r) => r.chuan).length === 1 ? '恒定' : '多变');
  console.log('九宗门   : %d 种 %s', uniq((r) => r.method).length, uniq((r) => r.method).join('|'));
  console.log('四课     : %d 种', uniq((r) => r.kegs).length);
  console.log('昼夜     : %s', uniq((r) => (r.night ? '夜' : '昼')).join(','));
  console.log('天将(子乘): %s', uniq((r) => r.jz).join(' , '));
  console.log('三传乘将 : %s', uniq((r) => r.cj).join(' , '));
}

function one(dg, dz, gs) {
  console.log('=== 原文：%s%s日 · 干上%s ===', dg, dz, gs);
  for (let ju = 1; ju <= 12; ju += 1) {
    const key = dg + dz + '日第' + JU[ju] + '局 干上' + gs;
    const i = TXT.indexOf(key);
    if (i >= 0) {
      const j = TXT.indexOf(dg + dz + '日第', i + 10);
      console.log(TXT.slice(i, j > 0 ? j : i + 900).trim());
    }
  }
  const c = C.buildChartAncient(ZHI[deltaOf(dg, gs)], dg, dz, '子');
  console.log('\n=== 引擎复算 ===');
  console.log('四课(上/下):', c.kegs.map((k) => k.x + '/' + k.s).join('  '));
  console.log('三传       :', c.sanchuan.chuans.map((x) => x.z).join(''),
    '  method=', c.sanchuan.method, '  keti=', c.sanchuan.keti || '(空)');
  console.log('天地盘     :', ZHI.map((g) => g + '→' + c.tp[g]).join(' '));
}

function audit(only) {
  const re = /([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])日第(十一|十二|[一二三四五六七八九十])局\s*干上(\S)/g;
  const items = [];
  let m;
  while ((m = re.exec(TXT)) !== null) {
    if (only && m[1] !== only) continue;
    const km = /课体[：:]\s*([^\n]+)/.exec(TXT.slice(m.index, m.index + 120));
    items.push({ dgz: m[1], ju: NUM[m[2]], gs: m[3], keti: km ? km[1].trim() : '' });
  }
  let ok = 0; let hasKeti = 0; let onlyGe = 0; let gsOk = 0;
  const diff = new Map(); const extra = new Map(); const bad = [];
  for (const it of items) {
    const c = C.buildChartAncient(ZHI[deltaOf(it.dgz[0], it.gs)], it.dgz[0], it.dgz[1], '子');
    if (!c) continue;
    if (c.kegs[0].x === it.gs) gsOk += 1;
    const ek = normEng(c.sanchuan.method);
    if (!it.keti) continue;
    hasKeti += 1;
    const names = it.keti.split(/[，,、。]/).map((x) => normKeti(x.trim())).filter(Boolean);
    if (names.includes(ek)) ok += 1;
    else if (!names.some((n) => KUI.includes(n))) onlyGe += 1;
    else {
      const rk = names.find((n) => KUI.includes(n)) || names[0];
      diff.set(rk + ' → ' + ek, (diff.get(rk + ' → ' + ek) || 0) + 1);
      bad.push({ ...it, why: rk + ' → ' + ek, chuan: c.sanchuan.chuans.map((x) => x.z).join('') });
    }
    for (const part of it.keti.split(/[，,、。]/).map((x) => x.trim()).filter(Boolean)) {
      if (!KUI.includes(normKeti(part))) extra.set(part, (extra.get(part) || 0) + 1);
    }
  }
  console.log('条目数 %d（带课体行 %d）', items.length, hasKeti);
  console.log('干上神复算一致   : %d / %d（注：delta 由干上神反推，此项属循环验证，非独立证据）', gsOk, items.length);
  console.log('九宗门课体一致   : %d / %d = %s%%', ok, hasKeti, (ok / Math.max(1, hasKeti) * 100).toFixed(1));
  console.log('原文只写课格     : %d', onlyGe);
  console.log('课体口径不符     : %d', bad.length);
  console.log('\n差异模式（原文 → 引擎）:');
  Array.from(diff.entries()).sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log('   %s  ×%d', k.padEnd(16), v));
  console.log('\n原文课格名（引擎无识别层）top24:');
  Array.from(extra.entries()).sort((a, b) => b[1] - a[1]).slice(0, 24)
    .forEach(([k, v]) => console.log('   %s  %d', k.padEnd(8), v));
  if (bad.length) {
    console.log('\n差异清单（全 %d 条）:', bad.length);
    bad.forEach((b) => console.log('   %s日第%s局 干上%s  三传%s  %s', b.dgz, b.ju, b.gs, b.chuan, b.why));
  }
}

const a = process.argv.slice(2);
if (a[0] === '--expand') expand(a[1], a[2], a[3]);
else if (a[0] === '--one') one(a[1], a[2], a[3]);
else audit(a[0] || '');

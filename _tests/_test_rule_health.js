/* ============================================================================
 * _test_rule_health.js —— 数据健康模块的**运行期**断言（Agent.md §14.3）
 * ----------------------------------------------------------------------------
 * 与 `_test_ui_empty_state.js`（静态文本检查）分工：本脚本把
 * `model/RuleHealth.ets` 与 `model/ReasonText.ets` 用 tsc 转成 JS 真跑一遍，
 * 断言「摘要计数 / 三态可分 / 导出诊断内容 / 一次性提示 / 空态文案兜底」的实际行为，
 * 而不是只看源码里有没有写某句话。
 *
 * 做法：把 .ets 复制成 .ts、把 ArkTS 的 hilog import 换成桩，tsc 到临时目录后 require。
 * 临时目录每次运行重建并在结束时删除（不进仓库）。
 * 用法：node _tests/_test_rule_health.js
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const ETS = path.join(ROOT, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'ets');
const TMP = path.join(__dirname, '_tmp_rulehealth');

let FAIL = 0;
const ok = (m) => console.log('  ✓ ' + m);
const bad = (m) => { FAIL++; console.log('  ✗ ' + m); };
const head = (t) => console.log('\n' + t);
function eq(actual, expect, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expect);
  if (a === e) { ok(label + '：' + a); } else { bad(label + '：实得 ' + a + '，应为 ' + e); }
}
function truthy(v, label) {
  if (v) { ok(label); } else { bad(label); }
}

/* ---------------- 1. 准备可运行的 JS ---------------- */
function prepare() {
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.mkdirSync(TMP, { recursive: true });
  const files = ['model/RuleHealth.ets', 'model/ReasonText.ets'];
  for (const rel of files) {
    let src = fs.readFileSync(path.join(ETS, rel), 'utf-8');
    /* ArkTS 的 kit import → 本地桩（RunTime 不依赖 hilog） */
    src = src.replace(/import\s*\{\s*hilog\s*\}\s*from\s*'@kit\.PerformanceAnalysisKit';/,
      "const hilog = { warn: (...a: Object[]): void => { LOGS.push(String(a[2])); }, error: (...a: Object[]): void => { LOGS.push(String(a[2])); } };\n"
      + 'export const LOGS: string[] = [];');
    const base = path.basename(rel).replace(/\.ets$/, '.ts');
    fs.writeFileSync(path.join(TMP, base), src);
  }
  const tsc = path.join(ROOT, 'node_modules', '.bin', 'tsc');
  const cmd = fs.existsSync(tsc) ? tsc : 'npx';
  const args = fs.existsSync(tsc)
    ? ['--target', 'ES2017', '--module', 'commonjs', '--skipLibCheck', '--outDir', 'out',
      'RuleHealth.ts', 'ReasonText.ts']
    : ['tsc', '--target', 'ES2017', '--module', 'commonjs', '--skipLibCheck', '--outDir', 'out',
      'RuleHealth.ts', 'ReasonText.ts'];
  execFileSync(cmd, args, { cwd: TMP, stdio: 'pipe', shell: process.platform === 'win32' });
  return {
    health: require(path.join(TMP, 'out', 'RuleHealth.js')),
    reason: require(path.join(TMP, 'out', 'ReasonText.js')),
  };
}

let mod;
try {
  mod = prepare();
} catch (e) {
  console.log('准备失败（tsc 编译 .ets→JS）：' + (e.stdout ? e.stdout.toString() : e.message));
  process.exit(2);
}
const { RuleHealth } = mod.health;
const { ReasonText, EmptyKind, SlotId } = mod.reason;

const ALL_KEYS = ['wangshuai', 'qijidian', 'kongwang', 'zhuri', 'jichu', 'shensha', 'bifa',
  'xingnian', 'zhanshi', 'guanlu', 'leixiang', 'xiangyi', 'bifacoach', 'ketiyi'];

/* ---------------- 2. 摘要计数（§14.3 计数口径） ---------------- */
head('[R1] 徽标摘要：分母 = 登记表张数（14），只把「读到且无缺键」算作已加载');
RuleHealth.reset();
eq(RuleHealth.total(), 14, '表总数');
truthy(RuleHealth.summaryText().indexOf('0/14') >= 0 && RuleHealth.summaryText().indexOf('⚠') >= 0,
  '未加载任何表时摘要为 0/14 ⚠：' + RuleHealth.summaryText());
for (const k of ALL_KEYS) {
  RuleHealth.ok(k, 3, '');
}
truthy(RuleHealth.summaryText().indexOf('14/14') >= 0 && RuleHealth.summaryText().indexOf('✓') >= 0,
  '全部登记后摘要为 14/14 ✓：' + RuleHealth.summaryText());
RuleHealth.reset();
ALL_KEYS.slice(0, 11).forEach((k) => RuleHealth.ok(k, 1, ''));
eq(RuleHealth.loadedCount(), 11, '登记 11 张后的已加载数');
truthy(RuleHealth.summaryText().indexOf('11/14') >= 0, '摘要为 11/14：' + RuleHealth.summaryText());

/* ---------------- 3. 三态可分（缺表 vs 表在但内容不全） ---------------- */
head('[R2] 「没读到」与「表在但内容不完整」必须可分');
RuleHealth.reset();
RuleHealth.fail('bifa', '规则表未读取到');
eq(RuleHealth.usable('bifa'), false, '未加载 → usable=false');
eq(RuleHealth.failReasonOf('bifa'), '规则表未读取到', '失败原因可查');
RuleHealth.okWithMissingKeys('shensha', 10, '', ['神煞']);
eq(RuleHealth.usable('shensha'), false, '表在但缺必填键 → usable=false（不可用）');
truthy(RuleHealth.failReasonOf('shensha').indexOf('不完整') >= 0, '原因写明内容不完整：' + RuleHealth.failReasonOf('shensha'));
RuleHealth.ok('zhuri', 2, '');
eq(RuleHealth.usable('zhuri'), true, '正常表 → usable=true');
eq(RuleHealth.usable('never-registered'), true, '未登记的表不阻断显示 → usable=true');
/* reset 后 14 张都「未尝试」，加 1 张失败 + 1 张内容不完整 = 13 */
const PROBS = RuleHealth.problemList();
eq(PROBS.length, 13, '问题清单 = 11 张未尝试 + 1 失败 + 1 内容不完整');
const byKey = (k) => PROBS.filter((p) => p.key === k)[0];
eq(byKey('bifa').failReason, '规则表未读取到', '失败表原因');
truthy(byKey('shensha').failReason.indexOf('不完整') >= 0, '内容不完整表原因：' + byKey('shensha').failReason);
truthy(byKey('wangshuai').failReason.indexOf('尚未尝试加载') >= 0,
  '「本次启动没执行过入口」必须与「执行了但没读到」分开：' + byKey('wangshuai').failReason);
eq(byKey('wangshuai').attempted, false, '未执行入口的表：attempted=false');
eq(byKey('bifa').attempted, true, '执行过入口的表：attempted=true（否则加载完成前会全报未加载）');

/* ---------------- 4. 导出诊断内容 ---------------- */
head('[R3] 导出诊断：版本 + 时间 + 14 行逐表状态，且不含数据文件名');
RuleHealth.reset();
ALL_KEYS.forEach((k) => RuleHealth.ok(k, 5, '1.0'));
const diag = RuleHealth.diagnoseText('1.0.4', '界面：首页（起课台）');
truthy(diag.indexOf('1.0.4') >= 0, '含应用版本');
truthy(/生成时间：\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(diag), '含可读生成时间');
eq(RuleHealth.selfCheckText().split('\n').length, 14, '逐表状态行数');
truthy(diag.indexOf('.json') < 0 && diag.indexOf('rawfile') < 0, '不含数据文件名/路径');
truthy(diag.indexOf('不含任何个人信息与联网数据') >= 0, '含离线与隐私说明');

/* ---------------- 5. 一次性提示 ---------------- */
head('[R4] 缺表一次性提示：每次启动只提示一次');
RuleHealth.resetTip();
eq(RuleHealth.consumeTip(), true, '第一次应提示');
eq(RuleHealth.consumeTip(), false, '第二次不再提示');
RuleHealth.resetTip();
eq(RuleHealth.consumeTip(), true, '重置后可再次提示（重启语义）');

/* ---------------- 6. 空态文案表（运行期取值） ---------------- */
head('[R5] 空态文案：登记齐备 + 兜底不留白');
const REQUIRED = [['bifa', 'none'], ['bifa', 'missing'], ['shensha', 'none'], ['shensha', 'missing'],
  ['zhonghuang', 'unset'], ['zhonghuang', 'missing'], ['nianming', 'unset'],
  ['xingnian', 'unset'], ['xingnian', 'missing'], ['yongshen', 'none']];
let missingText = 0;
for (const [slot, kind] of REQUIRED) {
  const r = ReasonText.of(slot, kind);
  if (r.text === '' || r.text.indexOf('本栏暂无内容') >= 0) { missingText++; }
  if (kind === 'missing' && !r.warn) { bad(slot + '/missing 未标警示色'); }
}
eq(missingText, 0, '全部登记文案都有内容（非兜底）');
const fb = ReasonText.of('unknownslot', 'none');
truthy(fb.text !== '' && fb.entry !== '', '未登记栏位走兜底且仍有文案与入口：' + fb.text);
eq(ReasonText.of('bifa', 'missing').warn, true, '缺表文案标警示');
eq(ReasonText.of('bifa', 'none').warn, false, '「确实无」不标警示');
eq(ReasonText.kindFor('bifa', false, false), EmptyKind.MISSING, 'kindFor：表不可用 → missing');
eq(ReasonText.kindFor('bifa', true, false), EmptyKind.NONE, 'kindFor：表可用但无值 → none');
eq(ReasonText.kindFor('bifa', true, true), '', 'kindFor：有值 → 空串（不显示空态）');

/* ---------------- 7. DataLoader 规则表路径不得再有裸 JSON.parse ---------------- */
head('[R6] 规则表读取路径统一走 readRule/parseRule（不得再出现裸 JSON.parse）');
const loaderSrc = fs.readFileSync(path.join(ETS, 'model', 'DataLoader.ets'), 'utf-8');
/* 注意：cal/、ancient/ 有自己的解析（不属 14 张规则表），只对 rule/ 行作硬断言 */
const bareRuleParse = loaderSrc.split('\n').filter((l) => /JSON\.parse\(/.test(l) && /'rule\//.test(l));
eq(bareRuleParse.length, 0, '规则表行内裸 JSON.parse 数量');
const total = (loaderSrc.match(/JSON\.parse\(/g) || []).length;
console.log('  · 全文件 JSON.parse 共 ' + total + ' 处（parseRule 1 + cal/yj_all/ancient/case 各 1，非规则表）');
truthy(loaderSrc.indexOf('RuleHealth.fail(key,') >= 0, 'readRule/parseRule 内按 key 登记失败');
/* 栏目可用性判定必须走 RuleHealth.usable（而不是自己 try/catch 猜） */
const uiSrc = fs.readFileSync(path.join(ETS, 'pages', 'Index.ets'), 'utf-8');
truthy(uiSrc.indexOf("RuleHealth.usable('bifa')") >= 0 && uiSrc.indexOf("RuleHealth.usable('shensha')") >= 0
  && uiSrc.indexOf("RuleHealth.usable('xingnian')") >= 0, 'Index 用 usable 判定毕法/神煞/行年栏目可用性');

/* ---------------- 收尾 ---------------- */
fs.rmSync(TMP, { recursive: true, force: true });
console.log('');
if (FAIL > 0) {
  console.log('数据健康运行期断言：不通过 ✗（' + FAIL + ' 项）');
  process.exit(1);
}
console.log('数据健康运行期断言：通过 ✓（摘要/三态/诊断/一次性提示/空态文案兜底 均符合规范）');

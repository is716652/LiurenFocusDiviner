/* 页签导航逻辑反验（NavUtil.ets）
 * ----------------------------------------------------------------------------
 * 背景：应用市场审核反馈「排盘-课例/古籍：重复进入课例/古籍后，点排盘回不到排盘」。
 * 修法：NavUtil 改为「目标页在栈中 → back(index) 回到它；不在 → pushUrl 新开；
 *       目标即当前页 → 不动」。
 *
 * 本测试把 NavUtil.ets 的真实代码抽出来（去注释/去类型注解）在 Node 里跑，
 * 路由用「按官方文档语义实现的模拟栈」：
 *   - getState()/getStateByUrl() 返回栈中的页与其 1-based 索引；
 *   - back(index) → 退到该页（截断其上的页面）；back() → 退一层；back(index, params) 带参；
 *   - pushUrl({url}) → 压栈。
 * 注意：这只验证**决策逻辑**与文档语义，真机行为仍需上机确认。
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'ets', 'model', 'NavUtil.ets');

let fail = 0;
const bad = (name, extra) => { fail++; console.log('FAIL:', name, extra === undefined ? '' : extra); };
const ok = (name, extra) => { console.log('OK  :', name, extra === undefined ? '' : extra); };

/* ---- 把 NavUtil.ets 抽成可执行 JS：去块注释、去行注释、去 import、去 export、去类型注解 ---- */
let src = fs.readFileSync(SRC, 'utf-8');
src = src.replace(/\/\*[\s\S]*?\*\//g, '');
src = src.replace(/^\s*\/\/.*$/gm, '');
src = src.replace(/^\s*import[\s\S]*?;\s*$/gm, '');
src = src.replace(/\bexport\s+/g, '');
/* 去类型注解：支持 T、T[]、Record<...>、以及 A | null 这类联合 */
src = src.replace(/:\s*[A-Za-z_][A-Za-z0-9_.]*(<[^>]*>)?(\[\])?(\s*\|\s*(null|[A-Za-z_][A-Za-z0-9_.]*(<[^>]*>)?(\[\])?))*(?=\s*[=,){])/g, '');

const factory = new Function(src + '\nreturn { goTab: goTab, goTabWith: goTabWith };');
const nav = factory();

/* ---- 模拟路由（按官方文档语义） ---- */
function makeUi(initial) {
  const stack = initial.slice();
  let lastParams = null;
  const router = {
    getState() { return { index: stack.length, path: stack[stack.length - 1] }; },
    getStateByUrl(url) {
      const out = [];
      for (let i = 0; i < stack.length; i++) if (stack[i] === url) out.push({ index: i + 1, path: stack[i] });
      return out;
    },
    back(a, b) {
      if (typeof a === 'number') {
        if (a < 1 || a > stack.length) return;      /* 索引不存在：不响应 */
        stack.length = a;
        if (b) lastParams = b;
      } else {
        if (stack.length > 1) stack.pop();
      }
    },
    pushUrl(opt) {
      stack.push(opt.url);
      if (opt.params) lastParams = opt.params;
    }
  };
  return {
    ui: { getRouter: () => router },
    stack: stack,
    top: () => stack[stack.length - 1],
    depth: () => stack.length,
    lastParams: () => lastParams
  };
}

/* ---- 用例 ---- */
/* 1. 审核步骤：排盘 → 课例 → 古籍 反复进入，最后点排盘必须回到排盘页 */
{
  const h = makeUi(['pages/Home', 'pages/Index']);
  nav.goTab(h.ui, 'pages/Cases');
  nav.goTab(h.ui, 'pages/Ancient');
  nav.goTab(h.ui, 'pages/Cases');
  nav.goTab(h.ui, 'pages/Ancient');
  nav.goTab(h.ui, 'pages/Cases');
  if (h.depth() > 3) bad('反复切换不应堆栈', '深度=' + h.depth() + ' ' + h.stack.join('>'));
  nav.goTab(h.ui, 'pages/Index');
  if (h.top() !== 'pages/Index') bad('排盘未回到排盘页', h.stack.join('>'));
  else ok('反复进入课例/古籍后点排盘回到排盘页', h.stack.join(' > '));
  if (h.depth() !== 2) bad('回到排盘后栈应无残留', h.stack.join('>'));
  else ok('回到排盘后中途页签已出栈', '深度=' + h.depth());
}

/* 2. 排盘页点当前页签：不做任何跳转 */
{
  const h = makeUi(['pages/Home', 'pages/Index']);
  nav.goTab(h.ui, 'pages/Index');
  if (h.top() !== 'pages/Index' || h.depth() !== 2) bad('点当前页签不应跳转', h.stack.join('>'));
  else ok('点当前页签无副作用');
}

/* 3. 从首页直接进课例（栈中没有排盘页）：点排盘应新开排盘页 */
{
  const h = makeUi(['pages/Home', 'pages/Cases']);
  nav.goTab(h.ui, 'pages/Index');
  if (h.top() !== 'pages/Index') bad('栈中无排盘页时应新开', h.stack.join('>'));
  else ok('栈中无排盘页时新开排盘页', h.stack.join(' > '));
}

/* 4. 课例 ↔ 古籍 反复横跳：栈深不得增长 */
{
  const h = makeUi(['pages/Home', 'pages/Index']);
  nav.goTab(h.ui, 'pages/Cases');
  for (let i = 0; i < 10; i++) {
    nav.goTab(h.ui, i % 2 === 0 ? 'pages/Ancient' : 'pages/Cases');
  }
  if (h.depth() > 3) bad('课例/古籍横跳堆栈', '深度=' + h.depth() + ' ' + h.stack.join('>'));
  else ok('课例/古籍横跳不堆栈', '深度=' + h.depth() + ' ' + h.stack.join(' > '));
  nav.goTab(h.ui, 'pages/Index');
  if (h.top() !== 'pages/Index') bad('横跳后回排盘失败', h.stack.join('>'));
  else ok('横跳后回排盘成功', h.stack.join(' > '));
}

/* 5. 课例恢复：带参回到排盘页，参数须送达（Index 靠令牌重排） */
{
  const h = makeUi(['pages/Home', 'pages/Index', 'pages/Cases']);
  nav.goTabWith(h.ui, 'pages/Index', { y: 2019, m: 5, d: 3, hz: '卯', t: '1234567890' });
  const lp = h.lastParams();
  if (h.top() !== 'pages/Index') bad('课例恢复未回到排盘页', h.stack.join('>'));
  else if (!lp || lp['t'] !== '1234567890' || lp['y'] !== 2019) bad('课例恢复参数未送达', JSON.stringify(lp));
  else ok('课例恢复带参回到排盘页', JSON.stringify(lp));
}

/* 6. 栈里没有排盘页时带参恢复：新开并带参 */
{
  const h = makeUi(['pages/Home', 'pages/Cases']);
  nav.goTabWith(h.ui, 'pages/Index', { y: 2020, m: 2, d: 2, hz: '午', t: '42' });
  const lp = h.lastParams();
  if (h.top() !== 'pages/Index' || !lp || lp['t'] !== '42') bad('无排盘页时带参恢复失败', JSON.stringify({ top: h.top(), lp: lp }));
  else ok('无排盘页时带参新开排盘页', h.stack.join(' > '));
}

/* 7. 返回键（‹ 返回）语义未受影响：仍只退一层 */
{
  const h = makeUi(['pages/Home', 'pages/Cases']);
  h.ui.getRouter().back();
  if (h.top() !== 'pages/Home') bad('‹ 返回 语义被破坏', h.stack.join('>'));
  else ok('‹ 返回 仍为退一层');
}

console.log(fail === 0 ? '\nALL PASS (navutil)' : '\nFAILED: ' + fail);
process.exit(fail === 0 ? 0 : 1);

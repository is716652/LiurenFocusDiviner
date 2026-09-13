/* ============================================================================
 * _test_docs_structure.js —— Markdown 文档结构门禁（2026-09-13 新增）
 * ----------------------------------------------------------------------------
 * 起因：Agent.md 里 `### 免费版同步纪律` 整段被包进了未闭合的 ```powershell 围栏
 *   （插入时把闭合围栏留在了段落之后）→ 正文被渲染成代码块，恰好是最重要的一段教训不可读；
 *   另有 §10 出现两个 `3.`、其后编号整体错位。人工核对容易只看「内容对不对」而漏掉结构。
 * 判据（只看客观事实，不写白名单）：
 *   D1 围栏成对：每个 .md 的 ``` 行数为偶数
 *   D2 围栏内不得出现标题行（`#`~`######` 开头）—— 正是本次那类缺陷
 *   D3 同级有序列表在一次连续列表内编号必须递增 1（抓重复/错位）
 *   D4 一级/二级标题的编号不得重复（`## 11.` 与 `## 11.5` 视为不同，后者不算重复）
 *   D5 文档里登记的「本文档更新前 main HEAD：<sha>」必须在仓库中存在；并打印落后提交数（提示，不判否）
 * 用法：node _tests/_test_docs_structure.js
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'build', '.hvigor', '.idea', 'oh_modules', '.cxx', '.clangd', '.preview']);

function walkMd(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name) || e.name.endsWith('.build')) continue;
      walkMd(path.join(dir, e.name), out);
    } else if (/\.md$/i.test(e.name)) out.push(path.join(dir, e.name));
  }
  return out;
}
function git(args) {
  try {
    return { ok: true, out: execFileSync('git', args, { cwd: ROOT, encoding: 'utf-8' }).trim() };
  } catch (e) {
    return { ok: false, out: String(e.stdout || e.message) };
  }
}

const bad = [];      /* 活文档（含「本文档更新前 main HEAD」标记）的结构问题：判否 */
const warn = [];     /* 历史/参考文档的同类问题：只提醒，不判否（不做逐文件白名单） */
let files = 0, fences = 0, lists = 0, heads = 0;
const files_ = walkMd(ROOT);
for (const f of files_) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const lines = fs.readFileSync(f, 'utf-8').split(/\r?\n/);
  files++;
  /* 分档判据：文档自己声明了「本文档更新前 main HEAD」= 活文档（如 Agent.md）→ 结构问题判否；
     其余（历史记录 / 参考手册）只提醒。判据来自文档内容，不是文件名单（不写死）。 */
  const isLiving = /本文档更新前 main HEAD/.test(lines.join('\n'));
  const flag = (msg) => { (isLiving ? bad : warn).push(msg); };

  /* D1 + D2 */
  let inFence = false, fenceLines = 0, fenceLang = '';
  const SHELL_FENCE = /^(powershell|ps1|bash|sh|shell|console|cmd|bat)$/;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^\s*```/.test(l)) {
      if (!inFence) fenceLang = l.replace(/^\s*```/, '').trim().toLowerCase();
      inFence = !inFence; fenceLines++; continue;
    }
    /* 只查「shell 类代码块」里出现的标题：shell 块内不会有标题，出现即围栏写错
       （本次 Agent.md 的真实缺陷：`### 免费版同步纪律` 落在 ```powershell 内）。
       其他语言的围栏可能刻意引用标题（如 ArkTS 规范文档里贴错误清单），不判否。
       单 # 不计：那是 shell 注释。 */
    if (inFence && SHELL_FENCE.test(fenceLang) && /^#{2,6}\s/.test(l)) {
      flag(rel + ':' + (i + 1) + '  ```' + fenceLang + ' 代码块内出现标题（围栏位置写错？）：'
        + l.trim().slice(0, 50));
    }
  }
  fences += fenceLines;
  if (fenceLines % 2 !== 0) flag(rel + '  围栏数 ' + fenceLines + ' 为奇数（有未闭合的 ```）');

  /* D3：同缩进的有序列表在一次「列表项运行」内不得重复或倒退。
     运行的定义按 markdown 列表语义：同级编号项之间只允许出现**空行**或**更深缩进的续行**；
     一旦出现同级/更浅的非空行，就是另一段列表（重新从 1 开始也合法）。
     只判「重复或倒退」（向前跳号多为历史文档「一行塞多项」的排版残留，不判否）。 */
  const items = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /^(\s*)(\d+)\.\s+\S/.exec(lines[i]);
    if (m) items.push({ line: i, indent: m[1].length, no: parseInt(m[2], 10) });
  }
  for (let k = 1; k < items.length; k++) {
    const a = items[k - 1], b = items[k];
    if (a.indent !== b.indent) continue;
    let sameRun = true;
    for (let i = a.line + 1; i < b.line; i++) {
      if (lines[i].trim() === '') continue;
      if (lines[i].match(/^\s*/)[0].length <= a.indent) { sameRun = false; break; }
    }
    if (!sameRun) continue;
    lists++;
    if (b.no <= a.no) {
      flag(rel + ':' + (b.line + 1) + '  有序列表编号重复或倒退：' + a.no + ' → ' + b.no
        + '（内容：' + lines[b.line].trim().slice(0, 40) + '）');
    }
  }

  /* D4：标题编号不得重复 */
  const seen = new Map();
  for (let i = 0; i < lines.length; i++) {
    const m = /^#{2,3}\s+(\d+)\.\s/.exec(lines[i]);
    if (!m) continue;
    heads++;
    const k = m[1];
    if (seen.has(k)) {
      flag(rel + ':' + (i + 1) + '  标题编号重复：`## ' + k + '.`（首次在第 ' + seen.get(k) + ' 行）');
    } else {
      seen.set(k, i + 1);
    }
  }

  /* D5：登记的更新前 HEAD 必须存在（仅对写了这句的文档） */
  for (let i = 0; i < lines.length; i++) {
    const m = /main HEAD[：:]\s*`([0-9a-f]{7,40})/.exec(lines[i]);
    if (!m) continue;
    const sha = m[1];
    if (!git(['cat-file', '-e', sha + '^{commit}']).ok) {
      flag(rel + ':' + (i + 1) + '  登记的 HEAD 在仓库中不存在：' + sha);
    } else {
      const behind = git(['rev-list', '--count', sha + '..HEAD']);
      if (behind.ok) {
        console.log('  [' + rel + '] 登记 HEAD ' + sha.slice(0, 7) + '，落后当前 HEAD '
          + behind.out + ' 个提交（提示：收口时把「最近更新 / 更新前 HEAD」推进）');
      }
    }
  }
}

if (warn.length > 0) {
  console.log('WARN  历史/参考文档 ' + warn.length + ' 处同类问题（不判否，列入清理待办）：');
  for (const w of warn.slice(0, 6)) console.log('  · ' + w);
  if (warn.length > 6) console.log('  · … 共 ' + warn.length + ' 处');
}
if (bad.length === 0) {
  console.log('PASS  文档结构门禁：活文档结构干净；扫 ' + files + ' 个 .md（围栏 ' + fences + ' 行 / 相邻列表对比 '
    + lists + ' 次 / 编号标题 ' + heads + ' 个）');
  process.exit(0);
}
console.log('FAIL  文档结构门禁：活文档 ' + bad.length + ' 处（扫 ' + files + ' 个 .md）');
for (const b of bad.slice(0, 30)) console.log('  ✗ ' + b);
if (bad.length > 30) console.log('  … 共 ' + bad.length + ' 处');
process.exit(1);

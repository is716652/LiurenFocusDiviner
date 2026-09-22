# -*- coding: utf-8 -*-
"""scan_corpus.py —— 古籍素材目录的**只读**健康检查（编码 / 规模 / 可复算课式 / 转码核验）

用途
----
`大六壬文档/` 下的古籍原文编码混杂（GBK / UTF-8 / UTF-16 都有），
人工看一眼往往会得出错误结论。本工具把三件事一次做完：

1. **编码探测**：对每个文件依次试 `utf-8-sig` → `gb18030` → `utf-16`，
   取**汉字字符最多**的解码结果（不是"第一个不报错的"）。
2. **规模与课式计数**：汉字数、以及**同行同时出现「X日」与「X将X时」**的课式行数
   （＝可交给 `_tools/case_facts.js` 复算的候选案例）。
3. **转码核验**（`--vs HEAD`）：把当前工作区版本与 git HEAD 版本**各自解码、统一行尾**后逐字比对，
   用来确认"批量转码没有丢字改字"。

用法
----
    python _tools/scan_corpus.py              # 盘点两个素材目录
    python _tools/scan_corpus.py --vs HEAD    # 逐文件与 HEAD 比对（转码核验）

踩坑（都真踩过，别再踩）
------------------------
* **不能假定编码，更不能把"乱码"当"坏文件"**：按 UTF-8 打开 UTF-16 文件不报错、只是满屏乱码；
  曾因此判定《六壬直指御定》"文件损坏"而**整本跳过** —— 它其实是 **720 局的断语库**（UTF-16 完好）。
* **同名双文件要按内容去重**：古籍目录里常见 `.txt`(GBK) 与 `.utf8.txt`(UTF-8) 两份，
  实测《六壬断案》两份 sha1 完全相同；分别计数会把课式数**凭空翻倍**（211 → 422）。
* 本工具**只读**，不修改任何文件；转码由人工完成，本工具只负责**核验**。

相关文档：`大六壬文档/案例剧情/素材地基-古籍语料普查与入库管线.md`
"""
import io
import os
import re
import subprocess
import sys

DIRS = ['大六壬文档/古籍原文-易藏-术数', '大六壬文档/壬占汇选']
SKIP_EXT = ('.docx', '.png', '.jpg', '.jpeg', '.gif', '.zip')

_a, _b = list('甲乙丙丁戊己庚辛壬癸'), list('子丑寅卯辰巳午未申酉戌亥')
JIAZI_RE = '|'.join(_a[i % 10] + _b[i % 12] for i in range(60))
DAY_RE = re.compile(r'(?:%s)日' % JIAZI_RE)
KE_RE = re.compile(r'[子丑寅卯辰巳午未申酉戌亥]将[子丑寅卯辰巳午未申酉戌亥]时')


def decode_best(raw):
    """返回 (文本, 编码, 汉字数)：取**汉字最多**的解码，而非第一个不报错的。"""
    best, bh, be = None, -1, '?'
    for enc in ('utf-8-sig', 'gb18030', 'utf-16'):
        try:
            t = raw.decode(enc)
        except Exception:
            continue
        h = len(re.findall(r'[\u4e00-\u9fff]', t))
        if h > bh:
            best, bh, be = t, h, enc
    return best, bh, be


def norm(t):
    """归一化：去 BOM、统一行尾 —— 使"编码/行尾差异"与"内容差异"区分开。"""
    if t is None:
        return None
    return t.replace('\ufeff', '').replace('\r\n', '\n').replace('\r', '\n').strip()


def head_bytes(rel):
    r = subprocess.run(['git', 'show', 'HEAD:' + rel], capture_output=True)
    return r.stdout if r.returncode == 0 else None


def walk():
    for d in DIRS:
        for root, _dd, fs in os.walk(d):
            for f in sorted(fs):
                if f.lower().endswith(SKIP_EXT):
                    continue
                p = os.path.join(root, f)
                yield p, p.replace(os.sep, '/')


def main():
    vs_head = '--vs' in sys.argv
    rows, enc_hist, ke_total = [], {}, 0
    for p, rel in walk():
        raw = io.open(p, 'rb').read()
        text, han, enc = decode_best(raw)
        enc_hist[enc] = enc_hist.get(enc, 0) + 1
        ke = sum(1 for ln in (text or '').splitlines()
                 if DAY_RE.search(ln) and KE_RE.search(ln))
        ke_total += ke
        row = [os.path.basename(p), enc, han, len(raw), ke]
        if vs_head:
            hraw = head_bytes(rel)
            if hraw is None:
                row.append(('NEW', ''))
            else:
                ht, _hh, he = decode_best(hraw)
                a, b = norm(text), norm(ht)
                row.append(('相同' if a == b else '差异', he))
        rows.append(row)

    if vs_head:
        print('%-40s %-10s %8s %8s %6s %-5s %s' % (
            '文件', '现在', '汉字', 'B', '课式', '比对', 'HEAD编码'))
        for r in rows:
            print('%-40s %-10s %8d %8d %6d %-5s %s' % (
                r[0][:38], r[1], r[2], r[3], r[4], r[5][0], r[5][1]))
        bad = [r for r in rows if r[5][0] == '差异']
        print('\n文件 %d：逐字相同 %d，有差异 %d' % (
            len(rows), len(rows) - len(bad), len(bad)))
        for r in bad:
            print('   ⚠ %s（汉字 %d）' % (r[0], r[2]))
    else:
        print('%-40s %-10s %8s %8s %6s' % ('文件', '编码', '汉字', 'B', '课式'))
        for r in rows:
            print('%-40s %-10s %8d %8d %6d' % (r[0][:38], r[1], r[2], r[3], r[4]))
        print('\n文件 %d，课式行合计 %d' % (len(rows), ke_total))
    print('编码分布:', enc_hist)
    return 0


if __name__ == '__main__':
    sys.exit(main())

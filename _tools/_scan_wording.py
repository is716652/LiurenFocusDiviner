# -*- coding: utf-8 -*-
"""临时：扫描案例剧情的用户可见文案，统计"生硬/自我加码"用词的分布。
输出写文件（避免控制台编码问题），供写"改写清单"用。"""
import io
import json
import re
from collections import Counter

SRC = 'APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/ancient/case_story.json'
OUT = '_tmp_wording_scan.md'
d = json.loads(io.open(SRC, encoding='utf-8').read())
st = d.get('stories', d)

PATTERNS = [
    ('古籍云/古籍谓/古籍断法 等框架前缀', r'古籍(云|谓|断法|原断|研习|出自)'),
    ('"非古籍原断"类声明', r'非古籍原断'),
    ('"不作结论/不作断语"类', r'不作(结论|断语)'),
    ('"仅供参考/研习参考"类', r'仅供参考|研习参考|传统文化研习'),
    ('"不构成…建议"类', r'不构成'),
    ('"皆依类象与经文列出"类', r'依类象与经文'),
    ('"盘面："标签式开头', r'盘面：'),
    ('"古法"话术', r'古法'),
    ('"宜…/防…"祈使', r'[^不]?宜[主动守进退谨慎]|防[官非口舌病]'),
    ('"主…"术数陈述（这是好的）', r'主(官|口舌|病|财|雪|雨|信|动|静)'),
]

cnt = Counter()
samples = {k: [] for k, _ in PATTERNS}
per_field = Counter()

for cid, s in st.items():
    fields = []
    fields.append(('brief', s.get('brief', '')))
    fields.append(('note', s.get('note', '')))
    for a in s.get('asks', []):
        for k in ('title', 'intro', 'question'):
            fields.append(('ask.' + k, a.get(k, '')))
        for k in ('endings',):
            for e in a.get(k, []) or []:
                if isinstance(e, dict):
                    fields.append(('endings.text', e.get('text', '')))
        en = a.get('ending') or {}
        for k in ('text', 'note', 'tip'):
            if isinstance(en.get(k), str):
                fields.append(('ending.' + k, en[k]))
        for cl in a.get('clues', []) or []:
            for k in ('label', 'hint', 'small'):
                fields.append(('clue.' + k, cl.get(k, '')))
    for fname, txt in fields:
        if not isinstance(txt, str) or not txt:
            continue
        for name, pat in PATTERNS:
            if re.search(pat, txt):
                cnt[name] += 1
                per_field[fname] += 1
                if len(samples[name]) < 3:
                    samples[name].append('%s / %s: %s' % (cid, fname, txt[:110]))

L = ['# 案例剧情文案用词扫描\n', 'stories: %d\n' % len(st)]
L.append('## 命中统计（字段级计数，同一字段命中多次算一次）\n')
for name, _ in PATTERNS:
    L.append('- **%s**：%d 处' % (name, cnt[name]))
L.append('')
L.append('## 命中字段分布（top 12）\n')
for f, n in per_field.most_common(12):
    L.append('- `%s`：%d' % (f, n))
L.append('')
L.append('## 抽样\n')
for name, _ in PATTERNS:
    if samples[name]:
        L.append('### %s' % name)
        for x in samples[name]:
            L.append('- %s' % x)
        L.append('')
io.open(OUT, 'w', encoding='utf-8', newline='\n').write('\n'.join(L))
print('written ->', OUT)

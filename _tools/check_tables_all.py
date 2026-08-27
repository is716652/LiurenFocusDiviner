# -*- coding: utf-8 -*-
"""检查所有篇目中"表格/代码块"段落的特征分布"""
import io, json, os, re

P = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'resources', 'rawfile', 'ancient', 'zhonghuang_jing.json')
book = json.load(io.open(P, encoding='utf-8'))

def is_table_or_code(p):
    if '```' in p:
        return True
    lines = [x for x in p.split('\n') if x.strip()]
    if len(lines) < 2:
        return False
    # 首行含制表符(全角空格分隔的列名)且后续行同构,或含 |
    if '\u3000' in lines[0] or '|' in p:
        return True
    return False

total = 0
for ch in book['篇目']:
    for i, pp in enumerate(ch['段落']):
        if is_table_or_code(pp):
            total += 1
            first = [x for x in pp.split('\n') if x.strip()][0]
            print('篇%d [%d]: %s' % (ch['序'], i, first[:40]))
print('总计表格/代码块段落:', total)

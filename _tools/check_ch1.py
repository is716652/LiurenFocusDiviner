# -*- coding: utf-8 -*-
"""检查篇1 超长/特殊段落,定位"往右挤"问题"""
import io, json, os

P = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'resources', 'rawfile', 'ancient', 'zhonghuang_jing.json')
book = json.load(io.open(P, encoding='utf-8'))
c = book['篇目'][1]
print('篇1 释己身, 段落数:', len(c['段落']))
for i, pp in enumerate(c['段落']):
    flat = pp.replace('\n', ' ')
    if len(pp) > 150:
        print('[%d] 长度%d: %s...' % (i, len(pp), flat[:50]))
    elif '\n' in pp:
        print('[%d] 含换行: %s...' % (i, flat[:60]))

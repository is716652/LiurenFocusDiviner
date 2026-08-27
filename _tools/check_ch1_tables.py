# -*- coding: utf-8 -*-
"""打印篇1 表格/代码块段落的精确形态"""
import io, json, os

P = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'resources', 'rawfile', 'ancient', 'zhonghuang_jing.json')
book = json.load(io.open(P, encoding='utf-8'))
c = book['篇目'][1]
for i in [22, 25, 28, 40, 44, 45]:
    print('===== 段落[%d] =====' % i)
    print(repr(c['段落'][i][:400]))
    print()

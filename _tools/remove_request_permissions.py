# -*- coding: utf-8 -*-
"""从 module.json5 移除 requestPermissions 块（免费版用，保持零权限申报）
可靠实现：正则精确匹配  "requestPermissions": [ ... ],  整块（含嵌套）删除
"""
import io
import re

def remove_request_permissions(p):
    s = io.open(p, encoding='utf-8').read()
    # 匹配从 "requestPermissions": [ 到配对的 "]," 结束（用栈计数处理嵌套）
    lines = s.split('\n')
    out = []
    i = 0
    removed = False
    while i < len(lines):
        ln = lines[i]
        if re.search(r'"requestPermissions"\s*:\s*\[', ln):
            # 找到块结束（遇 "]," 且方括号深度归零）
            depth = ln.count('[') - ln.count(']')
            i += 1
            while i < len(lines) and depth > 0:
                depth += lines[i].count('[') - lines[i].count(']')
                i += 1
            removed = True
            continue
        out.append(ln)
        i += 1
    if removed:
        io.open(p, 'w', encoding='utf-8', newline='').write('\n'.join(out))
        print('requestPermissions 已移除:', p)
        return True
    print('无 requestPermissions:', p)
    return False

if __name__ == '__main__':
    import sys
    for p in sys.argv[1:]:
        remove_request_permissions(p)

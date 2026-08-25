# -*- coding: utf-8 -*-
"""Web 语法检查（Node new Function 等价） + 点击接线验证"""
import io
import re
import subprocess

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\UI\大六壬万年历起课.html'
s = io.open(P, encoding='utf-8').read()
m = re.search(r'<script>([\s\S]*?)</script>', s)
js = m.group(1)

# 用 Node 校验语法（等价浏览器 new Function）
jsf = js.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
node_src = 'new Function(`' + jsf + '`); console.log("JS SYNTAX OK");'
r = subprocess.run(['node', '-e', node_src], capture_output=True, text=True)
print(r.stdout.strip() or r.stderr.strip())
if r.returncode != 0:
    raise SystemExit(1)

print('pickCustomZhi:', 'function pickCustomZhi' in s)
print('tian clicks:', s.count('pickCustomZhi(tz,"天盘")'))
print('di clicks:', s.count('pickCustomZhi(z,"地盘")'))

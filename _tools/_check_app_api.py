# -*- coding: utf-8 -*-
"""检查 .app 包内的 API 版本 + 签名验证"""
import re
import zipfile
import sys

app = sys.argv[1]
z = zipfile.ZipFile(app)
print('包内文件:')
for n in z.namelist():
    print(' ', n)
for n in z.namelist():
    if 'module.json' in n:
        c = z.read(n).decode('utf-8', errors='ignore')
        m = re.search(r'compatibleSdkVersion["\s:]+([^,"}]+)', c)
        t = re.search(r'targetSdkVersion["\s:]+([^,"}]+)', c)
        print(n, '| compatible:', m.group(1) if m else '?', '| target:', t.group(1) if t else '?')

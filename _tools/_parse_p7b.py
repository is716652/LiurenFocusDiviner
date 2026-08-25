# -*- coding: utf-8 -*-
"""解析 p7b Profile：bundleName / type / 能力 / 内嵌证书指纹"""
import base64
import hashlib
import json
import re
import sys

def parse(p7b):
    t = open(p7b, 'rb').read().decode('utf-8', errors='ignore')
    start = t.index('{')
    o, _ = json.JSONDecoder().raw_decode(t[start:])
    bi = o.get('bundle-info', {})
    cert_b64 = bi.get('distribution-certificate') or bi.get('development-certificate') or ''
    der = base64.b64decode(re.sub(r'-----.*?-----', '', cert_b64, flags=re.S).replace('\n', '')) if cert_b64 else b''
    return o, bi, hashlib.sha256(der).hexdigest().upper() if der else ''

for p in sys.argv[1:]:
    o, bi, fp = parse(p)
    print('===', p.split('\\')[-1], '===')
    print(' type:', o.get('type'), '| dist:', o.get('app-distribution-type'))
    print(' bundle-name:', bi.get('bundle-name'))
    print(' cert SHA256:', fp)
    print(' acls:', o.get('acls'))
    # 能力相关字段
    for k in ('app-privilege-capabilities', 'permissions', 'app-feature'):
        if o.get(k):
            print(' ', k, ':', json.dumps(o[k], ensure_ascii=False)[:200])

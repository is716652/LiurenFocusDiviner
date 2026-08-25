# -*- coding: utf-8 -*-
"""比对 cer 与 p7b 内嵌发布证书的 SHA256 指纹"""
import re, hashlib, base64, json

p7 = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\APPCerts\LiurenFocusDivinerRelease.p7b'
t = open(p7, 'rb').read().decode('utf-8', errors='ignore')
start = t.index('{')
o, _ = json.JSONDecoder().raw_decode(t[start:])
cert_b64 = o['bundle-info']['distribution-certificate']
p7_der = base64.b64decode(re.sub(r'-----.*?-----', '', cert_b64, flags=re.S).replace('\n', ''))
print('p7b embedded cert SHA256:', hashlib.sha256(p7_der).hexdigest().upper())

cer_txt = open(r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\APPCerts\LiurenFocusDiviner.cer',
               'rb').read().decode('utf-8')
b64 = re.sub(r'-----.*?-----', '', cer_txt, flags=re.S).replace('\n', '').strip()
b64 += '=' * (-len(b64) % 4)
cer_der = base64.b64decode(b64)
print('cer file    cert SHA256:', hashlib.sha256(cer_der).hexdigest().upper())
print('MATCH' if p7_der == cer_der else 'MISMATCH!')

# -*- coding: utf-8 -*-
"""临时核查脚本：列出发布 .app → .hap → resources/rawfile 条目（打包后实证）。
用法：python _tools/_inspect_app_pkg.py <app 路径>
"""
import hashlib
import io
import os
import sys
import zipfile

path = sys.argv[1]
size = os.path.getsize(path)
h = hashlib.sha256()
with io.open(path, 'rb') as f:
    for blk in iter(lambda: f.read(1 << 20), b''):
        h.update(blk)
print('APP:', path)
print('size: %d bytes' % size)
print('sha256:', h.hexdigest())

za = zipfile.ZipFile(path)
print('--- .app 顶层条目 ---')
for n in za.namelist():
    print('  %-28s compressed=%d' % (n, za.getinfo(n).compress_size))

hap_name = [n for n in za.namelist() if n.endswith('.hap')][0]
hap_bytes = za.read(hap_name)
print('--- %s 解压后 %d bytes ---' % (hap_name, len(hap_bytes)))

zh = zipfile.ZipFile(io.BytesIO(hap_bytes))
groups = {}
for n in zh.namelist():
    if n.startswith('resources/rawfile/'):
        groups.setdefault('rawfile', []).append(n)
    elif n.startswith('resources/'):
        groups.setdefault('resources', []).append(n)
    else:
        groups.setdefault('other', []).append(n)

d = sorted(groups.get('rawfile', []))
print('--- rawfile 条目总数: %d ---' % len(d))
for key in ('ancient/', 'rule/', 'cal/'):
    sub = [x for x in d if x.startswith('resources/rawfile/' + key)]
    print('--- %s: %d 条 ---' % (key, len(sub)))
    for n in sub:
        print('  %-52s %8d' % (n, zh.getinfo(n).file_size))
top = [x for x in d if x.count('/') == 2]
print('--- rawfile 根下直接文件 ---')
for n in top:
    print('  %-52s %8d' % (n, zh.getinfo(n).file_size))

print('--- 关键探针 ---')
for probe in ('resources/rawfile/ancient/case_gallery.json',
              'resources/rawfile/ancient/case_story.json',
              'resources/rawfile/ancient/zhonghuang_jing.json',
              'resources/rawfile/cal/yj_all.json'):
    print('  %-52s %s' % (probe, 'PRESENT' if probe in zh.namelist() else 'ABSENT'))

print('--- 收费块数据探针（免费包应无；主版包命中属正常，不参与本探针退出码）---')
paid = ('resources/rawfile/ancient/case_gallery.json',
        'resources/rawfile/ancient/case_story.json')
hit = [x for x in paid if x in zh.namelist()]
is_free = 'free' in os.path.basename(path).lower()
if hit and is_free:
    print('  免费包内发现收费块数据: %s  → FAIL' % ', '.join(hit))
    raise SystemExit(2)
print('  免费包：%s；命中条目 %s' % ('是' if is_free else '否', hit if hit else '无'))


# -*- coding: utf-8 -*-
"""临时核查脚本：逐条目对比两个 .app（新免费包 vs 归档旧包），定位字节差异来源。
用法：python _tools/_diff_app_pkg.py <旧 app> <新 app>
"""
import io
import sys
import zipfile


def open_hap(path):
    za = zipfile.ZipFile(path)
    hap = [n for n in za.namelist() if n.endswith('.hap')][0]
    return za, hap, zipfile.ZipFile(io.BytesIO(za.read(hap)))


old_a, old_hap, old_z = open_hap(sys.argv[1])
new_a, new_hap, new_z = open_hap(sys.argv[2])

print('=== .app 顶层条目 compressed 对比 ===')
for name in sorted(set(old_a.namelist()) | set(new_a.namelist())):
    o = old_a.getinfo(name).compress_size if name in old_a.namelist() else None
    n = new_a.getinfo(name).compress_size if name in new_a.namelist() else None
    d = (n - o) if (o is not None and n is not None) else None
    print('  %-24s old=%-10s new=%-10s delta=%s' % (name, o, n, d))

print('=== hap 内条目差异 ===')
old_names = set(old_z.namelist())
new_names = set(new_z.namelist())
for name in sorted(old_names - new_names):
    print('  仅旧包有: %-52s size=%8d compressed=%8d' % (
        name, old_z.getinfo(name).file_size, old_z.getinfo(name).compress_size))
for name in sorted(new_names - old_names):
    print('  仅新包有: %-52s size=%8d' % (name, new_z.getinfo(name).file_size))

diff = [n for n in sorted(old_names & new_names)
        if old_z.getinfo(n).file_size != new_z.getinfo(n).file_size
        or old_z.getinfo(n).compress_size != new_z.getinfo(n).compress_size]
print('  共有但大小变化: %d 条' % len(diff))
for name in diff:
    oi, ni = old_z.getinfo(name), new_z.getinfo(name)
    print('    %-52s size %d -> %d (%+d)  compressed %d -> %d (%+d)' % (
        name, oi.file_size, ni.file_size, ni.file_size - oi.file_size,
        oi.compress_size, ni.compress_size, ni.compress_size - oi.compress_size))

removed_size = sum(old_z.getinfo(n).file_size for n in sorted(old_names - new_names))
removed_comp = sum(old_z.getinfo(n).compress_size for n in sorted(old_names - new_names))
hap_delta = (new_a.getinfo(new_hap).compress_size - old_a.getinfo(old_hap).compress_size)
print('=== 汇总 ===')
print('  被删条目未压缩合计: %d bytes' % removed_size)
print('  被删条目压缩合计:   %d bytes' % removed_comp)
print('  .app 顶层 %s compressed 变化: %d bytes' % (new_hap, hap_delta))

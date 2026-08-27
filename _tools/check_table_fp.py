# -*- coding: utf-8 -*-
"""检查:非盘式、非四课/三传/天地盘/环列 的段落中含全角空格的数量(评估 isTableBlock 误判)"""
import io, json, os

P = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'resources', 'rawfile', 'ancient', 'zhonghuang_jing.json')
book = json.load(io.open(P, encoding='utf-8'))
ZHI = '子丑寅卯辰巳午未申酉戌亥'

def lines(p): return [x for x in p.split('\n') if x.strip()]
def is_section(p):
    t = p.strip()
    return t in ('四课','三传','四課','三傳')
def is_keg(p):
    t = p.strip()
    return (t.startswith('四课') or t.startswith('四課') or t.startswith('第四课') or t.startswith('第四課')) and len(lines(p))>=2
def is_chuan(p):
    t = p.strip()
    return t.startswith('三传') or t.startswith('三傳') or (t.startswith('初') and '中' in t and '末' in t)
def is_jiang(p):
    t = p.strip()
    return t.startswith('天将') or t.startswith('天將')
def is_disk(p):
    if '\n' not in p: return False
    ls = lines(p)
    if len(ls) < 3: return False
    first, last = ls[0].split(), ls[-1].split()
    return len(first)==4 and len(last)==4 and all(x in ZHI for x in first) and all(x in ZHI for x in last)
def is_ring(p):
    if '\n' not in p: return False
    ls = lines(p)
    if len(ls) < 3: return False
    total = sum(len(x.split()) for x in ls)
    ok = all(all(y in ZHI for y in x.split()) for x in ls)
    return ok and total == 12

# 模拟 AncientStudy 分支顺序
false_pos = []
true_pos = []
for ch in book['篇目']:
    for i, pp in enumerate(ch['段落']):
        if is_section(pp) or is_keg(pp) or is_chuan(pp) or is_jiang(pp) or is_disk(pp) or is_ring(pp):
            continue
        if '\u3000' in pp:
            if '```' in pp:
                true_pos.append((ch['序'], i, 'code'))
            elif len(lines(pp)) >= 2:
                true_pos.append((ch['序'], i, 'table?'))
            else:
                false_pos.append((ch['序'], i, pp[:30]))
print('表格/代码块(应有):', len(true_pos))
print('可能误判(单行含全角空格):', len(false_pos))
for t in false_pos[:10]:
    print('  误判? 篇%d [%d]: %s' % t)

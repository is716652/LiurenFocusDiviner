# -*- coding: utf-8 -*-
"""古籍研习数据生成：中黄五变经 28 篇经文 md → rawfile/ancient/zhonghuang_jing.json
 - 解析规则：# H1=卷名 / ## H2=篇名 / 空行分段；md 表格行 → 全角空格连接的文本行
 - 导语取自《中黄五变经研读整理.md》篇目导读表
 - 输出到主项目 rawfile（免费版由 sync_free_edition.py 同步）
用法：python _tools/gen_ancient_json.py
"""
import io
import json
import os
import re

ROOT = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design'
SRC = os.path.join(ROOT, '大六壬文档', '中黄五变经', '经文')
OUT = os.path.join(ROOT, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main',
                   'resources', 'rawfile', 'ancient', 'zhonghuang_jing.json')

DAOYU = {
    0: '传承与校勘：日干及时干再演之出处',
    1: '日为己身，干为我',
    2: '外人之象：三传年命皆他人',
    3: '亲族关系；建=遁干（五子元遁）',
    4: '外姓职业：建干所临所乘定人',
    5: '五行活法（核心）：五变之名所由起',
    6: '主事应期：初传定年月日时',
    7: '男女相害：藏干相合关系',
    8: '人形相貌：地支+遁干定形貌',
    9: '来意十二将：天将断来意',
    10: '事之二字：事象解析',
    11: '通神：白虎+遁干庚辛为鬼例',
    12: '真鬼：遁干临支上要诀',
    13: '建合复建（核心）：日遁时遁交加相合/相克',
    14: '年命遁法：年命遁干参断',
    15: '吉凶实意：青龙克日/生日断',
    16: '官讼：日上/辰上干支，建干+纳音入墓',
    17: '疾病占断',
    18: '占失盗',
    19: '占逃人',
    20: '出行之占',
    21: '歌诀+释文，无课式',
    22: '求官官运',
    23: '升迁之占',
    24: '财与妻占',
    25: '婚姻之占',
    26: '天气之占',
    27: '藏物之占：五子元建干取色',
    28: '寻故井',
}

# 规范篇名（依研读整理篇目导读；各 md 标题格式不一，不解析）
PIANMING = {
    0: '序', 1: '释己身第一', 2: '释他人第二', 3: '释宗亲第三',
    4: '释门类诸人第四', 5: '释五行正形第五', 6: '释主事第六',
    7: '释别男女相害第七', 8: '论人形貌第八', 9: '释来意十二将第九',
    10: '释事二字第十', 11: '释通神集第十一', 12: '释见真鬼第十二',
    13: '释复建真鬼第十三', 14: '释年命遁法第十四', 15: '释吉凶实意第十五',
    16: '释官讼门第十六', 17: '释占疾病门第十七', 18: '释占亡盗门第十八',
    19: '释占逃走人第十九', 20: '释占远行近出第二十', 21: '释集类门第二十一',
    22: '释求官第二十二', 23: '释遷官第二十三', 24: '释妻财各异第二十四',
    25: '释占婚姻第二十五', 26: '释占风雨第二十六', 27: '释占伏藏法第二十七',
    28: '释故井法第二十八',
}

def juan_of(no: int) -> str:
    if no == 0:
        return '卷首'
    if no <= 9:
        return '卷之一'
    if no <= 16:
        return '卷之二/三'
    return '卷之三/四'

def conv_table_line(line):
    cells = [c.strip() for c in line.strip().strip('|').split('|')]
    if cells and all(re.fullmatch(r':?-+:?', c) for c in cells if c):
        return ''
    return '　'.join(c for c in cells if c)

def parse_md(path, no):
    s = io.open(path, encoding='utf-8').read()
    paras = []
    buf = []
    for line in s.splitlines():
        t = line.strip()
        if t.startswith('#'):
            continue
        if t.startswith('|'):
            conv = conv_table_line(t)
            if conv:
                buf.append(conv)
            continue
        if t == '':
            if buf:
                joined = '\n'.join(buf).strip()
                if joined:
                    paras.append(joined)
                buf = []
            continue
        buf.append(t)
    if buf:
        joined = '\n'.join(buf).strip()
        if joined:
            paras.append(joined)
    return {'卷': juan_of(no), '序': no, '篇名': PIANMING[no],
            '导语': DAOYU.get(no, ''), '段落': paras}

def main():
    files = []
    for f in os.listdir(SRC):
        m = re.match(r'^(\d+)\.', f)
        if f.endswith('.md') and m:
            files.append((int(m.group(1)), f))
    files.sort()
    chapters = [parse_md(os.path.join(SRC, f), no) for no, f in files]
    book = {'书名': '鬼贼五变中黄经', '篇目': chapters}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    io.open(OUT, 'w', encoding='utf-8', newline='').write(
        json.dumps(book, ensure_ascii=False, indent=1))
    total = sum(len(c['段落']) for c in chapters)
    print('chapters:', len(chapters), '| paragraphs:', total,
          '| size:', os.path.getsize(OUT), 'bytes')
    for c in chapters[:4] + chapters[-3:]:
        print(' ', c['序'], c['卷'], '/', c['篇名'], '/', len(c['段落']), '段')

if __name__ == '__main__':
    main()

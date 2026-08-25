# -*- coding: utf-8 -*-
"""补丁：古籍案例速排 选填项不完整提示（年干年支须成对）"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Index.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    old = """    /* ② 年干支阴阳匹配（若填了年干支） */
    if (this.ancientYG !== '' && this.ancientYZ !== '' && !LiurenCore.validGanZhi(this.ancientYG, this.ancientYZ)) {
      this.ancientNote = '年干支不合：' + this.ancientYG + this.ancientYZ + '（阴阳不配，不存在）';
      return;
    }"""
    assert s.count(old) == 1, 'old: %d' % s.count(old)
    new = """    /* ② 年干支须成对填写（只填一个则提示） */
    if ((this.ancientYG === '') !== (this.ancientYZ === '')) {
      this.ancientNote = '年干支需同时填写天干与地支（当前只填了' +
        (this.ancientYG !== '' ? '年干' : '年支') + '）';
      return;
    }
    /* ②b 年干支阴阳匹配（若填了年干支） */
    if (this.ancientYG !== '' && this.ancientYZ !== '' && !LiurenCore.validGanZhi(this.ancientYG, this.ancientYZ)) {
      this.ancientNote = '年干支不合：' + this.ancientYG + this.ancientYZ + '（阴阳不配，不存在）';
      return;
    }"""
    s = s.replace(old, new)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('HM INCOMPLETE PROMPT PATCH OK')

if __name__ == '__main__':
    main()

# -*- coding: utf-8 -*-
"""补丁：鸿蒙 Index.ets 行年升级 —— 调用传用神 + 展示互动/太岁/乘将"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Index.ets'

def read(p):
    with io.open(p, 'r', encoding='utf-8') as f:
        return f.read()

def write(p, s):
    with io.open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(s)

def rep_all(s, old, new):
    n = s.count(old)
    if n == 0:
        raise SystemExit('NOT FOUND:\n' + old[:150])
    return s.replace(old, new), n

def main():
    s = read(P)

    # ① 4 处调用加第五参 this.yongShen（changeBirthYear / commitBirthEdit / doChart / 性别点击）
    s, n1 = rep_all(s,
        "this.xingnian = LiurenCore.xingNian(c, ny, this.year, this.gender);",
        "this.xingnian = LiurenCore.xingNian(c, ny, this.year, this.gender, this.yongShen);")
    s, n2 = rep_all(s,
        "this.xingnian = LiurenCore.xingNian(c, n, this.year, this.gender);",
        "this.xingnian = LiurenCore.xingNian(c, n, this.year, this.gender, this.yongShen);")
    s, n3 = rep_all(s,
        "this.xingnian = LiurenCore.xingNian(c, this.birthYear, this.year, this.gender);",
        "this.xingnian = LiurenCore.xingNian(c, this.birthYear, this.year, this.gender, this.yongShen);")
    s, n4 = rep_all(s,
        "this.xingnian = LiurenCore.xingNian(c, this.birthYear, this.year, g);",
        "this.xingnian = LiurenCore.xingNian(c, this.birthYear, this.year, g, this.yongShen);")

    # ② 展示块：第一行加 与用神关系/太岁/乘将；断语行保留 advice（已含互动+太岁+乘将）
    old_disp = """              Text('本命' + this.xingnian.benMingGan + this.xingnian.benMingZhi +
                '（' + (this.xingnian.shun ? '顺行' : '逆行') + '）· 行年' + this.xingnian.xingNianZhi +
                ' · 上神' + this.xingnian.shangShen + '（' + this.xingnian.liuqin + '）' +
                (this.xingnian.kong ? '·空' : '') + ' ' + this.xingnian.wangShuai)
                .fontSize(11)
                .fontColor('#C4B183')
                .lineHeight(16)
                .width('100%')"""
    new_disp = """              Text('本命' + this.xingnian.benMingGan + this.xingnian.benMingZhi +
                '（' + (this.xingnian.shun ? '顺行' : '逆行') + '）· 行年' + this.xingnian.xingNianZhi +
                ' · 上神' + this.xingnian.shangShen + '（' + this.xingnian.liuqin + '）' +
                (this.xingnian.kong ? '·空' : '') + ' ' + this.xingnian.wangShuai)
                .fontSize(11)
                .fontColor('#C4B183')
                .lineHeight(16)
                .width('100%')
              if (this.xingnian.rel !== '') {
                Text('与用神' + this.xingnian.yongShen + '：' + this.xingnian.rel)
                  .fontSize(11)
                  .fontColor('#C4B183')
                  .lineHeight(16)
                  .width('100%')
              }
              Text('流年·' + this.xingnian.tsRel + (this.xingnian.jiang !== '' ? ' · 乘将' + this.xingnian.jiang + '（' + this.xingnian.jiangJx + '）' : ''))
                .fontSize(11)
                .fontColor('#C4B183')
                .lineHeight(16)
                .width('100%')"""
    s = rep_all(s, old_disp, new_disp)[0]

    write(P, s)
    print('PATCH OK (calls: %d/%d/%d/%d)' % (n1, n2, n3, n4))

if __name__ == '__main__':
    main()

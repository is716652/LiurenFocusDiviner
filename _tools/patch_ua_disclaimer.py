# -*- coding: utf-8 -*-
"""补丁：用户协议加「传统文化研习特别说明」免责条款"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Legal\UserAgreement.ets'

def read(p):
    with io.open(p, 'r', encoding='utf-8') as f:
        return f.read()

def write(p, s):
    with io.open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(s)

def main():
    s = read(P)
    old = "          Text('免责声明与责任限制')"
    assert s.count(old) == 1, s.count(old)
    new = """          Text('传统文化研习特别说明')
            .fontSize(16)
            .fontWeight(FontWeight.Bold)
            .fontColor('#F0E6C8')
          Text('本软件中的历法、排盘、断语等内容均为传统术数典籍的数字化整理与展示，仅用于中华传统文化研习与学术参考。软件展示的古籍断语、吉凶表述等均为典籍原文或依其法诀的归纳，不代表任何事实判断或未来预测，不构成任何投资、医疗、法律、婚恋或其他决策建议。请理性使用，勿以此替代专业意见。')
            .fontSize(14)
            .fontColor('#D8C9A3')
            .lineHeight(22)
            .textAlign(TextAlign.Start)

          Text('免责声明与责任限制')"""
    s = s.replace(old, new)
    write(P, s)
    print('UA PATCH OK')

if __name__ == '__main__':
    main()

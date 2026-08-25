# -*- coding: utf-8 -*-
"""补丁：Web 案例速排 年干支成对提示"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\UI\大六壬万年历起课.html'

def main():
    s = io.open(P, encoding='utf-8').read()

    old = """  // ② 年干支阴阳匹配
  if(yg&&yz&&!LiurenCore.validGanZhi(yg,yz)){alert("年干支不合："+yg+yz+"（阴阳不配，不存在）");return;}"""
    assert s.count(old) == 1, 'old: %d' % s.count(old)
    new = """  // ② 年干支须成对
  if((!!yg)!==(!!yz)){alert("年干支需同时填写天干与地支（当前只填了"+(yg?"年干":"年支")+"）");return;}
  // ②b 年干支阴阳匹配
  if(yg&&yz&&!LiurenCore.validGanZhi(yg,yz)){alert("年干支不合："+yg+yz+"（阴阳不配，不存在）");return;}"""
    s = s.replace(old, new)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('WEB INCOMPLETE PROMPT PATCH OK')

if __name__ == '__main__':
    main()

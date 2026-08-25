# -*- coding: utf-8 -*-
"""补丁：Web 大六壬万年历起课.html 行年升级 —— 调用传 curYongshen + 展示互动/太岁/乘将"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\UI\大六壬万年历起课.html'

def read(p):
    with io.open(p, 'r', encoding='utf-8') as f:
        return f.read()

def write(p, s):
    with io.open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(s)

def rep(s, old, new):
    n = s.count(old)
    if n != 1:
        raise SystemExit('EXPECT 1 got %d:\n%s' % (n, old[:150]))
    return s.replace(old, new)

def main():
    s = read(P)
    old = """      const x=LiurenCore.xingNian(chartC,curBirthYear,cy,curGender);
      xn=`<div style="margin-top:8px;border-top:1px dashed var(--divider);padding-top:8px;">
        <div style="font-size:12px;color:var(--text_secondary);margin-bottom:6px;">行年小运</div>
        <div style="font-size:13px;margin-bottom:6px;">出生年
          <input id="xnBirth" type="number" min="1900" max="${cy}" value="${curBirthYear}" style="width:64px;padding:3px 6px;border-radius:8px;border:1px solid var(--divider);background:var(--surface);color:var(--text_primary);font-size:13px;">
          ${["男","女"].map(g=>`<span class="ls-chip${curGender===g?" on":""}" onclick="pickGender('${g}')" style="display:inline-block;padding:3px 12px;border-radius:12px;margin-left:6px;font-size:13px;${curGender===g?"background:var(--brand_gold);color:#1A1410;":"background:var(--surface);color:var(--text_primary);border:1px solid var(--divider);"}">${g}</span>`).join("")}
        </div>
        <div style="font-size:13px;color:var(--brand_gold);">本命${x.benMingGan}${x.benMingZhi}（${x.shun?"顺行":"逆行"}）· 行年${x.xingNianZhi} · 上神${x.shangShen}（${x.liuqin}）${x.kong?"·空":""} ${x.wangShuai}</div>
        <div style="font-size:12px;color:var(--text_secondary);line-height:1.8;">${x.advice}</div>
        <div style="font-size:11px;color:var(--text_tertiary);margin-top:4px;">注：行年起法依《六壬大全》本命起数；《集要》另法存疑未采</div>
      </div>`;"""
    new = """      const x=LiurenCore.xingNian(chartC,curBirthYear,cy,curGender,curYongshen||"");
      xn=`<div style="margin-top:8px;border-top:1px dashed var(--divider);padding-top:8px;">
        <div style="font-size:12px;color:var(--text_secondary);margin-bottom:6px;">行年小运</div>
        <div style="font-size:13px;margin-bottom:6px;">出生年
          <input id="xnBirth" type="number" min="1900" max="${cy}" value="${curBirthYear}" style="width:64px;padding:3px 6px;border-radius:8px;border:1px solid var(--divider);background:var(--surface);color:var(--text_primary);font-size:13px;">
          ${["男","女"].map(g=>`<span class="ls-chip${curGender===g?" on":""}" onclick="pickGender('${g}')" style="display:inline-block;padding:3px 12px;border-radius:12px;margin-left:6px;font-size:13px;${curGender===g?"background:var(--brand_gold);color:#1A1410;":"background:var(--surface);color:var(--text_primary);border:1px solid var(--divider);"}">${g}</span>`).join("")}
        </div>
        <div style="font-size:13px;color:var(--brand_gold);">本命${x.benMingGan}${x.benMingZhi}（${x.shun?"顺行":"逆行"}）· 行年${x.xingNianZhi} · 上神${x.shangShen}（${x.liuqin}）${x.kong?"·空":""} ${x.wangShuai}</div>
        ${x.rel?`<div style="font-size:12px;color:var(--text_secondary);">与用神${x.yongShen}：${x.rel}</div>`:""}
        <div style="font-size:12px;color:var(--text_secondary);">流年·${x.tsRel}${x.jiang?` · 乘将${x.jiang}（${x.jiangJx}）`:""}</div>
        <div style="font-size:12px;color:var(--text_secondary);line-height:1.8;">${x.advice}</div>
        <div style="font-size:11px;color:var(--text_tertiary);margin-top:4px;">注：行年起法依《六壬大全》本命起数；《集要》另法存疑未采</div>
      </div>`;"""
    s = rep(s, old, new)
    write(P, s)
    print('WEB PATCH OK')

if __name__ == '__main__':
    main()

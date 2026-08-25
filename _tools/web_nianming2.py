# -*- coding: utf-8 -*-
"""Web 端：renderNianming 传用神 + 显示互动关系 + 版本号"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\UI\大六壬万年历起课.html"
t = io.open(p, encoding="utf-8").read()

# 1. 版本号
t2 = t.replace('?v=20260818-9', '?v=20260818-10')
if t2 != t:
    t = t2
    print("OK ver10")

# 2. renderNianming 调用传 curYongshen + 显示 rel
old = """  if(curNianZhi){
    const na=LiurenCore.nianmingAdvice(chartC,curNianZhi);
    body=`<div style="margin-top:6px;font-size:13px;color:var(--brand_gold);">年命${na.nianZhi} · 上神${na.shangShen}（${na.liuqin}）${na.kong?"·空":""} ${na.wangShuai}</div>
      <div style="font-size:12px;color:var(--text_secondary);line-height:1.8;">${na.advice}</div>`;
  }"""
new = """  if(curNianZhi){
    const na=LiurenCore.nianmingAdvice(chartC,curNianZhi,curYongshen||"");
    body=`<div style="margin-top:6px;font-size:13px;color:var(--brand_gold);">年命${na.nianZhi} · 上神${na.shangShen}（${na.liuqin}）${na.kong?"·空":""} ${na.wangShuai}${na.rel?` · 与用神${na.rel}`:""}</div>
      <div style="font-size:12px;color:var(--text_secondary);line-height:1.8;">${na.advice}</div>`;
  }"""
if old in t:
    t = t.replace(old, new)
    print("OK nianming web")
else:
    print("MISS nianming web")

io.open(p, "w", encoding="utf-8").write(t)
print("done")

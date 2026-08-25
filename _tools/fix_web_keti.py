# -*- coding: utf-8 -*-
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\UI\大六壬万年历起课.html"
t = io.open(p, encoding="utf-8").read()

old = """function renderChuan(c){
  const {r,sanchuan,tp,jiangMap}=c;
  document.getElementById("zongmen").textContent=`九宗门 · ${sanchuan.method}`;"""
new = """function renderChuan(c){
  const {r,sanchuan,tp,jiangMap}=c;
  /* 课体课显示课体名（伏吟/返吟/八专/别责/昴星…），普通课显示宗门法 */
  const title = (sanchuan.keti && sanchuan.keti !== '') ? sanchuan.keti : sanchuan.method;
  document.getElementById("zongmen").textContent=`九宗门 · ${title}`;"""

if old in t:
    t = t.replace(old, new)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK")
else:
    print("MISS")

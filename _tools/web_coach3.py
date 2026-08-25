# -*- coding: utf-8 -*-
"""Web 端：教练栏加分组解读 + 年命适配 UI + 版本号"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\UI\大六壬万年历起课.html"
t = io.open(p, encoding="utf-8").read()

# 1. 版本号
t2 = t.replace('?v=20260818-8', '?v=20260818-9')
if t2 != t:
    t = t2
    print("OK ver9")

# 2. 教练栏加分组解读（在建议前）
old_group = """        ${coach.advice.length?`<div style="color:var(--text_secondary);font-size:12px;margin-top:4px;">建议：${coach.advice.join("；")}</div>`:""}"""
new_group = """        ${coach.groups.length?`<div style="color:var(--text_secondary);font-size:12px;margin-top:4px;">${coach.groups.map(g=>"· "+g).join("<br>")}</div>`:""}
        ${coach.advice.length?`<div style="color:var(--text_secondary);font-size:12px;margin-top:4px;">建议：${coach.advice.join("；")}</div>`:""}"""
if old_group in t:
    t = t.replace(old_group, new_group)
    print("OK groups")
else:
    print("MISS groups")

# 3. 年命适配 UI：在毕法区（lsBifa）后加年命区
#    在 lsBifa div 后找插入点 —— 看结构（lsBody 内）
old_bifa = """          <div class="ls-bifa" id="lsBifa"></div>"""
new_bifa = """          <div class="ls-bifa" id="lsBifa"></div>
          <div class="ls-nianming" id="lsNianming" style="margin-top:8px;"></div>"""
if old_bifa in t:
    t = t.replace(old_bifa, new_bifa)
    print("OK nianming div")
else:
    print("MISS nianming div")

io.open(p, "w", encoding="utf-8").write(t)
print("done")

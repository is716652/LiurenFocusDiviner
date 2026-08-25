# -*- coding: utf-8 -*-
"""Web 端：引用 bifa_coach.js + 版本号 + renderBifaSection 教练栏"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\UI\大六壬万年历起课.html"
t = io.open(p, encoding="utf-8").read()

# 1. 引用脚本（在 bifa.js 后）
old_script = '<script src="_data/bifa.js"></script>'
new_script = '<script src="_data/bifa.js"></script>\n<script src="_data/bifa_coach.js"></script>'
if old_script in t:
    t = t.replace(old_script, new_script)
    print("OK script ref")
else:
    print("MISS script ref")

# 2. 版本号
t2 = t.replace('?v=20260818-7', '?v=20260818-8')
if t2 != t:
    t = t2
    print("OK ver8")

# 3. renderBifaSection：在 box.innerHTML 前插入教练栏
old_rb = """  const rel=bifaItems.filter(x=>x.相关), rest=bifaItems.filter(x=>!x.相关);"""
new_rb = """  /* 毕法教练栏：组合断 + 建议汇总 */
  let coachHtml="";
  try{
    const coach=LiurenCore.bifaCoach(c.dx.bifa, window.BIFA_COACH||{});
    if(coach.items.length){
      const tone=coach.xiong>coach.ji?"var(--brand_cinnabar)":"var(--brand_gold)";
      coachHtml=`<div class="bf-coach" style="padding:10px 12px;border-radius:12px;background:${coach.xiong>coach.ji?"rgba(208,112,74,.10)":"rgba(233,200,120,.08)"};border:1px solid ${coach.xiong>coach.ji?"rgba(208,112,74,.35)":"rgba(233,200,120,.25)"};margin-bottom:8px;">
        <div style="color:${tone};font-size:13px;font-weight:600;">🧭 ${coach.summary}</div>
        ${coach.advice.length?`<div style="color:var(--text_secondary);font-size:12px;margin-top:4px;">建议：${coach.advice.join("；")}</div>`:""}
      </div>`;
    }
  }catch(e){ coachHtml=""; }
  const rel=bifaItems.filter(x=>x.相关), rest=bifaItems.filter(x=>!x.相关);"""
if old_rb in t:
    t = t.replace(old_rb, new_rb)
    print("OK coach html")
else:
    print("MISS renderBifa")

# 4. 输出处加 coachHtml（找到 box.innerHTML 的毕法开头）
old_box = """  box.innerHTML=
    `<div class="t">毕法格局（随用神 · 动态三传 ${c1}→${c2}→${c3}）</div>`+"""
new_box = """  box.innerHTML=
    coachHtml+
    `<div class="t">毕法格局（随用神 · 动态三传 ${c1}→${c2}→${c3}）</div>`+"""
if old_box in t:
    t = t.replace(old_box, new_box)
    print("OK box innerHTML")
else:
    print("MISS box innerHTML")

io.open(p, "w", encoding="utf-8").write(t)
print("done")

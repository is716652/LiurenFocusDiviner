# -*- coding: utf-8 -*-
"""生成图标预览页"""
from PIL import Image
import os

OUT = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\resources\base\media'
PREVIEW = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\UI\_icon_preview.html'

im = Image.open(os.path.join(OUT, 'icon_full.png')).convert('RGB')
im.thumbnail((480, 480), Image.LANCZOS)
thumb = os.path.join(os.path.dirname(PREVIEW), '_icon_thumb.png')
im.save(thumb)

html = """<!doctype html><html><head><meta charset="utf-8"><title>图标预览</title>
<style>body{background:#12100c;color:#E9C878;font-family:system-ui;display:flex;flex-direction:column;align-items:center;gap:18px;padding:40px}
.card{background:#1C1A16;border:1px solid rgba(233,200,120,.25);border-radius:20px;padding:28px;display:flex;flex-direction:column;align-items:center;gap:8px}
img{border-radius:18%;box-shadow:0 8px 40px rgba(0,0,0,.6)}
.small{font-size:12px;color:#8A7B5C}.t{font-size:15px;font-weight:600;letter-spacing:1px}</style></head><body>
<div class="card"><div class="t">墨夜鎏金 · 天盘壬字</div>
<img src="_icon_thumb.png" width="240" height="240">
<div class="small">1024x1024 PNG 18KB · 纯色底无圆角 · 主体居中安全区</div>
<div class="small">天盘十二宫刻度环 + 亮金加临刻度 + 中心「壬」字 · 与应用 Splash 墨夜鎏金同源</div></div></body></html>"""
with open(PREVIEW, 'w', encoding='utf-8') as f:
    f.write(html)
print('preview:', PREVIEW)

# -*- coding: utf-8 -*-
"""生成鸿蒙应用图标（墨夜鎏金 · 天盘壬字）：
  - foreground.png  1024x1024 透明底：鎏金天盘环 + 壬字（分层图标前景）
  - background.png  1024x1024 纯色深墨底（分层图标背景）
  - icon_full.png   1024x1024 合成图（上传/预览用，正方形纯色底无圆角）
符合华为规范：正方形、PNG、主体居中安全区、无透明底（合成图）"""
from PIL import Image, ImageDraw, ImageFont
import math, os

SZ = 1024
OUT = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\resources\base\media'

# 配色（与 Splash 墨夜鎏金一致）
INK      = (23, 21, 15, 255)      # 深墨底 #17150F
INK_2    = (38, 33, 22, 255)      # 渐深
GOLD     = (233, 200, 120, 255)   # 鎏金 #E9C878
GOLD_LT  = (240, 217, 140, 255)   # 亮金 #F0D98C
GOLD_DK  = (168, 132, 60, 255)    # 暗金 #A8843C
CREAM    = (240, 230, 200, 255)   # 米白 #F0E6C8

def font_path():
    for cand in [r'C:\Windows\Fonts\msyhbd.ttc', r'C:\Windows\Fonts\simhei.ttf']:
        if os.path.exists(cand):
            return cand
    raise SystemExit('no chinese font')

def draw_disk(d, cx, cy, r_out, r_in, rot_deg=0.0, scale_deg=18.0, n=12):
    """鎏金天盘环：外环 + 十二宫刻度（小短线）+ 内圈刻度点
       rot_deg: 天盘旋转角（表现加临错位）"""
    # 外环
    d.ellipse([cx-r_out, cy-r_out, cx+r_out, cy+r_out], outline=GOLD, width=14)
    # 内细环
    rr = (r_out + r_in) / 2
    d.ellipse([cx-rr, cy-rr, cx+rr, cy+rr], outline=GOLD_DK, width=4)
    # 十二宫刻度短线（外环内侧 + 内环外侧）
    for i in range(n):
        a0 = math.radians(i * 30 + rot_deg)
        # 外环内侧短线
        x1 = cx + (r_out - 20) * math.cos(a0)
        y1 = cy + (r_out - 20) * math.sin(a0)
        x2 = cx + (r_out - 64) * math.cos(a0)
        y2 = cy + (r_out - 64) * math.sin(a0)
        d.line([x1, y1, x2, y2], fill=GOLD, width=10)
        # 内环外侧小点
        xp = cx + (rr + 16) * math.cos(a0)
        yp = cy + (rr + 16) * math.sin(a0)
        rp = 8
        d.ellipse([xp-rp, yp-rp, xp+rp, yp+rp], fill=GOLD_DK)
    # 天盘加临标记：一个亮金大刻度（代表月将/占时）
    a1 = math.radians(rot_deg + scale_deg)
    x1 = cx + (r_out - 16) * math.cos(a1)
    y1 = cy + (r_out - 16) * math.sin(a1)
    x2 = cx + (r_out - 76) * math.cos(a1)
    y2 = cy + (r_out - 76) * math.sin(a1)
    d.line([x1, y1, x2, y2], fill=GOLD_LT, width=16)

def make_foreground():
    img = Image.new('RGBA', (SZ, SZ), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = cy = SZ / 2
    # 盘环：主体占安全区（中心 76%）
    r_out = 300
    r_in = 180
    draw_disk(d, cx, cy, r_out, r_in, rot_deg=-14.0, scale_deg=58.0)
    # 中心壬字
    f = ImageFont.truetype(font_path(), 300)
    txt = '壬'
    bbox = d.textbbox((0, 0), txt, font=f)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    d.text((cx - tw/2 - bbox[0], cy - th/2 - bbox[1] + 6), txt, font=f, fill=GOLD_LT)
    # 壬下小横线（式盘韵味）
    lw = 96
    ly = cy + 118
    d.rounded_rectangle([cx - lw/2, ly - 6, cx + lw/2, ly + 6], radius=3, fill=GOLD)
    return img

def make_background():
    img = Image.new('RGBA', (SZ, SZ), INK)
    # 径向渐变：中心微亮
    d = ImageDraw.Draw(img)
    steps = 120
    for i in range(steps):
        t = i / steps
        r = int(SZ / 2 * t)
        col = (
            int(INK[0] + (INK_2[0] - INK[0]) * t),
            int(INK[1] + (INK_2[1] - INK[1]) * t),
            int(INK[2] + (INK_2[2] - INK[2]) * t),
            255
        )
        d.ellipse([SZ/2 - r, SZ/2 - r, SZ/2 + r, SZ/2 + r], fill=col)
    return img

def main():
    fg = make_foreground()
    bg = make_background()
    fg.save(os.path.join(OUT, 'foreground.png'))
    bg.save(os.path.join(OUT, 'background.png'))
    # 合成上传图（纯色底无透明）
    full = bg.copy()
    full.alpha_composite(fg)
    full.save(os.path.join(OUT, 'icon_full.png'))
    # 尺寸报告
    for n in ['foreground.png', 'background.png', 'icon_full.png']:
        p = os.path.join(OUT, n)
        im = Image.open(p)
        sz = os.path.getsize(p)
        print(n, im.size, im.mode, '%d KB' % (sz // 1024))

if __name__ == '__main__':
    main()

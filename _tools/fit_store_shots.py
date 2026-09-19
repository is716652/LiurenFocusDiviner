# -*- coding: utf-8 -*-
"""把 1280x2832 的手机截图转成商店要求的 1080x1920（9:16）。

为什么用"按高缩放 + 左右补边"而不是裁剪或拉伸：
  · 裁剪要丢掉 469px 纵向内容，而我**看不到图片内容**（模型不支持读图），裁错就切掉正文；
  · 拉伸（1280x2832 → 1080x1920）纵向压 20%，圆盘会变椭圆，绝不可用；
  · 两张图四边都是**单一底色**（实测 #13120E / #F1F0EB），故左右补边用同一颜色**完全无缝**，
    既不丢内容也不变形。
输出：PNG（无损，商店允许 ≤5MB）；若超过 5MB 再回落 JPEG q=95。
用法：python _tools/fit_store_shots.py
"""
import io
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, 'APP', 'screenshots_out', '1.05')
OUT_DIR = os.path.join(SRC_DIR, 'store_1080x1920')
TARGET_W, TARGET_H = 1080, 1920
MAX_BYTES = 5 * 1024 * 1024


def edge_color(im):
    """取四边像素的众数色：用作补边底色（无缝）。"""
    w, h = im.size
    px = im.load()
    counts = {}
    for x in range(0, w, 7):
        for y in (2, h - 3):
            c = px[x, y][:3]
            counts[c] = counts.get(c, 0) + 1
    for y in range(0, h, 7):
        for x in (2, w - 3):
            c = px[x, y][:3]
            counts[c] = counts.get(c, 0) + 1
    return max(counts.items(), key=lambda kv: kv[1])[0]


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    files = sorted(f for f in os.listdir(SRC_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')))
    for name in files:
        src = os.path.join(SRC_DIR, name)
        im = Image.open(src).convert('RGB')
        w, h = im.size
        bg = edge_color(im)
        scale = TARGET_H / float(h)
        new_w = int(round(w * scale))
        if new_w > TARGET_W:                      # 按高缩放后仍超宽（比如 9:16 更宽的源）才需要另议
            print('  ⚠ %s 按高缩放后宽 %d > %d，需人工定夺' % (name, new_w, TARGET_W))
            continue
        rs = im.resize((new_w, TARGET_H), Image.LANCZOS)
        canvas = Image.new('RGB', (TARGET_W, TARGET_H), bg)
        canvas.paste(rs, ((TARGET_W - new_w) // 2, 0))
        tone = 'dark' if sum(bg) < 384 else 'light'
        out = os.path.join(OUT_DIR, 'store_1080x1920_%s.png' % tone)
        canvas.save(out, 'PNG', optimize=True)
        size = os.path.getsize(out)
        if size > MAX_BYTES:                       # 超 5MB 再回落 JPEG
            out_jpg = out[:-4] + '.jpg'
            canvas.save(out_jpg, 'JPEG', quality=95, optimize=True, subsampling=0)
            os.remove(out)
            out, size = out_jpg, os.path.getsize(out_jpg)
        print('  %s' % name)
        print('    %dx%d → 内容 %dx%d 居中 + 左右各 %d px 补边（底色 #%02X%02X%02X，取自图边众数）'
              % (w, h, new_w, TARGET_H, (TARGET_W - new_w) // 2, bg[0], bg[1], bg[2]))
        print('    输出: %s  (%d 字节, %.2f MB, 比例 %.4f)' % (os.path.basename(out), size, size / 1048576.0, TARGET_W / float(TARGET_H)))
    print('输出目录: %s' % OUT_DIR)


if __name__ == '__main__':
    main()

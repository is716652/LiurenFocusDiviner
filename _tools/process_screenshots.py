# -*- coding: utf-8 -*-
"""应用商店截图批量处理：1280x2832 手机截图 → 1080x1920 (9:16) → PNG/WEBP
裁剪策略：居中裁剪（保留主体），再缩放。
用法: python _tools/process_screenshots.py <raw目录> [输出目录]
"""
import os
import sys
from PIL import Image

W, H = 1080, 1920  # 9:16

def crop_9x16(im):
    w, h = im.size
    target = W / H  # 0.5625
    if w / h > target:
        nw = int(h * target)
        x0 = (w - nw) // 2
        return im.crop((x0, 0, x0 + nw, h))
    else:
        nh = int(w / target)
        y0 = (h - nh) // 2
        return im.crop((0, y0, w, y0 + nh))

def main():
    raw = sys.argv[1] if len(sys.argv) > 1 else r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\tmp'
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(raw, '..', 'screenshots_out')
    out = os.path.normpath(out)
    os.makedirs(out, exist_ok=True)
    files = sorted(os.listdir(raw)) if os.path.isdir(raw) else []
    imgs = [f for f in files if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    if not imgs:
        print('no images in', raw)
        return
    for i, f in enumerate(imgs, 1):
        im = Image.open(os.path.join(raw, f)).convert('RGB')
        im = crop_9x16(im).resize((W, H), Image.LANCZOS)
        base = 'shot%02d' % i
        im.save(os.path.join(out, base + '.png'), 'PNG')
        wp = os.path.join(out, base + '.webp')
        q = 85
        while q > 25:
            im.save(wp, 'WEBP', quality=q)
            if os.path.getsize(wp) <= 200 * 1024:
                break
            q -= 6
        print('%s <- %s  (%dx%d, png %dKB, webp %dKB)' % (
            base, f, W, H, os.path.getsize(os.path.join(out, base + '.png')) // 1024,
            os.path.getsize(wp) // 1024))
    print('完成 ->', out)

if __name__ == '__main__':
    main()

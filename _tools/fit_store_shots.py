# -*- coding: utf-8 -*-
"""把手机截图转成商店要求的 1080x1920（9:16），并**裁掉系统 UI**（状态栏图标 / 底部手势条）。

为什么这么做（三条路都试过）：
  · 直接上传：9:19.9 不是 9:16 ⇒ 后台拒；
  · 硬拉伸到 9:16：纵向压 20%，天地盘圆盘会变椭圆 ⇒ 不可用；
  · 裁剪成 9:16：会丢 469px 纵向内容 ⇒ 不可用。
所以：**按高缩放 + 左右补边**（补边色取自图片四边像素众数，与 App 底色同色 ⇒ 无缝）。
本版新增：**自动裁掉系统 UI** —— 判据是"按行统计非底色像素（ink）密度"：
  顶部图标簇 = 从第 0 行起第一段有 ink 的行；此后必须出现一段足够长的空白间隔，
  才认定它确实是"系统状态栏"（而不是 App 自己的内容），裁到该簇末行 + 余量。
  找不到干净间隔时**不裁**（宁可留系统栏，也不切掉 App 内容），并提示改用手工 --top/--bottom。

用法：
  python _tools/fit_store_shots.py                 # 自动裁系统 UI + 转 1080x1920
  python _tools/fit_store_shots.py --top 128       # 手工指定裁掉的高度（px，原图坐标）
  python _tools/fit_store_shots.py --no-crop       # 不裁，只做尺寸转换
"""
import argparse
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, 'APP', 'screenshots_out', '1.05')
OUT_DIR = os.path.join(SRC_DIR, 'store_1080x1920')
STRIP_DIR = os.path.join(SRC_DIR, 'cropped_off')
TARGET_W, TARGET_H = 1080, 1920
MAX_BYTES = 5 * 1024 * 1024
INK_THRESH = 40          # 与底色的欧氏距离超过它才算"墨"
INK_ROW_RATIO = 0.004    # 一行里 ink 占比超过它才算"有内容"
GAP_ROWS = 8             # 认定"系统栏与 App 内容之间的空白"至少要有这么多行（本 App 顶栏间距小，取 8）
SCAN_TOP = 0.16          # 只看顶部 16% 找状态栏
SCAN_BOTTOM = 0.90       # 只看底部 10% 找手势条
TOP_LIMIT = 0.06         # 首个墨迹必须落在顶部 6% 内，才认定它是系统状态栏
BOTTOM_LIMIT = 0.03      # 末段墨迹必须落在最底部 3% 内，才认定它是手势条/导航条


def bg_color(im):
    """四边像素众数色：既做补边底色，也是"何为墨"的基准。"""
    w, h = im.size
    px = im.load()
    counts = {}
    for x in range(0, w, 5):
        for y in (1, h - 2):
            counts[px[x, y][:3]] = counts.get(px[x, y][:3], 0) + 1
    for y in range(0, h, 5):
        for x in (1, w - 2):
            counts[px[x, y][:3]] = counts.get(px[x, y][:3], 0) + 1
    return max(counts.items(), key=lambda kv: kv[1])[0]


def ink_rows(im, bg, y0, y1):
    """返回 [(行号, ink 占比), ...]，只统计 [y0, y1) 区间。"""
    w = im.size[0]
    px = im.load()
    out = []
    for y in range(max(0, y0), min(im.size[1], y1)):
        n = 0
        for x in range(0, w, 3):
            c = px[x, y]
            d = abs(c[0] - bg[0]) + abs(c[1] - bg[1]) + abs(c[2] - bg[2])
            if d > INK_THRESH:
                n += 1
        out.append((y, n / float(max(1, len(range(0, w, 3))))))
    return out


def detect_top(im, bg):
    """返回 (裁掉的高度, 说明)。找不到干净间隔则返回 (0, 原因)。"""
    h = im.size[1]
    rows = ink_rows(im, bg, 0, int(h * SCAN_TOP))
    start = next((y for y, r in rows if r > INK_ROW_RATIO), None)
    if start is None:
        return 0, '顶部 %d%% 内没有检测到内容（未裁）' % (SCAN_TOP * 100)
    if start > h * TOP_LIMIT:
        return 0, '顶部首个墨迹在第 %d 行（>%.0f%%）⇒ 不像系统状态栏，未裁' % (start, TOP_LIMIT * 100)
    end = start
    for y, r in rows:
        if y < start:
            continue
        if r > INK_ROW_RATIO:
            end = y
        elif y - end >= GAP_ROWS:
            return end + 6, '顶部：图标簇 第%d–%d 行，其后空白 ≥%d 行 ⇒ 判定为系统状态栏' % (start, end, GAP_ROWS)
    return 0, '顶部：第%d行起的内容与 App 内容连成一片（无干净间隔）⇒ 未裁，需手工 --top' % start


def detect_bottom(im, bg):
    h = im.size[1]
    rows = ink_rows(im, bg, int(h * SCAN_BOTTOM), h)
    ink = [(y, r) for y, r in rows if r > INK_ROW_RATIO]
    if not ink:
        return 0, '底部 10%% 内没有检测到内容（未裁）'
    last = ink[-1][0]
    if last < h * (1 - BOTTOM_LIMIT):
        return 0, '底部末段墨迹在第 %d 行（不在最底 3%% 内）⇒ 不像手势条，未裁' % last
    first = last
    for y, r in reversed(ink):
        if last - y <= GAP_ROWS * 2:
            first = y
        else:
            break
    return (h - first) + 6, '底部：末段内容 第%d–%d 行 ⇒ 判定为系统手势条/导航条' % (first, last)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--top', type=int, default=None, help='手工指定顶部裁掉像素（原图坐标）')
    ap.add_argument('--bottom', type=int, default=None, help='手工指定底部裁掉像素')
    ap.add_argument('--no-crop', action='store_true', help='不裁系统 UI')
    args = ap.parse_args()

    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(STRIP_DIR, exist_ok=True)
    files = sorted(f for f in os.listdir(SRC_DIR)
                   if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')))
    for name in files:
        src = os.path.join(SRC_DIR, name)
        im = Image.open(src).convert('RGB')
        w, h = im.size
        bg = bg_color(im)
        tone = 'dark' if sum(bg) < 384 else 'light'

        if args.no_crop:
            top, bot = 0, 0
            why_top = why_bot = '按 --no-crop 不裁'
        else:
            top = args.top if args.top is not None else None
            bot = args.bottom if args.bottom is not None else None
            if top is None:
                top, why_top = detect_top(im, bg)
            else:
                why_top = '顶部：手工指定裁 %d px' % top
            if bot is None:
                bot, why_bot = detect_bottom(im, bg)
            else:
                why_bot = '底部：手工指定裁 %d px' % bot

        if top or bot:
            if top:
                im.crop((0, 0, w, top)).save(os.path.join(STRIP_DIR, 'cropped_top_%s.png' % tone))
            if bot:
                im.crop((0, h - bot, w, h)).save(os.path.join(STRIP_DIR, 'cropped_bottom_%s.png' % tone))
            im = im.crop((0, top, w, h - bot))
        cw, ch = im.size
        scale = TARGET_H / float(ch)
        new_w = int(round(cw * scale))
        if new_w > TARGET_W:
            print('  !! %s 裁后按高缩放宽 %d > %d，需人工定夺' % (name, new_w, TARGET_W))
            continue
        rs = im.resize((new_w, TARGET_H), Image.LANCZOS)
        canvas = Image.new('RGB', (TARGET_W, TARGET_H), bg)
        canvas.paste(rs, ((TARGET_W - new_w) // 2, 0))
        out = os.path.join(OUT_DIR, 'store_1080x1920_%s.png' % tone)
        canvas.save(out, 'PNG', optimize=True)
        size = os.path.getsize(out)
        if size > MAX_BYTES:
            out = out[:-4] + '.jpg'
            canvas.save(out, 'JPEG', quality=95, optimize=True, subsampling=0)
            size = os.path.getsize(out)
        print('  %s' % name)
        print('    ' + why_top)
        print('    ' + why_bot)
        print('    裁后 %dx%d → 内容 %dx%d 居中 + 左右各 %d px 补边（底色 #%02X%02X%02X）'
              % (cw, ch, new_w, TARGET_H, (TARGET_W - new_w) // 2, bg[0], bg[1], bg[2]))
        print('    输出 %s  (%.2f MB, 比例 %.4f)'
              % (os.path.basename(out), size / 1048576.0, TARGET_W / float(TARGET_H)))
    print('输出目录: %s' % OUT_DIR)
    print('裁掉的条带存于: %s（请眼看确认：删掉的是系统栏、没切到 App 内容）' % STRIP_DIR)


if __name__ == '__main__':
    main()

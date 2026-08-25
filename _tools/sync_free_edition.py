# -*- coding: utf-8 -*-
"""双版本同步脚本：主项目（全功能开发版）→ 免费上架版
 - 复制源码（entry/src、AppScope、配置文件），排除构建产物（build/.hvigor/.preview/.idea/oh_modules 缓存）
 - 复制后把免费版 PayConfig.PREVIEW_FREE 写为 false（当前策略：过审版全功能开放、无锁无付费痕迹，
   与申报「无收费项」一致；收费版上架后如需锁定导流，把此处改回 true 并同步更新申报信息）
 - 复制后自动移除免费版 module.json5 的 INTERNET 权限（保持零权限申报）
 - 用法：python _tools/sync_free_edition.py
"""
import io
import os
import shutil

BASE = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP'
SRC = os.path.join(BASE, 'LiurenFocusDiviner')
DST = os.path.join(BASE, 'LiurenFocusDivinerFree')

# 排除项（构建产物 / IDE 状态）
SKIP_DIRS = {'.hvigor', '.idea', '.preview', 'build', 'oh_modules', '.cxx', '.clangd'}
SKIP_EXT = {'.iml'}

def copy_tree(src, dst):
    os.makedirs(dst, exist_ok=True)
    for root, dirs, files in os.walk(src):
        # 原地剪枝：跳过构建产物目录
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.endswith('.build')]
        rel = os.path.relpath(root, src)
        target = dst if rel == '.' else os.path.join(dst, rel)
        os.makedirs(target, exist_ok=True)
        for f in files:
            if os.path.splitext(f)[1] in SKIP_EXT:
                continue
            sf = os.path.join(root, f)
            df = os.path.join(target, f)
            # 跳过大体积缓存类
            if f in ('oh-package-lock.json5',):
                continue
            shutil.copy2(sf, df)
    print('copied:', src, '->', dst)

def flip_switch():
    p = os.path.join(DST, 'entry', 'src', 'main', 'ets', 'pay', 'PayConfig.ets')
    s = io.open(p, 'r', encoding='utf-8').read()
    old_true = "static readonly PREVIEW_FREE: boolean = true;"
    old_false = "static readonly PREVIEW_FREE: boolean = false;"
    new = "static readonly PREVIEW_FREE: boolean = false;"
    if old_false in s:
        print('PREVIEW_FREE already false (all features open)')
        return
    assert old_true in s, 'PREVIEW_FREE marker not found!'
    s = s.replace(old_true, new)
    io.open(p, 'w', encoding='utf-8', newline='').write(s)
    print('PREVIEW_FREE -> false (all features open, no locks)')

def remove_internet():
    """免费版无 IAP：移除 module.json5 的 INTERNET 权限（保持零权限申报）"""
    p = os.path.join(DST, 'entry', 'src', 'main', 'module.json5')
    import remove_request_permissions as rrp
    rrp.remove_request_permissions(p)

def main():
    if os.path.exists(DST):
        print('cleaning old free edition:', DST)
        shutil.rmtree(DST, ignore_errors=True)
    copy_tree(SRC, DST)
    flip_switch()
    remove_internet()
    print('SYNC OK')

if __name__ == '__main__':
    main()

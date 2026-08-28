# -*- coding: utf-8 -*-
"""免费上架版不变量校验：同步后运行，防止“无收费项/零权限”口径回退。"""
import io
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FREE = os.path.join(ROOT, 'APP', 'LiurenFocusDivinerFree')

fail = 0


def bad(msg):
    global fail
    fail += 1
    print('FAIL:', msg)


def ok(msg):
    print('OK  :', msg)


def read(rel):
    p = os.path.join(FREE, rel)
    if not os.path.exists(p):
        bad('缺文件: ' + rel)
        return ''
    return io.open(p, 'r', encoding='utf-8').read()


if not os.path.isdir(FREE):
    bad('免费版目录不存在: ' + FREE)
    raise SystemExit(1)

pay = read(os.path.join('entry', 'src', 'main', 'ets', 'pay', 'PayConfig.ets'))
if "MODE: string = 'free'" in pay:
    ok('MODE=free')
else:
    bad('MODE 必须为 free')

feat = read(os.path.join('entry', 'src', 'main', 'ets', 'FeatureFlags.ets'))
if 'SHOW_ANCIENT_CASE_GALLERY: boolean = false' in feat:
    ok('案例鉴赏入口隐藏')
else:
    bad('SHOW_ANCIENT_CASE_GALLERY 必须为 false')

module = read(os.path.join('entry', 'src', 'main', 'module.json5'))
if 'requestPermissions' in module or 'ohos.permission.INTERNET' in module:
    bad('免费版仍含 requestPermissions/INTERNET')
else:
    ok('零权限')

strings = read(os.path.join('entry', 'src', 'main', 'resources', 'base', 'element', 'string.json'))
if 'permission_internet_reason' in strings or '应用内购买' in strings or '恢复购买' in strings:
    bad('string.json 残留 IAP/权限文案')
else:
    ok('无 IAP/权限残留文案')

print('PASS' if fail == 0 else 'FAILED: %d' % fail)
raise SystemExit(0 if fail == 0 else 1)

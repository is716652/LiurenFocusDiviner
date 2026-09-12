# -*- coding: utf-8 -*-
"""上传包（.app）级校验：把「免费包该有的样子」做成可重跑的硬断言。

为什么需要：`verify_free_edition.py` 查的是**免费版源码树**，查不到真正上传的那个 .app ——
打包参数（product=release / assembleApp）、sync 漏跑、rawfile 误剔、权限被写回，
都只有在**包内**才看得见。本脚本读 `.app`(zip) → `entry-default.hap`(zip) → `module.json` /
`pack.info` / `resources/rawfile/**`，逐条断言，任何一条不符即 FAIL（exit 1）。

用法：python _tools/verify_app_pkg.py [包路径]
      默认 APP/release_pkg/LiurenFocusDiviner-free-release-signed.app
      python _tools/verify_app_pkg.py --selftest   # 负向自检：篡改包必须被判 FAIL
"""
import hashlib
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile

try:                       # Windows 控制台默认 cp936，会把中文输出显示成乱码
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT = os.path.join(ROOT, 'APP', 'release_pkg', 'LiurenFocusDiviner-free-release-signed.app')
SRC_APP_JSON = os.path.join(ROOT, 'APP', 'LiurenFocusDiviner', 'AppScope', 'app.json5')
SRC_RAW = os.path.join(ROOT, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'resources', 'rawfile')

PAID_RAWFILE = ['ancient/case_gallery.json', 'ancient/case_story.json']   # 收费块：免费包不得携带
MUST_HAVE = ['ancient/zhonghuang_jing.json', 'cal/yj_all.json']

FAILED = []
OKS = 0


def ck(cond, label, detail=''):
    global OKS
    if cond:
        OKS += 1
        print('  OK  : ' + label + (('  ' + detail) if detail else ''))
    else:
        FAILED.append(label)
        print('  FAIL: ' + label + (('  ' + detail) if detail else ''))


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT
    print('=== 上传包校验 ===')
    if not os.path.exists(path):
        raise SystemExit('包不存在: ' + path)
    is_free = 'free' in os.path.basename(path).lower()
    size = os.path.getsize(path)
    h = hashlib.sha256()
    with io.open(path, 'rb') as f:
        for blk in iter(lambda: f.read(1 << 20), b''):
            h.update(blk)
    print('包      : ' + path)
    print('类型    : ' + ('免费上架版' if is_free else '主版（含收费块）'))
    print('大小    : %d bytes' % size)
    print('SHA256  : ' + h.hexdigest().upper())
    print('')

    za = zipfile.ZipFile(path)
    names = za.namelist()
    ck(any(n.endswith('.hap') for n in names), '.app 内含 hap')
    ck('pack.info' in names, '.app 内含 pack.info')
    hap_name = [n for n in names if n.endswith('.hap')][0]
    hap_bytes = za.read(hap_name)
    zh = zipfile.ZipFile(io.BytesIO(hap_bytes))
    znames = zh.namelist()
    print('  · %s = %d bytes（压缩 %d）' % (hap_name, len(hap_bytes), za.getinfo(hap_name).compress_size))

    ck('module.json' in znames, 'hap 内含 module.json')
    ck('ets/modules.abc' in znames, 'hap 内含编译产物 ets/modules.abc')
    ck('resources.index' in znames, 'hap 内含 resources.index')

    # ---- 版本：以主版 app.json5 为真源，包内必须一致（免费版漏跑 sync 会在这里露出来）----
    src = io.open(SRC_APP_JSON, encoding='utf-8').read()
    want_name = re.search(r'versionName["\s:]+"([^"]+)"', src).group(1)
    want_code = re.search(r'versionCode["\s:]+(\d+)', src).group(1)
    bundle = re.search(r'bundleName["\s:]+"([^"]+)"', src).group(1)
    mod = json.loads(zh.read('module.json').decode('utf-8'))
    app = mod.get('app', {})
    ck(app.get('versionName') == want_name, '包内 versionName = %s（真源 app.json5）' % want_name,
       '实际 %s' % app.get('versionName'))
    ck(str(app.get('versionCode')) == want_code, '包内 versionCode = %s' % want_code,
       '实际 %s' % app.get('versionCode'))
    ck(app.get('bundleName') == bundle, '包内 bundleName = %s' % bundle, '实际 %s' % app.get('bundleName'))
    ck(app.get('buildMode') == 'release', 'buildMode = release（上架要求）', '实际 %s' % app.get('buildMode'))
    print('  · compileSdkVersion=%s targetAPIVersion=%s apiReleaseType=%s'
          % (app.get('compileSdkVersion'), app.get('targetAPIVersion'), app.get('apiReleaseType')))

    # ---- 权限：免费版必须零权限申报 ----
    perms = mod.get('module', {}).get('requestPermissions')
    ck(perms is None or len(perms) == 0, '包内 requestPermissions 为空/不存在（零权限申报）',
       '实际 %s' % (perms if perms else '0 项'))

    # ---- rawfile：收费块数据不得在包内；关键数据必须在包内；与主版源码树逐文件对齐 ----
    raw = [n for n in znames if n.startswith('resources/rawfile/')]
    rels = sorted(n[len('resources/rawfile/'):] for n in raw)
    print('  · rawfile 条目 %d' % len(rels))
    for p in PAID_RAWFILE:
        if is_free:
            ck(p not in rels, '免费包不含收费块数据: ' + p)
        else:
            ck(p in rels, '主版包含收费块数据: ' + p)
    for p in MUST_HAVE:
        ck(p in rels, '关键数据在位: ' + p,
           '%d bytes' % zh.getinfo('resources/rawfile/' + p).file_size)

    src_files = []
    for root, _dirs, files in os.walk(SRC_RAW):
        for f in files:
            src_files.append(os.path.relpath(os.path.join(root, f), SRC_RAW).replace('\\', '/'))
    src_files = sorted(src_files)
    expect = sorted(f for f in src_files if not (is_free and f in PAID_RAWFILE))
    ck(rels == expect, 'rawfile 与主版源码树逐文件对齐（免费版仅少收费块 %d 个）' % len(PAID_RAWFILE),
       '包内 %d / 期望 %d' % (len(rels), len(expect)))
    if rels != expect:
        only_pkg = [x for x in rels if x not in expect][:8]
        only_src = [x for x in expect if x not in rels][:8]
        if only_pkg:
            print('      · 仅包内有: %s' % only_pkg)
        if only_src:
            print('      · 仅源码有: %s' % only_src)

    rule = [x for x in rels if x.startswith('rule/') and x.endswith('.json')]
    cal = [x for x in rels if x.startswith('cal/') and x.endswith('.json')]
    print('  · rule/ %d 个 JSON，cal/ %d 个 JSON' % (len(rule), len(cal)))

    # ---- 案例鉴赏入口开关：免费版必须隐藏（源码级断言，包内 abc 不可读，故查源码）----
    if is_free:
        ff = os.path.join(ROOT, 'APP', 'LiurenFocusDivinerFree', 'entry', 'src', 'main', 'ets',
                          'FeatureFlags.ets')
        if os.path.exists(ff):
            body = io.open(ff, encoding='utf-8').read()
            ck(re.search(r'SHOW_ANCIENT_CASE_GALLERY[^=\n]*=\s*false', body) is not None,
               '免费版案例鉴赏入口隐藏（FeatureFlags.ets: SHOW_ANCIENT_CASE_GALLERY = false）')
        else:
            ck(False, '免费版 FeatureFlags.ets 可读')

    print('')
    print('签名校验请另跑：python _tools/sign_release.py free（内含 hap-sign-tool verify-app）')
    print('=== 结论：通过 %d 项，失败 %d 项 ===' % (OKS, len(FAILED)))
    if FAILED:
        print('FAIL')
        for f in FAILED:
            print('  - ' + f)
        raise SystemExit(1)
    print('PASS')


def tamper(src, dst, add=None, drop=None):
    """按需增删 hap 内条目后重写成新的 .app（负向自检用）"""
    za = zipfile.ZipFile(src)
    hap_name = [n for n in za.namelist() if n.endswith('.hap')][0]
    zh = zipfile.ZipFile(io.BytesIO(za.read(hap_name)))
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as out:
        for n in zh.namelist():
            if drop and n == drop:
                continue
            out.writestr(n, zh.read(n))
        if add:
            out.writestr(add[0], add[1])
    hap_bytes = buf.getvalue()
    with zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED) as out:
        for n in za.namelist():
            out.writestr(n, hap_bytes if n == hap_name else za.read(n))


def selftest():
    """负向自检：把包改坏，校验器必须判 FAIL（否则校验本身是纸糊的）"""
    src = DEFAULT
    print('=== 校验器负向自检（源包：%s）===' % os.path.basename(src))
    if not os.path.exists(src):
        raise SystemExit('源包不存在: ' + src)
    paid = None
    for cand in (os.path.join(ROOT, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main',
                              'resources', 'rawfile', 'ancient', 'case_gallery.json'),):
        if os.path.exists(cand):
            paid = io.open(cand, 'rb').read()
    cases = [('放回收费块数据 case_gallery.json', dict(add=('resources/rawfile/ancient/case_gallery.json', paid or b'{}'))),
             ('剔除关键数据 cal/cal_2000.json', dict(drop='resources/rawfile/cal/cal_2000.json'))]
    tmp = tempfile.mkdtemp(prefix='pkgselftest_')
    bad = 0
    try:
        for label, kw in cases:
            # 文件名必须保留 free 字样：校验器按名判版本（免费/主版），否则会按主版口径误判，
            # 负向自检就会「因为错的原因」通过（实测踩过）。
            dst = os.path.join(tmp, 'tampered-free-release-signed.app')
            tamper(src, dst, **kw)
            r = subprocess.run([sys.executable, os.path.abspath(__file__), dst],
                               capture_output=True, text=True, encoding='utf-8', errors='replace')
            caught = r.returncode != 0
            if not caught:
                bad += 1
            print('  %s %s（校验器 exit=%d）' % ('✓ 拦下' if caught else '✗ 漏过', label, r.returncode))
            if caught:
                line = [x for x in (r.stdout or '').splitlines() if x.strip().startswith('FAIL:')]
                if line:
                    print('        ' + line[0].strip())
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    print('负向自检：%s' % ('全部拦下 ✓' if bad == 0 else '有 %d 项漏过 ✗' % bad))
    raise SystemExit(0 if bad == 0 else 1)


if __name__ == '__main__':
    if '--selftest' in sys.argv:
        selftest()
    main()

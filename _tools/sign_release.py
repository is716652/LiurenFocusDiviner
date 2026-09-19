# -*- coding: utf-8 -*-
"""发布打包脚本：hvigor (6.1.1-release) assembleApp 构建 signed .app → 复制到 release_pkg

说明：
  - 必须用 command-line-tools-6.1.1-release（beta 工具会因 modelVersion 报错）
  - 签名由 build-profile.json5 的 release signingConfig 完成（DevEco 配置的密文密码）
  - SDK API 24 (6.1.1) Release，满足华为上架要求（非 beta）

松耦合（2026-09-13 起）：
  本脚本**不承载任何「免费版与主版差异」的知识**，也**不做同步** —— 出包前只调用既有门禁
  （验证免费版不变量与树一致性），不过门禁即中止；出包后再跑一次上传包级校验。
  为什么不在打包里同步：sync 是「先清空再重建」，若打包顺带同步，则「真机装的树 / 出包的树」
  不再可追溯，且失败会留半同步态；更糟的是会把「树没同步」这种问题掩盖成一次成功出包。

路径不写死：
  仓库根由 __file__ 推导（可用环境变量 LIUREN_ROOT 覆盖）；
  工具链可用 LIUREN_TOOLCHAIN 整体覆盖，或分别用 LIUREN_HVIGOR / LIUREN_JAVA / LIUREN_SIGN_TOOL。

用法：python _tools/sign_release.py [free|main]
     free（默认）= 免费版（LiurenFocusDivinerFree，上架用）
     main          = 开发/收费版（LiurenFocusDiviner）
产物：APP/release_pkg/LiurenFocusDiviner-<tag>-release-signed.app
"""
import datetime
import hashlib
import os
import re
import shutil
import subprocess
import sys

ROOT = os.environ.get('LIUREN_ROOT') or os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
TOOLS = os.path.join(ROOT, '_tools')
TOOLCHAIN = os.environ.get('LIUREN_TOOLCHAIN', r'D:\HarmonyOS\command-line-tools-6.1.1-release')
HVIGOR = os.environ.get('LIUREN_HVIGOR', os.path.join(TOOLCHAIN, 'bin', 'hvigorw.bat'))
SIGN_TOOL = os.environ.get('LIUREN_SIGN_TOOL',
                           os.path.join(TOOLCHAIN, 'sdk', 'default', 'openharmony', 'toolchains', 'lib',
                                        'hap-sign-tool.jar'))
JAVA = os.environ.get('LIUREN_JAVA', r'C:\Program Files\Java\jdk-21.0.11+10\bin\java.exe')
PY = sys.executable or 'python'


def child_env():
    e = dict(os.environ)
    e['PYTHONIOENCODING'] = 'utf-8'      # 子脚本输出走管道时避免 cp936 乱码
    return e


def run_script(script, label, tail=6, must_pass=True):
    """调用既有校验脚本（门禁）。本脚本只消费判定结果，不复制任何规则。"""
    path = os.path.join(TOOLS, script)
    if not os.path.exists(path):
        raise SystemExit('门禁脚本不存在: ' + path)
    print('=== %s: %s ===' % (label, script))
    r = subprocess.run([PY, path], cwd=ROOT, capture_output=True, text=True,
                       encoding='utf-8', errors='replace', env=child_env())
    out = (r.stdout or '') + (r.stderr or '')
    for line in out.strip().splitlines()[-tail:]:
        print('  ' + line)
    if must_pass and r.returncode != 0:
        raise SystemExit('%s 未通过（%s）—— 已中止，未出包。'
                         '修法见上面提示；树没同步时先跑：node _tools/_ets_pipeline.js' % (label, script))
    return r.returncode == 0


def require_toolchain():
    """工具链缺失时给清晰提示，而不是让 hvigor 抛看不懂的错。"""
    missing = []
    if not os.path.exists(HVIGOR):
        missing.append(('HVIGOR', HVIGOR, 'LIUREN_HVIGOR / LIUREN_TOOLCHAIN'))
    if not os.path.exists(SIGN_TOOL):
        missing.append(('SIGN_TOOL', SIGN_TOOL, 'LIUREN_SIGN_TOOL / LIUREN_TOOLCHAIN'))
    if not os.path.exists(JAVA):
        missing.append(('JAVA', JAVA, 'LIUREN_JAVA'))
    if missing:
        msg = ['工具链路径不存在（可用环境变量覆盖）：']
        for name, p, env in missing:
            msg.append('  %s = %s   ← 覆盖：%s' % (name, p, env))
        raise SystemExit('\n'.join(msg))


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 16), b''):
            h.update(chunk)
    return h.hexdigest()


def _version_name(proj):
    """从 AppScope/app.json5 取 versionName（只为一件事：归档文件名里带版本号，便于人工核对）。"""
    p = os.path.join(proj, 'AppScope', 'app.json5')
    try:
        with open(p, 'r', encoding='utf-8') as f:
            m = re.search(r'"versionName"\s*:\s*"([^"]+)"', f.read())
        return m.group(1) if m else 'unknown'
    except OSError:
        return 'unknown'


def _version_of_package(path):
    """读**包内** pack.info 的 version.name —— 归档命名要标"这个包自己是哪一版"。

    2026-09-19 修：原先标的是 `_version_name(proj)`（**当前**版本），于是把上一个包
    （1.0.4）归档成了 `…-1.0.5-20260913-1800.app`，与在架包字节相同却挂着新版本号 ⇒ 误导。
    包内 pack.info 自带版本，故按包自证；读不到时用 `prev` 占位（宁可标不清版本，也不标错）。
    """
    try:
        import zipfile, json
        with zipfile.ZipFile(path) as z:
            info = json.loads(z.read("pack.info").decode("utf-8"))
        return info["summary"]["app"]["version"]["name"]
    except Exception:
        return None


def archive_previous(dst, proj, tag):
    """覆盖前先归档上一刀（2026-09-13 加）。

    为什么必须自动做：手工归档靠人记得 —— 本脚本作者当天就有一次「切了新刀、忘了归档旧包」，
    旧包随即被覆盖、不可恢复，而文档里还写着它的指纹。归档是**覆盖动作的固有前提**，
    交给脚本执行才不会漏。
    命名沿用既有约定：LiurenFocusDiviner-<tag>-release-signed-<版本>-<YYYYMMDD-HHMM>.app
    （时间取旧包的 mtime；同分钟内反复切刀则加序号，绝不覆盖已有归档）。
    """
    if not os.path.exists(dst):
        return None
    arch_dir = os.path.join(ROOT, 'APP', 'release_pkg', 'archive')
    os.makedirs(arch_dir, exist_ok=True)
    ts = datetime.datetime.fromtimestamp(os.path.getmtime(dst)).strftime('%Y%m%d-%H%M')
    ver = _version_of_package(dst) or 'prev'   # 标**包自己的**版本，不是当前版本
    base = 'LiurenFocusDiviner-%s-release-signed-%s-%s' % (tag, ver, ts)
    arch = os.path.join(arch_dir, base + '.app')
    n = 2
    while os.path.exists(arch):
        arch = os.path.join(arch_dir, '%s-%d.app' % (base, n))
        n += 1
    shutil.copy2(dst, arch)
    same = sha256(dst) == sha256(arch)
    print('=== 0. 归档上一刀 ===')
    print('  %s (%d bytes, sha256 %s)' % (arch, os.path.getsize(arch), sha256(arch)[:16] + '…'))
    if not same:
        raise SystemExit('归档副本与源包不一致（未覆盖源包，请检查磁盘）: ' + arch)
    return arch


def main():
    which = sys.argv[1] if len(sys.argv) > 1 else 'free'
    if which == 'free':
        PROJ = os.path.join(ROOT, 'APP', 'LiurenFocusDivinerFree')
        tag = 'free'
    elif which == 'main':
        PROJ = os.path.join(ROOT, 'APP', 'LiurenFocusDiviner')
        tag = 'main'
    else:
        raise SystemExit('arg must be free|main, got: ' + which)
    print('目标项目:', PROJ)

    require_toolchain()

    # 0. 前置门禁（只调用既有校验；免费版是唯一有「树一致性」不变量的目标）
    if which == 'free':
        run_script('verify_free_edition.py', '前置门禁 · 免费版不变量与树一致性')

    # 1. assembleApp 工程级构建（release 产品 + release 签名）
    print('=== 1. hvigor assembleApp (6.1.1-release) ===')
    r = subprocess.run(
        [HVIGOR, 'assembleApp', '--mode', 'project', '-p', 'product=release', '--no-daemon'],
        cwd=PROJ, capture_output=True, text=True, encoding='utf-8', errors='replace')
    out = (r.stdout + r.stderr).strip()
    for line in out.splitlines()[-5:]:
        print(line)
    if r.returncode != 0:
        raise SystemExit('BUILD FAILED（检查 hvigor 输出）')

    # 2. 定位 signed .app
    app = os.path.join(PROJ, 'build', 'outputs', 'release',
                       os.path.basename(PROJ) + '-release-signed.app')
    if not os.path.exists(app):
        # 兜底：扫描
        cands = []
        for root, dirs, files in os.walk(os.path.join(PROJ, 'build')):
            for f in files:
                if f.endswith('-release-signed.app'):
                    cands.append(os.path.join(root, f))
        if not cands:
            raise SystemExit('signed .app not found in ' + PROJ)
        app = cands[0]
    print('signed .app:', app)

    # 3. 覆盖前先归档上一刀，再复制到发布目录
    rel_dir = os.path.join(ROOT, 'APP', 'release_pkg')
    os.makedirs(rel_dir, exist_ok=True)
    dst = os.path.join(rel_dir, 'LiurenFocusDiviner-' + tag + '-release-signed.app')
    archive_previous(dst, PROJ, tag)
    print('=== 3. 复制到发布目录 ===')
    shutil.copy2(app, dst)
    print('发布包:', dst, '%d bytes' % os.path.getsize(dst))

    # 4. 校验签名
    print('=== 4. verify-app 校验 ===')
    v = subprocess.run(
        [JAVA, '-jar', SIGN_TOOL, 'verify-app',
         '-inFile', dst,
         '-outCertChain', os.path.join(rel_dir, '_chain.cer'),
         '-outProfile', os.path.join(rel_dir, '_profile.p7b')],
        cwd=PROJ, capture_output=True, text=True, encoding='utf-8', errors='replace')
    for line in (v.stdout + v.stderr).strip().splitlines()[-4:]:
        print(line)
    for tmp in ('_chain.cer', '_profile.p7b'):
        p = os.path.join(rel_dir, tmp)
        if os.path.exists(p):
            os.remove(p)
    if 'verify-app success' not in (v.stdout + v.stderr):
        raise SystemExit('签名校验未通过（verify-app）—— 包已生成但不可提交: ' + dst)

    # 5. 出包后校验（上传包级）：免费包才有这一套不变量的硬断言
    if which == 'free':
        run_script('verify_app_pkg.py', '出包后校验 · 上传包级（包内容不变量）')

    print('ALL DONE — 提交华为管理台的包:', dst)


if __name__ == '__main__':
    main()

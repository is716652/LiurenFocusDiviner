# -*- coding: utf-8 -*-
"""发布打包脚本：hvigor (6.1.1-release) assembleApp 构建 signed .app → 复制到 release_pkg
说明：
  - 必须用 command-line-tools-6.1.1-release（beta 工具会因 modelVersion 报错）
  - 签名由 build-profile.json5 的 release signingConfig 完成（DevEco 配置的密文密码）
  - SDK API 24 (6.1.1) Release，满足华为上架要求（非 beta）
用法：python _tools/sign_release.py [free|main]
     free（默认）= 免费版（LiurenFocusDivinerFree，上架用）
     main          = 开发/收费版（LiurenFocusDiviner）
产物：APP/release_pkg/LiurenFocusDiviner-<tag>-release-signed.app
"""
import os
import shutil
import subprocess
import sys

ROOT = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design'
HVIGOR = r'D:\HarmonyOS\command-line-tools-6.1.1-release\bin\hvigorw.bat'
JAVA = r'C:\Program Files\Java\jdk-21.0.11+10\bin\java.exe'
SIGN_TOOL = r'D:\HarmonyOS\command-line-tools-6.1.1-release\sdk\default\openharmony\toolchains\lib\hap-sign-tool.jar'

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

    # 3. 复制到发布目录
    print('=== 3. 复制到发布目录 ===')
    rel_dir = os.path.join(ROOT, 'APP', 'release_pkg')
    os.makedirs(rel_dir, exist_ok=True)
    dst = os.path.join(rel_dir, 'LiurenFocusDiviner-' + tag + '-release-signed.app')
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
    print('ALL DONE — 提交华为管理台的包:', dst)

if __name__ == '__main__':
    main()

# -*- coding: utf-8 -*-
"""手动从 PyPI 下载纯 Python 包并解包到本地目录（绕过 pip 的临时目录机制）。

用法: python pyext_install.py <包名> [<包名> ...]
安装目标: 项目根目录/.pyext（与 paths.PYEXT 一致）。
"""
import os, sys, json, zipfile, tarfile, io, re, urllib.request

import paths
LIB = paths.PYEXT
DL = os.path.join(LIB, "dl")
os.makedirs(DL, exist_ok=True)

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()

def files_from_pypi_org(pkg):
    data = json.loads(fetch(f"https://pypi.org/pypi/{pkg}/json"))
    return [(f["filename"], f["url"]) for f in data.get("urls", [])]

def files_from_tuna(pkg):
    html = fetch(f"https://pypi.tuna.tsinghua.edu.cn/simple/{pkg}/").decode("utf-8", "ignore")
    base = "https://pypi.tuna.tsinghua.edu.cn/simple/"
    out = []
    for m in re.finditer(r'href="([^"]+)"', html):
        url = m.group(1)
        if url.startswith("../"):  # skip navigation links
            continue
        if not url.startswith("http"):
            url = base + url
        out.append((url.rsplit("/", 1)[-1], url))
    return out

def pick(files):
    # 平台相关 wheel 优先: py3.14 / win_amd64; 其次 py3-none-any; 再任意 wheel; 最后 sdist
    prefs = [
        lambda f: f.endswith(".whl") and "cp314-cp314-win_amd64" in f,  # 标准(非自由线程)构建
        lambda f: f.endswith(".whl") and "cp314" in f and "win_amd64" in f and "cp314t" not in f,
        lambda f: f.endswith(".whl") and "py3-none-any" in f,
        lambda f: f.endswith(".whl") and "win_amd64" in f,
        lambda f: f.endswith(".whl"),
        lambda f: f.endswith(".tar.gz"),
    ]
    for pref in prefs:
        hit = [x for x in files if pref(x[0])]
        if hit:
            return hit[0]
    return None

def extract_into(archive_path, dest):
    if archive_path.endswith(".whl") or archive_path.endswith(".zip"):
        with zipfile.ZipFile(archive_path) as z:
            z.extractall(dest)
    else:
        with tarfile.open(archive_path, "r:gz") as t:
            t.extractall(dest)

def install(pkg):
    files = files_from_pypi_org(pkg)
    src = "pypi.org"
    if not files:
        files = files_from_tuna(pkg)
        src = "tuna"
    chosen = pick(files)
    if not chosen:
        print(f"[{pkg}] no suitable file from {src}")
        return False
    fn, url = chosen
    target = os.path.join(DL, fn)
    if not os.path.exists(target):
        print(f"[{pkg}] downloading {fn} from {src} ...")
        open(target, "wb").write(fetch(url))
    tmp = os.path.join(DL, "unpack_" + pkg)
    os.makedirs(tmp, exist_ok=True)
    extract_into(target, tmp)
    for name in os.listdir(tmp):
        srcp = os.path.join(tmp, name)
        dstp = os.path.join(LIB, name)
        if name == pkg or name.startswith(pkg.replace("_", "-")):
            # 包目录本身
            if os.path.isdir(srcp) and not os.path.exists(dstp):
                os.rename(srcp, dstp)
        elif os.path.isdir(srcp) and not os.path.exists(dstp):
            os.rename(srcp, dstp)
        elif os.path.isfile(srcp) and not os.path.exists(dstp):
            os.rename(srcp, dstp)
    print(f"[{pkg}] installed from {src}: {fn}")
    return True

if __name__ == "__main__":
    for p in sys.argv[1:]:
        install(p)

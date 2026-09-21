# -*- coding: utf-8 -*-
"""双版本同步脚本：主项目（全功能开发版）→ 免费上架版

差异规则（本文件是**唯一真源**）：
  1) 复制源码（entry/src、AppScope、配置文件），排除构建产物（build/.hvigor/.preview/.idea/oh_modules 等）
  2) 免费版 PayConfig.PREVIEW_FREE 写为 false（过审版全功能开放、无锁无付费痕迹，与申报「无收费项」一致）
  3) 免费版 FeatureFlags.SHOW_ANCIENT_CASE_GALLERY 写为 false（案例鉴赏入口隐藏）
  4) 从免费版 rawfile 删除收费块数据（案例鉴赏/剧情）—— HAP 即 zip、JSON 明文，随包发出等于公开
  5) 移除免费版 module.json5 的 INTERNET 权限 + 对应权限文案（保持零权限申报）

用法：
    python _tools/sync_free_edition.py           # 真同步（清空并重建免费版目录）
    python _tools/sync_free_edition.py --check   # 只判定：把同一套规则跑在**临时目录**，
                                                 # 再与现存免费版逐文件比对；不写工作区；有差异则退出码 1

设计（松耦合 / 不写死）：
    **免费版与主版之间的全部差异规则只住在本文件**。判定方（verify_free_edition.py、打包脚本）
    一律复用本文件的 diff_against()，**不得另写一份「允许差异清单/白名单」** —— 那会变成第二处
    规则真源，规则一改判定就漂移。差异清单由「按规则拟生成 vs 现存」自动得出，新增收费块或
    新增排除项时只改本文件一处，判定自动跟随。

    仓库根与工具链路径不写死：仓库根由 __file__ 推导（可用 LIUREN_ROOT 覆盖）。
"""
import contextlib
import hashlib
import io
import os
import shutil
import sys
import tempfile

ROOT = os.environ.get('LIUREN_ROOT') or os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BASE = os.path.join(ROOT, 'APP')
SRC = os.path.join(BASE, 'LiurenFocusDiviner')
DST = os.path.join(BASE, 'LiurenFocusDivinerFree')

# ---- 同目录辅助模块的 import 保障（2026-09-20 实测踩到的坑）-----------------------------
# 本机 python 以 safe-path 方式运行（脚本目录不在 sys.path[0]），于是 `python _tools/sync_free_edition.py`
# 直接跑时，`remove_internet()` 里的 `import remove_request_permissions` 会 ModuleNotFoundError；
# 而 `verify_free_edition.py` 自己能过，是因为它先把 _tools 塞进了 sys.path —— 所以这条 latent bug
# 只在"直接跑同步"时暴露，而它偏偏是**先 clean 清空免费版**再执行到那一步的路径。
# 两道保险：① 显式补 sys.path；② 依赖在本模块**加载期**就 import，
# 使缺依赖在"清空免费版"之前就炸，不会留下"已清空、未重建完"的半成品树。
_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)
import remove_request_permissions as _rrp      # noqa: E402  （故意提前，见上）

# 排除项（构建产物 / IDE 状态）—— 同步与判定共用这一份
SKIP_DIRS = {'.hvigor', '.idea', '.preview', 'build', 'oh_modules', '.cxx', '.clangd'}
SKIP_EXT = {'.iml'}
SKIP_FILES = {'oh-package-lock.json5'}

# 收费块数据（不随免费包分发）：案例鉴赏库 + 案例剧情
# 依据：案例鉴赏是收费研习内容，HAP 即 zip，rawfile 内 JSON 为明文，随包发出等于公开收费数据；
#       免费版只保留入口开关隐藏不够，必须在同步阶段物理剔除。
# 白名单外一律不动：中黄经文 ancient/zhonghuang_jing.json（免费古籍功能）、
#       rawfile/rule/*（引擎规则）、rawfile/cal/*（历法 + yj_all.json）均为免费功能数据，必须保留。
PAID_RAWFILE = (
    'ancient/case_gallery.json',
    'ancient/case_story.json',
)


def copy_tree(src, dst):
    os.makedirs(dst, exist_ok=True)
    for root, dirs, files in os.walk(src):
        # 原地剪枝：跳过构建产物目录
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.endswith('.build')]
        rel = os.path.relpath(root, src)
        target = dst if rel == '.' else os.path.join(dst, rel)
        os.makedirs(target, exist_ok=True)
        for f in files:
            if os.path.splitext(f)[1] in SKIP_EXT or f in SKIP_FILES:
                continue
            shutil.copy2(os.path.join(root, f), os.path.join(target, f))
    print('copied:', src, '->', dst)


def flip_switch(dst):
    p = os.path.join(dst, 'entry', 'src', 'main', 'ets', 'pay', 'PayConfig.ets')
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


def hide_ancient_case_gallery(dst):
    """免费上架版：古籍案例鉴赏代码随包但入口隐藏（不出现新增收费研习内容入口）"""
    p = os.path.join(dst, 'entry', 'src', 'main', 'ets', 'FeatureFlags.ets')
    s = io.open(p, 'r', encoding='utf-8').read()
    old = 'static readonly SHOW_ANCIENT_CASE_GALLERY: boolean = true;'
    new = 'static readonly SHOW_ANCIENT_CASE_GALLERY: boolean = false;'
    if new in s:
        print('SHOW_ANCIENT_CASE_GALLERY already false (hidden)')
        return
    assert old in s, 'SHOW_ANCIENT_CASE_GALLERY marker not found!'
    s = s.replace(old, new)
    io.open(p, 'w', encoding='utf-8', newline='').write(s)
    print('SHOW_ANCIENT_CASE_GALLERY -> false (hidden in free edition)')


def drop_paid_rawfile(dst):
    """免费版剔除收费块数据：案例鉴赏库 + 案例剧情（入口隐藏之外，数据本身也不随免费包分发）"""
    rawfile = os.path.join(dst, 'entry', 'src', 'main', 'resources', 'rawfile')
    for rel in PAID_RAWFILE:
        p = os.path.join(rawfile, *rel.split('/'))
        if not os.path.exists(p):
            print('已剔除（源即无此文件）:', rel)
            continue
        size = os.path.getsize(p)
        os.remove(p)
        print('已剔除:', rel, '(%d bytes)' % size)


def remove_internet(dst):
    """免费版无 IAP：移除 module.json5 的 INTERNET 权限（保持零权限申报）"""
    p = os.path.join(dst, 'entry', 'src', 'main', 'module.json5')
    _rrp.remove_request_permissions(p)      # 模块已在本文件顶部 import（缺依赖时提前失败，见那里注释）


def remove_permission_reason_string(dst):
    """免费版零权限：同步删除未使用的 permission_internet_reason 文案，避免审核残留 IAP 痕迹。"""
    p = os.path.join(dst, 'entry', 'src', 'main', 'resources', 'base', 'element', 'string.json')
    if not os.path.exists(p):
        return
    import json
    data = json.load(io.open(p, 'r', encoding='utf-8'))
    arr = data.get('string', [])
    arr = [x for x in arr if x.get('name') != 'permission_internet_reason']
    data['string'] = arr
    io.open(p, 'w', encoding='utf-8', newline='\n').write(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print('permission_internet_reason 已移除:', p)


def sync(dst, clean=False):
    """按规则生成一份免费版到 dst。clean=True 时先清空（真同步用）。"""
    if clean and os.path.exists(dst):
        print('cleaning old free edition:', dst)
        shutil.rmtree(dst, ignore_errors=True)
    copy_tree(SRC, dst)
    flip_switch(dst)
    hide_ancient_case_gallery(dst)
    drop_paid_rawfile(dst)
    remove_internet(dst)
    remove_permission_reason_string(dst)


# ---------------------------------------------------------------- 判定（只读）

def _sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 16), b''):
            h.update(chunk)
    return h.hexdigest()


def is_ignored(rel):
    """同步本就不会产出的路径（构建产物 / IDE 状态 / 排除扩展名）。
    判定「多出的文件」时按同一套排除规则过滤 —— 仍是本文件这一份规则，不另写清单。"""
    parts = rel.replace('\\', '/').split('/')
    for d in parts[:-1]:
        if d in SKIP_DIRS or d.endswith('.build'):
            return True
    name = parts[-1]
    if name in SKIP_FILES:
        return True
    if os.path.splitext(name)[1] in SKIP_EXT:
        return True
    return False


def _temp_root():
    """干跑用的临时根目录：**优先仓库内**（受限沙箱常禁止写系统临时目录，会假报「不同步」），
    仓库内不可写时再回退系统临时目录。返回值只影响临时目录位置，不影响判定规则。"""
    cand = os.path.join(ROOT, '.tmp')
    try:
        os.makedirs(cand, exist_ok=True)
        return cand
    except OSError:
        return tempfile.gettempdir()


def _scan(base):
    """扫描「同步面」：按同步自己的排除规则剪枝（构建产物/IDE 状态不参与比对），
    并容忍扫描期间被并发删除的文件（hvigor/Nutstore 会动 build 下的东西）。
    注意：现存免费版目录里带着 entry/build/** 编译缓存，若不剪枝会扫出海量无关文件甚至中途消失。"""
    found = {}
    for root, dirs, files in os.walk(base):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.endswith('.build')]
        for f in files:
            p = os.path.join(root, f)
            rel = os.path.relpath(p, base).replace(os.sep, '/')
            if is_ignored(rel):
                continue
            try:
                found[rel] = _sha256(p)
            except FileNotFoundError:
                continue
    return found


def diff_against(dst=None):
    """把「按规则拟生成的免费版」与现存免费版逐文件比对，返回差异说明（空列表 = 一致）。
    不写工作区：拟生成落在临时目录，结束时删除。"""
    dst = dst or DST
    if not os.path.isdir(dst):
        return ['免费版目录不存在: ' + dst]
    tmp = tempfile.mkdtemp(prefix='free_check_', dir=_temp_root())
    try:
        # 干跑只用于判定：抑制同步过程自身的日志，避免污染判定方的输出
        with contextlib.redirect_stdout(io.StringIO()):
            sync(tmp)
        want = _scan(tmp)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    have = _scan(dst)
    diffs = []
    for rel in sorted(set(want) - set(have)):
        diffs.append('缺失: %s（主版有、免费版没有）' % rel)
    for rel in sorted(set(have) - set(want)):
        if not is_ignored(rel):
            diffs.append('多余: %s（免费版有、按规则不该有 —— 主版删除后未同步？）' % rel)
    for rel in sorted(set(have) & set(want)):
        if have[rel] != want[rel]:
            diffs.append('内容不同: %s（免费版与「主版 + 差异规则」的结果不一致）' % rel)
    return diffs


def main():
    if '--check' in sys.argv[1:]:
        try:
            diffs = diff_against()
        except Exception as e:                                  # 规则本身跑不通也要给清晰退出码
            print('CHECK FAILED：无法按差异规则干跑比对：%s: %s' % (type(e).__name__, e))
            raise SystemExit(1)
        if diffs:
            print('CHECK FAILED：免费版与主版不同步（%d 处）' % len(diffs))
            for d in diffs[:30]:
                print('  ✗', d)
            if len(diffs) > 30:
                print('  … 共 %d 处' % len(diffs))
            print('修法：node _tools/_ets_pipeline.js（内部会跑本脚本的同步）')
            raise SystemExit(1)
        print('CHECK OK：免费版 = 主版 + 本文件的差异规则（逐文件一致）')
        raise SystemExit(0)
    sync(DST, clean=True)
    print('SYNC OK')


if __name__ == '__main__':
    main()

# -*- coding: utf-8 -*-
"""免费上架版不变量校验：同步后运行，防止“无收费项/零权限/不带收费数据”口径回退。

硬断言分两组：
  1) 收费块数据不得随免费包分发（rawfile/ancient/case_gallery.json、case_story.json 必须不存在）
     依据：HAP 即 zip，rawfile 内 JSON 为明文，随包发出等于公开收费块数据。
  2) 免费功能数据必须完整（中黄经文 + rawfile/rule/* + rawfile/cal/*，含 yj_all.json），
     并与主版逐文件比对（文件名 + 字节数一致），防止剔除操作误伤免费版应有的免费功能数据。
任一条不满足即 FAIL 并返回非 0 退出码。
"""
import io
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MAIN = os.path.join(ROOT, 'APP', 'LiurenFocusDiviner')
FREE = os.path.join(ROOT, 'APP', 'LiurenFocusDivinerFree')
RAWFILE = os.path.join(FREE, 'entry', 'src', 'main', 'resources', 'rawfile')
MAIN_RAWFILE = os.path.join(MAIN, 'entry', 'src', 'main', 'resources', 'rawfile')

# 收费块数据（案例鉴赏/剧情）：免费包不得携带
PAID_RAWFILE = (
    'ancient/case_gallery.json',
    'ancient/case_story.json',
)

# 免费版必须存在的免费功能数据（显式探针；目录另做逐文件比对）
FREE_RAWFILE_FILES = (
    'ancient/zhonghuang_jing.json',  # 中黄五变经全文（古籍页）
    'cal/yj_all.json',               # 月将/宜忌数据台
)
FREE_RAWFILE_DIRS = (
    'rule',  # 引擎规则 JSON（loadCoreRules / 类象库 / 毕法教练 …）
    'cal',   # 历法 JSON cal_19x0..cal_2060
)

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


def raw_path(rel):
    return os.path.join(RAWFILE, *rel.split('/'))


def check_paid_data_absent():
    """收费块数据不得随免费包分发"""
    for rel in PAID_RAWFILE:
        p = raw_path(rel)
        if os.path.exists(p):
            bad('收费块数据仍在免费包: rawfile/' + rel)
        else:
            ok('已剔除收费块数据: rawfile/' + rel)


def check_free_data_present():
    """免费功能数据必须完整（剔除操作不得误伤）"""
    for rel in FREE_RAWFILE_FILES:
        p = raw_path(rel)
        if os.path.exists(p) and os.path.getsize(p) > 0:
            ok('免费功能数据在位: rawfile/%s (%d bytes)' % (rel, os.path.getsize(p)))
        else:
            bad('免费功能数据缺失: rawfile/' + rel)

    for d in FREE_RAWFILE_DIRS:
        p = os.path.join(RAWFILE, d)
        if not os.path.isdir(p):
            bad('免费功能数据目录缺失: rawfile/' + d)
            continue
        files = sorted(f for f in os.listdir(p) if f.lower().endswith('.json'))
        if not files:
            bad('免费功能数据目录为空: rawfile/' + d)
            continue
        ok('免费功能数据目录完整: rawfile/%s（%d 个 JSON）' % (d, len(files)))


def check_free_data_matches_main():
    """免费功能数据与主版逐文件比对：免费版 rawfile 必须与主版完全相同，仅少了两个收费块数据文件。
    这是“不误伤”的强断言：任何多剔/少剔/内容变动都会 FAIL。"""
    if not os.path.isdir(MAIN_RAWFILE):
        bad('主版 rawfile 不存在，无法比对: ' + MAIN_RAWFILE)
        return

    def scan(base):
        found = {}
        for root, dirs, files in os.walk(base):
            for f in files:
                p = os.path.join(root, f)
                rel = os.path.relpath(p, base).replace(os.sep, '/')
                found[rel] = os.path.getsize(p)
        return found

    main_files = scan(MAIN_RAWFILE)
    free_files = scan(RAWFILE)
    expect_removed = set(PAID_RAWFILE)

    extra = sorted(set(free_files) - set(main_files))
    missing = sorted(set(main_files) - set(free_files))
    if extra:
        bad('免费版 rawfile 出现主版没有的文件（多带）: ' + ', '.join(extra))
    if sorted(missing) != sorted(expect_removed):
        bad('免费版 rawfile 缺失集合与「仅两个收费块数据」不符: ' + ', '.join(missing))

    size_diff = [(rel, main_files[rel], free_files[rel]) for rel in sorted(set(free_files) & set(main_files))
                 if main_files[rel] != free_files[rel]]
    if size_diff:
        for rel, a, b in size_diff:
            bad('免费版数据与主版不一致（字节数）: %s 主版=%d 免费版=%d' % (rel, a, b))

    removed_bytes = sum(main_files.get(r, 0) for r in expect_removed)
    if not (extra or sorted(missing) != sorted(expect_removed) or size_diff):
        ok('rawfile 与主版一致，仅剔除 2 个收费块数据（共 %d bytes）：%d -> %d 个文件'
           % (removed_bytes, len(main_files), len(free_files)))


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

check_paid_data_absent()
check_free_data_present()
check_free_data_matches_main()

print('PASS' if fail == 0 else 'FAILED: %d' % fail)
raise SystemExit(0 if fail == 0 else 1)

# -*- coding: utf-8 -*-
"""整理根目录：测试收拢到 _tests/，删除临时文件"""
import io
import os
import shutil

ROOT = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design"
TESTS = os.path.join(ROOT, "_tests")

os.makedirs(TESTS, exist_ok=True)

# 1. 移动三个测试脚本并修正路径
moves = [
    ("_test_core_regress.js", "_tests/_test_core_regress.js"),
    ("_test_core_smoke.js", "_tests/_test_core_smoke.js"),
    ("_test_selectDuyu.js", "_tests/_test_selectDuyu.js"),
]
for src, dst in moves:
    s = os.path.join(ROOT, src)
    if os.path.exists(s):
        shutil.move(s, os.path.join(ROOT, dst))
        print("MOVED:", src, "->", dst)

# 2. 修正 regress：ROOT = __dirname 改为上级目录（脚本现在在 _tests/ 内）
p = os.path.join(ROOT, "_tests/_test_core_regress.js")
t = io.open(p, encoding="utf-8").read()
if "const ROOT = __dirname;" in t:
    t = t.replace("const ROOT = __dirname;", "const ROOT = path.join(__dirname, '..');")
    # _old_engine.js 生成到 _tests/ 内
    t = t.replace("const OLD_ENGINE = path.join(ROOT, '_old_engine.js');",
                  "const OLD_ENGINE = path.join(__dirname, '_old_engine.js');")
    io.open(p, "w", encoding="utf-8").write(t)
    print("FIXED: regress ROOT/OLD_ENGINE")

# 3. 修正 smoke：生成文件放 _tests/ 内（若引用 _inline_script_check.js）
p = os.path.join(ROOT, "_tests/_test_core_smoke.js")
t = io.open(p, encoding="utf-8").read()
if "__dirname" in t and "ROOT = __dirname" in t:
    t = t.replace("const ROOT = __dirname;", "const ROOT = path.join(__dirname, '..');")
    io.open(p, "w", encoding="utf-8").write(t)
    print("FIXED: smoke ROOT")
elif "ROOT = __dirname" in t:
    t = t.replace("const ROOT = __dirname;", "const ROOT = path.join(__dirname, '..');")
    io.open(p, "w", encoding="utf-8").write(t)
    print("FIXED: smoke ROOT (alt)")

# 4. 修正 selectDuyu：./core -> ../core
p = os.path.join(ROOT, "_tests/_test_selectDuyu.js")
t = io.open(p, encoding="utf-8").read()
t = t.replace("const coreSrc = fs.readFileSync('./core/liuren-core.js', 'utf-8');",
              "const coreSrc = fs.readFileSync('../core/liuren-core.js', 'utf-8');")
io.open(p, "w", encoding="utf-8").write(t)
print("FIXED: selectDuyu core path")

# 5. 删除临时/生成物
for f in ["_inline_script_check.js", "_old_engine.js"]:
    p = os.path.join(ROOT, f)
    if os.path.exists(p):
        os.remove(p)
        print("DELETED:", f)
# 若 smoke 在 _tests 内生成了 _inline_script_check.js 也删（目前未运行，防残留）
p = os.path.join(TESTS, "_inline_script_check.js")
if os.path.exists(p):
    os.remove(p)
    print("DELETED: _tests/_inline_script_check.js")

print("DONE")

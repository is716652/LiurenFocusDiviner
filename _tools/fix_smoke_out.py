# -*- coding: utf-8 -*-
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\_tests\_test_core_smoke.js"
t = io.open(p, encoding="utf-8").read()
old = "const OUT_CHECK = path.join(ROOT, '_inline_script_check.js');"
new = "const OUT_CHECK = path.join(__dirname, '_inline_script_check.js');"
if old in t:
    t = t.replace(old, new)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK")
else:
    print("MISS")

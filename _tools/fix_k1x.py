# -*- coding: utf-8 -*-
"""修正 impl_keti：去掉顶层 function k1x，直接用 kegs[0].x"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\core\liuren-core.ts"
t = io.open(p, encoding="utf-8").read()

# 若已写入旧版本（含 k1x function），清理；否则脚本幂等
old_fn = """
  /* 返吟井栏射末传辅助：日干上神 */
  function k1x(kegs: Keg[], dg: string): string {
    return kegs[0].x;
  }
"""
if old_fn in t:
    t = t.replace(old_fn, "")
    print("removed k1x fn")

old_use = "        c3 = chuanOf(k1x(kegs, dg));"
new_use = "        c3 = chuanOf(kegs[0].x);"
if old_use in t:
    t = t.replace(old_use, new_use)
    print("fixed k1x usage")

io.open(p, "w", encoding="utf-8").write(t)
print("done")

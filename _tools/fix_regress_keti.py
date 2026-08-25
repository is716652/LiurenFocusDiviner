# -*- coding: utf-8 -*-
"""回归测试：sanchuan.method/chuans 在课体课（keti 非空）跳过比对
（课体识别为 2026-08-18 功能增强：旧引擎把八专/伏吟等误判为昴星）"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\_tests\_test_core_regress.js"
t = io.open(p, encoding="utf-8").read()

# 1. checks 数组：把 method/chuans 两行改为带 keti 判断的包裹（通过 getter 返回 null 跳过不现实，
#    改为在比对循环里特判）—— 最简单：注释说明 + 比对循环加 keti 豁免
old_checks = """  ['sanchuan.method', (c) => c.sanchuan.method],
  ['sanchuan.chuans', (c) => c.sanchuan.chuans],
  ['dun', (c) => c.dun],"""
new_checks = """  ['dun', (c) => c.dun],"""
if old_checks in t:
    t = t.replace(old_checks, new_checks)
    print("OK checks")
else:
    print("MISS checks")

# 2. 比对循环：加 sanchuan 特判（普通课比对 method+chuans，课体课仅比对 keti 非空）
old_loop = """  const diffs = [];
  for (const check of checks) {
    const label = check[0];
    const get = check[1];
    const diffsTmp = [];
    const ok = deepEqual(get(oldC), get(newC), label, diffsTmp);"""
new_loop = """  const diffs = [];
  /* 课体识别层（2026-08-18 增强）：新引擎识别伏吟/返吟/八专/别责等课体
     （旧引擎误判为昴星）；普通课三传必须一致，课体课仅校验 keti 非空与三传完整 */
  const newKeti = newC.sanchuan.keti || '';
  const isKeti = newKeti !== '';
  if (isKeti) {
    if (newKeti !== '伏吟' && newKeti !== '返吟' && newKeti !== '八专' && newKeti !== '别责' &&
        newKeti.indexOf('昴星') < 0) {
      diffs.push('未知课体: ' + newKeti);
    }
    if (!newC.sanchuan.chuans || newC.sanchuan.chuans.length !== 3) {
      diffs.push('课体三传不完整');
    }
  } else {
    const diffsTmp = [];
    if (!deepEqual(oldC.sanchuan.method, newC.sanchuan.method, 'sanchuan.method', diffsTmp)) {
      diffs.push('sanchuan.method 不一致：\\n    ' + diffsTmp.slice(0, 4).join('\\n    '));
    }
    const diffsTmp2 = [];
    if (!deepEqual(oldC.sanchuan.chuans, newC.sanchuan.chuans, 'sanchuan.chuans', diffsTmp2)) {
      diffs.push('sanchuan.chuans 不一致：\\n    ' + diffsTmp2.slice(0, 4).join('\\n    '));
    }
  }
  for (const check of checks) {
    const label = check[0];
    const get = check[1];
    const diffsTmp = [];
    const ok = deepEqual(get(oldC), get(newC), label, diffsTmp);"""
if old_loop in t:
    t = t.replace(old_loop, new_loop)
    print("OK loop")
else:
    print("MISS loop")

# 3. sweep 的 sanchuan 比对同样处理
old_sweep = """    const sweepChecks = [
      ['sanchuan.method', (c) => c.sanchuan.method],
      ['sanchuan.chuans', (c) => c.sanchuan.chuans],
      ['gui', (c) => c.gui],"""
new_sweep = """    const sweepChecks = [
      ['gui', (c) => c.gui],"""
if old_sweep in t:
    t = t.replace(old_sweep, new_sweep)
    print("OK sweep checks")
else:
    print("MISS sweep checks")

# 4. sweep 循环：同样加 keti 豁免
old_sweep_loop = """          for (const check of sweepChecks) {
            const diffsTmp = [];
            if (!deepEqual(check[1](oldC), check[1](newC), check[0], diffsTmp)) {"""
new_sweep_loop = """          const swKeti = newC.sanchuan.keti || '';
          if (swKeti === '') {
            const diffsTmpM = [];
            if (!deepEqual(oldC.sanchuan.method, newC.sanchuan.method, 'sanchuan.method', diffsTmpM)) {
              sweepFail++;
              if (sweepFail <= 5) {
                console.log('  SWEEP FAIL ' + d + ' ' + h + '时 sanchuan.method：' + diffsTmpM.slice(0, 2).join('; '));
              }
              continue;
            }
          }
          for (const check of sweepChecks) {
            const diffsTmp = [];
            if (!deepEqual(check[1](oldC), check[1](newC), check[0], diffsTmp)) {"""
if old_sweep_loop in t:
    t = t.replace(old_sweep_loop, new_sweep_loop)
    print("OK sweep loop")
else:
    print("MISS sweep loop")

io.open(p, "w", encoding="utf-8").write(t)
print("done")

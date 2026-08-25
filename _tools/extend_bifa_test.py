# -*- coding: utf-8 -*-
"""扩展 _test_bifa_keti.js：加入 22法/82法 验证"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\_tests\_test_bifa_keti.js"
t = io.open(p, encoding="utf-8").read()

# 在昴星课扫描段之后、ALL PASS 前插入 22/82 验证
old = """console.log(`昴星课总数: ${maoxingCount} | 54法命中: ${maoxing54}`);
check('存在昴星课', maoxingCount > 0);

console.log(fail === 0 ? '\\nALL PASS' : '\\nFAILED: ' + fail);"""
new = """console.log(`昴星课总数: ${maoxingCount} | 54法命中: ${maoxing54}`);
check('存在昴星课', maoxingCount > 0);

/* 22法 上下皆合（干支上神六合）—— 伏吟课中最常见 */
console.log('\\n=== 第22法 上下皆合 ===');
let hit22 = 0;
for (const rec of cal['2026']) {
  for (const hz of hours) {
    const c = LiurenCore.buildChart({ date: rec.d, hourZhi: hz, calData: calData, yjAll: yjAll });
    if (!c) continue;
    if (c.dx.bifa.some(h => h['序'] === 22)) {
      hit22++;
      if (hit22 <= 3) {
        console.log(`  ${rec.d} ${hz}时 ${rec.dg}${rec.dz}日 22法命中 干上${c.kegs[0].x} 支上${c.kegs[2].x} 毕法[${c.dx.bifa.map(h=>h['序']).join(',')}]`);
      }
    }
  }
}
console.log(`22法命中: ${hit22}`);
check('22法至少命中一次', hit22 > 0);

/* 82法 不行传者（中末空亡考初传） */
console.log('\\n=== 第82法 不行传者 ===');
let hit82 = 0;
for (const rec of cal['2026']) {
  for (const hz of hours) {
    const c = LiurenCore.buildChart({ date: rec.d, hourZhi: hz, calData: calData, yjAll: yjAll });
    if (!c) continue;
    if (c.dx.bifa.some(h => h['序'] === 82)) {
      hit82++;
      if (hit82 <= 3) {
        console.log(`  ${rec.d} ${hz}时 ${rec.dg}${rec.dz}日 82法命中 三传[${c.sanchuan.chuans.map(x=>x.gz).join('→')}] 空亡[${c.dx.xunkong.join('')}]`);
      }
    }
  }
}
console.log(`82法命中: ${hit82}`);
check('82法至少命中一次', hit82 > 0);

console.log(fail === 0 ? '\\nALL PASS' : '\\nFAILED: ' + fail);"""
if old in t:
    t = t.replace(old, new)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK extended")
else:
    print("MISS")

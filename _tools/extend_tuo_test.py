# -*- coding: utf-8 -*-
"""扩展 _test_bifa_keti.js：加入 9/15/35/36 验证"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\_tests\_test_bifa_keti.js"
t = io.open(p, encoding="utf-8").read()

old = """for (const no of Object.keys(targets)) {
  console.log(`第${no}法[${targets[no]}]命中: ${counts[no]}`);
  check(`第${no}法至少命中一次`, counts[no] > 0);
}

console.log(fail === 0 ? '\\nALL PASS' : '\\nFAILED: ' + fail);"""
new = """for (const no of Object.keys(targets)) {
  console.log(`第${no}法[${targets[no]}]命中: ${counts[no]}`);
  check(`第${no}法至少命中一次`, counts[no] > 0);
}

/* 脱败逃生组：9避难逃生 / 15脱上逢脱 / 35人宅受脱 / 36干上逢败 */
console.log('\\n=== 脱败逃生组扫描 ===');
const targets2 = { 9: '避难逃生', 15: '脱上逢脱', 35: '人宅受脱', 36: '干上逢败' };
const counts2 = { 9: 0, 15: 0, 35: 0, 36: 0 };
for (const rec of cal['2026']) {
  for (const hz of hours) {
    const c = LiurenCore.buildChart({ date: rec.d, hourZhi: hz, calData: calData, yjAll: yjAll });
    if (!c) continue;
    for (const no of Object.keys(targets2)) {
      if (c.dx.bifa.some(h => h['序'] === Number(no))) {
        counts2[no]++;
        if (counts2[no] <= 2) {
          console.log(`  ${rec.d} ${hz}时 ${rec.dg}${rec.dz}日 第${no}法[${targets2[no]}]命中 干上${c.kegs[0].x} 支上${c.kegs[2].x} 三传[${c.sanchuan.chuans.map(x=>x.gz).join('→')}]`);
        }
      }
    }
  }
}
for (const no of Object.keys(targets2)) {
  console.log(`第${no}法[${targets2[no]}]命中: ${counts2[no]}`);
  check(`第${no}法至少命中一次`, counts2[no] > 0);
}

console.log(fail === 0 ? '\\nALL PASS' : '\\nFAILED: ' + fail);"""
if old in t:
    t = t.replace(old, new)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK extended")
else:
    print("MISS")

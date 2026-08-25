# -*- coding: utf-8 -*-
"""扩展 _test_bifa_keti.js：加入 4/11/31/33 复合格局验证"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\_tests\_test_bifa_keti.js"
t = io.open(p, encoding="utf-8").read()

old = """console.log(`82法命中: ${hit82}`);
check('82法至少命中一次', hit82 > 0);

console.log(fail === 0 ? '\\nALL PASS' : '\\nFAILED: ' + fail);"""
new = """console.log(`82法命中: ${hit82}`);
check('82法至少命中一次', hit82 > 0);

/* 复合格局：4催官使者 / 11众鬼虽彰 / 31三传递生 / 33有始无终 */
console.log('\\n=== 复合格局扫描 ===');
const targets = { 4: '催官使者', 11: '众鬼虽彰', 31: '三传递生', 33: '有始无终' };
const counts = { 4: 0, 11: 0, 31: 0, 33: 0 };
for (const rec of cal['2026']) {
  for (const hz of hours) {
    const c = LiurenCore.buildChart({ date: rec.d, hourZhi: hz, calData: calData, yjAll: yjAll });
    if (!c) continue;
    for (const no of Object.keys(targets)) {
      if (c.dx.bifa.some(h => h['序'] === Number(no))) {
        counts[no]++;
        if (counts[no] <= 2) {
          console.log(`  ${rec.d} ${hz}时 ${rec.dg}${rec.dz}日 第${no}法[${targets[no]}]命中 三传[${c.sanchuan.chuans.map(x=>x.gz).join('→')}]`);
        }
      }
    }
  }
}
for (const no of Object.keys(targets)) {
  console.log(`第${no}法[${targets[no]}]命中: ${counts[no]}`);
  check(`第${no}法至少命中一次`, counts[no] > 0);
}

console.log(fail === 0 ? '\\nALL PASS' : '\\nFAILED: ' + fail);"""
if old in t:
    t = t.replace(old, new)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK extended")
else:
    print("MISS")

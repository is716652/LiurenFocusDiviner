# -*- coding: utf-8 -*-
"""修正 _test_keti.js：八专/别责改用真实历法样本（手工构造易产生意外贼克）"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\_tests\_test_keti.js"
t = io.open(p, encoding="utf-8").read()

# 定位第 3、4 个手工测试块，替换为真实样本验证
start3 = t.find("/* 3. 八专：干支同位（甲寅日，寅寄寅），须无贼克 */")
end4 = t.find("/* 5. 普通课不受影响：元首 */")
if start3 < 0 or end4 < 0:
    print("MISS blocks", start3, end4)
else:
    new34 = '''/* 3+4. 八专 / 别责：用真实历法样本（手工构造易产生意外贼克，由 _scan_keti.js 全量覆盖） */
{
  const cal = JSON.parse(fs.readFileSync('D:/nutstore/HarmonyOS/GuoXue_Research/LargeLiuRen-Design/APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/cal/cal_2020.json', 'utf-8'));
  const yjAll = JSON.parse(fs.readFileSync('D:/nutstore/HarmonyOS/GuoXue_Research/LargeLiuRen-Design/APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/cal/yj_all.json', 'utf-8'));
  const calData = { '2026': cal['2026'] };
  // 八专样本：2026-02-02 丁未日 卯时（干支同位）
  const bz = LiurenCore.buildChart({ date: '2026-02-02', hourZhi: '卯', calData: calData, yjAll: yjAll });
  check('八专识别(真实样本)', bz && bz.sanchuan.keti === '八专', bz ? 'got ' + bz.sanchuan.keti : 'null');
  if (bz) {
    check('八专三传3个', bz.sanchuan.chuans.length === 3);
    console.log('  八专三传:', bz.sanchuan.chuans.map(c => c.gz).join('→'));
  }
  // 别责样本：2026-01-27 辛丑日 酉时
  const bz2 = LiurenCore.buildChart({ date: '2026-01-27', hourZhi: '酉', calData: calData, yjAll: yjAll });
  check('别责识别(真实样本)', bz2 && bz2.sanchuan.keti === '别责', bz2 ? 'got ' + bz2.sanchuan.keti : 'null');
  if (bz2) {
    check('别责三传3个', bz2.sanchuan.chuans.length === 3);
    console.log('  别责三传:', bz2.sanchuan.chuans.map(c => c.gz).join('→'));
  }
}

'''
    t = t[:start3] + new34 + t[end4:]
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK replaced")

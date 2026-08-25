# -*- coding: utf-8 -*-
"""补丁：鸿蒙 LiurenCore.ets 新增 validGanZhi/yuejiangForMonth/validYuejiangForMonth"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\model\LiurenCore.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    old = """  /* ---------------- 古籍案例起盘 ----------------"""
    assert s.count(old) == 1, 'anchor: %d' % s.count(old)
    new = """  /* ---------------- 古籍案例校验 ----------------
     1) validGanZhi：干支阴阳匹配（阳干配阳支，60甲子合法组合）
     2) yuejiangForMonth：月将=太阳过宫，建月→月将（寅月亥将、卯月戌将…子月丑将） */
  static validGanZhi(gan: string, zhi: string): boolean {
    if (LiurenCore.GAN.indexOf(gan) < 0 || LiurenCore.ZHI.indexOf(zhi) < 0) {
      return false;
    }
    const ganYang = !!LiurenCore.G_YANG[gan];
    const zhiYang = !!LiurenCore.YANG_ZHI[zhi];
    return ganYang === zhiYang;
  }

  static yuejiangForMonth(monthZhi: string): string {
    const m: Record<string, string> = {
      "寅": "亥", "卯": "戌", "辰": "酉", "巳": "申",
      "午": "未", "未": "午", "申": "巳", "酉": "辰",
      "戌": "卯", "亥": "寅", "子": "丑", "丑": "子"
    };
    return m[monthZhi] || "";
  }

  static validYuejiangForMonth(monthZhi: string, mjZhi: string): boolean {
    return LiurenCore.yuejiangForMonth(monthZhi) === mjZhi;
  }

  /* ---------------- 古籍案例起盘 ----------------"""
    s = s.replace(old, new)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('HM VALIDATION PATCH OK')

if __name__ == '__main__':
    main()

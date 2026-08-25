# -*- coding: utf-8 -*-
"""补丁：鸿蒙 LiurenCore.ets 新增 zhonghuangDun（中黄天干两遁）
1) XingNianResult 后加 ZhonghuangDun 接口
2) hourGan 方法后加 zhonghuangDun 方法
"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\model\LiurenCore.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    # ① 接口：XingNianResult 结束 } 后加 ZhonghuangDun
    # 找 XingNianResult 接口结尾（advice: string;\n}）
    old_iface = """  score: number;
  band: string;
  advice: string;
}"""
    assert s.count(old_iface) == 1, 'iface anchor: %d' % s.count(old_iface)
    new_iface = """  score: number;
  band: string;
  advice: string;
}

/* 中黄五变经 · 天干两遁结果 */
export interface ZhonghuangDun {
  dayGan: string;
  hourZhi: string;
  shiGan: string;
  riDun: Record<string, string>;
  shiDun: Record<string, string>;
  bianGan: string;
}"""
    s = s.replace(old_iface, new_iface)

    # ② 方法：hourGan 后加 zhonghuangDun
    old_fn = """  /* 时干：日干 + 时辰 -> 时干 */
  static hourGan(dg: string, hz: string): string {
    return LiurenCore.GAN[(LiurenCore.GAN.indexOf(LiurenCore.wutun(dg)) + LiurenCore.ZHI.indexOf(hz)) % 10];
  }
"""
    assert s.count(old_fn) == 1, 'fn anchor: %d' % s.count(old_fn)
    new_fn = old_fn + """
  /* ---------------- 中黄五变经 · 天干两遁 ----------------
     体：日干遁盘（旬遁之外的本体能量） = dunMap(日干)
     用：时干遁盘（中黄盘，断课核心）   = dunMap(时干)，时干=c.hourGan（引擎已算）
     变干：中黄盘中占时支对应的干（断课核心枢纽）
     算法经文课例验证：庚辰日未时/庚子日申时/己未日巳时/戊戌日未时 12 项全通过 */
  static zhonghuangDun(c: ChartCore, hourZhi: string): ZhonghuangDun {
    const dayGan = c.r.dg;
    const riDun = LiurenCore.dunMap(dayGan);
    const sg = c.hourGan;
    const shiDun = LiurenCore.dunMap(sg);
    const bianGan = shiDun[hourZhi];
    const out: ZhonghuangDun = {
      dayGan: dayGan,
      hourZhi: hourZhi,
      shiGan: sg,
      riDun: riDun,
      shiDun: shiDun,
      bianGan: bianGan
    };
    return out;
  }
"""
    s = s.replace(old_fn, new_fn)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('HM zhonghuangDun PATCH OK')

if __name__ == '__main__':
    main()

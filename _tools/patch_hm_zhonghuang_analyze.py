# -*- coding: utf-8 -*-
"""补丁：鸿蒙 LiurenCore.ets 新增 zhonghuangAnalyze（双视角对比+变干主线+建合检测）
1) ZhonghuangDun 后加 ZhonghuangCmpItem/ZhonghuangJianhe/ZhonghuangAnalyze 接口
2) zhonghuangDun 后加 zhonghuangAnalyze 方法
"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\model\LiurenCore.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    # ① 接口
    old_iface = """/* 中黄五变经 · 天干两遁结果 */
export interface ZhonghuangDun {
  dayGan: string;
  hourZhi: string;
  shiGan: string;
  riDun: Record<string, string>;
  shiDun: Record<string, string>;
  bianGan: string;
}"""
    assert s.count(old_iface) == 1, 'iface: %d' % s.count(old_iface)
    new_iface = old_iface + """

/* 中黄双视角对比：单宫 旬遁六亲 vs 中黄六亲 */
export interface ZhonghuangCmpItem {
  gong: string;
  xunGan: string;
  zhGan: string;
  xunLq: string;
  zhLq: string;
  changed: boolean;
}

/* 建合检测：日遁干 × 时遁干 天干五合 */
export interface ZhonghuangJianhe {
  pos: string;
  gong: string;
  riGan: string;
  shiGan: string;
  type: string;
}

/* 中黄完整分析 */
export interface ZhonghuangAnalyze {
  dun: ZhonghuangDun;
  cmp: ZhonghuangCmpItem[];
  changed: string[];
  bianGong: string;
  bianJiang: string;
  bianLq: string;
  bianInChuan: string;
  jianhe: ZhonghuangJianhe[];
}"""
    s = s.replace(old_iface, new_iface)

    # ② 方法：zhonghuangDun 结束后加 zhonghuangAnalyze
    old_fn = """    const out: ZhonghuangDun = {
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
    assert s.count(old_fn) == 1, 'fn: %d' % s.count(old_fn)
    new_fn = old_fn + """
  /* ---------------- 中黄五变经 · 完整分析 ----------------
     双视角六亲对比（旬遁 vs 中黄时遁）+ 变干主线 + 建合检测 */
  static zhonghuangAnalyze(c: ChartCore, hourZhi: string): ZhonghuangAnalyze {
    const z = LiurenCore.zhonghuangDun(c, hourZhi);
    const dayGan = c.r.dg;
    const dwx = LiurenCore.WXG[dayGan];
    const liuqinOf = (gan: string): string => {
      const w = LiurenCore.WXG[gan];
      if (w === dwx) {
        return "比肩";
      } else if (LiurenCore.KE[dwx] === w) {
        return "妻财";
      } else if (LiurenCore.KE[w] === dwx) {
        return "官鬼";
      } else if (LiurenCore.SHENG(dwx) === w) {
        return "子孙";
      }
      return "父母";
    };
    const items: ZhonghuangCmpItem[] = [];
    const changed: string[] = [];
    LiurenCore.ZHI.forEach((gz: string) => {
      const xunGan = c.dun[gz];
      const zhGan = z.shiDun[gz];
      const xunLq = liuqinOf(xunGan);
      const zhLq = liuqinOf(zhGan);
      const isChanged = xunLq !== zhLq;
      if (isChanged) {
        changed.push(gz);
      }
      const it: ZhonghuangCmpItem = {
        gong: gz,
        xunGan: xunGan,
        zhGan: zhGan,
        xunLq: xunLq,
        zhLq: zhLq,
        changed: isChanged
      };
      items.push(it);
    });
    const bianGong = hourZhi;
    const bianJiang = c.jiangMap[LiurenCore.gongOf(c.tp, z.bianGan)] || "";
    let chuanPos = "";
    for (let i = 0; i < c.sanchuan.chuans.length; i++) {
      const chz = c.sanchuan.chuans[i].z;
      if (z.shiDun[chz] === z.bianGan) {
        chuanPos = ["初传", "中传", "末传"][i];
        break;
      }
    }
    const jianhe: ZhonghuangJianhe[] = [];
    const checkHe = (gz: string, label: string): void => {
      const rg = z.riDun[gz];
      const sg2 = z.shiDun[gz];
      if (LiurenCore.HE_GAN[rg] === sg2) {
        jianhe.push({ pos: label, gong: gz, riGan: rg, shiGan: sg2, type: "建合" });
      }
    };
    checkHe(c.kegs[0].x, "日上");
    checkHe(c.kegs[2].x, "支上");
    checkHe(hourZhi, "变干宫");
    for (let i = 0; i < c.sanchuan.chuans.length; i++) {
      checkHe(c.sanchuan.chuans[i].z, ["初传", "中传", "末传"][i]);
    }
    const out: ZhonghuangAnalyze = {
      dun: z,
      cmp: items,
      changed: changed,
      bianGong: bianGong,
      bianJiang: bianJiang,
      bianLq: liuqinOf(z.bianGan),
      bianInChuan: chuanPos,
      jianhe: jianhe
    };
    return out;
  }
"""
    s = s.replace(old_fn, new_fn)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('HM zhonghuangAnalyze PATCH OK')

if __name__ == '__main__':
    main()

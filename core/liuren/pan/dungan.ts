/* ============================================================================
 * pan/dungan —— 遁干（旬遁 / 日干遁 / 时干）
 * ----------------------------------------------------------------------------
 * 不变量：《五子元遁法》；旬遁为传统默认层。
 * 由单体核心按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ==========================================================================*/

class LrDungan {
  static wutun(g: string): string {
    const map: Record<string, string> = {
      "甲": "甲", "己": "甲", "乙": "丙", "庚": "丙",
      "丙": "戊", "辛": "戊", "丁": "庚", "壬": "庚",
      "戊": "壬", "癸": "壬"
    };
    return map[g];
  }

  /* 时干：日干 + 时辰 -> 时干 */
  static hourGan(dg: string, hz: string): string {
    return LrBase.GAN[(LrBase.GAN.indexOf(LrDungan.wutun(dg)) + LrBase.ZHI.indexOf(hz)) % 10];
  }


  /* 旬遁（传统层）：日干支 -> {地支:旬遁干}；旬外二支为旬空，无干（留空）
     出处：大六壬文档/古籍原文-易藏-术数/六壬集成五要权衡--佚名「须用旬遁……旬遁方有空亡……若用时遁无空亡」；
           大六壬文档/中黄五变经/中黄五变经研读整理.md「旬遁＝三传/盘面配干（标准六壬）＝传统层」 */
  static xunDun(dg: string, dz: string): Record<string, string> {
    const Z: string[] = LrBase.ZHI;
    const G: string[] = LrBase.GAN;
    let n: number = -1;
    for (let k = 0; k < 60; k++) {
      if (G[k % 10] === dg && Z[k % 12] === dz) {
        n = k;
        break;
      }
    }
    const m: Record<string, string> = {};
    if (n < 0) {
      return m;
    }
    const sz: string = Z[(Math.floor(n / 10) * 10) % 12];
    for (let k = 0; k < 12; k++) {
      m[Z[(Z.indexOf(sz) + k) % 12]] = k < 10 ? G[k % 10] : "";
    }
    return m;
  }


  /* 五子元遁：日干 -> {地支:遁干} */
  static dunMap(dg: string): Record<string, string> {
    const zi = LrDungan.wutun(dg);
    const ziIdx = LrBase.GAN.indexOf(zi);
    const m: Record<string, string> = {};
    LrBase.ZHI.forEach((z: string, i: number) => {
      m[z] = LrBase.GAN[(ziIdx + i) % 10];
    });
    return m;
  }

}

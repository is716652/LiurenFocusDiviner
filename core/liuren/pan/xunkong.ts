/* ============================================================================
 * pan/xunkong —— 旬空
 * ----------------------------------------------------------------------------
 * 不变量：旬遁下空亡支不配干；旬表 甲子戌亥 / 甲戌申酉 / … / 甲寅子丑。
 * 由单体核心按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ==========================================================================*/

class LrXunkong {
  static readonly XUN_OF: Record<string, string> = (() => {
    const m: Record<string, string> = {};
    const t: string[] = ["甲子", "甲戌", "甲申", "甲午", "甲辰", "甲寅"];
    t.forEach((jia: string) => {
      const j = LrBase.GAN.indexOf(jia[0]);
      const z = LrBase.ZHI.indexOf(jia[1]);
      for (let i = 0; i < 10; i++) {
        m[LrBase.GAN[(j + i) % 10] + LrBase.ZHI[(z + i) % 12]] = jia;
      }
    });
    return m;
  })();

}

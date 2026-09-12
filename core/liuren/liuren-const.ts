/* ============================================================================
 * liuren/liuren-const —— 最基础常量与五行工具（所有模块的公共底座）
 * ----------------------------------------------------------------------------
 * 干支表 / 五行 / 寄宫 / 相克 / 反查等被全部模块共用；本模块不依赖任何其它模块。
 * 由单体核心按 Agent.md §13 模块边界**逐字搬移**（纯结构拆分，行为不变）。
 * ==========================================================================*/

class LrBase {
  /* ---------------- 常量（自 HTML 常量块） ---------------- */
  static readonly GAN: string[] = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  static readonly ZHI: string[] = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  static readonly JI_GONG: Record<string, string> = {
    "甲": "寅", "乙": "辰", "丙": "巳", "丁": "未", "戊": "巳",
    "己": "未", "庚": "申", "辛": "戌", "壬": "亥", "癸": "丑"
  };
  static readonly WX: Record<string, string> = {
    "子": "水", "丑": "土", "寅": "木", "卯": "木", "辰": "土", "巳": "火",
    "午": "火", "未": "土", "申": "金", "酉": "金", "戌": "土", "亥": "水"
  };
  static readonly WXG: Record<string, string> = {
    "甲": "木", "乙": "木", "丙": "火", "丁": "火", "戊": "土",
    "己": "土", "庚": "金", "辛": "金", "壬": "水", "癸": "水"
  };
  static readonly KE: Record<string, string> = {
    "木": "土", "土": "水", "水": "火", "火": "金", "金": "木"
  };
  static readonly GUIREN: Record<string, string[]> = {
    "甲": ["丑", "未"], "戊": ["丑", "未"], "庚": ["丑", "未"],
    "乙": ["子", "申"], "己": ["子", "申"],
    "丙": ["亥", "酉"], "丁": ["亥", "酉"],
    "壬": ["巳", "卯"], "癸": ["巳", "卯"], "辛": ["午", "寅"]
  };

  static readonly YANG_ZHI: Record<string, number> = { "子": 1, "寅": 1, "辰": 1, "午": 1, "申": 1, "戌": 1 };
  static readonly G_YANG: Record<string, number> = { "甲": 1, "丙": 1, "戊": 1, "庚": 1, "壬": 1 };


  static SHENG(a: string): string {
    const map: Record<string, string> = { "木": "火", "火": "土", "土": "金", "金": "水", "水": "木" };
    return map[a];
  }

  /* 反查：tp/jiangMap 值 -> 键（地盘宫） */

  static gongOf(tp: Record<string, string>, z: string): string {
    const keys = Object.keys(tp);
    for (let i = 0; i < keys.length; i++) {
      if (tp[keys[i]] === z) {
        return keys[i];
      }
    }
    return z;
  }

  /* ---------------- 排盘引擎 ---------------- */
  /* 五子元遁首干：日干 -> 遁首 */

  static wxOf(x: string): string {
    return LrBase.WX[x] || LrBase.WXG[x];
  }

  /* 相克判断：a 克 b */
  static ke(a: string, b: string): boolean {
    return LrBase.KE[LrBase.wxOf(a)] === LrBase.wxOf(b);
  }

}

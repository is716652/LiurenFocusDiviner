/**
 * TransitionFx —— 页面转场参数（应用市场自检要求：动效时长按设备尺寸分档）
 * ----------------------------------------------------------------------------
 * 自检原文：「全屏页面的转场动效时长在 8.5 英寸以下的设备上不应短于 200 ms，
 *   在 8.5 至 12 英寸的设备上不应短于 250 ms，在 12 英寸以上的设备上不应短于 300 ms。」
 * 做法：按**物理英寸**（屏幕对角线）分档，并取各档上限值而非下限，留出余量：
 *   < 8.5in → 220ms（≥200 ✓）｜8.5–12in → 280ms（≥250 ✓）｜> 12in → 320ms（≥300 ✓）
 * 英寸怎么算：Display 给的是像素分辨率与 DPI，对角线像素 / DPI = 物理英寸。
 * 取不到时**回落到 320ms** —— 要求是"不短于"，取最长档在任何设备上都合规（宁可略慢，不可违规）。
 * 页面转场只声明 opacity（不写 slide/translate/scale，不产生位移），曲线用弹簧曲线；
 * 这两条由门禁 `_tests/_test_page_transition.js` 逐个 @Entry 页面校验。
 */
import { display } from '@kit.ArkUI';

const SMALL_MAX_INCH = 8.5;
const MID_MAX_INCH = 12;
const DUR_SMALL = 220;
const DUR_MID = 280;
const DUR_LARGE = 320;

export class TransitionFx {
  private static cached: number = 0;

  /** 全屏页面转场时长（ms），按设备物理尺寸分档；结果缓存（尺寸不会变）。 */
  static pageDur(): number {
    if (TransitionFx.cached > 0) {
      return TransitionFx.cached;
    }
    let inch: number = 0;
    try {
      const d: display.Display = display.getDefaultDisplaySync();
      const dpi: number = (d.xDPI !== undefined && d.xDPI > 0) ? d.xDPI : d.densityDPI;
      if (dpi > 0 && d.width > 0 && d.height > 0) {
        inch = Math.sqrt(d.width * d.width + d.height * d.height) / dpi;
      }
    } catch (e) {
      inch = 0;
    }
    if (inch > 0 && inch < SMALL_MAX_INCH) {
      TransitionFx.cached = DUR_SMALL;
    } else if (inch > 0 && inch <= MID_MAX_INCH) {
      TransitionFx.cached = DUR_MID;
    } else {
      TransitionFx.cached = DUR_LARGE;
    }
    return TransitionFx.cached;
  }

  /** 供自检/自查用：当前判定的英寸数（取不到返回 0） */
  static inch(): number {
    try {
      const d: display.Display = display.getDefaultDisplaySync();
      const dpi: number = (d.xDPI !== undefined && d.xDPI > 0) ? d.xDPI : d.densityDPI;
      if (dpi > 0 && d.width > 0 && d.height > 0) {
        return Math.round(Math.sqrt(d.width * d.width + d.height * d.height) / dpi * 10) / 10;
      }
    } catch (e) {
      return 0;
    }
    return 0;
  }
}

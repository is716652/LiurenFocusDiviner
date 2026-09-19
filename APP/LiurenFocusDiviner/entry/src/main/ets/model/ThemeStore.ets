/**
 * ThemeStore —— 主题偏好（深色=默认 / 浅色可选）
 * ----------------------------------------------------------------------------
 * 用户诉求：「默认保持现在的深色，另提供浅色可选」。
 * 落地机制：资源仍是 base(浅色) + dark(深色) 两套同名令牌，
 *   本模块只负责 ① 读写偏好 ② 调 setColorMode 覆盖 colorMode 解析。
 * 为什么系统栏颜色也从令牌取：该 API 只收字符串（不认 Resource），
 *   原先写死 '#17150F'，浅色主题下会留一条深色状态栏 ✗。
 * 线程：preferences 的 Sync 系列 + setColorMode 都要求主线程调用，故都在 UI 侧调用。
 */
import { preferences } from '@kit.ArkData';
import { ConfigurationConstant, common } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';
import { resourceManager } from '@kit.LocalizationKit';

const STORE_NAME = 'liuren_settings';
const KEY_THEME = 'themeMode';
export const THEME_DARK = 'dark';
export const THEME_LIGHT = 'light';

export class ThemeStore {
  private static store: preferences.Preferences | null = null;
  private static mode: string = THEME_DARK;
  /* 启动时拿到的窗口（onWindowStageCreate 传入）：应用内切换时 Home 只能传 null，
     故在此缓存一份，否则切换后系统栏颜色不会跟着变（深色状态栏压在浅色页面上）✗ */
  private static win: window.Window | null = null;

  /** 读取偏好（无偏好时=深色，与历史版本观感一致）。返回当前模式。 */
  static init(ctx: common.UIAbilityContext): string {
    try {
      const opt: preferences.Options = { name: STORE_NAME };
      ThemeStore.store = preferences.getPreferencesSync(ctx, opt);
      const v: string = ThemeStore.store.getSync(KEY_THEME, THEME_DARK) as string;
      ThemeStore.mode = (v === THEME_LIGHT) ? THEME_LIGHT : THEME_DARK;
    } catch (e) {
      ThemeStore.mode = THEME_DARK;
    }
    return ThemeStore.mode;
  }

  static get(): string {
    return ThemeStore.mode;
  }

  static isLight(): boolean {
    return ThemeStore.mode === THEME_LIGHT;
  }

  /** 应用模式：覆盖 colorMode（资源解析随之切换）+ 同步系统栏配色。 */
  static apply(ctx: common.UIAbilityContext, win: window.Window | null): void {
    try {
      const light: boolean = ThemeStore.isLight();
      ctx.getApplicationContext().setColorMode(light
        ? ConfigurationConstant.ColorMode.COLOR_MODE_LIGHT
        : ConfigurationConstant.ColorMode.COLOR_MODE_DARK);
      ThemeStore.win = (win !== null) ? win : ThemeStore.win;
      const w: window.Window | null = ThemeStore.win;
      if (w !== null) {
        /* 系统栏配色：从**能力上下文的 ResourceManager** 取（不再走 window.getUIContext()）。
           原来那条路径在 onWindowStageCreate（loadContent 之前）拿不到 host context，
           异常被吞后 statusBarContentColor 回落成深色 ⇒ 深底深图标、状态栏信息全看不见
           —— 这就是 1.0.5 自检失败的原因。另外：**取不到就整块不设**（异常抛给外层），
           宁可保持系统默认，也绝不设一个颜色对比不确定的值。 */
        const mgr: resourceManager.ResourceManager = ctx.resourceManager;
        const bg: number = mgr.getColorByNameSync('bar_bg');
        const fg: number = mgr.getColorByNameSync('bar_content');
        const props: window.SystemBarProperties = {
          statusBarColor: ThemeStore.css(bg),
          statusBarContentColor: ThemeStore.css(fg),
          navigationBarColor: ThemeStore.css(bg),
          navigationBarContentColor: ThemeStore.css(fg)
        };
        w.setWindowSystemBarProperties(props);
      }
    } catch (e) {
      /* 失败则维持现状：宁可配色不跟随，也不要崩 */
    }
  }

  /** 切换并持久化。返回切换后的模式。 */
  static toggle(ctx: common.UIAbilityContext, win: window.Window | null): string {
    ThemeStore.setMode(ctx, win, ThemeStore.isLight() ? THEME_DARK : THEME_LIGHT);
    return ThemeStore.mode;
  }

  static setMode(ctx: common.UIAbilityContext, win: window.Window | null, mode: string): void {
    ThemeStore.mode = (mode === THEME_LIGHT) ? THEME_LIGHT : THEME_DARK;
    try {
      if (ThemeStore.store !== null) {
        ThemeStore.store.putSync(KEY_THEME, ThemeStore.mode);
        ThemeStore.store.flush();
      }
    } catch (e) {
      /* 落盘失败不影响本次切换 */
    }
    ThemeStore.apply(ctx, win);
  }

  /** ARGB int → '#RRGGBB'（系统栏 API 只收字符串，不认 Resource） */
  private static css(v: number): string {
    const h = (n: number): string => {
      const t: string = n.toString(16).toUpperCase();
      return t.length === 1 ? '0' + t : t;
    };
    return '#' + h((v >>> 16) & 0xFF) + h((v >>> 8) & 0xFF) + h(v & 0xFF);
  }
}

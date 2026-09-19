import { AbilityConstant, UIAbility, Want } from '@kit.AbilityKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { window } from '@kit.ArkUI';
import { ThemeStore } from '../model/ThemeStore';

const DOMAIN = 0x0000;

export default class EntryAbility extends UIAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onCreate');
  }

  onDestroy(): void {
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onDestroy');
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    // Main window is created, set main page for this ability
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onWindowStageCreate');

    /* 状态栏适配（华为 UX 审核）：不做全屏沉浸，系统保留状态栏区域；
       仅统一状态栏/导航栏颜色，页面根容器不再扩展 TOP 安全区，避免标题/按钮遮挡。 */
    try {
      const win = windowStage.getMainWindowSync();
      win.setWindowLayoutFullScreen(false);
      /* 主题：默认深色（与历史版本观感一致），用户可在应用内切浅色。
         读偏好 → 覆盖 colorMode（资源解析随之切 base/dark）→ 同步系统栏配色。
         系统栏 API 只收字符串、不认 Resource，故颜色由 ThemeStore 从令牌取。 */
      ThemeStore.init(this.context);
      ThemeStore.apply(this.context, win);
    } catch (err) {
      hilog.error(DOMAIN, 'testTag', 'Failed to set immersive. Cause: %{public}s', JSON.stringify(err));
    }

    windowStage.loadContent('pages/Splash', (err) => {
      if (err.code) {
        hilog.error(DOMAIN, 'testTag', 'Failed to load the content. Cause: %{public}s', JSON.stringify(err));
        return;
      }
      hilog.info(DOMAIN, 'testTag', 'Succeeded in loading the content.');
    });

    /* colorMode 已由 ThemeStore.apply 在 onWindowStageCreate 里统一设置（默认深色、可切浅色），
       此处不再重复设置，避免两处口径打架。 */
  }

  onWindowStageDestroy(): void {
    // Main window is destroyed, release UI related resources
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onWindowStageDestroy');
  }

  onForeground(): void {
    // Ability has brought to foreground
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onForeground');
  }

  onBackground(): void {
    // Ability has back to background
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onBackground');
  }
}
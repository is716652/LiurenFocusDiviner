/**
 * NavUtil —— 页签（排盘 / 课例 / 古籍）导航统一入口
 * ----------------------------------------------------------------------------
 * 背景（应用市场审核反馈）：三个页签原先「进入」用 pushUrl、「回排盘」用 router.back()，
 * 只退一层；反复进入课例/古籍会把页面栈堆起来，点「排盘」便回不到排盘页。
 *
 * 规则（依据 @ohos.router 文档与 SDK 声明）：
 *   ① 目标页已在页面栈中 → back(该页 index)：直接回到它，页面不重建（排盘页盘面状态得以保留）；
 *   ② 目标页不在栈中 → pushUrl 新开一页；
 *   ③ 目标页就是当前页 → 不动（页签允许点击当前项）。
 * 不能直接用 back({ url })：文档明确「如果页面栈上没有 url 页面，则不响应该情况」。
 *
 * ArkTS 合规：零 any / unknown；显式类型
 */
import { UIContext, router } from '@kit.ArkUI';

/** 跳转页签页（不带参，保留目标页原有状态） */
export function goTab(ui: UIContext, url: string): void {
  navigate(ui, url, null);
}

/** 带参跳转页签页（如课例恢复：回到排盘页并带上日期时辰） */
export function goTabWith(ui: UIContext, url: string, params: Record<string, Object>): void {
  navigate(ui, url, params);
}

function navigate(ui: UIContext, url: string, params: Record<string, Object> | null): void {
  const r = ui.getRouter();
  let target: number = 0;
  try {
    const cur: router.RouterState = r.getState();
    const list: router.RouterState[] = r.getStateByUrl(url);
    for (let i = 0; i < list.length; i++) {
      if (list[i].index === cur.index) {
        return;                       /* 目标即当前页：不做任何跳转 */
      }
      target = list[i].index;         /* 取栈中最上面的同 url 页面 */
    }
  } catch (e) {
    target = 0;                       /* 查栈失败：退回 push 逻辑 */
  }
  if (target > 0) {
    if (params !== null) {
      r.back(target, params);
    } else {
      r.back(target);
    }
    return;
  }
  if (params !== null) {
    r.pushUrl({ url: url, params: params });
  } else {
    r.pushUrl({ url: url });
  }
}

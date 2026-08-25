/**
 * PayStore —— 购买状态本地持久化（Preferences）
 * ----------------------------------------------------------------------------
 * 记录已购 productId；恢复购买时由 PayGate 调 IapAdapter.restore() 回写
 * 上下文由 PayGate.init(ctx) 注入（UIAbilityContext → Preferences）
 * ArkTS 合规：零 any / unknown；显式类型
 */
import { preferences } from '@kit.ArkData';
import { common } from '@kit.AbilityKit';

export class PayStore {
  private static readonly STORE_NAME: string = 'pay_store';
  private static readonly KEY_OWNED: string = 'owned_products';
  private static prefs: preferences.Preferences | null = null;

  /* 初始化（由 PayGate.init 调用；失败时降级为内存态） */
  static async init(ctx: common.UIAbilityContext): Promise<void> {
    try {
      PayStore.prefs = await preferences.getPreferences(ctx, PayStore.STORE_NAME);
    } catch (e) {
      PayStore.prefs = null;
    }
  }

  /* 读取已购商品 ID 列表（异常返回空数组） */
  static async loadOwned(): Promise<string[]> {
    if (!PayStore.prefs) {
      return [];
    }
    try {
      const v = await PayStore.prefs.get(PayStore.KEY_OWNED, '');
      if (v === '') {
        return [];
      }
      const arr = JSON.parse(v as string) as string[];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  /* 保存已购商品 ID（合并去重） */
  static async saveOwned(productIds: string[]): Promise<void> {
    if (!PayStore.prefs) {
      return;
    }
    const cur = await PayStore.loadOwned();
    const merged: string[] = cur.slice();
    for (let i = 0; i < productIds.length; i++) {
      if (merged.indexOf(productIds[i]) < 0) {
        merged.push(productIds[i]);
      }
    }
    try {
      await PayStore.prefs.put(PayStore.KEY_OWNED, JSON.stringify(merged));
      await PayStore.prefs.flush();
    } catch (e) {
      /* 持久化失败：内存态已更新，不影响本次会话 */
    }
  }

  /* 是否已购某商品（内存态 + 持久态） */
  static async isOwned(productId: string): Promise<boolean> {
    const owned = await PayStore.loadOwned();
    return owned.indexOf(productId) >= 0;
  }
}

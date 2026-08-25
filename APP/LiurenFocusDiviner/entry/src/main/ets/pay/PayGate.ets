/**
 * PayGate —— 统一付费门禁（业务唯一入口）
 * ----------------------------------------------------------------------------
 * 业务代码只调用：
 *  - isUnlocked(featureId)  → 该功能是否可用（免费模式恒 true）
 *  - requestUnlock(featureId) → 发起购买（免费模式直接成功）
 *  - init(ctx)              → 启动时初始化（读本地已购 + 尝试恢复购买）
 * 内部通过 IapAdapter 调用具体支付实现（华为 IAP / 测试桩），与业务解耦
 * ArkTS 合规：零 any / unknown；显式接口；静态类
 */
import { common } from '@kit.AbilityKit';
import { PayConfig } from './PayConfig';
import type { PayProduct } from './PayConfig';
import { PayStore } from './PayStore';
import { IapAdapterFactory } from './IapAdapter';
import type { IapAdapter, PurchaseResult } from './IapAdapter';

export class PayGate {
  private static adapter: IapAdapter | null = null;
  private static inited: boolean = false;
  private static owned: string[] = [];   /* 已购商品 ID（内存态） */

  /* 启动初始化：读本地已购；付费模式下再尝试恢复购买 */
  static async init(ctx: common.UIAbilityContext): Promise<void> {
    if (PayGate.inited) {
      return;
    }
    PayGate.inited = true;
    await PayStore.init(ctx);
    PayGate.owned = await PayStore.loadOwned();
    PayGate.adapter = IapAdapterFactory.create(PayConfig.isPaidMode());
    if (PayConfig.isPaidMode()) {
      try {
        await PayGate.adapter.init(ctx);
        const restored = await PayGate.adapter.restore();
        if (restored.length > 0) {
          PayGate.owned = PayGate.mergeOwned(PayGate.owned, restored);
          await PayStore.saveOwned(PayGate.owned);
        }
      } catch (e) {
        /* 恢复失败不阻塞：仅本地已购生效 */
      }
    }
  }

  /* 功能是否解锁：免费模式恒 true；付费模式查该功能所属商品是否已购 */
  static isUnlocked(featureId: string): boolean {
    if (!PayConfig.isPaidMode()) {
      return true;
    }
    const p = PayConfig.productOf(featureId);
    if (!p) {
      return true;   /* 未配置商品的功能视为免费 */
    }
    return PayGate.owned.indexOf(p.productId) >= 0;
  }

  /* 发起解锁（购买）：免费模式直接成功；付费模式走适配器 */
  static async requestUnlock(featureId: string): Promise<PurchaseResult> {
    const p = PayConfig.productOf(featureId);
    if (!p) {
      const r: PurchaseResult = { success: true, productId: '', msg: '功能未配置商品，视为免费' };
      return r;
    }
    if (PayGate.owned.indexOf(p.productId) >= 0) {
      const r: PurchaseResult = { success: true, productId: p.productId, msg: '已解锁' };
      return r;
    }
    if (!PayGate.adapter) {
      PayGate.adapter = IapAdapterFactory.create(PayConfig.isPaidMode());
    }
    const res = await PayGate.adapter.purchase(p);
    if (res.success) {
      PayGate.owned = PayGate.mergeOwned(PayGate.owned, [p.productId]);
      await PayStore.saveOwned(PayGate.owned);
    }
    return res;
  }

  /* 当前付费模式（供 UI 显示"解锁"入口） */
  static isPaidMode(): boolean {
    return PayConfig.isPaidMode();
  }

  /* 已购商品（供设置页展示） */
  static ownedList(): string[] {
    return PayGate.owned.slice();
  }

  private static mergeOwned(base: string[], add: string[]): string[] {
    const out: string[] = base.slice();
    for (let i = 0; i < add.length; i++) {
      if (out.indexOf(add[i]) < 0) {
        out.push(add[i]);
      }
    }
    return out;
  }
}

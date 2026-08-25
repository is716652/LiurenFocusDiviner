/**
 * IapAdapter —— 支付适配器接口 + 工厂（解耦核心）
 * ----------------------------------------------------------------------------
 * 业务层只依赖 PayGate，PayGate 内部通过此接口调用具体支付实现：
 *  - HuaweiIap：真实华为 IAP（@kit.IAPKit，上线/沙盒通用）
 *  - DebugIap：测试桩（免费模式/开发期直接成功）
 * 可移植：换支付平台（如 Google Play / 其它商店）只需新增一个 Adapter 实现
 * ArkTS 合规：零 any / unknown；显式接口
 */
import { common } from '@kit.AbilityKit';
import { iap } from '@kit.IAPKit';
import type { PayProduct } from './PayConfig';

/* 购买结果 */
export interface PurchaseResult {
  success: boolean;
  productId: string;
  msg: string;
}

export interface IapAdapter {
  /* 初始化（华为 IAP 需上下文；测试桩直接成功） */
  init(ctx: common.UIAbilityContext): Promise<boolean>;
  /* 查询商品信息 */
  queryProducts(ids: string[]): Promise<PayProduct[]>;
  /* 发起购买 */
  purchase(product: PayProduct): Promise<PurchaseResult>;
  /* 恢复购买（查华为云端已购；测试桩返回本地已购） */
  restore(): Promise<string[]>;
}

/* 工厂：按模式返回适配器（free → DebugIap；paid → HuaweiIap） */
export class IapAdapterFactory {
  static create(isPaid: boolean): IapAdapter {
    if (isPaid) {
      return new HuaweiIap();
    }
    return new DebugIap();
  }
}

/* ---------------- 真实华为 IAP（@kit.IAPKit） ---------------- */
class HuaweiIap implements IapAdapter {
  private ctx: common.UIAbilityContext | null = null;

  async init(ctx: common.UIAbilityContext): Promise<boolean> {
    this.ctx = ctx;
    return true;
  }

  /* 查询商品：返回 AGC 配置的商品（名称/描述/价格来自商店） */
  async queryProducts(ids: string[]): Promise<PayProduct[]> {
    const c = this.ctx;
    if (!c || ids.length === 0) {
      return [];
    }
    try {
      const list = await iap.queryProducts(c, ids);
      const out: PayProduct[] = [];
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        const item: PayProduct = {
          productId: p.id,
          name: p.name,
          desc: p.description,
          price: p.price,
          featureIds: [],
          type: 'non_consumable'
        };
        out.push(item);
      }
      return out;
    } catch (e) {
      return [];
    }
  }

  /* 发起购买（非消耗型一次性买断） */
  async purchase(product: PayProduct): Promise<PurchaseResult> {
    const c = this.ctx;
    if (!c) {
      const r: PurchaseResult = { success: false, productId: product.productId, msg: 'IAP 未初始化' };
      return r;
    }
    try {
      await iap.createPurchase(c, {
        productId: product.productId,
        productType: iap.ProductType.NONCONSUMABLE
      });
      const r: PurchaseResult = { success: true, productId: product.productId, msg: '购买成功' };
      return r;
    } catch (e) {
      const r: PurchaseResult = { success: false, productId: product.productId, msg: '购买失败' };
      return r;
    }
  }

  /* 恢复购买：查询华为云端已购非消耗型商品（零服务器） */
  async restore(): Promise<string[]> {
    const c = this.ctx;
    if (!c) {
      return [];
    }
    try {
      const res = await iap.queryOwnedPurchases(c, {
        productType: iap.ProductType.NONCONSUMABLE
      });
      const owned: string[] = [];
      /* productList = 已购商品 ID 列表（inAppPurchaseDataList 为明细 JSON，恢复用 ID 即可） */
      for (let i = 0; i < res.productList.length; i++) {
        owned.push(res.productList[i]);
      }
      return owned;
    } catch (e) {
      return [];
    }
  }
}

/* ---------------- 测试桩（免费模式 / 开发期全解锁） ---------------- */
class DebugIap implements IapAdapter {
  async init(ctx: common.UIAbilityContext): Promise<boolean> {
    return true;
  }

  async queryProducts(ids: string[]): Promise<PayProduct[]> {
    return [];
  }

  async purchase(product: PayProduct): Promise<PurchaseResult> {
    const r: PurchaseResult = { success: true, productId: product.productId, msg: '测试桩：直接购买成功' };
    return r;
  }

  async restore(): Promise<string[]> {
    return [];
  }
}

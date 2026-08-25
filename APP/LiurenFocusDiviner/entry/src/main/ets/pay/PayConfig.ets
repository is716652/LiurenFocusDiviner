/**
 * PayConfig —— 付费商品清单（单一事实来源，数据驱动）
 * ----------------------------------------------------------------------------
 *  - MODE：'free'（测试/开发期，全功能开放） | 'paid'（上线后走真实购买判断）
 *  - PRODUCTS：商品 = 权益；一个商品解锁多个 featureId（功能 ID）
 *  - 功能 ID 门禁：业务代码只调用 PayGate.isUnlocked(featureId)，改配置不动代码
 * 可移植：此文件是唯一需要按 APP 调整的地方（商品 ID 与 AppGallery 控制台一致）
 * ArkTS 合规：零 any / unknown；显式接口；静态类
 */
export interface PayProduct {
  productId: string;      /* AppGallery Connect 控制台配置的商品 ID */
  name: string;           /* 展示名 */
  desc: string;           /* 描述 */
  price: string;          /* 展示价（实际以商店为准） */
  featureIds: string[];   /* 解锁的功能 ID 列表 */
  type: string;           /* 'non_consumable' 一次性买断 */
}

export class PayConfig {
  /* ★ 收费开关：'free'（全功能开放/测试） | 'paid'（走真实购买判断；沙盒/上线测试用）
     当前切 'free'（临时）：测试中黄等功能直接用（isUnlocked 恒 true，付费区全显示）
     上线收费版前切回 'paid' + 关联商品
     注意：免费版（LiurenFocusDivinerFree）保持 'free' + PREVIEW_FREE=true */
  static readonly MODE: string = 'free';

  /* ★ 版本形态开关（双版本同源码，仅此开关不同）：
     true  = 免费上架版：付费区（毕法教练/年命适配/行年/抓用神深度）整体隐藏，界面无任何付费痕迹
     false = 开发/收费版：付费区显示（开发期测试用；上线收费版后与 MODE='paid' 配合） */
  static readonly PREVIEW_FREE: boolean = false;

  /* 已预埋的功能 ID（业务侧门禁） */
  static readonly F_YONGSHEN: string = 'yongshen_advanced';   /* 抓用神深度（话术生成+图卡） */
  static readonly F_BIFA: string = 'bifa_coach';              /* 毕法教练（组合断+建议） */
  static readonly F_ZHONGHUANG: string = 'zhonghuang_engine'; /* 中黄五变经引擎 */

  /* 商品清单（与 AppGallery Connect 控制台一致；后续新增在此追加） */
  static readonly PRODUCTS: PayProduct[] = [
    {
      productId: 'liuren_pro_full',
      name: '六壬研习内容解锁',
      desc: '解锁古籍法诀对照与研习辅助内容（抓用神 · 毕法 · 中黄）',
      price: '29.9',
      featureIds: [PayConfig.F_YONGSHEN, PayConfig.F_BIFA, PayConfig.F_ZHONGHUANG],
      type: 'non_consumable'
    }
  ];

  /* 是否付费模式（true=走真实购买判断；false=全功能开放） */
  static isPaidMode(): boolean {
    return PayConfig.MODE === 'paid';
  }

  /* 付费区是否可见：免费上架版隐藏（无任何付费痕迹）；开发/收费版显示 */
  static paidVisible(): boolean {
    return !PayConfig.PREVIEW_FREE;
  }

  /* 按功能 ID 找对应商品（无则 null） */
  static productOf(featureId: string): PayProduct | null {
    for (let i = 0; i < PayConfig.PRODUCTS.length; i++) {
      const p = PayConfig.PRODUCTS[i];
      for (let j = 0; j < p.featureIds.length; j++) {
        if (p.featureIds[j] === featureId) {
          return p;
        }
      }
    }
    return null;
  }
}

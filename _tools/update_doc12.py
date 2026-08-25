# -*- coding: utf-8 -*-
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\core\核心解耦与鸿蒙移植说明.md"
t = io.open(p, encoding="utf-8").read()

anchor = "## 八、待扩展\n"
addition = """✅ **第十二批：付费架构骨架（解耦门禁 + 测试桩）**（BUILD SUCCESSFUL 0 ERROR 0 WARN）
- **方案文档**：`鸿蒙规范文档/大六壬付费架构方案.md` —— 一次性买断制；业务只调 `PayGate.isUnlocked(featureId)`；恢复购买用华为 `obtainOwnedPurchases`（华为账号云端，零服务器零用户信息）；`pay/` 目录零业务依赖可移植多 APP；含「功能价值与收费设计」章节（中黄引擎/抓用神话术图卡/毕法教练）
- **骨架实现**（`entry/src/main/ets/pay/`，ArkTS 合规）：
  - `PayConfig.ets`：MODE 开关（free/paid）+ 商品清单（数据驱动）+ 预埋功能 ID（`yongshen_advanced`/`bifa_coach`/`zhonghuang_engine`）
  - `PayGate.ets`：统一门禁（`isUnlocked`/`requestUnlock`/`init`）；免费模式恒 true，付费模式查已购+恢复
  - `PayStore.ets`：本地持久化（Preferences，已购 productId 合并去重）
  - `IapAdapter.ets`：适配器接口 + 工厂（HuaweiIap 占位 / DebugIap 测试桩）
- **业务接入示例**：Splash 启动 `PayGate.init`；Index 毕法区接入 `bifa_coach` 门禁（付费未解锁显示 🔒 解锁入口）
- **当前 MODE=free**：全功能开放，测试不受影响；上线前在 AppGallery Connect 配商品后切 paid
- **后续**：接 HuaweiIap（@kit.IAPKit）真机沙盒验证；毕法/抓用神/中黄三块深度功能（话术生成/组合断/经文引擎）按 featureId 逐步落地

## 八、待扩展
"""
if anchor in t:
    t = t.replace(anchor, addition)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK doc")
else:
    print("MISS anchor")

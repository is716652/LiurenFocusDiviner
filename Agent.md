# Agent.md —— LargeLiuRen-Design 项目交接与实施手册

> 写给后续 AI / 开发者：先读这份，再动代码。  
> 最近更新：2026-08-27  
> 当前主线 Git HEAD：`eafc71e feat(gallery): 案例按来源日课分组并支持占类筛选`

---

## 1. 项目定位

这是一个 **HarmonyOS 大六壬研习 App** 工程，核心目标：

- 免费版：完整开放、零权限、无联网、无 IAP 痕迹、无“锁定/会员/解锁”诱导。
- 付费版（以后）：只能做 **新增增量**，**绝不锁免费版已有功能**。
- 内容方向：从“起盘工具”升级为“古籍案例研读库”：不是给几句断语，而是还原古人如何由课传证据推出断语。

当前重点：

- 免费版已审核通过，**定时 2026-09-05 上架**。
- 已审核包是旧包，**不含当前 main 的状态栏修复、合规降级、案例库扩充**。
- 审核意见要求下个版本修复状态栏遮挡；该修复已在 main 完成。

---

## 2. 硬纪律（必须遵守）

1. **9月5日定时上架包不要动**
   - 不撤回、不重提、不换包、不改后台版本信息。
   - 当前仓库所有新改动都进入“下一版本”。

2. **版本号不要随手 bump**
   - 当前：`versionName=1.0.1` / `versionCode=1000001`。
   - 只有商店后台明确要求新一轮提审时，才统一升 `versionCode`。

3. **免费版由脚本生成，不手改免费版当源头**
   - 主版源头：`APP/LiurenFocusDiviner`
   - 免费版生成：`python _tools/sync_free_edition.py`
   - 免费版校验：`python _tools/verify_free_edition.py`

4. **合规口径**
   - 确定性断语统一降级为：`古籍云 / 古籍谓 / 按九宗门法 / 传统文化研习参考`。
   - 医疗、法律、投资、仕途、生死内容必须带“非现实判断/非医疗法律投资建议”。
   - 免费版不得出现 `付费/解锁/会员/VIP/价格/购买` 等可见字样。

5. **古籍案例入库原则**
   - 先用核心排盘复算，再写 `expect`。
   - `expect` 强校验以程序可复核项为主：四课、三传、遁干、旬空、旺衰、月令、宗门、中黄。
   - 天将 `chuanJiang` 只在传本与程序一致时强校验。
   - 传本与程序不一致时，不强合，写入“存疑对读”。

---

## 3. 目录结构与职责

### 根目录

- `core/liuren-core.ts`：大六壬核心 TypeScript 源。
- `core/liuren-core.js`：由 TS 编译出的 JS，用于 Node 测试与参考。
- `_tests/`：核心与案例反验脚本。
- `_tools/`：免费版生成/校验等工程脚本。
- `鸿蒙规范文档/`：合规、上架、文案落地记录。
- `大六壬文档/壬占汇选/`：古籍源文档与提取笔记。
- `APP/`：HarmonyOS 工程。

### APP 目录

- `APP/LiurenFocusDiviner/`：主版（含古籍案例鉴赏入口；未来收费研习内容在这里先做）。
- `APP/LiurenFocusDivinerFree/`：免费版生成产物；**不要手改**。

关键文件：

- `APP/LiurenFocusDiviner/entry/src/main/ets/model/LiurenCore.ets`：ArkTS 核心，应与 `core/liuren-core.js` 保持同步。
- `APP/LiurenFocusDiviner/entry/src/main/ets/model/DataLoader.ets`：数据结构与 rawfile 加载。
- `APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/ancient/case_gallery.json`：古籍案例库。
- `APP/LiurenFocusDiviner/entry/src/main/ets/components/AncientCaseGallery.ets`：案例鉴赏 UI。
- `APP/LiurenFocusDiviner/entry/src/main/ets/pages/Ancient.ets`：古籍页（经文 + 案例鉴赏）。
- `APP/LiurenFocusDiviner/entry/src/main/ets/entryability/EntryAbility.ets`：窗口全屏/安全区设置。
- `APP/LiurenFocusDiviner/entry/src/main/ets/FeatureFlags.ets`：免费版隐藏案例鉴赏入口。

### 古籍文档目录

- `大六壬文档/壬占汇选/甲子日.docx`
- `大六壬文档/壬占汇选/甲子日_提取笔记.md`
- `大六壬文档/壬占汇选/乙丑日.docx`
- `大六壬文档/壬占汇选/乙丑日_提取笔记.md`
- `大六壬文档/壬占汇选/丙寅日.docx`
- `大六壬文档/壬占汇选/丙寅日_提取笔记.md`

提取笔记作用：记录可入库案例、OCR 风险、需校勘案例、已入库记录。

---

## 4. Git 情况

- 远程：`git@github.com:is716652/LiurenFocusDiviner.git`
- 分支：`main`
- 当前 HEAD：`eafc71e`
- 当前工作区在写本文档前是干净的（`main...origin/main`）。

最近关键提交线：

- `4910108` 徐次宾案断语证据链与古籍研读配色样板
- `dde2523` 邵占省试006证据链样板
- `8b2217f` 壬占汇选四案补证据链
- `f466687` 证据链可点击并联动盘例高亮
- `fe47e85` 甲子日002/004/005入库
- `28fcd0a` 案例详情返回先回列表页
- `9211b9c` 乙丑日021/022/024入库
- `fe7e806` 乙丑日028/030/031入库
- `b5365a6` 丙寅日035/038/039/044入库
- `eafc71e` 案例按来源日课分组并支持占类筛选

---

## 5. 上线与审核情况

### 已审核包

- 免费版已审核通过。
- 设置了 **2026-09-05 定时上架**。
- 审核意见：
  1. 通过；
  2. 存在状态栏适配显示问题，要求下个版本修复；
  3. 测试环境 HarmonyOS 6.1 / API 6.1.0(23)，控件坐标 `[[123,65,233,125]]`。

### 重要事实

- 这个审核通过包是旧包，**不包含当前 main 的状态栏修复**。
- 当前 main 已修：
  - `EntryAbility.ets`：`win.setWindowLayoutFullScreen(false);`
  - 页面根背景 `#14120F`
  - 页面底部安全区：`expandSafeArea([SafeAreaType.SYSTEM], [SafeAreaEdge.BOTTOM])`
  - 不再整页吃顶部安全区。

### 9月5日前后动作

- 9月5日前：不动已审核包。
- 9月5日后：
  1. 真机验证线上版状态栏遮挡；
  2. 确认线上版就是旧包；
  3. 用当前 main 打下一版；
  4. 更新说明写“修复 HarmonyOS 6.1 状态栏遮挡”。

---

## 6. 免费版 / 收费版策略

### 免费版

必须保持：

- `PayConfig.MODE='free'`
- 无 `requestPermissions`
- 无 `INTERNET`
- 无可见锁 UI；免费版 `PayGate.isUnlocked()` 视为 true
- 隐藏案例鉴赏入口：`FeatureFlags.SHOW_ANCIENT_CASE_GALLERY=false`
- 无 `permission_internet_reason`

当前实现允许案例代码/数据随免费版打包，但入口隐藏；校验脚本只保证“入口隐藏 + 零权限 + 无 IAP 残留”。

### 收费版（以后）

原则：

- 只做新增增量；
- 不锁免费已有功能；
- 古籍案例鉴赏库可作为收费研习内容；
- 付费页/购买态等免费版正式上线稳定后再做。

---

## 7. 古籍案例库当前进展

案例数据：`case_gallery.json` 当前 **24 案**。

结构演进：

- 最初：原文 + summary + chain + expect。
- 现在：增加 `routes / focus / reasoning / topics`。
- UI 已支持：
  - 来源/日课分组；
  - 占类筛选；
  - 古籍研读配色；
  - 证据链；
  - 点证据回盘高亮；
  - 详情返回先回列表。

### 已具备证据链的案例（19 案）

- 徐次宾占来意 `xu_cibin_laiyi_jiazi`
- 甲子日：006 / 011 / 013 / 016 / 017 / 002 / 004 / 005
- 乙丑日：021 / 022 / 024 / 028 / 030 / 031
- 丙寅日：035 / 038 / 039 / 044

### 中黄五变经 5 案

- 已有 expect，可展示盘例；
- 尚未全面补 `reasoning` 证据链。

### 分类体系

`topics` 词表现有：

`来意 / 疾病 / 官讼 / 行人 / 仕宦 / 生产 / 风水 / 应候 / 役事 / 终身 / 省试 / 会试 / 流年 / 前程 / 己身 / 复建 / 亡盗 / 远行 / 索债 / 赴任 / 复任 / 补官 / 六甲`

来源分组规则当前在 UI 内推导：

- source 含“中黄五变经” → 中黄五变经
- id/title/chapter 指向甲子/乙丑/丙寅 → 对应日课分组

---

## 8. 已讨论并确认的关键点

1. 案例鉴赏不是“结果展示”，而是“证据链研读”。
2. 每个案例应有自己的天地盘/四课三传图例；后续可扩展中黄天干盘、抓用神动态三传图例、毕法联动。
3. 古籍案例区配色应区别于主界面：宣纸/墨/朱砂/藏青；链路色签：
   - 中黄靛青
   - 读象朱砂
   - 抓用神青绿
   - 毕法赭石
4. 证据链允许“存疑不强合”，尤其是传本天将、行年、旺衰口径不一致时。
5. 免费版先上架，付费版后置；付费只加增量。
6. 9月5日上线包不可动，所有修复进入下一版。

---

## 9. 工程命令

### 核心编译

```powershell
npx tsc core/liuren-core.ts --target ES2017 --module commonjs --strict --noImplicitAny
```

### 案例反验

```powershell
node _tests/_test_ancient_gallery.js
```

### 免费版同步与校验

```powershell
python _tools/sync_free_edition.py
python _tools/verify_free_edition.py
```

### 构建

```powershell
D:\HarmonyOS\command-line-tools-6.1.1-release\bin\hvigorw.bat assembleHap --mode module -p product=default --no-daemon
```

主版工作目录：`APP/LiurenFocusDiviner`  
免费版工作目录：`APP/LiurenFocusDivinerFree`

---

## 10. 常见坑

1. **Nutstore 同步导致写入冲突**
   - 报错：`ReplaceFileW EIO (Win32 1175)` 或 “file changed since it was read”。
   - 处理：等待 1–2 秒 → 重新 read → 再 edit。
   - 不要并行改同一个文件。

2. **ArkTS 严格模式**
   - 禁止 any/unknown。
   - `ForEach` 回调最好显式写类型。
   - 中文 key 可点访问，但接口要先定义。

3. **核心字段名**
   - JS 核心里是 `c.kegs`，不是 `c.sike`。
   - 三传项是 `{ z, gz }`，天将要经 `jiangMap[gongOf(tp,z)]` 反查。

4. **案例 input 字段**
   - 必须是 `mj/dg/dz/hour`，月份用 `monthZhi`。
   - 不要写成 `yueJiang/dayGan/dayZhi/mz`。

5. **免费版**
   - 免费版是生成产物，任何改动必须先改主版，再跑 sync/verify。

---

## 11. 下一步实施建议

优先级从高到低：

1. **丙寅第二批入库**：041 / 042 / 045  
   先做提取与程序复算，再写 `expect + reasoning`。

2. **中黄五变经 5 案补证据链**  
   让“中黄链路”不再只有参数卡，而能讲清“时干→变干→落宫→是否入传”。

3. **案例详情 UI 精化**
   - 中黄链路：中黄天干盘；
   - 抓用神链路：动态三传盘；
   - 毕法链路：命中毕法条目联动；
   - 证据链按 route 过滤。

4. **9月5日后的下一版**
   - 真机回归线上旧包；
   - 当前 main 打下一版；
   - 更新说明突出状态栏修复；
   - 免费版继续隐藏案例鉴赏入口。

5. **付费版准备**
   - 只在免费版正式上线稳定后开始；
   - 付费内容定位为“古籍研读库增量”，不做功能锁。

---

## 12. 给后续 AI 的操作建议

- 先跑：`node _tests/_test_ancient_gallery.js`
- 改案例后必跑：反验 → 免费同步 → 免费校验 → 主版构建 → 免费版构建 → commit/push。
- 写古籍案例时：先程序复算，再写断语解释；不要先信 OCR。
- 遇到传本不一致：宁可写“存疑对读”，不要硬改引擎去迎合 OCR。
- 任何涉及医疗/法律/投资/仕途/生死的文本，都加非建议口径。

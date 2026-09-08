# Agent.md —— LargeLiuRen-Design 项目交接与实施手册

> 写给后续 AI / 开发者：先读这份，再动代码。  
> 最近更新：2026-09-05  
> 本文档更新前 main HEAD：`79e9ca2 docs(store): 修正免费版中黄可见边界`

---

## 1. 项目定位

这是一个 **HarmonyOS 大六壬研习 App** 工程，核心目标：

- 免费版：完整开放、零权限、无联网、无 IAP 痕迹、无“锁定/会员/解锁”诱导。
- 付费版（以后）：只能做 **新增增量**，**绝不锁免费版已有功能**。
- 内容方向：从“起盘工具”升级为“古籍案例研读库”：不是给几句断语，而是还原古人如何由课传证据推出断语。

当前重点：

- 免费版已上架（用户反馈：早上 10 点多定时上架，初期零下载属正常）。
- 已上架商店素材先不动；新截图只作下一版备用，不重新提交。
- 主线最近在做：中黄天地盘 UX v1（常遁/中黄、双干同宫、身/变/传、点宫宫情）。

---

## 2. 硬纪律（必须遵守）

1. **已上架包与商店资料不要动**
   - 不撤回、不重提、不换包、不改后台版本信息。
   - 已上架 8 张截图继续使用；新处理截图仅归档备用。
   - 商店素材变更也可能触发资料审核；无必要不提交。

2. **版本号不要随手 bump**
   - 当前记录：`versionName=1.0.1` / `versionCode=1000001`。
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

## 3. 免费版 / 收费版边界（已修正）

### 免费版当前真实策略

以 `_tools/sync_free_edition.py` 为准：

- `PayConfig.MODE='free'`
- 免费版同步后 `PREVIEW_FREE=false`：**全功能开放、无锁、无付费痕迹**
- 免费版同步后 `SHOW_ANCIENT_CASE_GALLERY=false`：**只隐藏古籍案例鉴赏入口**
- 无 `requestPermissions`
- 无 `INTERNET`
- 无 `permission_internet_reason`
- 无可见锁 UI；免费版 `PayGate.isUnlocked()` 视为 true

重要修正：

- **中黄开关、常遁/中黄、身/变/传、古籍研习不是免费版禁用项**。只要当前免费包真实可见，商店图可以如实展示。
- 免费版不能展示：古籍案例鉴赏入口、证据链/异断对读等未开放内容、任何付费暗示。

### 收费版（以后）

原则：

- 只做新增增量；
- 不锁免费已有功能；
- 若中黄/抓用神/毕法等在免费版已开放，付费版不得回收；
- 付费增量优先方向：古籍案例鉴赏、证据链、异断对读、共识带；
- 付费页/购买态等免费版正式上线稳定后再做。

---

## 4. 目录结构与职责

### 根目录

- `core/liuren-core.ts`：大六壬核心 TypeScript 源。
- `core/liuren-core.js`：由 TS 编译出的 JS，用于 Node 测试与参考。
- `_tests/`：核心与案例反验脚本。
- `_tools/`：免费版生成/校验等工程脚本。
- `鸿蒙规范文档/`：合规、上架、文案落地记录。
- `大六壬文档/壬占汇选/`：古籍源文档与提取笔记。
- `大六壬文档/中黄五变经/`：中黄经文、研读整理、算法笔记。
- `APP/`：HarmonyOS 工程。

### APP 目录

- `APP/LiurenFocusDiviner/`：主版（含古籍案例鉴赏入口；未来收费研习内容在这里先做）。
- `APP/LiurenFocusDivinerFree/`：免费版生成产物；**不要手改**。

关键文件：

- `APP/LiurenFocusDiviner/entry/src/main/ets/model/LiurenCore.ets`：ArkTS 核心，应与 `core/liuren-core.js` 保持同步。
- `APP/LiurenFocusDiviner/entry/src/main/ets/model/DataLoader.ets`：数据结构与 rawfile 加载。
- `APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/ancient/case_gallery.json`：古籍案例库（当前 **45 案**）。
- `APP/LiurenFocusDiviner/entry/src/main/ets/components/PanDisk.ets`：天地盘绘制（含中黄双干/身变传）。
- `APP/LiurenFocusDiviner/entry/src/main/ets/pages/Index.ets`：主排盘页（含中黄宫情条）。
- `APP/LiurenFocusDiviner/entry/src/main/ets/components/AncientCaseGallery.ets`：案例鉴赏 UI。
- `APP/LiurenFocusDiviner/entry/src/main/ets/components/YongShenSheet.ets`：抓用神弹层（迷你盘后续只标变干）。
- `APP/LiurenFocusDiviner/entry/src/main/ets/components/AncientStudy.ets`：古籍文本盘（保持原文，后续只加今盘对照）。
- `APP/LiurenFocusDiviner/entry/src/main/ets/entryability/EntryAbility.ets`：窗口全屏/安全区设置。
- `APP/LiurenFocusDiviner/entry/src/main/ets/FeatureFlags.ets`：免费版隐藏案例鉴赏入口。

---

## 5. Git 情况

- 远程：`git@github.com:is716652/LiurenFocusDiviner.git`
- 分支：`main`
- 本文档更新前 HEAD：`79e9ca2`

最近关键提交线：

- `eafc71e` 案例按来源日课分组并支持占类筛选
- `734aba1` 壬占汇选戊辰日入库（安全 tag 前）
- `a33123a` 正名常遁/中黄并修变干乘将与参证口吻
- `1741e15` 主天地盘中黄双干同宫与身变传宫情
- `e114f9b` 中黄身变传分色并加图例说明
- `726b7a3` 拉开中黄变传标记间距
- `30baa52` 下一版商店页文案与截图清单
- `79e9ca2` 修正免费版中黄可见边界

安全回退点：

- tag：`pre-zhonghuang-pandisk-20260828` at `734aba1`
- 如需回退主盘 v1：`git reset --hard pre-zhonghuang-pandisk-20260828`（untracked 文件不受影响）

注意：工作区常有大量 untracked 的 `大六壬文档/古籍原文-易藏-术数/**` 文本，UI 提交不要误加。

---

## 6. 中黄天地盘 UX v1（已落地）

原则：中黄不能替换传统排法；地支仍是骨架，天干是中黄生克判官。

已实现：

- 主盘模式：`常遁 / 中黄`；默认常遁干净，无身/变/传。
- 中黄开时：双干同宫；常遁弱显，中黄小字金显；两干相同不重复。
- 变干常显，余宫弱显；点宫看详情。
- 身/变/传只在切到中黄后出现：
  - `身` = 日干寄宫，青灰 `#9FB6A8`
  - `变` = 占时/变干宫，亮金 `#F0D98C`
  - `传` = 变干入三传，橙金 `#D98C5F`
- 中黄开时盘下方有图例：`身 日干寄宫 / 变 变干宫 / 传 变干入传`。
- 点盘交互分流：
  - 常遁：点盘 = 外应取用；
  - 中黄：点盘 = 看宫情，不切用神。
- 宫情条内容：地盘宫/天盘支/天将/常遁干/中黄干/中黄六亲/身/变/传/空亡/建合/神煞。
- 起新盘、古籍速排、切回常遁时清空 `zhongGong`。

相关测试：

```powershell
node _tests/_test_zhonghuang.js
node _tests/_test_zhonghuang_analyze.js
```

中黄口径：

- `变干 = 时干遁盘中占时支之干`。
- `bianJiang = c.jiangMap[hourZhi]`，不要用天干反查地支将。
- “旬”只用于旬空/旬首，不作为第三种盘面天干模式；遁干口径统一为 `常遁 / 中黄`。

---

## 7. 商店页与截图节奏（已确认）

### 当前节奏

```text
现在：
不动已上架截图。
不重截。
不重新提交商店资料。
先看 3~7 天数据。
```

### 下一版资料更新原则

不是“见中黄就换”，而是只换：

- 旧“旬/日遁/时遁”口径；
- 古籍案例鉴赏入口；
- 过满年命/行年现实建议话术；
- 任何付费/解锁暗示；
- 与当前免费包不一致的内容。

中黄/常遁/身变传/古籍研习若免费包真实可见，可保留。

### 已上架截图

- 路径：`APP/screenshots_out/免费版已经上架的截图`
- 尺寸：`1080x1920`，webp/png 双份。
- 当前结论：继续用，不动。

### 新截图备用稿

用户新截原始图：

```text
APP/screenshots_out/免费版下一版 2026-9-5
```

已处理出两套过程稿 + 一套最终备用稿：

- `processed_1080x1920`：对齐旧比例，但长屏有裁切，过程稿。
- `processed_1080x2160_fullapp`：保完整 app 内容，备用参考。
- `final_1080x1920_webp`：按已上架 webp 尺寸 `1080x1920` 输出，含 `shot01.webp~shot08.webp` 与 png；当前只归档，不上传。

处理规则：去顶部状态栏（微信/时间/信号/电池）、去底部手势条；`shot03` 为保天地盘完整，顶部大标题让位。

---

## 8. 古籍案例库当前进展

案例数据：`case_gallery.json` 当前 **45 案**。

来源/分组包括：

- 中黄五变经
- 六壬断案
- 壬占汇选·甲子日 / 乙丑日 / 丙寅日 / 丁卯日 / 戊辰日

结构演进：

- 最初：原文 + summary + chain + expect。
- 现在：增加 `routes / focus / reasoning / topics / mark / key / role`。
- UI 已支持：来源/日课分组、占类筛选、证据链、点证据回盘高亮、详情返回先回列表。

### topics 词表

`来意 / 疾病 / 官讼 / 行人 / 仕宦 / 生产 / 风水 / 应候 / 役事 / 终身 / 省试 / 会试 / 流年 / 前程 / 己身 / 复建 / 亡盗 / 远行 / 索债 / 赴任 / 复任 / 补官 / 六甲`

### validator 注意

- `_tests/_test_ancient_gallery.js` 与 `DataLoader.ets` 的 input 键是 `yearGan/yearZhi`；旧笔记里的 `yg/yz` 已过时。
- 反验命令：`node _tests/_test_ancient_gallery.js`，当前应 `ALL PASS (45 cases)`。

### 待精修

- 中黄五变经 5 案：`zhonghuang_c1_shen_body / c8_1 / c10_5 / c12_1 / c14_1` 还缺完整 `reasoning`（route 应用 `zhonghuang`）。
- 释己身第一参证思路：丙寄巳 → 巳上申 → 申干不克丙 → 三传不克日 → 变干壬官鬼落戌旬空不入传，只作参证。
- 非中黄源案例：中黄只作旁证，不压主断。

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
   - 处理：等待几秒 → 重新 read → 再 edit。
   - 不要并行改同一个文件。

2. **ArkTS 严格模式**
   - 禁止 any/unknown。
   - `ForEach` 回调最好显式写类型。
   - 中文 key 可点访问，但接口要先定义。

3. **核心字段名**
   - JS 核心里是 `c.kegs`，不是 `c.sike`。
   - 三传项是 `{ z, gz }`，天将要经 `jiangMap[gongOf(tp,z)]` 反查。

4. **案例 input 字段**
   - 必须是 `mj/dg/dz/hour`，月份用 `monthZhi`；可选年干支用 `yearGan/yearZhi`。
   - 不要写成 `yueJiang/dayGan/dayZhi/mz/yg/yz`。

5. **免费版**
   - 免费版是生成产物，任何改动必须先改主版，再跑 sync/verify。
   - 免费版当前不是“隐藏中黄”，而是“全功能开放无锁，只隐藏案例鉴赏入口”。

6. **构建命令**
   - 项目内没有本地 `hvigorw.bat`，必须用全路径：`D:\HarmonyOS\command-line-tools-6.1.1-release\bin\hvigorw.bat`。

---

## 11. 下一步实施建议

优先级从高到低：

1. **商店观察期（3~7 天）**
   - 不动已上架截图/文案/包；
   - 只看曝光、详情页访问、下载、投诉/驳回；
   - 新截图继续归档备用。

2. **中黄 UX 精修**
   - 真机看双干同宫、身/变/传密度；
   - 迷你天地盘：只标变干 + 一句说明；
   - 古籍文本盘：原文不动，后续只加今盘对照；
   - 案例详情后续再考虑中黄开关/宫情。

3. **中黄 5 案补 reasoning**
   - route 用 `zhonghuang`；
   - 讲清：时干 → 变干 → 落宫 → 六亲 → 是否入传/落空/有气/制化；
   - 语气保持参证，不单独定凶。

4. **继续案例入库**
   - 延续“用户找源/选源，助手 OCR 转写、写提取笔记、复算、入库、跑 validator”的节奏；
   - 《壬占汇选》更多日课；
   - 易藏其他书只作后续 mining，UI 提交不要带入 untracked 文本。

5. **付费版准备**
   - 只在免费版正式上线稳定后开始；
   - 付费内容定位为“古籍案例研读库增量”，不做功能锁；
   - 商品/IAP 真机与沙盒流程最后再接。

---

## 12. 给后续 AI 的操作建议

- 先跑：`node _tests/_test_ancient_gallery.js`
- 改案例后必跑：反验 → 免费同步 → 免费校验 → 主版构建 → 免费版构建 → commit/push。
- 改中黄/盘后必跑：`node _tests/_test_zhonghuang.js`、`node _tests/_test_zhonghuang_analyze.js`，并构建主/免费 HAP。
- 写古籍案例时：先程序复算，再写断语解释；不要先信 OCR。
- 遇到传本不一致：宁可写“存疑对读”，不要硬改引擎去迎合 OCR。
- 任何涉及医疗/法律/投资/仕途/生死的文本，都加非建议口径。
- 商店素材：默认不动；要动先确认是否真有必要，且只更新资料，不碰包和版本号。

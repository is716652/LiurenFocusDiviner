# Agent.md —— LargeLiuRen Design 项目交接与实施手册

> 写给后续 AI / 开发者：先读这份，再动代码。  
> 最近更新：2026-09-10  
> 本文档更新前 main HEAD：`621e2be feat(gallery): 中黄五变经 5 案补全 reasoning 证据链`

---

## 1. 项目定位

这是一个 **HarmonyOS 大六壬研习 App** 工程，核心目标：

- 免费版：完整开放、零权限、无联网、无 IAP 痕迹、无“锁定/会员/解锁”诱导。
- 付费版（以后）：只能做 **新增增量**，**绝不锁免费版已有功能**。
- 内容方向：从“起盘工具”升级为“古籍案例研读库”：不是给几句断语，而是还原古人如何由课传证据推出断语。

当前重点：

- 免费版已上架（2026-09-05 早上定时上架，初期零下载属正常）。
- 已上架商店素材先不动；新截图只作下一版备用，不重新提交。
- 主线最近在做：中黄天地盘 UX v1（常遁/中黄、双干同宫、身/变/传、点宫宫情）。

发布包位置（2026-09-10 更新）：

- **在架版（1.0.1 / 1000001）**：已归档为 `APP/release_pkg/LiurenFocusDiviner-free-release-signed-1.0.1-onshelf-20260826.app`
  （与原 `…-free-release-signed.app` 字节一致，构建于 2026-08-26 20:47，约对应 `46a5ea9`/`84b755e` 时点）。
  商店在架版**没有中黄、没有案例鉴赏**，且含本轮修正前的天将/昴星/遁干问题。
- **待提审版（1.0.2 / 1000002）**：`APP/release_pkg/LiurenFocusDiviner-free-release-signed.app`（1,565,831 字节，2026-09-10 构建，
  `verify-app` 签名校验通过；包内 versionName=1.0.2、versionCode=1000002、requestPermissions=0）。
  相对 1.0.1 的增量：十二天将顺逆修正、柔日昴星取用修正、三传/盘面天干改旬遁（空亡可见）、中黄 UX v1、状态栏/导航适配、合规断语降级。
- 提审与否待真机验证后决定；**未动商店素材、未上传管理台**。
- 案例鉴赏在两版免费包中都隐藏（`FeatureFlags.SHOW_ANCIENT_CASE_GALLERY=false`）；案例库 45 案与证据链升级只影响主版。

---

## 2. 硬纪律（必须遵守）

1. **已上架包与商店资料不要动**
   - 不撤回、不重提、不换包、不改后台版本信息。
   - 已上架 8 张截图继续使用；新处理截图仅归档备用。
   - 商店素材变更也可能触发资料审核；无必要不提交。

2. **版本号（2026-09-10 起）**
   - 当前记录：`versionName=1.0.2` / `versionCode=1000002`（因算法修正升版，用户确认后执行）。
   - 上一版：`1.0.1` / `1000001`（在架）。除发版外不要随手 bump；升版只在主版 `AppScope/app.json5` 改，免费版由 sync 脚本生成。

3. **免费版由脚本生成，不手改免费版当源头**
   - 主版源头：`APP/LiurenFocusDiviner`
   - 免费版生成：`python _tools/sync_free_edition.py`
   - 免费版校验：`python _tools/verify_free_edition.py`

4. **合规口径**
   - 确定性断语统一降级为：`古籍云 / 古籍谓 / 按九宗门法 / 传统文化研习参考`。
   - 医疗、法律、投资、仕途、生死内容必须带“非现实判断/非医疗法律投资建议”。
   - 免费版不得出现 `付费/解锁/会员/VIP/价格/购买` 等可见字样。

5. **遁干口径（2026-09-10 起）**
   - 三传/盘面天干**默认「旬遁」**（传统层）；旬外二支为旬空、本旬无干 → **留空**，由三传卡打「空」标；
   - 中黄模式另起「时干遁」（中黄·用，用于判断的那一套）上盘；日干遁(体)用于天将基准与今日建合，见点宫宫情条与建合检测；
   - 依据：《六壬集成五要权衡·遁干》「须用旬遁……旬遁方有空亡……若用时遁无空亡」；
   - 案例库 `expect.chuanGz` 默认按旬遁校验，个案可用 `dunKouJing: "rigan"` 声明按日干遁（如中黄经文13）。

6. **古籍案例入库原则**
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

### 安装与共存（2026-09-10 确认）

- 两个工程 `bundleName` 相同（`cn.is716652.LiurenFocusDiviner`）：**同机不能共存，后装覆盖先装**；商店视角是同一应用走版本升级。
- 用户自己手机装的是**主版**（通过 DevEco 手动安装，无需 hdc 代劳）；想对比免费版效果时自行换装即可，切换成本低。
- 免费/收费的唯一分界目前是 `FeatureFlags.SHOW_ANCIENT_CASE_GALLERY` 编译期常量；将来接 IAP 时把它换成购买态决定，路径已预留。
- 本机工具链：hdc 在 `D:\HarmonyOS\command-line-tools-6.1.1-release\sdk\default\openharmony\toolchains\hdc.exe`，可用于装包/截图/日志；但用户优先 DevEco 手动安装。

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
- `APP/LiurenFocusDiviner/entry/src/main/ets/components/PanDisk.ets`：天地盘绘制（中圈单干：旬遁/时干遁；含身/变/传标记）。
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
- 本文档更新前 HEAD：`621e2be`

最近关键提交线：

- `621e2be` 中黄五变经 5 案补全 reasoning 证据链
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

- 主盘模式：`旬遁 / 中黄`；默认**旬遁（传统层）**干净，无身/变/传（旧称「常遁」＝中黄·日干遁，现只在中黄模式内作为「体」层出现）。
- 中黄开时：中圈改为**单干＝时干遁**（中黄·用）；日干遁(体)不再并排上盘，改由宫情条与建合检测呈现（依据见§11.5）。
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

- ~~中黄五变经 5 案 reasoning~~ 已完成（`621e2be`，route 用 `zhonghuang`，参证口吻）。
- 释己身第一参证思路：丙寄巳 → 巳上申 → 申干不克丙 → 三传不克日 → 变干壬官鬼落戌旬空不入传，只作参证。
- 非中黄源案例：中黄只作旁证，不压主断。

---

## 9. 工程命令

### 核心编译（真源 → 产物）

`core/liuren-core.ts` 是**真源**（ArkTS 兼容子集，无 import/export 的全局脚本）；
`core/liuren-core.js` 由它经 tsc 产出，供 Node 测试与 Web 端加载；`LiurenCore.ets` 是 ArkTS 端口（手工同构）。

```powershell
# 改完真源后必须重编译产物，否则测试跑的仍是旧逻辑
npx tsc core/liuren-core.ts --target ES2017 --module commonjs --strict --noImplicitAny
node --check core/liuren-core.js
# 再手工把同一改动同步到 APP/LiurenFocusDiviner/entry/src/main/ets/model/LiurenCore.ets
```

三份实现（.ts / .js / .ets）关键点抽查：`JIANG_NI` 应为 0、`buildJiang`/`xunDun`/`maoxingFirst` 应齐全。

### 案例反验

```powershell
node _tests/_test_ancient_gallery.js
```

### 排盘规则反验（天将顺逆 / 昴星 / 九宗门，2026-09-10 新增）

```powershell
node _tests/_test_jiangpan.js        # 传本锚点：经文13/18/20 + 汇选046~049 + 昴星取用
node _tests/_test_dungan.js          # 遁干口径：旬遁传本锚点 + 空亡留空 + 中黄双遁 + 抓用神同口径
node _tests/_test_jiangpan_all.js    # 天将布列结构（840 项）
node _tests/_test_keti.js            # 九宗门课体
node _tests/_test_zhonghuang_dun.js  # 日干遁/时干遁
```

### 免费版同步与校验

```powershell
python _tools/sync_free_edition.py
python _tools/verify_free_edition.py
```

### 发布打包（release 产品 + 正式签名 → release_pkg）

```powershell
python _tools/sign_release.py free    # 免费版（上架用）= 默认；main = 主版
# 产物：APP/release_pkg/LiurenFocusDiviner-free-release-signed.app（自动 verify-app 校验签名）
# 注意：generic 名会被覆盖，归档旧包请先改名保留（如 …-1.0.1-onshelf-20260826.app）
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

2. **真源漂移（2026-09-10 踩过）**
   - 只改 `core/liuren-core.js` 而没改 `core/liuren-core.ts`（或反之），会让真源与产物不一致；
   - 只改 .ts 而不跑 tsc，测试仍在旧产物上跑（测试加载的是 .js）；
   - 改核心算法一律三步：改 .ts → tsc 重编译 → 手工同构 .ets，最后跑全套 `_tests/_test_*.js`。

3. **ArkTS 严格模式**
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

3. ~~中黄 5 案补 reasoning~~ ✅ 已完成（`621e2be`）。

4. ~~修中黄 5 案数据~~ ✅ 已完成（2026-09-10，随天将修正一并做）
   - 4 案（`c13_1/c16_1/c18_1/c20_1`）月将改回「十一月将＝丑将」、月令子，`expect` 全部复算；
   - 5 案 `original` 换为**经文断语原句**（逐字取自经文 1/13/16/18/20），「朱雀入关」等无据概括语删除；
   - `c13_1`（经文13）、`c18_1`（经文18）、`c20_1`（经文20）修正后与经文课例**逐项吻合**；`c16_1` 与经文16 有涉害深浅之异 → 已写「存疑对读」；
   - 连带重锚两张逆布案证据链：`renzhan_bingyin_039`（午/白虎→辰/白虎）、`renzhan_wuchen_053`（酉/朱雀→酉/太阴，与原文「太阴乘酉加亥」一致）；
   - `_test_ancient_gallery.js` 已回到 `ALL PASS (45 cases)`。

5. **继续案例入库**
   - 延续“用户找源/选源，助手 OCR 转写、写提取笔记、复算、入库、跑 validator”的节奏；
   - 《壬占汇选》更多日课；
   - 易藏其他书只作后续 mining，UI 提交不要带入 untracked 文本。
   - 中黄 4 案 id 已按章号统一（`c13_1`/`c16_1`/`c18_1`/`c20_1`）并补 `chapterNo`；`title` 统一作「十一月（丑）将」。

6. **付费版准备**
   - 只在免费版正式上线稳定后开始；
   - 付费内容定位为“古籍案例研读库增量”，不做功能锁；
   - 商品/IAP 真机与沙盒流程最后再接。

---

## 11.5 引擎修正：十二天将顺逆 / 昴星取用 / 遁干口径（2026-09-10）

> 详见 `大六壬文档/排盘/天将顺逆修正对照.md`（含前后对照、自查清单、影响面统计）。

**改了什么**

| # | 问题 | 修法 |
|:--:|:--|:--|
| 1 | 天将顺逆失效：`order = shun ? JIANG_SHUN : JIANG_NI` 与「逆方向」叠加互相抵消 → 恒顺布，应逆布的盘十二天将整体镜像（10/12 宫错） | 抽唯一实现 `LiurenCore.buildJiang(dg, tp, hourZhi)`（js+ets 两个起盘入口共用）；`JIANG_ORDER` 恒定将序、方向由 `JIANG_SHUN_GONGS` 决定；删除 `JIANG_NI` |
| 2 | 柔日昴星初传写死为「午」：`Z[(Z.indexOf("酉") - 3 + 12) % 12]` | 抽 `LiurenCore.maoxingFirst(tp, yangGan)`：刚日取地盘酉上神、柔日取天盘酉下神 |
| 3 | 九宗门散落的魔数 | 八专 `BA_ZHUAN_STEP`、返吟井栏射 `JINGLAN_SHE`、伏吟自刑 `ZI_XING`、昴星锚 `MAOXING_ANCHOR` 全部具名化 |

**规则唯一来源**：`core/liuren-core.js` 末尾「十二天将布列规则」块 + `LiurenCore.ets` 同名块（注释互指，改一处必须同步另一处）。

**影响面（17280 盘全枚举）**：天将变化 50.0%（每盘 10/12 宫）；中黄变干乘将 41.7%；毕法命中变化 15.5%；柔日昴星 1.6%；至少一处 50.9%。

**传本锚点**：经文13（初传太常·中传六合）、经文18（环列 亥天后·寅朱雀·巳青龙）、经文20（未贵人·申天后·酉太阴·戌玄武）、汇选046~049 课式图 —— 已固化进 `_tests/_test_jiangpan.js`。

**注意**：`_tests/_test_jiangpan.js` 旧版把错误口径写成了断言（“巳时逆布：辰宫=天后”），已重写为传本锚点测试；`_test_core_regress.js` 本就排除天将比对，不受影响。

**在架包同病**：上架包（2026-08-26 构建自 `84b755e`）同样含这两个 bug；按硬纪律不撤回/不重提，随下一版修正。

**随修正一并处理**：① 中黄 5 案数据重修（月将/月令、expect 复算、`original` 换经文原句）——见 §11.4；② 两张逆布案证据链将名重锚（`renzhan_bingyin_039`、`renzhan_wuchen_053`）；③ `_test_ancient_gallery.js` 回到 `ALL PASS (45 cases)`。

**遁干口径（同轮一并修正）**：新增 `LiurenCore.xunDun(dg,dz)`（旬遁，唯一实现）＋ chart 带 `dunXun`；三传 `gz`、天地盘中圈（默认）、地盘干、抓用神动态三传、用神节点卡一律走旬遁；中黄模式仍为日干遁(体)＋时干遁(用)双干。旬遁下空亡支留空 → 三传卡补「空」标（`ChuanCard.mark`）。传本锚点：汇选035/046/052、断案001、经文18（含「（原阙）」）固化进 `_tests/_test_dungan.js`。

**贵人表校勘**：两份中黄文档的丁/辛/壬 三行已按传本校正（丁 昼亥/夜酉、辛 昼午/夜寅、壬 昼巳/夜卯）并附依据；代码未动。

**仍待定**：① 辛/壬 贵人表暂缺本库传本实证；② 商店在架包不含本轮修正；③ 案例鉴赏收费设计（另议）。

---

## 12. 给后续 AI 的操作建议

- 先跑：`node _tests/_test_ancient_gallery.js`
- 改案例后必跑：反验 → 免费同步 → 免费校验 → 主版构建 → 免费版构建 → commit/push。
- 改中黄/盘后必跑：`node _tests/_test_zhonghuang.js`、`node _tests/_test_zhonghuang_analyze.js`、`node _tests/_test_zhonghuang_dun.js`、`node _tests/_test_jiangpan.js`，并构建主/免费 HAP。
- 改核心算法：改 `core/liuren-core.ts`（真源）→ `npx tsc` 重编译 `core/liuren-core.js` → 手工同步 `LiurenCore.ets`（含 `ChartCore`/`Chart` 接口字段）；三份实现必须同构，且新增盘字段别忘 `withDx` 浅拷贝。
- 写古籍案例时：先程序复算，再写断语解释；不要先信 OCR。
- 遇到传本不一致：宁可写“存疑对读”，不要硬改引擎去迎合 OCR。
- **盘面规则不要再写死**：天将/贵人/九宗门取用/遁干的常量与阈值一律进「规则块」并抽成具名常量或方法；两个起盘入口（`buildChart`/`buildChartAncient`）共用同一实现。
- **遁干分层**：默认旬遁（三传/盘面）＝传统层；中黄两次遁只在「中黄」模式叠加，不得再拿日干遁当默认。
- 任何涉及医疗/法律/投资/仕途/生死的文本，都加非建议口径。
- 商店素材：默认不动；要动先确认是否真有必要，且只更新资料，不碰包和版本号。

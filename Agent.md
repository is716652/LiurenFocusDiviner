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

### 剧情数据「一局多占」（2026-09-10 起，Web 原型已跑通）

设计讨论稿：`大六壬文档/古籍案例剧情动态演进讨论稿.txt`（主线/支线、取证后揭断）。当前落地口径：

- 真源：`APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/ancient/case_story.json`，key = 案例 id（与 `case_gallery.json` 对齐）。
- 网页导出：`python _tools/export_case_story_web.py` → `UI/_data/case_story.js`（`window.CASE_STORY`）。
- 结构：`story = { brief, note, asks[] }`；`ask = { id, role:'original'|'derived', topic, title, badge, intro, question, clues[], goodWords[], endings[4], ending }`。
- 线索锚点：`clue.anchors = [{kind, ref?, pos?}]`，kind 与证据链同一套，另增 `shensha`（ref = `支/神煞名`）。
- 纪律：`original` 支线的 hint 只给盘面事实与古法通则，**不得抄录该案原文断语与应验**（原断留到「呈上断语」后揭，揭的是 `case_gallery.original`，剧情数据不复制原文）；`derived`（同课异占）只给取象清单与规则依据，`ending.note` 必写「非古籍原断」并加现实免责，`ending.text` 不得含结论。
- 反验：`node _tests/_test_case_story.js`（锚点必须落到复算盘面 + 反抄录检测 + 合规 + 导出同步）、`node _tests/_test_case_story_web.js`（无头跑原型：每条线索都有点位可点、支线结算不泄露原文、切换支线复位、无剧情案例不崩）。
- 已写剧情：`duanan_001_han_qixue`（原占祈雪 + 同课异占·占行人 + 同课异占·占远行，三支线）、`renzhan_jiazi_011_xue_xingren`（原占）。其余 43 案待补，每案按「1 条原占 + 2~3 条异占」扩。
- 原型：`UI/壬案推演原型.html`（一局多占版）：卷宗 → 选占问方向 → 起盘 → 点盘取证 → 呈上断语。原型把「可点位」先登记进 `SURFACES` 再挂事件（数据先行），无头环境才能遍历校验；`protoSurfaces()/protoState()` 为测试钩子。
- 待办（上架相关）：剧情数据将来只随收费版发布时，需在 `sync_free_edition.py` 侧确认免费包不带 `case_story.json`。

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
node _tests/_test_ancient_gallery.js       # 45 案：expect 复算比对 + 证据链锚点
node _tests/_test_case_story.js            # 剧情数据：锚点 + 反抄录 + 口径 + 导出同步
python _tools/export_case_story_web.py     # 改完 case_story.json 后必须重导（测试会查同步）
node _tests/_test_case_story_web.js        # 无头跑原型：点位可达性 / 结算不泄露原文
```

### 配色对比度门禁（应用市场自检口径，2026-09-10 新增）

```powershell
node _tools/contrast_audit.js              # 全量扫 fontColor：低于 4.5:1 列清单并返回 1
node _tools/contrast_audit.js --trace AncientCaseGallery.ets:376   # 打印某处底色的推断过程
```

自检要求：图标/标题文字与背景 > 3:1，正文文字 > 4.5:1（浅色模式下同样量测）。
深底文字安全线：与本文件 `DARK_WORST`（`#352F22`，12% 金底叠加后的最亮深底）达到 4.5:1；
**浅色面板内的文字必须反过来用深色**，改色时不能全局一把梭（案例鉴赏的纸面板即反例）。

### 页签导航反验（1.0.3 审核反馈，2026-09-10 新增）

```powershell
node _tests/_test_navutil.js    # 抽出 NavUtil.ets 跑模拟路由栈：反复横跳后回排盘等 9 项
```

注意：该测试验证的是**决策逻辑 + 官方文档语义**（模拟栈按 `back(index)`/`pushUrl` 语义实现），
真机行为仍需上机确认。

### 天将规则对账（规范 ↔ 引擎，2026-09-10 新增）

```powershell
node _tests/_test_jiangpan_rules.js   # 规范 JSON ↔ 引擎：贵人表/昼夜分界/顺逆/将序/安贵人+布将（1440 组）
```

规范真源：`大六壬文档/json/十二天神与贵人.json`（说明文档 `大六壬文档/排盘/十二天神与昼贵夜贵说明.md`）。
改天将/贵人相关代码或改这两份文档后**必跑**；两侧任何一方漂移都会立刻判否。

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
   - hvigor 打了 WARN 时进程可能仍返回非 0，但会打印 `BUILD SUCCESSFUL`；
     判断构建是否真的成功，看产物时间戳（`entry/build/default/outputs/default/entry-default-signed.hap`）。

7. **应用市场对比度自检（1.0.2 被卡在这里）**
   - 要求：图标/标题文字 > 3:1，正文文字 > 4.5:1，且**系统浅色模式下同样量测**。
   - 深色主题最容易踩线的是「弱化文字」那一档（`#5A4F3D` 实测 1.82:1 =
     毕法赋卡下合规提示）；次要文字 `#8A7B5C`(4.02)、`#6B5F45`(2.64) 也不达标。
   - 反方向同样会踩：浅色面板（案例鉴赏纸/淡蓝面板）里的文字必须用深色，
     改配色**不能全库替换色值**，务必按容器分别处理。
   - 改完必跑：`node _tools/contrast_audit.js`，要求 0 处低于 4.5:1。

8. **页签导航（1.0.3 审核反馈）**
   - 页签不要写「进入用 pushUrl、回排盘用 back()」：反复切换会把页面栈堆起来，回不到排盘页。
   - 统一走 `model/NavUtil.ets` 的 `goTab / goTabWith`（栈里有就 `back(index)`，没有才 `pushUrl`）。
   - `back({ url })` 不是可靠写法：栈里没有该页时**不响应**（等于没点）；
     要先 `getStateByUrl` 查栈拿索引，再 `back(index)`。
   - 页签回到已存在的实例不会重建页面 → 需要刷新的数据自己加 `onPageShow`。

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
   - `c13_1`（经文13）、`c18_1`（经文18）、`c20_1`（经文20）修正后与经文课例**逐项吻合**；`c16_1`（＝癸卯日丑将卯时）与经文16 有涉害深浅之异 → 已写「存疑对读」，
     **2026-09-10 补完诊断并正式登记**：见本文 §11.9 与 `_tests/_data/sanchuan_kaiyi.json`（已穷举 100+ 涉害计数组合证「取深」口径下无解；疑点在涉害候选集是否应先经比用筛选；不改引擎、不改经文）；
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

## 11.6 应用市场对比度自检修正（1.0.3 · 2026-09-10）

**故障**：1.0.2 提交后自检未过 ——「系统浅色模式下控件文字与背景对比度存在问题」，报出某 Text 控件
对比度 **1.83**（要求图标/标题 > 3:1、正文 > 4.5:1）。

**定位**：`pages/Index.ets` 毕法赋卡（底 `#1C1A16`，内层 `rgba(233,200,120,0.08)` 面板）下方的合规提示
`#5A4F3D` —— 合成底色下实算 **1.82:1**，与自检值吻合。全量扫描发现同类「太暗」文字共 137 处。

**根因**：深色主题里 `#8A7B5C / #6B5F45 / #5A4F3D` 三级「弱化文字」全体低于 4.5:1；
另有反方向的坑——案例鉴赏的**浅色面板**内混用了浅色文字（`#F0E6C8` 标题在纸底上只有 1.09:1）；
标签底色本身也有不达标者（浅字压 `#3F7D6B` 仅 4.21:1、压 `#8A7B5C` 仅 3.62:1）。

**修正**：深底弱化文字统一提到 `#A8986E`（对最亮深底 4.70:1）、金色辅助字 → `#C4A25C`、
事类标签文字 → `#E08A7A`、用神标签底 → `#33705E`、旁证标签底 → `#5A4F3D`；
浅色面板内的文字反向改深（`#2B241B / #6B5F45`）；`color.json`（base+dark）同步；
`EntryAbility` 由 `COLOR_MODE_NOT_SET` 改为 `COLOR_MODE_DARK`（本应用为单主题深色）。
明细表见 `鸿蒙规范文档/商店页文案与截图清单.md` §9。

**门禁**：新增 `_tools/contrast_audit.js`（按 ArkTS 构建器结构推断文字真实底色：同行修饰符背景 →
浅色区块 → 逐层外层容器 → rgba 合成 → 辅助函数 return 值；推不出时按最亮深底 `#352F22` 保守判定）。
当前 323 处 `fontColor` **0 处低于 4.5:1**（退出码 0）。`--trace 文件:行号` 可打印某处的推断过程。

**发布**：版号 → `1.0.3 / 1000003`；免费版 sync + verify PASS，零权限；签名包
`APP/release_pkg/LiurenFocusDiviner-free-release-signed.app`（1,574,345 字节，
SHA256 `3E55D6CA4A847DCB4F4F2D1E9117EEF8F635B85374E2DF73600FDA5D966B500E`，verify-app success）；
1.0.2 提审包归档到 `APP/release_pkg/archive/`。**上架素材与文案未动**（版式未变，仅次要文字亮度提升）。

**顺带修掉的一类隐形问题**：16 处 `Text` 未显式指定 `fontColor`（如中黄变干主线、时支行、年命行、
🔒/🧭 图标行），在系统浅色模式下会取到主题的深色默认字色 → 深底上几乎不可见；
声明单主题深色后这些文字回归浅色，同时浅色面板内也没有这类无字色文字（已扫描确认 0 处）。

**结果**：1.0.3 应用市场审核通过（2026-09-10）。

---

## 11.7 页签导航修复（1.0.3 审核反馈 · 未升版号）

**审核反馈**：「排盘-排盘/课例/古籍：在重复进入课例/古籍界面时，点击排盘不能正确回到排盘」
（测试环境 HarmonyOS 6.1.0 / API 6.1.1(24) 实机，要求下一版修复）。

**根因**：三个页签「进入」用 `pushUrl`、「回排盘」用 `router.back()`——只退**一层**。
反复进入课例/古籍会把页面栈堆成 `Index→Cases→Ancient→Cases…`，点「排盘」只退到上一个页签页。

**修法**：新增 `entry/src/main/ets/model/NavUtil.ets`，三页页签切换统一走 `goTab / goTabWith`：
1. 目标页已在页面栈中 → `back(index)` 直接回到它（页面不重建，排盘页盘面与用神保留）；
2. 目标页不在栈中 → `pushUrl` 新开一页；
3. 目标页就是当前页 → 不动（页签允许点当前项）。

不用 `back({ url })`：文档明确「如果页面栈上没有 url 页面，则不响应该情况」（不在栈里等于没点），
所以必须先 `getStateByUrl` 查栈、拿到索引后再 `back(index)`。
SDK 声明已核对：`back(index, params?)` / `getStateByUrl` / `getState` 均在 `@ohos.arkui.UIContext` 的 Router 上。

**配套改动**：
- `Index.ets` 页签跳转改 `goTab`；新增 `onPageShow`：**仅在收到新令牌 `t`** 时按新日期重排
  （`recastFromRoute()`），普通页签返回不带令牌 → 盘面保持不动；`restoreCase` 的重排逻辑抽为
  `recastFromRoute()` 共用。
- `Cases.ets` 页签跳转改 `goTab`；新增 `onPageShow` 刷新课例列表（页签回到已存在实例不会重建页面）；
  `restoreCase` 改 `goTabWith(..., { y, m, d, hz, t })` 带令牌返回。
- `Ancient.ets` 页签跳转改 `goTab`；`onBackPress`（案例详情先回列表）不变；`‹ 返回` 仍为 `back()`。

**校验**：`node _tests/_test_navutil.js` —— 把 `NavUtil.ets` 真实代码抽出（去注释/类型注解），
用按官方语义实现的模拟路由栈跑 9 项，含审核那串操作（反复横跳后点排盘回到排盘页、横跳不堆栈、
栈中无排盘页时新开、课例恢复带参、`‹ 返回` 仍退一层）。**仅验证决策逻辑与文档语义，真机行为待上机确认。**

**状态**：未升版号、未打包（1.0.3 已在架）；随下一版一并提交，更新说明草案见
`鸿蒙规范文档/商店页文案与截图清单.md` §10。

---

## 11.8 天将规则对账（用户反馈「己巳日 酉时 子将 第一课应为朱雀」· 2026-09-10）

**反馈**：古籍排盘中，己巳日 子将 酉时，第一课（上神戌）盘中乘太阴，用户认为应乘朱雀。

**查证**（三方对照）：
1. **传本**：《六壬断案》39）某占家宅（正月己巳日子将酉时）课式印作 `蛇陈后朱` / 三传 `申勾陈·亥螣蛇·寅太阴`，
   即第一课乘**朱雀** → 该书用**昼贵**（子）；而同一书 001）韩太守占祈雪（十一月己卯日寅将酉时）
   课式与**原文自证**「子作勾陈」均按**夜贵**（申）→ 两例同为酉时而贵不同 → 属占例/排印差异。
2. **规范**：`大六壬文档/json/十二天神与贵人.json` 与 `排盘/十二天神与昼贵夜贵说明.md`——
   昼夜分界 卯至申昼、酉至寅夜（纯以占时）；贵人临亥子丑寅卯辰顺、巳午未申酉戌逆；将序恒定。
   按此口径：酉时为夜 → 己日夜贵申 → 贵人乘申落巳宫 → **逆布** → 未宫＝太阴 → 引擎输出与规范一致。
3. **引擎**：`buildJiang` 与规范**逐项一致**（贵人表 10 行、昼夜分界、顺逆宫位、将序、安贵人与布将方向
   10 干×12 时×12 将 全枚举）。

**结论**：引擎无需改动；该课按既定规范就是**太阴**，书中作朱雀是**书版/占例问题**。
登记于规范 JSON 的「校验记录.问题与修正」。

**顺带校勘**：规范文档「安贵人」原措辞「加临地盘**占时**宫位（贵加占时）」按字面实现会使天将
只由占时决定、与日干无关，且与同文档第 4 步「在天盘上填入」矛盾 → 判为措辞笔误，
已改为「加临该支在天盘所在的地盘宫位（贵人乘其支）」；引擎行为不变。

**新增守门测试**：`_tests/_test_jiangpan_rules.js`——把规范 JSON 与引擎逐项锁死（含全枚举），
任一侧漂移立即判否。

**不设昼/夜开关（2026-09-10 定）**：一度考虑加「按占时 / 昼占 / 夜占」开关，以便照书上的图复核，
**已否决**——昼夜贵由占时唯一决定（卯至申昼、酉至寅夜），规则是单值，给选项等于把规则降级为
用户偏好、盘面无从对错，也会把书版排印差异混进盘面。书例不合者一律登记为书版存疑；
复核时按书上的昼夜另算一遍并注明「该书此例作昼/夜占」即可，不动引擎、不加开关。

---

## 11.9 三传·涉害复等口径修正 + 癸卯例存疑对读（2026-09-10）

**问题**：`node _tools/ancient_corpus_audit.js` 报中黄经文课例三传 3/15 不符，三例全在涉害课。

**根因**：涉害复等（见机/察微）判的是「**上神所临地盘宫**」是否孟/仲，原实现误判为「上神自身」是否孟/仲。

**依据**（原文可核）：
1. `大六壬文档/古籍原文-易藏-术数/六壬指南-明-陈公献/六壬指南-明-陈公献.utf8.txt` 第 24 行：
   「……则名之曰涉害课，**先以寅申巳亥上乘之神为用**，则涉之深而建名曰见机……**若孟神上无克贼则以子午卯酉上乘之神为用**……」
   ——「寅申巳亥**上乘**之神」「孟**神上**无克贼」＝地盘孟/仲宫位**所乘**之神，故姓孟/姓仲的是**地盘宫**，不是上神本人。
2. 规范 md `大六壬文档/排盘/大六壬指南的四课三传的三传排法.md` §3 原措辞「先取孟位（寅申巳亥）**上神**」可被读反，
   已订正为「**所临地盘宫**属孟/仲」并加**校勘注**（该 md 是本次唯一点名的规范文档）。

**修正**：`resolveSanchuan` 涉害复等改判 `gongOf(tp, 上神)` 的孟/仲（`core/liuren-core.ts` → 手工同构 `LiurenCore.ets`）。
**计数方向未动**（仍是「自所临地盘宫顺数地盘至本家，计地盘支克上神之数，取多者」）——曾试「逆数」，
实测会把辛酉例改坏、全枚举不一致从 816 涨到 1272，已回退。复等只在**深浅相等**时介入（辛酉例：未2 > 卯0，径取深者）。

**影响面**：全枚举 17280 盘，三传改变 **600 盘（3.47%）**，宗门迁移**全部为「涉害→涉害」**（四课/天地盘不受影响）。
量化脚本：`node _tools/sanchuan_impact.js`（HEAD 旧引擎 vs 现引擎，两引擎各在独立 vm context 跑全枚举）。
回归基线 `_tests/_data/sanchuan_baseline.json` 按其文件头指示 `--regen` 重生成（sweep 4908 条中变 160 条，全部为涉害课）。

**存疑对读（不改引擎、不改经文）**：`16.释官讼门第十六.md` 第 183 行「癸卯日 丑将 卯时」
书三传 **丑/亥/酉**、引擎 **亥/酉/未**（四课一致）。已穷举「起点×方向×止点×计数对象×取舍」100+ 组合，
**「取深」口径下无任何计数组合能选中丑**（该例恒为 亥 ≥ 丑），复等亦不可救（深浅 1 vs 4 不等）。
疑点在「**涉害课的候选集是否应先经比用筛选**」（该例两候选丑/亥同为阴支，比用筛不掉）。
**不得为凑此例改规则**；登记于 `_tests/_data/sanchuan_kaiyi.json`，待更多传本再定（若他本亦作丑/亥/酉则查引擎候选集；若作亥/酉/未则书上为排印/占例差异）。

**新增守门**：`_tests/_test_sanchuan_spec.js` 锚点由 3 条扩到 **6 条**（原《六壬断案》88/165/93 +
中黄乙亥`16.md:218`/丙子`8.md:88`/辛酉`16.md:111`），改涉害口径必须先过这六条。

---

## 12. 给后续 AI 的操作建议

- 先跑：`node _tests/_test_ancient_gallery.js`
- 改案例后必跑：反验 → 免费同步 → 免费校验 → 主版构建 → 免费版构建 → commit/push。
- 改中黄/盘后必跑：`node _tests/_test_zhonghuang.js`、`node _tests/_test_zhonghuang_analyze.js`、`node _tests/_test_zhonghuang_dun.js`、`node _tests/_test_jiangpan.js`，并构建主/免费 HAP。
- 改配色后必跑：`node _tools/contrast_audit.js`（须 0 处低于 4.5:1）→ 主版构建 → 免费 sync/verify → 免费版构建 → `python _tools/sign_release.py free`。
- 改页签/路由后必跑：`node _tests/_test_navutil.js`（决策逻辑），并**上机确认**（模拟测试不覆盖真机行为）。
- 改天将/贵人相关代码或改 `大六壬文档/json/十二天神与贵人.json` 后必跑：`node _tests/_test_jiangpan_rules.js`。
- 改核心算法：改 `core/liuren-core.ts`（真源）→ `npx tsc` 重编译 `core/liuren-core.js` → 手工同步 `LiurenCore.ets`（含 `ChartCore`/`Chart` 接口字段）；三份实现必须同构，且新增盘字段别忘 `withDx` 浅拷贝。
- 写古籍案例时：先程序复算，再写断语解释；不要先信 OCR。
- 遇到传本不一致：宁可写“存疑对读”，不要硬改引擎去迎合 OCR。
- **盘面规则不要再写死**：天将/贵人/九宗门取用/遁干的常量与阈值一律进「规则块」并抽成具名常量或方法；两个起盘入口（`buildChart`/`buildChartAncient`）共用同一实现。
- **规则口径单值、不给用户选项**：昼夜贵（卯至申昼 / 酉至寅夜）、顺逆、将序、旬遁等一经定论即唯一执行；书例不合登记「存疑对读」，不得加开关让用户自选（2026-09-10 定）。
- **期望值来源要标注、不得为迎合而硬推**（2026-09-10 定）：案例/锚点的 `expect` 字段，凡古籍原文写明的（三传、四课、宗门/课体、乘将）**一律以书为准**；原文未载的派生字段**允许用引擎复算补齐**，但必须标注来源（`书` / `引擎复算`）。禁止为让测试变绿而写死个例、加特例分支、或把书值与引擎不一致处抹平；书与规范冲突时两个值都留，标「存疑对读」。
- **遁干分层**：默认旬遁（三传/盘面）＝传统层；中黄两次遁只在「中黄」模式叠加，不得再拿日干遁当默认。
- 任何涉及医疗/法律/投资/仕途/生死的文本，都加非建议口径。
- 商店素材：默认不动；要动先确认是否真有必要，且只更新资料，不碰包和版本号。

---

## 13. 引擎组件化方案（2026-09-10 定，待执行）

现状问题：`core/liuren-core.ts` 与 `APP/.../model/LiurenCore.ets` 都是 2200~2700 行单体，
排盘定法、盘态、毕法、中黄、抓用神全挤在一个类里，改一处要通读全局。

**拆分边界（每个模块只做一件事）**：

| 模块 | 职责 | 关键不变量 |
|:--|:--|:--|
| `pan/tiandipan` | 天地盘：月将加占时、地盘↔天盘映射 | 规范《天地盘的天盘地支排法》 |
| `pan/jigong` | 天干寄宫 | 甲寅/乙辰/丙戊巳/丁己未/庚申/辛戌/壬亥/癸丑 |
| `pan/sike` | 四课（干→干阴→支→支阴） | 规范《四课排法》；已验 15/15 经文课例 |
| `pan/sanchuan` | 九宗门·三传取用（含涉害顺数＋复等） | 规范《三传排法》；传本锚点 88/93 |
| `pan/jiang` | 十二天将：昼夜贵、顺逆、乘将 | 规范 JSON《十二天神与贵人》 |
| `pan/dungan` | 旬遁 / 日干遁 / 时干遁 | 《五子元遁法》；旬遁为传统默认 |
| `pan/xunkong` | 旬空 | 旬遁下空亡支不配干 |
| `pan/shensha` | 神煞起法 + 地盘本位 | `地盘本位神煞.md` |
| `pan/dx` | 盘态：旺衰/气机点/关系/贵人状态 | 旺衰休囚死规则 |
| `bifa` | 毕法赋一百法命中 | 一百法规则 |
| `zhonghuang` | 中黄五变经（二次遁、变干主线） | 经文与两份中黄口径文档 |
| `yongshen` | 抓用神（**唯一允许灵活的一层**） | 取象/评分，不进定法 |

**三端同构策略（不能破坏）**：
- 真源仍是 `.ts`（ArkTS 兼容子集、无 import/export 的全局脚本），按模块拆成多个文件，
  由装配层 `core/liuren-core.ts` 依序引用 → `npx tsc` → `core/liuren-core.js`（Node/Web 仍只加载这一个产物）；
- ArkTS 侧同名分模块（`APP/.../model/pan/*.ets`，ArkTS 原生 import），`LiurenCore.ets` 降级为门面；
- 新增 `_tests/_test_modules_parity.js`：逐模块比对 .ts 与 .ets 的规则常量表与关键函数行为，
  再跑全套 `_tests/_test_*.js` + 传本锚点。

**执行顺序（2026-09-10 定）**：先把三传正确性收敛（八专余量、回归基线、主/免费版构建、命中率报告）
→ 再做组件化拆分（纯结构改动、行为不变、以现有测试与传本锚点为回归网）→ 拆分完成后再动规则。

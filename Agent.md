# Agent.md —— LargeLiuRen Design 操作手册（当前态）

> 写给后续 AI / 开发者：**先读这份，再动代码**。
>
> **当前状态（一眼看完，2026-09-20 收口）**
> - **在架版本**：`1.0.5 / 1000005`（2026-09-19 自检通过 → 提审 → **2026-09-20 正式上架**）；1.0.4 同日被取代。
> - **仓库**：`main` 与 `origin/main` **同步**、工作区干净。本版源码锚点 = `c1769b2`（App 源码最后一次变更）；
>   `v1.0.5-submitted` / `v1.0.5-onshelf` 均指它且**已推远端**（`v1.0.5-packaged` 指首刀 `2ba22f3`，**不是本包锚点**）。
> - **门禁**：46 项，全量 **46/46 PASS**（245 s，含门禁有效性自检）；改完随手跑 `--fast`（42 项 ≈10 s）。
> - **待办**：**A 类（需你拍板/确认）三条** —— ① 浅色主题「杀进程重开后是否记住选择」真机确认；② 天地盘层间可分辨性阈值拍板；
>   ③ 古籍案例鉴赏历批挂账的 4 项待定（§11 A 类第 6 条 → 专文 §10.3）。**B 类（我可推进）**：补完古籍剧情最后 4 案 →
>   把「一局多占」推演移植进 App（§11 B 类）。
> - **最近一轮要点**：新增**古籍案例鉴赏收费块专文**（设计动因 / 进度 41-45 / 两侧 UI / 免费边界 / 历批纪律 10 条 / 7 项待定），
>   并清理过时的设计讨论稿（有用部分已并入专文，§10）；修 `case_story_facts.js` 旬空打印（§9）。
> - **上一轮要点**：新增 `.gitattributes`（`* text=auto eol=lf`，堵住 `git checkout` 改行尾的坑，§9）；
>   prop 追溯加 **L4b** 且「无法解析」改判否、新增天地盘逐层取色报告 `_tools/panlayer_contrast.js`（§11「已了结的记录」）。
> 本文档更新前 main HEAD：`c1769b2 fix(转场时长): 按设备物理尺寸分档`（App 源码最后一次变更）

**这份文档只描述"当前是什么、怎么改、怎么验"。** 历史迁移过程（引擎组件化怎么从单体切出来、
早期版本怎么一步步演进）已按用户要求删除 —— 需要考古请看 git 历史与 tag（`v1.0.4-pre-componentize`、
`pre-visual-token-20260916` 等）。

---

## 0. 怎么用这份文档

| 你要做的事 | 看哪一节 |
|:--|:--|
| 改引擎算法 / 排盘读象 | §2.1（真源在 `core/liuren/**`，产物勿手改）+ §3（改完跑唯一入口） |
| 改规则表 / 古籍数据 | §2.2 |
| 改配色 / 加主题 | §2.3 + §7（令牌与对比度硬规则） |
| 改 UI / 组件 | §3.2（UI 类门禁）+ §7（不得写死色值） |
| 改完主版要出包 | §4（先同步免费版！）+ §5 + §6 |
| 遇到诡异现象 | §9（常见坑，都是踩过的） |

**唯一入口是 `node _tools/check_all.js`。** 不要凭记忆挑门禁跑。

### 0.1 接手检查清单（新会话 / 新同学第一件事）

1. **读 §1–§3**（定位、真源边界、门禁唯一入口）—— 约五分钟，够开工；细节用到哪节再翻。
2. **跑门禁确认这棵树是好的**：`node _tools/check_all.js --fast`（42 项 ≈ 11 s，失败项会自己说明原因）。
   全量 46 项（含 349 s 的门禁有效性自检）出包前跑，**必须独占跑**（入口有文件锁，别绕过）。
   —— 这一步的意义：**不必相信文档里的任何结论**，门禁会机械地告诉你是真是假。
3. **看两处状态**：**头部「当前状态」**（在架版本 / 源码锚点 / 门禁 / 待办，一眼看完）＋
   `git log --oneline -20`（最近在改什么）＋ §8 发布记录（每一包的指纹与来龙去脉）。
4. **读 §11「当前状态与下一步」**：那里区分了"我能做的"与"**待用户决定**的"，别把已拍板的事再问一遍。
   已拍板的几条口径（避免重开讨论）：**只保留一份权威文档**（本文件）、
   **升版本号必须用户明确要求**、**改完主版必须跑免费版同步**、**门禁新增必做变异验证**。

**给新会话的开场白（可直接粘贴）**：

```text
项目：D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design
先读 Agent.md（唯一权威文档），再跑 node _tools/check_all.js --fast 确认树是绿的，
然后看 §11 当前状态与下一步。本轮我要做的事：<一句话>。
```

**对话里丢不掉、但仓库里看不到的东西**（新会话要主动问用户）：

- 用户的即时偏好与口头决策（文档只记了"已定案"的那些，犹豫中的不在里面）；
- `.gitignore` 内的本地文件：截图、出包产物（`APP/screenshots_out/`、`APP/release_pkg/`）——
  文档里提到它们时都写了**绝对/仓库相对路径**，按路径去问即可；
- 本机工具链路径（§5 已写默认值；`LIUREN_*` 环境变量可覆盖）。

---

## 1. 这个 App 是什么

**大六壬排盘与读象**（墨底金文风格）。核心功能：

- **排盘**：天地盘（画布绘制：天将 / 天盘支 / 遁干 / 地盘支 / 中心月将）、四课、三传、课体、旬空标记、用神高亮。
- **读象**：以干支生克与课传结构出"读象清单"，引擎出数、App 出呈现（见 §7.5）。
- **毕法赋教练**：一百法逐条对照、课体判定、差在哪。
- **古籍案例库（收费块）**：**案例鉴赏** = 原文 + 复算盘例 + 断语证据链 + 异断对读（**45 案**）；
  「**一局多占**」剧情（**41/45 案**、82 支线、271 线索）数据已齐并全过闸，但**目前只在 Web 原型跑通、尚未接入 App**
  —— 这是本块当前最大的呈现缺口（进度与设计见 §10 的「收费块专文」）。
- **中黄天地盘**：时干 → 变干 → 落宫的旁证链（含两遁对照）。
- **数据健康**：规则表缺失/未加载会明说，不静默（见 §7.5）。

### 两个版本（差异只有 5 条规则，见 §4）

| | 主版 | 免费版（**上架用**） |
|:--|:--|:--|
| 工程 | `APP/LiurenFocusDiviner` | `APP/LiurenFocusDivinerFree`（**生成物**，gitignored） |
| 定位 | 全功能开发版 | 上架版：零权限、无收费项痕迹 |
| 数据 | 含收费块（案例鉴赏 / 剧情） | 剔除收费块数据 |
| 提交目标 | 不直接提审 | `sign_release.py free` 出包提审 |

---

## 2. 真源与生成链

### 2.1 引擎真源 = `core/liuren/**`（TypeScript）

**改动一律写在这里。** 两侧产物都由脚本重建：

```
core/liuren/**  ──(build_core.js / rebuild_core.js)──►  core/liuren-core.js      （Node / Web 用）
                ──(_ets_pipeline.js)─────────────────►  APP/.../ets/model/pan/*.ets
                                                        APP/.../ets/model/{LiurenCore,bifa,zhonghuang}.ets
```

`_ets_pipeline.js` 是 ArkTS 侧**唯一入口**，按固定顺序跑（任一步失败即停）：

1. `_ets_facade_extras.js`：从 `core/liuren/pan/dx.ts` 抽 `palaceLookup` → `_ets_extras_dx.txt`
2. `_ets_split.js`：从**基线单体**（tag `v1.0.4-pre-componentize` 的 `model/LiurenCore.ets`）按
   「成员 → 模块」显式映射切出各模块 + 生成门面
3. `_ets_qualify.js`：归属限定符改写（`LiurenCore.X` → `LrX.X`，与 `.ts` 侧同口径）
4. `sync_free_edition.py` + `verify_free_edition.py`（免费版同步与校验，见 §4）

**生成物一律勿手改**：`model/pan/*.ets`、`model/{LiurenCore,bifa,zhonghuang}.ets`。
手工改会在下一次重建时被无声覆盖。

**引擎的守护门禁**（改引擎后必跑）：

- `_test_no_hardcode.js`：A1–A6 —— 引擎内不得有个案标识 / I/O / 输入特判 / 死常量 / 个案口径只能进数据且带出处 /
  **三端同构**（`resolveSanchuan`、`buildJiang`、`xunDun` 在 `.ts`、主版 `.ets`、免费版 `.ets` 归一化后逐行相同）
- `_api_parity.js`：对外 API **只增不改**（改签名会让界面静默失效）
- `_core_snapshot.js`：**185,981 条行为快照**逐条比对（引擎行为回归的最后一道网）
- `_test_core_regress.js`：回归矩阵

### 2.2 数据真源 = `APP/.../rawfile/{rule,cal,ancient}/**.json`

| 目录 | 内容 | 保护门禁 |
|:--|:--|:--|
| `rule/`（14 个 JSON） | 规则表：神煞起法、十二宫气机点、空亡规则、助日规则、行年打分… | `_test_rule_health.js`（含运行期断言：**缺表必须说话**） |
| `cal/`（18 个 JSON） | 万年历（`yj_all.json` 等） | 同上 |
| `ancient/case_gallery.json` | 古籍案例原文与复算对照 | `_test_ancient_case.js`、`_test_ancient_gallery.js` |
| `ancient/case_story.json` | 案例**剧情**（一局多占推演） | `_test_case_story.js`、`case_story_audit.js` |

剧情数据的契约、坑位、硬规则住在 `大六壬文档/案例剧情/剧情补录方案与样张.md`（§2 契约 / §9 坑 / §10 硬规则）——
**写剧情前必读**；这一块的**进度实况、设计动因、两侧 UI 展示、收费边界、下一步**住在
`大六壬文档/案例剧情/古籍案例鉴赏-设计与进度.md`（**收费块专文**，每补完一批更新其快照）。
剧情也会导出给 Web 原型：`_tools/export_case_story_web.py` → `UI/_data/case_story.js`（案例库另有
`export_case_gallery_web.py` → `UI/_data/ancient_case_gallery.js`），
两个测试（`_test_case_story.js` 与 `_test_case_story_web.js`）会校验"数据与导出产物同步"。

### 2.3 视觉真源 = `resources/{base,dark}/element/{color,float}.json`

- **颜色令牌 81 个**，两主题**同名不同值**：`base/`=浅色（方案 A 偏金黄）、`dark/`=深色（原墨底金文）。
- **默认深色**：`model/ThemeStore.ets` 启动时读偏好（无偏好=深色）并调 `setColorMode` 覆盖 colorMode；
  用户在首页金卡上可切换。系统栏配色也由 ThemeStore 从令牌取（该 API 只收字符串）。
- **画布（天地盘）不能用 `$r()`**：`PanDisk.ets` 用 `tok(res, '令牌名')` → `getColorByNameSync`
  **运行时**取当前主题色值。名字写错是**运行时**错（编译不报），由门禁③兜住。
- 令牌细节与设计取舍见 `鸿蒙规范文档/视觉风格/设计令牌清单.md`、`实现方式决定.md`；
  尚未令牌化的残留与原因见 `剩余色值分类清单.md`。

### 2.4 Web 原型 = `UI/*.html` + `UI/_data/*.js`

原型用于在改 App 之前试玩法与视觉（数据由 App 的 rawfile 导出，见 §2.2）。
原型是**独立 HTML**（无构建、无框架），改动不影响 App 包体。

---

## 3. 门禁体系

### 3.1 唯一入口

```powershell
node _tools/check_all.js            # 全量 46 项，实测 ≈ 415 s（含 349 s 变异自检）
node _tools/check_all.js --fast     # 快档 42 项，实测 ≈ 11 s —— 改完随手跑
node _tools/check_all.js --only component_audit   # 只跑名字含该子串的项
node _tools/check_all.js --list     # 打印清单（含慢档标记）
```

⛔ **绝对不要并发跑两次**：`gate_mutation_check.js` 会**在原地变异真源**验证门禁有效性，跑完再还原。
两个实例同时跑会互相踩（真实事故：主版 `Index.ets` 的真实改动被回滚、变异行被提交进历史）。
入口已加文件锁 `.check_all.lock`（带 pid 存活检测），并发启动直接拒绝（exit 9）。
**若确认那个进程已死**，删掉锁文件再跑。

### 3.2 46 项按保护面分组

| 保护面 | 门禁 |
|:--|:--|
| **引擎**（`core/liuren/**`） | `_test_core_smoke` `_test_core_regress` `_core_snapshot` `_api_parity` `build_core --check` `_test_no_hardcode` `_test_sanchuan_spec` `_test_keti` `_test_jiangpan` `_test_jiangpan_all` `_test_jiangpan_rules` `_test_dungan` `_test_palace` `_test_readxiang` `_test_readxiang_single_source` `_test_zhonghuang` `_test_zhonghuang_analyze` `_test_zhonghuang_dun` `_test_xingnian` `_test_nianming2` `_test_selectDuyu` `_test_bifa_keti` `_test_bifa_coach` `_test_coach2` |
| **数据**（rawfile） | `_test_rule_health` `_test_ancient_case` `_test_ancient_gallery` `_test_case_story` `_test_case_story_web` `_test_case_xu_cibin` `case_story_audit` |
| **UI / 组件** | `_test_component_audit`（慢） `_test_ui_layout` `_test_ui_foreach_key` `_test_ui_empty_state` `_test_empty_state` `_test_navutil` |
| **转场 / 动效** | `_test_page_transition`（系统转场 + 淡入淡出 + 无位移 + 弹簧曲线 + 时长按设备尺寸分档，见 §7.6） |
| **颜色 / 主题** | `_test_color_tokens`（**七条**规则，见 §7.3） `contrast_audit`（浅/深双跑） |
| **文案合规** | `_test_compliance_wording` |
| **工程 / 发布** | `verify_free_edition` `verify_app_pkg` `_test_docs_structure` `_test_hygiene`（无用 import） |
| **门禁的门禁** | `gate_mutation_check`（慢：逐条注入变异、重跑对应门禁，确认它真的报警） |

慢档 4 项 = `gate_mutation_check`（349 s）/ `_test_component_audit`（42 s）/ `_core_snapshot`（11.5 s）/
`_test_core_regress`（1.7 s）。

### 3.3 门禁纪律（每条都是踩坑换来的）

1. **新门禁必须变异验证**：注入一个该被抓的问题 → 确认 FAIL → 还原 → 确认 PASS。
   没做这一步就可能"写了但没用"。**实例**：颜色门禁规则⑥第一版正则写成 `[A-Za-z_$][\w$]*[Cc]olor`，
   前缀是必选的 → 只匹配 `fontColor:`，**裸 `color:` 反而漏掉**；注入探针时门禁毫无反应（exit 0），
   是变异测试当场揭穿的。
2. **变异验证的还原不能用宽 `git checkout`**：它会把同一文件里**未提交的真实改动一起还原**（踩过两次）。
   推荐用脚本写回，或**先提交再变异**。
3. **假阳性比漏报更危险**：它让人开始忽视门禁。实例：对比度门禁原先一律按 4.5:1 卡，
   把 `fs_title` 粗体大字（按规范应为 3:1）误判 —— 加入跨文件追溯后立刻爆出一条假阳性，已补大字阈值。
4. **门禁会过期失效**：令牌化曾把 `contrast_audit` 悄悄"卸械"——它只认字符串字面量，
   站点改成 `$r(...)` 后一个都匹配不上，**却照样打印"通过"**。定期自问："这个门禁还看得见它该看的东西吗？"
5. **同一条判定只跑一次**：判定方一律复用规则真源（例如 `verify_free_edition` 复用
   `sync_free_edition.diff_against()`），不得另写白名单。

### 3.4 当前状态

2026-09-20（1.0.5 上架当天）全量 **46/46 PASS，245.1 s**（含 201.6 s 门禁有效性自检、24.2 s 组件体检、
8.9 s 行为快照 185,981 条）—— 即"每个门禁都被证明能抓住它该抓的问题"。
同日快档 **42/42 PASS**（≈10 s）；此前 2026-09-19 全量为 275.7 s（同一结论，仅机器负载不同）。

---

## 4. 免费版同步（唯一差异真源）

**差异规则只住在 `_tools/sync_free_edition.py`**（5 条）：

1. 复制源码（`entry/src`、`AppScope`、配置），排除构建产物（`build/.hvigor/.preview/.idea/oh_modules` 等）
2. `PayConfig.PREVIEW_FREE` 写为 `false`（过审版全功能开放、无锁无付费痕迹，与申报"无收费项"一致）
3. `FeatureFlags.SHOW_ANCIENT_CASE_GALLERY` 写为 `false`（案例鉴赏入口隐藏）
4. 从免费版 `rawfile` **删除收费块数据**（案例鉴赏 / 剧情）—— HAP 即 zip、JSON 明文，随包发出等于公开
5. 移除免费版 `module.json5` 的 INTERNET 权限 + 对应权限文案（保持**零权限**申报）

```powershell
python _tools/sync_free_edition.py           # 真同步（清空并重建免费版目录）
python _tools/sync_free_edition.py --check   # 只判定：同一套规则跑在临时目录，再与现存免费版逐文件比对
python _tools/verify_free_edition.py         # 不变量与树一致性（出包前置门禁）
```

**两条纪律**：

- **改完主版（任何源码或资源，含 `resources/` 的 JSON）必须重跑同步。** 否则免费版仍是旧代码，
  编出来却 **BUILD SUCCESSFUL**（静默陷阱，最容易骗过自己）。出包前 `verify_free_edition` 会兜住。
- **免费版目录是生成物**（gitignored），**不要手改**，也不要把它的 diff 当"改动"提交。

---

## 5. 构建与出包

```powershell
# 主版构建（改完随手编）
cd APP\LiurenFocusDiviner
D:\HarmonyOS\command-line-tools-6.1.1-release\bin\hvigorw.bat assembleHap --mode module -p product=default --no-daemon

# 出包（默认 free = 上架用；main = 开发版）
python _tools/sign_release.py free
```

出包流程（`sign_release.py`）：

```
前置门禁（free → verify_free_edition.py，不过即中止：不构建、不出包）
  → hvigor assembleApp（release 产品 + 正式签名）
  → 归档上一刀（进 release_pkg/archive/）
  → 复制到 APP/release_pkg/LiurenFocusDiviner-free-release-signed.app
  → verify-app 签名校验（不是 verify-app success 就拒交）
  → 出包后校验 verify_app_pkg.py（16 项：包结构 / 包内 versionName·versionCode / bundleName /
     buildMode=release / requestPermissions 为空 / 收费块数据 ABSENT / 关键数据在位 /
     rawfile 与主版源码树逐文件对齐 / 免费版入口开关已关）
```

**归档命名**：归档名里的版本取**包内 `pack.info` 的 `version.name`**（标"这个包自己是哪一版"），
不是当前的工程版本；读不到则标 `prev`（宁可标不清，也不标错）。
（2026-09-19 修：此前标的是当前版本，曾把在架 1.0.4 包归档成 `…-1.0.5-20260913-1800.app`。）

---

## 6. 版本递进

| 项 | 规则 |
|:--|:--|
| **版本真源** | `APP/LiurenFocusDiviner/AppScope/app.json5` 的 `versionName` / `versionCode`（免费版随同步复制） |
| 编号 | `versionName` = `1.0.X`；`versionCode` = `100000X`（一一对应，递增，不跳号） |
| 一次提交 | 一个版本号；**升版本号必须由用户明确要求**（交给 AI 决定版本号是不对的） |
| 标签约定 | `vX.Y.Z-packaged`（出包源码锚点）→ `vX.Y.Z-submitted`（提审）→ `vX.Y.Z-onshelf`（上架）；`pre-*` 记录改造前状态 |
| 出包后必做 | ① 更新 §8 发布记录（包指纹 + 流水线结果 + 内容要点）② 打 `-packaged` 标签 |
| 提审后 | 补打 `-submitted`；审核通过并上架后打 `-onshelf` 并更新 §8 |
| 商店资料 | 文案与截图清单在 `鸿蒙规范文档/商店页文案与截图清单.md`（每次上架前的素材与发布记录都在那里） |

**当前版本状态（2026-09-20 收口）**：

- **在架**：`1.0.5 / 1000005`（1.0.4 同日被取代）；上架留档见 §8。
- **仓库**：`main` 与 `origin/main` **同步**、工作区干净；本版源码锚点 `c1769b2`，标签 `v1.0.5-submitted` /
  `v1.0.5-onshelf` 均指它，且**已推远端**。
- **下一版**：版本号由用户定（**别自己升**）。若只是文档/`_tools`/门禁改动，不必出包；
  一旦动 `APP/**`（含 `resources/**` 的 JSON、令牌、`.ets`），就必须重跑免费版同步 + 走一遍 §5 出包流程。

**出包到提审之间的纪律**：包一旦生成，其对应的源码状态就用标签钉住；此后只允许改文档与 `_tools`，
App 源码再改动就必须重新出包（否则"提审的包"与"仓库的代码"不是一回事）。

---

## 7. 主题、颜色与呈现纪律

### 7.1 令牌体系

- 两套同名令牌：`base/`（浅色，方案 A 偏金黄 —— 金色在浅底**必须加深**，`#F0D98C` 放白底上几乎不可读）
  与 `dark/`（深色，原墨底金文）。**两表的令牌名必须完全一致**（门禁①）。
- **默认深色**、应用内可切浅色（`ThemeStore`，偏好持久化；系统栏跟随）。

### 7.2 角色比名字重要（拆分换来的教训）

同一个色值在一次改造里可能承担**相反的角色**，浅色主题下无法兼顾，必须拆开：

| 角色 | 令牌 | 两主题关系 |
|:--|:--|:--|
| 配深字的**亮色填充**（选中态、金卡） | `accent_gold_fill` / `accent_gold_fill_bright` / `accent_blue_fill` | 恒定（不随主题变） |
| **文字 / 细线** | `brand_gold` / `brand_gold_bright` / `brand_gold_deep` | 浅色下**加深** |
| **深底上的浅字** | `ink_on_deep_text` | 恒定 |
| **金卡上的深字** | `ink_page` / `ink_on_gold_text` | 恒定 |
| **案卷纸面**（纸色卡 + 深字） | `case_paper` / `case_snow` / `case_*` 系列 | 恒定 |
| 遮罩 | `overlay_ink_scrim` | 深色=暗遮罩，浅色=亮遮罩 |

**值驱动的令牌化只能定"值"、定不了"角色"**：两个令牌同值时，"谁赢"取决于 `color.json` 的**排序**
（实例：`case_paper` 与 `ink_text_bright` 同为 `#F5EFE2`，纸色令牌把**文字位置**抢走了）。
所以每加一批令牌都要跑 `_tools/token_roles.js`（角色审计）。

### 7.3 颜色门禁七条规则（`_tests/_test_color_tokens.js`）

| 规则 | 内容 | 为什么 |
|:--|:--|:--|
| ① | `base` / `dark` 令牌表对齐 | 深色缺键会**回落 base 值** ⇒ 该令牌不随主题变化（静默看错） |
| ② | 可令牌化位置上不得有未登记色值 | 判定按位置：颜色属性白名单 / 紧邻三元兄弟是令牌 / 所在函数返回 `ResourceColor` |
| ③ | 运行时取色名必须存在 | 画布用 `getColorByNameSync('名字')`，写错是**运行时**错、编译不报 |
| ④ | 不得把色值藏在声明为 `string` 的地方 | 这类位置令牌化不了、也拿不到浅色值（"初传干支看不清"就是这个形状） |
| ⑤ | 无死令牌（定义了却零引用） | 无用令牌制造"该用哪个"的二义性（配置文件引用的除外） |
| ⑥ | 色值字面量不得赋给"颜色字段" | `color: '#E9C878'` 这类值会被当 prop 传下去，规则②④都覆盖不到 |
| ⑦ | 状态栏可读性与连续性 | `bar_content` 对 `bar_bg` 必须 ≥4.5:1，且 `bar_bg` 必须等于页面顶部底色 `ink_bg`
（前者=图标看得见，后者=状态栏不被单独切割）。**起因**：1.0.5 首包取色失败回落成深色 ⇒ 深底深图标、状态栏图标全看不见 |

### 7.4 对比度口径（`_tools/contrast_audit.js`）

- **正文 ≥4.5:1；大字（≥24fp，或 ≥18.66fp 且粗体）与图标/边界 ≥3:1。**
- 依据：官方 `homecheck ColorContrastCheck`（`> 4.5:1`，只覆盖文字，**会解析资源令牌**）
  ＋ 应用市场自检口径"图标/标题 > 3:1"。
- **半透明必须先合成到底色再算**；浅/深**两遍**都跑。
- **只卡"有语义的边界与状态"**：`border`/`borderColor`（含三元，即选中态）、`divider({color})`、`.color()`；
  不卡 `shadow`、渐变、常量发丝线 border、以及全部背景填充（本 App 的"选中"靠金边框 + 文字色表达，
  10% 淡底在数学上到不了 3:1，不算语义边界）。
- **跨文件 prop 追溯**：`fontColor(this.color)` 这类会沿调用点追（`_tools/prop_trace.js`：
  直接值 → 表达式 → 帮助函数 return → `this.fn()[i].field` → `this.fn()[i].field.sub`）。
  解析不到的**从提示升级为判否**（2026-09-19）：可在该站点行写 `contrast-ok: 理由` 显式豁免（理由必填）。
- **覆盖边界（知道它看不见什么）**：本工具只扫**声明式 UI**；**Canvas 绘制的内容完全不在扫描面内**
  （天地盘 `ctx.fillStyle = tok(res,'令牌')`）—— 那块由 `_tools/panlayer_contrast.js` 单独出报告
  （层间"彼此可分辨"的阈值待拍板，故该工具**只报告、不入 check_all**）。


### 7.5 呈现纪律（产品级）

- **引擎出数、App 出呈现**：读数（干支生克、旺衰、旬空、神煞）由引擎算，界面只负责把它讲清楚；
  不得在界面里重算或写死盘面事实（`_test_component_audit` 的 A1–A4 专门抓这个）。
- **三种"空"必须区分**：① 确实无 ② 规则表未加载/缺内容（警示色）③ 未填未开。空态**要说话**
  （原因取自 `ReasonText` 登记表），**不留白、不给现实结论、不出现数据文件名**。
- **点宫速查卡 / 规则表速查栏 / 数据健康徽标**：点天地盘任一宫给该宫情；工具区给规则表状态；
  缺表要显式提示。

---

### 7.6 应用市场自检口径：系统栏与转场（已写成门禁）

这两条是**审核直接提过**的要求，不是可选项；都已有门禁看住，改界面时别绕过。

**① 状态栏适配**（`_test_color_tokens` 规则⑦）

- 图标颜色要依状态栏背景选黑/白，保证可读；状态栏区域**不要被单独切割**（背景与页面顶部连续）；
  状态栏内不要出现左右对比过大的配色（本 App 为单一纯色，天然满足）。
- 实现：`model/ThemeStore.ets` 的 `apply()` 用**能力上下文的 `resourceManager`** 取 `bar_bg`/`bar_content`
  （**不要**用 `win.getUIContext().getHostContext()` —— 在 `onWindowStageCreate` 里 `loadContent` 之前拿不到，
  异常被吞后会把图标色回落成深色，就是首包自检失败的成因）；**取不到就整块不设**，绝不设对比度不确定的颜色。

**② 全屏页面转场**（`_test_page_transition`）

- 用系统转场（`pageTransition()`）、**淡入淡出**（只声明 `.opacity(0)`），
  **不得**单帧直切、**不得**左右平移或上下位移（不写 `slide`/`translate`/`scale`），曲线用**弹簧曲线**。
- **时长按设备物理尺寸分档**：<8.5in ≥200ms、8.5–12in ≥250ms、>12in ≥300ms。
  实现：`model/TransitionFx.ets` —— 用 `display` 的像素分辨率与 DPI 算物理英寸，
  取各档**上限**（220/280/320ms）而非下限；取不到尺寸回落 320ms（要求是"不短于"，最长档在任何设备都合规）。
- 新增全屏页面时，**必须**照抄这四行转场声明（门禁会逐个 `@Entry` 页面校验）。

## 8. 发布记录（新 → 旧）

- **1.0.5 / 1000005（在架：2026-09-19 自检通过 → 提审 → 2026-09-20 正式上架）**：`APP/release_pkg/LiurenFocusDiviner-free-release-signed.app`
  （1,579,759 字节，sha256 `75EA0549FB1CCBF4DD7CB94DD7D3E5D597784EE7F65003ECDDB30F12440AC083`）。
  上架留档（字节相同）：`APP/release_pkg/archive/LiurenFocusDiviner-free-release-signed-1.0.5-onshelf-20260920.app`。
  源码锚点：`v1.0.5-submitted` 与 `v1.0.5-onshelf` 均指 **`c1769b2`**（App 源码最后一次变更）；
  注意 `v1.0.5-packaged` 标在**首刀** `2ba22f3`（自检失败那版），**不是**本包锚点。
  **第三包自检又提一条 → 已修 → 再出**：转场**时长**被点名「全屏页面转场 ≥8.5in 200ms / 8.5–12in 250ms
  / >12in 300ms」。根因：我上一版把时长写死 260ms —— 手机与中等平板够，**大屏（>12in）不达标**。
  修法：新增 `model/TransitionFx.ets`，用 `display.getDefaultDisplaySync()` 的像素分辨率与 DPI 算
  **物理英寸**（对角线像素 / DPI），按档取时长并**取各档上限而非下限**：<8.5in → 220、8.5–12in → 280、
  >12in → 320（都留余量）；**取不到尺寸则回落 320**（要求是"不短于"，取最长档在任何设备都合规）。
  7 个页面统一改为 `duration: TransitionFx.pageDur()`；门禁 `_test_page_transition.js` 增两条：
  写死的时长若 <300 判不合格、且必须走 `pageDur()`（已变异验证）。
  **第二包自检又提一条 → 已修 → 再出**：页面转场被点名「建议使用系统转场，页面转场采用淡入淡出，
  不应单帧直接切换、左右平移或上下位移，曲线优先使用弹簧曲线」。
  根因：7 个 `@Entry` 页面原先**都没声明 `pageTransition`** ⇒ 走系统默认（左右平移）。
  修法：每个页面统一声明 `pageTransition()` —— `PageTransitionEnter/Exit`（Push 与 Pop 各一对，
  「duration 260」）**只声明 `.opacity(0)`**（不写 slide/translate/scale ⇒ 无位移），
  曲线用 `curves.springCurve(0.6, 1, 320, 34)`；并新增门禁 `_tests/_test_page_transition.js`
  （逐个 @Entry 页面校验：必须声明转场、必须用 opacity、不得出现位移/缩放、曲线必须是弹簧曲线；
  两条变异均已验证会报警）。
  **首包自检失败 → 已修 → 重出**：首包（1,576,985 / `A9D950D9…408F`）被应用市场自检判"状态栏图标被深色挡住"。
  根因是 `ThemeStore` 取色走 `win.getUIContext().getHostContext()`，而它在 `onWindowStageCreate`
  （`loadContent` 之前）拿不到 host context → 异常被吞 → `statusBarContentColor` 回落成深色 ⇒ 深底深图标。
  修法：① 取色改走**能力上下文的 `resourceManager`**；② **取不到就整块不设**（宁可保持系统默认，
  也绝不设对比度不确定的颜色）；③ `bar_bg` 深色值 `#17150F → #14120F`（与页面顶部 `pan_core`/`ink_bg` 同色，
  消除"状态栏被单独切割"）；④ 新增颜色门禁**规则⑦**（`bar_content` 对 `bar_bg` 必须 ≥4.5:1 且 `bar_bg` 须等于 `ink_bg`，已变异验证）。
  流水线四项全过：`verify_free_edition` → `assembleApp` → `verify-app success` → `verify_app_pkg` 16/16。
  标签 `v1.0.5-packaged`。内容要点：浅色主题（`base` 浅色值 81 个令牌，双主题对比度 0 违规）
  ＋ 天地盘画布改为运行时按令牌取色 ＋ 主题开关（**默认深色**，系统栏跟随）
  ＋ 排盘"初传/第一课"特殊背景移除（原设计让干支掉到 3.1:1）＋ 颜色令牌门禁六条规则
  ＋ 无用 import 门禁 ＋ 对比度门禁跨文件 prop 追溯；**引擎 `core/` 与 1.0.4 逐字节一致**。
  ⚠ 浅色主题**未做真机目视验证**（只有计算出的对比度与构建/签名证据）。
- **1.0.4 / 1000004（历史，2026-09-15 提交 → 2026-09-16 上架 → 2026-09-20 被 1.0.5 取代）**：包
  `APP/release_pkg/archive/LiurenFocusDiviner-free-release-signed-1.0.4-onshelf-20260916.app`
  （1,559,532 字节，sha256 `26BC3317…930E5`；包内 versionName=1.0.4、versionCode=1000004、
  requestPermissions=0、收费块数据 ABSENT）。源码锚点 `v1.0.4-submitted`、`v1.0.4-onshelf`。
- **1.0.3 / 1000003（历史，2026-09-11 上架 → 2026-09-16 被 1.0.4 取代）**。
- **1.0.1 / 1000001（历史，2026-08-26 上架 → 2026-09-11 被 1.0.3 取代）**。
  早期版本的详细记录见 `鸿蒙规范文档/商店页文案与截图清单.md` §11–§18。

---

## 9. 常见坑（都真踩过，别再踩）

| 坑 | 现象 | 做法 |
|:--|:--|:--|
| **CRLF** | 脚本里用 `\n` 拼多行去匹配文件 → 匹配不到、静默不改 | 逐行处理（`split(/\r?\n/)`）或先探测 eol |
| **脚本转义** | 在生成脚本里写 `\n`、内层引号 → 生成出语法错的文件 | 用数组 `join('\n')` 或模板字符串；复杂补丁直接写成独立模块文件 |
| **宽 `git checkout`** | `git checkout -- <大目录>` 把并发/未提交的真实改动一起回滚 | 只还原**具体文件**；变异测试**先提交再变异** |
| **`git checkout` 改行尾** | 本机 `core.autocrlf=true`：**哪怕只还原单个文件**，工作区行尾也会 LF→CRLF；而 `git status`/`git diff` **显示干净** → 但 `verify_free_edition` 的逐字节比对 **FAIL**（主版 CRLF vs 免费版 LF，报"源码树不一致"） | **已由 `.gitattributes`（`* text=auto eol=lf`）从根上堵住**（2026-09-19；实测：把文件改成 CRLF 再 `git checkout --`，还原回来 **0 CRLF**）。为什么不用 `-text`：见该文件头部说明（那会让 200+ 个 CRLF 文件立刻变成"已修改"）。仍须注意两点：① 变异还原后**必跑** `verify_free_edition`；② **过渡期**：工作区现存 217 个 CRLF 文件，其中 App 源码一旦被 checkout 就会变 LF，而免费版里还是 CRLF → 校验会**响亮地** FAIL，跑一次 `_ets_pipeline.js`（内含同步）即可，别用 `git checkout` 反复"修" |
| **并发 `check_all`** | 变异型门禁互相踩 → 工作区被静默污染 | 独占跑；入口有锁，别绕过 |
| **值匹配的二义性** | 按值令牌化时同值令牌"谁赢"取决于排序 | 令牌化后跑 `token_roles.js`（角色审计） |
| **免费版不同步** | 主版改了、免费版是旧的，编出来却 BUILD SUCCESSFUL | 改完必跑 `sync_free_edition.py`；出包前置门禁会兜 |
| **pwsh 处理 CJK** | `Get-Content` 默认编码把中文读成乱码、`Set-Content` 写回就毁文件 | **不要用 shell 改源码**；用文件工具或 node 脚本 |
| **文档整段替换** | 替换时顺手删掉相邻内容 | 整段替换后**必须回读** |
| **手改生成物** | 改了 `model/pan/*.ets`，下次重建被覆盖 | 改 `core/liuren/**`，用 `_ets_pipeline.js` 重建 |
| **手改剧情/案例数据** | 锚点写错、抄别案的事实、全库字符串替换、同案不同支线同名 `clue.id` 串改 | 改 `rawfile/ancient/{case_gallery,case_story}.json` 前先读**专文 §9.1 的十条纪律**；改完必跑 `_test_case_story.js` + `export_case_story_web.js`；作用域细到**案 id / 支线 id**；工具打印的字段路径要与引擎实际结构一致（如旬空在 `c.dx.xunkong`） |
| **拿天盘支当宫用** | 点天地盘**天盘**层的「卯」（它此刻画在地盘戌的位置上），宫情卡却弹出「地盘卯宫 · 天盘申」——与所点无关（用户 2026-09-20 实测） | 根因：`palaceLookup`/`readXiangCard` **只认地盘宫**；地盘宫与天盘支取值域同为十二支、`c.tp` 又是**全键**，所以传天盘支进去必被当成"同名地盘宫"，引擎注释里"按天盘支反查"那条分支**永不触发**（等于不可达）。做法：点「天盘」层先换算 `gongOf(tp, 支)` → 传宫（`Index.pickZhongGong` 一直是对的；`openPalaceCard` 已按此订正，卡标题也改成「天盘X加地盘Y宫」）。**新写点盘逻辑时按此口径** |
| **免费版同步"清空后崩"** | `python _tools/sync_free_edition.py` 直接跑：`remove_internet()` 里 `import remove_request_permissions` 抛 `ModuleNotFoundError`（本机 python 以 safe-path 运行，脚本目录不在 `sys.path[0]`；`verify_free_edition.py` 自己能过是因为它先补了 sys.path）→ 而 `sync(clean=True)` **已经清空免费版**，于是免费版停在半成品（`module.json5` 的 INTERNET 权限、`string.json` 的权限文案均未处理），`verify_free_edition` 报"源码树不一致" | **已修**（2026-09-20）：脚本顶部显式补 `sys.path` + 把该依赖改为**加载期** import（缺依赖会在清空之前就报错，不再毁树）。仍须注意：① 直接跑过同步后**必跑** `verify_free_edition`；② 真被清空时重跑一次 `sync_free_edition.py` 即可重建（它是幂等的） |

---

## 10. 文档地图（谁对什么权威）

| 文档 | 权威范围 | 维护方式 |
|:--|:--|:--|
| **本文（Agent.md）** | **操作权威**：真源边界、门禁、同步、版本递进、常见坑、发布记录 | 收口时就地订正，并推进头部「最近更新 / 更新前 main HEAD」 |
| `鸿蒙规范文档/视觉风格/*` | 色彩/字体/图标/圆角/间隔规范 ＋ 本项目令牌清单、实现方式决定、剩余色值分类 | 改配色/主题时同步 |
| `鸿蒙规范文档/商店页文案与截图清单.md` | 商店文案与截图素材 ＋ 历次发布记录（§11–§18） | 每次上架前更新 |
| `大六壬文档/**` | 六壬内容：案例剧情方案与样张、各批审阅清单、速查表、口径对读 | 补内容时同步 |
| `大六壬文档/案例剧情/剧情补录方案与样张.md` | **写案契约**：字段与硬校验、六步写法、七法、四个坑、锚点可点可达规则 | 改契约时同步（写剧情前必读） |
| `大六壬文档/案例剧情/古籍案例鉴赏-设计与进度.md` | **收费块专文**：设计动因与已定口径、数据结构、剧情进度快照、App/原型两侧 UI、收费边界、门禁、下一步 | 每补完一批剧情更新其快照与批次表 |
| `_tools/*.js` 头部注释 | 每个工具的口径、用法与踩坑记录（含"一次性迁移脚本"标记） | 改工具时同步 |

> 调色板的**唯一真源是 `resources/{base,dark}/element/color.json` 本身**。
> `_tools/` 下若干脚本（`tokenize_colors` / `overlay_tokens` / `pending_colors` / `case_palette` /
> `pandisk_tokens` / `light_palette` / `color_helper_upgrade`）是**一次性迁移工具，已执行完毕**，
> 作用是留下"这批令牌当初怎么来的"记录 —— **不要把它们当调色板真源，也不要日常改色时改它们。**

---

## 11. 当前状态与下一步

**已完成（2026-09-20 收口）**：**1.0.5 已上架** —— 出包共 4 刀（§8 逐个记着指纹与来龙去脉：
首包自检失败 → 状态栏修复 → 转场淡入淡出 → 转场时长分档）；浅色主题在代码层面完整（浅色值 + 画布运行时取色
+ 开关 + 对比度双主题 0 违规）；门禁 **46 项**、全量 46/46 PASS（§3.4）；仓库与远端同步、本版标签已推。

**待办分两类**：A 类只有用户能做（新会话**别自己认领**，也别把已拍板的再问一遍）；B 类我可以继续推进。

**A. 需要用户（真机 / 目视 / 拍板）** —— 2026-09-20 状态：**1.0.5 已上架**；三项已确认 + 一条阈值待拍板；
未结项 = 第 2 条④（杀进程重开）、第 5 条（层间阈值）与新增的第 6 条（古籍挂账 4 项）。

1. ~~1.0.5 第 4 包的真机自检~~ **已确认**（用户反馈：自检通过）：状态栏（图标可见、与页面连续）与转场
   （淡入淡出、无位移、手感）都是真机目视项 —— AI 只保证 API 用法正确 + 编译通过 + 门禁卡住可机械判定的点。
2. **浅色主题真机目视**：① 默认启动是否深色 ② 切换后页面与状态栏是否一起变浅
   ③ 排盘页天地盘是否变浅、四课三传是否外观一致 —— **①②③ 用户已确认（2026-09-19）**；
   **④ 杀进程重开后是否记住选择：尚未确认**。
3. ~~商店截图的目视核对~~ **已确认**（用户 2026-09-19 人眼看过，基本无问题）：`APP/screenshots_out/1.05/`
   （gitignored）1080×1920 深/浅两张 + `cropped_off/` 四条被裁条带。规格侧 AI 已像素级复核：
   裁切量顶 111 / 底 43、缩放 918 + 左右各 81 = 1080、补边同色（深 `#13120E` / 浅 `#F1F0EB`）。
4. ~~是否提审~~ **已上架**（2026-09-19 自检通过 → 提审 → **2026-09-20 正式上架**）。包：
   `APP/release_pkg/LiurenFocusDiviner-free-release-signed.app`（1,579,759 B / sha256 `75EA0549…AC083`），
   上架留档 `archive/…-1.0.5-onshelf-20260920.app`（字节相同）。标签：`v1.0.5-submitted` 与
   `v1.0.5-onshelf` 均打在 **`c1769b2`**（App 源码最后一次变更；`v1.0.5-packaged` 标在首刀 `2ba22f3`，
   那是自检失败那版，不能当本包锚点）。**已随本次收口推送远端**（main + 全部标签）。
5. **天地盘层间"彼此可分辨"的阈值拍板**（新）：`_tools/panlayer_contrast.js` 已出完整报告，
   但要落成门禁需你定口径 —— 报告末尾给了 A/B/C 三条候选（关键在 B：层间色差 ≥1.5:1 还是 2:1，
   或认可"只靠半径 + 字号区分"即可）。**拍板前该工具保持"只报告"**；拍板后加判据 + 变异验证再入 `check_all`。
6. **古籍案例鉴赏历批挂账的 4 项待你定**（2026-09-20 从各批《审阅清单》抽并到**专文 §10.3**，逐条有证据）：
   ① **中黄遁干口径之争**——速查表**表3 整体有误**、有份整理稿把「时干」当「变干」、`case_gallery.json` 那 5 条
   `reasoning[].role="cross"` 中黄参证与复算不符（**属随包数据，按纪律未动**），要不要按复算值订正；
   ② 是否给原型补「**中黄盘**」可点面（时干/变干/变干宫乘将六亲）—— 补上后中黄 5 案可各加一条遁干线索，是它们与其余案真正的差异点；
   ③ 审计器「`small` 可达性」判据**是否升级为「并集化」模型**（第三～六批连续挂账，余 11 条真建模缺口，**改数据消不掉**）；
   ④ 是否给 `renzhan_jiazi_011_xue_xingren` 补一条异占支线（它至今只有原占）。

**B. 我可以继续推进的工程项（按价值排序）**

1. **补完古籍剧情最后 4 案**（`renzhan_wuchen_053/056/058`、`renzhan_dingmao_047`）—— **纯内容，不需拍板**：
   按专文 §9 六步 + §9.1 十条纪律写，每案 1 原占 + 1 异占；跑 `_test_case_story.js` → `export_case_story_web.py`，并出该批《审阅清单》。
2. **把「一局多占」推演移植进 App 的案例鉴赏（收费块）** —— 本块真正的卖点，目前只能在浏览器体验（专文 §6.3）。
   复用现成 `PanDisk`/`KegCard` 与锚点高亮；**继承原型已定型的规则**（可点面并集化、`small` 只指到格/传/课、沉思两段式、点错不罚），
   并顺手清掉原型那几处小瑕疵（专文 §6.2 末：过期的「现有 8 案」、失效的 `六甲` 筛选与「月令」chip、从未生效的 `DEFAULT_ENDINGS`）。
3. 订正《第七批 4 案-审阅清单》的笔误（「一至六批 37 案」应为 **35 案**；总数 41 正确）。
4. 工程侧上一轮两项（天地盘逐格对比度、跨文件 prop 追溯深度）**已完成**，见下「已了结的记录」；
   下一个工程项由 A 类第 5 条（层间阈值拍板）解锁。

**已了结的记录（留着免得反复被提起）**

- **跨文件 prop 追溯深度 已加固**（2026-09-19）：`prop_trace.js` 新增 **L4b**（`this.fn()[i].field.sub`：
  取 `field` 的对象字面量，或裸标识符所绑定的对象字面量里的 `sub`）；`contrast_audit.js` 把
  **「无法解析」从提示升级为判否**（可写 `contrast-ok: 理由` 显式豁免，理由必填，与 `layout-ok` 同一约定）——
  留成提示的话，写法深一层就会静默失去覆盖，而报告照样 PASS（§3.3 第 4 条的翻版）。
  变异验证三条：`M1` 深链无法解析 → exit 1 并报出站点与传入表达式（ChuanCard.ets:42 ← Index.ets）＋
  `M2` 补上 `deep: { color }` 后 L4b 认账 → exit 0 ＋ `M3` 站点行写 `contrast-ok` → exit 0（豁免 1 处）；均逐字节还原。
- **天地盘逐格对比度 报告已出**（2026-09-19）：新增 `_tools/panlayer_contrast.js`（**只报告、不入 check_all**：
  没有阈值的门禁就是"永远为绿的假门禁"）。它解析 Canvas 取色（**含局部别名** `const goldBright = tok(...)`，
  第一版漏过 ⇒ 天盘支看起来没有亮金、天将没有朱砂）、按层归属（天将/天盘支/遁干/地盘支/中黄标记/辅助层/用神高亮）、
  双主题算"每层对底色"与"层间色差"。结论：**每层对底色均达标**（最差 `pan_cinnabar` 4.48:1）；
  但同宫四层的 52 对里有 **4 对是同一令牌**（天将↔遁干同为 `brand_gold_deep`；天盘支/遁干/地盘支共用 `pan_di`），
  28 对至少一个主题 <1.5:1 ⇒ **颜色这条轴几乎不出力，区分实际靠半径位置 + 字号**（0.412/0.335/0.255/0.165w 与 0.048/0.06/0.044/0.068）。
  改色/加令牌会改包，**1.0.5 审核期间不动颜色**。
- **全量门禁 46 项重跑 已完成**（2026-09-19）：**46/46 PASS，275.7 s**（含 231.6 s 变异自检；
  跑完源头逐字节还原、工作区干净）；同日快档 **42/42 PASS**（9.4 s）。
  此后仓库只新增文档与工具、未动 App 与引擎，故该结论仍有效。
- `sign_release.py` 归档命名缺陷 **已修**（2026-09-19）：归档时改为读**包内 `pack.info` 的 `version.name`**，
   即"标这个包自己是哪一版"；读不到则标 `prev`（宁可标不清，也不标错）。
   自测（用现存包实读）：在架 1.0.4 包 → `1.0.4`、当前包 → `1.0.5` ✓，正是当初被标错的那个案例。
   新增函数 `_version_of_package()`；§5 的旧"已知缺陷"一节已就地改为当前行为说明。

**已接受、不再清理的项（写下来免得反复被提起）**：

- `_test_docs_structure` 对**非活文档**（无「本文档更新前 main HEAD」标记，152 个）的结构问题只 WARN、不判否。
  目前剩 **24 处「标题编号重复」**，全部来自两个"分篇、每篇从 1 编号"的文档：
  `大六壬文档/毕法赋/毕法赋的真正用法.md`（4 处）与 `鸿蒙规范文档/ArkTS开发规范指南.md`（20 处）。
  这是**写法而非缺陷**（GitHub 锚点按整条标题生成，不会冲突），且后者是随仓库带入的规范参考材料 ——
  不做重编号，避免为一处 WARN 去改参考文档的编号体系。
- 其中**唯一真缺陷已修**（2026-09-19）：`ArkTS开发规范指南.md` 第 2346 行的开围栏一直没闭合，
  导致第 2563 行起的标题与内容被渲染进代码块；已在第 2562 行前补上闭合围栏（围栏数 135 → 136 = 偶数）。

**不要做**：擅自升版本号、手改生成物、绕过唯一入口挑着跑门禁、并发跑 `check_all`、
在界面里重算盘面事实、把收费块数据放进免费包。

---

## 12. 旧章节号对照（本文件 2026-09-19 重写为"当前态"）

重写时删掉了历史叙事与已完成的迁移记录，**章节号变了**。以下是旧 §N 现在去哪里 ——
主要给**生成物里改不动的注释**用（`model/pan/*.ets`、`model/{LiurenCore,bifa}.ets` 头部写着
「见 Agent.md §13」，那些文件由 `_ets_pipeline.js` 生成，**不要为了改注释去手改它们**）。

| 旧章节 | 现在的位置 |
|:--|:--|
| §2 硬纪律 | §0「怎么用这份文档」＋ §7.5「呈现纪律」＋ §9「常见坑」 |
| §3 免费版/收费版边界、安装共存 | §1「两个版本」＋ §4「免费版同步」 |
| §4 目录结构与职责 | §2「真源与生成链」 |
| §5 Git 情况 | §6「版本递进」（标签与锚点约定） |
| §6 中黄天地盘 UX v1 | §1 功能列表（产品行为以代码与门禁为准） |
| §7 商店页与截图节奏 | §10 文档地图 → `鸿蒙规范文档/商店页文案与截图清单.md` |
| §8 古籍案例库进展、topics 词表、剧情「一局多占」 | §2.2 ＋ `大六壬文档/案例剧情/剧情补录方案与样张.md` |
| §9 工程命令、案例反验、各项反验配方 | §3「门禁体系」＋ §5「构建与出包」＋ §9「常见坑」 |
| §10 常见坑 | §9（同名保留） |
| §11 下一步实施建议 | §11「当前状态与下一步」 |
| §11.5–11.9 引擎历次修正（天将顺逆 / 昴星 / 遁干 / 涉害等） | **已删**：行为真源是 `core/liuren/**` ＋ 对应门禁；过程看 git 历史 |
| §12 给后续 AI 的操作建议 | §0 ＋ §9 |
| §13 引擎组件化方案（已执行） | **已删**：现状见 §2.1（生成链与基线 tag `v1.0.4-pre-componentize`） |
| §14 / 14.1–14.8 空态纪律、数据健康、点宫速查、规则表速查 | §7.5「呈现纪律」 |
| 「读象读数：引擎出数 / App 出呈现」 | §7.5 第一条 |

**为什么删而不留**：这些是"我们从旧形态转到现在"的过程记录，迭代多个版本后已不再指导日常操作；
保留会让读者把精力花在考古上。真源与门禁才是当下的权威 —— 过程需要时查 git。

---

## 13. 附录：目录树 · 页面流程 · 不入库 · 合规口径

> 原 README.md 的独有内容并入此处（README 现仅作指路牌，自身不再承载事实，避免两处漂移）。

### 13.1 仓库目录树

根目录文件：`Agent.md`（**唯一权威文档**）· `AGENTS.md`（自动加载用指路牌，零事实）·
`README.md`（给人看的门面，零事实）· `.gitattributes`（行尾统一 `* text=auto eol=lf`，见 §9）·
`package.json`（`node_modules` 仅测试/工具链用，不进包）。

```
├─ core/                       # ★ 引擎真源：liuren/**.ts
│   └─ liuren-core.js          #   生成物（build_core.js 重建）——勿手改
├─ APP/LiurenFocusDiviner/     # 鸿蒙主项目（全功能开发版，唯一源码树）
│   └─ entry/src/main/
│       ├─ ets/pages/          #   Splash(引导) Home(起课台) Index(排盘) Cases(课例) Ancient(古籍) Legal/(协议)
│       ├─ ets/components/     #   PanDisk(天地盘canvas) KegCard ChuanCard YongShenSheet CaseBoard
│       │                      #   AncientStudy AncientCaseGallery PalaceCard RuleHealth* TagBadge …
│       ├─ ets/model/          #   ★ 生成物：pan/*.ets、LiurenCore/bifa/zhonghuang.ets（_ets_pipeline.js 重建）
│       │                      #   手写：DataLoader CaseStore YongShenCore ThemeStore TransitionFx ReasonText RuleHealth
│       ├─ ets/FeatureFlags.ets#   版本形态开关（免费版同步脚本置隐藏项）
│       ├─ ets/pay/            #   付费门禁（PayConfig/PayGate/IapAdapter；过审版全功能开放）
│       └─ resources/          #   ★ 视觉真源：base/(浅色) dark/(深色) element/{color,float}.json + rawfile/(数据)
├─ APP/LiurenFocusDivinerFree/ # 免费上架版 —— 生成物，不入库（sync_free_edition.py 重建）
├─ UI/                         # Web 原型（独立 HTML，无构建）：万年历起课 / 壬案推演 / 排盘教学 / 浅色主题对比
├─ 大六壬文档/                 # 六壬内容：案例剧情（**收费块专文**＋写案契约＋各批审阅清单）、速查表、经文校对
├─ 鸿蒙规范文档/               # 鸿蒙规范文档 + 本项目令牌清单/实现方式决定/商店页文案与截图清单
├─ 万年历JSON数据/             # 历法底座（json/ 1900–2060 分片 + ext/ 校验扩展）
├─ _tests/                     # 门禁（46 项，见 §3）
├─ _tools/                     # 构建 / 生成 / 同步 / 打包 / 门禁工具（每个文件头部写着自己的口径）
└─ tools/                      # 历法数据再生成脚本（.pyext 依赖，不入库）
```

### 13.2 页面流程

```
Splash(引导) → Home(起课台：万年历+时辰+排盘/课例/古籍三入口)
   ├─ 排盘 → Index(自动出盘：四柱 / 天地盘 / 四课 / 三传 / 毕法 / 年命行年 / 中黄；‹改期回 Home)
   ├─ 课例 → Cases(保存的排盘记录，点卡片恢复重排)
   └─ 古籍 → Ancient(中黄五变经：目录+阅读；主版另含「案例鉴赏」页签，免费版同步时隐藏入口)
三页页头统一 PageHeader（标题 + 排盘/课例/古籍 胶囊切换 + 返回）
```

### 13.3 哪些内容不入库（.gitignore 要点）

- `.pyext/`（Python 依赖 + JPL 星历 623MB）、`node_modules/`
- 构建产物：`APP/*/build`、`.hvigor`、`.idea`、`oh_modules`、`*.hap`/`*.app`、`release_pkg/`
- `APP/LiurenFocusDivinerFree/`（免费版是生成物）
- `APP/APPCerts/`（签名证书，本机私有资产）
- 万年历 csv/db/xls（由 json 分片派生）、经文 PDF 扫描件（135MB，md 转录版已入库）
- `_backup/`（历史快照）

### 13.4 合规口径（应用市场审核相关，逐条遵守）

- 应用名「六壬读象」；核心排盘为纯历法计算；古籍为原文照录 + 整理校勘标注（【存疑】弱化展示）
- 断语均挂「古籍断法 · 传统文化研习参考」框架，**非替用户做命运判断**
- 年命/行年/太岁/中黄/毕法教练的"建议"类文案统一降级为「古籍云/按九宗门法」陈述并挂研习参考；
  详见 `鸿蒙规范文档/合规文案落地清单.md`（由门禁 `_test_compliance_wording` 看住）
- 免费版**零权限、无任何付费痕迹**，与「无收费项」申报一致（见 §4）
- 页面根容器只扩展底部安全区、不沉浸状态栏，避免标题/按钮与状态栏遮挡（华为 UX 审核要求）

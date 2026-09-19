# Agent.md —— LargeLiuRen Design 操作手册（当前态）

> 写给后续 AI / 开发者：**先读这份，再动代码**。
> 最近更新：2026-09-19（浅色主题与令牌体系落地 → 门禁扩到 45 项 → 1.0.5 出包）
> 本文档更新前 main HEAD：`2ba22f3 发布：1.0.5 出包记录与归档命名缺陷`

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

---

## 1. 这个 App 是什么

**大六壬排盘与读象**（墨底金文风格）。核心功能：

- **排盘**：天地盘（画布绘制：天将 / 天盘支 / 遁干 / 地盘支 / 中心月将）、四课、三传、课体、旬空标记、用神高亮。
- **读象**：以干支生克与课传结构出"读象清单"，引擎出数、App 出呈现（见 §7.5）。
- **毕法赋教练**：一百法逐条对照、课体判定、差在哪。
- **古籍案例库**：原文 + 复算对照 + 「一局多占」剧情推演（剧情数据见 §2.2）。
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
**写剧情前必读**。剧情也会导出给 Web 原型：`_tools/export_case_story_web.py` → `UI/_data/case_story.js`，
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
node _tools/check_all.js            # 全量 45 项，实测 ≈ 415 s（含 349 s 变异自检）
node _tools/check_all.js --fast     # 快档 41 项，实测 ≈ 11 s —— 改完随手跑
node _tools/check_all.js --only component_audit   # 只跑名字含该子串的项
node _tools/check_all.js --list     # 打印清单（含慢档标记）
```

⛔ **绝对不要并发跑两次**：`gate_mutation_check.js` 会**在原地变异真源**验证门禁有效性，跑完再还原。
两个实例同时跑会互相踩（真实事故：主版 `Index.ets` 的真实改动被回滚、变异行被提交进历史）。
入口已加文件锁 `.check_all.lock`（带 pid 存活检测），并发启动直接拒绝（exit 9）。
**若确认那个进程已死**，删掉锁文件再跑。

### 3.2 45 项按保护面分组

| 保护面 | 门禁 |
|:--|:--|
| **引擎**（`core/liuren/**`） | `_test_core_smoke` `_test_core_regress` `_core_snapshot` `_api_parity` `build_core --check` `_test_no_hardcode` `_test_sanchuan_spec` `_test_keti` `_test_jiangpan` `_test_jiangpan_all` `_test_jiangpan_rules` `_test_dungan` `_test_palace` `_test_readxiang` `_test_readxiang_single_source` `_test_zhonghuang` `_test_zhonghuang_analyze` `_test_zhonghuang_dun` `_test_xingnian` `_test_nianming2` `_test_selectDuyu` `_test_bifa_keti` `_test_bifa_coach` `_test_coach2` |
| **数据**（rawfile） | `_test_rule_health` `_test_ancient_case` `_test_ancient_gallery` `_test_case_story` `_test_case_story_web` `_test_case_xu_cibin` `case_story_audit` |
| **UI / 组件** | `_test_component_audit`（慢） `_test_ui_layout` `_test_ui_foreach_key` `_test_ui_empty_state` `_test_empty_state` `_test_navutil` |
| **颜色 / 主题** | `_test_color_tokens`（六条规则，见 §7.3） `contrast_audit`（浅/深双跑） |
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

2026-09-19 全量 **45/45 PASS**（414 s，含 349 s 变异自检）—— 即"每个门禁都被证明能抓住它该抓的问题"。

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

**已知缺陷（2026-09-19 发现，待修）**：归档步骤把**上一个包**贴上**当前版本号**的标签
（本次把在架 1.0.4 包归档成 `…-1.0.5-20260913-1800.app`）。核验字节相同后已删除该误导副本；
脚本应改为标上一个包的版本（或加 `prev` 标记）。

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

### 7.3 颜色门禁六条规则（`_tests/_test_color_tokens.js`）

| 规则 | 内容 | 为什么 |
|:--|:--|:--|
| ① | `base` / `dark` 令牌表对齐 | 深色缺键会**回落 base 值** ⇒ 该令牌不随主题变化（静默看错） |
| ② | 可令牌化位置上不得有未登记色值 | 判定按位置：颜色属性白名单 / 紧邻三元兄弟是令牌 / 所在函数返回 `ResourceColor` |
| ③ | 运行时取色名必须存在 | 画布用 `getColorByNameSync('名字')`，写错是**运行时**错、编译不报 |
| ④ | 不得把色值藏在声明为 `string` 的地方 | 这类位置令牌化不了、也拿不到浅色值（"初传干支看不清"就是这个形状） |
| ⑤ | 无死令牌（定义了却零引用） | 无用令牌制造"该用哪个"的二义性（配置文件引用的除外） |
| ⑥ | 色值字面量不得赋给"颜色字段" | `color: '#E9C878'` 这类值会被当 prop 传下去，规则②④都覆盖不到 |

### 7.4 对比度口径（`_tools/contrast_audit.js`）

- **正文 ≥4.5:1；大字（≥24fp，或 ≥18.66fp 且粗体）与图标/边界 ≥3:1。**
- 依据：官方 `homecheck ColorContrastCheck`（`> 4.5:1`，只覆盖文字，**会解析资源令牌**）
  ＋ 应用市场自检口径"图标/标题 > 3:1"。
- **半透明必须先合成到底色再算**；浅/深**两遍**都跑。
- **只卡"有语义的边界与状态"**：`border`/`borderColor`（含三元，即选中态）、`divider({color})`、`.color()`；
  不卡 `shadow`、渐变、常量发丝线 border、以及全部背景填充（本 App 的"选中"靠金边框 + 文字色表达，
  10% 淡底在数学上到不了 3:1，不算语义边界）。
- **跨文件 prop 追溯**：`fontColor(this.color)` 这类会沿调用点追（`_tools/prop_trace.js`：
  直接值 → 表达式 → 帮助函数 return → `this.fn()[i].field`）。解析不到的会**打印成清单**，不静默跳过。

### 7.5 呈现纪律（产品级）

- **引擎出数、App 出呈现**：读数（干支生克、旺衰、旬空、神煞）由引擎算，界面只负责把它讲清楚；
  不得在界面里重算或写死盘面事实（`_test_component_audit` 的 A1–A4 专门抓这个）。
- **三种"空"必须区分**：① 确实无 ② 规则表未加载/缺内容（警示色）③ 未填未开。空态**要说话**
  （原因取自 `ReasonText` 登记表），**不留白、不给现实结论、不出现数据文件名**。
- **点宫速查卡 / 规则表速查栏 / 数据健康徽标**：点天地盘任一宫给该宫情；工具区给规则表状态；
  缺表要显式提示。

---

## 8. 发布记录（新 → 旧）

- **1.0.5 / 1000005（待提交，2026-09-19 出包）**：`APP/release_pkg/LiurenFocusDiviner-free-release-signed.app`
  （1,576,985 字节，sha256 `A9D950D997F2575AC500EE702FB9B317252789C860D478396441AE38D376408F`）。
  流水线四项全过：`verify_free_edition` → `assembleApp` → `verify-app success` → `verify_app_pkg` 16/16。
  标签 `v1.0.5-packaged`。内容要点：浅色主题（`base` 浅色值 81 个令牌，双主题对比度 0 违规）
  ＋ 天地盘画布改为运行时按令牌取色 ＋ 主题开关（**默认深色**，系统栏跟随）
  ＋ 排盘"初传/第一课"特殊背景移除（原设计让干支掉到 3.1:1）＋ 颜色令牌门禁六条规则
  ＋ 无用 import 门禁 ＋ 对比度门禁跨文件 prop 追溯；**引擎 `core/` 与 1.0.4 逐字节一致**。
  ⚠ 浅色主题**未做真机目视验证**（只有计算出的对比度与构建/签名证据）。
- **1.0.4 / 1000004（在架，2026-09-15 提交 → 2026-09-16 审核通过上架）**：包
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
| **并发 `check_all`** | 变异型门禁互相踩 → 工作区被静默污染 | 独占跑；入口有锁，别绕过 |
| **值匹配的二义性** | 按值令牌化时同值令牌"谁赢"取决于排序 | 令牌化后跑 `token_roles.js`（角色审计） |
| **免费版不同步** | 主版改了、免费版是旧的，编出来却 BUILD SUCCESSFUL | 改完必跑 `sync_free_edition.py`；出包前置门禁会兜 |
| **pwsh 处理 CJK** | `Get-Content` 默认编码把中文读成乱码、`Set-Content` 写回就毁文件 | **不要用 shell 改源码**；用文件工具或 node 脚本 |
| **文档整段替换** | 替换时顺手删掉相邻内容 | 整段替换后**必须回读** |
| **手改生成物** | 改了 `model/pan/*.ets`，下次重建被覆盖 | 改 `core/liuren/**`，用 `_ets_pipeline.js` 重建 |

---

## 10. 文档地图（谁对什么权威）

| 文档 | 权威范围 | 维护方式 |
|:--|:--|:--|
| **本文（Agent.md）** | **操作权威**：真源边界、门禁、同步、版本递进、常见坑、发布记录 | 收口时就地订正，并推进头部「最近更新 / 更新前 main HEAD」 |
| `鸿蒙规范文档/视觉风格/*` | 色彩/字体/图标/圆角/间隔规范 ＋ 本项目令牌清单、实现方式决定、剩余色值分类 | 改配色/主题时同步 |
| `鸿蒙规范文档/商店页文案与截图清单.md` | 商店文案与截图素材 ＋ 历次发布记录（§11–§18） | 每次上架前更新 |
| `大六壬文档/**` | 六壬内容：案例剧情方案与样张、各批审阅清单、速查表、口径对读 | 补内容时同步 |
| `_tools/*.js` 头部注释 | 每个工具的口径、用法与踩坑记录（含"一次性迁移脚本"标记） | 改工具时同步 |

> 调色板的**唯一真源是 `resources/{base,dark}/element/color.json` 本身**。
> `_tools/` 下若干脚本（`tokenize_colors` / `overlay_tokens` / `pending_colors` / `case_palette` /
> `pandisk_tokens` / `light_palette` / `color_helper_upgrade`）是**一次性迁移工具，已执行完毕**，
> 作用是留下"这批令牌当初怎么来的"记录 —— **不要把它们当调色板真源，也不要日常改色时改它们。**

---

## 11. 当前状态与下一步

**已完成**：1.0.5 出包（§8）；全量门禁 45/45 PASS；浅色主题在代码层面完整
（浅色值 + 画布运行时取色 + 开关 + 对比度双主题 0 违规）。

**待办（按优先级）**：

1. **浅色主题真机目视验证**（唯一没做的验证）：① 默认启动是否深色 ② 切换后页面与状态栏是否一起变浅
   ③ 排盘页天地盘是否变浅、四课三传是否外观一致 ④ 杀进程重开是否记住选择。没有设备就做不了。
2. **`sign_release.py` 归档命名缺陷**（§5）：应标上一个包的版本，而不是当前版本。
3. 盘面**逐格**对比度（天支/地盘支/乘将/神煞四层彼此可分辨）目前只覆盖"语义边界 3:1"口径，
   未逐格验；需要的话补一个盘面专用审计。
4. 跨文件 prop 追溯只覆盖一层数据对象字段；更深的间接（例如经多层函数返回）会落进"无法解析"清单
   （会被打印，不会静默）。
5. 商店页素材若要展示浅色主题，需要补一组浅色截图（默认仍是深色，现有截图不算错）。

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

```
├─ core/                       # ★ 引擎真源：liuren/**.ts
│   └─ liuren-core.js          #   生成物（build_core.js 重建）——勿手改
├─ APP/LiurenFocusDiviner/     # 鸿蒙主项目（全功能开发版，唯一源码树）
│   └─ entry/src/main/
│       ├─ ets/pages/          #   Splash(引导) Home(起课台) Index(排盘) Cases(课例) Ancient(古籍) Legal/(协议)
│       ├─ ets/components/     #   PanDisk(天地盘canvas) KegCard ChuanCard YongShenSheet CaseBoard
│       │                      #   AncientStudy AncientCaseGallery PalaceCard RuleHealth* TagBadge …
│       ├─ ets/model/          #   ★ 生成物：pan/*.ets、LiurenCore/bifa/zhonghuang.ets（_ets_pipeline.js 重建）
│       │                      #   手写：DataLoader CaseStore YongShenCore ThemeStore ReasonText RuleHealth
│       ├─ ets/FeatureFlags.ets#   版本形态开关（免费版同步脚本置隐藏项）
│       ├─ ets/pay/            #   付费门禁（PayConfig/PayGate/IapAdapter；过审版全功能开放）
│       └─ resources/          #   ★ 视觉真源：base/(浅色) dark/(深色) element/{color,float}.json + rawfile/(数据)
├─ APP/LiurenFocusDivinerFree/ # 免费上架版 —— 生成物，不入库（sync_free_edition.py 重建）
├─ UI/                         # Web 原型（独立 HTML，无构建）：万年历起课 / 壬案推演 / 排盘教学 / 浅色主题对比
├─ 大六壬文档/                 # 六壬内容：案例剧情方案与样张、各批审阅清单、速查表、经文校对
├─ 鸿蒙规范文档/               # 鸿蒙规范文档 + 本项目令牌清单/实现方式决定/商店页文案与截图清单
├─ 万年历JSON数据/             # 历法底座（json/ 1900–2060 分片 + ext/ 校验扩展）
├─ _tests/                     # 门禁（45 项，见 §3）
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

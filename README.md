# LiurenFocusDiviner（六壬读象）

大六壬排盘与读象研习应用（HarmonyOS / ArkTS），含同构 Web 原型与 TypeScript 引擎。

> **先读哪份文档？**
> 本 README 是**入口概览**（是什么、在哪、怎么跑）。
> 真源边界、门禁体系、免费版同步、版本递进、常见坑、发布记录 —— 一律以
> **[`Agent.md`](Agent.md)** 为准（它是操作权威）。两者冲突时以 `Agent.md` 为准。
>
> 当前状态：**1.0.5 / 1000005**（已出包待提交；上架形态是**免费版**）。发布记录见 `Agent.md` §8。

---

## 1. 仓库结构

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
├─ _tests/                     # 门禁（45 项，见 §4）
├─ _tools/                     # 构建 / 生成 / 同步 / 打包 / 门禁工具（每个文件头部写着自己的口径）
└─ tools/                      # 历法数据再生成脚本（.pyext 依赖，不入库）
```

**一张表说清真源**（改代码改哪里）：

| 改什么 | 改哪里 | 产物（**勿手改**） |
|:--|:--|:--|
| 排盘 / 读象算法 | `core/liuren/**`（TypeScript） | `core/liuren-core.js`、`APP/.../ets/model/pan/*.ets`、`model/{LiurenCore,bifa,zhonghuang}.ets` |
| 规则表 / 古籍案例 / 剧情 | `APP/.../rawfile/{rule,cal,ancient}/*.json` | 剧情另导出 `UI/_data/case_story.js` |
| 配色 / 主题 | `resources/{base,dark}/element/{color,float}.json` | 无（画布用 `getColorByNameSync` 运行时取色） |
| 界面 / 组件 | `APP/.../ets/{pages,components}/**` | 无 |

## 2. 页面流程

```
Splash(引导) → Home(起课台：万年历+时辰+排盘/课例/古籍三入口)
   ├─ 排盘 → Index(自动出盘：四柱 / 天地盘 / 四课 / 三传 / 毕法 / 年命行年 / 中黄；‹改期回 Home)
   ├─ 课例 → Cases(保存的排盘记录，点卡片恢复重排)
   └─ 古籍 → Ancient(中黄五变经：目录+阅读；主版另含「案例鉴赏」页签，免费版同步时隐藏入口)
三页页头统一 PageHeader（标题 + 排盘/课例/古籍 胶囊切换 + 返回）
```

## 3. 双版本策略

**差异规则只有 5 条，唯一真源是 [`_tools/sync_free_edition.py`](_tools/sync_free_edition.py)**：

1. 复制源码（`entry/src`、`AppScope`、配置），排除构建产物
2. `PayConfig.PREVIEW_FREE` 写为 `false`（过审版全功能开放、无锁无付费痕迹，与「无收费项」申报一致）
3. `FeatureFlags.SHOW_ANCIENT_CASE_GALLERY` 写为 `false`（案例鉴赏入口隐藏）
4. 从免费版 `rawfile` **删除收费块数据**（案例鉴赏 / 剧情）—— HAP 即 zip、JSON 明文，随包发出等于公开
5. 移除 `module.json5` 的 INTERNET 权限与权限理由文案（保持**零权限**申报）

判定方（`verify_free_edition.py`、打包脚本）一律复用该文件的 `diff_against()`，**不得另写白名单**。
收费架构已解耦预埋（`pay/` 门禁 + featureId），未来收费版卖"深度断课能力"增量，免费版保持全功能开放。

## 4. 常用命令

```bash
# ① 构建（需 D:\HarmonyOS\command-line-tools-6.1.1-release）
cd APP/LiurenFocusDiviner
hvigorw assembleHap --mode module -p product=default --no-daemon

# ② 门禁：唯一入口（不要凭记忆挑着跑）
node _tools/check_all.js            # 全量 45 项 ≈ 415 s（含 349 s 门禁有效性自检）
node _tools/check_all.js --fast     # 快档 41 项 ≈ 11 s —— 改完随手跑
node _tools/check_all.js --only component_audit   # 只跑名字含该子串的项
node _tools/check_all.js --list     # 清单
#    ⛔ 绝不要并发跑两次：变异型门禁会原地改真源（入口有文件锁，别绕过）

# ③ 免费版：同步 + 校验 + 出正式签名包（产物在 APP/release_pkg/）
python _tools/sync_free_edition.py       # 改完主版必须重跑，否则免费版是旧代码却 BUILD SUCCESSFUL
python _tools/verify_free_edition.py
python _tools/sign_release.py free       # 上架包（release 签名 + 零权限）
python _tools/sign_release.py main       # 开发版备用包

# ④ 引擎重建（改了 core/liuren/** 之后）
node _tools/build_core.js                # → core/liuren-core.js
node _tools/_ets_pipeline.js             # → APP 侧 model/*.ets（含免费版同步与校验）

# ⑤ 数据再生成
python _tools/gen_ancient_json.py        # 经文 md → rawfile/ancient/zhonghuang_jing.json
python _tools/export_case_story_web.py   # 剧情 → UI/_data/case_story.js（两个测试会校验同步）
```

## 5. 主题与配色（1.0.5 起）

- **默认深色**（墨底金文），应用内可切**浅色**（`ThemeStore` 持久化偏好；系统栏跟随）。
- 颜色令牌两套同名不同值：`resources/base/`（浅色，方案 A 偏金黄）、`resources/dark/`（深色），
  共 81 个；**两表令牌名必须完全一致**（门禁①）。
- 硬规则：**不得写死色值**（门禁②④⑥）、**不得有死令牌**（⑤）、**运行时取色名必须存在**（③）、
  **对比度**正文 ≥4.5:1 / 大字与边界 ≥3:1（`contrast_audit` 浅深双跑）。
- 画布（天地盘）不能用 `$r()`，用 `getColorByNameSync` 运行时取当前主题色值。
- 令牌细节见 `鸿蒙规范文档/视觉风格/设计令牌清单.md`；残留与原因见 `剩余色值分类清单.md`。

## 6. 合规口径

- 应用名「六壬读象」；核心排盘为纯历法计算；古籍为原文照录 + 整理校勘标注（【存疑】弱化展示）
- 断语均挂「古籍断法 · 传统文化研习参考」框架，非替用户做命运判断
- 年命/行年/太岁/中黄/毕法教练的"建议"类文案统一降级为「古籍云/按九宗门法」陈述，并挂研习参考；
  详见 `鸿蒙规范文档/合规文案落地清单.md`
- 免费版零权限、无任何付费痕迹，与「无收费项」申报一致
- 页面根容器只扩展底部安全区，不沉浸状态栏，避免标题/按钮与状态栏遮挡（华为 UX 审核要求）

## 7. 不入库的内容（.gitignore）

- `.pyext/`（Python 依赖 + JPL 星历 623MB）、`node_modules/`
- 构建产物：`APP/*/build`、`.hvigor`、`.idea`、`oh_modules`、`*.hap`/`*.app`、`release_pkg/`
- `APP/LiurenFocusDivinerFree/`（免费版是生成物）
- `APP/APPCerts/`（签名证书，本机私有资产）
- 万年历 csv/db/xls（由 json 分片派生）、经文 PDF 扫描件（135MB，md 转录版已入库）
- `_backup/`（历史快照）

## 8. 版本与发布

版本真源是 `APP/LiurenFocusDiviner/AppScope/app.json5`（`versionName` `1.0.X` ↔ `versionCode` `100000X`）。
标签约定：`vX.Y.Z-packaged`（出包）→ `-submitted`（提审）→ `-onshelf`（上架）。
**升版本号必须由用户明确要求**；出包、归档、提审与发布记录的完整规则见 `Agent.md` §5–§6、§8。

# LiurenFocusDiviner（六壬读象）

大六壬排盘研习应用（HarmonyOS / ArkTS），含同构 Web 原型与 TypeScript 核心。

## 目录结构

```
├─ APP/LiurenFocusDiviner/     # 鸿蒙主项目（开发/收费版，唯一事实源）
│   └─ entry/src/main/ets/
│       ├─ pages/              #   Splash(引导) Home(起课台) Index(排盘) Cases(课例) Ancient(古籍) Legal/(协议)
│       ├─ components/         #   PanDisk/KegCard/ChuanCard/YongShenSheet/CaseBoard/AncientStudy/AncientCaseGallery/PageHeader 等
│       ├─ model/              #   LiurenCore(引擎) DataLoader CaseStore YongShenCore
│       ├─ FeatureFlags.ets    #   版本形态开关（主版显示案例鉴赏；免费版同步脚本置隐藏）
│       └─ pay/                #   付费门禁（PayConfig/PayGate/IapAdapter；当前全功能开放）
├─ APP/LiurenFocusDivinerFree/ # 免费上架版 —— 不入库，由同步脚本生成（见下）
├─ core/                       # 跨端核心（liuren-core.ts → .js Web；ArkTS 版在 APP 内同构）
├─ UI/                         # Web 原型（大六壬万年历起课.html）+ _data 规则数据
├─ 大六壬文档/                 # 理论文档 + 规则 JSON + 中黄五变经（经文 md/校对记录）
├─ 万年历JSON数据/             # 历法底座（json/ 1900-2060 分片 + ext/ 校验扩展）
├─ 鸿蒙规范文档/               # ArkTS 规范 / 付费架构 / 合规分析
├─ _tests/                     # node 回归测试（核心/中黄/毕法/课体/盘式解析…）
├─ _tools/                     # 构建/同步/打包/生成脚本
└─ tools/                      # 历法数据再生成脚本（.pyext 依赖，不入库）
```

## 页面流程

```
Splash(引导) → Home(起课台：万年历+时辰+排盘/课例/古籍三入口)
   ├─ 排盘 → Index(自动出盘：四柱/天地盘/四课/三传/毕法/年命行年/中黄；‹改期回 Home)
   ├─ 课例 → Cases(保存的排盘记录，点卡片恢复重排)
   └─ 古籍 → Ancient(中黄五变经：目录+阅读，盘式结构化渲染；主版另含「案例鉴赏」页签，免费版同步时隐藏入口)
三页页头统一 PageHeader（标题 + 排盘/课例/古籍 胶囊切换 + 返回）
```

## 双版本策略

- **主项目（收费/开发版）是唯一源码**；免费上架版由 `python _tools/sync_free_edition.py`
  整体复制生成，并保持 `PayConfig.MODE='free'`（过审版全功能开放、无锁无付费痕迹）
  + `FeatureFlags.SHOW_ANCIENT_CASE_GALLERY=false`（案例鉴赏随包隐藏）
  + 移除 INTERNET 权限及权限理由文案；同步后可跑 `python _tools/verify_free_edition.py`
  校验这些不变量。
- 付费架构已解耦预埋（`pay/` 门禁 + featureId），未来收费版卖"深度断课能力"增量
  （毕法教练 / 中黄引擎 / 抓用神深度），免费版保持全功能开放（与"无收费项"申报一致）。

## 常用命令

```bash
# 构建（需 D:\HarmonyOS\command-line-tools-6.1.1-release）
cd APP/LiurenFocusDiviner
hvigorw assembleHap --mode module -p product=default --no-daemon

# 免费版：同步 + 出正式签名包（产物在 APP/release_pkg/）
python _tools/sync_free_edition.py
python _tools/sign_release.py free     # 上架包（release 签名 + API12 + 零权限）
python _tools/sign_release.py main     # 收费/开发版备用包

# 核心回归测试（node）
node _tests/_test_core_regress.js
node _tests/_test_zhonghuang.js
node _tests/_test_case_xu_cibin.js   # 古籍案例鉴赏锚点（七月甲子日午将申时）
node _tests/_test_ancient_gallery.js # 案例鉴赏库批量反验（case_gallery.json expect）

# 古籍数据再生成（28 篇经文 md → rawfile/ancient/zhonghuang_jing.json）
python _tools/gen_ancient_json.py
```

## 不入库的内容（.gitignore）

- `.pyext/`（Python 依赖 + JPL 星历 623MB）、`node_modules/`
- 构建产物：`APP/*/build`、`.hvigor`、`.idea`、`oh_modules`、`*.hap/*.app`、`release_pkg/`
- `APP/APPCerts/`（签名证书，本机私有资产）
- 万年历 csv/db/xls（由 json 分片派生）、经文 PDF 扫描件（135MB，md 转录版已入库）
- `_backup/`（历史快照，git 历史取代之）

## 合规口径

- 应用名「六壬读象」；核心排盘为纯历法计算；古籍为原文照录 + 整理校勘标注（【存疑】弱化展示）
- 断语均挂「古籍断法 · 传统文化研习参考」框架，非替用户做命运判断
- 免费版零权限、无任何付费痕迹，与「无收费项」申报一致
- 页面根容器只扩展底部安全区，不沉浸状态栏，避免标题/按钮与状态栏遮挡（华为 UX 审核要求）

# LiurenFocusDiviner（六壬读象）

大六壬排盘研习应用（HarmonyOS / ArkTS），含同构 Web 原型与 TypeScript 核心。

## 目录结构

```
├─ APP/LiurenFocusDiviner/   # 鸿蒙主项目（开发/收费版，唯一事实源）
│   └─ entry/src/main/ets/   #   pages/Index(排盘工作台+页签) model/(核心) components/ pay/(门禁)
├─ APP/LiurenFocusDivinerFree/ # 免费上架版 —— 不入库，由同步脚本生成（见下）
├─ core/                     # 跨端核心（liuren-core.ts → .js Web；ArkTS 版在 APP 内同构）
├─ UI/                       # Web 原型（大六壬万年历起课.html）+ _data 规则数据
├─ 大六壬文档/                # 理论文档 + 规则 JSON + 中黄五变经（经文 md/校对记录）
├─ 万年历JSON数据/            # 历法底座（json/ 1900-2060 分片 + ext/ 校验扩展）
├─ 鸿蒙规范文档/              # ArkTS 规范 / 付费架构 / 合规分析
├─ _tests/                   # node 回归测试（核心 5724/5724、中黄、毕法、课体…）
├─ _tools/                   # 构建/补丁/同步/打包脚本
└─ tools/                    # 历法数据再生成脚本（.pyext 依赖，不入库）
```

## 双版本策略

- **主项目（收费/开发版）是唯一源码**；免费上架版由 `python _tools/sync_free_edition.py`
  整体复制生成，并自动设置 `PayConfig.PREVIEW_FREE=false`（当前策略：过审版全功能开放、
  无锁无付费痕迹）+ 移除 INTERNET 权限。
- 收费版上架后如需在免费版做锁定导流：改同步脚本一行（PREVIEW_FREE=true）并同步更新商店申报。

## 常用命令

```bash
# 构建（需 D:\HarmonyOS\command-line-tools-6.1.1-release）
cd APP/LiurenFocusDiviner
hvigorw assembleHap --mode module -p product=default --no-daemon

# 免费版：同步 + 出正式签名包（产物在 APP/release_pkg/）
python _tools/sync_free_edition.py
python _tools/sign_release.py free

# 核心回归测试（node）
node _tests/_test_core_regress.js
node _tests/_test_zhonghuang.js

# 古籍数据再生成（28 篇经文 md → rawfile/ancient/zhonghuang_jing.json）
python _tools/gen_ancient_json.py
```

## 不入库的内容（.gitignore）

- `.pyext/`（Python 依赖 + JPL 星历 623MB）、`node_modules/`
- 构建产物：`APP/*/build`、`.hvigor`、`.idea`、`oh_modules`、`*.hap/*.app`、`release_pkg/`
- `APP/APPCerts/`（签名证书，本机私有资产）
- 万年历 csv/db/xls（由 json 分片派生）、经文 PDF 扫描件（135MB，md 转录版已入库）
- `_backup/`（历史快照，git 历史取代之）

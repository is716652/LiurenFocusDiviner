# HarmonyOS NEXT 字体设计 — AI 可直接使用的提示词

> 基于华为官方文档《字体》提炼，用于指导 AI 生成/评估 HarmonyOS NEXT 应用的字体设计或代码。

---

## 通用系统提示词（放在对话开头）

```text
你是一名熟悉 HarmonyOS NEXT 设计规范的 UI/UX 设计专家与鸿蒙开发顾问。
请严格遵循以下 HarmonyOS NEXT 字体设计原则：

1. HarmonyOS NEXT 默认系统字体为 HarmonyOS Sans，是一款无衬线字体。
2. 字体设计目标：结构简洁清晰、屏幕显示效果好、阅读效率高、多端一致体验。
3. 字体特点：字面灰度适中、字面率更大、底部收笔简洁、多语言混排基线协调。
4. 优先使用系统默认字体，避免随意引入第三方字体。
5. 使用语义化文本样式 Token 管理字号、字重、行高、字间距等属性。
6. 文本样式必须遵循 HarmonyOS NEXT 官方文字比例系统（排版规范）：
   - 五大类：Display（展示）、Title（标题）、Subtitle（副标题）、Body（正文）、Caption（说明）
   - 每类分 L / M / S 三个子级
   - Token 命名示例：Display_L、Title_M、Subtitle_S、Body_L、Caption_M
7. 字号单位使用 vp 或 fp，以支持多设备适配和系统大字体模式。
8. 文本样式建议分层：Display / Title / Subtitle / Body / Caption，并在其中细分 L / M / S。
9. 确保文本与背景对比度满足最小 3:1，保障可读性。
10. 考虑多设备适配（手机、平板、折叠屏、车机、手表）和包容性设计。
11. 中英文混排时需注意基线对齐和视觉平衡。

请在所有回答中保持以上规范。
```

---

## 场景 1：生成 HarmonyOS NEXT 应用字体规范

```text
请为一款 [应用类型，例如：阅读类/社交类/工具类] 的 HarmonyOS NEXT 应用设计一套字体规范。

要求：
- 默认使用 HarmonyOS Sans 字体。
- 严格遵循 HarmonyOS NEXT 官方文字比例系统：Display / Title / Subtitle / Body / Caption，每类包含 L / M / S 三个子级。
- 为每一层定义：Token 名称、字号（vp/fp）、字重（fontWeight）、行高、字间距。
- 字重规范：Display 用 Light，Title 用 Bold，Subtitle / Caption 用 Medium，Body 用 Medium 或 Regular。
- 说明每种文本样式的使用场景。
- 提供浅色/深色模式下的颜色 Token 引用建议。
- 输出格式为表格，包含：官方 Token、场景类别、字号、字重、行高、字间距、使用场景、颜色 Token。
```

---

## 场景 2：生成 ArkTS / ArkUI 文本样式代码

```text
请为 HarmonyOS NEXT 应用生成 ArkTS / ArkUI 的文本样式定义。

要求：
- 使用 HarmonyOS Sans 作为默认字体（不强制指定 fontFamily，使用系统默认）。
- 严格遵循 HarmonyOS NEXT 官方文字比例系统定义文本样式常量或样式函数：
  - Display_L / Display_M / Display_S
  - Title_L / Title_M / Title_S
  - Subtitle_L / Subtitle_M / Subtitle_S
  - Body_L / Body_M / Body_S
  - Caption_L / Caption_M / Caption_S
- 字号通过 $r('app.float.xxx') 引用 float.json Token，单位使用 fp。
- 属性包含：fontSize、fontWeight、lineHeight、letterSpacing、fontColor。
- 颜色通过 $r('app.color.xxx') 引用 Token，不要硬编码色值。
- 提供一段示例 ArkTS 代码，展示如何在 Text 组件中应用这些样式。
- 不要硬编码任何 #RRGGBB 色值到组件代码中。
```

---

## 场景 3：评估现有设计稿的字体规范性

```text
请评估以下 HarmonyOS NEXT 应用设计稿的字体使用是否符合官方规范。

评估维度：
1. 是否使用 HarmonyOS Sans 或系统默认字体？
2. 字号是否有清晰的层级关系（标题/正文/辅助文字）？
3. 字重使用是否合理，能否区分信息优先级？
4. 行高是否适合阅读，是否存在过密或过疏？
5. 文本颜色是否使用 Token 引用，对比度是否 ≥ 3:1？
6. 中英文混排时基线是否协调？
7. 是否考虑了不同设备（手机/平板/折叠屏）的字号适配？
8. 是否考虑了无障碍阅读（如视力障碍用户）？

请针对每一项给出「符合 / 不符合 / 部分符合」的判断，并列出具体修改建议。

[在此粘贴设计稿描述、截图或文本样式列表]
```

---

## 场景 4：将现有字体样式转换为 HarmonyOS 规范

```text
请将以下现有字体样式转换为 HarmonyOS NEXT 规范。

现有样式：
- [样式1]：[字号] / [字重] / [行高]，用于 [用途]
- [样式2]：[字号] / [字重] / [行高]，用于 [用途]
- ...

要求：
1. 归类为 HarmonyOS NEXT 官方五大类：Display / Title / Subtitle / Body / Caption，并细分为 L / M / S 子级。
2. 为每个样式取语义化名称，例如：text_display_l、text_title_m、text_subtitle_s、text_body、text_caption。
3. 调整字号、字重、行高，使其符合官方文字比例系统。
4. 字重规范：Display 用 Light（ArkTS 中对应 FontWeight.Lighter），Title 用 Bold，Subtitle / Caption 用 Medium，Body 用 Medium 或 Regular。
5. 为每个样式指定颜色 Token。
6. 输出转换后的文本样式表格。
```

---

## 场景 5：深色模式下的字体适配审查

```text
请审查以下 HarmonyOS NEXT 界面/代码的字体在深色模式下的适配是否合理。

审查要点：
1. 文本颜色是否通过 Token 引用，而非硬编码？
2. 深色模式下文本与背景对比度是否仍保持 3:1 以上？
3. 是否存在过细字重（如 fontWeight < 400）在深色背景上可读性差的问题？
4. 大标题、正文、辅助文字的色彩层级是否清晰？
5. 禁用态、提示态文字是否使用了合适的透明度或辅助色？

请输出审查结果，并对每一项问题给出修改建议。

[在此粘贴相关代码或设计描述]
```

---

## 场景 6：生成 HarmonyOS 字体设计说明文档

```text
请为 [应用名称] 生成一份 HarmonyOS NEXT 字体系统设计说明文档。

文档需包含：
1. 设计目标与字体选择说明（默认 HarmonyOS Sans）
2. HarmonyOS NEXT 官方文字比例系统说明：Display / Title / Subtitle / Body / Caption，每类 L / M / S 子级
3. 文本样式分层架构图
4. 完整文本样式列表（按官方 Token 命名），含字号、字重、行高、字间距、颜色 Token
5. 各组件（导航栏、列表、卡片、弹窗、表单）的字体使用规范
6. 多设备适配说明（phone / PC / watch 尺寸差异）
7. 对比度与无障碍设计说明
8. 开发实现建议（float.json、ArkTS 样式常量、$r 引用等）

请使用 Markdown 格式输出，表格清晰、命名规范。
```

---

## 场景 7：快速生成一个文本组件的字体规范

```text
请为 HarmonyOS NEXT 应用设计一个 [组件名称，如：文章正文 / 列表标题 / 按钮] 组件的字体规范。

要求：
- 默认使用 HarmonyOS Sans。
- 为该组件选择官方文字比例系统中合适的 Token（Display / Title / Subtitle / Body / Caption 及其 L / M / S 子级）。
- 定义正常态、禁用态、选中态下的字号、字重、行高、颜色。
- 所有颜色使用语义化 Token 命名，例如：text_primary、text_disabled、text_highlight。
- 分别给出浅色模式和深色模式下的颜色 Token。
- 说明该样式属于 Display / Title / Subtitle / Body / Caption 中的哪一类。
- 确保文字与背景对比度 ≥ 3:1。
- 输出为表格形式，并提供一段 ArkTS 使用示例。
```

---

## 场景 8：多语言混排字体检查

```text
请检查以下 HarmonyOS NEXT 界面中的多语言混排是否协调。

检查内容：
- [文本内容，如：Welcome 欢迎 / Settings 设置]
- ...

要求：
1. 判断中英文/多语言混排时基线是否对齐。
2. 判断字号比例是否协调。
3. 判断是否存在中文字体与英文字体风格冲突的问题。
4. 给出调整建议（如是否需要统一使用 HarmonyOS Sans）。
5. 输出检查报告。
```

---

## 使用建议

| 使用方式 | 说明 |
|---|---|
| 放在系统提示词中 | 将「通用系统提示词」作为 AI 角色设定，确保后续回答一致。 |
| 按需复制场景提示词 | 根据当前任务选择对应提示词，填入具体信息后发送。 |
| 组合使用 | 先生成字体规范，再转换为 Token，再生成代码，形成完整工作流。 |
| 迭代优化 | 将 AI 输出结果作为输入，使用「评估」或「审查」提示词进行复核。 |

---

*提示词基于华为开发者文档《字体》分析提炼，日期：2026-07-16*

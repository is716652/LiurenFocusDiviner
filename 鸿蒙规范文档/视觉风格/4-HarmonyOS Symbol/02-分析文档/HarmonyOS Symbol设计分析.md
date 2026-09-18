# HarmonyOS Symbol 设计分析

> 来源：[华为开发者文档 - System Icons](https://developer.huawei.com/consumer/cn/doc/doccenter-ux-design/system-icons-0000001929854962)

---

## 一、网页核心内容概述

该页面是 **HarmonyOS NEXT 官方 UX 设计规范** 中关于「System Icons」的章节，主要介绍 HarmonyOS Symbol 的设计理念、核心特性和开发使用方式。

HarmonyOS Symbol 是 HarmonyOS 系统图标设计的重要演进，它将图标字体化、动态化、分层化，使图标能够与系统字体和交互深度融合。

---

## 二、HarmonyOS Symbol 核心特性分析

### 2.1 字体化设计：与文本融为一体

| 特性 | 说明 | 对开发的意义 |
|---|---|---|
| **基线对齐** | Symbol 与文本混排时能与字体基线对齐 | 在按钮、标签、列表等场景中，图标和文字天然对齐 |
| **字号联动** | 图标大小由 `fontSize` 控制 | 与文本使用同一套尺寸体系，无需单独定义图标尺寸 |
| **粗细无极变化** | 支持 100~900 的 fontWeight | 图标可随文本字重变化，保持视觉一致性 |

### 2.2 三种颜色渲染策略

| 策略 | 英文名 | 特点 | 适用场景 |
|---|---|---|---|
| **单色** | `SymbolRenderingStrategy.SINGLE` | 只使用第一个颜色，整体单色渲染 | 常规图标、工具栏图标、状态图标 |
| **分层** | `SymbolRenderingStrategy.MULTIPLE_OPACITY` | 使用一个颜色，按图层分配不透明度（如 100% / 50%） | 需要层次感的图标 |
| **多色** | `SymbolRenderingStrategy.MULTIPLE_COLOR` | 使用多个颜色，按图层顺序映射 | 需要丰富色彩的图标，如文件夹、徽章、多媒体 |

### 2.3 动效策略

HarmonyOS Symbol 将图标从静态元素升级为可交互组件：

| 动效 | 英文名 | 典型使用场景 |
|---|---|---|
| 无动效 | `SymbolEffectStrategy.NONE` | 默认静态展示 |
| 出现 | `SymbolEffectStrategy.APPEAR` | 图标首次进入视野 |
| 消失 | `SymbolEffectStrategy.DISAPPEAR` | 图标离开视野 |
| 弹跳 | `SymbolEffectStrategy.BOUNCE` | 点击反馈、成功提示 |
| 缩放 | `SymbolEffectStrategy.SCALE` | 强调、选中状态 |
| 替换 | `SymbolEffectStrategy.REPLACE` | 状态切换（如收藏/取消收藏） |
| 快速替换 | `SymbolEffectStrategy.REPLACE_EXCHANGE` | 快速状态切换 |
| 脉冲 | `SymbolEffectStrategy.PULSE` | 通知、提醒 |
| 可变颜色 | `SymbolEffectStrategy.VARIABLE_COLOR` | 动态数据展示 |
| 禁用 | `SymbolEffectStrategy.DISABLE` | 禁用态过渡 |

---

## 三、与鸿蒙开发的关系

### 3.1 对开发者的直接意义

| 方面 | 关系说明 |
|---|---|
| **无需额外资源** | Symbol 是系统内置资源，通过 `$r('sys.symbol.xxx')` 引用，无需引入 PNG/SVG 文件。 |
| **与文本统一** | 使用 `fontSize`、`fontWeight` 控制图标，与文本样式体系一致。 |
| **动态交互** | 支持动效策略，可轻松实现点击反馈、状态切换等交互效果。 |
| **视觉一致性** | 使用系统 Symbol 可确保应用与 HarmonyOS 系统风格保持一致。 |
| **性能优化** | 矢量字体渲染，自动适配不同分辨率，无需准备多倍图。 |

### 3.2 在 ArkTS / ArkUI 开发中的体现

- 使用 `SymbolGlyph` 组件展示独立图标。
- 使用 `SymbolSpan` 组件在文本中嵌入图标。
- 通过 `fontSize` 控制图标大小。
- 通过 `fontWeight` 控制图标粗细（100~900 或 `FontWeight` 枚举）。
- 通过 `fontColor` 数组控制颜色（支持单色/多色）。
- 通过 `renderingStrategy` 控制颜色渲染策略。
- 通过 `effectStrategy` 或 `symbolEffect` 控制动效。

---

## 四、启示与建议

### 4.1 设计启示

1. **优先使用系统 Symbol**
   - 系统 Symbol 经过精心设计，风格统一。
   - 可减少自定义图标的工作量，降低设计不一致风险。

2. **根据场景选择渲染策略**
   - 常规场景使用 SINGLE（单色）。
   - 需要层次和细节时使用 MULTIPLE_OPACITY（分层）。
   - 需要品牌色或丰富语义时使用 MULTIPLE_COLOR（多色）。

3. **合理运用动效**
   - 动效应服务于交互反馈，避免过度使用。
   - 常见用法：点击弹跳、状态替换、加载脉冲。

4. **保持与文本的视觉统一**
   - Symbol 的 `fontSize` 应与相邻文本字号协调。
   - Symbol 的 `fontWeight` 应与文本字重一致或略粗。

5. **语义化命名**
   - 使用 Symbol name ID 时，选择与功能语义匹配的图标。
   - 不要仅因美观而选择语义不相关的图标。

### 4.2 开发启示

1. **使用 Symbol 替代静态图标**
   - 对于系统已有 Symbol，优先使用 `$r('sys.symbol.xxx')` 而非自定义 PNG。
   - 减少包体积，提升渲染清晰度。

2. **颜色使用 Token**
   - 虽然 Symbol 支持直接设置颜色，但建议通过 `$r('app.color.xxx')` 或系统颜色引用。
   - 保持应用色彩体系一致性。

3. **注意 API 版本**
   - `SymbolGlyph` 等组件从 API version 12 开始支持在 ArkTS 卡片和元服务中使用。
   - 开发前确认 targetSdkVersion 是否满足要求。

4. **部分图标不支持 fontWeight**
   - 某些系统 Symbol（如 `sys.symbol.ohos_lungs`）不支持设置 `fontWeight`。
   - 开发时需测试目标 Symbol 是否支持预期属性。

5. **动效与状态管理结合**
   - 使用 `@State` 控制动效的触发。
   - 对于复杂动效，使用 `symbolEffect` 方法精确控制。

### 4.3 项目实践建议

| 场景 | 建议 |
|---|---|
| 工具栏图标 | 使用 `SymbolGlyph` + `SINGLE` 渲染 + 默认字号 |
| 按钮内图标 | 使用 `SymbolGlyph` + 与按钮文字相同的 `fontSize`/`fontWeight` |
| 状态切换 | 使用 `REPLACE` 或 `BOUNCE` 动效 |
| 文本内图标 | 使用 `SymbolSpan` 嵌入 `Text` 组件 |
| 品牌色彩图标 | 使用 `MULTIPLE_COLOR` + 品牌色 Token |
| 加载/提醒 | 使用 `PULSE` 或 `VARIABLE_COLOR` 动效 |

---

## 五、Symbol 使用决策树

```
是否需要图标？
  ├─ 系统 Symbol 库中是否有匹配图标？
  │    ├─ 是 → 使用 SymbolGlyph / SymbolSpan
  │    │         ├─ 需要多色？ → MULTIPLE_COLOR
  │    │         ├─ 需要层次？ → MULTIPLE_OPACITY
  │    │         └─ 常规使用 → SINGLE
  │    └─ 否 → 使用自定义图标（应用图标规范）
  └─ 是否需要动效？
       ├─ 是 → 选择 effectStrategy / symbolEffect
       └─ 否 → 默认静态展示
```

---

## 六、总结

HarmonyOS Symbol 是 HarmonyOS NEXT 在图标领域的重要创新，它将图标从静态图片升级为具备字体属性、颜色分层、动态效果的智能组件。

对于鸿蒙开发者而言，HarmonyOS Symbol 提供了：

- **更轻量的资源管理**：无需引入大量图标资源文件。
- **更一致的视觉体验**：与系统字体、文本样式深度融合。
- **更丰富的交互表达**：通过动效策略增强用户反馈。
- **更灵活的颜色定制**：单色、分层、多色三种渲染策略满足不同场景。

建议：

1. 优先使用系统 Symbol 替代自定义静态图标。
2. 根据场景选择合适的渲染策略和动效策略。
3. 保持 Symbol 与相邻文本在字号、字重、颜色上的一致性。
4. 对于系统 Symbol 无法表达的特殊品牌图形，再考虑自定义图标。

---

*分析时间：2026-07-16*

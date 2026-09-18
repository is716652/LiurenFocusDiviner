# HarmonyOS Symbol 使用示范

> 借鉴自：
> - `../03-AI提示词/HarmonyOS Symbol设计_AI工作流提示词.md`
> - `../02-分析文档/HarmonyOS Symbol设计分析.md`
>
> 本示例演示如何在 HarmonyOS NEXT 应用中使用 SymbolGlyph 和 SymbolSpan 组件。

---

## 一、核心原理

HarmonyOS Symbol 是系统内置的字体化图标资源：

1. **资源引用**：通过 `$r('sys.symbol.xxx')` 引用系统图标，无需引入 PNG/SVG。
2. **字体属性**：使用 `fontSize`、`fontWeight` 控制图标大小和粗细。
3. **颜色渲染**：通过 `fontColor` 数组和 `renderingStrategy` 实现单色/分层/多色效果。
4. **动效策略**：通过 `effectStrategy` 或 `symbolEffect` 实现动态交互效果。
5. **两种组件**：
   - `SymbolGlyph`：用于独立展示图标。
   - `SymbolSpan`：用于在文本中嵌入图标。

---

## 二、基础使用示例

### 2.1 独立图标 SymbolGlyph

```typescript
// entry/src/main/ets/pages/SymbolDemo.ets
@Entry
@Component
struct SymbolDemo {
  build() {
    Column({ space: 24 }) {
      // 基础 Symbol
      SymbolGlyph($r('sys.symbol.ohos_wifi'))
        .fontSize(48)
        .fontColor([$r('app.color.text_primary')])

      // 不同字重
      Row({ space: 24 }) {
        SymbolGlyph($r('sys.symbol.ohos_trash'))
          .fontSize(48)
          .fontWeight(FontWeight.Lighter)
          .fontColor([$r('app.color.text_primary')])

        SymbolGlyph($r('sys.symbol.ohos_trash'))
          .fontSize(48)
          .fontWeight(FontWeight.Normal)
          .fontColor([$r('app.color.text_primary')])

        SymbolGlyph($r('sys.symbol.ohos_trash'))
          .fontSize(48)
          .fontWeight(FontWeight.Bold)
          .fontColor([$r('app.color.text_primary')])
      }
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .backgroundColor($r('app.color.background'))
  }
}
```

---

## 三、三种颜色渲染策略

### 3.1 单色 (SINGLE)

```typescript
SymbolGlyph($r('sys.symbol.ohos_folder_badge_plus'))
  .fontSize(96)
  .renderingStrategy(SymbolRenderingStrategy.SINGLE)
  .fontColor([$r('app.color.brand_primary')])
```

### 3.2 分层 (MULTIPLE_OPACITY)

```typescript
SymbolGlyph($r('sys.symbol.ohos_folder_badge_plus'))
  .fontSize(96)
  .renderingStrategy(SymbolRenderingStrategy.MULTIPLE_OPACITY)
  .fontColor([$r('app.color.brand_primary')])
```

### 3.3 多色 (MULTIPLE_COLOR)

```typescript
SymbolGlyph($r('sys.symbol.ohos_folder_badge_plus'))
  .fontSize(96)
  .renderingStrategy(SymbolRenderingStrategy.MULTIPLE_COLOR)
  .fontColor([
    $r('app.color.brand_primary'),
    $r('app.color.brand_secondary'),
    $r('app.color.text_on_brand')
  ])
```

---

## 四、文本中嵌入图标 SymbolSpan

```typescript
Text() {
  Span('无线网络')
    .fontSize(16)
    .fontColor($r('app.color.text_primary'))

  SymbolSpan($r('sys.symbol.ohos_wifi'))
    .fontSize(16)
    .fontColor([$r('app.color.brand_primary')])

  Span(' 已连接')
    .fontSize(16)
    .fontColor($r('app.color.text_secondary'))
}
```

---

## 五、动效策略示例

### 5.1 点击弹跳反馈

```typescript
@Entry
@Component
struct SymbolAnimationDemo {
  @State triggerBounce: number = 0

  build() {
    Column({ space: 40 }) {
      SymbolGlyph($r('sys.symbol.ohos_heart_fill'))
        .fontSize(96)
        .fontColor([$r('app.color.brand_secondary')])
        .symbolEffect(
          new BounceSymbolEffect(EffectScope.WHOLE, EffectDirection.UP),
          this.triggerBounce
        )

      Button('点赞')
        .onClick(() => {
          this.triggerBounce++
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .backgroundColor($r('app.color.background'))
  }
}
```

### 5.2 状态替换（收藏 / 取消收藏）

```typescript
@Entry
@Component
struct FavoriteButtonDemo {
  @State isFavorite: boolean = false
  @State triggerReplace: number = 0

  build() {
    Column() {
      SymbolGlyph(this.isFavorite ? $r('sys.symbol.ohos_star_fill') : $r('sys.symbol.ohos_star'))
        .fontSize(48)
        .fontColor([$r('app.color.brand_secondary')])
        .symbolEffect(
          new ReplaceSymbolEffect(EffectScope.WHOLE),
          this.triggerReplace
        )
        .onClick(() => {
          this.isFavorite = !this.isFavorite
          this.triggerReplace++
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .backgroundColor($r('app.color.background'))
  }
}
```

### 5.3 脉冲动效（通知/提醒）

```typescript
@Entry
@Component
struct PulseDemo {
  @State isActive: boolean = true

  build() {
    Column({ space: 24 }) {
      SymbolGlyph($r('sys.symbol.ohos_bell_fill'))
        .fontSize(64)
        .fontColor([$r('app.color.brand_primary')])
        .symbolEffect(
          new PulseSymbolEffect(EffectScope.WHOLE),
          this.isActive
        )

      Button(this.isActive ? '停止提醒' : '开始提醒')
        .onClick(() => {
          this.isActive = !this.isActive
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .backgroundColor($r('app.color.background'))
  }
}
```

---

## 六、底部导航栏完整示例

```typescript
// entry/src/main/ets/pages/TabBarDemo.ets
@Entry
@Component
struct TabBarDemo {
  @State selectedIndex: number = 0

  private tabs: { title: string; icon: Resource; activeIcon: Resource }[] = [
    { title: '首页', icon: $r('sys.symbol.ohos_home'), activeIcon: $r('sys.symbol.ohos_home_fill') },
    { title: '发现', icon: $r('sys.symbol.ohos_compass'), activeIcon: $r('sys.symbol.ohos_compass_fill') },
    { title: '消息', icon: $r('sys.symbol.ohos_chat_bubble'), activeIcon: $r('sys.symbol.ohos_chat_bubble_fill') },
    { title: '我的', icon: $r('sys.symbol.ohos_person'), activeIcon: $r('sys.symbol.ohos_person_fill') }
  ]

  build() {
    Column() {
      // 内容区域
      Column() {
        Text(`当前选中：${this.tabs[this.selectedIndex].title}`)
          .fontSize(20)
          .fontColor($r('app.color.text_primary'))
      }
      .layoutWeight(1)
      .justifyContent(FlexAlign.Center)

      // 底部导航栏
      Row() {
        ForEach(this.tabs, (tab: { title: string; icon: Resource; activeIcon: Resource }, index: number) => {
          Column({ space: 4 }) {
            SymbolGlyph(this.selectedIndex === index ? tab.activeIcon : tab.icon)
              .fontSize(24)
              .fontWeight(this.selectedIndex === index ? FontWeight.Medium : FontWeight.Normal)
              .fontColor([
                this.selectedIndex === index ? $r('app.color.brand_primary') : $r('app.color.text_secondary')
              ])
              .renderingStrategy(SymbolRenderingStrategy.SINGLE)

            Text(tab.title)
              .fontSize(12)
              .fontColor(
                this.selectedIndex === index ? $r('app.color.brand_primary') : $r('app.color.text_secondary')
              )
          }
          .layoutWeight(1)
          .onClick(() => {
            this.selectedIndex = index
          })
        })
      }
      .width('100%')
      .height(64)
      .backgroundColor($r('app.color.surface'))
    }
    .width('100%')
    .height('100%')
    .backgroundColor($r('app.color.background'))
  }
}
```

---

## 七、关键借鉴点总结

1. **优先使用系统 Symbol**
   - 通过 `$r('sys.symbol.xxx')` 引用，无需额外资源文件。

2. **与文本统一 styling**
   - 使用 `fontSize` 和 `fontWeight` 控制图标，与文本样式体系一致。

3. **颜色使用 Token**
   - 通过 `$r('app.color.xxx')` 引用颜色，保持一致性和可维护性。

4. **根据场景选渲染策略**
   - 常规：SINGLE
   - 层次：MULTIPLE_OPACITY
   - 多彩：MULTIPLE_COLOR

5. **动效服务于交互**
   - 使用 `symbolEffect` 实现点击反馈、状态切换、提醒等动效。
   - 避免过度使用动效，保持界面简洁。

6. **独立 vs 文本内嵌**
   - 独立图标使用 `SymbolGlyph`。
   - 文本中嵌入图标使用 `SymbolSpan`。

---

*示例基于 HarmonyOS NEXT System Icons 规范编写，日期：2026-07-16*

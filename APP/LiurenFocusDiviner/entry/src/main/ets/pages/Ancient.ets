/**
 * Ancient —— 古籍页（独立路由页）
 * ----------------------------------------------------------------------------
 * 封装 AncientStudy（中黄五变经目录 + 阅读）；数据由本页自加载（loadAncient）
 * 入口：Home「古籍」；返回：router.back()
 * ArkTS 合规：零 any / unknown
 */
import { common } from '@kit.AbilityKit';
import type { AncientBook } from '../model/DataLoader';
import { DataLoader } from '../model/DataLoader';
import { AncientStudy } from '../components/AncientStudy';
import { PageHeader } from '../components/PageHeader';

@Entry
@Component
struct Ancient {
  @State private book: AncientBook | null = null;

  aboutToAppear(): void {
    this.initData();
  }

  private async initData(): Promise<void> {
    const host = this.getUIContext().getHostContext();
    if (!host) {
      return;
    }
    try {
      this.book = await DataLoader.loadAncient(host as common.UIAbilityContext);
    } catch (e) {
      /* 古籍数据缺失：目录兜底为空 */
    }
  }

  build() {
    Column() {
      /* 根布局首个子元素 Text 渲染异常：首位置放空占位 Column，文字全部后移 */
      Column()
        .width('100%')
        .height(1)

      /* 页头：统一胶囊 + 返回 */
      PageHeader({
        title: '古籍 · 研习',
        active: 2,
        showBack: true,
        backText: '‹ 返回',
        onBack: () => {
          this.getUIContext().getRouter().back();
        },
        onSwitch: (i: number) => {
          if (i === 0) {
            this.getUIContext().getRouter().back();
          } else if (i === 1) {
            this.getUIContext().getRouter().pushUrl({ url: 'pages/Cases' });
          }
        }
      })

      Column() {
        AncientStudy({
          book: this.book
        })
      }
      .width('100%')
      .layoutWeight(1)
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#14120F')
    .expandSafeArea([SafeAreaType.SYSTEM], [SafeAreaEdge.TOP, SafeAreaEdge.BOTTOM])
  }
}

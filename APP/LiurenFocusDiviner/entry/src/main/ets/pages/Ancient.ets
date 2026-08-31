/**
 * Ancient —— 古籍页（独立路由页）
 * ----------------------------------------------------------------------------
 * 封装 AncientStudy（中黄五变经目录 + 阅读）；数据由本页自加载（loadAncient）
 * 入口：Home「古籍」；返回：router.back()
 * ArkTS 合规：零 any / unknown
 */
import { common } from '@kit.AbilityKit';
import type { AncientBook, AncientCase } from '../model/DataLoader';
import { DataLoader } from '../model/DataLoader';
import { LiurenCore } from '../model/LiurenCore';
import { FeatureFlags } from '../FeatureFlags';
import { AncientStudy } from '../components/AncientStudy';
import { AncientCaseGallery } from '../components/AncientCaseGallery';
import { PageHeader } from '../components/PageHeader';

@Entry
@Component
struct Ancient {
  @State private book: AncientBook | null = null;
  @State private cases: AncientCase[] = [];
  @State private tab: string = 'jing';
  @State private caseDetailOpen: boolean = false;

  aboutToAppear(): void {
    this.initData();
  }

  /* 案例详情态：系统返回/侧滑先回案例列表，再退出古籍页 */
  onBackPress(): boolean {
    if (this.caseDetailOpen) {
      this.caseDetailOpen = false;
      return true;
    }
    return false;
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
    if (FeatureFlags.SHOW_ANCIENT_CASE_GALLERY) {
      try {
        const rules = await DataLoader.loadCoreRules(host as common.UIAbilityContext);
        LiurenCore.init(rules);
        this.cases = await DataLoader.loadAncientCases(host as common.UIAbilityContext);
      } catch (e) {
        this.cases = [];
      }
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
          if (this.caseDetailOpen) {
            this.caseDetailOpen = false;
          } else {
            this.getUIContext().getRouter().back();
          }
        },
        onSwitch: (i: number) => {
          if (i === 0) {
            this.getUIContext().getRouter().back();
          } else if (i === 1) {
            this.getUIContext().getRouter().pushUrl({ url: 'pages/Cases' });
          }
        }
      })

      if (FeatureFlags.SHOW_ANCIENT_CASE_GALLERY) {
        Row({ space: 8 }) {
          Text('经文')
            .fontSize(12)
            .fontColor(this.tab === 'jing' ? '#1A1410' : '#C4B183')
            .backgroundColor(this.tab === 'jing' ? '#E9C878' : '#211E18')
            .borderRadius(14)
            .padding({ left: 12, right: 12, top: 6, bottom: 6 })
            .onClick(() => {
              this.tab = 'jing';
              this.caseDetailOpen = false;
            })
          Text('案例鉴赏')
            .fontSize(12)
            .fontColor(this.tab === 'case' ? '#1A1410' : '#C4B183')
            .backgroundColor(this.tab === 'case' ? '#E9C878' : '#211E18')
            .borderRadius(14)
            .padding({ left: 12, right: 12, top: 6, bottom: 6 })
            .onClick(() => {
              this.tab = 'case';
            })
        }
        .width('100%')
        .padding({ left: 16, right: 16, top: 10 })
      }

      Column() {
        if (!FeatureFlags.SHOW_ANCIENT_CASE_GALLERY || this.tab === 'jing') {
          AncientStudy({
            book: this.book
          })
        } else {
          AncientCaseGallery({
            cases: this.cases,
            detailOpen: $caseDetailOpen
          })
        }
      }
      .width('100%')
      .layoutWeight(1)
      .justifyContent(FlexAlign.Start)
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#14120F')
    .expandSafeArea([SafeAreaType.SYSTEM], [SafeAreaEdge.BOTTOM])
  }
}

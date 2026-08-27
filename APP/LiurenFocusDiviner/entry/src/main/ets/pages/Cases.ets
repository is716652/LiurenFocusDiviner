/**
 * Cases —— 课例页（独立路由页）
 * ----------------------------------------------------------------------------
 * 封装 CaseBoard（保存的排盘记录）；数据由本页自加载（CaseStore）
 * 入口：Home「课例」；返回：router.back()
 * ArkTS 合规：零 any / unknown
 */
import { common } from '@kit.AbilityKit';
import { CaseStore } from '../model/CaseStore';
import type { CaseRec } from '../model/CaseStore';
import { CaseBoard } from '../components/CaseBoard';
import { PageHeader } from '../components/PageHeader';

@Entry
@Component
struct Cases {
  @State private cases: CaseRec[] = [];

  aboutToAppear(): void {
    this.initData();
  }

  private async initData(): Promise<void> {
    const host = this.getUIContext().getHostContext();
    if (!host) {
      return;
    }
    try {
      await CaseStore.init(host as common.UIAbilityContext);
      this.cases = await CaseStore.loadCases();
    } catch (e) {
      /* 课例加载失败：列表兜底为空 */
    }
  }

  private deleteCase(ts: number): void {
    CaseStore.removeCase(ts).then((list: CaseRec[]) => {
      this.cases = list;
    });
  }

  /* 恢复课例：回排盘页并携带日期时辰（Index 收参自动出盘） */
  private restoreCase(rec: CaseRec): void {
    const y = parseInt(rec.date.slice(0, 4));
    const m = parseInt(rec.date.slice(5, 7));
    const d = parseInt(rec.date.slice(8, 10));
    if (isNaN(y) || isNaN(m) || isNaN(d)) {
      return;
    }
    const params: Record<string, Object> = {
      'y': y,
      'm': m,
      'd': d,
      'hz': rec.hourZhi
    };
    this.getUIContext().getRouter().pushUrl({
      url: 'pages/Index',
      params: params
    });
  }

  build() {
    Column() {
      /* 根布局首个子元素 Text 渲染异常：首位置放空占位 Column，文字全部后移 */
      Column()
        .width('100%')
        .height(1)

      /* 页头：统一胶囊 + 返回 */
      PageHeader({
        title: '课例 · 复盘',
        active: 1,
        showBack: true,
        backText: '‹ 返回',
        onBack: () => {
          this.getUIContext().getRouter().back();
        },
        onSwitch: (i: number) => {
          if (i === 0) {
            this.getUIContext().getRouter().back();
          } else if (i === 2) {
            this.getUIContext().getRouter().pushUrl({ url: 'pages/Ancient' });
          }
        }
      })

      Column() {
        CaseBoard({
          cases: this.cases,
          onDelete: (ts: number) => {
            this.deleteCase(ts);
          },
          onRestore: (rec: CaseRec) => {
            this.restoreCase(rec);
          }
        })
      }
      .width('100%')
      .layoutWeight(1)
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Start)
    .alignItems(HorizontalAlign.Start)
    .backgroundColor('#14120F')
    .expandSafeArea([SafeAreaType.SYSTEM], [SafeAreaEdge.BOTTOM])
  }
}

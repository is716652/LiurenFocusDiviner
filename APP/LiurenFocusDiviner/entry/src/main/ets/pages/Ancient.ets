/**
 * Ancient —— 古籍页（独立路由页）
 * ----------------------------------------------------------------------------
 * 封装 AncientStudy（中黄五变经目录 + 阅读）；数据由本页自加载（loadAncient）
 * 页签「剧情演绎」＝收费块主入口（StoryPlay）：
 *   古籍剧情（case_story.json 白名单）＋ 偶遇实盘（ouyu_cases.json）
 *   两文件免费版已被 sync_free_edition 物理剔除 → 本页只显示「经文」页签。
 * 入口：Home「古籍」；页签「排盘/课例」走 NavUtil（栈内有则回退、否则新开）
 * ArkTS 合规：零 any / unknown
 */
import { common } from '@kit.AbilityKit';
import type { AncientBook, AncientCase, OuyuCase, StoryCase } from '../model/DataLoader';
import { DataLoader } from '../model/DataLoader';
import { LiurenCore } from '../model/LiurenCore';
import type { DayRec, YueJiangSeg } from '../model/LiurenCore';
import { FeatureFlags } from '../FeatureFlags';
import { AncientStudy } from '../components/AncientStudy';
import { StoryPlay } from '../components/StoryPlay';
import { PageHeader } from '../components/PageHeader';
import { goTab } from '../model/NavUtil';
import { curves } from '@kit.ArkUI';
import { TransitionFx } from '../model/TransitionFx';

@Entry
@Component
struct Ancient {
  @State private book: AncientBook | null = null;
  @State private cases: AncientCase[] = [];
  @State private stories: Record<string, StoryCase> = {};
  @State private featured: string[] = [];
  @State private ouyu: OuyuCase[] = [];
  @State private yjAll: YueJiangSeg[] = [];
  @State private calData: Record<string, DayRec[]> = {};
  @State private storyReady: boolean = false;
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
        this.stories = await DataLoader.loadStoryCases(host as common.UIAbilityContext);
        this.featured = await DataLoader.loadStoryFeatured(host as common.UIAbilityContext);
        this.ouyu = await DataLoader.loadOuyuCases(host as common.UIAbilityContext);
        this.yjAll = await DataLoader.loadYjAll(host as common.UIAbilityContext);
        /* 偶遇盘面按现场日期复算：预载其所涉年份的历法（古籍剧情用 buildChartAncient，不需历法） */
        const years: number[] = [];
        for (const o of this.ouyu) {
          const y = parseInt(o.date.slice(0, 4));
          if (!isNaN(y) && years.indexOf(y) < 0) {
            years.push(y);
          }
        }
        const m: Record<string, DayRec[]> = {};
        for (const y of years) {
          const arr = await DataLoader.loadCal(host as common.UIAbilityContext, y);
          m[String(y)] = arr;
        }
        this.calData = m;
        this.storyReady = true;
      } catch (e) {
        this.cases = [];
        this.storyReady = false;
      }
    }
  }

  /* 页面转场：淡入淡出 + 弹簧曲线（应用市场自检建议）。
     只声明 opacity —— 不写 slide/translate，故不产生左右平移或上下位移；
     Push / Pop 两个方向都显式声明（默认 RouteType.None 不保险）。 */
  pageTransition() {
    PageTransitionEnter({ type: RouteType.Push, duration: TransitionFx.pageDur(), curve: curves.springCurve(0.6, 1, 320, 34) }).opacity(0)
    PageTransitionExit({ type: RouteType.Push, duration: TransitionFx.pageDur(), curve: curves.springCurve(0.6, 1, 320, 34) }).opacity(0)
    PageTransitionEnter({ type: RouteType.Pop, duration: TransitionFx.pageDur(), curve: curves.springCurve(0.6, 1, 320, 34) }).opacity(0)
    PageTransitionExit({ type: RouteType.Pop, duration: TransitionFx.pageDur(), curve: curves.springCurve(0.6, 1, 320, 34) }).opacity(0)
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
            /* 排盘：回到栈中已有的排盘页（保留盘面），没有才新开 */
            goTab(this.getUIContext(), 'pages/Index');
          } else if (i === 1) {
            goTab(this.getUIContext(), 'pages/Cases');
          }
        }
      })

      if (FeatureFlags.SHOW_ANCIENT_CASE_GALLERY) {
        Row({ space: 8 }) {
          Text('经文')
            .fontSize($r('app.float.font_body_m'))
            .fontColor(this.tab === 'jing' ? $r('app.color.ink_page') : $r('app.color.ink_text_muted'))
            .backgroundColor(this.tab === 'jing' ? $r('app.color.accent_gold_fill') : $r('app.color.ink_surface'))
            .borderRadius(14)
            .padding({ left: 12, right: 12, top: 6, bottom: 6 })
            .onClick(() => {
              this.tab = 'jing';
              this.caseDetailOpen = false;
            })
          Text('剧情演绎')
            .fontSize($r('app.float.font_body_m'))
            .fontColor(this.tab === 'case' ? $r('app.color.ink_page') : $r('app.color.ink_text_muted'))
            .backgroundColor(this.tab === 'case' ? $r('app.color.accent_gold_fill') : $r('app.color.ink_surface'))
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
        } else if (this.storyReady) {
          /* 数据就绪后才创建：StoryPlay 的成员在构造时一次性传入，不做响应式同步 */
          StoryPlay({
            cases: this.cases,
            stories: this.stories,
            featured: this.featured,
            ouyu: this.ouyu,
            yjAll: this.yjAll,
            calData: this.calData,
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
    .backgroundColor($r('app.color.pan_core'))
    .expandSafeArea([SafeAreaType.SYSTEM], [SafeAreaEdge.BOTTOM])
  }
}

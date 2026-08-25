/**
 * UserAgreement —— 用户协议页（墨夜鎏金深色，与本项目风格一致）
 * 路由：由 Splash/Index 底部链接 pushUrl 进入，返回用 router.back()
 */
@Entry
@Component
struct UserAgreementPage {
  build() {
    Column() {
      /* 顶部栏 */
      Row() {
        Button('← 返回')
          .fontSize(14)
          .fontColor('#F0D98C')
          .backgroundColor('rgba(233,200,120,0.12)')
          .border({ width: 1, color: 'rgba(233,200,120,0.35)' })
          .borderRadius(8)
          .padding({ left: 12, right: 12, top: 6, bottom: 6 })
          .onClick(() => {
            this.getUIContext().getRouter().back();
          })
        Text('用户协议')
          .layoutWeight(1)
          .fontSize(16)
          .fontWeight(FontWeight.Bold)
          .fontColor('#F0E6C8')
          .textAlign(TextAlign.Center)
      }
      .width('100%')
      .padding({ left: 8, right: 8, top: 8, bottom: 8 })

      /* 内容区 */
      Scroll() {
        Column({ space: 8 }) {
          Text('大六壬读象工作台APP用户协议')
            .fontSize(18)
            .fontWeight(FontWeight.Bold)
            .fontColor('#F0D98C')
            .margin({ bottom: 4 })
          Text('总则')
            .fontSize(16)
            .fontWeight(FontWeight.Bold)
            .fontColor('#F0E6C8')
          Text('大六壬读象工作台APP由独立开发者（以下简称“我们”）提供。本协议是你（以下简称“用户”）与我们之间就使用本软件与服务达成的约定。你开始使用或继续使用，视为已阅读并同意本协议。当前版本无需账号即可浏览信息。')
            .fontSize(14)
            .fontColor('#D8C9A3')
            .lineHeight(22)
            .textAlign(TextAlign.Start)

          Text('服务内容')
            .fontSize(16)
            .fontWeight(FontWeight.Bold)
            .fontColor('#F0E6C8')
          Text('本软件的核心业务功能为大六壬排盘、信息展示与内容浏览。我们可能根据产品迭代对功能进行调整或优化，并以更新日志或站内提示的方式予以说明。')
            .fontSize(14)
            .fontColor('#D8C9A3')
            .lineHeight(22)
            .textAlign(TextAlign.Start)

          Text('用户行为规范')
            .fontSize(16)
            .fontWeight(FontWeight.Bold)
            .fontColor('#F0E6C8')
          Text('你承诺遵守法律法规与社会公德，不得：\n· 发布或传播违法、侵权、低俗等不当内容；\n· 以任何方式干扰、破坏软件正常运行（含爬虫、攻击、绕过安全机制等）；\n· 未经许可对软件或相关内容进行复制、改作、分发、商业化利用。')
            .fontSize(14)
            .fontColor('#D8C9A3')
            .lineHeight(22)
            .textAlign(TextAlign.Start)

          Text('知识产权')
            .fontSize(16)
            .fontWeight(FontWeight.Bold)
            .fontColor('#F0E6C8')
          Text('本软件及展示内容的相关权利归我们或合法权利人所有。除法律允许或经我们书面授权外，用户仅可在个人、非商业目的范围内使用。')
            .fontSize(14)
            .fontColor('#D8C9A3')
            .lineHeight(22)
            .textAlign(TextAlign.Start)

          Text('隐私保护')
            .fontSize(16)
            .fontWeight(FontWeight.Bold)
            .fontColor('#F0E6C8')
          Row() {
            Text('我们重视你的隐私保护，当前版本不收集个人信息；具体做法请参阅')
              .fontSize(14)
              .fontColor('#D8C9A3')
              .lineHeight(22)
              .textAlign(TextAlign.Start)
            Text('《隐私政策》')
              .fontSize(14)
              .fontColor('#7FA69A')
              .onClick(() => {
                this.getUIContext().getRouter().pushUrl({ url: 'pages/Legal/PrivacyPolicy' });
              })
          }
          .width('100%')

          Text('传统文化研习特别说明')
            .fontSize(16)
            .fontWeight(FontWeight.Bold)
            .fontColor('#F0E6C8')
          Text('本软件中的历法、排盘、断语等内容均为传统术数典籍的数字化整理与展示，仅用于中华传统文化研习与学术参考。软件展示的古籍断语、吉凶表述等均为典籍原文或依其法诀的归纳，不代表任何事实判断或未来预测，不构成任何投资、医疗、法律、婚恋或其他决策建议。请理性使用，勿以此替代专业意见。')
            .fontSize(14)
            .fontColor('#D8C9A3')
            .lineHeight(22)
            .textAlign(TextAlign.Start)

          Text('免责声明与责任限制')
            .fontSize(16)
            .fontWeight(FontWeight.Bold)
            .fontColor('#F0E6C8')
          Text('本软件按“现状”和“可用性”提供，我们不对服务的准确性、适用性、持续性作出保证。因使用或无法使用本软件而造成的间接或附带损失，我们不承担责任。对第三方链接或服务的内容与安全性，我们不作担保。')
            .fontSize(14)
            .fontColor('#D8C9A3')
            .lineHeight(22)
            .textAlign(TextAlign.Start)

          Text('变更与终止')
            .fontSize(16)
            .fontWeight(FontWeight.Bold)
            .fontColor('#F0E6C8')
          Text('我们可能适时更新本协议，并在版本更新或页面提示中说明。若你不同意变更，可停止使用；继续使用视为接受更新后的条款。我们可在必要时对服务进行暂停或终止，并依法履行告知义务。')
            .fontSize(14)
            .fontColor('#D8C9A3')
            .lineHeight(22)
            .textAlign(TextAlign.Start)

          Text('联系方式')
            .fontSize(16)
            .fontWeight(FontWeight.Bold)
            .fontColor('#F0E6C8')
          Column() {
            Text('如对本《用户协议》或相关事宜有任何问题，请通过')
              .fontSize(14)
              .fontColor('#D8C9A3')
              .lineHeight(22)
              .textAlign(TextAlign.Start)
            Text('is716652@qq.com')
              .fontSize(14)
              .fontColor('#7FA69A')
              .textAlign(TextAlign.Start)
            Text('与我们联系')
              .fontSize(14)
              .fontColor('#D8C9A3')
              .lineHeight(22)
              .textAlign(TextAlign.Start)
          }
          .width('100%')
        }
        .width('100%')
        .padding(12)
      }
      .layoutWeight(1)
      .scrollBar(BarState.On)
      .edgeEffect(EdgeEffect.Spring)
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#14120F')
    .expandSafeArea([SafeAreaType.SYSTEM], [SafeAreaEdge.TOP, SafeAreaEdge.BOTTOM])
  }
}

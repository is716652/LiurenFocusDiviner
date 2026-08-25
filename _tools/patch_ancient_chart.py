# -*- coding: utf-8 -*-
"""补丁：Index.ets 加「古籍案例速排」——输入月将/日干支/占时(+可选年/月) → 完整盘面"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Index.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    # ① 状态
    old_state = """  /* 解读路线：当前展开的路线（读象/毕法/中黄；空=全收起） */
  @State private route: string = '';"""
    assert s.count(old_state) == 1, 'state: %d' % s.count(old_state)
    new_state = old_state + """
  /* 古籍案例速排：输入月将/日干支/占时(+可选年/月) 反推完整盘面 */
  @State private showAncient: boolean = false;
  @State private ancientMj: string = '未';
  @State private ancientDg: string = '甲';
  @State private ancientDz: string = '戌';
  @State private ancientHz: string = '卯';
  @State private ancientYG: string = '';
  @State private ancientYZ: string = '';
  @State private ancientMZ: string = '';
  @State private ancientNote: string = '';"""
    s = s.replace(old_state, new_state)

    # ② 排盘按钮后插案例速排折叠区
    old_btn = """          Text(this.ready ? '规则与历法已就绪 · 选择日期时辰后排盘' : '正在载入历法数据…')
            .fontSize(11)
            .fontColor('#6B5F45')
            .textAlign(TextAlign.Center)
"""
    assert s.count(old_btn) == 1, 'btn: %d' % s.count(old_btn)
    new_btn = old_btn + """
          /* 古籍案例速排 */
          Row({ space: 6 }) {
            Text('📜 古籍案例速排')
              .fontSize(12)
              .fontColor(this.showAncient ? '#F0D98C' : '#C4B183')
              .padding({ left: 12, right: 12, top: 4, bottom: 4 })
              .borderRadius(10)
              .backgroundColor(this.showAncient ? 'rgba(240,217,140,0.12)' : 'rgba(138,123,92,0.12)')
              .onClick(() => {
                this.showAncient = !this.showAncient;
              })
            Text(this.ancientNote !== '' ? this.ancientNote : '输入古案例（月将+日干支+占时）→ 完整盘面')
              .fontSize(10)
              .fontColor('#8A7B5C')
          }
          .width('100%')

          if (this.showAncient) {
            Column({ space: 6 }) {
              Text('必填：月将支 + 日干 + 日支 + 占时；选填：年干支/月支（有则神煞完整）')
                .fontSize(10)
                .fontColor('#6B5F45')
                .width('100%')
              /* 月将 */
              Row({ space: 6 }) {
                Text('月将').fontSize(11).fontColor('#8A7B5C')
                ForEach(HOURS, (z: string) => {
                  Text(z)
                    .fontSize(12)
                    .fontColor(this.ancientMj === z ? '#1A1410' : '#C4B183')
                    .backgroundColor(this.ancientMj === z ? '#F0D98C' : 'rgba(138,123,92,0.12)')
                    .borderRadius(8)
                    .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                    .onClick(() => { this.ancientMj = z; })
                }, (z: string) => 'amj' + z)
              }
              .width('100%')
              /* 日干 */
              Row({ space: 6 }) {
                Text('日干').fontSize(11).fontColor('#8A7B5C')
                ForEach(LiurenCore.GAN, (g: string) => {
                  Text(g)
                    .fontSize(12)
                    .fontColor(this.ancientDg === g ? '#1A1410' : '#C4B183')
                    .backgroundColor(this.ancientDg === g ? '#F0D98C' : 'rgba(138,123,92,0.12)')
                    .borderRadius(8)
                    .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                    .onClick(() => { this.ancientDg = g; })
                }, (g: string) => 'adg' + g)
              }
              .width('100%')
              /* 日支 */
              Row({ space: 6 }) {
                Text('日支').fontSize(11).fontColor('#8A7B5C')
                ForEach(HOURS, (z: string) => {
                  Text(z)
                    .fontSize(12)
                    .fontColor(this.ancientDz === z ? '#1A1410' : '#C4B183')
                    .backgroundColor(this.ancientDz === z ? '#F0D98C' : 'rgba(138,123,92,0.12)')
                    .borderRadius(8)
                    .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                    .onClick(() => { this.ancientDz = z; })
                }, (z: string) => 'adz' + z)
              }
              .width('100%')
              /* 占时 */
              Row({ space: 6 }) {
                Text('占时').fontSize(11).fontColor('#8A7B5C')
                ForEach(HOURS, (z: string) => {
                  Text(z)
                    .fontSize(12)
                    .fontColor(this.ancientHz === z ? '#1A1410' : '#C4B183')
                    .backgroundColor(this.ancientHz === z ? '#F0D98C' : 'rgba(138,123,92,0.12)')
                    .borderRadius(8)
                    .padding({ left: 8, right: 8, top: 2, bottom: 2 })
                    .onClick(() => { this.ancientHz = z; })
                }, (z: string) => 'ahz' + z)
              }
              .width('100%')
              /* 选填：年干/年支/月支 */
              Row({ space: 6 }) {
                Text('年干(选)').fontSize(10).fontColor('#6B5F45')
                ForEach(LiurenCore.GAN, (g: string) => {
                  Text(g)
                    .fontSize(11)
                    .fontColor(this.ancientYG === g ? '#1A1410' : '#8A7B5C')
                    .backgroundColor(this.ancientYG === g ? '#F0D98C' : 'rgba(107,95,69,0.2)')
                    .borderRadius(6)
                    .padding({ left: 5, right: 5, top: 1, bottom: 1 })
                    .onClick(() => { this.ancientYG = (this.ancientYG === g) ? '' : g; })
                }, (g: string) => 'ayg' + g)
              }
              .width('100%')
              Row({ space: 6 }) {
                Text('年支(选)').fontSize(10).fontColor('#6B5F45')
                ForEach(HOURS, (z: string) => {
                  Text(z)
                    .fontSize(11)
                    .fontColor(this.ancientYZ === z ? '#1A1410' : '#8A7B5C')
                    .backgroundColor(this.ancientYZ === z ? '#F0D98C' : 'rgba(107,95,69,0.2)')
                    .borderRadius(6)
                    .padding({ left: 5, right: 5, top: 1, bottom: 1 })
                    .onClick(() => { this.ancientYZ = (this.ancientYZ === z) ? '' : z; })
                }, (z: string) => 'ayz' + z)
              }
              .width('100%')
              Row({ space: 6 }) {
                Text('月支(选)').fontSize(10).fontColor('#6B5F45')
                ForEach(HOURS, (z: string) => {
                  Text(z)
                    .fontSize(11)
                    .fontColor(this.ancientMZ === z ? '#1A1410' : '#8A7B5C')
                    .backgroundColor(this.ancientMZ === z ? '#F0D98C' : 'rgba(107,95,69,0.2)')
                    .borderRadius(6)
                    .padding({ left: 5, right: 5, top: 1, bottom: 1 })
                    .onClick(() => { this.ancientMZ = (this.ancientMZ === z) ? '' : z; })
                }, (z: string) => 'amz' + z)
              }
              .width('100%')
              Button('反推盘面')
                .width('100%')
                .height(36)
                .fontSize(14)
                .fontColor('#1A1410')
                .linearGradient({ angle: 90, colors: [['#F5D98E', 0.0], ['#D9A94E', 1.0]] })
                .borderRadius(18)
                .onClick(() => {
                  this.doAncientChart();
                })
            }
            .width('100%')
            .padding(10)
            .borderRadius(12)
            .backgroundColor('#211E18')
            .border({ width: 1, color: 'rgba(233,200,120,0.15)' })
          }
"""
    s = s.replace(old_btn, new_btn)

    # ③ doAncientChart 方法（加在 doChart 后）
    old_dc = """  /* 当前盘（仅在 chart 非空时调用） */
  private cur(): Chart {"""
    assert s.count(old_dc) == 1, 'cur: %d' % s.count(old_dc)
    new_dc = """  /* 古籍案例速排：月将+日干支+占时(+可选年/月) → 完整盘面 */
  private doAncientChart(): void {
    const c = LiurenCore.buildChartAncient(this.ancientMj, this.ancientDg, this.ancientDz,
      this.ancientHz, this.ancientYG, this.ancientYZ, this.ancientMZ);
    if (!c) {
      this.ancientNote = '起盘失败';
      return;
    }
    this.chart = c;
    this.ancientNote = this.ancientMj + '将 ' + this.ancientDg + this.ancientDz + '日 ' + this.ancientHz + '时 · 已反推（' +
      (c.dx.xunkong.length ? '旬空' + c.dx.xunkong.join('') : '无空') + '）';
    this.bifaDetails = LiurenCore.renderBifaForChuans(c, c.dx, c.sanchuan.chuans, '');
    this.coach = LiurenCore.bifaCoach(c.dx.bifa, this.coachData);
    this.zhonghuang = LiurenCore.zhonghuangDun(c, this.ancientHz);
    this.zhonghuangAna = LiurenCore.zhonghuangAnalyze(c, this.ancientHz);
    this.yongShen = '';
    this.cands = [];
    this.customYS = false;
    this.nianZhi = '';
    this.nianming = null;
    this.xingnian = LiurenCore.xingNian(c, this.birthYear, this.year, this.gender, '');
    this.expandedBifa = -1;
    this.route = '';
  }

  /* 当前盘（仅在 chart 非空时调用） */
  private cur(): Chart {"""
    s = s.replace(old_dc, new_dc)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('ANCIENT CHART PATCH OK')

if __name__ == '__main__':
    main()

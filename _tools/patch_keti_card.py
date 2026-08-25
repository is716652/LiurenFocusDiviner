# -*- coding: utf-8 -*-
"""补丁：Index.ets 课体解读卡（加载课体课义 + 排盘后显示当前课体含义）"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Index.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    # ① 状态
    old_state = """  /* 盘面辅助层开关：显地盘干/显本位神（颜色区分主辅） */
  @State private showDunDi: boolean = false;
  @State private showBenshen: boolean = false;"""
    assert s.count(old_state) == 1, 'state: %d' % s.count(old_state)
    new_state = old_state + """
  /* 课体课义数据（九宗门课体 → 通用课义） */
  @State private ketiYi: Record<string, Object> = {};"""
    s = s.replace(old_state, new_state)

    # ② initData 加载
    old_load = """    try {
      this.coachData = await DataLoader.loadBifaCoach(ctx);
    } catch (e) {
      /* 毕法教练数据缺失：教练栏兜底为空 */
    }"""
    assert s.count(old_load) == 1, 'load: %d' % s.count(old_load)
    new_load = old_load + """
    try {
      this.ketiYi = await DataLoader.loadKetiYi(ctx);
    } catch (e) {
      /* 课体课义缺失：课体解读卡兜底为空 */
    }"""
    s = s.replace(old_load, new_load)

    # ③ 课体解读卡 UI：插在三传区块后（三传结束的 padding/borderRadius 块后）
    old_chuan = """      .width('100%')
      .padding(12)
      .borderRadius(16)
      .backgroundColor('#1C1A16')
      .border({ width: 1, color: 'rgba(233,200,120,0.14)' })

      /* 盘态 */"""
    assert s.count(old_chuan) == 1, 'chuan: %d' % s.count(old_chuan)
    new_chuan = """      .width('100%')
      .padding(12)
      .borderRadius(16)
      .backgroundColor('#1C1A16')
      .border({ width: 1, color: 'rgba(233,200,120,0.14)' })

      /* 课体解读卡 */
      if (this.chart && this.chuanTitle() !== '') {
        Column({ space: 6 }) {
          Row() {
            Text('课体 · ' + this.chuanTitle())
              .fontSize(14)
              .fontWeight(FontWeight.Medium)
              .fontColor('#F0E6C8')
            Blank()
            Text('九宗门课体 · 通用课义')
              .fontSize(10)
              .fontColor('#6B5F45')
          }
          .width('100%')
          if (this.ketiTxt() !== '') {
            Text(this.ketiTxt())
              .fontSize(12)
              .fontColor('#C4B183')
              .lineHeight(18)
              .width('100%')
          }
        }
        .width('100%')
        .padding(12)
        .borderRadius(16)
        .backgroundColor('#1C1A16')
        .border({ width: 1, color: 'rgba(233,200,120,0.14)' })
      }

      /* 盘态 */"""
    s = s.replace(old_chuan, new_chuan)

    # ④ ketiTxt 方法（加在 ygcText 附近）
    old_m = """  private ygcText(r: DayRec): string {"""
    assert s.count(old_m) == 1, 'm: %d' % s.count(old_m)
    new_m = """  /* 课体课义：当前课体名 → 匹配课体课义表的断语 */
  private ketiTxt(): string {
    const c = this.chart;
    if (!c) {
      return '';
    }
    const keti = c.sanchuan.keti;
    const name = (keti !== '' ? keti : c.chuanTitle()).replace('遥克·', '遥克·');
    const list = (this.ketiYi['课体'] as Object[]) || [];
    for (let i = 0; i < list.length; i++) {
      const it = list[i] as Record<string, Object>;
      if (it['名'] === name) {
        const yi = it['课义'] as string;
        const duan = it['断语'] as string;
        const jx = it['吉凶'] as string;
        return '【课义】' + yi + ' 【断】' + duan + '（' + jx + '）';
      }
    }
    /* 兜底：普通课无课体，显示宗门法 */
    const m = c.sanchuan.method;
    return m !== '' ? '宗门法：' + m + '（贼克/比用/涉害/遥克…）' : '';
  }

  private ygcText(r: DayRec): string {"""
    s = s.replace(old_m, new_m)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('KETI CARD PATCH OK')

if __name__ == '__main__':
    main()

# -*- coding: utf-8 -*-
"""补丁：Index.ets 古籍案例速排 加三层校验
1) 日干支阴阳匹配（阳干配阳支）
2) 月将×月支匹配（选了月支时）
3) 组合存在性（由1保证）+ 提示
"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Index.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    old = """  /* 古籍案例速排：月将+日干支+占时(+可选年/月) → 完整盘面 */
  private doAncientChart(): void {
    const c = LiurenCore.buildChartAncient(this.ancientMj, this.ancientDg, this.ancientDz,
      this.ancientHz, this.ancientYG, this.ancientYZ, this.ancientMZ);
    if (!c) {
      this.ancientNote = '起盘失败';
      return;
    }"""
    assert s.count(old) == 1, 'old: %d' % s.count(old)
    new = """  /* 古籍案例速排：月将+日干支+占时(+可选年/月) → 完整盘面（带合法性校验） */
  private doAncientChart(): void {
    /* ① 日干支阴阳匹配 */
    if (!LiurenCore.validGanZhi(this.ancientDg, this.ancientDz)) {
      this.ancientNote = '日干支不合：' + this.ancientDg + this.ancientDz +
        '（阳干配阳支/阴干配阴支，60甲子合法组合中不存在）';
      return;
    }
    /* ② 年干支阴阳匹配（若填了年干支） */
    if (this.ancientYG !== '' && this.ancientYZ !== '' && !LiurenCore.validGanZhi(this.ancientYG, this.ancientYZ)) {
      this.ancientNote = '年干支不合：' + this.ancientYG + this.ancientYZ + '（阴阳不配，不存在）';
      return;
    }
    /* ③ 月将×月支匹配（若填了月支） */
    if (this.ancientMZ !== '') {
      const expectMj = LiurenCore.yuejiangForMonth(this.ancientMZ);
      if (expectMj !== this.ancientMj) {
        this.ancientNote = this.ancientMZ + '月（' + this.ancientMZ + '支）月将应为' + expectMj + '将，非' + this.ancientMj + '将';
        return;
      }
    }
    const c = LiurenCore.buildChartAncient(this.ancientMj, this.ancientDg, this.ancientDz,
      this.ancientHz, this.ancientYG, this.ancientYZ, this.ancientMZ);
    if (!c) {
      this.ancientNote = '起盘失败';
      return;
    }"""
    s = s.replace(old, new)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('ANCIENT VALIDATION PATCH OK')

if __name__ == '__main__':
    main()

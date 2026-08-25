# -*- coding: utf-8 -*-
"""补丁：Index.ets 中黄块升级为 双视角对比+变干主线+建合检测"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Index.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    # ① doChart 加 analyze
    old1 = """      this.zhonghuang = LiurenCore.zhonghuangDun(c, this.hourZhi);
      this.expandedBifa = -1;"""
    assert s.count(old1) == 1, 'doChart: %d' % s.count(old1)
    new1 = """      this.zhonghuang = LiurenCore.zhonghuangDun(c, this.hourZhi);
      this.zhonghuangAna = LiurenCore.zhonghuangAnalyze(c, this.hourZhi);
      this.expandedBifa = -1;"""
    s = s.replace(old1, new1)

    # ② 中黄块替换为三块展示
    old2 = """        /* 中黄研习（付费门禁；变干断课 + 遁干三层切换） */
        if (PayConfig.paidVisible() && PayGate.isUnlocked(PayConfig.F_ZHONGHUANG) && this.zhonghuang) {
          Column({ space: 6 }) {
            Row() {
              Text('中黄五变经')
                .fontSize(11)
                .fontColor('#8A7B5C')
              Blank()
              Text('日干遁·时干遁 双演')
                .fontSize(10)
                .fontColor('#5A4F3D')
            }
            .width('100%')
            /* 中黄盘要点（模式切换已移到天盘标题栏，同屏查看） */
            if (this.zhonghuangMode === '时遁') {
              Text('时干' + this.zhonghuang.shiGan + ' · 变干' + this.zhonghuang.bianGan +
                '（' + this.zhonghuang.hourZhi + '宫）· 日干' + this.zhonghuang.dayGan + '为体')
                .fontSize(12)
                .fontWeight(FontWeight.Medium)
                .fontColor('#F0D98C')
                .lineHeight(17)
                .width('100%')
              Text(this.zhonghuangTxt())
                .fontSize(11)
                .fontColor('#C4B183')
                .lineHeight(16)
                .width('100%')
            } else if (this.zhonghuangMode === '日遁') {
              Text('日干遁盘（体）：' + this.zhonghuang.dayGan + '日 · 十二宫日遁干')
                .fontSize(11)
                .fontColor('#C4B183')
                .lineHeight(16)
                .width('100%')
            }
            Text('注：中黄以日干及时干各起五鼠遁排天干，与传统旬遁不同（古籍研习参考）')
              .fontSize(9)
              .fontColor('#5A4F3D')
              .lineHeight(13)
              .width('100%')
          }
          .width('100%')
          .padding({ top: 8 })
          .border({ width: { top: 1 }, color: 'rgba(233,200,120,0.15)' })
        }"""
    assert s.count(old2) == 1, 'block: %d' % s.count(old2)
    new2 = """        /* 中黄研习（付费门禁；双视角对比 + 变干主线 + 建合检测） */
        if (PayConfig.paidVisible() && PayGate.isUnlocked(PayConfig.F_ZHONGHUANG) && this.zhonghuangAna) {
          Column({ space: 6 }) {
            Row() {
              Text('中黄五变经')
                .fontSize(11)
                .fontColor('#8A7B5C')
              Blank()
              Text('日干遁·时干遁 双演 · 遁干切换在天地盘标题')
                .fontSize(10)
                .fontColor('#5A4F3D')
            }
            .width('100%')

            /* ① 双视角对比：旬遁 vs 中黄 六亲变化 */
            Text('① 六亲视角对比（旬遁 → 中黄）· 变化 ' + this.zhonghuangAna.changed.length + ' 宫')
              .fontSize(11)
              .fontWeight(FontWeight.Medium)
              .fontColor('#C4B183')
              .width('100%')
            Flex({ wrap: FlexWrap.Wrap }) {
              ForEach(this.zhonghuangAna.cmp, (it: ZhonghuangCmpItem) => {
                Text(it.gong + ' ' + it.xunLq + (it.changed ? ('→' + it.zhLq) : ''))
                  .fontSize(10)
                  .fontColor(it.changed ? '#F0D98C' : '#6B5F45')
                  .backgroundColor(it.changed ? 'rgba(240,217,140,0.12)' : 'rgba(107,95,69,0.12)')
                  .borderRadius(8)
                  .padding({ left: 7, right: 7, top: 3, bottom: 3 })
                  .margin({ right: 5, bottom: 5 })
              }, (it: ZhonghuangCmpItem) => 'cmp' + it.gong)
            }
            .width('100%')

            /* ② 变干主线 */
            Text('② 变干主线：变干' + this.zhonghuangAna.dun.bianGan + '(' + this.zhonghuangAna.bianGong + '宫)' +
              (this.zhonghuangAna.bianJiang !== '' ? ' 乘' + this.zhonghuangAna.bianJiang : '') +
              ' 为日干' + this.zhonghuangAna.dun.dayGan + '之' + this.zhonghuangAna.bianLq +
              (this.zhonghuangAna.bianInChuan !== '' ? ' · 入' + this.zhonghuangAna.bianInChuan : ' · 不入三传'))
              .fontSize(12)
              .fontWeight(FontWeight.Medium)
              .fontColor('#F0D98C')
              .lineHeight(17)
              .width('100%')
            Text(this.zhonghuangTxt())
              .fontSize(11)
              .fontColor('#C4B183')
              .lineHeight(16)
              .width('100%')

            /* ③ 建合检测 */
            Text('③ 建合检测（日遁×时遁 天干五合）')
              .fontSize(11)
              .fontWeight(FontWeight.Medium)
              .fontColor('#C4B183')
              .width('100%')
            if (this.zhonghuangAna.jianhe.length === 0) {
              Text('本盘无建合（日遁与时遁在日上/支上/变干宫/三传无干合）')
                .fontSize(11)
                .fontColor('#6B5F45')
                .lineHeight(16)
                .width('100%')
            } else {
              ForEach(this.zhonghuangAna.jianhe, (jh: ZhonghuangJianhe) => {
                Text(jh.pos + '(' + jh.gong + '宫) 日遁' + jh.riGan + '×时遁' + jh.shiGan + ' → ' + jh.type + '（吉，夫妇相见鬼不能克）')
                  .fontSize(11)
                  .fontColor('#F0D98C')
                  .lineHeight(16)
                  .width('100%')
              }, (jh: ZhonghuangJianhe) => 'jh' + jh.pos)
            }

            Text('注：中黄以日干及时干各起五鼠遁排天干，与传统旬遁不同（古籍研习参考）')
              .fontSize(9)
              .fontColor('#5A4F3D')
              .lineHeight(13)
              .width('100%')
          }
          .width('100%')
          .padding({ top: 8 })
          .border({ width: { top: 1 }, color: 'rgba(233,200,120,0.15)' })
        }"""
    s = s.replace(old2, new2)

    # ③ zhonghuangTxt 更新为基于 analyze（变干六亲断语）
    old3 = """  /* 中黄变干断语：变干与日干五行生克 → 六亲定位（鬼/财/父/子/兄） */
  private zhonghuangTxt(): string {
    const z = this.zhonghuang;
    if (!z) {
      return '';
    }
    const bwx = LiurenCore.WXG[z.bianGan];
    const dwx = LiurenCore.WXG[z.dayGan];
    let lq = '';
    if (bwx === dwx) {
      lq = '比肩';
    } else if (LiurenCore.KE[dwx] === bwx) {
      lq = '妻财';
    } else if (LiurenCore.KE[bwx] === dwx) {
      lq = '官鬼';
    } else if (LiurenCore.SHENG(dwx) === bwx) {
      lq = '子孙';
    } else {
      lq = '父母';
    }
    let txt = '变干' + z.bianGan + '为日干' + z.dayGan + '之' + lq;
    if (lq === '官鬼') {
      txt += '（鬼贼，防官非疾病，宜寻子孙制化）';
    } else if (lq === '妻财') {
      txt += '（财，求财有机会，宜主动）';
    } else if (lq === '父母') {
      txt += '（父，得文书长辈之助）';
    } else if (lq === '子孙') {
      txt += '（子，逢凶有解）';
    } else {
      txt += '（比肩，同辈合作，防争夺）';
    }
    return txt;
  }"""
    assert s.count(old3) == 1, 'txt: %d' % s.count(old3)
    new3 = """  /* 中黄变干断语（基于 analyze 的变干六亲） */
  private zhonghuangTxt(): string {
    const a = this.zhonghuangAna;
    if (!a) {
      return '';
    }
    const lq = a.bianLq;
    let txt = '变干' + a.dun.bianGan + '为日干' + a.dun.dayGan + '之' + lq;
    if (lq === '官鬼') {
      txt += '（鬼贼，防官非疾病，宜寻子孙制化）';
    } else if (lq === '妻财') {
      txt += '（财，求财有机会，宜主动）';
    } else if (lq === '父母') {
      txt += '（父，得文书长辈之助）';
    } else if (lq === '子孙') {
      txt += '（子，逢凶有解）';
    } else {
      txt += '（比肩，同辈合作，防争夺）';
    }
    if (a.bianInChuan !== '') {
      txt += ' 变干入' + a.bianInChuan + '，事应之速。';
    } else {
      txt += ' 变干不入三传，事缓。';
    }
    if (a.changed.length > 0) {
      txt += ' 六亲视角变化' + a.changed.length + '宫（' + a.changed.join('') + '），中黄断课与此异。';
    }
    return txt;
  }"""
    s = s.replace(old3, new3)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('Index zhonghuang upgrade PATCH OK')

if __name__ == '__main__':
    main()

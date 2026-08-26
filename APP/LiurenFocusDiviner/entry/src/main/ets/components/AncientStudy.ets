/**
 * AncientStudy —— 古籍研习页签（目录 + 阅读，页签内部切换不走路由）
 * ----------------------------------------------------------------------------
 * 目录：按卷分组的篇目列表（篇名 + 导语），点击进入阅读视图
 * 阅读：篇名栏（‹ 返回 / 篇名 / 卷名）+ 滚动经文段落 + 上一篇/下一篇
 * 数据：rawfile/ancient/zhonghuang_jing.json（由父级 DataLoader.loadAncient 注入）
 * 风格：墨夜鎏金（深底 #14120F / 卡片 #1C1A16 / 金字 #F0D98C / 暗金 #A8843C）
 * ArkTS 合规：零 any / unknown；显式类型；@Prop 状态由父级注入
 */
import type { AncientBook, AncientChapter } from '../model/DataLoader';

@Component
export struct AncientStudy {
  @Prop book: AncientBook | null = null;
  /* 当前阅读篇目下标（-1 = 目录视图） */
  @State private curIdx: number = -1;

  /* 目录行数据（扁平化：卷头 + 篇行） */
  private listRows(): AncientChapter[] {
    const b = this.book;
    if (!b) {
      return [];
    }
    return b.篇目;
  }

  /* 卷头是否显示（与上一篇不同卷时显示） */
  private showJuan(idx: number): boolean {
    const list = this.listRows();
    if (idx === 0) {
      return true;
    }
    return list[idx].卷 !== list[idx - 1].卷;
  }

  /* 是否为孤立盘式标记（四课/三传 等单独一行） */
  private isSectionMark(p: string): boolean {
    const t = p.trim();
    return t === '四课' || t === '三传' || t === '四課' || t === '三傳';
  }

  /* 清洗盘式标记（去 > 前缀） */
  private cleanMark(p: string): string {
    return p.replace(/^[>\s]+/, '').trim();
  }

  /* 是否为代码块（``` 围栏） */
  private isCodeBlock(p: string): boolean {
    return p.indexOf('```') >= 0;
  }

  /* 是否为表格/清单块（由 md 表格转成全角空格分列；首行 ≥2 列且至少两行同构） */
  private isTableBlock(p: string): boolean {
    const ls = this.lines(p);
    if (ls.length < 2) {
      return false;
    }
    const head = ls[0];
    if (head.indexOf('　') < 0 && head.indexOf('|') < 0) {
      return false;
    }
    if (this.cellsOf(head).length < 2) {
      return false;
    }
    let rows = 0;
    for (let i = 0; i < ls.length; i++) {
      if (this.cellsOf(ls[i]).length >= 2) {
        rows++;
      }
    }
    return rows >= 2;
  }

  /* 是否为校勘标注（【存疑】/【直释】/【推阐】/【旁证】/详解依据） */
  private isSuspect(p: string): boolean {
    const t = p.trim();
    return t.indexOf('【存疑】') === 0 || t.indexOf('【直释】') === 0 ||
      t.indexOf('【推阐】') === 0 || t.indexOf('【旁证】') === 0 ||
      t.indexOf('详解依据') >= 0 || t.indexOf('标注体系') >= 0;
  }

  /* 是否为引用块（原 > 前缀，含多行引用） */
  private isQuote(p: string): boolean {
    return p.indexOf('>') >= 0;
  }

  /* 清洗引用/正文：去所有 > 前缀与引用空行 */
  private cleanQuote(p: string): string {
    return p.replace(/^[>\s]+/gm, '').replace(/\n>\s*\n/g, '\n').replace(/^\s*\n/g, '').trim();
  }

  /* 去行首 md 标记（- * #）与多余空白 */
  private cleanMd(p: string): string {
    return p.replace(/^[\s]*(?:[-*]|#{1,6})\s*/gm, '').replace(/\*\*/g, '').trim();
  }

  /* 拆行并去空白 */
  private lines(p: string): string[] {
    const raw = p.split(/\n/);
    const out: string[] = [];
    for (let i = 0; i < raw.length; i++) {
      const t = raw[i].trim();
      if (t !== '') {
        out.push(t);
      }
    }
    return out;
  }

  /* 是否为四课盘式（"四课"开头 或 "第四课 第三课..."开头 + 后续干支行） */
  private isKegBlock(p: string): boolean {
    const t = p.trim();
    if (!(t.indexOf('四课') === 0 || t.indexOf('四課') === 0 || t.indexOf('第四课') === 0 || t.indexOf('第四課') === 0)) {
      return false;
    }
    return this.lines(p).length >= 2;
  }

  /* 是否为三传盘式（仅匹配紧凑课式，避免把“三传…/初建…”正文误判进横向 Row） */
  private isChuanBlock(p: string): boolean {
    const t = p.trim();
    const ls = this.lines(p);
    /* 竖排形态：初/中/末 三行短句 */
    if (ls.length === 3) {
      const marks: string[] = ['初', '中', '末'];
      let ok = true;
      for (let i = 0; i < 3; i++) {
        const cs = this.cellsOf(ls[i]);
        if (cs.length < 1 || cs[0] !== marks[i] || ls[i].length > 16 || cs.length > 4) {
          ok = false;
        }
      }
      if (ok && this.countZhi(p) >= 2) {
        return true;
      }
    }
    /* 横排/带天将注的紧凑三传：短、含地支，且不是长正文 */
    if (t.indexOf('三传') === 0 || t.indexOf('三傳') === 0) {
      return ls.length <= 2 && t.length <= 24 && this.countZhi(p) >= 2;
    }
    return false;
  }

  /* 是否为天将行（仅紧凑将名注；详解里的“天将/克日主事”表格走 tableBlock） */
  private isJiangBlock(p: string): boolean {
    const t = p.trim();
    const ls = this.lines(p);
    if (!(t.indexOf('天将') === 0 || t.indexOf('天將') === 0)) {
      return false;
    }
    if (ls.length > 2 || t.length > 28) {
      return false;
    }
    for (let i = 0; i < ls.length; i++) {
      const cs = this.cellsOf(ls[i]);
      if (cs.length < 2) {
        return false;
      }
      for (let j = 1; j < cs.length; j++) {
        if (cs[j].length > 4) {
          return false;
        }
      }
    }
    return true;
  }

  /* 是否为天地盘菱形（多行、首末行4支） */
  private isDiskBlock(p: string): boolean {
    if (p.indexOf('\n') < 0) {
      return false;
    }
    const ls = this.lines(p);
    if (ls.length < 3) {
      return false;
    }
    /* 首行与末行应为 4 个地支 */
    const zhis = '子丑寅卯辰巳午未申酉戌亥';
    const first = ls[0].split(/[\s　]+/);
    const last = ls[ls.length - 1].split(/[\s　]+/);
    if (first.length !== 4 || last.length !== 4) {
      return false;
    }
    for (let i = 0; i < 4; i++) {
      if (zhis.indexOf(first[i]) < 0 || zhis.indexOf(last[i]) < 0) {
        return false;
      }
    }
    return true;
  }

  /* 是否为十二支环列（6行每行2支） */
  private isRingBlock(p: string): boolean {
    if (p.indexOf('\n') < 0) {
      return false;
    }
    const ls = this.lines(p);
    if (ls.length < 3) {
      return false;
    }
    const zhis = '子丑寅卯辰巳午未申酉戌亥';
    let ok = true;
    let total = 0;
    for (let i = 0; i < ls.length; i++) {
      const parts = ls[i].split(/[\s　]+/);
      total += parts.length;
      for (let j = 0; j < parts.length; j++) {
        const t = parts[j].replace(/[^子丑寅卯辰巳午未申酉戌亥]/g, '');
        if (t === '' || zhis.indexOf(t) < 0) {
          ok = false;
          break;
        }
      }
    }
    return ok && total === 12;
  }

  /* 盘式数据解析：四课/三传/天将 → 行数组（去标记词与全角空格）
     竖排三传(初X/中X/末X) 也转成 "X Y Z" 单行 */
  private diskRows(p: string): string[] {
    const out: string[] = [];
    const ls = this.lines(p);
    /* 竖排三传：初X/中X/末X → 收集地支为一行 */
    const t0 = ls.length > 0 ? ls[0] : '';
    if (t0.indexOf('初') === 0 && p.indexOf('中') > 0 && p.indexOf('末') > 0) {
      const zhis = '子丑寅卯辰巳午未申酉戌亥';
      const collected: string[] = [];
      for (let i = 0; i < ls.length; i++) {
        const m = ls[i].match(/[子丑寅卯辰巳午未申酉戌亥]/);
        if (m) {
          collected.push(m[0]);
        }
      }
      if (collected.length > 0) {
        out.push(collected.join(' '));
        return out;
      }
    }
    for (let i = 0; i < ls.length; i++) {
      let t = ls[i].replace(/^四课[\s　]*/, '').replace(/^四課[\s　]*/, '')
        .replace(/^三传[\s　]*/, '').replace(/^三傳[\s　]*/, '')
        .replace(/^天将[\s　]*/, '').replace(/^天將[\s　]*/, '');
      t = t.replace(/[\s　]+/g, ' ').trim();
      /* 课名行（第X课 ...）：整行跳过 */
      if (/^第[一二三四五六七八九十]+课/.test(t) || /^第[一二三四五六七八九十]+課/.test(t)) {
        continue;
      }
      if (t !== '') {
        out.push(t);
      }
    }
    return out;
  }

  build() {
    Column() {
      /* 页头由页面层 PageHeader 提供；此处仅保留"‹ 目录"返回入口（阅读视图→目录） */
      if (this.curIdx >= 0) {
        Text('‹ 目录')
          .fontSize(13)
          .fontColor('#C4B183')
          .padding({ left: 12, right: 12, top: 4, bottom: 4 })
          .borderRadius(9)
          .backgroundColor('#211E18')
          .onClick(() => {
            this.curIdx = -1;
          })
          .margin({ left: 16, top: 8 })
      }

      if (this.curIdx < 0) {
        this.catalogView()
      } else {
        this.readerView()
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#14120F')
  }

  /* ---------------- 目录视图 ---------------- */
  @Builder
  private catalogView() {
    Scroll() {
      Column() {
        if (!this.book) {
          Text('正在载入古籍…')
            .fontSize(12)
            .fontColor('#6B5F45')
            .padding(24)
        } else {
          ForEach(this.listRows(), (c: AncientChapter, idx: number) => {
            if (this.showJuan(idx)) {
              Text(c.卷)
                .fontSize(12)
                .fontWeight(FontWeight.Medium)
                .fontColor('#A8843C')
                .width('100%')
                .padding({ top: 14, bottom: 6 })
            }
            Row({ space: 10 }) {
              Text(String(c.序).padStart(2, '0'))
                .fontSize(12)
                .fontColor('#8A7448')
                .width(24)
              Column({ space: 3 }) {
                Text(c.篇名)
                  .fontSize(15)
                  .fontWeight(FontWeight.Medium)
                  .fontColor('#F0E6C8')
                  .maxLines(1)
                Text(c.导语)
                  .fontSize(11)
                  .fontColor('#8A7B5C')
                  .maxLines(1)
              }
              .layoutWeight(1)
              .alignItems(HorizontalAlign.Start)
              Text('›')
                .fontSize(16)
                .fontColor('#6B5F45')
            }
            .width('100%')
            .padding({ top: 8, bottom: 8 })
            .onClick(() => {
              this.curIdx = idx;
            })
          }, (c: AncientChapter) => 'ch' + c.序)
          Text('内容据馆藏抄本整理，仅供传统文化研习参考')
            .fontSize(10)
            .fontColor('#5A4F3D')
            .width('100%')
            .textAlign(TextAlign.Center)
            .padding({ top: 20, bottom: 72 })
        }
      }
      .width('100%')
      .padding({ left: 16, right: 16 })
    }
    .layoutWeight(1)
    .scrollBar(BarState.Off)
    .edgeEffect(EdgeEffect.Spring)
  }


  /* ---------------- 盘式渲染 ---------------- */

  /* 四课表：两行(上神行/下神行) → 四列卡片 */
  @Builder
  private kegBlock(p: string) {
    Column({ space: 6 }) {
      Text('四课')
        .fontSize(12)
        .fontWeight(FontWeight.Bold)
        .fontColor('#E9C878')
        .width('100%')
      Row({ space: 6 }) {
        ForEach(this.kegUpList(p), (u: string, ui: number) => {
          Column({ space: 2 }) {
            Text(u)
              .fontSize(14)
              .fontWeight(FontWeight.Bold)
              .fontColor('#F0D98C')
            Text(this.kegDown(p, ui))
              .fontSize(13)
              .fontColor('#C4B183')
          }
          .layoutWeight(1)
          .padding({ top: 8, bottom: 8 })
          .borderRadius(8)
          .backgroundColor('#211E18')
          .border({ width: 1, color: 'rgba(233,200,120,0.18)' })
        }, (u: string, ui: number) => 'ku' + ui + u)
      }
      .width('100%')
      Text('上神 / 下神（右起第一课）')
        .fontSize(9)
        .fontColor('#6B5F45')
        .width('100%')
    }
    .width('100%')
    .padding(10)
    .borderRadius(10)
    .backgroundColor('rgba(33,30,24,0.8)')
    .border({ width: 1, color: 'rgba(233,200,120,0.12)' })
    .margin({ top: 10 })
  }

  /* 三传/天将行 */
  @Builder
  private chuanBlock(p: string) {
    Column({ space: 4 }) {
      ForEach(this.diskRows(p), (r: string, ri: number) => {
        Row() {
          Text(ri === 0 ? '三传' : '')
            .fontSize(11)
            .fontWeight(FontWeight.Bold)
            .fontColor('#E9C878')
            .width(36)
          Text(r)
            .fontSize(14)
            .fontWeight(FontWeight.Bold)
            .fontColor('#F0D98C')
            .layoutWeight(1)
          if (ri === 0 && this.diskRows(p).length > 1) {
            Text('初 · 中 · 末')
              .fontSize(9)
              .fontColor('#6B5F45')
          }
        }
        .width('100%')
        .padding({ top: 4, bottom: 4 })
      }, (r: string, ri: number) => 'cb' + ri + r)
    }
    .width('100%')
    .padding(10)
    .borderRadius(10)
    .backgroundColor('rgba(33,30,24,0.8)')
    .border({ width: 1, color: 'rgba(233,200,120,0.12)' })
    .margin({ top: 10 })
  }

  /* 天地盘：每行独立 Row 居中显示该行全部支（首末行4支、中间行2支，不丢支） */
  @Builder
  private diskBlock(p: string) {
    Column({ space: 4 }) {
      Text('天地盘')
        .fontSize(12)
        .fontWeight(FontWeight.Bold)
        .fontColor('#E9C878')
        .width('100%')
      ForEach(this.diskLineList(p), (line: string, li: number) => {
        Row({ space: 4 }) {
          ForEach(this.splitZhi(line), (z: string, zi: number) => {
            Text(z)
              .fontSize(15)
              .fontWeight(FontWeight.Bold)
              .fontColor('#F0D98C')
              .width(48)
              .textAlign(TextAlign.Center)
          }, (z: string, zi: number) => 'dl' + li + zi + z)
        }
        .width('100%')
        .justifyContent(FlexAlign.Center)
      }, (line: string, li: number) => 'dline' + li)
    }
    .width('100%')
    .padding(10)
    .borderRadius(10)
    .backgroundColor('rgba(33,30,24,0.8)')
    .border({ width: 1, color: 'rgba(233,200,120,0.12)' })
    .margin({ top: 10 })
  }

  /* 十二支环列：6行每行2支 → 双列网格 */
  @Builder
  private ringBlock(p: string) {
    Column({ space: 4 }) {
      Text('十二支环列')
        .fontSize(12)
        .fontWeight(FontWeight.Bold)
        .fontColor('#E9C878')
        .width('100%')
      ForEach(this.lines(p), (line: string, li: number) => {
        Row({ space: 10 }) {
          ForEach(this.splitZhi(line), (z: string, zi: number) => {
            Text(z)
              .fontSize(14)
              .fontWeight(FontWeight.Medium)
              .fontColor('#F0D98C')
              .width(52)
              .textAlign(TextAlign.Center)
          }, (z: string, zi: number) => 'r' + li + zi + z)
        }
        .width('100%')
        .justifyContent(FlexAlign.Center)
      }, (line: string, li: number) => 'rl' + li)
    }
    .width('100%')
    .padding(10)
    .borderRadius(10)
    .backgroundColor('rgba(33,30,24,0.8)')
    .border({ width: 1, color: 'rgba(233,200,120,0.12)' })
    .margin({ top: 10 })
  }

  /* 四课上行(上神)数组：第一行拆分成支 */
  private kegUpList(p: string): string[] {
    const rows = this.diskRows(p);
    if (rows.length < 1) {
      return [];
    }
    return rows[0].split(' ');
  }

  /* 四课下行(下神)第 ui 列 */
  private kegDown(p: string, ui: number): string {
    const rows = this.diskRows(p);
    if (rows.length < 2) {
      return '';
    }
    const parts = rows[1].split(' ');
    return ui < parts.length ? parts[ui] : '';
  }

  /* 盘式所有行（数组，供 ForEach 逐行渲染） */
  private diskLineList(p: string): string[] {
    return this.lines(p);
  }

  /* 盘式第 li 行拆分 */
  private diskLine(p: string, li: number): string[] {
    const ls = this.lines(p);
    if (li >= ls.length) {
      return [];
    }
    return ls[li].split(/[\s　]+/);
  }

  /* 盘式行数 */
  private diskLineCount(p: string): number {
    return this.lines(p).length;
  }

  /* 地支行拆分（去空白） */
  private splitZhi(line: string): string[] {
    return line.split(/[\s　]+/);
  }

  /* 通用分列（普通空格/全角空格） */
  private cellsOf(line: string): string[] {
    return line.split(/[\s　]+/);
  }

  /* 统计段落中的地支 token 数（课式紧凑性判断用） */
  private countZhi(p: string): number {
    const zhis = '子丑寅卯辰巳午未申酉戌亥';
    const cs = this.cellsOf(p);
    let n = 0;
    for (let i = 0; i < cs.length; i++) {
      if (zhis.indexOf(cs[i]) >= 0) {
        n++;
      }
    }
    return n;
  }

  /* 代码块内容行（去掉 ``` 围栏） */
  private codeLines(p: string): string[] {
    const ls = this.lines(p);
    const out: string[] = [];
    for (let i = 0; i < ls.length; i++) {
      if (ls[i].indexOf('```') < 0) {
        out.push(ls[i]);
      }
    }
    return out;
  }

  /* 代码块：逐行小字渲染（保留换行） */
  @Builder
  private codeBlock(p: string) {
    Column({ space: 2 }) {
      ForEach(this.codeLines(p), (line: string, li: number) => {
        Text(line)
          .fontSize(11)
          .fontColor('#8A9BA8')
          .lineHeight(17)
          .width('100%')
      }, (line: string, li: number) => 'code' + li)
    }
    .width('100%')
    .padding(10)
    .borderRadius(8)
    .backgroundColor('rgba(33,30,24,0.85)')
    .border({ width: 1, color: 'rgba(138,155,168,0.2)' })
    .margin({ top: 10 })
  }

  /* 表格：逐行渲染（列间全角空格转普通空格，自动换行） */
  @Builder
  private tableBlock(p: string) {
    Column({ space: 3 }) {
      ForEach(this.lines(p), (line: string, li: number) => {
        Text(this.tableClean(line))
          .fontSize(12)
          .fontColor(li === 0 ? '#E9C878' : '#C4B183')
          .fontWeight(li === 0 ? FontWeight.Bold : FontWeight.Normal)
          .lineHeight(19)
          .width('100%')
      }, (line: string, li: number) => 'tab' + li)
    }
    .width('100%')
    .padding(10)
    .borderRadius(8)
    .backgroundColor('rgba(33,30,24,0.85)')
    .border({ width: 1, color: 'rgba(233,200,120,0.15)' })
    .margin({ top: 10 })
  }

  /* 表格行清洗：全角空格→普通空格，去多余竖线 */
  private tableClean(line: string): string {
    return line.replace(/\u3000/g, '  ').replace(/\|/g, ' · ').trim();
  }

  /* ---------------- 阅读视图 ---------------- */
  @Builder
  private readerView() {
    Column() {
      Scroll() {
        Column() {
          /* 篇头 */
          Column({ space: 6 }) {
            Text(this.listRows()[this.curIdx].篇名)
              .fontSize(20)
              .fontWeight(FontWeight.Bold)
              .fontColor('#F0D98C')
            Text(this.listRows()[this.curIdx].卷 + ' · ' + this.listRows()[this.curIdx].导语)
              .fontSize(11)
              .fontColor('#8A7B5C')
              .textAlign(TextAlign.Center)
            Text('文中【存疑】为整理者校勘标注 · 经文原文照录 · 仅供传统文化研习参考')
              .fontSize(9)
              .fontColor('#6B5F45')
              .textAlign(TextAlign.Center)
              .width('100%')
          }
          .width('100%')
          .padding({ top: 18, bottom: 14 })
          .border({ width: { bottom: 1 }, color: 'rgba(233,200,120,0.15)' })

          /* 经文段落（清洗 md + 盘式结构化渲染） */
          ForEach(this.listRows()[this.curIdx].段落, (p: string, pi: number) => {
            if (this.isSectionMark(p)) {
              /* 盘式小节标记：四课/三传 → 金色小标题 */
              Text(this.cleanMark(p))
                .fontSize(13)
                .fontWeight(FontWeight.Bold)
                .fontColor('#E9C878')
                .letterSpacing(2)
                .width('100%')
                .textAlign(TextAlign.Center)
                .padding({ top: 12, bottom: 4 })
            } else if (this.isKegBlock(p)) {
              /* 四课表 */
              this.kegBlock(p)
            } else if (this.isChuanBlock(p) || this.isJiangBlock(p)) {
              /* 三传/天将行 */
              this.chuanBlock(p)
            } else if (this.isDiskBlock(p)) {
              /* 天地盘菱形 */
              this.diskBlock(p)
            } else if (this.isRingBlock(p)) {
              /* 十二支环列 */
              this.ringBlock(p)
            } else if (this.isCodeBlock(p)) {
              /* 代码块：逐行渲染（自动换行，避免长串溢出） */
              this.codeBlock(p)
            } else if (this.isTableBlock(p)) {
              /* 表格：逐行渲染 */
              this.tableBlock(p)
            } else if (this.isSuspect(p)) {
              /* 【存疑】校勘标注：弱化样式（暗色小字 + 斜体 + 弱边框），与正文区分 */
              Text(this.cleanMd(p))
                .fontSize(12)
                .fontStyle(FontStyle.Italic)
                .fontColor('#7A6E55')
                .lineHeight(19)
                .width('100%')
                .padding({ left: 10, right: 8, top: 6, bottom: 6 })
                .borderRadius(6)
                .backgroundColor('rgba(122,110,85,0.08)')
                .border({ width: { left: 2 }, color: 'rgba(122,110,85,0.4)' })
                .margin({ top: 8 })
            } else if (this.isQuote(p)) {
              /* 引用块（原 > 前缀）：缩进 + 暗金 */
              Text(this.cleanQuote(p))
                .fontSize(13)
                .fontColor('#A8986E')
                .lineHeight(22)
                .width('100%')
                .padding({ left: 12, right: 8, top: 8, bottom: 8 })
                .borderRadius(8)
                .backgroundColor('rgba(168,152,110,0.08)')
                .border({ width: { left: 3 }, color: 'rgba(168,152,110,0.5)' })
                .margin({ top: 10 })
            } else {
              /* 正文段落（去 md 标记：- / # / **） */
              Text(this.cleanMd(p))
                .fontSize(15)
                .fontColor('#D8CBA8')
                .lineHeight(26)
                .width('100%')
                .margin({ top: 10 })
            }
          }, (p: string, pi: number) => 'p' + this.curIdx + '-' + pi)
        }
        .width('100%')
        .padding({ left: 18, right: 18, bottom: 72 })
      }
      .layoutWeight(1)
      .scrollBar(BarState.Off)
      .edgeEffect(EdgeEffect.Spring)

      /* 上一篇 / 下一篇 */
      Row({ space: 10 }) {
        Button(this.curIdx > 0 ? '上一篇' : '已是首篇')
          .layoutWeight(1)
          .height(38)
          .fontSize(13)
          .fontColor('#E9C878')
          .backgroundColor('#211E18')
          .borderRadius(19)
          .enabled(this.curIdx > 0)
          .onClick(() => {
            if (this.curIdx > 0) {
              this.curIdx--;
            }
          })
        Button(this.curIdx < this.listRows().length - 1 ? '下一篇' : '已是末篇')
          .layoutWeight(1)
          .height(38)
          .fontSize(13)
          .fontColor('#1A1410')
          .backgroundColor('#D9A94E')
          .borderRadius(19)
          .enabled(this.curIdx < this.listRows().length - 1)
          .onClick(() => {
            if (this.curIdx < this.listRows().length - 1) {
              this.curIdx++;
            }
          })
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 8, bottom: 72 })
      .backgroundColor('#1C1A16')
      .border({ width: { top: 1 }, color: 'rgba(233,200,120,0.15)' })
    }
    .width('100%')
    .height('100%')
  }
}

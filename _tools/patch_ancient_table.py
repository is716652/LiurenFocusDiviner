# -*- coding: utf-8 -*-
"""patch_ancient_table.py —— 古籍表格/代码块渲染:
   识别 markdown 表格(列名行+数据行)与代码块(```围栏),逐行自动换行渲染,避免溢出"""
import io, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, "APP", "LiurenFocusDiviner", "entry", "src", "main", "ets", "components", "AncientStudy.ets")

def rd():
    with io.open(P, "r", encoding="utf-8") as f:
        return f.read()

def wr(s):
    with io.open(P, "w", encoding="utf-8") as f:
        f.write(s)

c = rd()

# 1) 加识别方法(在 isSuspect 前)
old = """  /* 是否为校勘标注（【存疑】/【直释】/【推阐】/【旁证】/详解依据） */
  private isSuspect(p: string): boolean {"""
new = """  /* 是否为代码块（``` 围栏） */
  private isCodeBlock(p: string): boolean {
    return p.indexOf('```') >= 0;
  }

  /* 是否为 markdown 表格（首行含全角空格分隔列名 + 多行数据；且非盘式） */
  private isTableBlock(p: string): boolean {
    if (p.indexOf('\\u3000') < 0) {
      return false;
    }
    if (this.lines(p).length < 2) {
      return false;
    }
    /* 盘式已在更早分支处理，此处仅剩表格类 */
    return true;
  }

  /* 是否为校勘标注（【存疑】/【直释】/【推阐】/【旁证】/详解依据） */
  private isSuspect(p: string): boolean {"""
assert old in c, "suspect anchor"
c = c.replace(old, new, 1)

# 2) ForEach 分支:盘式判断后、isSuspect 前插 codeBlock/tableBlock
old2 = """            } else if (this.isRingBlock(p)) {
              /* 十二支环列 */
              this.ringBlock(p)
            } else if (this.isSuspect(p)) {"""
new2 = """            } else if (this.isRingBlock(p)) {
              /* 十二支环列 */
              this.ringBlock(p)
            } else if (this.isCodeBlock(p)) {
              /* 代码块：逐行渲染（自动换行，避免长串溢出） */
              this.codeBlock(p)
            } else if (this.isTableBlock(p)) {
              /* 表格：逐行渲染 */
              this.tableBlock(p)
            } else if (this.isSuspect(p)) {"""
assert old2 in c, "foreach anchor"
c = c.replace(old2, new2, 1)

# 3) 加 codeBlock/tableBlock @Builder(放在盘式渲染区末尾,即 阅读视图 前)
old3 = """  /* ---------------- 阅读视图 ---------------- */"""
new3 = """  /* 代码块：逐行小字渲染（保留换行） */
  @Builder
  private codeBlock(p: string) {
    Column({ space: 2 }) {
      ForEach(this.lines(p), (line: string, li: number) => {
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
    return line.replace(/\\u3000/g, '  ').replace(/\\|/g, ' · ').trim();
  }

  /* ---------------- 阅读视图 ---------------- */"""
assert old3 in c, "readerView anchor"
c = c.replace(old3, new3, 1)

wr(c)
print("表格/代码块渲染 OK")

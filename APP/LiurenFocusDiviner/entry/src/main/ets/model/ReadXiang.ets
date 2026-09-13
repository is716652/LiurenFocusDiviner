/**
 * ReadXiang —— 点宫速查卡的内容装配（Agent.md §14.4）
 * ----------------------------------------------------------------------------
 * 分工：**引擎出数、App 出呈现**。
 *  - 盘上事实（宫/支/五行/阴阳/六亲/与日干·用神生克/气机宫位/旬空/神煞/乘将/遁干/角色）取自
 *    `LiurenCore.palaceLookup()`（引擎已算，ArkTS 安全）；
 *  - 象义文案（气机一句话、冲宫、合宫、三合、延长带、空亡三态）取自 ReadXiangData 的摊平表；
 *  - 顺序照《以炁为基点读象》的三层景：**远景（旺衰背景）→ 中景（冲空刑合）→ 近景（三宫 + 乘将）→ 气机点→收梢**。
 *
 * 纪律（与 core 侧 qijiReading 同口径，测试会交叉核对两端口径一致）：
 *  ① 我方陈述只讲**盘上关系**，不给现实结论；
 *  ② 原文口诀（气机一句、空亡现场一句、助日口诀）单独成行并标注「原文」，不与我方陈述混写；
 *  ③ 缺表 → 明说未加载，不造值（§14.2）。
 */
import { Chart } from './LiurenCore';
import { LiurenCore } from './LiurenCore';
/* PalaceLookup 属「UI 专用类型」，由 pan/types 声明（门面只 re-export 其余类型），故从此处取 */
import type { PalaceLookup } from './pan/types';
import { ReadXiangData } from './ReadXiangData';

/* 速查卡的一行 */
export interface ReadXiangRow {
  label: string;   /* 行首小标题（远景 / 中景 / 近景 / 气机点 …） */
  text: string;    /* 该行正文（我方陈述：只讲盘上关系） */
  source: string;  /* 原文引用（可为空；非空时 UI 会加「原文」标注） */
  tone: string;    /* plain | gold | warn */
}

export class ReadXiang {
  /* 收梢一句（与 core 的 qijiReading().text 同格式，便于交叉核对） */
  static gist(c: Chart, tianZhi: string): string {
    const gong: string = ReadXiang.qijiGong(c, tianZhi);
    if (gong === '') {
      return '';
    }
    const gi: number = LiurenCore.BASE.GAN.indexOf(c.r.dg);
    const side: string = (gi >= 0 && gi % 2 === 0) ? '阳干顺' : '阴干逆';
    const parts: string[] = [];
    parts.push(gong + '宫（' + side + '）');
    const liuHe: string = ReadXiangData.qijiOf(gong, '本宫六合');
    const sanHe: string = ReadXiangData.qijiOf(gong, '三合局');
    if (liuHe !== '') {
      parts.push('本宫六合 ' + liuHe);
    }
    if (sanHe !== '') {
      parts.push('三合局 ' + sanHe);
    }
    const nd = c.dx.nodes[tianZhi];
    const kong: boolean = nd !== undefined && nd.kong;
    parts.push(kong ? '该支旬空' : '该支不空');
    const chongZhi: string = ReadXiangData.chong[tianZhi] || '';
    if (chongZhi !== '') {
      const cnd = c.dx.nodes[chongZhi];
      const ck: boolean = cnd !== undefined && cnd.kong;
      parts.push('冲支 ' + chongZhi + (ck ? '（亦空）' : ''));
    }
    const state: string = ReadXiang.kongState(c, tianZhi);
    if (state !== '') {
      parts.push('空亡态 ' + state);
    }
    return parts.join(' · ');
  }

  /* 该支的气机宫位名（引擎已算；缺表/该干无此支 → 空串） */
  static qijiGong(c: Chart, tianZhi: string): string {
    const pl: PalaceLookup = LiurenCore.palaceLookup(c, tianZhi, '');
    return pl.qiJi;
  }

  /* 空亡三态：同宫空亡 / 冲空 / ''（填实依赖流年流月流日，盘上不预判 → 只作条件说明） */
  static kongState(c: Chart, tianZhi: string): string {
    const nd = c.dx.nodes[tianZhi];
    if (nd !== undefined && nd.kong) {
      return '同宫空亡';
    }
    const chongZhi: string = ReadXiangData.chong[tianZhi] || '';
    if (chongZhi !== '') {
      const cnd = c.dx.nodes[chongZhi];
      if (cnd !== undefined && cnd.kong) {
        return '冲空';
      }
    }
    return '';
  }

  /* 三层景 + 气机点 + 收梢，装配成速查卡 */
  static card(c: Chart, gongOrZhi: string, yongShenZhi: string): ReadXiangRow[] {
    const rows: ReadXiangRow[] = [];
    const pl: PalaceLookup = LiurenCore.palaceLookup(c, gongOrZhi, yongShenZhi);
    if (pl.gong === '') {
      rows.push({ label: '地盘宫', text: '该值不是合法地支，无法查宫', source: '', tone: 'warn' });
      return rows;
    }
    /* —— 近景第 0 行：这一宫是什么 —— */
    rows.push({
      label: '此宫', tone: 'gold', source: '',
      text: '地盘' + pl.gong + '宫 · 天盘' + pl.tianZhi + '（' + pl.wuXing + pl.yinYang + '）· ' + pl.role.text
    });
    /* —— 远景：旺衰背景 —— */
    const ws: string = ReadXiangData.wangShuaiOf(c.r.dg, pl.tianZhi);
    rows.push({
      label: '远景', tone: 'plain', source: '',
      text: ws === ''
        ? '旺衰表未加载：该支旺衰不可用（盘仍照旧排出）'
        : '日干' + c.r.dg + '在此支为「' + ws + '」'
    });
    /* —— 中景：冲 / 合 / 刑 / 害 / 空 —— */
    const rel: string[] = [];
    const chongZhi: string = ReadXiangData.chong[pl.tianZhi] || '';
    if (chongZhi !== '') {
      const cnd = c.dx.nodes[chongZhi];
      const ck: boolean = cnd !== undefined && cnd.kong;
      rel.push('冲 ' + chongZhi + (ck ? '（该支空）' : ''));
    }
    const heZhi: string = ReadXiangData.he[pl.tianZhi] || '';
    if (heZhi !== '') {
      rel.push('六合 ' + heZhi);
    }
    const haiZhi: string = ReadXiangData.hai[pl.tianZhi] || '';
    if (haiZhi !== '') {
      rel.push('害 ' + haiZhi);
    }
    const xingArr: string[] = ReadXiangData.xing[pl.tianZhi] || [];
    if (xingArr.length > 0) {
      rel.push('刑 ' + xingArr.join('、'));
    }
    rel.push(pl.kong ? '旬空' : '不空');
    rows.push({
      label: '中景', tone: pl.kong ? 'warn' : 'plain', source: '',
      text: rel.join(' · ')
    });
    /* —— 近景：与日干 / 与用神 / 乘将 / 遁干 / 神煞 —— */
    const near: string[] = [];
    near.push('与日干' + pl.relToRiGan + '（' + pl.liuQin + '）');
    if (pl.relToYongShen !== '') {
      near.push('与用神' + pl.relToYongShen);
    }
    if (pl.jiang !== '') {
      near.push('乘' + pl.jiang);
    }
    if (pl.dun !== '') {
      near.push('旬遁' + pl.dun);
    }
    if (pl.dunRi !== '') {
      near.push('日遁' + pl.dunRi);
    }
    rows.push({ label: '近景', tone: 'plain', source: '', text: near.join(' · ') });
    if (pl.shensha.length > 0) {
      rows.push({ label: '神煞', tone: 'plain', source: '', text: pl.shensha.join('、') });
    }
    /* —— 气机点：宫位名 × 表内象义 / 冲宫 / 合宫 / 三合 / 延长带 × 空亡三态 —— */
    if (pl.qiJi !== '') {
      const gi: number = LiurenCore.BASE.GAN.indexOf(c.r.dg);
      const yangGan: boolean = gi >= 0 && gi % 2 === 0;
      const side: string = yangGan ? '阳干顺' : '阴干逆';
      const line: string = ReadXiangData.qijiOf(pl.qiJi, yangGan ? '阳干顺' : '阴干逆');
      const chongGong: string = ReadXiangData.qijiOf(pl.qiJi, '冲宫');
      const heLine: string = ReadXiangData.qijiOf(pl.qiJi, yangGan ? '合阳' : '合阴');
      const liuHe: string = ReadXiangData.qijiOf(pl.qiJi, '本宫六合');
      const sanHe: string = ReadXiangData.qijiOf(pl.qiJi, '三合局');
      const yanChang: string = ReadXiangData.qijiOf(pl.qiJi, '延长带象义');
      const own: string[] = [];
      own.push('气机宫位「' + pl.qiJi + '」（' + side + '）');
      if (chongGong !== '') {
        own.push('冲宫 ' + chongGong);
      }
      if (liuHe !== '') {
        own.push('本宫六合 ' + liuHe);
      }
      if (sanHe !== '') {
        own.push('三合局 ' + sanHe);
      }
      if (ReadXiangData.ready) {
        const st: string = ReadXiang.kongState(c, pl.tianZhi);
        if (st === '同宫空亡') {
          own.push('空亡态 同宫空亡：' + ReadXiangData.kongEffectOf('同宫空亡'));
        } else if (st === '冲空') {
          own.push('空亡态 冲空：' + ReadXiangData.kongEffectOf('冲空亡'));
        } else {
          own.push('未见空亡（填实需俟流年/流月/流日补足该支，盘上不预判）');
        }
      } else {
        own.push('气机点表未加载：象义与空亡口径不可用');
      }
      rows.push({ label: '气机点', tone: 'gold', source: '', text: own.join(' · ') });
      /* 原文行（单独成行，加「原文」标注，不与我方陈述混写） */
      const src: string[] = [];
      if (line !== '') {
        src.push(line);
      }
      if (heLine !== '') {
        src.push(heLine);
      }
      if (yanChang !== '') {
        src.push(yanChang);
      }
      const stLine: string = ReadXiang.kongState(c, pl.tianZhi);
      const kongSrc: string = stLine === '同宫空亡'
        ? ReadXiangData.kongLineOf(pl.qiJi, '同宫空亡')
        : (stLine === '冲空' ? ReadXiangData.kongLineOf(pl.qiJi, '冲空') : '');
      if (kongSrc !== '') {
        src.push(kongSrc);
      }
      if (src.length > 0) {
        rows.push({ label: '原文', tone: 'plain', source: src.join(' ｜ '), text: '' });
      }
    } else if (ReadXiangData.ready) {
      rows.push({ label: '气机点', tone: 'plain', source: '', text: '该支不在日干气机十二宫之内' });
    } else {
      rows.push({ label: '气机点', tone: 'warn', source: '', text: '气机点表未加载，本栏不可用（盘仍照旧排出）' });
    }
    /* —— 收梢：一句盘面陈述（与 core 同格式） —— */
    const gist: string = ReadXiang.gist(c, pl.tianZhi);
    if (gist !== '') {
      rows.push({ label: '此宫一句', tone: 'plain', source: '', text: gist });
    }
    return rows;
  }

  /* 助日「为什么助」：由已算的 zhu 标记 + 表内口诀，逐条说明命中/违碍 */
  static zhuriWhy(c: Chart): string[] {
    const out: string[] = [];
    const yj = c.dx.yuejiang;
    const yjHit: string[] = [];
    if (yj.linGan) { yjHit.push('临日干上神'); }
    if (yj.shengGan) { yjHit.push('生扶日干'); }
    if (yj.faYong) { yjHit.push('发用入三传'); }
    if (yj.wangShuai === '旺' || yj.wangShuai === '相') { yjHit.push('乘' + yj.wangShuai + '气'); }
    const yjBad: string[] = [];
    if (yj.keGan) { yjBad.push('克日干'); }
    if (yj.kong) { yjBad.push('旬空'); }
    out.push('月将' + yj.zhi + '（' + yj.gong + '宫）：'
      + (yjHit.length > 0 ? '中 ' + yjHit.join('、') : '未中助日条件')
      + (yjBad.length > 0 ? '；见 ' + yjBad.join('、') : '')
      + ' → ' + (yj.zhu ? '助日' : '不助日'));
    const gr = c.dx.guiren;
    const grHit: string[] = [];
    if (gr.linGan) { grHit.push('临日干上神'); }
    if (gr.shengGan) { grHit.push('生扶日干'); }
    if (gr.faYong) { grHit.push('发用入三传'); }
    if (gr.wangShuai === '旺' || gr.wangShuai === '相') { grHit.push('乘' + gr.wangShuai + '气'); }
    const grBad: string[] = [];
    if (gr.keGan) { grBad.push('克日干'); }
    if (gr.kong) { grBad.push('旬空'); }
    if (gr.wangShuai === '死' || gr.wangShuai === '囚') { grBad.push('乘' + gr.wangShuai + '气'); }
    out.push('贵人临' + gr.zhi + '宫：'
      + (grHit.length > 0 ? '中 ' + grHit.join('、') : '未中助日条件')
      + (grBad.length > 0 ? '；见 ' + grBad.join('、') : '')
      + ' → ' + (gr.zhu ? '助日' : '不助日'));
    return out;
  }
}

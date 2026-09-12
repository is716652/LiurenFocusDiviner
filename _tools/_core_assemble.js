/* ============================================================================
 * _core_assemble.js —— core 侧切片后的收尾（可重复执行，幂等）
 *   1) 装配层 core/liuren/facade.ts：补常量绑定 / 模块别名 / 新只读接口转发
 *   2) 可见性：跨模块被调用的原 private static 提升为 public（与 .ets 侧同一批）
 *   3) DuxiangRulesRaw 补三个已在 rawfile 的规则表键声明（引擎本就在读，接口原先漏声明）
 * 用法：node _tools/_core_split.js ts && node _tools/_core_assemble.js && node _tools/build_core.js
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

/* ---------- 1) 门面 ---------- */
{
  const P = path.join(ROOT, 'core', 'liuren', 'facade.ts');
  let t = fs.readFileSync(P, 'utf-8');

  if (t.indexOf('static readonly GAN:') < 0) {
    const ANCHOR = 'class LiurenCore {';
    const BIND = [
      '/* ---------------- 常量表（实现已搬入各模块；此处按原样再暴露一份，对外 API 不变） ---------------- */',
      "  static readonly GAN: string[] = LrBase.GAN;",
      "  static readonly ZHI: string[] = LrBase.ZHI;",
      "  static readonly JI_GONG: Record<string, string> = LrBase.JI_GONG;",
      "  static readonly WX: Record<string, string> = LrBase.WX;",
      "  static readonly WXG: Record<string, string> = LrBase.WXG;",
      "  static readonly KE: Record<string, string> = LrBase.KE;",
      "  static readonly GUIREN: Record<string, string[]> = LrBase.GUIREN;",
      "  static readonly YANG_ZHI: Record<string, number> = LrBase.YANG_ZHI;",
      "  static readonly G_YANG: Record<string, number> = LrBase.G_YANG;",
      "  static readonly JIANG_ORDER: string[] = LrJiang.JIANG_ORDER;",
      "  static readonly JIANG_DAY_HOURS: string[] = LrJiang.JIANG_DAY_HOURS;",
      "  static readonly JIANG_SHUN_GONGS: string[] = LrJiang.JIANG_SHUN_GONGS;",
      "  static readonly BENSHEN: Record<string, string> = LrJiang.BENSHEN;",
      "  static readonly JIANG_JX: Record<string, string> = LrJiang.JIANG_JX;",
      "  static readonly JIANG_WARN: Record<string, string> = LrJiang.JIANG_WARN;",
      "  static readonly MAOXING_ANCHOR: string = LrSanchuan.MAOXING_ANCHOR;",
      "  static readonly BA_ZHUAN_STEP: number = LrSanchuan.BA_ZHUAN_STEP;",
      "  static readonly JINGLAN_SHE: Record<string, string> = LrSanchuan.JINGLAN_SHE;",
      "  static readonly ZI_XING: Record<string, number> = LrSanchuan.ZI_XING;",
      "  static readonly MA_ZHI: Record<string, string> = LrSanchuan.MA_ZHI;",
      "  static readonly XING_MAP: Record<string, string> = LrSanchuan.XING_MAP;",
      "  static readonly HE_GAN: Record<string, string> = LrSanchuan.HE_GAN;",
      "  static readonly QIAN_SANHE: Record<string, string> = LrSanchuan.QIAN_SANHE;",
      "  static readonly XN_SCORE_DEFAULT: XingNianScoreRule = LrDx.XN_SCORE_DEFAULT;",
      "  static readonly YUE_LING: Record<string, Record<string, string>> = LrDx.YUE_LING;",
      "  static readonly QIJI_GONG: Record<string, Record<string, string>> = LrDx.QIJI_GONG;",
      "  static readonly ZHI_GONG: Record<string, Record<string, string>> = LrDx.ZHI_GONG;",
      "  static readonly EMPTY_NODE: NodeState = LrDx.EMPTY_NODE;",
      "  static readonly XUN_KONG: Record<string, string[]> = LrShensha.XUN_KONG;",
      "  static readonly XUN_OF: Record<string, string> = LrXunkong.XUN_OF;",
      '',
      '  /* ---------------- 模块 class 别名（实现全部在各模块文件里） ---------------- */',
      '  static readonly BASE: typeof LrBase = LrBase;',
      '  static readonly JIGONG: typeof LrJigong = LrJigong;',
      '  static readonly XUNKONG: typeof LrXunkong = LrXunkong;',
      '  static readonly JIANG: typeof LrJiang = LrJiang;',
      '  static readonly DUNGAN: typeof LrDungan = LrDungan;',
      '  static readonly SANCHUAN: typeof LrSanchuan = LrSanchuan;',
      '  static readonly SIKE: typeof LrSike = LrSike;',
      '  static readonly TIANDIPAN: typeof LrTiandipan = LrTiandipan;',
      '  static readonly SHENSHA: typeof LrShensha = LrShensha;',
      '  static readonly DX: typeof LrDx = LrDx;',
      '  static readonly BIFA: typeof LrBifa = LrBifa;',
      '  static readonly ZHONGHUANG: typeof LrZhonghuang = LrZhonghuang;',
      '  static readonly YONGSHEN: typeof YongShenCore = YongShenCore;',
      ''
    ].join('\n');
    t = t.replace(ANCHOR, ANCHOR + '\n' + BIND);
  }

  /* 新只读接口转发（幂等） */
  if (t.indexOf('static ruleHealth(') < 0) {
    const A = '  /* ---------------- 点宫速查：只读接口（实现：pan/dx） ---------------- */';
    const ADD = [
      '  /* ---------------- 缺表自述 / 点宫速查：只读接口（实现：pan/dx） ---------------- */',
      '  static ruleHealth(): RuleHealthItem[] { return LrDx.ruleHealth(); }',
      '  static missingRules(): RuleHealthItem[] { return LrDx.missingRules(); }',
      '  static palaceLookup(c: Chart, gongOrZhi: string, yongShenZhi: string): PalaceLookup { return LrDx.palaceLookup(c, gongOrZhi, yongShenZhi); }',
      ''
    ].join('\n');
    if (t.indexOf(A) >= 0) t = t.replace(A, ADD + A);
    else t = t.replace(/\n\}[ \t]*$/, '\n\n' + ADD + '}\n');
  }

  /* 原内部方法转发（幂等）：拆分前 JS 运行时可见，保持对外 API 一字不变 */
  if (t.indexOf('static withDx(') < 0) {
    const A = '  /* ---------------- 缺表自述 / 点宫速查：只读接口（实现：pan/dx） ---------------- */';
    const ADD = [
      '  /* ---------------- 拆分前的内部方法（原为 private static，JS 运行时可见） ---------------- */',
      '  static findDayRec(date: string, calData: Record<string, DayRec[]>): DayRec | null { return LrTiandipan.findDayRec(date, calData); }',
      '  static wangT(): Record<string, Record<string, string>> { return LrDx.wangT(); }',
      '  static yearZhiOf(r: DayRec): string { return LrDx.yearZhiOf(r); }',
      '  static withDx(c: ChartCore, dx: Duxiang): Chart { return LrDx.withDx(c, dx); }',
      ''
    ].join('\n');
    if (t.indexOf(A) >= 0) t = t.replace(A, ADD + A);
  }

  /* 装配产物声明（与本文件是装配输入区分开） */
  if (t.indexOf('/* 门面真源') < 0) {
    t = t.replace('class LiurenCore {', '/* 门面真源：本文件是 core/liuren/** 与门面的装配输入之一（见 _tools/build_core.js） */\nclass LiurenCore {');
  }
  fs.writeFileSync(P, t, 'utf-8');
  console.log('  ✓ core/liuren/facade.ts（常量绑定 + 别名 + 新接口转发）');
}

/* ---------- 2) 可见性提升 ---------- */
{
  const VIS = [
    ['core/liuren/pan/dx.ts', ['EMPTY_NODE', 'wangT', 'yearZhiOf', 'withDx']],
    ['core/liuren/pan/tiandipan.ts', ['findDayRec']]
  ];
  let n = 0;
  for (const [rel, names] of VIS) {
    const p = path.join(ROOT, rel);
    let t = fs.readFileSync(p, 'utf-8');
    for (const nm of names) {
      const from = 'private static ' + nm;
      if (t.indexOf(from) >= 0) { t = t.split(from).join('static ' + nm); n++; }
    }
    fs.writeFileSync(p, t, 'utf-8');
  }
  console.log('  ✓ 可见性提升 ' + n + ' 处（EMPTY_NODE/wangT/yearZhiOf/withDx/findDayRec）');
}

/* ---------- 3) DuxiangRulesRaw 补键 ---------- */
{
  const p = path.join(ROOT, 'core', 'liuren', 'types.ts');
  let t = fs.readFileSync(p, 'utf-8');
  if (t.indexOf('"十二宫气机点"?: Object;') >= 0) console.log('  · DuxiangRulesRaw 已补过');
  else {
    const A = 'interface DuxiangRulesRaw {';
    const ADD = [
      '  /* 以下三张表由 DataLoader 读入 rules.duxiang；引擎侧目前只在自检里读其存在性',
      '     （§14.4：三张「加载但引擎未读」的规则表，归入点宫速查卡作规则出处）。 */',
      '  "十二宫气机点"?: Object;',
      '  "空亡规则"?: Object;',
      '  "助日规则"?: Object;'
    ].join('\n');
    t = t.replace(A, A + '\n' + ADD);
    fs.writeFileSync(p, t, 'utf-8');
    console.log('  ✓ DuxiangRulesRaw 补 3 个可选键');
  }
}
console.log('core 侧收尾完成。');

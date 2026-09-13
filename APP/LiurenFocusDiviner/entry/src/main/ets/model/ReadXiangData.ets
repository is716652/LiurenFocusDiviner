/**
 * ReadXiangData —— 读象数据的「摊平」容器（Agent.md §14.4 点宫速查卡）
 * ----------------------------------------------------------------------------
 * 为什么需要摊平：ArkTS 禁止对未声明/`Object` 值做下标（arkts-no-props-by-index），
 * 而三张读象规则表（十二宫气机点 / 空亡规则 / 助日规则）是嵌套结构。
 * 做法：由 DataLoader 在**读取阶段**把需要的那几层一次性摊平成
 * `Record<string, Record<string, string>>`（Record 的下标在 ArkTS 里是允许的），
 * 之后的 UI 与逻辑只碰摊平后的表，不再碰嵌套结构。
 *
 * 纪律：
 *  - 本文件只做**数据装填**，不做任何判断（判断一律在引擎 LiurenCore 里）；
 *  - 缺表 → ready=false，UI 依此标注「规则表未加载」，**不造值**（§14.2）。
 */
export class ReadXiangData {
  /* 十二宫气机点：宫位名（长生…养）→ { 阳干顺, 阴干逆, 冲宫, 合阳, 合阴, 本宫六合, 三合局, 延长带象义 } */
  static qiji: Record<string, Record<string, string>> = {};
  /* 空亡规则·三种操作：同宫空亡 / 冲空亡 / 填实空亡 → { 定义, 对气机影响, 现场一句 } */
  static kongOps: Record<string, Record<string, string>> = {};
  /* 空亡规则·气机宫速用：宫位名 → { 同宫空亡, 冲空, 填实 } */
  static kongSu: Record<string, Record<string, string>> = {};
  /* 助日规则·月将口诀（原文，原样引用） */
  static zhuriKouJue: string = '';
  /* 气机点「一句话背」与「合宫一句背」（原文口诀，可选展示） */
  static qijiKouJue: string = '';
  static qijiHeKouJue: string = '';
  /* 背景与关系（远景/中景用）：旺衰[日干][支]、六冲、六合、六害、三刑 */
  static wangShuai: Record<string, Record<string, string>> = {};
  static chong: Record<string, string> = {};
  static he: Record<string, string> = {};
  static hai: Record<string, string> = {};
  static xing: Record<string, string[]> = {};
  static ready: boolean = false;

  /* 背景与关系表（由 DataLoader 调入；与上面三张读象表分开装填，便于各自判缺） */
  static fillBasics(wangShuai: Record<string, Record<string, string>>,
    chong: Record<string, string>, he: Record<string, string>,
    hai: Record<string, string>, xing: Record<string, string[]>): void {
    ReadXiangData.wangShuai = wangShuai;
    ReadXiangData.chong = chong;
    ReadXiangData.he = he;
    ReadXiangData.hai = hai;
    ReadXiangData.xing = xing;
  }

  /* 旺衰（日干 + 支）：缺表返回空串（不造值） */
  static wangShuaiOf(dg: string, zhi: string): string {
    const row = ReadXiangData.wangShuai[dg];
    if (row === undefined) {
      return '';
    }
    return row[zhi] || '';
  }

  /* 由 DataLoader 在解析完规则表后调用（幂等） */
  static fill(qiji: Record<string, Record<string, string>>,
    kongOps: Record<string, Record<string, string>>,
    kongSu: Record<string, Record<string, string>>,
    zhuriKouJue: string, qijiKouJue: string, qijiHeKouJue: string): void {
    ReadXiangData.qiji = qiji;
    ReadXiangData.kongOps = kongOps;
    ReadXiangData.kongSu = kongSu;
    ReadXiangData.zhuriKouJue = zhuriKouJue;
    ReadXiangData.qijiKouJue = qijiKouJue;
    ReadXiangData.qijiHeKouJue = qijiHeKouJue;
    ReadXiangData.ready = Object.keys(qiji).length > 0;
  }

  static reset(): void {
    ReadXiangData.qiji = {};
    ReadXiangData.kongOps = {};
    ReadXiangData.kongSu = {};
    ReadXiangData.zhuriKouJue = '';
    ReadXiangData.qijiKouJue = '';
    ReadXiangData.qijiHeKouJue = '';
    ReadXiangData.ready = false;
  }

  /* 某宫某字段（缺表/缺字段 → 空串，绝不造值） */
  static qijiOf(gong: string, field: string): string {
    const row = ReadXiangData.qiji[gong];
    if (row === undefined) {
      return '';
    }
    return row[field] || '';
  }

  /* 气机点空亡三态的一句话（宫位名 + 态） */
  static kongLineOf(gong: string, state: string): string {
    const row = ReadXiangData.kongSu[gong];
    if (row === undefined) {
      return '';
    }
    return row[state] || '';
  }

  /* 空亡某态的对气机影响（态名用表内键：同宫空亡 / 冲空亡 / 填实空亡） */
  static kongEffectOf(stateKey: string): string {
    const row = ReadXiangData.kongOps[stateKey];
    if (row === undefined) {
      return '';
    }
    return row['对气机影响'] || '';
  }
}

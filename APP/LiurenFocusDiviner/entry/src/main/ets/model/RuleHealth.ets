/**
 * RuleHealth —— 规则表加载状态登记与数据自检（Agent.md §14.3）
 * ----------------------------------------------------------------------------
 * 为什么需要（§14.1 的根因）：过去「确实无」与「没读到」在 UI 上长得一模一样 ——
 * `DataLoader.readRaw` 读不到就返回空串，`JSON.parse('')` 抛错又被上层 `catch` 吞掉，
 * 结果栏位静默空白，用户以为软件坏了。本模块把「每张规则表读到了没有、解析成没成、
 * 条目数多少、必填键缺没缺」逐表登记下来，供 UI 徽标 / 缺表清单 / 自检页 / 导出诊断使用。
 *
 * 纪律（§14.7）：
 *  - 缺表**照旧出盘**（不得整体 fail-fast，用户要求「总能排出来」），但状态必须显式登记；
 *  - **面向用户的文案不得出现数据文件名**（不得写「xxx.json 未加载」），只写规则表名；
 *  - 登记口径按**实际加载入口**逐表记，不按目录数硬编码（见 §14.3 计数口径）。
 * ArkTS 合规：零 any / unknown；不用变量下标取字典（arkts-no-props-by-index），一律数组 + 显式字段。
 */
import { hilog } from '@kit.PerformanceAnalysisKit';

const DOMAIN: number = 0x0001;
const TAG: string = 'RuleHealth';

/* 单张规则表的状态（对外只读快照） */
export interface RuleTableStatus {
  key: string;            /* 稳定 id（内部用） */
  label: string;          /* 面向用户的规则表名（不含文件名） */
  loaded: boolean;        /* 读到且解析成功 */
  entries: number;        /* 条目数；-1 = 不适用 */
  failReason: string;     /* 面向用户的失败原因（空 = 无失败） */
  missingKeys: string[];  /* 必填键缺失（表读到了但内容不全） */
  version: string;        /* 表内版本/来源字段（如「元数据」里的版本） */
  ts: number;             /* 本次登记时间戳 */
}

/* 内部可变记录 */
class RuleTableRec {
  key: string = '';
  label: string = '';
  loaded: boolean = false;
  entries: number = -1;
  failReason: string = '';
  missingKeys: string[] = [];
  version: string = '';
  ts: number = 0;
}

/* 已知规则表清单（分母）：与 rawfile/rule 下 14 张表一一对应，label 为面向用户的表名 */
const TABLE_KEYS: string[] = [
  'wangshuai', 'qijidian', 'kongwang', 'zhuri', 'jichu', 'shensha', 'bifa',
  'xingnian', 'zhanshi', 'guanlu', 'leixiang', 'xiangyi', 'bifacoach', 'ketiyi'
];
const TABLE_LABELS: string[] = [
  '旺衰休囚死', '十二宫气机点', '空亡规则', '助日规则', '基础关系（冲合害刑）',
  '神煞起法', '毕法赋一百法', '行年打分', '占事体系', '管辂类神取用',
  '类象库', '管辂象意', '毕法教练', '课体课义'
];

export class RuleHealth {
  private static recs: RuleTableRec[] = [];
  private static warned: string[] = [];   /* 已记过日志的表：每张表每次启动只记一次 */
  private static tipShown: boolean = false;   /* 缺表顶部提示：每次启动只提示一次（§14.7 第 1 条） */

  /* 初始化登记表（幂等） */
  static init(): void {
    if (RuleHealth.recs.length === TABLE_KEYS.length) {
      return;
    }
    const list: RuleTableRec[] = [];
    for (let i = 0; i < TABLE_KEYS.length; i++) {
      const r = new RuleTableRec();
      r.key = TABLE_KEYS[i];
      r.label = TABLE_LABELS[i];
      list.push(r);
    }
    RuleHealth.recs = list;
    RuleHealth.warned = [];
  }

  /* 复位（自检页「重新自检」与单测用） */
  static reset(): void {
    RuleHealth.recs = [];
    RuleHealth.warned = [];
    RuleHealth.init();
  }

  private static find(key: string): RuleTableRec | null {
    for (const r of RuleHealth.recs) {
      if (r.key === key) {
        return r;
      }
    }
    return null;
  }

  /* 登记「已读到并解析成功」；entries = -1 表示该表不计数目；version 可为空串 */
  static ok(key: string, entries: number, version: string): void {
    const r = RuleHealth.find(key);
    if (r === null) {
      return;
    }
    r.loaded = true;
    r.entries = entries;
    r.version = version;
    r.missingKeys = [];
    r.failReason = '';
    r.ts = Date.now();
  }

  /* 登记「读到了但内容不全」（表在、必填键缺 → 这是数据问题，不是加载问题，两者必须区分） */
  static okWithMissingKeys(key: string, entries: number, version: string, missingKeys: string[]): void {
    RuleHealth.ok(key, entries, version);
    const r = RuleHealth.find(key);
    if (r === null) {
      return;
    }
    r.missingKeys = missingKeys;
    if (missingKeys.length > 0) {
      r.failReason = '规则表内容不完整（缺 ' + missingKeys.join('、') + '）';
      RuleHealth.logOnce(key, r.failReason);
    }
  }

  /* 登记「未读到 / 解析失败」；reason 面向用户，**不得含数据文件名** */
  static fail(key: string, reason: string): void {
    const r = RuleHealth.find(key);
    if (r === null) {
      return;
    }
    r.loaded = false;
    r.entries = -1;
    r.failReason = reason;
    r.ts = Date.now();
    RuleHealth.logOnce(key, reason);
  }

  private static logOnce(key: string, reason: string): void {
    if (RuleHealth.warned.indexOf(key) >= 0) {
      return;
    }
    RuleHealth.warned.push(key);
    hilog.warn(DOMAIN, TAG, '规则表未就绪：%{public}s（%{public}s）—— 相关栏目将标注「规则表未加载」，盘仍照旧排出',
      RuleHealth.labelOf(key), reason);
  }

  private static labelOf(key: string): string {
    const r = RuleHealth.find(key);
    return r === null ? key : r.label;
  }

  static statusList(): RuleTableStatus[] {
    const out: RuleTableStatus[] = [];
    for (const r of RuleHealth.recs) {
      out.push({
        key: r.key, label: r.label, loaded: r.loaded, entries: r.entries,
        failReason: r.failReason, missingKeys: r.missingKeys, version: r.version, ts: r.ts
      });
    }
    return out;
  }

  /* 缺表清单（含「读到了但不可用」的） */
  static problemList(): RuleTableStatus[] {
    const out: RuleTableStatus[] = [];
    for (const s of RuleHealth.statusList()) {
      if (!s.loaded || s.missingKeys.length > 0) {
        out.push(s);
      }
    }
    return out;
  }

  static total(): number {
    return RuleHealth.recs.length;
  }

  static loadedCount(): number {
    let n = 0;
    for (const r of RuleHealth.recs) {
      if (r.loaded && r.missingKeys.length === 0) {
        n++;
      }
    }
    return n;
  }

  static hasProblem(): boolean {
    return RuleHealth.problemList().length > 0;
  }

  /* 缺表一次性提示：每次启动只提示一次，返回 true 表示这次应当提示 */
  static consumeTip(): boolean {
    if (RuleHealth.tipShown) {
      return false;
    }
    RuleHealth.tipShown = true;
    return true;
  }

  static resetTip(): void {
    RuleHealth.tipShown = false;
  }

  /* 某张表是否可用（栏目据此决定显示「规则表未加载」还是「确实无」） */
  static usable(key: string): boolean {
    const r = RuleHealth.find(key);
    if (r === null) {
      return true;   /* 未登记的表不阻断显示（只在自检里提示） */
    }
    return r.loaded && r.missingKeys.length === 0;
  }

  static failReasonOf(key: string): string {
    const r = RuleHealth.find(key);
    return r === null ? '' : r.failReason;
  }

  /* 徽标文案：规则数据：已加载 14/14 表 ✓ / 规则数据：已加载 11/14 表 ⚠ */
  static summaryText(): string {
    const n = RuleHealth.loadedCount();
    const t = RuleHealth.total();
    return n >= t ? ('规则数据：已加载 ' + n + '/' + t + ' 表 ✓')
      : ('规则数据：已加载 ' + n + '/' + t + ' 表 ⚠');
  }

  /* 逐表自检：条目数 / 必填键 / 版本 / 时间戳（供自检页与导出诊断） */
  static selfCheckText(): string {
    const lines: string[] = [];
    for (const s of RuleHealth.statusList()) {
      const state = !s.loaded ? '未加载' : (s.missingKeys.length > 0 ? '内容不完整' : '正常');
      let line = '· ' + s.label + '：' + state;
      if (s.entries >= 0) {
        line += '，条目 ' + s.entries;
      }
      if (s.version !== '') {
        line += '，版本 ' + s.version;
      }
      if (s.ts > 0) {
        line += '，登记 ' + RuleHealth.stamp(s.ts);
      }
      if (s.failReason !== '') {
        line += '（' + s.failReason + '）';
      }
      lines.push(line);
    }
    return lines.join('\n');
  }

  /* 导出诊断文本：自检结果 + 版本号 + 时间（离线，不联网） */
  static diagnoseText(appVersion: string, extra: string): string {
    const rows: string[] = [];
    rows.push('六壬排盘 · 数据自检诊断');
    rows.push('应用版本：' + appVersion);
    rows.push('生成时间：' + RuleHealth.stamp(Date.now()));
    rows.push('规则数据：' + RuleHealth.summaryText());
    rows.push('');
    rows.push('逐表状态：');
    rows.push(RuleHealth.selfCheckText());
    if (extra !== '') {
      rows.push('');
      rows.push('补充：');
      rows.push(extra);
    }
    rows.push('');
    rows.push('说明：缺表不影响排盘（引擎以空规则兜底并照旧出盘），但相关栏目会标注「规则表未加载」。');
    rows.push('本诊断为本机离线生成，不含任何个人信息与联网数据。');
    return rows.join('\n');
  }

  /* 时间戳 → 本地可读（YYYY-MM-DD HH:mm:ss） */
  private static stamp(ms: number): string {
    const d = new Date(ms);
    const p = (n: number): string => (n < 10 ? '0' + n : '' + n);
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' '
      + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }
}

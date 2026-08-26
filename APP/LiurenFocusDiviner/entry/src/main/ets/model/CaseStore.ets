/**
 * CaseStore —— 课例（排盘记录）本地持久化（Preferences）
 * ----------------------------------------------------------------------------
 * 记录字段：时间戳 / 日期 / 时辰 / 四柱 / 月将 / 课体 / 三传 / 用神 / 占事 / 备注
 * 上限 200 条（超出丢弃最旧）；上下文由页面注入（UIAbilityContext → Preferences）
 * ArkTS 合规：零 any / unknown；显式类型；JSON.parse 结果显式接口断言
 */
import { preferences } from '@kit.ArkData';
import { common } from '@kit.AbilityKit';

export interface CaseRec {
  ts: number;          /* 保存时间戳（毫秒，同时作唯一键） */
  title: string;       /* 课例标题（自己起课=占事/课体；古籍反推=古籍·课体） */
  date: string;        /* 'YYYY-MM-DD' */
  hourZhi: string;     /* 占时地支 */
  siZhu: string;       /* 年柱 月柱 日柱 时柱（空格连接的展示串） */
  yueJiang: string;    /* 月将支 */
  keti: string;        /* 课体名（普通课为宗门法描述） */
  chuans: string;      /* 三传支（如 申亥寅） */
  yongShen: string;    /* 用神支（空=未选） */
  affairName: string;  /* 占事名（空=未选） */
  note: string;        /* 备注（空=无） */
}

export class CaseStore {
  private static readonly STORE_NAME: string = 'case_store';
  private static readonly KEY_LIST: string = 'case_list';
  private static readonly MAX_CASES: number = 200;
  private static prefs: preferences.Preferences | null = null;

  /* 初始化（页面 aboutToAppear 调用；失败降级为内存态，读写返回空/静默） */
  static async init(ctx: common.UIAbilityContext): Promise<void> {
    try {
      CaseStore.prefs = await preferences.getPreferences(ctx, CaseStore.STORE_NAME);
    } catch (e) {
      CaseStore.prefs = null;
    }
  }

  /* 读取全部课例（新→旧；异常返回空数组） */
  static async loadCases(): Promise<CaseRec[]> {
    if (!CaseStore.prefs) {
      return [];
    }
    try {
      const v = await CaseStore.prefs.get(CaseStore.KEY_LIST, '');
      if (v === '') {
        return [];
      }
      const arr = JSON.parse(v as string) as CaseRec[];
      if (!Array.isArray(arr)) {
        return [];
      }
      const out: CaseRec[] = [];
      for (let i = 0; i < arr.length; i++) {
        const it = arr[i] as CaseRec;
        if (it && typeof it.ts === 'number' && typeof it.date === 'string') {
          if (typeof it.title !== 'string' || it.title === '') {
            it.title = it.affairName !== '' ? it.affairName : (it.date + ' ' + it.hourZhi + '时');
          }
          out.push(it);
        }
      }
      out.sort((a: CaseRec, b: CaseRec): number => b.ts - a.ts);
      return out;
    } catch (e) {
      return [];
    }
  }

  /* 追加一条课例：
     按 日期+时辰+三传+用神+占事 去重——完全相同则更新置顶(ts 刷新)；
     用神/占事不同视为不同读象视角，作为新案例保留；超上限丢最旧 */
  static async addCase(rec: CaseRec): Promise<CaseRec[]> {
    if (!CaseStore.prefs) {
      return [];
    }
    const cur = await CaseStore.loadCases();
    const key = rec.date + '|' + rec.hourZhi + '|' + rec.chuans + '|' + rec.yongShen + '|' + rec.affairName;
    let found = -1;
    for (let i = 0; i < cur.length; i++) {
      const k = cur[i].date + '|' + cur[i].hourZhi + '|' + cur[i].chuans + '|' + cur[i].yongShen + '|' + cur[i].affairName;
      if (k === key) {
        found = i;
        break;
      }
    }
    if (found >= 0) {
      /* 更新原记录：保留 ts 作为唯一键，刷新内容并置顶 */
      rec.ts = cur[found].ts;
      const updated: CaseRec[] = [rec];
      for (let i = 0; i < cur.length; i++) {
        if (i !== found) {
          updated.push(cur[i]);
        }
      }
      await CaseStore.persist(updated);
      return updated;
    }
    cur.unshift(rec);
    while (cur.length > CaseStore.MAX_CASES) {
      cur.pop();
    }
    await CaseStore.persist(cur);
    return cur;
  }

  /* 按 ts 删除一条 */
  static async removeCase(ts: number): Promise<CaseRec[]> {
    if (!CaseStore.prefs) {
      return [];
    }
    const cur = await CaseStore.loadCases();
    const out: CaseRec[] = [];
    for (let i = 0; i < cur.length; i++) {
      if (cur[i].ts !== ts) {
        out.push(cur[i]);
      }
    }
    await CaseStore.persist(out);
    return out;
  }

  private static async persist(list: CaseRec[]): Promise<void> {
    if (!CaseStore.prefs) {
      return;
    }
    try {
      await CaseStore.prefs.put(CaseStore.KEY_LIST, JSON.stringify(list));
      await CaseStore.prefs.flush();
    } catch (e) {
      /* 持久化失败：静默（下次保存重试） */
    }
  }
}

/**
 * ReasonText —— 空态原因文案登记表（Agent.md §14.2）
 * ----------------------------------------------------------------------------
 * 三种「空」必须区分（§14.1）：
 *   ① none    —— **本来就该空**（本课未命中毕法 / 该支本位确无神煞）→ 说明「为什么空」+ 规则出处入口
 *   ② missing —— **规则表未加载 / 内容不全**（§14.3 的 RuleHealth 判定）→ 必须显式报错，不得静默留白
 *   ③ unset   —— **用户没填 / 没开**（未填本命年支、未开中黄天地盘）→ 指路到入口
 *
 * 纪律：
 *  - 文案**只陈述规则、不给现实结论**：不得出现医疗/法律/投资/仕途/生死的确定断语（§11.6 合规口径）；
 *  - 缺表提示**不得出现数据文件名**（不写「某某.json 未加载」），只写规则表名（§14.2 补）；
 *  - 栏位新增时必须在本表登记，`_tests/_test_ui_empty_state.js` 会核对「代码用到的栏位都在表里」。
 * ArkTS 合规：零 any / unknown；不用变量下标取字典，用数组 + 线性查找。
 */

/* 空态种类 */
export class EmptyKind {
  static readonly NONE: string = 'none';        /* 确实无 */
  static readonly MISSING: string = 'missing';  /* 规则表未加载 / 内容不全 */
  static readonly UNSET: string = 'unset';      /* 用户未填 / 未开 */
}

/* 栏位 id（与 _tests/_test_ui_empty_state.js 的登记表一致） */
export class SlotId {
  static readonly BIFA: string = 'bifa';              /* 毕法格局 */
  static readonly SHENSHA: string = 'shensha';        /* 神煞 */
  static readonly ZHONGHUANG: string = 'zhonghuang';  /* 中黄 */
  static readonly NIANMING: string = 'nianming';      /* 年命 */
  static readonly XINGNIAN: string = 'xingnian';      /* 行年 */
  static readonly YONGSHEN: string = 'yongshen';      /* 抓用神读象 */
}

/* 一条空态文案 */
export interface SlotReason {
  slot: string;    /* 栏位 id */
  kind: string;    /* EmptyKind */
  text: string;    /* 面向用户的说明（不得含文件名、不得给现实结论） */
  entry: string;   /* 附加入口按钮文案；空串 = 无入口 */
  warn: boolean;   /* 是否用警示色（② 缺表类为 true） */
}

/* 登记表（改文案只改这里；测试逐条核对） */
const ROWS: SlotReason[] = [
  {
    slot: SlotId.BIFA, kind: EmptyKind.NONE, warn: false, entry: '查看判定规则',
    text: '本课未命中可判定格局 · 毕法共 100 法，其中 18 法可自动判定，其余需结合占事取象'
  },
  {
    slot: SlotId.BIFA, kind: EmptyKind.MISSING, warn: true, entry: '查看数据自检',
    text: '毕法规则表未加载，本栏不可用（盘仍照旧排出）'
  },
  {
    slot: SlotId.SHENSHA, kind: EmptyKind.NONE, warn: false, entry: '神煞起法速查',
    text: '本课该支本位无神煞'
  },
  {
    slot: SlotId.SHENSHA, kind: EmptyKind.MISSING, warn: true, entry: '查看数据自检',
    text: '神煞规则表未加载，本栏不可用（盘仍照旧排出）'
  },
  {
    slot: SlotId.ZHONGHUANG, kind: EmptyKind.UNSET, warn: false, entry: '',
    text: '未开中黄天地盘 · 在天地盘标题处切到「中黄」即可按中黄五变经演局'
  },
  {
    slot: SlotId.ZHONGHUANG, kind: EmptyKind.MISSING, warn: true, entry: '查看数据自检',
    text: '中黄规则表未加载，本栏不可用（盘仍照旧排出）'
  },
  {
    slot: SlotId.NIANMING, kind: EmptyKind.UNSET, warn: false, entry: '去填年支',
    text: '未填本命年支，年命栏不参与判断 · 填好年支后可看本命神煞与适配'
  },
  {
    slot: SlotId.XINGNIAN, kind: EmptyKind.UNSET, warn: false, entry: '去填出生年与性别',
    text: '行年未算出 · 填出生年与性别后自动推算'
  },
  {
    slot: SlotId.XINGNIAN, kind: EmptyKind.MISSING, warn: true, entry: '查看数据自检',
    text: '行年打分表未加载，行年栏不可用（盘仍照旧排出）'
  },
  {
    slot: SlotId.YONGSHEN, kind: EmptyKind.NONE, warn: false, entry: '去选占事',
    text: '尚未抓用神 · 选一个所占之事，或直接在盘上点类神'
  }
];

/* 兜底文案（未登记的栏位/种类也要说话，绝不留白） */
const FALLBACK: SlotReason = {
  slot: '', kind: '', warn: false, entry: '查看数据自检',
  text: '本栏暂无内容'
};

export class ReasonText {
  /* 全部登记行（测试与自检页用） */
  static rows(): SlotReason[] {
    return ROWS;
  }

  /* 栏位 id 列表 */
  static slots(): string[] {
    const out: string[] = [];
    for (const r of ROWS) {
      if (out.indexOf(r.slot) < 0) {
        out.push(r.slot);
      }
    }
    return out;
  }

  /* 取某栏位某种类的文案；未登记则回退到兜底（保证「空必有话」） */
  static of(slot: string, kind: string): SlotReason {
    for (const r of ROWS) {
      if (r.slot === slot && r.kind === kind) {
        return r;
      }
    }
    const fb: SlotReason = {
      slot: slot, kind: kind, warn: kind === EmptyKind.MISSING, entry: FALLBACK.entry, text: FALLBACK.text
    };
    return fb;
  }

  /* 取文案（只有文字，便于内联拼接） */
  static text(slot: string, kind: string): string {
    return ReasonText.of(slot, kind).text;
  }

  /* 规则表是否就绪 → 决定该显示「确实无」还是「未加载」 */
  static kindFor(slot: string, ok: boolean, hasValue: boolean): string {
    if (!ok) {
      return EmptyKind.MISSING;
    }
    return hasValue ? '' : EmptyKind.NONE;
  }
}

/* 传本课例锚点机器采集 + 引擎比对（大六壬排盘引擎校验用）
 * ============================================================================
 * 目的：从仓库内古籍原文里，把**书自己写明**的课例（日干支 / 占时 / 月将 / 四课 / 三传 /
 *       天将）抽成「锚点」，再喂给 core/liuren-core.js 复算，统计命中率并逐条列出不符。
 *
 * 铁律（本脚本据此设计，改脚本时不要破坏）：
 *   1) book 字段**只能**来自原文文本。绝不把引擎输出写进 book。
 *   2) 月将**只接受原文直接写出的地支**（“X将Y时”“X将加Y时”“以登明加时”等）。
 *      不做「由四课反推月将」——那种做法会把算法中间量混进输入，破坏校验独立性。
 *      原文只给月份（“十一月将”）或只给干上神的课例一律丢弃并计数。
 *   3) 原文模糊 / OCR 错乱 / 课式读不出来 → 丢弃并计数，不猜。
 *   4) 每条锚点带 src（文件名）+ excerpt（原文片段）以便人工复核。
 *
 * 数据源（本版实采）：
 *   A. 六壬断案-宋-邵彦和（宋·邵彦和案集）：课式含 日干支/占时/月将/三传（干支·乘将），
 *      是主要来源。课式块是「方阵 + 三传」混排（右 3 列=三传，另有天地盘与四课格子）。
 *   B. 六壬一字诀玉连环 等书：课例头写明「干支日 + X将 + Y时」，同段串文明写三传（含乘将）。
 *   C. 中黄五变经 经文/*.md：markdown 表格，四课 + 三传都干净。月将有的只写「十一月将」，
 *      按课题允许的办法由**书上自己的四课**反推：要求四课四组「上/下」位移一致，
 *      且反推月将须与「月份→月将」的名义月将相符，否则丢弃不猜。
 *   × 六壬大全：三传散落在讲解段落（「三传戌午寅火局为鬼」讲的是别人家课），
 *      与本课例头不能可靠对应，会张冠李戴，故整体不采。
 *   × 六壬直指御定：720 课经，多数不给占时与月将，且三传多半缺载，不可作锚点。
 *   × 断案课式块里的天地盘方阵与四课格子：与三传格子交错、列宽不齐，机器读序无法稳定还原，
 *      按「不猜」原则不采（四课与天地盘的校验改由中黄经文的表格负责）。
 *
 * ⚠ 实现注意（踩过的坑）：本仓库运行时的 V8 有一个回溯缺陷 ——
 *   `^([^ ]{1,3}) +([^ ]) +` 这类「否定字符类 + {n,m} + 显式空白类 + 又接分组」的模式
 *   会直接返回 null（同一字符串换成 `.{1,3}` 或 `[^ ]+` 就能匹配，长度 32 的普通串即可复现）。
 *   因此本脚本**不用正则切列**，四课/三传一律用 token 切分（splitTokens）。
 *
 * 用法：
 *   node _tools/harvest_anchors.js                 # 统计报告
 *   node _tools/harvest_anchors.js --verbose       # 报告 + 逐条不命中明细 + 丢弃原因
 *   node _tools/harvest_anchors.js --write         # 写出 _tests/_data/anchors_corpus.json
 *                                                  #   + anchors_rejected.json + anchors_kouJing.json
 *   node _tools/harvest_anchors.js --src 断案      # 只跑某源（文件名含该关键字）
 *   node _tools/harvest_anchors.js --audit         # 逐条打印采集校验判定（槽位/证据窗口/路由）
 *
 * ============================================================================
 * 【2026-09-12 清洗与采集校验】依据两轮逐例裁决：
 *   _tests/_data/sanchuan_dizhi_adjudication.json（B 类：26 条三传地支不符）
 *   _tests/_data/jiang_adjudication.json          （C 类：12 条三传乘将不符）
 * 结论：220 条锚点中 32 条不可留在主集 ——
 *   28 条 → anchors_rejected.json（11 抄录错 + 3 他例窜入 + 3 原文段内无三传［含本轮新发现 1］
 *            + 2 书侧传刻/标题互斥（116/199）+ 8 乘将类书版存疑［含本轮更正 115］
 *            + 1 标题与课式块互斥（132，本轮新发现））
 *    4 条 → anchors_kouJing.json（昼夜取贵口径差异：038/065/113/173）
 * 为让**重跑不再把它们收回来**，本脚本新增下列**显式校验**（规则 + 逐例登记）：
 *
 * V1 三传天盘链（正课自洽闸门）
 *    非伏吟/返吟/昴星/别责/八专诸课，要求 中传＝tp[初传]、末传＝tp[中传]。
 *    依据《六壬指南》第 23 行：「俱以所得发用为初传，以初传地盘上所乘者为中传，
 *    以中传地盘上所乘者为末传，故曰相因也」。五类特殊课各有专法（伏吟自任/杜传、
 *    返吟井栏射、昴星虎视/冬蛇、别责、八专），故免检（课例头自标课体名时亦免检）。
 *    回测：清洗前 220 条中链不合格 43 条；扣除五课免检的 24 条，余 19 条**全部**落在
 *    裁决认定的坏条目上（V1 直接命中 116 传刻倒置、199 标题与块互斥、misc__3 讲解段窜入；
 *    其余 16 条由 V2/V4 或「三传行不齐」同批拦下），无一条误伤正常锚点。
 * V2 三传行版式槽
 *    三传行尾部结构固定为「六亲｜干支位｜天将位｜位置字」，位置字左 2 格即干支位。
 *    若旧读法取得的支不在该槽位（实读偏移 ≠ 0），则判版式不符并丢弃（禁止在槽外取支）。
 *    依据：「抄录错」11 条中的 9 条由此产生 —— 如 duanan_007 中传印作「空申」（空亡支无
 *    遁干、遁干位空缺），旧读法越过槽位取到四课格里的「卯」；duanan_082 末传取到六亲字「子」。
 *    六亲位字面不予判定（断案或作「父兄鬼财子孙官」或径用天干，如 duanan_096 作「癸」）。
 * V3 串文三传窗口＝本课例段
 *    断案课式的「三传XYZ」补充读法只在**本课例块内**（课例头→下一课例头）查找，
 *    不再向前取 4000 字符。依据：duanan_159/160 的三传「丑寅卯」实取自 3400–4000
 *    字符外另一壬日课断语（断案行 1774）。
 * V4 源C 三传证据窗口
 *    其他古籍的「初传X…将Y／三传XYZ」证据必须落在课例头后 WINDOW_C 字符内。
 *    依据：misc__1（指南注解己巳日丑将辰时）的三传「亥卯未」取自 14874 字符外的讲解段
 *    （指南注解行 422「三传亥卯未为之」）；misc__2/misc__4（同书）取自 6509/11247 字符外；
 *    misc__11（秘本）/misc__2（银河櫂）取自 11732/1293 字符外他例。
 * V5 已裁决条目登记表（逐例登记，非模式推断）
 *    键 = id|src —— misc__N 按各书内部序号命名，跨书重复（misc__2/3/4/11 均重复），
 *    必须带 src 才唯一；B 类证据另按「条目索引 + id」双键定位（同名条目会错配）。
 *    同时断言课例签名（月将/日干支/占时）与登记一致，不一致立即抛错中止
 *    （防止源文本变动导致 id 漂移后静默误路由）。每条写明 route
 *    （rejected / kouJing / keep）、原因、依据裁决文件与出处行号。
 *
 * ⚠ 为何只校验不自动纠正：V2/V3/V4 都能指出「读法该往哪改」（改对后书＝引擎），
 *   但纠正会产出 16 条未经逐例裁决的新锚点，且与用户「错的全部拿掉」的指令相反。
 *   故本脚本一律**丢弃并登记**：移出的条目在 anchors_rejected.json（含原文三传对照）
 *   与 anchors_kouJing.json 中可复核，待裁决后另批回归。
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ARGV = process.argv.slice(2);
const has = (f) => ARGV.includes(f);
const argOf = (f) => { const i = ARGV.indexOf(f); return i >= 0 ? ARGV[i + 1] : null; };
const srcFilter = argOf('--src');
const VERBOSE = has('--verbose') || has('-v');
const AUDIT = has('--audit');
const WRITE = has('--write');

/* ---------------------------------------------------------------- 引擎装载 */
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'core', 'liuren-core.js'), 'utf-8'), { filename: 'liuren-core.js' });
const R = path.join(ROOT, 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'resources', 'rawfile', 'rule');
const load = (f) => JSON.parse(fs.readFileSync(path.join(R, f), 'utf-8'));
LiurenCore.init({
  duxiang: {
    '旺衰休囚死': { '旺衰': load('旺衰休囚死.json')['旺衰'] },
    '十二宫气机点': load('十二宫气机点.json'),
    '空亡规则': load('空亡规则.json'),
    '助日规则': load('助日规则.json'),
    '基础关系': load('基础关系.json')
  },
  shensha: { '神煞': load('神煞起法.json')['神煞'] },
  bifa: { '一百法': load('毕法赋一百法.json')['一百法'] }
});

/* ------------------------------------------------------------------ 常量表 */
const ZHI = '子丑寅卯辰巳午未申酉戌亥';
const GAN = '甲乙丙丁戊己庚辛壬癸';
/* 断案等书的简称将（单字）→ 全名。陈/勾 皆勾陈，蛇 螣蛇，龙 青龙，空 天空，虎 白虎。 */
const JIANG_ABBR = {
  贵: '贵人', 蛇: '螣蛇', 朱: '朱雀', 六: '六合', 勾: '勾陈', 陈: '勾陈', 龙: '青龙',
  空: '天空', 白: '白虎', 虎: '白虎', 常: '太常', 玄: '玄武', 阴: '太阴', 后: '天后'
};
/* 月将雅名 → 地支 */
const JIANG_NAME = {
  神后: '子', 大吉: '丑', 功曹: '寅', 太冲: '卯', 天罡: '辰', 太乙: '巳',
  胜光: '午', 小吉: '未', 传送: '申', 从魁: '酉', 河魁: '戌', 登明: '亥'
};
const JIANG_NAME_RE = Object.keys(JIANG_NAME).join('|');
/* 月份 → 名义月将（中黄等经文只写「十一月将」时用来当闸门，不单独作为月将来源） */
const MONTH_TO_MJ = { 正月: '亥', 二月: '戌', 三月: '酉', 四月: '申', 五月: '未', 六月: '午', 七月: '巳', 八月: '辰', 九月: '卯', 十月: '寅', 十一月: '丑', 十二月: '子' };
const isZhi = (c) => ZHI.indexOf(c) >= 0;
const isGan = (c) => GAN.indexOf(c) >= 0;
const gzValid = (g, z) => isGan(g) && isZhi(z) && (((GAN.indexOf(g) - ZHI.indexOf(z)) % 2) + 2) % 2 === 0;
const jiangAtZhi = (c, z) => c.jiangMap[LiurenCore.gongOf(c.tp, z)] || '';
/** 五鼠遁：由日干求某地支的遁干（日干 → 子时起干，阳干顺、阴干逆；断案课式的「父 辛巳 …」即此遁干）。
 *  用于断案课式的**内部交叉校验**：书上的遁干与书上的支互相独立，一致即说明两者都没读错。 */
function tgGan(dg, z) {
  const startZhi = { 甲: '子', 己: '子', 乙: '丑', 庚: '丑', 丙: '寅', 辛: '寅', 丁: '卯', 壬: '卯', 戊: '辰', 癸: '辰' }[dg];
  const down = '乙丁己辛癸'.indexOf(dg) >= 0;
  const d = ((ZHI.indexOf(z) - ZHI.indexOf(startZhi)) + 12) % 12;
  const i = ((GAN.indexOf(dg) % 5) * 2 + (down ? -d : d)) % 10;
  return GAN[(i + 10) % 10];
}
const WSC = '[\t \u3000]';      /* 原文使用的空白：制表 / 半角空格 / 全角空格 */

/* ======================= 采集校验规则（见文件头 V1–V5 说明） ======================= */

/* V1：五类特殊课各有专法，三传不成天盘链，免检（课体名亦可由课例头自证） */
const SPECIAL_METHOD = { 伏吟: 1, 返吟: 1, 昴星: 1, 别责: 1, 八专: 1 };
const SPECIAL_KEYWORD = /(伏吟|反吟|返吟|昴星|昂星|别责|八专|井栏射|虎视|冬蛇|自任|杜传|独足|掩目)/;
const isSpecialKet = (c, line0) => !!SPECIAL_METHOD[c.sanchuan.method] || SPECIAL_KEYWORD.test(line0);
/* 天盘链：tp[宫]=月将加占时后该宫上的天盘支；中传＝tp[初传]，末传＝tp[中传] */
function chainOf(mj, hour) {
  const off = ((ZHI.indexOf(mj) - ZHI.indexOf(hour)) + 12) % 12;
  return (g) => ZHI[(ZHI.indexOf(g) + off) % 12];
}
/* V4：源C（其他古籍）三传证据必须落在课例头后此窗口内（字符数） */
const WINDOW_C = 400;
/* 六亲字（三传行首字）——用于 V2 槽位判定：槽外取到的「像支」的 token 常是六亲字或空亡字。
 * 断案三传行的六亲作「父/兄/鬼/财/子/孙/官」（鬼亦有作「官」处），故一并纳入。 */
const LIUQIN_CH = '父兄鬼财子孫孙官杀煞';

/* V5：已裁决条目登记表。键 = id|src（misc__N 跨书重复，必须带 src）。
 *   route: 'rejected' → 移入 anchors_rejected.json（不进主集）
 *          'kouJing'  → 移入 anchors_kouJing.json（昼夜取贵口径差异）
 *          'keep'     → 留在主集，附 adjudication/adjudicatedFrom
 *   sig: 课例签名「月将/日干支/占时」——重跑时断言一致，防 id 漂移后误路由。
 *   reason: 依据裁决原文逐条写明的理由（含原文三传对照、窜入出处文件+行号）。 */
const ADJ_B = '_tests/_data/sanchuan_dizhi_adjudication.json';
const ADJ_C = '_tests/_data/jiang_adjudication.json';
const DA = '大六壬文档/古籍原文-易藏-术数/六壬断案-宋-邵彦和/六壬断案-宋-邵彦和.utf8.txt';
const ZY = '大六壬文档/古籍原文-易藏-术数/六壬指南注解-明-陈公献/六壬指南注解-明-陈公献.txt';
const MB = '大六壬文档/古籍原文-易藏-术数/六壬秘本-清-金正音/六壬秘本-清-金正音.txt';
const YH = '大六壬文档/古籍原文-易藏-术数/六壬银河櫂--佚名/六壬银河櫂--佚名.txt';
const KNOWN = [
  /* ---- B 类：锚点抄录错（11）——书＝引擎，仅锚点 book.chuans 与原文课式块不符 ---- */
  { id: 'duanan_007', adjIdx: 5, src: DA, sig: '辰/辛巳/亥', route: 'rejected', kind: '抄录错', adj: ADJ_B, reason: '锚点三传「卯卯丑」，原文课式块（行 58–64）作「卯申丑」：中传三传行印作「空申」（申为空亡支故无遁干），采集在槽外取到四课格里的「卯」。书内天盘、四课、三传、天将四项互相咬合，书＝引擎（引擎 卯申丑）。' },
  { id: 'duanan_010', adjIdx: 7, src: DA, sig: '丑/壬寅/申', route: 'rejected', kind: '抄录错', adj: ADJ_B, reason: '锚点三传「子辰戌」，原文课式块（行 88–94）作「子巳戌」（中传「空巳」形近误记作辰）；书＝引擎（引擎 子巳戌）。' },
  { id: 'duanan_046', adjIdx: 40, src: DA, sig: '亥/丙寅/申', route: 'rejected', kind: '抄录错', adj: ADJ_B, reason: '锚点三传「申申寅」，原文课式块（行 477–483）作「申亥寅」（中传「空亥」误记作申）；书＝引擎三传地支（引擎 申亥寅）。' },
  { id: 'duanan_068', adjIdx: 59, src: DA, sig: '卯/乙卯/辰', route: 'rejected', kind: '抄录错', adj: ADJ_B, reason: '锚点三传「丑卯亥」，原文课式块（行 717–723）作「丑子亥」（中传「空子」误记作卯）；书＝引擎（引擎 丑子亥）。' },
  { id: 'duanan_082', adjIdx: 72, src: DA, sig: '申/戊寅/辰', route: 'rejected', kind: '抄录错', adj: ADJ_B, reason: '锚点三传「丑午子」，原文课式块（行 862–868）作「丑午酉」（末传「空酉」误记作子）；书＝引擎（引擎 丑午酉）。' },
  { id: 'duanan_095', adjIdx: 83, src: DA, sig: '巳/壬辰/子', route: 'rejected', kind: '抄录错', adj: ADJ_B, reason: '锚点三传「寅辰子」，原文课式块（行 996–1002）作「寅未子」（中传未→辰，形近）；书自身释文级三传亦自证，书＝引擎（引擎 寅未子）。' },
  { id: 'duanan_107', adjIdx: 92, src: DA, sig: '子/甲午/卯', route: 'rejected', kind: '抄录错', adj: ADJ_B, reason: '锚点三传「申子寅」，原文课式块（行 1112–1118）作「申巳寅」（中传巳→子）；书＝引擎（引擎 申巳寅）。' },
  { id: 'duanan_178', adjIdx: 155, src: DA, sig: '酉/戊子/寅', route: 'rejected', kind: '抄录错', adj: ADJ_B, reason: '锚点三传「子子寅」，原文课式块（行 1883–1889）作「子未寅」（中传「空未」误记作子）；书＝引擎三传地支（引擎 子未寅）。另：本课乘将部分另属昼夜取贵口径差异（书用戊日昼贵丑、规范用夜贵未），见 anchors_kouJing.json 说明。' },
  { id: 'duanan_211', adjIdx: 187, src: DA, sig: '申/壬子/亥', route: 'rejected', kind: '抄录错', adj: ADJ_B, reason: '锚点三传「午子子」，原文课式块（行 2306–2312）作「午卯子」（中传「空卯」误记作子）；书＝引擎（引擎 午卯子）。' },
  { id: 'misc__2', adjIdx: 212, src: ZY, sig: '酉/壬申/亥', route: 'rejected', kind: '抄录错', adj: ADJ_B, reason: '锚点三传「巳申寅」，原文课式块（行 1116–1122）三传行为「午 玄／辰 后／寅 蛇」即「午辰寅」，锚点整组不符；书＝引擎（引擎 午辰寅）。' },
  { id: 'misc__4', adjIdx: 213, src: ZY, sig: '未/甲戌/亥', route: 'rejected', kind: '抄录错', adj: ADJ_B, reason: '锚点三传「戌酉申」，原文课式块（行 1780–1786）作「戌午寅」；书＝引擎三传地支（引擎 戌午寅）。另：本课乘将部分另属昼夜取贵口径差异（书用甲日昼贵子、规范用夜贵未）。' },
  /* ---- B 类：他例窜入（3）——写明窜入出处文件 + 行号 ---- */
  { id: 'duanan_159', adjIdx: 138, src: DA, sig: '申/癸巳/卯', route: 'rejected', kind: '他例窜入', adj: ADJ_B, reason: '锚点三传「丑寅卯」，原文课式块（行 1693–1699）作「午亥辰」，书＝引擎。锚点三传系他例窜入：取自同书第 1774 行另一壬日课断语「…三传丑寅卯…」，距本课例头 3981 字符（本课例段仅 553 字符），系旧读法把「三传XYZ」补充读法的窗口开成课例头后 4000 字符所致（本版已按 V3 收紧为课例段内）。' },
  { id: 'duanan_160', adjIdx: 139, src: DA, sig: '寅/丙申/寅', route: 'rejected', kind: '他例窜入', adj: ADJ_B, reason: '锚点三传「丑寅卯」，原文课式块（行 1703–1709）作「巳申寅」，书＝引擎。锚点三传系他例窜入：取自同书第 1774 行另一壬日课断语「…三传丑寅卯…」，距本课例头 3428 字符（本课例段仅 660 字符），同 duanan_159，已按 V3 收紧。' },
  { id: 'misc__3', adjIdx: 215, src: MB, sig: '子/丙寅/辰', route: 'rejected', kind: '他例窜入', adj: ADJ_B, reason: '锚点三传「辰巳午」，原文（行 1639–1643）只给发用「戌加寅为用」（中末相因即 戌/午/寅），书＝引擎（引擎 戌午寅）。锚点三传系他例窜入：取自同书第 1655 行「癸卯日…三传辰巳午」蒿矢例。' },
  /* ---- B 类：原文段内无三传（3，含本轮新发现 1）---- */
  { id: 'misc__11', adjIdx: 216, src: MB, sig: '午/癸亥/辰', route: 'rejected', kind: '原文段内无三传', adj: ADJ_B, reason: '原文段内无三传（行 2559–2565 只给天盘/天将的一句判语「太常乘丑加亥上」，可得天盘与将盘皆与引擎相符，但无三传可比）。锚点三传「辰申子」系他例窜入：取自同书第 3259 行「如庚辰日干上子，三传辰申子之例」庚辰日全脱例。' },
  { id: 'misc__2', adjIdx: 218, src: YH, sig: '申/乙酉/子', route: 'rejected', kind: '原文段内无三传', adj: ADJ_B, reason: '原文段内无三传（行 353–354 为论人形貌的取象法，只举天盘「天上酉加丑」，与引擎天盘相符，但无三传可比）。锚点三传「酉未丑」系他例窜入：取自同书第 394 行「如丁酉日伏吟」例。' },
  { id: 'misc__1', src: ZY, sig: '丑/己巳/辰', route: 'rejected', kind: '原文段内无三传', adj: ADJ_B, newFinding: true, reason: '【本轮新发现】原文段内无三传（行 25 只给发用一句「己巳日来…余以丑将加辰时，寅木自支上遥克发用乘朱雀」，无三传可比）。锚点三传「亥卯未」系他例窜入：取自同书第 422 行讲解段「三传亥卯未为之」，距本课例头 14874 字符（旧读法块尾由「下一课例头」定界，而本文件仅 6 个课例头，故块长达 48874 字符）。V1 天盘链与 V4 证据窗口均可检出本条。' },
  /* ---- B 类：书侧错（2，自相矛盾/传刻倒置/标题与块互斥）---- */
  { id: 'duanan_116', adjIdx: 101, src: DA, sig: '子/庚辰/寅', route: 'rejected', kind: '书版存疑', adj: ADJ_B, reason: '书版存疑（传刻首尾倒置）：书内三传行「寅辰午」（行 1219–1225）与其自身天盘链、自身释文（1226–1227）互相矛盾，整体为引擎「午辰寅」之倒序，乘将列亦整体错位一格。引擎与书自身自洽的那一面（天盘链、释文）相符。' },
  { id: 'duanan_199', adjIdx: 175, src: DA, sig: '戌/辛卯/午', route: 'rejected', kind: '书版存疑', adj: ADJ_B, reason: '书版存疑（标题与课式块互斥）：课例头「戌将午时」（行 2137）与课式块（2137–2143，天盘/四课/三传/天将/课体/释文）互斥 —— 块整体自洽于位移 d=8（即「戌将寅时」或等价的一组月将加时）。按块实指之盘复算，引擎得「比用 未/卯/亥」，与书印刷三传逐位全同，即引擎与书自洽的那一面相符。' },
  /* ---- C 类：三传乘将类·书版存疑（7，书内标注互斥/证据不足）---- */
  { id: 'duanan_021', src: DA, sig: '午/辛卯/辰', route: 'rejected', kind: '书版存疑', adj: ADJ_C, reason: '书版存疑（行 211）：八标注与四课天将与引擎逐宫全同，唯书内三传行末传标「陈」与其自身天将盘（酉宫＝龙）矛盾；锚点乘将字段「天后/螣蛇/勾陈」系随书三传行的抄录异文。引擎与书自身天将盘相符。' },
  { id: 'duanan_081', src: DA, sig: '子/戊寅/午', route: 'rejected', kind: '书版存疑', adj: ADJ_C, reason: '书版存疑（行 852）：课式标注三套互斥 —— 八标注缺贵人宫无法定盘，三传「申乘蛇」与八标注「申虎」恰好互换，四课天将另成一套，不具备判定书口径的证据力（本课为反吟课，标注最易残损）。' },
  { id: 'duanan_091', src: DA, sig: '卯/丁未/寅', route: 'rejected', kind: '书版存疑', adj: ADJ_C, reason: '书版存疑（行 955）：八标注与三传天将均与引擎全同，唯书内四课天将标注「蛇 贵 蛇 贵」与其自身天将盘（申宫＝贵、酉宫＝后）矛盾；锚点乘将字段本身与引擎无差异，本条属书内自相矛盾。' },
  { id: 'duanan_130', src: DA, sig: '辰/庚寅/丑', route: 'rejected', kind: '书版存疑', adj: ADJ_C, reason: '书版存疑（行 1372）：八标注与四课天将与引擎逐宫全同，唯书内三传行中传标「丁亥 六」与其自身天将盘（亥宫＝虎）矛盾；同书另一处同课（行 1714）同位置作「陈」，亦不等于盘面「虎」→ 传刻异文。' },
  { id: 'duanan_138', src: DA, sig: '辰/丙戌/寅', route: 'rejected', kind: '书版存疑', adj: ADJ_C, reason: '书版存疑（行 1446）：八标注按惯用盘仅 2/8 吻合，八标注／四课／三传三套标注互斥，无法唯一确定书上昼夜口径。' },
  { id: 'duanan_148', src: DA, sig: '卯/丙辰/子', route: 'rejected', kind: '书版存疑', adj: ADJ_C, reason: '书版存疑（行 1582）：课本原句末尾即传本编者自注「用旦贵何也？」（自质疑其用昼贵），且八标注按「申宫贵人逆布」仅 2/8 吻合，与四课、三传互斥。' },
  { id: 'duanan_193', src: DA, sig: '子/庚午/酉', route: 'rejected', kind: '书版存疑', adj: ADJ_C, reason: '书版存疑·证据不足（行 2054）：书内三套标注互斥（八标注按「戌宫贵人顺布」仅 2/8 吻合），取贵来源不明，无法唯一判定书上口径；引擎按规范卯酉分界＋贵人落宫定顺逆逐条相符。待更多传本。' },
  /* ---- C 类：本轮新发现（2，含对 C 类既有裁决的更正）---- */
  { id: 'duanan_115', src: DA, sig: '未/壬戌/巳', route: 'rejected', kind: '书版存疑', adj: ADJ_C, reason: '【本轮新发现，更正 C 类裁决】C 类把本课列为「书、锚点、引擎三者一致」的对照基准例，但重跑引擎复核后不成立：八标注（行 1207–1213）逐宫与引擎全同，初传子乘虎、中传寅乘玄亦相符，唯末传书三传行作「鬼 丙辰 蛇」，而按书自身天将盘，天盘辰落寅宫＝天后（引擎实得「辰乘天后」）。C 类裁决所记「引擎三传乘将＝辰乘蛇」系把「辰宫＝螣蛇」误读为「辰乘螣蛇」。故本条属「书内三传行标记与自身天将盘矛盾」，与 duanan_021/130 同类。' },
  { id: 'duanan_132', src: DA, sig: '酉/己未/亥', route: 'rejected', kind: '书版存疑', adj: ADJ_B, newFinding: true, reason: '【本轮新发现，同 duanan_199 型】课例头「己未日酉将亥时」（行 1392）与课式块互斥：块之天盘（行 1394–1397 网格逐宫）、四课（酉/己、亥/酉、酉/未、亥/酉）、三传（八专独足 酉酉酉）、三传乘将（酉乘六合）、释文（「六合为舡」）五项一致地指向位移 +2（＝「酉将未时」或等价的一组月将加时），而标题所指位移为 −2；引擎按标题复算得「卯巳巳」，本条 3 传地支与乘将均不符，属传刻月将/占时之误。' },
  /* ---- 昼夜取贵口径差异（4）→ anchors_kouJing.json ---- */
  { id: 'duanan_038', src: DA, sig: '子/己巳/酉', route: 'kouJing', kind: '昼夜取贵口径差异', adj: ADJ_C, kj: { book: '书用己日昼贵子（贵人落酉宫、逆布）', norm: '规范：占时酉属夜 → 己日夜贵＝申（落巳宫、逆布）', selfConsistent: '书内天将盘＋四课自洽于「昼贵子落酉宫逆布」（课1 戌乘朱、课2 丑乘后、课3 申乘陈、课4 亥乘蛇逐课相符）；但书内三传行天将另成一套，两套互斥' }, reason: '书用己日昼贵子（贵人落酉宫、逆布）；规范卯酉分界判酉时为夜 → 用夜贵申（落巳宫、逆布）。书内天将盘＋四课自洽于「昼贵子落酉宫逆布」，但书内三传行天将另成一套，两套互斥。书方证据另见同书 001）韩太守占祈雪（同为己日酉时，书用夜贵申，邵先生原话「况申为夜贵，正是权柄」）与本课自相抵牾。' },
  { id: 'duanan_065', src: DA, sig: '卯/戊午/寅', route: 'kouJing', kind: '昼夜取贵口径差异', adj: ADJ_C, kj: { book: '书用戊日昼贵丑（贵人落子宫、顺布）', norm: '规范：占时寅属夜 → 戊日夜贵＝未（落午宫、逆布）', selfConsistent: '书内四课天将（龙空空虎）＋三传天将（寅乘蛇、午乘龙）可由「昼贵丑落子宫顺布」完整复现，书确作昼占；仅天将盘八标注残损（缺贵宫、不能生成完整将序）' }, reason: '书用戊日昼贵丑（贵人落子宫、顺布）；规范判寅时为夜 → 用夜贵未（落午宫、逆布）。书内四课天将＋三传天将可由「昼贵丑落子宫顺布」完整复现（书确作昼占），仅天将盘八标注残损。' },
  { id: 'duanan_113', src: DA, sig: '亥/壬午/酉', route: 'kouJing', kind: '昼夜取贵口径差异', adj: ADJ_C, kj: { book: '书用壬日昼贵巳（贵人落卯宫，书实按逆布）', norm: '规范：占时酉属夜 → 壬日夜贵＝卯（落丑宫、顺布）', selfConsistent: '书天将盘八标注自身 8/8 自洽（卯宫贵人逆布得 卯贵 辰蛇 巳朱 午六 未陈 申龙 酉空 戌虎 亥常 子玄 丑阴 寅后，与八标注逐字相符）；唯卯属顺行区却按逆布，与规范「顺逆由贵人落宫分野定」不符，属书例自身问题' }, reason: '书用壬日昼贵巳（贵人落卯宫，书实按逆布）；规范判酉时为夜 → 用夜贵卯（落丑宫、顺布）。书天将盘八标注自身 8/8 自洽，唯卯属顺行区却按逆布，属书例自身问题。' },
  { id: 'duanan_173', src: DA, sig: '丑/己丑/辰', route: 'kouJing', kind: '昼夜取贵口径差异', adj: ADJ_C, kj: { book: '书用己日夜贵申（贵人落亥宫，书实按逆布）', norm: '规范：占时辰属昼 → 己日昼贵＝子（落卯宫、顺布）', selfConsistent: '书天将盘八标注自身 8/8 自洽（亥宫贵人逆布与八标注逐字相符）；唯亥属顺行区却按逆布，与规范不符，属书例自身问题' }, reason: '书用己日夜贵申（贵人落亥宫，书实按逆布）；规范判辰时为昼 → 用昼贵子（落卯宫、顺布）。书天将盘八标注自身 8/8 自洽，唯亥属顺行区却按逆布，属书例自身问题。' },
  /* ---- 引擎侧待修证据（2）→ 必须留在主集 ---- */
  { id: 'duanan_180', adjIdx: 157, src: DA, sig: '亥/己卯/未', route: 'keep', adjudication: 'engine_pending', adj: ADJ_B, reason: '涉害取用口径：书自身完全自洽且取「未」（临仲），引擎按深浅优先取「亥」；《六壬指南》涉害原文与多处传本课例站书侧 → 引擎待修，本条是待修项证据，必须留在主集。' },
  { id: 'duanan_181', adjIdx: 158, src: DA, sig: '戌/甲辰/寅', route: 'keep', adjudication: 'engine_pending', adj: ADJ_B, reason: '涉害取用口径：书取「戌」（临孟，与书自标课体「炎上」相符），引擎按深浅取「子」（润下）；同上，本条是待修项证据，必须留在主集。' },
  /* ---- 零差异对照例（6）→ 留在主集，标注裁决出处 ---- */
  { id: 'duanan_212', adjIdx: 188, src: DA, sig: '酉/辛未/寅', route: 'keep', adjudication: 'no_diff_control', adj: ADJ_B, reason: '三传地支、乘将、宗门书＝锚点＝引擎（本批净对照组）。' },
  { id: 'misc__3', src: '大六壬文档/古籍原文-易藏-术数/六壬一字诀玉连环-宋-徐汶滨/六壬一字诀玉连环-宋-徐汶滨.txt', sig: '午/辛酉/申', route: 'keep', adjudication: 'no_diff_control', adj: ADJ_B, reason: '书以文字明记三传「午辰寅」，锚点、引擎三方一致。' },
  { id: 'misc__4', src: '大六壬文档/古籍原文-易藏-术数/六壬一字诀玉连环-宋-徐汶滨/六壬一字诀玉连环-宋-徐汶滨.txt', sig: '申/丙子/酉', route: 'keep', adjudication: 'no_diff_control', adj: ADJ_B, reason: '书以文字明记三传「戌申午」＋「天魁临亥为用」，锚点、引擎三方一致。' },
  { id: 'misc__11', src: '大六壬文档/古籍原文-易藏-术数/六壬一字诀玉连环-宋-徐汶滨/六壬一字诀玉连环-宋-徐汶滨.txt', sig: '巳/己丑/辰', route: 'keep', adjudication: 'no_diff_control', adj: ADJ_B, reason: '三传「寅卯辰」书＝锚点＝引擎，无差异。' },
  { id: 'misc__3', src: '大六壬文档/古籍原文-易藏-术数/六壬灵觉经--佚名/六壬灵觉经--佚名.txt', sig: '子/壬辰/辰', route: 'keep', adjudication: 'no_diff_control', adj: ADJ_B, reason: '书以起例文字逐步自证三传「子申辰」（「重审只取一下贼」「贵人安于天盘同位之宫」「中末相因」三项规范的最强书证之一），与引擎逐位全同。' },
  { id: 'misc__4', src: '大六壬文档/古籍原文-易藏-术数/六壬银河櫂--佚名/六壬银河櫂--佚名.txt', sig: '亥/甲子/丑', route: 'keep', adjudication: 'no_diff_control', adj: ADJ_B, reason: '书以文字明记三传「戌申午」并自证「天乙逆行」，与引擎逐位全同。' }
];
const KNOWN_BY_KEY = new Map();
for (const r of KNOWN) {
  const k = r.id + '|' + r.src;
  if (KNOWN_BY_KEY.has(k)) throw new Error('V5 登记表键重复：' + k);
  KNOWN_BY_KEY.set(k, r);
}
/* 重跑时的路由计数（供报告打印） */
const routeStat = { rejected: 0, kouJing: 0, keep: 0, miss: 0 };

/* -------------------------------------- token 切分（规避上文提到的 V8 回溯缺陷） */
const isWS = (ch) => ch === ' ' || ch === '\t' || ch === '\u3000';
function splitTokens(line) {
  const out = [];
  let i = 0;
  while (i < line.length) {
    while (i < line.length && isWS(line[i])) i++;
    if (i >= line.length) break;
    const s = i;
    while (i < line.length && !isWS(line[i])) i++;
    out.push({ t: line.slice(s, i), s: s, e: i });
  }
  return out;
}
const toks = (line) => splitTokens(line).map((x) => x.t);

/* -------------------------------------------------------------- 文件与编码 */
function readText(p) {
  const b = fs.readFileSync(p);
  if (b[0] === 0xFF && b[1] === 0xFE) return b.toString('utf16le').replace(/^\uFEFF/, '');
  if (b[0] === 0xFE && b[1] === 0xFF) return new TextDecoder('utf-16be').decode(b).replace(/^\uFEFF/, '');
  try { return new TextDecoder('utf-8', { fatal: true }).decode(b).replace(/^\uFEFF/, ''); } catch (e) { }
  return new TextDecoder('gb18030').decode(b);
}
function walkFiles(dir, ext, out) {
  out = out || [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkFiles(p, ext, out);
    else if (e.name.toLowerCase().endsWith(ext)) out.push(p);
  }
  return out;
}
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

/* ------------------------------------------------------------------ 采集器 */
const anchors = [];
const rejected = [];
const drop = (src, why, excerpt) => rejected.push({ src: src, why: why, excerpt: String(excerpt).slice(0, 180) });

/* ------------------------------ V5 裁决登记的路由与落盘 ------------------------------ */
/* 两份裁决 JSON 作为**证据来源**读入（不写），用于把「原文三传／锚点三传／引擎三传／裁决」
 * 原样带进 anchors_rejected.json，避免人工转抄出错。 */
const ADJ_B_DATA = JSON.parse(fs.readFileSync(path.join(ROOT, ADJ_B), 'utf-8'));
const ADJ_C_DATA = JSON.parse(fs.readFileSync(path.join(ROOT, ADJ_C), 'utf-8'));
/* B 类按条目索引 + id 双键定位（misc__N 跨书重复，故必须带 index）；C 类按 id 唯一 */
const ADJ_B_BY_INDEX = new Map();
for (const r of ADJ_B_DATA['裁决记录']) ADJ_B_BY_INDEX.set(r.index + '|' + r.id, r);
const ADJ_C_BY_ID = new Map();
for (const r of ADJ_C_DATA['裁决记录']) ADJ_C_BY_ID.set(r.id, r);
const sigOf = (mj, dg, dz, hour) => mj + '/' + dg + dz + '/' + hour;
function knownOf(id, file, sig) {
  const r = KNOWN_BY_KEY.get(id + '|' + file);
  if (!r) return null;
  if (r.sig !== sig) {
    throw new Error('V5 课例签名不符（源文本可能已改动，拒绝静默误路由）：' + id + '|' + file + ' 登记=' + r.sig + ' 实得=' + sig);
  }
  return r;
}
/* 从登记条目取对应裁决证据（转抄零风险）。
 * B 类必须用「条目索引 + id」双键定位：misc__N 在各书内重复（misc__2/3/4/11 各有 2–3 条
 * 同名条目），只按 id 查会取到他书同名条目（本轮据此修正过一次错配）。 */
function adjEvidence(rec, id) {
  if (rec.adj === ADJ_B) {
    const r = rec.adjIdx === undefined ? null : ADJ_B_BY_INDEX.get(rec.adjIdx + '|' + id);
    if (!r) return null;
    const orig = r['书上三传（原文）'];
    return {
      条目索引: r.index,
      原文三传: Array.isArray(orig) ? orig.join('') : String(orig || ''),
      锚点三传: Array.isArray(r['锚点记录三传']) ? r['锚点记录三传'].join('') : String(r['锚点记录三传'] || ''),
      引擎三传: Array.isArray(r['引擎三传']) ? r['引擎三传'].join('') : String(r['引擎三传'] || ''),
      裁决: r['裁决'], 依据: r['依据'] || ''
    };
  }
  const r = ADJ_C_BY_ID.get(id);
  if (!r) return null;
  /* C 类裁决的「引擎排布」字段系上游人工转录，duanan_115 一条经复核有误（把「辰宫＝螣蛇」
   * 读成「辰乘螣蛇」，引擎实际为「辰乘天后」），故键名一律加「上游裁决·」前缀，
   * 视为上游主张而非复核结论；本轮复核结论见各条 rejectReason。 */
  return {
    上游裁决书三传天将: (r['书上排布'] && r['书上排布']['三传天将']) || '',
    上游裁决引擎三传乘将: (r['引擎排布'] && r['引擎排布']['三传乘将']) || '',
    上游裁决: r['裁决'], 依据: r['依据'] || ''
  };
}
const adjudicatedRejected = [];
const kouJingItems = [];
const auditRows = [];
/** 丢弃一个候选锚点：在 V5 登记表内 → 按登记原因写入 anchors_rejected（带裁决证据）；
 *  否则按采集校验原因写入 rejected（保留旧的 {src,why,excerpt} 形状）。 */
function dropCandidate(o) {
  const rec = knownOf(o.id, o.file, o.sig);
  const ci = (o.input && o.input.mj && isZhi(o.input.mj)) ? LiurenCore.buildChartAncient(o.input.mj, o.input.dg, o.input.dz, o.input.hour, '', '', '') : null;
  const engine = { chuans: ci ? ci.sanchuan.chuans.map((x) => x.z) : null };
  if (!rec) {
    /* 采集期丢弃沿用原形状：excerpt 取课例头行（与清洗前的 84 条丢弃记录逐字节一致）；
     * 裁决移出条目则用整段课例块摘录（便于复核原文三传）。 */
    drop(o.file, o.structWhy, o.excerptHead || o.excerpt);
    auditRows.push({ id: o.id, src: o.file, sig: o.sig, route: 'harvest-reject', why: o.structWhy });
    return 'harvest';
  }
  if (rec.route !== 'rejected') throw new Error('V5 登记与校验冲突：' + o.id + '|' + o.file + ' 登记 route=' + rec.route + '，但被校验规则拦下：' + o.structWhy);
  adjudicatedRejected.push({
    id: o.id, src: o.file, excerpt: o.excerpt, input: o.input,
    rejectKind: rec.kind, rejectReason: rec.reason, adjudicatedFrom: rec.adj,
    ...(rec.newFinding ? { newFinding: true } : {}),
    adjudicatedEvidence: adjEvidence(rec, o.id),
    collectedBook: o.book, engineChuans: engine.chuans, structWhy: o.structWhy
  });
  routeStat.rejected++;
  auditRows.push({ id: o.id, src: o.file, sig: o.sig, route: 'rejected(登记)', kind: rec.kind, why: o.structWhy });
  return 'adjudicated';
}
/** 采集成功后的路由：按 V5 登记把锚点分流到 主集 / rejected / kouJing。 */
function routeBuilt(a) {
  const rec = knownOf(a.id, a.src, sigOf(a.input.mj, a.input.dg, a.input.dz, a.input.hour));
  if (!rec) { routeStat.miss++; auditRows.push({ id: a.id, src: a.src, sig: sigOf(a.input.mj, a.input.dg, a.input.dz, a.input.hour), route: 'keep', why: '未登记（无裁决）' }); return true; }
  if (rec.route === 'keep') {
    a.adjudication = rec.adjudication;
    a.adjudicatedFrom = rec.adj;
    routeStat.keep++;
    auditRows.push({ id: a.id, src: a.src, sig: sigOf(a.input.mj, a.input.dg, a.input.dz, a.input.hour), route: 'keep(' + rec.adjudication + ')', why: rec.reason });
    return true;
  }
  if (rec.route === 'kouJing') {
    kouJingItems.push(buildKouJing(a, rec));
    routeStat.kouJing++;
    auditRows.push({ id: a.id, src: a.src, sig: sigOf(a.input.mj, a.input.dg, a.input.dz, a.input.hour), route: 'kouJing', why: rec.reason });
    return false;
  }
  /* route === 'rejected'：本锚点结构上通过校验，但裁决认定不可留（多为乘将类书版存疑） */
  adjudicatedRejected.push({
    id: a.id, src: a.src, excerpt: a.excerpt, input: a.input,
    rejectKind: rec.kind, rejectReason: rec.reason, adjudicatedFrom: rec.adj,
    ...(rec.newFinding ? { newFinding: true } : {}),
    adjudicatedEvidence: adjEvidence(rec, a.id),
    collectedBook: a.book, engineChuans: a._c.sanchuan.chuans.map((x) => x.z), structWhy: '结构校验通过（差异在乘将/书内标注），按裁决移出主集'
  });
  routeStat.rejected++;
  auditRows.push({ id: a.id, src: a.src, sig: sigOf(a.input.mj, a.input.dg, a.input.dz, a.input.hour), route: 'rejected(登记)', kind: rec.kind, why: rec.reason });
  return false;
}
/* 昼夜取贵口径差异册：写清 书用贵 / 规范用贵 / 书内是否自洽 / 为何不算引擎错。
 * 书侧口径三项取自登记表 kj 字段（逐例裁决原文），规范侧由引擎实测值填。 */
function buildKouJing(a, rec) {
  const c = a._c;
  const guiGong = LiurenCore.gongOf(c.tp, c.gui);
  return {
    id: a.id, src: a.src, excerpt: a.excerpt, input: a.input,
    占时昼夜: (ZHI.indexOf(a.input.hour) >= 3 && ZHI.indexOf(a.input.hour) <= 8 ? '昼' : '夜')
      + '（规范分界：卯时含至申时含为昼，酉时含至寅时含为夜）',
    书用贵: rec.kj.book,
    规范用贵: rec.kj.norm + '；引擎实测：贵人支 ' + c.gui + ' 落地盘 ' + guiGong + ' 宫、' + (c.shun ? '顺布' : '逆布')
      + '（逐宫 ' + ZHI.split('').map((g) => g + (c.jiangMap[g] || '')).join(' ') + '）',
    书内是否自洽: rec.kj.selfConsistent,
    三传地支: '书 ' + a.book.chuans.join('') + ' ／ 引擎 ' + a.engine.chuans.join('')
      + ' —— ' + (a.book.chuans.join('') === a.engine.chuans.join('') ? '逐位全同（本条差异只在三传乘将，故移出主集只影响「三传乘将」一项的分母）' : '不同'),
    三传乘将: '书 ' + (a.book.chuanJiang || []).join('/') + ' ／ 引擎 ' + a.engine.chuanJiang.join('/'),
    为何不算引擎错: '书例取贵自成一系（多数可由「取某贵支落某宫＋某向布将」一次生成，书内自洽），'
      + '与规范「纯以占时定昼夜（卯酉分界，与日支无关）、顺逆由贵人落宫分野定」互斥。规范真源：'
      + '大六壬文档/json/十二天神与贵人.json（昼夜贵人表/昼夜分界/布将规则）；'
      + '大六壬文档/排盘/十二天神与昼贵夜贵说明.md 文末「口径纪律（2026-09-10 定，不设选项）」：'
      + '本规则单值确定、排盘不提供昼夜开关，凡古籍书例与本规则不合者一律登记为书版存疑。'
      + '故这不是引擎缺陷，不计入引擎命中率分母。逐例裁决见 ' + rec.adj + '。',
    rejectReason: rec.reason, adjudicatedFrom: rec.adj, adjudicatedEvidence: adjEvidence(rec, a.id)
  };
}

/* ============================ 源 A：六壬断案 ============================ */
/* 每例开头课式块（原文实样，→ 表示制表符）：
 *   01）韩太守占祈雪，建炎三年己酉岁十一月初四己卯日寅将酉时，（申酉空亡,丑寅落空），铸印…
 *   →→六陈
 *   朱戌亥子丑龙
 *   蛇酉    寅空→龙  贵  玄  陈     父 辛巳 玄 初
 *   贵申    卯虎→→丑  申  巳  子     兄 甲戌 朱 中（暗鬼）
 *   后未午巳辰常        申  卯  子  己     鬼 己卯 虎 末
 *   →→阴玄
 *   邵先生曰：…
 * 左侧 4 列 = 四课（上神行 / 下神行，下神行末格是日干）；
 * 中间 4 列 = 天地盘十二宫 + 寄宫干；右 3 列 = 三传（干支·天将·初/中/末）。 */
const DAN_PROSE = /(邵先生曰|先生析曰|爱圅|案验|验案|汪先生曰|断语遗失|析曰)/;

function parseDuAn(text, file) {
  const headRe = new RegExp('([' + GAN + '])([' + ZHI + '])日(?=[^\\n]{0,20}?(?:' + JIANG_NAME_RE + '|[' + ZHI + '])将[^\\n]{0,20}?[' + ZHI + ']时)', 'g');
  const heads = [];
  let m;
  while ((m = headRe.exec(text))) heads.push({ dg: m[1], dz: m[2], i: m.index });

  let nHead = 0, nForme = 0, nTried = 0;
  for (let k = 0; k < heads.length; k++) {
    const H = heads[k];
    const end = k + 1 < heads.length ? heads[k + 1].i : Math.min(text.length, H.i + 4000);
    const block = text.slice(H.i, end);
    const line0 = block.split(/\r?\n/, 1)[0];
    const hm = line0.match(new RegExp('([' + GAN + '])([' + ZHI + '])日.*?(' + JIANG_NAME_RE + '|[' + ZHI + '])将\\s*([' + ZHI + '])时'));
    if (!hm) { drop(file, '课例头无「X将Y时」明确月将', line0); continue; }
    nHead++;
    const dg = hm[1], dz = hm[2], mj = JIANG_NAME[hm[3]] || hm[3], hour = hm[4];

    /* 课式区：遇散文即止；最多 12 行 */
    const lines = block.split(/\r?\n/);
    const form = [];
    let sawAny = false;
    for (let i = 1; i < lines.length && form.length < 12; i++) {
      const L = lines[i];
      if (L.trim() === '') { if (sawAny) break; else continue; }
      if (DAN_PROSE.test(L)) break;
      sawAny = true;
      form.push(L);
    }
    if (!form.length) { drop(file, '课例头后无课式块', line0); continue; }
    nForme++;

    /* --- 三传 ---
     * 版式：三行三传各自的行尾是「… 六亲 干支 天将 初/中/末（注）」；行中另夹着天地盘外圈、
     * 外圈天将注字与四课（列宽不齐，所以不能按列号取）。
     * 做法：①剥掉括号注文；②剥掉三传支前的空亡标记「空/落」；③拆 token；
     *      ④定位「末尾 初/中/末」那个 token，它**左侧**的 token 序列才是三传内容；
     *      ⑤在左侧序列里从右往左找「合法干支」或「单个地支且紧邻左侧为六亲字」的写法；
     *      ⑥干支右侧的 token 即天将（可能是单字 token，也可能粘在干支上，如「卯后」）。
     * 说明：断案对旬空的三传写作「空申」「空卯」，「空」是书的断法标注，故剥掉。 --- */
    const BAD_POS = /^[初中末]$/;
    const norm = (L) => L.replace(/[（(][^）)]{0,8}[）)]/g, ' ');
    /** 剥掉三传的空亡标注：token 形如「空申」「空卯」时去掉「空」。
     *  「空」本身也可能是天将名（天空）的简称，判据是它所在的位置：
     *  三传行尾部结构是「… 六亲 [空]干支 [空]天将 初/中/末」，位置字左 1 位必是天将位，
     *  再往左才是干支位 —— 只有干支位上的「空X」才是空亡标注。 */
    const stripKong = (T, pi) => {
      const out = T.slice();
      for (const j of [pi - 2, pi - 1]) {
        if (j >= 0 && out[j].length === 2 && /^[空落]/.test(out[j]) && isZhi(out[j][1])) out[j] = out[j][1];
      }
      return out;
    };
    const chuan = [];
    for (const L of form) {
      let T = toks(norm(L));
      let pi = T.findIndex((x) => BAD_POS.test(x));
      if (pi < 0) continue;
      T = stripKong(T, pi);
      const pos = T[pi];
      /* 干支：只在 初/中/末 左侧 1~4 个 token 内找（更左的是天地盘外圈，容易误取） */
      let gz = null, gi = -1, synth = false;
      for (let i = pi - 1; i >= 0 && i >= pi - 4; i--) {
        if (T[i].length === 2 && gzValid(T[i][0], T[i][1])) { gz = T[i]; gi = i; break; }
      }
      if (!gz) {
        /* 空亡的三传有时只写地支（如「兄 空申 空 中」），干支位写的是「日干+该支」的旬遁 */
        for (let i = pi - 1; i >= Math.max(0, pi - 4); i--) {
          const z = T[i].length === 1 ? T[i] : (T[i].length === 2 && /^[空落]/.test(T[i]) && isZhi(T[i][1]) ? T[i][1] : null);
          if (z && isZhi(z) && gzValid(dg, z)) { gz = dg + z; gi = i; synth = true; break; }
        }
      }
      if (!gz) { chuan.push({ bad: '三传行未找到合法干支：' + L.trim() + ' | T=' + JSON.stringify(T) }); continue; }
      /* 天将：干支 token 右侧（可能是单字 token，也可能粘在干支上，如「卯后」） */
      const tail = T.slice(gi + 1, pi);
      let jiang = null;
      for (const tk of tail) {
        if (JIANG_ABBR[tk] !== undefined) { jiang = JIANG_ABBR[tk]; break; }
        if (tk.length >= 2 && JIANG_ABBR[tk[0]] !== undefined) { jiang = JIANG_ABBR[tk[0]]; break; }
      }
      if (jiang === null) { chuan.push({ bad: '三传天将字无法识别：' + JSON.stringify(tail) + '（' + L.trim() + '）' }); continue; }
      /* 内部交叉校验：书上写的遁干是否等于「五鼠遁(日干 → 该支)」。
       * 两者互相独立（遁干是书自己排的），所以一致时可以确认「读到的支」和「书上的干支」都没读错；
       * 不一致时本锚点的三传乘将仍可用，但三传支要标记人工复核。 */
      const expectGan = tgGan(dg, gz[1]);
      /* V2 槽位判定：三传行尾部版式为「六亲｜干支｜天将｜位置字」，故干支位必是位置字左 2 格。
       * 槽外取支的实例：duanan_007 中传真值在位置字左 2 格（三传行印作「空申」，空亡支无遁干），
       * 旧读法却取到左边第 4 格四课格里的「卯」；duanan_082 末传同理取到六亲字「子」。
       * （六亲位在断案里或作「父/兄/鬼/财/子/孙/官」，或径用天干，故只用槽位偏移判定，
       *   不把六亲位的字面列入判据 —— duanan_096 的六亲位即作「癸」。） */
      chuan.push({
        gz: gz, jiang: jiang, pos: pos, synth: synth, gzAgree: synth ? true : (gz[0] === expectGan),
        gi: gi, pi: pi, slotOk: gi === pi - 2, pickedLiuQin: LIUQIN_CH.indexOf(T[gi]) >= 0,
        raw: L.trim()
      });
    }
    /* --- 三传补充读出：串文里写明的「三传子未寅，将六、阴、龙」「三传申子辰也」 ---
     * 只接受「三传」标签紧接三支连写（甚至夹一个「也」）这一种写法，且三者互不相同；
     * 若紧跟在后面的「将X、Y、Z」也能读出三个天将，一并采下。
     * V3：窗口＝**本课例段**（课例头 → 下一课例头），不再取课例头后 4000 字符 ——
     * 断案课例段通常 600–1200 字符，4000 字符的窗口会越到后面别的课例去
     * （duanan_159/160 的三传「丑寅卯」即取自 3400–4000 字符外的另一壬日课断语，行 1774）。 --- */
    let chuanText = null;
    {
      const mm = block
        .match(new RegExp('三传\\s*[\'\u2018\u300c]?([' + ZHI + '])\\s*([子丑寅卯辰巳午未申酉戌亥])\\s*([子丑寅卯辰巳午未申酉戌亥])[\'\u2019\u300d]?\\s*(也)?\\s*(?:[，,]\\s*将\\s*([^\u3002\\n]{1,20}))?'));
      if (mm && new Set([mm[1], mm[2], mm[3]]).size === 3) {
        chuanText = { z: [mm[1], mm[2], mm[3]] };
        if (mm[6]) {
          const js = [];
          for (const ch of mm[6]) if (JIANG_ABBR[ch] !== undefined && js.length < 3) js.push(JIANG_ABBR[ch]);
          if (js.length === 3) chuanText.j = js;
        }
      }
    }
    /* 说明：断案课式块里还印着天地盘方阵，但它与四课格子交错、列宽不齐，
     * 机器读序无法稳定还原（已试过多种切分，还原率不足且会引入猜测），故按「不猜」原则不采。
     * 天地盘这一项的校验改由「三传乘将」间接覆盖（天将落宫取决于天地盘）。 */
    /* ---- 校验：不合法即丢弃，不猜 ---- */
    const why = [];
    let good = chuan.filter((x) => !x.bad);
    for (const x of chuan) if (x.bad) why.push(x.bad);
    /* V2：三传行印了初/中/末，却在干支位（位置字左 2 格）读不出支 —— 旧读法只能到槽外
     * （六亲位本身 / 四课格 / 天地盘外圈）捞一个「像支」的 token，版式不符。
     * 此类一律丢弃，且**不退化**到串文补充读法（否则会把断语里他课的三传当成本课三传）。 */
    const slotBad = good.filter((x) => !x.slotOk);
    const excerptV2 = block.slice(0, 300).replace(/\r?\n/g, '⏎');
    if (slotBad.length) {
      const whyV2 = 'V2 三传行未落在「六亲｜干支｜天将｜位置字」槽（干支位＝位置字左 2 格，实读偏移 '
        + slotBad.map((x) => (x.gi - (x.pi - 2))).join('/') + ' 格，疑取到六亲字/空亡字/槽外 token）：'
        + slotBad.map((x) => x.raw + '（读到' + x.gz[1] + (x.pickedLiuQin ? '，该 token 本身是六亲字' : '') + '）').join(' ｜ ');
      dropCandidate({
        id: 'duanan_' + String(k + 1).padStart(3, '0'), file: file, sig: sigOf(mj, dg, dz, hour), excerpt: excerptV2,
        input: { mj: mj, dg: dg, dz: dz, hour: hour },
        book: { chuans: good.map((x) => x.gz[1]) }, structWhy: whyV2
      });
      continue;
    }
    if (good.length !== 3) {
      /* 方阵三传行读不全时，退回到串文明写的「三传XYZ」（V3：仅限本课例段内） */
      if (chuanText) {
        good = chuanText.z.map((z, i) => ({ gz: z, zhi: z, jiang: chuanText.j ? chuanText.j[i] : null, pos: '初中末'[i], fromText: true }));
        why.length = 0;
      } else {
        why.push('三传行数=' + good.length);
      }
    } else {
      good.sort((a, b) => '初中末'.indexOf(a.pos) - '初中末'.indexOf(b.pos));
      if (good.map((x) => x.pos).join('') !== '初中末') why.push('初中末次序异常');
      /* 若三传只写了地支、遁干由日干补出，则要求补出的干支合法（阳干配阳支） */
      if (good.some((x) => x.synth) && good.some((x) => x.synth && !gzValid(x.gz[0], x.gz[1]))) why.push('补出的遁干不合甲子');
    }
    const excerpt = block.slice(0, 300).replace(/\r?\n/g, '⏎');
    if (why.length) {
      dropCandidate({
        id: 'duanan_' + String(k + 1).padStart(3, '0'), file: file, sig: sigOf(mj, dg, dz, hour), excerpt: excerpt,
        input: { mj: mj, dg: dg, dz: dz, hour: hour },
        book: good && good.length === 3 ? { chuans: good.map((x) => (x.fromText ? x.zhi : x.gz[1])) } : null,
        structWhy: why.join('；')
      });
      continue;
    }

    const c = LiurenCore.buildChartAncient(mj, dg, dz, hour, '', '', '');
    const book = {
      chuans: good.map((x) => (x.fromText ? x.zhi : x.gz[1])),
      chuanJiang: good.map((x) => x.jiang)
    };
    /* 只有书上真写了遁干的才记 chuanGz；靠日干补出的一律不写进 book（铁律 1） */
    if (good.every((x) => !x.synth && !x.fromText)) book.chuanGz = good.map((x) => x.gz);
    else if (good.some((x) => x.synth)) book.chuanGzSynth = good.map((x) => (x.synth ? '补' : (x.fromText ? '串文' : x.gz)));
    if (!book.chuanJiang.every(Boolean)) delete book.chuanJiang;
    /* 文内互证：书上那三传**干支**的干，若不是「该支按五鼠遁应得的干」，说明书上的支与遁干
     * 互相矛盾（抄刻窜乱）。这是纯文本内部的一致性检查，用来客观区分「引擎错」与「传本错」。 */
    if (book.chuanGz) {
      book.chuanGzSelfCheck = good.map((x) => (x.gz[0] === tgGan(dg, x.gz[1]) ? '合' : ('疑误:' + x.gz + '(五鼠遁应' + tgGan(dg, x.gz[1]) + x.gz[1] + ')')));
    }
    /* 断案源目前不采天地盘与四课（见本段上方说明），故此处只写三传相关字段 */
    /* 原文明文点名的乘将（只认「X上乘Y」这种明确的四课/宫位乘将句，
     * 不认断语里「末传卯作白虎」之类的位置混写，避免把散文噪声当断言） */
    const claims = [];
    for (const mm of block.slice(0, 300).matchAll(new RegExp('([' + ZHI + '])上乘(贵人|螣蛇|朱雀|六合|勾陈|青龙|天空|白虎|太常|玄武|太阴|天后)', 'g'))) {
      claims.push({ zhi: mm[1], jiang: mm[2] });
    }
    if (claims.length) book.jiangClaims = claims;

    /* V1：三传天盘链（正课自洽闸门）——非伏吟/返吟/昴星/别责/八专诸课，
     * 要求 中传＝tp[初传]、末传＝tp[中传]（《六壬指南》第 23 行「相因」）。 */
    {
      const chain = chainOf(mj, hour);
      const bad = [];
      if (!isSpecialKet(c, line0)) {
        if (chain(book.chuans[0]) !== book.chuans[1]) bad.push('中传书' + book.chuans[1] + '/链上应' + chain(book.chuans[0]));
        if (chain(book.chuans[1]) !== book.chuans[2]) bad.push('末传书' + book.chuans[2] + '/链上应' + chain(book.chuans[1]));
      }
      if (bad.length) {
        dropCandidate({
          id: 'duanan_' + String(k + 1).padStart(3, '0'), file: file, sig: sigOf(mj, dg, dz, hour), excerpt: excerpt,
          input: { mj: mj, dg: dg, dz: dz, hour: hour }, book: book,
          structWhy: 'V1 三传与天盘链不符（正课 ' + c.sanchuan.method + '）：' + bad.join('；')
        });
        continue;
      }
    }

    nTried++;
    anchors.push({
      id: 'duanan_' + String(k + 1).padStart(3, '0'),
      src: file,
      excerpt: excerpt,
      input: { mj: mj, dg: dg, dz: dz, hour: hour },
      book: book,
      _c: c
    });
  }
  return { nHead: nHead, nForme: nForme, nTried: nTried };
}

/* ==================== 源 B：中黄五变经（markdown 表格） ==================== */
function parseZhongHuang(text, file) {
  let nHead = 0, nForme = 0, nTried = 0;
  const reA = new RegExp('假令\\s*([一二三四五六七八九十]+月将|[' + ZHI + ']将)\\s*([' + GAN + '])([' + ZHI + '])日\\s*([' + ZHI + '])时', 'g');
  const reB = new RegExp('假令\\s*([' + GAN + '])([' + ZHI + '])日\\s*([一二三四五六七八九十]+月将|[' + ZHI + ']将)\\s*([' + ZHI + '])时', 'g');
  const heads = [];
  let m;
  while ((m = reA.exec(text))) heads.push({ dg: m[2], dz: m[3], mjTok: m[1], hour: m[4], i: m.index });
  while ((m = reB.exec(text))) heads.push({ dg: m[1], dz: m[2], mjTok: m[3], hour: m[4], i: m.index });
  heads.sort((a, b) => a.i - b.i);

  for (let k = 0; k < heads.length; k++) {
    const H = heads[k];
    const end = k + 1 < heads.length ? heads[k + 1].i : Math.min(text.length, H.i + 3000);
    const block = text.slice(H.i, end);
    const line0 = block.split(/\r?\n/, 1)[0];
    nHead++;
    let mjStated = isZhi(H.mjTok[0]) ? H.mjTok[0] : null;   /* 原文直接写出的月将地支 */
    const mjFromMonth = mjStated ? null : MONTH_TO_MJ[H.mjTok.replace(/将$/, '')];  /* 只写了「X月将」时的名义月将 */
    /* 四课 markdown 表有两种版式：
     * ①标准式：表头「| 第四课 | 第三课 | 第二课 | 第一课 |」+ 上神行 + 下神行
     * ②重排式：「| 四课 | A | B | C | D |」+「|  ｜下1 | 下2 | 下3 | 下4 |」（自右向左读）
     * 两种都取出 [课1..课4] 的上/下。 */
    const cell = (s) => s.trim().replace(/^[*\s]+|[*\s]+$/g, '');
    const z = '([子丑寅卯辰巳午未申酉戌亥])';
    const g = '([甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥])';
    let up = null, down = null;
    const t1 = block.match(new RegExp('\\|\\s*第四课\\s*\\|[^\\n]*\\n\\|[^\\n]*\\n\\|\\s*' + z + '\\s*\\|\\s*' + z + '\\s*\\|\\s*' + z + '\\s*\\|\\s*' + z + '\\s*\\|[^\\n]*\\n\\|\\s*' + z + '\\s*\\|\\s*' + z + '\\s*\\|\\s*' + z + '\\s*\\|\\s*' + g + '\\s*\\|'));
    if (t1) {
      /* 表头「第四课|第三课|第二课|第一课」是课4→课1 的列序。
       * 实测读法：**按列（自右向左）成对**读，即
       *   课1 = (上, 下) = (row1[末], row2[末])，课4 = (row1[首], row2[首])。
       * 例（13.释复建真鬼）：庚子日申时十一月将
       *   row1=戌巳午丑 row2=巳子丑庚 → 四课 庚申/丑午/子巳/巳戌 → 丑/庚 子/丑 巳/子 戌/巳。
       * 与「庚日寄申」及「月将=占时+偏移」两条书内规则都能对上。 */
      const r1 = [t1[1], t1[2], t1[3], t1[4]];
      const r2 = [t1[5], t1[6], t1[7], t1[8]];
      up = [r1[3], r1[2], r1[1], r1[0]];
      down = [r2[3], r2[2], r2[1], r2[0]];
    } else {
      const t2 = block.match(new RegExp('\\|\\s*四课\\s*\\|\\s*' + z + '\\s*\\|\\s*' + z + '\\s*\\|\\s*' + z + '\\s*\\|\\s*' + z + '\\s*\\|[^\\n]*\\n\\|\\s*[^|\\n]*\\|\\s*' + g + '\\s*\\|\\s*' + z + '\\s*\\|\\s*' + z + '\\s*\\|\\s*' + z + '\\s*\\|'));
      if (t2) {
        /* 「| 四课 | A | B | C | D |」（自右向左为 课1..课4 的上神）
         * +「|  ｜下1 | 下2 | 下3 | 下4 |」（组5..8） */
        up = [t2[4], t2[3], t2[2], t2[1]];
        down = [t2[8], t2[7], t2[6], t2[5]];
      }
    }
    if (process.env.HARVEST_DEBUG) console.error('[zh] hd=' + H.dg + ' rowA=' + (typeof rowADbg !== 'undefined' ? rowADbg : '?') + ' up=' + JSON.stringify(up) + ' down=' + JSON.stringify(down));
    const zhid = 'zhonghuang_' + path.basename(file, '.md').replace(/[^\w]/g, '') + '_' + (k + 1);
    const zhExcerpt = block.slice(0, 300).replace(/\r?\n/g, '⏎');
    const zhDrop = (why) => dropCandidate({
      id: zhid, file: file, sig: sigOf(mjStated || '', H.dg, H.dz, H.hour), excerpt: zhExcerpt, excerptHead: line0,
      input: { mj: mjStated || null, dg: H.dg, dz: H.dz, hour: H.hour }, book: null, structWhy: why
    });
    if (!up) { zhDrop('未找到四课 markdown 表' + (mjStated ? '' : '（本课只给月份，需靠四课反推月将）')); continue; }
    nForme++;
    /* 下神行必须含日干（课1下神），且四组位移必须一致 —— 一起作为「版式读对」的判据 */
    if (!down.includes(H.dg)) {
      zhDrop('四课下神行未出现日干 ' + H.dg + '（疑版式读错）：上' + up.join('') + ' 下' + down.join(''));
      continue;
    }
    /* ---- 月将定值 ----
     * 判据（书内自洽）：四课四组「上/下」之间的位移必须一致 —— 位移 = 月将 − 占时，
     * 也就是每组 下神 在天地盘上取到 上神 的那一步。四组位移不一致说明版式读错，丢弃。
     * ①原文直接写了月将地支 → 用它，并要求与位移推得的月将一致；
     * ②原文只写「十一月将」这种月份 → 用书上干上神反推月将（课题允许的办法），
     *   并把「反推月将」与「名义月将（月份→月将）」是否一致记为 monthAgree 供复核。 */
    let mj = mjStated, mjHow = '原文直写月将', monthAgree = null;
    {
      /* 位移取课2（上神为纯支，最可靠），再要求课3、课4 位移一致 */
      const d2 = ((ZHI.indexOf(up[1]) - ZHI.indexOf(down[1])) + 12) % 12;
      let okShift = isZhi(up[1]) && isZhi(down[1]);
      for (const i of [2, 3]) {
        if (!isZhi(up[i]) || !isZhi(down[i])) { okShift = false; break; }
        if (((ZHI.indexOf(up[i]) - ZHI.indexOf(down[i])) + 12) % 12 !== d2) { okShift = false; break; }
      }
      const shift = d2;
      if (!okShift) {
        if (process.env.HARVEST_DEBUG) console.error('[zh-shift] dg=' + H.dg + ' up=' + JSON.stringify(up) + ' down=' + JSON.stringify(down) +
          ' diffs=' + JSON.stringify([0, 1, 2, 3].map((i) => (((ZHI.indexOf(up[i]) - ZHI.indexOf(down[i])) + 12) % 12))));
        zhDrop('书上四课四组位移不一致（疑版式读错）：上' + up.join('') + ' 下' + down.join(''));
        continue;
      }
      const cand = ZHI[(ZHI.indexOf(H.hour) + shift) % 12];      /* 月将 = 占时 + 位移 */
      if (!mjStated) { mj = cand; mjHow = '由书上四课位移反推'; }
      else if (cand !== mj) {
        zhDrop('原文明写月将 ' + mj + '，但与书上四课位移推得的 ' + cand + ' 不一致（书内矛盾）');
        continue;
      }
      if (mjFromMonth) monthAgree = (mjFromMonth === mj);
    }
    let chuans = null, chuanJiang = null;
    const ti = block.indexOf('三传');
    if (ti >= 0) {
      const seg = block.slice(ti, ti + 600);
      const rows = [...seg.matchAll(/\|\s*(初|中|末)\s*\|\s*([子丑寅卯辰巳午未申酉戌亥])\s*\|/g)];
      if (rows.length >= 3) {
        const map = { 初: null, 中: null, 末: null };
        rows.forEach((r) => { map[r[1]] = r[2]; });
        chuans = [map.初, map.中, map.末];
      }
      /* 重排式：「| 三传 | 巳 | 丑 | 酉 |」 */
      if (!chuans) {
        const r2 = seg.match(/\|\s*三传\s*\|\s*([子丑寅卯辰巳午未申酉戌亥])\s*\|\s*([子丑寅卯辰巳午未申酉戌亥])\s*\|\s*([子丑寅卯辰巳午未申酉戌亥])\s*\|/);
        if (r2) chuans = [r2[1], r2[2], r2[3]];
      }
      /* 天将行：「| 天将 | 勾陈 | 玄武 | 朱雀 |」 */
      const jr = seg.match(/\|\s*天将\s*\|\s*([^|\n]+)\|\s*([^|\n]+)\|\s*([^|\n]+)\|/);
      if (jr) {
        const names = [jr[1], jr[2], jr[3]].map((s) => {
          const t = s.trim();
          if (JIANG_FULL.indexOf(t) >= 0) return t;
          return JIANG_ABBR[t[0]] || '';
        });
        if (names.every(Boolean)) chuanJiang = names;
      }
    }
    if (!chuans) {
      const seg = block.slice(0, 1200);
      const got = {};
      for (const mm of seg.matchAll(new RegExp('(初|中|末)[传傳]\\s*([子丑寅卯辰巳午未申酉戌亥])', 'g'))) if (!got[mm[1]]) got[mm[1]] = mm[2];
      if (got.初 && got.中 && got.末) chuans = [got.初, got.中, got.末];
    }
    if (!chuans) { zhDrop('未找到三传'); continue; }
    const c = LiurenCore.buildChartAncient(mj, H.dg, H.dz, H.hour, '', '', '');
    /* V1：三传天盘链（正课自洽闸门，与源A同规则） */
    {
      const chain = chainOf(mj, H.hour);
      const bad = [];
      if (!isSpecialKet(c, line0)) {
        if (chain(chuans[0]) !== chuans[1]) bad.push('中传书' + chuans[1] + '/链上应' + chain(chuans[0]));
        if (chain(chuans[1]) !== chuans[2]) bad.push('末传书' + chuans[2] + '/链上应' + chain(chuans[1]));
      }
      if (bad.length) {
        dropCandidate({
          id: zhid, file: file, sig: sigOf(mj, H.dg, H.dz, H.hour), excerpt: block.slice(0, 300).replace(/\r?\n/g, '⏎'),
          input: { mj: mj, dg: H.dg, dz: H.dz, hour: H.hour }, book: { chuans: chuans },
          structWhy: 'V1 三传与天盘链不符（正课 ' + c.sanchuan.method + '）：' + bad.join('；')
        });
        continue;
      }
    }
    nTried++;
    const book = { chuans: chuans, kegs: [up[0] + '/' + down[0], up[1] + '/' + down[1], up[2] + '/' + down[2], up[3] + '/' + down[3]] };
    if (chuanJiang) book.chuanJiang = chuanJiang;
    anchors.push({
      id: zhid,
      src: file,
      excerpt: block.slice(0, 300).replace(/\r?\n/g, '⏎'),
      input: { mj: mj, dg: H.dg, dz: H.dz, hour: H.hour },
      book: book,
      _c: c
    });
  }
  return { nHead: nHead, nForme: nForme, nTried: nTried };
}

/* ============ 源 C：其他古籍（原文同时写明 日干支 + 占时 + 月将） ============ */
/* 句式：「假令正月癸未日寅时占，以登明加时」/「假令三月癸巳日午时占，月将从魁加时」/
 *       「甲子日卯将辰时」。这类课例只给三传（「初传胜光，将得白虎；中传大吉…」），
 *       所以只校验三传支与三传乘将。 */
function parseGeneric(text, file) {
  let nHead = 0, nForme = 0, nTried = 0;
  const headRe = new RegExp(
    '([' + GAN + '])([' + ZHI + '])日[^\\n]{0,24}?' +
    '(?:月将\\s*(' + JIANG_NAME_RE + ')|(' + JIANG_NAME_RE + ')\\s*加|([' + ZHI + '])将)\\s*' +
    '(?:加\\s*)?([' + ZHI + '])时', 'g');
  const heads = [];
  let m;
  while ((m = headRe.exec(text))) heads.push({ dg: m[1], dz: m[2], mjTok: m[3] || m[4] || m[5], hour: m[6], i: m.index });

  for (let k = 0; k < heads.length; k++) {
    const H = heads[k];
    const end = k + 1 < heads.length ? heads[k + 1].i : Math.min(text.length, H.i + 1200);
    const block = text.slice(H.i, end);
    const line0 = block.split(/\r?\n/, 1)[0];
    nHead++;
    const mj = JIANG_NAME[H.mjTok] || H.mjTok;
    const mid = 'misc_' + path.basename(file, '.txt').replace(/[^\w]/g, '').slice(0, 14) + '_' + (k + 1);
    const mexcerpt = block.slice(0, 260).replace(/\r?\n/g, '⏎');
    const mDrop = (why) => dropCandidate({
      id: mid, file: file, sig: sigOf(mj, H.dg, H.dz, H.hour), excerpt: mexcerpt, excerptHead: line0,
      input: { mj: mj, dg: H.dg, dz: H.dz, hour: H.hour }, book: null, structWhy: why
    });
    if (!isZhi(mj)) { mDrop('月将无法定支'); continue; }

    /* 明文三传的三种写法（在本课例段落内查找，但必须是**显式标注**的三传，
     * 不接受「初传X」这种只提到一传的句子，避免把散文里的片段当成三传）：
     *   ①「…，三传申子辰也…」                （支连写）
     *   ②「三传子未寅，将六、阴、龙」          （支连写 + 乘将）
     *   ③「初传胜光，将得白虎；中传大吉，将得朱雀；末传传送，将得玄武」
     * V4：证据必须落在**课例头后 WINDOW_C 字符内** —— 本类书的「课例段」常由「下一课例头」
     * 定界，而讲解性书籍（如《六壬指南注解》）整本只有几个课例头，段长可达数万字符，
     * 于是讲解段里的「三传亥卯未为之」会被当成课例三传（misc__1，距课例头 14874 字符）。 */
    const win = block.slice(0, WINDOW_C);
    const got = {};
    for (const mm of win.matchAll(new RegExp('(初|中|末)[传傳]\\s*[\'\u2018\u300c]?([' + ZHI + '])[\'\u2019\u300d]?[^。；;]{0,14}?(贵人|螣蛇|腾蛇|朱雀|六合|勾陈|青龙|天空|白虎|太常|玄武|太阴|天后)', 'g'))) {
      if (!got[mm[1]]) got[mm[1]] = { z: mm[2], j: mm[3] === '腾蛇' ? '螣蛇' : mm[3] };
    }
    if (!(got.初 && got.中 && got.末)) {
      const mm = win.match(new RegExp('三传\\s*[\'\u2018\u300c]?([' + ZHI + '])\\s*([' + ZHI + '])\\s*([' + ZHI + '])[\'\u2019\u300d]?\\s*(?:也)?\\s*(?:[，,]\\s*将\\s*([^\u3002；;]{1,20}))?'));
      if (mm && new Set([mm[1], mm[2], mm[3]]).size === 3) {
        got.初 = { z: mm[1], j: '' }; got.中 = { z: mm[2], j: '' }; got.末 = { z: mm[3], j: '' };
        if (mm[4]) {
          const js = [];
          for (const ch of mm[4]) if (JIANG_ABBR[ch] !== undefined && js.length < 3) js.push(JIANG_ABBR[ch]);
          if (js.length === 3) { got.初.j = js[0]; got.中.j = js[1]; got.末.j = js[2]; }
        }
      }
    }
    if (!(got.初 && got.中 && got.末)) {
      /* V4 诊断：把窗口放宽到整段看能否读到三传，并区分三种成因 ——
       * ①证据在段内但越出窗口（讲解段/他例窜入，本规则的打击对象）；
       * ②段内「三传XYZ」写法不合闸门（三支须互不相同，如「三传申寅申」）；
       * ③原文确实没给完整三传。 */
      const wide = block.match(new RegExp('三传\\s*[\'\u2018\u300c]?([' + ZHI + '])\\s*([' + ZHI + '])\\s*([' + ZHI + '])[\'\u2019\u300d]?'));
      const w2 = block.match(new RegExp('(初|中|末)[传傳]\\s*[\'\u2018\u300c]?([' + ZHI + '])'));
      let whyDrop;
      if (wide && wide.index >= WINDOW_C) {
        whyDrop = 'V4 三传证据越出课例头后 ' + WINDOW_C + ' 字符窗口（疑讲解段/他例窜入）：段内「三传' + wide.slice(1, 4).join('') + '」出现在第 ' + wide.index + ' 字符';
      } else if (wide) {
        whyDrop = '原文「三传' + wide.slice(1, 4).join('') + '」不合三传闸门（须紧接显式「三传」二字且三支互不相同），不采';
      } else if (w2 && w2.index >= WINDOW_C) {
        whyDrop = 'V4 三传证据越出课例头后 ' + WINDOW_C + ' 字符窗口（段内仅见「' + w2[1] + '传' + w2[2] + '」在第 ' + w2.index + ' 字符）';
      } else {
        whyDrop = '原文未给出完整（显式标注的）三传';
      }
      mDrop(whyDrop);
      continue;
    }
    let jiangs = ['初', '中', '末'].map((p) => got[p].j);
    let nJ = jiangs.filter(Boolean).length;
    if (nJ !== 0 && nJ !== 3) { mDrop('三传乘将残缺 ' + nJ + '/3'); continue; }
    /* --- 书上自洽闸门（防止把散文里「三合局」「四课…三传…」之类的字样当成三传）---
     * 原文若同时给了三传乘将，则三传支与乘将必须彼此自洽：
     * 从「月将 + 占时」可得天地盘偏移，三传支是天盘支，其地盘宫 = 天盘支 − 偏移；
     * 但天将在不同书里有时写「乘天盘支」、有时写「乘地盘宫」，两种都试，只要有一种自洽就采。 */
    let consistent = false;
    if (nJ === 3) {
      const off = ((ZHI.indexOf(mj) - ZHI.indexOf(H.hour)) + 12) % 12;
      /* 天盘布局：地盘宫 g 上的天盘支 = ZHI[(g + off) % 12] */
      const c2 = LiurenCore.buildChartAncient(mj, H.dg, H.dz, H.hour, '', '', '');
      const jiangOf = (ttz) => c2.jiangMap[LiurenCore.gongOf(c2.tp, ttz)] || '';
      let okA = 0, okB = 0;
      for (let i = 0; i < 3; i++) {
        const tt = got['初中末'[i]].z;
        if (jiangOf(tt) === jiangs[i]) okA++;                                         /* 天将乘天盘支 */
        const gong = ZHI[(ZHI.indexOf(tt) - off + 12) % 12];
        if ((c2.jiangMap[gong] || '') === jiangs[i]) okB++;                            /* 天将乘地盘宫 */
      }
      consistent = (okA === 3 || okB === 3);
      if (!consistent) {
        mDrop('三传与乘将不自洽（疑误采散文）：书三传' + ['初', '中', '末'].map((p) => got[p].z).join('') + '，书将' + jiangs.join('/'));
        continue;
      }
    }
    const c = LiurenCore.buildChartAncient(mj, H.dg, H.dz, H.hour, '', '', '');
    const book = { chuans: [got.初.z, got.中.z, got.末.z] };
    if (nJ === 3) book.chuanJiang = jiangs;
    /* V1：三传天盘链（正课自洽闸门，与源A/源B同规则） */
    {
      const chain = chainOf(mj, H.hour);
      const bad = [];
      if (!isSpecialKet(c, line0)) {
        if (chain(book.chuans[0]) !== book.chuans[1]) bad.push('中传书' + book.chuans[1] + '/链上应' + chain(book.chuans[0]));
        if (chain(book.chuans[1]) !== book.chuans[2]) bad.push('末传书' + book.chuans[2] + '/链上应' + chain(book.chuans[1]));
      }
      if (bad.length) {
        dropCandidate({
          id: mid, file: file, sig: sigOf(mj, H.dg, H.dz, H.hour), excerpt: mexcerpt,
          input: { mj: mj, dg: H.dg, dz: H.dz, hour: H.hour }, book: book,
          structWhy: 'V1 三传与天盘链不符（正课 ' + c.sanchuan.method + '）：' + bad.join('；')
        });
        continue;
      }
    }
    nForme++; nTried++;
    anchors.push({
      id: mid,
      src: file,
      excerpt: mexcerpt,
      input: { mj: mj, dg: H.dg, dz: H.dz, hour: H.hour },
      book: book,
      _c: c
    });
  }
  return { nHead: nHead, nForme: nForme, nTried: nTried };
}

/* ------------------------------------------------------------------ 采 集 */
const stats = { sources: [], headsTotal: 0 };
const ancientDir = path.join(ROOT, '大六壬文档', '古籍原文-易藏-术数');
const zhongDir = path.join(ROOT, '大六壬文档', '中黄五变经', '经文');
const pushStat = (kind, src, r) => {
  stats.sources.push({ kind: kind, src: src, nHead: r.nHead, nForme: r.nForme, nTried: r.nTried });
  stats.headsTotal += r.nHead;
};

/* A. 断案（同书有 gb18030 原件 + utf8 工作稿，取 utf8 稿，避免重复计） */
for (const p of walkFiles(ancientDir, '.txt')) {
  const f = rel(p);
  if (f.indexOf('断案') < 0 || f.indexOf('.utf8.') < 0) continue;
  if (srcFilter && f.indexOf(srcFilter) < 0) continue;
  pushStat('断案', f, parseDuAn(readText(p), f));
}
/* B. 中黄五变经 md */
for (const p of walkFiles(zhongDir, '.md')) {
  const f = rel(p);
  if (srcFilter && f.indexOf(srcFilter) < 0) continue;
  pushStat('中黄', f, parseZhongHuang(readText(p), f));
}
/* C. 其他古籍（排除断案副本与无三传的课经《直指御定》；同书多副本去重） */
const MISC_SKIP = /断案|直指御定/;
const seenBare = new Set();
for (const p of walkFiles(ancientDir, '.txt')) {
  const f = rel(p);
  if (MISC_SKIP.test(f)) continue;
  if (srcFilter && f.indexOf(srcFilter) < 0) continue;
  const bare = f.replace(/\.(utf8\.)?txt$/i, '');
  if (seenBare.has(bare)) continue;
  seenBare.add(bare);
  const t = readText(p);
  /* 《六壬大全》的三传散落在讲解性段落里（「三传戌午寅火局为鬼」这类是别人家的课），
   * 与本课例头所在段落不能可靠对应，机器抽取会张冠李戴，故整体不采（见报告）。 */
  if (f.indexOf('大全') >= 0) continue;
  const r = parseGeneric(t, f);
  if (r.nHead === 0) continue;
  pushStat('其他', f, r);
}

/* ------------------------------------------------------------------ 比 对 */
const cmp = {
  kegsUp: { n: 0, ok: 0 }, kegsDown: { n: 0, ok: 0 }, kegsAll: { n: 0, ok: 0 },
  chuan: { n: 0, ok: 0 }, chuanGz: { n: 0, ok: 0 }, chuanJiang: { n: 0, ok: 0 },
  plate: { n: 0, ok: 0, cells: 0, cellOk: 0 }, jiangClaims: { n: 0, ok: 0 }
};
const fails = [];
const kept = [];
for (const a of anchors) {
  const c = a._c;
  const engKegs = c.kegs.map((k) => k.x + '/' + k.s);
  const engChuans = c.sanchuan.chuans.map((x) => x.z);
  const engine = {
    chuans: engChuans,
    chuanGz: c.sanchuan.chuans.map((x) => x.gz),
    chuanJiang: engChuans.map((z) => jiangAtZhi(c, z)),
    kegs: engKegs,
    method: c.sanchuan.method,
    keti: c.sanchuan.keti,
    xunkong: c.dx.xunkong,
    ok: true
  };
  const F = [];
  /* 先按 V5 登记路由：只有**留在主集**的锚点才计入命中率分母
   * （移出的 28 + 口径差异 4 例不再参与统计，这正是清洗的目的）。 */
  a.engine = engine;
  const inMain = routeBuilt(a);

  if (inMain && a.book.kegs) {
    const bk = a.book.kegs, bkUp = bk.map((s) => s.split('/')[0]), bkDn = bk.map((s) => s.split('/')[1]);
    const enUp = c.kegs.map((k) => k.x), enDn = c.kegs.map((k) => k.s);
    const upBad = [], dnBad = [];
    for (let i = 1; i < 4; i++) {
      if (bkUp[i] !== enUp[i]) upBad.push('课' + (i + 1) + '上神 书' + bkUp[i] + '/引擎' + enUp[i]);
      if (bkDn[i] !== enDn[i]) dnBad.push('课' + (i + 1) + '下神 书' + bkDn[i] + '/引擎' + enDn[i]);
    }
    if (bk[0] !== engKegs[0]) upBad.push('课1 书' + bk[0] + '/引擎' + engKegs[0]);
    cmp.kegsUp.n++; if (!upBad.length) cmp.kegsUp.ok++;
    cmp.kegsDown.n++; if (!dnBad.length) cmp.kegsDown.ok++;
    cmp.kegsAll.n++; if (!upBad.length && !dnBad.length) cmp.kegsAll.ok++;
    if (upBad.length || dnBad.length) F.push({ item: '四课', why: upBad.concat(dnBad).join('；') });
  }
  if (inMain && a.book.chuans) {
    cmp.chuan.n++;
    if (a.book.chuans.join('') === engChuans.join('')) cmp.chuan.ok++;
    else F.push({ item: '三传', why: '书' + a.book.chuans.join('') + '/引擎' + engChuans.join('') });
  }
  if (inMain && a.book.chuanGz) {
    cmp.chuanGz.n++;
    if (a.book.chuanGz.join('/') === engine.chuanGz.join('/')) cmp.chuanGz.ok++;
    else F.push({ item: '三传遁干', why: '书' + a.book.chuanGz.join('/') + '/引擎' + engine.chuanGz.join('/') });
  }
  if (inMain && a.book.chuanJiang) {
    cmp.chuanJiang.n++;
    if (a.book.chuanJiang.join('/') === engine.chuanJiang.join('/')) cmp.chuanJiang.ok++;
    else F.push({ item: '三传乘将', why: '书' + a.book.chuanJiang.join('/') + '/引擎' + engine.chuanJiang.join('/') });
  }
  if (inMain && a.book.plate) {
    cmp.plate.n++;
    const bad = [];
    for (let i = 0; i < 12; i++) {
      const g = ZHI[i], en = c.tp[g] || '';
      cmp.plate.cells++;
      if (a.book.plate[g] === en) cmp.plate.cellOk++; else bad.push(g + '宫 书' + a.book.plate[g] + '/引擎' + en);
    }
    if (!bad.length) cmp.plate.ok++; else F.push({ item: '天地盘', why: bad.join('；') });
  }
  if (inMain && a.book.jiangClaims) {
    for (const cl of a.book.jiangClaims) {
      cmp.jiangClaims.n++;
      const en = jiangAtZhi(c, cl.zhi);
      if (en === cl.jiang) cmp.jiangClaims.ok++;
      else F.push({ item: '乘将断言', why: cl.zhi + '上 书乘' + cl.jiang + '/引擎' + en });
    }
  }

  if (inMain) {
    if (F.length) fails.push({ id: a.id, src: a.src, excerpt: a.excerpt, input: a.input, book: a.book, engine: engine, fails: F });
    kept.push(a);
  }
  delete a._c;
}

/* ------------------------------------------------------------------ 输 出 */
const pct = (o) => o.n ? (o.ok / o.n * 100).toFixed(1) + '%' : '—';
const pad = (s, n) => { let w = 0; for (const c of s) w += (c.charCodeAt(0) > 0x2000 ? 2 : 1); return s + ' '.repeat(Math.max(1, n - w)); };
const row = (name, o, extra) => '  ' + pad(name, 21) + pad(o.ok + '/' + o.n, 10) + pad(pct(o), 8) + (extra || '');
const L = [];
L.push('大六壬传本课例锚点采集与引擎比对');
L.push('='.repeat(78));
L.push('读出课例头 ' + stats.headsTotal + ' 例 → 采集成形 ' + anchors.length + ' 例，采集期丢弃 ' + rejected.length + ' 例');
L.push('采集校验（V1 天盘链 / V2 版式槽 / V3 串文窗口 / V4 源C证据窗口）拦下 ' + rejected.length + ' 例');
L.push('裁决登记（V5）路由：移出主集 ' + routeStat.rejected + ' 例（→ anchors_rejected.json）、'
  + '口径差异 ' + routeStat.kouJing + ' 例（→ anchors_kouJing.json）、标注保留 ' + routeStat.keep + ' 例；'
  + '其余 ' + routeStat.miss + ' 例无裁决、原样留在主集');
L.push('★ 主锚点集 ' + kept.length + ' 例（清洗前 220 例；本条采集成形 ' + anchors.length + ' 例，'
  + '其中校验期拦下并登记 ' + (anchors.length - kept.length - routeStat.kouJing) + ' 例）');
L.push('');
L.push('按源统计（课例头 = 原文出现「日干支 + 占时 + 月将」的位置数）：');
for (const s of stats.sources) {
  if (!s.nHead && !s.nTried) continue;
  L.push('  [' + s.kind + '] ' + s.src);
  L.push('        课例头 ' + s.nHead + '  课式成形 ' + s.nForme + '  入锚点 ' + s.nTried);
}
L.push('');
L.push('清洗后分项命中率（命中/可比）：');
L.push('  项目                      命中/可比    命中率');
L.push(row('四课 课2/3/4 上神', cmp.kegsUp));
L.push(row('四课 课2/3/4 下神', cmp.kegsDown));
L.push(row('四课 整式四课', cmp.kegsAll));
L.push(row('三传 初中末地支', cmp.chuan));
L.push(row('三传 遁干', cmp.chuanGz, '  仅「原文写了遁干」的断案课式'));
L.push(row('三传 乘将', cmp.chuanJiang));
L.push(row('天地盘 整盘', cmp.plate, '  逐宫 ' + cmp.plate.cellOk + '/' + cmp.plate.cells));
L.push(row('原文乘将断言 X上乘Y', cmp.jiangClaims));
L.push('');
L.push('不命中课例 ' + fails.length + ' 例（共 ' + kept.length + ' 例）');
if (fails.length) L.push('  ' + fails.map((f) => f.id).join('、'));
L.push('');
if (AUDIT) {
  L.push('---- 采集校验逐条判定（--audit）----');
  for (const r of auditRows) {
    L.push('  [' + r.id + '] ' + String(r.src || '').split('/').pop().replace(/\.(utf8\.)?txt$|\.md$/, '')
      + ' ' + r.sig + '  ' + r.route + (r.kind ? '／' + r.kind : '') + '  ' + (r.why || '').slice(0, 150));
  }
  L.push('');
}
if (VERBOSE) {
  L.push('---- 不命中明细（书 vs 引擎）----');
  if (!fails.length) L.push('  （无）');
  for (const f of fails) {
    L.push('[' + f.id + '] ' + f.src);
    L.push('   输入   月将' + f.input.mj + ' 日' + f.input.dg + f.input.dz + ' 占时' + f.input.hour);
    L.push('   原文   ' + f.excerpt.slice(0, 220));
    L.push('   书     四课 ' + (f.book.kegs ? f.book.kegs.join(' ') : '—') + ' | 三传 ' + (f.book.chuans ? f.book.chuans.join('') : '—') + ' | 将 ' + (f.book.chuanJiang ? f.book.chuanJiang.join('/') : '—'));
    if (f.book.chuanGzSelfCheck) L.push('          书上三传的干自洽性：' + f.book.chuanGzSelfCheck.join('  '));
    L.push('   引擎   四课 ' + f.engine.kegs.join(' ') + ' | 三传 ' + f.engine.chuans.join('') + ' | 将 ' + f.engine.chuanJiang.join('/'));
    for (const x of f.fails) L.push('   ✗ ' + x.item + '：' + x.why);
    L.push('');
  }
  L.push('---- 丢弃原因分类 ----');
  const byWhy = {};
  for (const r of rejected) { const k = r.why.replace(/[：:].*$/, '').replace(/[（(].*$/, ''); byWhy[k] = (byWhy[k] || 0) + 1; }
  Object.keys(byWhy).sort((a, b) => byWhy[b] - byWhy[a]).forEach((k) => L.push('   ' + k + '  ×' + byWhy[k]));
} else {
  L.push('（加 --verbose 看逐条书/引擎对照与丢弃原因分类）');
}
console.log(L.join('\n'));

if (WRITE) {
  const outDir = path.join(ROOT, '_tests', '_data');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'anchors_corpus.json');
  const data = kept.map((a) => {
    const o = { id: a.id, src: a.src, excerpt: a.excerpt, input: a.input, book: a.book, engine: a.engine };
    if (a.adjudication) { o.adjudication = a.adjudication; o.adjudicatedFrom = a.adjudicatedFrom; }
    return o;
  });
  fs.writeFileSync(outFile, JSON.stringify(data, null, 1), 'utf-8');
  console.log('\n已写出 ' + rel(outFile) + '（' + data.length + ' 条主锚点）');
  const rejFile = path.join(outDir, 'anchors_rejected.json');
  fs.writeFileSync(rejFile, JSON.stringify(rejected.concat(adjudicatedRejected), null, 1), 'utf-8');
  console.log('已写出 ' + rel(rejFile) + '（采集期丢弃 ' + rejected.length + ' 条 + 裁决移出 ' + adjudicatedRejected.length + ' 条）');
  const kjFile = path.join(outDir, 'anchors_kouJing.json');
  const kj = {
    元数据: {
      名称: '昼夜取贵口径差异册（书例按另一套昼夜取贵，与规范卯酉分界互斥）',
      生成日期: new Date().toISOString().slice(0, 10),
      条数: kouJingItems.length,
      为何单列: '这类条目「书内自洽 + 与规范口径互斥」，既不是采集错（不能进 anchors_rejected 污染原因分类），'
        + '也不是引擎错（不计入引擎命中率分母），故单列一册。',
      规范真源: '大六壬文档/json/十二天神与贵人.json（昼夜贵人表、昼夜分界、定顺逆）'
        + '；大六壬文档/排盘/十二天神与昼贵夜贵说明.md 文末「口径纪律（2026-09-10 定，不设选项）」',
      裁决依据: ADJ_C,
      上游说明: '本册条目同时出现在 anchors_corpus.json 的清洗前版本中（三传地支全部与引擎相符，'
        + '仅三传乘将因昼夜取贵不同而整盘错位），故移出主集只影响「三传乘将」一项的分母。'
    },
    条目: kouJingItems
  };
  fs.writeFileSync(kjFile, JSON.stringify(kj, null, 1), 'utf-8');
  console.log('已写出 ' + rel(kjFile) + '（' + kouJingItems.length + ' 条昼夜取贵口径差异）');
}
process.exit(0);

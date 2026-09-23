/* 一次性：把「知县占失银物衣物」（duanan_200_zhixian_shiwu）的剧情底稿
 * 换成为本案量身设计的「侦破线」（旧底稿是按统一模板铺的 4+2 条）。
 *
 * 用法: node _tools/_story_200.js          # 打补丁
 *       node _tools/_story_200.js --dry    # 只看会写什么，不动文件
 *
 * 设计要点（本题材与前案的差别就在这里）：
 *   · 不套「定课体 → 初传 → 中传 → 末传」；改成知县真正会问的几件事：
 *     东西出没出门 → 贼从哪儿下手 → 藏在哪里 → 破得了吗 → 几时破 → 姓氏怎么取出来；
 *   · 每条线索的锚点都取自 story_pan.js 核对过的盘面事实；
 *   · 断法依据落在古籍**通则**上（伏吟主静不离本家 / 玄武所临取来路 / 墓乘太阴主幽隐 /
 *     鬼与捕系同支主官法主动 / 支中藏干取姓 / 破碎主散失 / 二马取动象 / 日干旺衰定己力），
 *     而 **hint 一律不抄本案原文断语、不提前揭应验** —— 结论留到「呈上断语 → 揭古断」
 *     （这条纪律由 _test_case_story.js 硬判，首版就是在这里被判否的）。
 *
 * 盘面事实（node _tools/story_pan.js duanan_200_zhixian_shiwu 复核）：
 *   伏吟课；四课全丑；三传 丑(勾陈) → 戌(白虎) → 未(太阴)；旬空寅卯；
 *   申乘玄武（高处）；丑带成神/闭口/华盖/破碎；未带寡宿/皇书/旬丁；日干旺衰=囚。
 *
 * 写入方式：**段替换**（只动该案的文本段）。原文件序列化风格与 JSON.stringify(x,null,2)
 * 不同，整文件重写会把另外 40 案一起重排、diff 不可读；故定位该案起止后仅替换这一段，
 * 并在写前自检"其他案逐字段未变"。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const P = path.join(__dirname, '..',
  'APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/ancient/case_story.json');
const ID = 'duanan_200_zhixian_shiwu';
const DRY = process.argv.indexOf('--dry') >= 0;

const raw = fs.readFileSync(P, 'utf-8');
const j = JSON.parse(raw);
console.log('整文件重序列化与原文同风格: %s（false 不影响 —— 本脚本用段替换）',
  JSON.stringify(j, null, 2) + '\n' === raw);

const NEW = {
  brief: '九月，癸丑日，卯将卯时。知县在后堂宴请同僚，席散之后，随身的银物衣物竟不见了。' +
    '他没有声张，只把邵先生请来，就此刻起一课。你要做的不是抓人 —— ' +
    '先把这案子在盘上问清楚：东西出没出这道门？贼从哪儿下手？赃物藏在何处？几时能破、是何人所为？',
  note: '同一课可作多占（同课异占）：换一个占问方向，盘面不变而取象各异。' +
    '原占支线揭古籍断语与应验；异占支线只列可取之象与规则依据，不作断语。',
  asks: [
    {
      id: 'original',
      role: 'original',
      topic: '亡盗',
      title: '原占 · 寻失物',
      badge: '古籍原占',
      intro: '《六壬断案》元集亡盗第 200 案。九月癸丑日卯将卯时起课，问失窃的银物衣物。',
      question: '东西还在衙门里吗？藏在何处、何人所为、何时能破？',
      clues: [
        {
          id: 'keti',
          label: '先定课体：这一课叫什么？东西出没出这道门？',
          small: '点盘面上方的「课名」',
          anchors: [{ kind: 'method' }],
          hint: '月将卯正加在占时卯上 —— 天地盘逐宫重合，这一课是伏吟。' +
            '古法：伏吟主静、主不动、主淹留。占失物见此，先取「未离本处」之意 —— 盘不动，象也就不动。'
        },
        {
          id: 'xuanwu',
          label: '贼从哪儿下手？“高处”这个来路是打哪儿看出来的？',
          small: '点盘上申宫，看它的乘将',
          anchors: [{ kind: 'zhi', ref: '申' }, { kind: 'jiang', ref: '申/玄武' }],
          hint: '玄武是盗贼的本将。本课玄武落在申宫 —— 申在十二支中主高亢、楼阁、高处之象。' +
            '古法占亡盗先看玄武所临：临高取「自高而下」，临水主舟渡，临门主出入。' +
            '这一处定的是作案者的来路，不是他是谁。'
        },
        {
          id: 'shenmiao',
          label: '赃物藏在何处？看末传这一支的“藏”象',
          small: '点三传「末传」的天将',
          anchors: [{ kind: 'chuan', pos: '末传', ref: '未' }, { kind: 'jiang', ref: '未/太阴' }],
          hint: '末传未乘太阴。未为木之墓库 —— 墓主埋藏、主封闭；太阴主隐匿、主不见光。' +
            '墓上加太阴，古法占失物取「藏于幽隐之处」之象。至于这处幽隐究竟是什么地方，' +
            '还要看末传这一支所带的其它东西 —— 留待揭古断。'
        },
        {
          id: 'guanxing',
          label: '这案子破得了吗？官法那头有没有着力处？',
          small: '点三传「初传」，看它的乘将',
          anchors: [{ kind: 'chuan', pos: '初传', ref: '丑' }, { kind: 'jiang', ref: '丑/勾陈' }],
          hint: '初传丑。癸日以丑为官星 —— 丑土克癸水，是日干之鬼，古法称官星；丑又乘勾陈，' +
            '勾陈主勾连、主捕系。鬼与捕系之神同落一支，是「官法主动」之象。' +
            '再看丑、戌、未三支相刑 —— 刑主事发，占亡盗遇刑局，多主案情由官法勾出。'
        },
        {
          id: 'sanxing',
          label: '初→中→末（丑→戌→未）连着读，讲的是怎样一个过程？',
          small: '依次点三传的「初传／中传／末传」',
          anchors: [
            { kind: 'chuan', pos: '初传', ref: '丑' },
            { kind: 'chuan', pos: '中传', ref: '戌' },
            { kind: 'chuan', pos: '末传', ref: '未' }
          ],
          hint: '丑、戌、未三支连成一串，恰是十二支里的三刑（丑刑戌、戌刑未），三传皆土而成刑局。' +
            '再看乘将：初传勾陈主查拿，中传白虎主急速、主道路，末传太阴主藏匿。' +
            '一串读下来是：一开头就查，中间动得快，末后藏处被揭开 —— 刑局主动，故事情拖不住。'
        },
        {
          id: 'jishi',
          label: '几时能破？盘上哪儿看得出“快”？',
          small: '点三传「末传」下方的神煞',
          anchors: [{ kind: 'chuan', pos: '末传', ref: '未' }, { kind: 'shensha', ref: '未/皇书' }],
          hint: '末传未带皇书。皇书主官文、簿籍、册档 —— 古法见皇书，多取「册子上对得出来」之象。' +
            '再加伏吟主静（东西没出门）、初传丑为官星乘勾陈（官法主动），三样凑在一处，可参破案迟速。'
        },
        {
          id: 'erxing',
          label: '连作案者的姓氏都能取出来？看哪一支？',
          small: '点盘上未宫',
          anchors: [{ kind: 'chuan', pos: '末传', ref: '未' }, { kind: 'zhi', ref: '未' }],
          hint: '未中藏丁、己二干（地支藏干）。古法有以支中所藏之干取姓的一路：' +
            '一支藏两干，即取二姓之象。本课末传正是未，故盘上能取到「二姓」这一层 —— ' +
            '至于具体是哪两姓，要看古人怎么落断。'
        }
      ],
      goodWords: ['伏吟', '丑', '戌', '未', '勾陈', '白虎', '太阴', '玄武', '申', '官星', '三刑', '皇书', '藏干'],
      endings: ['入境', '验迹', '得赃', '结案'],
      ending: { type: 'original', tip: '揭古断与应验' }
    },
    {
      id: 'zhuihui',
      role: 'derived',
      topic: '亡盗',
      title: '同课异占 · 能追回几何',
      badge: '异占支线',
      intro: '同是这一课：若知县问的不是「谁偷的」，而是「东西还能追回多少、几时回来」—— 取象就换了。' +
        '此支线只列可取的类象与规则依据，不给结论。',
      question: '失物能追回多少？几时回来？',
      clues: [
        {
          id: 'zai',
          label: '物还在不在本地？',
          small: '点盘面上方的「课名」',
          anchors: [{ kind: 'method' }],
          hint: '古法：伏吟主静、天地盘不动。占失物先取「未离本处」之意 —— 盘不动则物不动。'
        },
        {
          id: 'posun',
          label: '有没有缺损？看哪一处？',
          small: '点盘上丑宫的神煞行',
          anchors: [{ kind: 'chuan', pos: '初传', ref: '丑' }, { kind: 'shensha', ref: '丑/破碎' }],
          hint: '古法：破碎主破败、散失、不完整 —— 占失物追回，遇此煞多取「所失不全」之象。' +
            '本课初传丑正带破碎。另一路可参：丑又带闭口，古法以闭口主事不张扬、声不外扬。'
        },
        {
          id: 'jishi2',
          label: '几时可得？动象在哪一支？',
          small: '点三传「末传」的神煞行，或点盘上亥宫',
          anchors: [{ kind: 'shensha', ref: '未/旬丁(丁马)' }, { kind: 'shensha', ref: '亥/驿马' }],
          hint: '古法取动象先看二马：丁马应事速，驿马主传递、主往返。' +
            '本课末传未带旬丁（丁马），亥宫带驿马，两处动象可据以参归还之期。'
        },
        {
          id: 'lidao',
          label: '追索的力道够不够？',
          small: '点下方事实栏的「日干旺衰」',
          anchors: [{ kind: 'dayWangShuai', ref: '囚' }, { kind: 'zhi', ref: '申' }],
          hint: '古法以日干在月令的旺衰定己身之力：月令戌，癸水居秋为囚。囚则己力不足，' +
            '凡追索之事须借他力。本课玄武乘申、初传丑为官星乘勾陈，可据此参「借谁之力」。'
        }
      ],
      goodWords: ['伏吟', '破碎', '闭口', '丁马', '驿马', '囚', '申', '玄武', '官星'],
      endings: ['问物', '辨损', '知时', '圆通'],
      ending: {
        type: 'derived',
        text: '可参的取象清单：① 在否——伏吟主静，取未离本处之意；② 全缺——初传丑带破碎，' +
          '取破败散失之象；③ 期限——末传未带旬丁（丁马）、亥宫带驿马，二马之象可参归期；' +
          '④ 力道——日干居月令为囚，己力不足，全赖官星（丑乘勾陈）主张。' +
          '以上皆依类象与经文列出，不作断语。',
        note: '本支线为同课异占的取象推演，非古籍原断，也不构成对现实财物、人员或案件处理的判断或建议。'
      }
    }
  ]
};

/* ---- 段替换：只动这一案，不重排另外 40 案 ---- */
const keys = Object.keys(j.stories);
const idx = keys.indexOf(ID);
if (idx < 0) {
  console.log('!! 数据里没有该案: %s', ID);
  process.exit(1);
}
const start = raw.indexOf('"' + ID + '": {');
if (start < 0) {
  console.log('!! 原文里定位不到该案文本段');
  process.exit(1);
}
let end;
if (idx + 1 < keys.length) {
  end = raw.indexOf('"' + keys[idx + 1] + '": {', start);
} else {
  end = raw.lastIndexOf('\n  }');
}
if (end <= start) {
  console.log('!! 定位该案结束位置失败（end=%d start=%d）', end, start);
  process.exit(1);
}
const sep = (idx + 1 < keys.length) ? ',\n    ' : '\n  ';
const body = ('"' + ID + '": ' + JSON.stringify(NEW, null, 2))
  .split('\n').map((ln, n) => (n === 0 ? ln : '    ' + ln)).join('\n');
const out = raw.slice(0, start) + body + sep + raw.slice(end);

/* 写前自检：改后仍能解析，且其他案逐字段未变 */
let parsed;
try {
  parsed = JSON.parse(out);
} catch (e) {
  console.log('!! 替换后 JSON 解析失败，已中止：%s', e.message);
  process.exit(1);
}
let changed = 0;
for (const k of keys) {
  if (k === ID) continue;
  if (JSON.stringify(parsed.stories[k]) !== JSON.stringify(j.stories[k])) changed += 1;
}
console.log('替换后：案数 %d（原 %d）｜ 其他案被改动 %d 个（应为 0）',
  Object.keys(parsed.stories).length, keys.length, changed);
if (changed !== 0 || Object.keys(parsed.stories).length !== keys.length) {
  console.log('!! 自检未通过，已中止');
  process.exit(1);
}
console.log('原占线索 %d 条 ｜ 异占线索 %d 条',
  parsed.stories[ID].asks[0].clues.length, parsed.stories[ID].asks[1].clues.length);
if (!DRY) {
  fs.writeFileSync(P, out);
  console.log('已写回: %s', P);
} else {
  console.log('(--dry：未写回)');
}

/* 抓用神核心 selectDuyu 冒烟测试（node 直接跑：模拟 Web 端数据形态） */
const fs = require('fs');
const path = require('path');

// 加载核心（全局脚本：用 vm.runInThisContext 以顶层作用域执行，class 挂 globalThis）
const vm = require('vm');
const coreSrc = fs.readFileSync(path.join(__dirname, '..', 'core', 'liuren-core.js'), 'utf-8');
vm.runInThisContext(coreSrc, { filename: 'liuren-core.js' });

// 读鸿蒙 rawfile 的 JSON（与 Web 端 _data 同源，结构一致）
const R = 'D:/nutstore/HarmonyOS/GuoXue_Research/LargeLiuRen-Design/APP/LiurenFocusDiviner/entry/src/main/resources/rawfile/rule';
const zhanShi = JSON.parse(fs.readFileSync(path.join(R, '占事体系.json'), 'utf-8'));
const xiangyi = JSON.parse(fs.readFileSync(path.join(R, '管辂象意.json'), 'utf-8'));
const leixiang = JSON.parse(fs.readFileSync(path.join(R, '类象库.json'), 'utf-8'));
const shensha = JSON.parse(fs.readFileSync(path.join(R, '神煞起法.json'), 'utf-8'));
const duxiang = JSON.parse(fs.readFileSync(path.join(R, '旺衰休囚死.json'), 'utf-8'));
const bifa = JSON.parse(fs.readFileSync(path.join(R, '毕法赋一百法.json'), 'utf-8'));

YongShenCore.zhanShi = zhanShi;

// 构造一个迷你 chart（足够 selectDuyu/候选/三传/词云用）
function mkChart(dg, dz, tp, dun, jiangMap, hourGan) {
  const chart = {
    r: { d: '2026-08-17', dg: dg, dz: dz, mg: '甲', mz: '申', ygc: '' },
    yj: { jiang: '', zhi: '午', term: '' },
    tp: tp,
    kegs: [],
    dun: dun,
    sanchuan: { method: '元首', chuans: [] },
    jiangMap: jiangMap,
    gui: '丑', shun: true, night: false,
    hourGan: hourGan,
    dx: {
      xunkong: ['戌', '亥'],
      monthZhi: '申',
      dayWangShuai: '旺',
      nodes: {
        '子': { wangShuai: '相', qiJi: '帝旺', kong: false }, '丑': { wangShuai: '囚', qiJi: '衰', kong: false },
        '寅': { wangShuai: '死', qiJi: '病', kong: false }, '卯': { wangShuai: '死', qiJi: '死', kong: false },
        '辰': { wangShuai: '囚', qiJi: '墓', kong: false }, '巳': { wangShuai: '休', qiJi: '绝', kong: false },
        '午': { wangShuai: '旺', qiJi: '胎', kong: false }, '未': { wangShuai: '休', qiJi: '养', kong: false },
        '申': { wangShuai: '旺', qiJi: '长生', kong: false }, '酉': { wangShuai: '相', qiJi: '沐浴', kong: false },
        '戌': { wangShuai: '休', qiJi: '冠带', kong: true }, '亥': { wangShuai: '囚', qiJi: '临官', kong: true }
      },
      relations: {
        '子': { chong: '午', he: '丑', hai: '未', xing: [] }, '丑': { chong: '未', he: '子', hai: '午', xing: ['戌'] },
        '寅': { chong: '申', he: '亥', hai: '巳', xing: ['巳'] }, '卯': { chong: '酉', he: '戌', hai: '辰', xing: ['子'] },
        '辰': { chong: '戌', he: '酉', hai: '卯', xing: [] }, '巳': { chong: '亥', he: '申', hai: '寅', xing: ['寅'] },
        '午': { chong: '子', he: '未', hai: '丑', xing: [] }, '未': { chong: '丑', he: '午', hai: '子', xing: ['丑'] },
        '申': { chong: '寅', he: '巳', hai: '亥', xing: [] }, '酉': { chong: '卯', he: '辰', hai: '戌', xing: ['酉'] },
        '戌': { chong: '辰', he: '卯', hai: '酉', xing: ['丑'] }, '亥': { chong: '巳', he: '寅', hai: '申', xing: [] }
      },
      yuejiang: { zhi: '午', gong: '午', kong: false, wangShuai: '旺', linGan: false, shengGan: true, keGan: false, faYong: false, zhu: true },
      guiren: { zhi: '丑', kong: false, wangShuai: '旺', linGan: false, shengGan: false, keGan: false, faYong: false, zhu: true },
      shensha: { byZhi: { '申': ['驿马', '天马'], '午': ['咸池'], '子': ['将星'] }, list: [] },
      bifa: []
    }
  };
  return chart;
}

// 测试用：丙午日（火），午时；天盘 申覆午（月将加时）
const chart = mkChart('丙', '午', {
  '子': '申', '丑': '酉', '寅': '戌', '卯': '亥', '辰': '子', '巳': '丑',
  '午': '寅', '未': '卯', '申': '辰', '酉': '巳', '戌': '午', '亥': '未'
}, {
  '子': '戊', '丑': '己', '寅': '庚', '卯': '辛', '辰': '壬', '巳': '癸',
  '午': '甲', '未': '乙', '申': '丙', '酉': '丁', '戌': '戊', '亥': '己'
}, {
  '子': '天后', '丑': '贵人', '寅': '青龙', '卯': '六合', '辰': '勾陈', '巳': '螣蛇',
  '午': '朱雀', '未': '太常', '申': '白虎', '酉': '太阴', '戌': '天空', '亥': '玄武'
}, '甲');

let fail = 0;
const check = (name, cond) => {
  if (!cond) { fail++; console.log('FAIL:', name); } else { console.log('OK  :', name); }
};

// 1. 占事解析
const affs = YongShenCore.affairs();
check('占事 12 大类', affs.length === 12);
const qc = YongShenCore.affairByName('求财');
check('求财配置', !!qc && qc.liuqin.includes('妻财') && qc.jiang.includes('青龙'));

// 2. 候选生成（求财：妻财=申酉(火日？丙火克金→妻财=申酉) + 申取象 + 青龙布列寅宫）
const cands = YongShenCore.candidates(chart, qc);
check('候选非空', cands.length > 0);
const candZhi = cands.map(x => x.zhi).join(',');
console.log('  求财候选:', candZhi);

// 3. 动态三传（以申为用神：申→天盘辰→辰→子）
const dt = YongShenCore.dongtai(chart, '申');
check('动态三传 3 传', dt.length === 3);
console.log('  三传:', dt.map(x => x.gz + '(' + x.lq + ')').join(' → '));
check('初传为申', dt[0].zhi === '申');

// 4. 节点卡词云
const words = YongShenCore.jieDianWords(chart, '申', leixiang);
check('词云非空', words.length > 0);
console.log('  词云:', words.map(w => w.k).join(' / '));

// 5. 选句（tick 轮换 + anchor 锚定）
const pick0 = YongShenCore.selectDuyu(chart, qc, cands, '申', xiangyi, 0, '');
check('选句非空', pick0.items.length > 0);
console.log('  收光:', pick0.shouGuang);
console.log('  首句:', pick0.items[0].ge.slice(0, 24) + (pick0.items[0].ev.length ? ' ✓' + pick0.items[0].ev.join('·') : ''));
const pick1 = YongShenCore.selectDuyu(chart, qc, cands, '申', xiangyi, 1, '白虎');
check('换一条不同', pick1.shouGuang !== pick0.shouGuang);
check('锚定象入收光', pick1.shouGuang.indexOf('落象') >= 0);

// 6. duyuOf
check('组合读象', YongShenCore.duyuOf('求财').length === 3);

// 7. 十二占事全部跑一遍不崩
let allOk = true;
affs.forEach(a => {
  try {
    const cs = YongShenCore.candidates(chart, a);
    if (cs.length > 0) {
      const p = YongShenCore.selectDuyu(chart, a, cs, cs[0].zhi, xiangyi, 0, '');
      if (!p.items.length) allOk = false;
    }
  } catch (e) { allOk = false; console.log('  THROW:', a.name, e.message); }
});
check('12 占事全跑通', allOk);

console.log(fail === 0 ? '\nALL PASS' : '\nFAILED: ' + fail);
process.exit(fail === 0 ? 0 : 1);

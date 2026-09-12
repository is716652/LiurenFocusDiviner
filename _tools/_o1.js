/* ============================================================================
 * _o1.js —— 给 .ets 模块做与 .ts 相同的「归属限定符」改写（A6 三端同构要求）
 *   常量/工具 → LrBase / LrDungan / LrJiang / LrSanchuan / LrTiandipan / LrShensha /
 *               LrXunkong / LrDx；跨模块业务方法保持 LiurenCore.*（门面转发）。
 * 用法：node _tools/_etsgen.js && node _tools/_o1.js
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const MODEL = path.join(__dirname, '..', 'APP', 'LiurenFocusDiviner', 'entry', 'src', 'main', 'ets', 'model');
const OWNER = {
  'GAN': 'LrBase', 'ZHI': 'LrBase', 'JI_GONG': 'LrBase', 'WX': 'LrBase', 'WXG': 'LrBase',
  'KE': 'LrBase', 'GUIREN': 'LrBase', 'YANG_ZHI': 'LrBase', 'G_YANG': 'LrBase',
  'SHENG': 'LrBase', 'gongOf': 'LrBase', 'wxOf': 'LrBase', 'ke': 'LrBase',
  'wutun': 'LrDungan', 'hourGan': 'LrDungan', 'xunDun': 'LrDungan', 'dunMap': 'LrDungan',
  'JIANG_ORDER': 'LrJiang', 'JIANG_DAY_HOURS': 'LrJiang', 'JIANG_SHUN_GONGS': 'LrJiang',
  'BENSHEN': 'LrJiang', 'JIANG_JX': 'LrJiang', 'JIANG_WARN': 'LrJiang', 'buildJiang': 'LrJiang',
  'MAOXING_ANCHOR': 'LrSanchuan', 'BA_ZHUAN_STEP': 'LrSanchuan', 'JINGLAN_SHE': 'LrSanchuan',
  'ZI_XING': 'LrSanchuan', 'MA_ZHI': 'LrSanchuan', 'XING_MAP': 'LrSanchuan', 'HE_GAN': 'LrSanchuan',
  'QIAN_SANHE': 'LrSanchuan', 'validGanZhi': 'LrSanchuan',
  'yuejiangForMonth': 'LrTiandipan', 'validYuejiangForMonth': 'LrTiandipan', 'findDayRec': 'LrTiandipan',
  'XUN_KONG': 'LrShensha', 'XUN_OF': 'LrXunkong',
  'EMPTY_NODE': 'LrDx', 'XN_SCORE_DEFAULT': 'LrDx', 'YUE_LING': 'LrDx', 'QIJI_GONG': 'LrDx',
  'ZHI_GONG': 'LrDx', 'wangT': 'LrDx', 'yearZhiOf': 'LrDx', 'withDx': 'LrDx', 'findZhiOfGong': 'LrDx'
};
const CLS_FILE = {
  LrBase: 'pan/liuren-const', LrJigong: 'pan/jigong', LrXunkong: 'pan/xunkong',
  LrJiang: 'pan/jiang', LrDungan: 'pan/dungan', LrSanchuan: 'pan/sanchuan',
  LrSike: 'pan/sike', LrTiandipan: 'pan/tiandipan', LrShensha: 'pan/shensha',
  LrDx: 'pan/dx', LrBifa: 'bifa', LrZhonghuang: 'zhonghuang'
};
const BOUND = '(?![\\w$.:])';

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out); else if (/\.ets$/.test(e.name)) out.push(p);
  }
  return out;
}
let changed = 0;
for (const f of walk(MODEL)) {
  const base = path.basename(f);
  if (/YongShenCore|DataLoader|CaseStore|NavUtil|LiurenCore/.test(base)) continue;
  let t = fs.readFileSync(f, 'utf-8');
  const before = t;
  const self = new Set();
  for (const m of t.matchAll(/export class ([A-Za-z_][\w]*)/g)) self.add(m[1]);
  const needed = new Set();
  for (const name of Object.keys(OWNER).sort((x, y) => y.length - x.length)) {
    const owner = OWNER[name];
    const from = 'LiurenCore.' + name;
    let idx = t.indexOf(from), hit = false;
    while (idx >= 0) {
      const after = t.charAt(idx + from.length);
      if (after === '' || !/[A-Za-z0-9_$]/.test(after)) {
        t = t.slice(0, idx) + owner + '.' + name + t.slice(idx + from.length);
        hit = true;
        idx = t.indexOf(from, idx + owner.length + 1 + name.length);
      } else idx = t.indexOf(from, idx + 1);
    }
    if (hit) needed.add(owner);
  }
  if (t === before) continue;
  const selfPath = path.relative(MODEL, f).replace(/\\/g, '/');
  const inPan = path.basename(path.dirname(f)) === 'pan';
  const add = [];
  for (const cls of needed) {
    if (self.has(cls)) continue;
    if (new RegExp('import \\{[^}]*\\b' + cls + '\\b[^}]*\\}').test(t)) continue;
    const target = CLS_FILE[cls];
    const rel = target.indexOf('pan/') === 0
      ? (inPan ? './' + target.slice(4) : './' + target)
      : (inPan ? '../' + target : './' + target);
    add.push("import { " + cls + " } from '" + rel + "';");
  }
  if (add.length) {
    const lines = t.split('\n');
    let last = -1;
    lines.forEach((l, i) => { if (/^import /.test(l) || /^\} from '/.test(l)) last = i; });
    lines.splice(last + 1, 0, ...add.sort());
    t = lines.join('\n');
  }
  fs.writeFileSync(f, t, 'utf-8');
  changed++;
  console.log('  ✓ ' + selfPath + '（补 import ' + add.length + '）');
}
console.log('归属改写完成：' + changed + ' 个文件');

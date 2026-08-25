// 生成中黄五变经天干速查表（markdown 表格）
// 表1：日干×占时支 → 时干
// 表2：时干 → 中黄盘十二宫干
'use strict';

const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

function wushuStart(gan) {
  const m = { '甲': '甲', '己': '甲', '乙': '丙', '庚': '丙', '丙': '戊', '辛': '戊', '丁': '庚', '壬': '庚', '戊': '壬', '癸': '壬' };
  return m[gan];
}

function dunAll(gan) {
  const s = wushuStart(gan);
  const startIdx = GAN.indexOf(s);
  const map = {};
  for (let i = 0; i < 12; i++) {
    map[ZHI[i]] = GAN[(startIdx + i) % 10];
  }
  return map;
}

function shiGan(dayGan, shiZhi) {
  return dunAll(dayGan)[shiZhi];
}

// ===== 表1：时干速查 =====
console.log('## 表1：时干速查表（日干 × 占时支 → 时干）');
console.log('');
console.log('| 日干\\占时 | ' + ZHI.join(' | ') + ' |');
console.log('|' + Array(14).fill(':---:').join('|') + '|');
for (const dg of GAN) {
  const row = ZHI.map(z => shiGan(dg, z)).join(' | ');
  console.log('| **' + dg + '** | ' + row + ' |');
}

// ===== 表2：中黄盘速查 =====
console.log('');
console.log('## 表2：中黄盘速查表（时干 → 十二宫干，即"用"盘）');
console.log('');
console.log('| 时干 | ' + ZHI.join(' | ') + ' |');
console.log('|' + Array(14).fill(':---:').join('|') + '|');
for (const tg of GAN) {
  const d = dunAll(tg);
  const row = ZHI.map(z => d[z]).join(' | ');
  console.log('| **' + tg + '** | ' + row + ' |');
}

// ===== 表3：变干速查 =====
console.log('');
console.log('## 表3：变干速查表（日干 × 占时支 → 变干 = 时干遁盘中占时支的干）');
console.log('');
console.log('| 日干\\占时 | ' + ZHI.join(' | ') + ' |');
console.log('|' + Array(14).fill(':---:').join('|') + '|');
for (const dg of GAN) {
  const row = ZHI.map(z => {
    const sg = shiGan(dg, z);
    return dunAll(sg)[z];
  }).join(' | ');
  console.log('| **' + dg + '** | ' + row + ' |');
}

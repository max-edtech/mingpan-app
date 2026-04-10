/**
 * 日柱驗證腳本 — 多組已知命例交叉驗證
 * 執行：node validate_calendar.mjs
 *
 * 基準確認：
 *   BASE_IDX = 54 (2000-01-01 = 戊午日)
 *   推導：1900-01-01=甲戌(10), 100年=36524天, (10+36524)%60=54
 *   間距法：1993-04-23 & 1900-01-01 相差34080天, 34080%60=0 → 同一干支(甲戌)✓
 */

const TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const DI_ZHI   = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

const GAN = (n) => TIAN_GAN[((n % 10) + 10) % 10];
const ZHI = (n) => DI_ZHI[((n % 12) + 12) % 12];

function calcDayPillar(year, month, day) {
  const d    = new Date(`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}T00:00:00`);
  const base = new Date('2000-01-01T00:00:00');
  const diff = Math.round((d - base) / 86400000);
  const idx  = ((54 + diff) % 60 + 60) % 60;
  return { gan: GAN(idx), zhi: ZHI(idx), idx };
}

// 子時=23:00–01:00，所以 hour23→子(0)，hour1→丑(1) 開始
const HOUR_ZHI_IDX = [0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,0];
const HOUR_GAN_BASE = { 甲:0, 己:0, 乙:2, 庚:2, 丙:4, 辛:4, 丁:6, 壬:6, 戊:8, 癸:8 };

function calcHourPillar(dayGan, hour) {
  const zhiIdx = HOUR_ZHI_IDX[hour];
  const ganBase = HOUR_GAN_BASE[dayGan];
  return { gan: GAN(ganBase + zhiIdx), zhi: ZHI(zhiIdx) };
}

let pass = 0, fail = 0;
function check(label, got, expected) {
  const ok = got === expected;
  if (ok) pass++; else fail++;
  console.log(`${ok ? '✓' : '✗'} ${label.padEnd(40)} 期望:${expected}  得:${got}`);
}

// ── 1. 日柱核心驗證（有外部來源的日期）────────────────────────
console.log('═══ 日柱驗證 ═══\n');

// 用戶已知正確
const d1 = calcDayPillar(1993, 4, 23);
check('1993-04-23 [用戶確認]', d1.gan + d1.zhi, '甲戌');

// 古典萬年曆公認基準
const d2 = calcDayPillar(1900, 1, 1);
check('1900-01-01 [古典基準點]', d2.gan + d2.zhi, '甲戌');

// 從基準推導（戊午=54，向後+6天=60=0=甲子）
const d3 = calcDayPillar(2000, 1, 7);
check('2000-01-07 [戊午+6天=甲子]', d3.gan + d3.zhi, '甲子');

const d4 = calcDayPillar(2000, 1, 1);
check('2000-01-01 [推導基準=戊午]', d4.gan + d4.zhi, '戊午');

// 1984-01-01（常被誤稱甲子日；實為甲午）
const d5 = calcDayPillar(1984, 1, 1);
check('1984-01-01 [甲午，非甲子]', d5.gan + d5.zhi, '甲午');

// ── 2. 間距法交叉驗算 ────────────────────────────────────────
console.log('\n═══ 間距驗算（mod 60 = 0 表示同一干支）═══\n');

function diffMod60(y1,m1,d1,y2,m2,d2) {
  const a = new Date(`${y1}-${String(m1).padStart(2,'0')}-${String(d1).padStart(2,'0')}T00:00:00`);
  const b = new Date(`${y2}-${String(m2).padStart(2,'0')}-${String(d2).padStart(2,'0')}T00:00:00`);
  return Math.abs(Math.round((a - b) / 86400000)) % 60;
}

// 1993-04-23 和 1900-01-01 都是甲戌，差天數必須被60整除
const gap1 = diffMod60(1993,4,23, 1900,1,1);
check('1993-04-23 vs 1900-01-01 diff%60', String(gap1), '0');

// 2000-01-01(戊午=54) 和 2000-01-07(甲子=0)，差6天，(54+6)%60=0 ✓
const gap2 = diffMod60(2000,1,1, 2000,1,7);
check('2000-01-01 vs 2000-01-07 diff%60', String(gap2), '6');

// 再往後60天仍是甲子
const d6 = calcDayPillar(2000, 3, 7);
check('2000-03-07 [甲子+60天仍甲子]', d6.gan + d6.zhi, '甲子');

// ── 3. 連續60天周期完整性 ──────────────────────────────────────
console.log('\n═══ 連續日期60周期（從2000-01-01連排首10天）═══\n');

const EXPECT_SEQ = ['戊午','己未','庚申','辛酉','壬戌','癸亥','甲子','乙丑','丙寅','丁卯'];
for (let i = 0; i < 10; i++) {
  const date = new Date('2000-01-01T00:00:00');
  date.setDate(date.getDate() + i);
  const y = date.getFullYear(), mo = date.getMonth()+1, d = date.getDate();
  const r = calcDayPillar(y, mo, d);
  check(`2000-01-${String(i+1).padStart(2,'0')}`, r.gan + r.zhi, EXPECT_SEQ[i]);
}

// ── 4. 時柱驗證（甲乙丙丁戊己庚辛壬癸口訣）────────────────────
console.log('\n═══ 時柱驗證 ═══\n');

// 甲己日子時=甲子；口訣：甲己之日甲作首
// 甲日: 甲子乙丑丙寅丁卯戊辰己巳庚午辛未壬申癸酉甲戌乙亥
const hourTests = [
  // [dayGan, hour, expected,  note]
  ['甲',  0, '甲子', '甲日00時=子時'],
  ['甲', 23, '甲子', '甲日23時=子時（跨午夜）'],
  ['甲',  1, '乙丑', '甲日01時=丑時'],
  ['甲',  3, '丙寅', '甲日03時=寅時'],
  ['甲',  5, '丁卯', '甲日05時=卯時'],
  ['甲',  7, '戊辰', '甲日07時=辰時'],
  ['甲',  9, '己巳', '甲日09時=巳時'],
  ['甲', 11, '庚午', '甲日11時=午時'],
  ['甲', 13, '辛未', '甲日13時=未時'],
  ['甲', 15, '壬申', '甲日15時=申時'],
  ['甲', 17, '癸酉', '甲日17時=酉時'],
  ['甲', 19, '甲戌', '甲日19時=戌時'],
  ['甲', 21, '乙亥', '甲日21時=亥時'],

  // 庚乙日: 丙子丁丑戊寅己卯庚辰辛巳壬午癸未...
  ['庚',  0, '丙子', '庚日00時=丙子'],
  ['庚', 23, '丙子', '庚日23時=子時'],
  ['庚',  7, '庚辰', '庚日07時=辰時'],

  // 己日同甲
  ['己', 23, '甲子', '己日23時=甲子'],
  ['己',  1, '乙丑', '己日01時=乙丑'],
];

for (const [dg, hr, exp, note] of hourTests) {
  const r = calcHourPillar(dg, hr);
  check(`${dg}日${String(hr).padStart(2,'0')}時 ${note}`, r.gan + r.zhi, exp);
}

// ── 最終結果 ────────────────────────────────────────────────────
console.log(`\n─── 結果：${pass} 通過 / ${fail} 失敗 ───`);
if (fail > 0) {
  console.log('⚠ 有案例失敗，請重新檢查');
  process.exit(1);
} else {
  console.log('✓ 全部通過，日柱與時柱算法正確');
}

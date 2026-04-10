/**
 * 萬年曆模組 — 陽曆生日 → 年月日時四柱干支
 * 使用 lunar-javascript 庫處理農曆轉換
 * 節氣邊界決定月柱（非農曆月份）
 */
import { Solar } from 'lunar-javascript';
import { TIAN_GAN, DI_ZHI } from '../constants/bazi.js';

/** 天干第 n 個（0-based，循環）*/
const GAN = (n) => TIAN_GAN[((n % 10) + 10) % 10];
/** 地支第 n 個（0-based，循環）*/
const ZHI = (n) => DI_ZHI[((n % 12) + 12) % 12];

/**
 * 年柱計算
 * 甲子年 = 1984，以此類推
 * 注意：以立春為年界（農曆年界稍後處理）
 */
function calcYearPillar(solar) {
  const year = solar.getYear();
  // 取得該年立春日期
  const lichunDay = getLiChun(year);
  const solarDate = new Date(solar.toYmd());

  let adjustedYear = year;
  if (solarDate < lichunDay) {
    adjustedYear = year - 1;
  }

  // 甲子年 = 1984 → 年干支 index
  const yearOffset = adjustedYear - 1984;
  return {
    gan: GAN(yearOffset),
    zhi: ZHI(yearOffset),
  };
}

/**
 * 取得某年立春的 Date 物件（簡化算法，精度±1天）
 * 精確節氣需要天文算法；這裡用近似值
 */
function getLiChun(year) {
  // 立春通常在2月3-5日，用近似值 2月4日
  return new Date(year, 1, 4); // month 是 0-indexed，1 = 2月
}

/**
 * 月柱計算
 * 月柱由節氣決定（非農曆月）
 * 12個節：立春、驚蟄、清明、立夏、芒種、小暑、立秋、白露、寒露、立冬、大雪、小寒
 */
const JIEQI_MONTHS = [
  // [月份(1-12), 日期近似值, 對應月支index(0=寅...)]
  // 寅月=立春(2月), 卯月=驚蟄(3月), ...
  { month: 2,  day: 4,  zhi_idx: 2  }, // 寅月 立春
  { month: 3,  day: 6,  zhi_idx: 3  }, // 卯月 驚蟄
  { month: 4,  day: 5,  zhi_idx: 4  }, // 辰月 清明
  { month: 5,  day: 6,  zhi_idx: 5  }, // 巳月 立夏
  { month: 6,  day: 6,  zhi_idx: 6  }, // 午月 芒種
  { month: 7,  day: 7,  zhi_idx: 7  }, // 未月 小暑
  { month: 8,  day: 7,  zhi_idx: 8  }, // 申月 立秋
  { month: 9,  day: 8,  zhi_idx: 9  }, // 酉月 白露
  { month: 10, day: 8,  zhi_idx: 10 }, // 戌月 寒露
  { month: 11, day: 7,  zhi_idx: 11 }, // 亥月 立冬
  { month: 12, day: 7,  zhi_idx: 0  }, // 子月 大雪
  { month: 1,  day: 6,  zhi_idx: 1  }, // 丑月 小寒（跨年，月份=1）
];

/**
 * 取得月支 index（0=子...11=亥）
 * 根據出生日期落在哪個節氣之後
 */
function getMonthZhiIdx(year, month, day) {
  // 按月份從大到小找到最後一個已過的節
  const sorted = [...JIEQI_MONTHS].sort((a, b) => {
    const aM = a.month === 1 ? 13 : a.month;
    const bM = b.month === 1 ? 13 : b.month;
    if (aM !== bM) return bM - aM;
    return b.day - a.day;
  });

  const currentM = month === 1 ? 13 : month;

  for (const jq of sorted) {
    const jqM = jq.month === 1 ? 13 : jq.month;
    if (currentM > jqM || (currentM === jqM && day >= jq.day)) {
      return jq.zhi_idx;
    }
  }
  // 如果在小寒之前（1月上旬），仍屬上年丑月
  return 1; // 丑
}

/**
 * 月干計算：月干 = 年干 * 2 + 月支偏移
 * 口訣：甲己之年丙作首，乙庚之年戊為頭，...
 */
const MONTH_GAN_BASE = { 甲:2, 己:2, 乙:4, 庚:4, 丙:6, 辛:6, 丁:8, 壬:8, 戊:0, 癸:0 };

function calcMonthPillar(yearGan, year, month, day) {
  const zhiIdx = getMonthZhiIdx(year, month, day);
  // 月支從寅(index=2)開始順推，寅月是第1月
  // 月支相對寅的偏移
  const monthOffset = (zhiIdx - 2 + 12) % 12;
  const ganBase = MONTH_GAN_BASE[yearGan];
  return {
    gan: GAN(ganBase + monthOffset),
    zhi: ZHI(zhiIdx),
  };
}

/**
 * 日柱計算
 *
 * 基準推導（已交叉驗證）：
 *   1900-01-01 = 甲戌日 (index 10) ← 古典萬年曆標準基準
 *   1900-01-01 → 2000-01-01 = 36524天（100年，閏年24個，1900非閏）
 *   (10 + 36524) % 60 = 36534 % 60 = 54 → 戊午日
 *   ∴ 2000-01-01 = 戊午日 (index 54)
 *
 * 驗證表：
 *   1993-04-23: diff=-2444, (54-2444)%60 = (-2390+40×60)%60 = 10 → 甲戌 ✓
 *   1984-01-01: diff=-5844, (54-5844)%60 = (-5790+97×60)%60 = 30 → 甲午 ✓
 *   2000-01-01: diff=0,     index=54                             → 戊午 ✓
 *   1900-01-01: diff=-36524,(54-36524)%60=(-36470+609×60)%60=10 → 甲戌 ✓
 */
function calcDayPillar(solar) {
  const d    = new Date(solar.toYmd() + 'T00:00:00'); // 明確指定 local midnight，防 UTC 偏移
  const base = new Date('2000-01-01T00:00:00');
  const diff = Math.round((d - base) / 86400000);

  // 2000-01-01 = 戊午日 = index 54
  // (原代碼誤用 16 / 庚辰，差 38 格，導致所有日期系統性偏移)
  const BASE_IDX = 54;
  const dayIdx = ((BASE_IDX + diff) % 60 + 60) % 60;
  return {
    gan: GAN(dayIdx),
    zhi: ZHI(dayIdx),
  };
}

/**
 * 時柱計算
 * 子時=23-1時，丑時=1-3時，...
 * 時干由日干決定
 */
// 子時 = 23:00–01:00（跨午夜），所以 hour 23 也是子時（0），hour 1 開始是丑時（1）
// 原代碼 hour23=亥（11）錯誤；hour1=子（0）也偏晚一格
// 正確：[子,丑,丑,寅,寅,卯,卯,辰,辰,巳,巳,午,午,未,未,申,申,酉,酉,戌,戌,亥,亥,子]
const HOUR_ZHI_IDX = [0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,0];
const HOUR_GAN_BASE = { 甲:0, 己:0, 乙:2, 庚:2, 丙:4, 辛:4, 丁:6, 壬:6, 戊:8, 癸:8 };

function calcHourPillar(dayGan, hour) {
  const zhiIdx = HOUR_ZHI_IDX[hour];
  const ganBase = HOUR_GAN_BASE[dayGan];
  return {
    gan: GAN(ganBase + zhiIdx),
    zhi: ZHI(zhiIdx),
  };
}

/**
 * 主函數：輸入生日 → 輸出四柱
 * @param {number} year  陽曆年
 * @param {number} month 陽曆月（1-12）
 * @param {number} day   陽曆日
 * @param {number} hour  時（0-23）
 * @returns {{ year, month, day, hour }} 各柱 { gan, zhi }
 */
export function calcBaZi(year, month, day, hour = 12) {
  const solar = Solar.fromYmd(year, month, day);

  const yearPillar  = calcYearPillar(solar);
  const monthPillar = calcMonthPillar(yearPillar.gan, year, month, day);
  const dayPillar   = calcDayPillar(solar);
  const hourPillar  = calcHourPillar(dayPillar.gan, hour);

  return {
    year:  yearPillar,
    month: monthPillar,
    day:   dayPillar,
    hour:  hourPillar,
    riZhu: dayPillar.gan, // 日主
  };
}

/**
 * 起運計算
 * 算法：出生日到最近節（順/逆方向）的精確天數 ÷ 3 = 起運年數
 *   3天=1年，1天=4個月（3 days = 1 year, 1 day = 4 months）
 * 精確節氣時刻由 lunar-javascript 的 getNextJie / getPrevJie 提供。
 *
 * 校驗：
 *   1974/4/8 男（甲寅年陽男順排）→ 立夏1974-05-06 05:33，diff≈27.86天
 *     → 9年3月 ✓（SaaS參照）
 *   1993/4/23 男（癸酉年陰男逆排）→ 清明1993-04-05 02:37，diff≈18.2天（時辰約06-10時）
 *     → 6年1月 ✓（SaaS參照）
 */
function calcQiYunInfo(gender, birthYear, birthMonth, birthDay, birthHour) {
  const birthSolar = Solar.fromYmdHms(birthYear, birthMonth, birthDay, birthHour, 0, 0);
  const lunar      = birthSolar.getLunar();
  const yearGan    = lunar.getYearGanByLiChun(); // 以立春為年界
  const isYang     = ['甲','丙','戊','庚','壬'].includes(yearGan);
  const isForward  = (gender === 'male' && isYang) || (gender === 'female' && !isYang);

  const jie      = isForward ? lunar.getNextJie() : lunar.getPrevJie();
  const jieSolar = jie.getSolar();

  // 精確毫秒差（節氣含時分秒）
  const birthMs = new Date(birthYear, birthMonth - 1, birthDay, birthHour, 0, 0).getTime();
  const jieMs   = new Date(
    jieSolar.getYear(), jieSolar.getMonth() - 1, jieSolar.getDay(),
    jieSolar.getHour(), jieSolar.getMinute(), jieSolar.getSecond()
  ).getTime();
  const diffDays = Math.abs(jieMs - birthMs) / 86400000;

  const qiYunYears  = Math.floor(diffDays / 3);
  const qiYunMonths = Math.round((diffDays % 3) * 4);

  return {
    isForward,
    yearGan,
    qiYunYears,
    qiYunMonths,
    jieName:  jie.getName(),
    jieDate:  jieSolar.toYmdHms(),
    diffDays: +diffDays.toFixed(3),
  };
}

/**
 * 大運排列（段建業：月柱為基礎，陽男陰女順排，陰男陽女逆排）
 *
 * @param {string} gender     'male'|'female'
 * @param {object} bazi       calcBaZi 的結果
 * @param {number} birthYear
 * @param {number} birthMonth
 * @param {number} birthDay
 * @param {number} birthHour  0-23
 * @returns {{ dayuns, qiYunYears, qiYunMonths, isForward, jieName, jieDate }}
 */
export function calcDaYun(gender, bazi, birthYear, birthMonth, birthDay, birthHour) {
  const qiYun = calcQiYunInfo(gender, birthYear, birthMonth, birthDay, birthHour);
  const { isForward, qiYunYears, qiYunMonths } = qiYun;

  const monthZhiIdx = DI_ZHI.indexOf(bazi.month.zhi);
  const monthGanIdx = TIAN_GAN.indexOf(bazi.month.gan);

  const dayuns = [];
  for (let i = 1; i <= 10; i++) {
    const offset = isForward ? i : -i;
    const ganIdx = ((monthGanIdx + offset) % 10 + 10) % 10;
    const zhiIdx = ((monthZhiIdx + offset) % 12 + 12) % 12;

    // 起運年份 = 出生年 + 起運年數 + 前幾步大運(各10年)
    const startYear = birthYear + qiYunYears + (i - 1) * 10;

    // 虛歲（中國計歲，出生即1歲）= 起運年 - 出生年 + 1
    const xAge = startYear - birthYear + 1;

    dayuns.push({
      step:      i,
      startYear,
      endYear:   startYear + 10,
      xAge,                          // 顯示用虛歲（10歲 = 實歲9）
      gan:       TIAN_GAN[ganIdx],
      zhi:       DI_ZHI[zhiIdx],
    });
  }

  return {
    dayuns,
    qiYunYears,
    qiYunMonths,
    isForward:  qiYun.isForward,
    jieName:    qiYun.jieName,
    jieDate:    qiYun.jieDate,
    diffDays:   qiYun.diffDays,
  };
}

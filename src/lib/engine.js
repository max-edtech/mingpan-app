/**
 * 盲派八字引擎核心
 * 十神推算、交互掃描、氣勢判定
 */
import {
  GAN_WUXING, ZHI_WUXING, GAN_WUHE, ZHI_LIUHE, ZHI_LIUCHONG,
  ZHI_CHUAN, ZHI_SANXING, ZHI_SANHE, ZHI_PO,
  CANG_GAN, SHISHEN, SHISHEN_CAT, LU_TABLE,
  GAN_YINYANG, WUXING_SHENG, WUXING_KE, TIAN_GAN, DI_ZHI,
} from '../constants/bazi.js';

// ── 十神推算 ────────────────────────────────────────────────
export function getShiShen(riZhu, target) {
  return SHISHEN[riZhu]?.[target] ?? '未知';
}

export function getShiShenCat(shishen) {
  return SHISHEN_CAT[shishen] ?? '未知';
}

// ── 地支藏干十神 ─────────────────────────────────────────────
export function getCangGanShiShen(riZhu, zhi) {
  return (CANG_GAN[zhi] ?? []).map(g => ({
    gan: g, shishen: getShiShen(riZhu, g), wuxing: GAN_WUXING[g],
  }));
}

// ── 八字展開（含十神）────────────────────────────────────────
export function expandBaZi(bazi) {
  const riZhu = bazi.riZhu;
  const pillars = [
    { pos:'年', ...bazi.year },
    { pos:'月', ...bazi.month },
    { pos:'日', ...bazi.day },
    { pos:'時', ...bazi.hour },
  ];

  return pillars.map(p => ({
    ...p,
    ganWuxing:  GAN_WUXING[p.gan],
    zhiWuxing:  ZHI_WUXING[p.zhi],
    ganShishen: p.pos === '日' ? '日主' : getShiShen(riZhu, p.gan),
    zhiShishen: getShiShen(riZhu, (CANG_GAN[p.zhi] ?? [])[0] ?? p.zhi),
    cangGan:    getCangGanShiShen(riZhu, p.zhi),
    isRiZhu:    p.pos === '日',
  }));
}

// ── 天干合絆掃描 ─────────────────────────────────────────────
export function scanGanHe(pillars) {
  const results = [];
  const gans = pillars.map(p => p.gan);
  for (let i = 0; i < gans.length; i++) {
    for (let j = i + 1; j < gans.length; j++) {
      const he = GAN_WUHE[gans[i]];
      if (he && he.partner === gans[j]) {
        results.push({
          type: '天干五合',
          a: { pos: pillars[i].pos, char: gans[i] },
          b: { pos: pillars[j].pos, char: gans[j] },
          hua: he.hua,
          isDayZhu: pillars[i].pos === '日' || pillars[j].pos === '日',
        });
      }
    }
  }
  return results;
}

// ── 地支交互掃描（六合/六沖/穿/刑）────────────────────────────
export function scanZhiInteractions(pillars) {
  const results = [];
  const zhis = pillars.map(p => p.zhi);
  const n = zhis.length;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = zhis[i], b = zhis[j];
      const posA = pillars[i].pos, posB = pillars[j].pos;

      // 六合
      if (ZHI_LIUHE[a]?.partner === b) {
        results.push({ type:'六合', a:{pos:posA,char:a}, b:{pos:posB,char:b}, hua:ZHI_LIUHE[a].hua });
      }
      // 六沖
      if (ZHI_LIUCHONG[a] === b) {
        results.push({ type:'六沖', a:{pos:posA,char:a}, b:{pos:posB,char:b} });
      }
      // 穿害
      if (ZHI_CHUAN[a] === b) {
        results.push({ type:'穿害', a:{pos:posA,char:a}, b:{pos:posB,char:b} });
      }
      // 相破
      if (ZHI_PO[a] === b) {
        results.push({ type:'相破', a:{pos:posA,char:a}, b:{pos:posB,char:b} });
      }
    }
  }

  // 三合局（完整/半合）
  ZHI_SANHE.forEach(({ members, hua }) => {
    const present = members.filter(m => zhis.includes(m));
    if (present.length >= 2) {
      const involvedPillars = present.map(m => pillars.find(p => p.zhi === m));
      results.push({
        type: present.length === 3 ? '三合局' : '半合',
        members: present,
        positions: involvedPillars.map(p => p.pos),
        hua,
      });
    }
  });

  // 三刑
  ZHI_SANXING.forEach(({ members, type: xingType }) => {
    const present = members.filter(m => zhis.includes(m));
    if (present.length === members.length) {
      results.push({ type:'三刑', xingType, members: present });
    }
  });

  // 暗合（藏干五合）
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const cangA = CANG_GAN[zhis[i]] ?? [];
      const cangB = CANG_GAN[zhis[j]] ?? [];
      for (const ga of cangA) {
        for (const gb of cangB) {
          if (GAN_WUHE[ga]?.partner === gb) {
            results.push({
              type: '暗合',
              a: { pos: pillars[i].pos, char: zhis[i], via: ga },
              b: { pos: pillars[j].pos, char: zhis[j], via: gb },
              hua: GAN_WUHE[ga].hua,
            });
          }
        }
      }
    }
  }

  return results;
}

// ── 氣勢判定 ─────────────────────────────────────────────────

/**
 * 加權力量（用於顯示五行柱狀圖）
 */
export function calcWuXingForce(pillars) {
  const force = { 木:0, 火:0, 土:0, 金:0, 水:0 };
  pillars.forEach(p => {
    force[GAN_WUXING[p.gan]] += (p.pos === '日' ? 0.5 : 1);
    const cg = CANG_GAN[p.zhi] ?? [];
    if (cg[0]) force[GAN_WUXING[cg[0]]] += 0.8;
    if (cg[1]) force[GAN_WUXING[cg[1]]] += 0.4;
    if (cg[2]) force[GAN_WUXING[cg[2]]] += 0.2;
  });
  return force;
}

/**
 * 字數計算（用於成氣/成勢/從格門檻判定）
 * 段建業藍圖 1.2：分母=8（4天干+4地支），門檻為字數比例
 *   成勢 ≥ 5/8，成氣 ≥ 3/8，從格 ≥ 6/8
 * 地支以ZHI_WUXING本氣五行計（不用藏干加權）
 */
export function calcWuXingCount(pillars) {
  const count = { 木:0, 火:0, 土:0, 金:0, 水:0 };
  pillars.forEach(p => {
    count[GAN_WUXING[p.gan]] += 1;
    count[ZHI_WUXING[p.zhi]] += 1;
  });
  return count; // total 固定 = 8
}

/**
 * 氣勢判定（成氣/成勢/從格/均衡）
 * 門檻以字數計：成氣≥3/8，成勢≥5/8（top2聯合），從格≥6/8（單行）
 */
export function judgeQiShi(pillars, riZhu) {
  const count  = calcWuXingCount(pillars);   // for 判定
  const force  = calcWuXingForce(pillars);   // for 顯示

  const TOTAL  = 8;
  const cRanked = Object.entries(count).sort((a, b) => b[1] - a[1]);
  const top1c  = cRanked[0];
  const top2c  = cRanked[1];
  const combined = (top1c[1] + top2c[1]) / TOTAL;

  // 加權排序（用於UI柱狀圖）
  const forceTotal = Object.values(force).reduce((s, v) => s + v, 0);
  const ranked = Object.entries(force)
    .sort((a, b) => b[1] - a[1])
    .map(([wx, f]) => ({ wx, f, ratio: f / forceTotal }));

  const riZhuWx = GAN_WUXING[riZhu];

  let verdict, host;
  if (top1c[1] / TOTAL >= 0.75) {
    verdict = '從格';
    host    = top1c[0];
  } else if (combined >= 0.625) {         // 藍圖：≥ 5/8（用字數，含等號）
    verdict = '成勢';
    host    = top1c[0] + '+' + top2c[0];
  } else if (top1c[1] / TOTAL >= 0.375) { // ≥ 3/8
    verdict = '成氣';
    host    = top1c[0];
  } else {
    verdict = '均衡';
    host    = riZhuWx;
  }

  const riZhuIsHost = host.includes(riZhuWx);

  return {
    verdict,
    host,
    riZhuWx,
    guest:       riZhuIsHost ? null : riZhuWx,
    ranked,
    force,
    count,
    riZhuIsHost,
    lu:          LU_TABLE[riZhu],
  };
}

// ── 祿位判定 ─────────────────────────────────────────────────
export function checkLu(riZhu, pillars) {
  const lu = LU_TABLE[riZhu];
  const zhis = pillars.map(p => p.zhi);
  return {
    lu,
    inLocal: zhis.includes(lu),
    positions: pillars.filter(p => p.zhi === lu).map(p => p.pos),
  };
}

// ── 帶象生成 ─────────────────────────────────────────────────
/**
 * 段建業帶象五種：蓋頭/截腳/干生支/支生干/比和
 */
export function genDaiXiang(pillars) {
  return pillars.map(p => {
    const ganWx = GAN_WUXING[p.gan];
    const zhiWx = ZHI_WUXING[p.zhi];
    let type, desc;

    if (WUXING_KE[ganWx] === zhiWx) {
      type = '蓋頭'; desc = `${ganWx}克${zhiWx}，天干壓制地支`;
    } else if (WUXING_KE[zhiWx] === ganWx) {
      type = '截腳'; desc = `${zhiWx}克${ganWx}，地支反制天干`;
    } else if (WUXING_SHENG[ganWx] === zhiWx) {
      type = '干生支'; desc = `${ganWx}生${zhiWx}，天干滋生地支`;
    } else if (WUXING_SHENG[zhiWx] === ganWx) {
      type = '支生干'; desc = `${zhiWx}生${ganWx}，地支滋養天干`;
    } else {
      type = '比和'; desc = `${ganWx}與${zhiWx}同類比和`;
    }
    return { pos: p.pos, gan: p.gan, zhi: p.zhi, type, desc };
  });
}

// ── 賊捕結構判定 ─────────────────────────────────────────────
/**
 * 賊捕判定（藍圖定義）：
 *   前提：日主居賓位且字數極少（≤1/8）→ 體弱從勢，無法構成捕神 → 不適用賊捕框架
 *   體力：主位五行字數；用力：客位字數
 *   體力 > 用力×2 → 捕神空轉（賊少）
 *   用力 > 體力×2 → 賊神橫行（體弱）
 *   其他 → 均衡
 */
export function judgeCatcher(qishi, pillars) {
  const { host, riZhuIsHost, riZhuWx, count } = qishi;

  // 日主居賓位且字數≤1/8 → 日主極弱，傾向從勢，但尚未達從格門檻，標為邊界案例
  if (!riZhuIsHost && (count?.[riZhuWx] ?? 0) <= 1) {
    return { verdict: '日主極弱，傾向從勢（待驗證）', ratio: 0, desc: `${riZhuWx}僅1字，傾向隨勢，惟未達從格門檻，建議命理師確認` };
  }

  const hostWxs = host.split('+');
  let bodyCount = 0, useCount = 0;
  pillars.forEach(p => {
    if (hostWxs.includes(GAN_WUXING[p.gan]))  bodyCount += 1; else useCount += 1;
    if (hostWxs.includes(ZHI_WUXING[p.zhi])) bodyCount += 1; else useCount += 1;
  });

  if (bodyCount > useCount * 2) return { verdict: '捕神空轉', ratio: +(bodyCount/useCount).toFixed(1) };
  if (useCount  > bodyCount * 2) return { verdict: '賊神橫行', ratio: +(useCount/bodyCount).toFixed(1) };
  return { verdict: '均衡', ratio: 1 };
}

// ── 納音推算 ─────────────────────────────────────────────────
const NAYIN_NAMES = [
  '海中金','爐中火','大林木','路旁土','劍鋒金','山頭火',
  '澗下水','城頭土','白蠟金','楊柳木','泉中水','屋上土',
  '霹靂火','松柏木','長流水','沙中金','山下火','平地木',
  '壁上土','金箔金','覆燈火','天河水','大驛土','釵釧金',
  '桑柘木','大溪水','沙中土','天上火','石榴木','大海水',
];
export function getNaYin(gan, zhi) {
  const g = TIAN_GAN.indexOf(gan);
  const z = DI_ZHI.indexOf(zhi);
  if (g < 0 || z < 0) return '';
  // 找60甲子序號：g + 10k，使 (g+10k) % 12 === z
  let c60 = -1;
  for (let k = 0; k <= 5; k++) {
    if ((g + 10 * k) % 12 === z) { c60 = g + 10 * k; break; }
  }
  return c60 < 0 ? '' : NAYIN_NAMES[Math.floor(c60 / 2)];
}

// 引入 WUXING_KE/SHENG（用於 engine 內部）
function WUXING_KE_get(wx) { return WUXING_KE[wx]; }
function WUXING_SHENG_get(wx) { return WUXING_SHENG[wx]; }

import { CANG_GAN, GAN_WUXING, LU_TABLE, WUXING_KE, ZHI_WUXING } from '../constants/bazi.js';

export function calcWuXingCountDynamic(pillars) {
  const count = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };

  pillars.forEach(pillar => {
    const ganWx = GAN_WUXING[pillar.gan];
    const zhiWx = ZHI_WUXING[pillar.zhi];

    if (ganWx && count[ganWx] !== undefined) count[ganWx] += 1;
    if (zhiWx && count[zhiWx] !== undefined) count[zhiWx] += 1;
  });

  return count;
}

export function calcWuXingForceDynamic(pillars) {
  const force = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };

  pillars.forEach(pillar => {
    const ganWx = GAN_WUXING[pillar.gan];
    if (ganWx && force[ganWx] !== undefined) {
      force[ganWx] += pillar.isDayMarker ? 0.5 : 1;
    }

    const cangGan = CANG_GAN[pillar.zhi] ?? [];
    if (cangGan[0] && force[GAN_WUXING[cangGan[0]]] !== undefined) force[GAN_WUXING[cangGan[0]]] += 0.8;
    if (cangGan[1] && force[GAN_WUXING[cangGan[1]]] !== undefined) force[GAN_WUXING[cangGan[1]]] += 0.4;
    if (cangGan[2] && force[GAN_WUXING[cangGan[2]]] !== undefined) force[GAN_WUXING[cangGan[2]]] += 0.2;
  });

  return force;
}

export function judgeQiShiDynamic(pillars, riZhu) {
  const total = pillars.length * 2;
  const count = calcWuXingCountDynamic(pillars);
  const force = calcWuXingForceDynamic(pillars);
  const riZhuWx = GAN_WUXING[riZhu];
  const countRank = Object.entries(count).sort((a, b) => b[1] - a[1]);
  const top1 = countRank[0];
  const top2 = countRank[1];
  const combined = (top1[1] + top2[1]) / total;

  let verdict = '普通';
  let host = riZhuWx;

  if (top1[1] / total >= 0.75) {
    verdict = '從格';
    host = top1[0];
  } else if (combined >= 0.625) {
    verdict = '成勢';
    host = `${top1[0]}+${top2[0]}`;
  } else if (top1[1] / total >= 0.375) {
    verdict = '成氣';
    host = top1[0];
  }

  const forceTotal = Object.values(force).reduce((sum, value) => sum + value, 0);
  const ranked = Object.entries(force)
    .sort((a, b) => b[1] - a[1])
    .map(([wx, value]) => ({
      wx,
      f: value,
      ratio: forceTotal ? value / forceTotal : 0,
    }));

  const riZhuIsHost = host.includes(riZhuWx);

  return {
    verdict,
    host,
    riZhuWx,
    guest: riZhuIsHost ? null : riZhuWx,
    ranked,
    force,
    count,
    riZhuIsHost,
    lu: LU_TABLE[riZhu],
  };
}

export function judgeCatcherDynamic(qishi, pillars) {
  const { host, riZhuIsHost, riZhuWx, count } = qishi;

  if (!riZhuIsHost && (count?.[riZhuWx] ?? 0) <= 1) {
    return {
      verdict: '日主極弱，傾向從勢（待驗證）',
      ratio: 0,
      desc: `${riZhuWx}僅1字，傾向隨勢，惟未達從格門檻，建議命理師確認`,
    };
  }

  const hostWxs = host.split('+');
  let bodyCount = 0;
  let useCount = 0;

  pillars.forEach(pillar => {
    if (hostWxs.includes(GAN_WUXING[pillar.gan])) bodyCount += 1;
    else useCount += 1;

    if (hostWxs.includes(ZHI_WUXING[pillar.zhi])) bodyCount += 1;
    else useCount += 1;
  });

  const ratio = useCount === 0 ? bodyCount : +(bodyCount / useCount).toFixed(1);

  if (bodyCount > useCount * 2) {
    return { verdict: '強捕弱賊', ratio, desc: '主勢遠強於客勢' };
  }

  if (useCount > bodyCount * 2) {
    return { verdict: '賊神橫行', ratio: +(useCount / Math.max(bodyCount, 1)).toFixed(1), desc: '客勢反壓主勢' };
  }

  return { verdict: '無', ratio: 1, desc: '賊捕未形成明顯失衡' };
}

export function buildVirtualDayunPillar(dayunGan, dayunZhi) {
  return {
    pos: '大運',
    gan: dayunGan,
    zhi: dayunZhi,
    ganWuxing: GAN_WUXING[dayunGan],
    zhiWuxing: ZHI_WUXING[dayunZhi],
    isDayMarker: false,
  };
}

export function collectPressureWuxing(hostWxs) {
  return new Set(
    Object.entries(WUXING_KE)
      .filter(([, target]) => hostWxs.includes(target))
      .map(([wx]) => wx)
  );
}

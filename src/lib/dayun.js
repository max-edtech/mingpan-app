import {
  GAN_WUXING,
  ZHI_WUXING,
  GAN_WUHE,
  ZHI_LIUHE,
  ZHI_LIUCHONG,
  ZHI_CHUAN,
  ZHI_SANXING,
  WUXING_SHENG,
  WUXING_KE,
} from '../constants/bazi.js';
import { getShiShen, getShiShenCat, scanGanHe, scanZhiInteractions } from './engine.js';
import { analyzeAllGongFu, rankGongFuMainLine } from './analysis.js';
import { analyzeGongShenProfile } from './gongshen.js';
import {
  buildVirtualDayunPillar,
  collectPressureWuxing,
  judgeCatcherDynamic,
  judgeQiShiDynamic,
} from './state.js';
import { ENGINE_RULE_VERSION, RULE_SCOPE, RULE_TIER, YINGQI_RULES } from './rulebook.js';

function getSupportSet(targetWx) {
  return new Set([targetWx, WUXING_SHENG[targetWx]]);
}

function pushUniqueRelation(bucket, relation) {
  const key = `${relation.kind}-${relation.targetPos}-${relation.targetChar}`;
  if (!bucket.some(item => `${item.kind}-${item.targetPos}-${item.targetChar}` === key)) {
    bucket.push(relation);
  }
}

function buildMeta(ruleCode, confidence, evidence, interaction, recomputedState) {
  return {
    ruleVersion: ENGINE_RULE_VERSION,
    ruleScope: RULE_SCOPE.dayunYingqi,
    ruleTier: RULE_TIER.heuristic,
    ruleCode,
    confidence,
    evidence,
    interaction,
    recomputedState,
  };
}

function describeInteraction(interaction) {
  return [
    ...interaction.ganHe.map(item => item.detail),
    ...interaction.zhiHe.map(item => item.detail),
    ...interaction.zhiChong.map(item => item.detail),
    ...interaction.zhiChuan.map(item => item.detail),
    ...interaction.zhiXing.map(item => item.detail),
  ];
}

function involvesDayun(structure) {
  return (
    structure.a?.pos === '大運' ||
    structure.b?.pos === '大運' ||
    (structure.members ?? []).some(member => member.pos === '大運')
  );
}

function summarizeStructure(structure) {
  return `${structure.family} / ${structure.subtype} / ${structure.efficiency}`;
}

export function scanDayunInteraction(dayunGan, dayunZhi, originalPillars, riZhu) {
  const ganHe = [];
  const zhiChong = [];
  const zhiHe = [];
  const zhiChuan = [];
  const zhiXing = [];

  originalPillars.forEach(pillar => {
    if (GAN_WUHE[dayunGan]?.partner === pillar.gan) {
      pushUniqueRelation(ganHe, {
        kind: '天干五合',
        targetPos: pillar.pos,
        targetChar: pillar.gan,
        detail: `${dayunGan} 與原局${pillar.pos}${pillar.gan}形成天干五合`,
      });
    }

    if (ZHI_LIUCHONG[dayunZhi] === pillar.zhi) {
      pushUniqueRelation(zhiChong, {
        kind: '地支六沖',
        targetPos: pillar.pos,
        targetChar: pillar.zhi,
        detail: `${dayunZhi} 沖原局${pillar.pos}${pillar.zhi}`,
      });
    }

    if (ZHI_LIUHE[dayunZhi]?.partner === pillar.zhi) {
      pushUniqueRelation(zhiHe, {
        kind: '地支六合',
        targetPos: pillar.pos,
        targetChar: pillar.zhi,
        detail: `${dayunZhi} 與原局${pillar.pos}${pillar.zhi}形成六合`,
      });
    }

    if (ZHI_CHUAN[dayunZhi] === pillar.zhi) {
      pushUniqueRelation(zhiChuan, {
        kind: '地支穿害',
        targetPos: pillar.pos,
        targetChar: pillar.zhi,
        detail: `${dayunZhi} 與原局${pillar.pos}${pillar.zhi}形成穿害`,
      });
    }

    ZHI_SANXING.forEach(({ members, type }) => {
      if (!members.includes(dayunZhi) || !members.includes(pillar.zhi)) return;
      if (members.length > 1 && pillar.zhi === dayunZhi) return;

      pushUniqueRelation(zhiXing, {
        kind: '地支三刑',
        targetPos: pillar.pos,
        targetChar: pillar.zhi,
        detail: `${dayunZhi} 與原局${pillar.pos}${pillar.zhi}落入${type}`,
      });
    });
  });

  const ganShishen = riZhu ? getShiShen(riZhu, dayunGan) : null;
  const ganShishenCat = ganShishen ? getShiShenCat(ganShishen) : null;

  return {
    ganHe,
    zhiChong,
    zhiHe,
    zhiChuan,
    zhiXing,
    ganShishen,
    ganShishenCat,
    ganWx: GAN_WUXING[dayunGan],
    zhiWx: ZHI_WUXING[dayunZhi],
  };
}

export function recomputeDayunState(dayunGan, dayunZhi, riZhu, originalPillars) {
  const virtualDayun = buildVirtualDayunPillar(dayunGan, dayunZhi);
  const extendedPillars = [...originalPillars, virtualDayun];
  const interactions = [
    ...scanGanHe(extendedPillars),
    ...scanZhiInteractions(extendedPillars),
  ];
  const qishi = judgeQiShiDynamic(extendedPillars, riZhu);
  const catcher = judgeCatcherDynamic(qishi, extendedPillars);
  const structures = analyzeAllGongFu(extendedPillars, riZhu, qishi, interactions);
  const ranked = rankGongFuMainLine(structures, riZhu, extendedPillars);
  const profile = analyzeGongShenProfile(ranked);

  return {
    pillars: extendedPillars,
    interactions,
    qishi,
    catcher,
    structures,
    ranked,
    profile,
  };
}

export function judgeYingQiWithDayun(dayunGan, dayunZhi, riZhu, originalQishi, originalStructures, originalPillars) {
  const hostWxs = originalQishi.host.split('+');
  const guestWx = originalQishi.guest ?? originalQishi.riZhuWx;
  const interaction = scanDayunInteraction(dayunGan, dayunZhi, originalPillars, riZhu);
  const dayunState = recomputeDayunState(dayunGan, dayunZhi, riZhu, originalPillars);
  const yunCat = interaction.ganShishenCat;

  const guestSupportSet = getSupportSet(guestWx);
  const hostSupportSet = new Set(hostWxs.flatMap(wx => [...getSupportSet(wx)]));
  const hostPressureSet = collectPressureWuxing(hostWxs);
  const dayunWxs = [interaction.ganWx, interaction.zhiWx];
  const guestSupportCount = dayunWxs.filter(wx => guestSupportSet.has(wx)).length;
  const hostSupportCount = dayunWxs.filter(wx => hostSupportSet.has(wx)).length;
  const hostPressureCount = dayunWxs.filter(wx => hostPressureSet.has(wx)).length;

  const originalDiseaseStructures = originalStructures.filter(
    structure => structure.family === '制用' || structure.efficiency === 'Negative'
  );
  const originalCatcherStructures = originalStructures.filter(structure => structure.family === '制用');
  const newDayunStructures = dayunState.structures.filter(involvesDayun);
  const newControlStructures = newDayunStructures.filter(structure => structure.family === '制用');
  const newNegativeStructures = dayunState.structures.filter(structure => structure.efficiency === 'Negative');
  const relationEvidence = describeInteraction(interaction);
  const hostFlipped = originalQishi.riZhuIsHost !== dayunState.qishi.riZhuIsHost;
  const hostChanged = originalQishi.host !== dayunState.qishi.host;
  const deadlockActive = dayunState.profile.deadlock.active;
  const reverseRiskActive = dayunState.profile.reverseRisk.active;

  if (
    originalDiseaseStructures.length > 0 &&
    newControlStructures.length > 0 &&
    (yunCat === '食傷' || interaction.ganHe.length > 0)
  ) {
    const evidence = [
      `原局病點：${originalDiseaseStructures.map(summarizeStructure).join('、')}`,
      `進盤後新增制用：${newControlStructures.map(summarizeStructure).join('、')}`,
      `新主線：${dayunState.ranked.topStructure ? summarizeStructure(dayunState.ranked.topStructure) : '未定'}`,
      ...relationEvidence,
    ];

    return {
      mode: '找藥',
      desc: `${dayunGan}${dayunZhi}運進盤後補上制神，開始處理原局病點`,
      basis: evidence,
      ...buildMeta(
        YINGQI_RULES.find_medicine,
        0.84,
        evidence,
        interaction,
        {
          qishi: dayunState.qishi,
          catcher: dayunState.catcher,
          topStructure: dayunState.ranked.topStructure,
        }
      ),
    };
  }

  if (
    originalCatcherStructures.length > 0 &&
    newDayunStructures.length > 0 &&
    (yunCat === '官殺' || yunCat === '財') &&
    !hostFlipped
  ) {
    const evidence = [
      `原局捕神：${originalCatcherStructures.map(summarizeStructure).join('、')}`,
      `大運帶入新結構：${newDayunStructures.map(summarizeStructure).join('、')}`,
      `進盤後賊捕：${dayunState.catcher.verdict}`,
      ...relationEvidence,
    ];

    return {
      mode: '找病',
      desc: `${dayunGan}${dayunZhi}運把原局等待處理的目標帶進來，捕神開始落實`,
      basis: evidence,
      ...buildMeta(
        YINGQI_RULES.find_disease,
        0.79,
        evidence,
        interaction,
        {
          qishi: dayunState.qishi,
          catcher: dayunState.catcher,
          topStructure: dayunState.ranked.topStructure,
        }
      ),
    };
  }

  if (
    hostFlipped ||
    (hostChanged &&
      !originalQishi.riZhuIsHost &&
      guestSupportCount >= hostSupportCount &&
      (hostPressureCount > 0 || relationEvidence.length > 0))
  ) {
    const evidence = [
      `原局主勢：${originalQishi.host}`,
      `進盤後主勢：${dayunState.qishi.host}`,
      `原局日主是否在主勢：${originalQishi.riZhuIsHost ? '是' : '否'}`,
      `進盤後日主是否在主勢：${dayunState.qishi.riZhuIsHost ? '是' : '否'}`,
      `大運五行支援比：客方 ${guestSupportCount} / 主方 ${hostSupportCount}`,
      reverseRiskActive ? `進盤後反局風險升高：${dayunState.profile.reverseRisk.evidence.join('；')}` : '進盤後未見反局風險升高',
      ...relationEvidence,
    ];

    return {
      mode: '反客為主',
      desc: `${dayunGan}${dayunZhi}運進盤後改寫主賓結構，原局重心明顯轉動`,
      basis: evidence,
      ...buildMeta(
        YINGQI_RULES.reverse_host_guest,
        0.81,
        evidence,
        interaction,
        {
          qishi: dayunState.qishi,
          catcher: dayunState.catcher,
          topStructure: dayunState.ranked.topStructure,
        }
      ),
    };
  }

  const evidence = [
    `原局主勢：${originalQishi.host}`,
    `進盤後主勢：${dayunState.qishi.host}`,
    `原局主線：${originalStructures[0] ? summarizeStructure(originalStructures[0]) : '未定'}`,
    `進盤後主線：${dayunState.ranked.topStructure ? summarizeStructure(dayunState.ranked.topStructure) : '未定'}`,
    dayunState.profile.mainExecutors.length
      ? `進盤後主功神：${dayunState.profile.mainExecutors.join('、')}`
      : '進盤後主功神尚未明確',
    deadlockActive
      ? `進盤後對抗：${dayunState.profile.deadlock.evidence.join('；')}`
      : '進盤後未見強對抗',
    newNegativeStructures.length
      ? `進盤後負向結構：${newNegativeStructures.map(summarizeStructure).join('、')}`
      : '進盤後未見新增負向結構',
    relationEvidence.length ? relationEvidence.join('；') : '本步未形成足以改寫主線的強交互',
  ];

  return {
    mode: '平穩',
    desc: `${dayunGan}${dayunZhi}運進盤後主線仍以原局延續為主，未見翻盤訊號`,
    basis: evidence,
    ...buildMeta(
      YINGQI_RULES.stable,
      0.66,
      evidence,
      interaction,
      {
        qishi: dayunState.qishi,
        catcher: dayunState.catcher,
        topStructure: dayunState.ranked.topStructure,
      }
    ),
  };
}

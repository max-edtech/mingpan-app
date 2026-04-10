import { GAN_WUXING, ZHI_WUXING } from '../constants/bazi.js';
import {
  ENGINE_RULE_VERSION,
  PROFILE_RULES,
  RULE_SCOPE,
  RULE_TIER,
} from './rulebook.js';

function toPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function buildMeta(ruleCode, confidence, evidence) {
  return {
    ruleVersion: ENGINE_RULE_VERSION,
    ruleCode,
    ruleScope: RULE_SCOPE.analysis,
    ruleTier: RULE_TIER.heuristic,
    confidence,
    evidence,
  };
}

export function explainQiShi(qishi) {
  const top = qishi.ranked?.[0];
  const second = qishi.ranked?.[1];
  const evidence = [
    `主勢落在 ${qishi.host}`,
    top ? `最高權重五行為 ${top.wx}，占比 ${toPercent(top.ratio)}` : '未取到主五行排序',
    second ? `次高權重五行為 ${second.wx}，占比 ${toPercent(second.ratio)}` : '未取到次高五行排序',
    `日主五行 ${qishi.riZhuWx}，${qishi.riZhuIsHost ? '仍在主勢內' : '已偏離主勢'}`,
  ];

  return {
    verdict: qishi.verdict,
    summary: `本局目前判為${qishi.verdict}，主勢集中在 ${qishi.host}。`,
    ...buildMeta('QS-001', 0.72, evidence),
  };
}

export function explainCatcher(qishi, pillars, catcher) {
  const hostWxs = qishi.host.split('+');
  let hostCount = 0;
  let guestCount = 0;

  pillars.forEach(pillar => {
    if (hostWxs.includes(GAN_WUXING[pillar.gan])) hostCount += 1;
    else guestCount += 1;

    if (hostWxs.includes(ZHI_WUXING[pillar.zhi])) hostCount += 1;
    else guestCount += 1;
  });

  const evidence = [
    `主勢五行組合為 ${qishi.host}`,
    `主勢字數 ${hostCount}，非主勢字數 ${guestCount}`,
    qishi.guest ? `客勢對應 ${qishi.guest}` : '目前未形成明確客勢',
    catcher.desc ?? `賊捕判為 ${catcher.verdict}`,
  ];

  return {
    verdict: catcher.verdict,
    summary: `賊捕系統目前判為${catcher.verdict}。`,
    ...buildMeta('CT-001', 0.7, evidence),
  };
}

export function explainMainLine(ranked) {
  const mainLine = ranked.mainLine ?? [];
  const top = ranked.topStructure;
  const evidence = mainLine.length
    ? mainLine.map(
        (structure, index) =>
          `主線 ${index + 1}：${structure.type} / ${structure.subtype} / 效率 ${structure.efficiency}`
      )
    : ['目前尚未選出明確做功主線。'];

  return {
    verdict: top ? `${top.type} / ${top.subtype}` : '未形成主線',
    summary: top ? `本局主線傾向 ${top.type}，核心子類為 ${top.subtype}。` : '目前沒有穩定主線。 ',
    ...buildMeta('GF-001', top ? 0.68 : 0.45, evidence),
  };
}

export function explainGongShenProfile(profile) {
  const evidence = [
    profile.mainExecutors.length
      ? `主功神：${profile.mainExecutors.join('、')}`
      : '目前未標出主功神。',
    profile.supporters.length
      ? `輔功神：${profile.supporters.join('、')}`
      : '目前未標出輔功神。',
    profile.deadlock.active
      ? `存在對抗：${profile.deadlock.evidence.join('；')}`
      : '目前未見明顯對抗。',
    profile.reverseRisk.active
      ? `存在反局風險：${profile.reverseRisk.evidence.join('；')}`
      : '目前未見明顯反局風險。',
  ];

  return {
    verdict: profile.deadlock.active
      ? '對抗拉鋸'
      : profile.reverseRisk.active
        ? '反局風險'
        : '主線穩定',
    summary: profile.mainExecutors.length
      ? `目前由 ${profile.mainExecutors.join('、')} 擔任主功神。`
      : '目前尚未抓出明確主功神。',
    ...buildMeta(PROFILE_RULES.executor_profile, 0.71, evidence),
  };
}

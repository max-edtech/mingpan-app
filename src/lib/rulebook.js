export const ENGINE_RULE_VERSION = 'engine-2026.04-p0';

export const RULE_TIER = {
  deterministic: 'hard_rule',
  heuristic: 'heuristic',
  narrative: 'narrative',
  pending: 'pending',
};

export const RULE_SCOPE = {
  qishi: 'qishi',
  catcher: 'catcher',
  gongfu: 'gongfu',
  dayunYingqi: 'dayun_yingqi',
  sceneCopy: 'scene_copy',
  analysis: 'analysis_summary',
};

export const YINGQI_RULES = {
  find_medicine: 'YQ-001',
  find_disease: 'YQ-002',
  reverse_host_guest: 'YQ-003',
  stable: 'YQ-004',
};

export const PROFILE_RULES = {
  executor_profile: 'GP-001',
  deadlock: 'GP-002',
  reverse_risk: 'GP-003',
};

export const RULE_CATALOG = [
  {
    code: 'QS-001',
    scope: RULE_SCOPE.qishi,
    tier: RULE_TIER.heuristic,
    title: '氣勢 5/8-7/8 門檻',
    summary: '以全局八字五行數量作成勢、成氣、從格的初步分層。',
  },
  {
    code: 'CT-001',
    scope: RULE_SCOPE.catcher,
    tier: RULE_TIER.heuristic,
    title: '賊捕強弱比',
    summary: '依 host 與非 host 的分布比值判定強捕、體弱從勢或平衡。',
  },
  {
    code: 'GF-001',
    scope: RULE_SCOPE.gongfu,
    tier: RULE_TIER.heuristic,
    title: '做功主線排序',
    summary: '依結構效率、是否貼近日柱與主線權重選出主做功線。',
  },
  {
    code: PROFILE_RULES.executor_profile,
    scope: RULE_SCOPE.gongfu,
    tier: RULE_TIER.heuristic,
    title: '主功神與輔功神',
    summary: '依主線與輔線結構歸納實際做功者。',
  },
  {
    code: PROFILE_RULES.deadlock,
    scope: RULE_SCOPE.gongfu,
    tier: RULE_TIER.heuristic,
    title: '對抗',
    summary: '主線與負向結構同時強勢時，標記為對抗拉扯。',
  },
  {
    code: PROFILE_RULES.reverse_risk,
    scope: RULE_SCOPE.gongfu,
    tier: RULE_TIER.heuristic,
    title: '反局風險',
    summary: '當負向結構接近或超過主線強度時，標記反局風險。',
  },
  {
    code: YINGQI_RULES.find_medicine,
    scope: RULE_SCOPE.dayunYingqi,
    tier: RULE_TIER.heuristic,
    title: '找藥',
    summary: '原局有病，大運帶來可用制神並啟動交互。',
  },
  {
    code: YINGQI_RULES.find_disease,
    scope: RULE_SCOPE.dayunYingqi,
    tier: RULE_TIER.heuristic,
    title: '找病',
    summary: '原局捕神空轉，大運把目標帶入局中。',
  },
  {
    code: YINGQI_RULES.reverse_host_guest,
    scope: RULE_SCOPE.dayunYingqi,
    tier: RULE_TIER.heuristic,
    title: '反客為主',
    summary: '大運明顯增援客方，造成原局主賓結構動搖。',
  },
  {
    code: YINGQI_RULES.stable,
    scope: RULE_SCOPE.dayunYingqi,
    tier: RULE_TIER.heuristic,
    title: '平穩',
    summary: '未形成足以改寫主線的強交互。',
  },
  {
    code: 'SC-001',
    scope: RULE_SCOPE.sceneCopy,
    tier: RULE_TIER.narrative,
    title: '場景文案組裝',
    summary: '以天干基底、地支季節與帶象修飾生成意象文案。',
  },
];

export function getRuleDefinition(code) {
  return RULE_CATALOG.find(rule => rule.code === code) ?? null;
}

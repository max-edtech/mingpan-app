function scoreStructure(structure) {
  return structure.mainScore ?? 0;
}

function listActors(structures) {
  return [...new Set(structures.flatMap(structure => structure.actors ?? []))];
}

function summarizeStructures(structures) {
  return structures.map(structure => `${structure.family}/${structure.subtype}`);
}

export function analyzeGongShenProfile(ranked) {
  const mainLine = ranked.mainLine ?? [];
  const auxiliary = ranked.auxiliary ?? [];
  const negative = ranked.negative ?? [];

  const mainExecutors = listActors(mainLine);
  const supporters = listActors(auxiliary).filter(actor => !mainExecutors.includes(actor));
  const topMainScore = Math.max(...mainLine.map(scoreStructure), 0);
  const topNegativeScore = Math.max(...negative.map(structure => Math.abs(scoreStructure(structure))), 0);

  const contestRatio = topMainScore > 0
    ? +(topNegativeScore / topMainScore).toFixed(2)
    : 0;

  const deadlock =
    topMainScore > 0 &&
    topNegativeScore > 0 &&
    contestRatio >= 0.8 &&
    contestRatio <= 1.2;

  const reverseRisk = topNegativeScore > topMainScore;

  const deadlockEvidence = deadlock
    ? [
        `主線強度 ${topMainScore}`,
        `負向強度 ${topNegativeScore}`,
        `兩方強度接近，比例 ${contestRatio}`,
      ]
    : [];

  const reverseEvidence = reverseRisk
    ? [
        `主線強度 ${topMainScore}`,
        `負向強度 ${topNegativeScore}`,
        `負向結構已高於主線，存在反局風險`,
      ]
    : [];

  return {
    mainExecutors,
    supporters,
    deadlock: {
      active: deadlock,
      ratio: contestRatio,
      evidence: deadlockEvidence,
      structures: deadlock ? summarizeStructures(negative) : [],
    },
    reverseRisk: {
      active: reverseRisk,
      evidence: reverseEvidence,
      structures: reverseRisk ? summarizeStructures(negative) : [],
    },
  };
}

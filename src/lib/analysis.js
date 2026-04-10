import { CANG_GAN, GAN_WUXING } from '../constants/bazi.js';
import { getShiShen, getShiShenCat } from './engine.js';

export const EFFICIENCY = {
  Explosive: { label: '極強', score: 5, color: '#f1c40f' },
  High: { label: '高', score: 4, color: '#ef4444' },
  MediumHigh: { label: '中高', score: 3, color: '#f59e0b' },
  Medium: { label: '中', score: 2, color: '#22c55e' },
  Low: { label: '低', score: 1, color: '#3b82f6' },
  Negative: { label: '凶', score: -1, color: '#6b7280' },
};

const STORAGE_BRANCHES = {
  未: [{ wx: '木', type: '庫' }],
  戌: [{ wx: '火', type: '庫' }, { wx: '金', type: '墓' }],
  丑: [{ wx: '金', type: '庫' }, { wx: '水', type: '墓' }],
  辰: [{ wx: '土', type: '庫' }, { wx: '水', type: '庫' }, { wx: '木', type: '墓' }],
};

const FAMILY_WEIGHT = {
  制用: 3,
  化用: 2,
  合用: 5,  // 藍圖 Step 2：日干有合 → 合用優先於制用
  墓用: 1,
  生用: 2,
};

function buildStructure({
  family,
  subtype,
  efficiency,
  desc,
  riZhu,
  a = null,
  b = null,
  members = [],
  actors = [],
  evidence = [],
  tags = [],
  phase = 'natal',
}) {
  return {
    id: `${family}-${subtype}-${a?.char ?? members[0]?.char ?? 'na'}-${b?.char ?? members[1]?.char ?? 'na'}`,
    family,
    type: family,
    subtype,
    efficiency,
    desc,
    riZhu,
    a,
    b,
    members,
    actors: [...new Set(actors)],
    evidence,
    tags,
    phase,
  };
}

function getAllTargets(pillars) {
  const targets = [];

  pillars.forEach(pillar => {
    targets.push({ pos: pillar.pos, char: pillar.gan, isGan: true, source: 'gan' });

    const mainCang = (CANG_GAN[pillar.zhi] ?? [])[0];
    if (mainCang) {
      targets.push({
        pos: `${pillar.pos}支`,
        char: mainCang,
        isGan: false,
        source: pillar.zhi,
      });
    }
  });

  return targets;
}

function getCategories(pillars, riZhu) {
  return pillars.map(pillar => {
    const shishen = getShiShen(riZhu, pillar.gan);
    return {
      ...pillar,
      shishen,
      category: getShiShenCat(shishen),
    };
  });
}

function hasPairInteraction(interactions, leftPos, rightPos) {
  return interactions.some(interaction => {
    const aPos = interaction.a?.pos;
    const bPos = interaction.b?.pos;
    return (
      (aPos === leftPos && bPos === rightPos) ||
      (aPos === rightPos && bPos === leftPos)
    );
  });
}

function dedupeStructures(structures) {
  const seen = new Set();
  return structures.filter(structure => {
    const key = `${structure.family}-${structure.subtype}-${structure.a?.pos ?? ''}-${structure.b?.pos ?? ''}-${structure.members?.map(m => m.pos).join('|') ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function detectControlStructures(pillars, riZhu, _qishi, interactions) {
  const results = [];
  const targets = getAllTargets(pillars);

  for (let index = 0; index < targets.length; index += 1) {
    for (let compareIndex = 0; compareIndex < targets.length; compareIndex += 1) {
      if (index === compareIndex) continue;
      if (!targets[index].isGan) continue;  // 主動方（actor）必須是天干，防止藏干重複造結構

      const left = targets[index];
      const right = targets[compareIndex];
      const leftShiShen = getShiShen(riZhu, left.char);
      const rightShiShen = getShiShen(riZhu, right.char);
      const leftCat = getShiShenCat(leftShiShen);
      const rightCat = getShiShenCat(rightShiShen);
      const directInteraction = hasPairInteraction(interactions, left.pos.replace('支', ''), right.pos.replace('支', ''));

      if (leftCat === '食傷' && rightCat === '官殺') {
        results.push(
          buildStructure({
            family: '制用',
            subtype: '食傷制官殺',
            efficiency: directInteraction ? 'Explosive' : 'High',
            desc: `${leftShiShen}${left.char}對${rightShiShen}${right.char}形成制用`,
            riZhu,
            a: { pos: left.pos, char: left.char, shishen: leftShiShen },
            b: { pos: right.pos, char: right.char, shishen: rightShiShen },
            actors: [left.char],
            evidence: [
              `${leftShiShen}${left.char}屬食傷`,
              `${rightShiShen}${right.char}屬官殺`,
              directInteraction ? '兩者有直接干支交互' : '兩者同局存在但未見強交互',
            ],
            tags: ['control', 'offense'],
          })
        );
      }

      if (leftCat === '財' && rightCat === '印') {
        results.push(
          buildStructure({
            family: '制用',
            subtype: '財來制印',
            efficiency: directInteraction ? 'High' : 'MediumHigh',
            desc: `${leftShiShen}${left.char}牽制${rightShiShen}${right.char}`,
            riZhu,
            a: { pos: left.pos, char: left.char, shishen: leftShiShen },
            b: { pos: right.pos, char: right.char, shishen: rightShiShen },
            actors: [left.char],
            evidence: [
              `${leftShiShen}${left.char}屬財`,
              `${rightShiShen}${right.char}屬印`,
            ],
            tags: ['control', 'resource'],
          })
        );
      }

      if (leftCat === '比劫' && rightCat === '財') {
        results.push(
          buildStructure({
            family: '制用',
            subtype: '比劫制財',
            efficiency: directInteraction ? 'High' : 'Medium',
            desc: `${leftShiShen}${left.char}奪取${rightShiShen}${right.char}`,
            riZhu,
            a: { pos: left.pos, char: left.char, shishen: leftShiShen },
            b: { pos: right.pos, char: right.char, shishen: rightShiShen },
            actors: [left.char],
            evidence: [
              `${leftShiShen}${left.char}屬比劫`,
              `${rightShiShen}${right.char}屬財`,
            ],
            tags: ['control', 'wealth'],
          })
        );
      }

      if (leftCat === '印' && rightCat === '食傷') {
        results.push(
          buildStructure({
            family: '制用',
            subtype: '印制食傷',
            efficiency: directInteraction ? 'MediumHigh' : 'Medium',
            desc: `${leftShiShen}${left.char}約束${rightShiShen}${right.char}`,
            riZhu,
            a: { pos: left.pos, char: left.char, shishen: leftShiShen },
            b: { pos: right.pos, char: right.char, shishen: rightShiShen },
            actors: [left.char],
            evidence: [
              `${leftShiShen}${left.char}屬印`,
              `${rightShiShen}${right.char}屬食傷`,
            ],
            tags: ['control', 'output'],
          })
        );
      }
    }
  }

  return dedupeStructures(results);
}

export function detectTransformStructures(pillars, riZhu) {
  const results = [];
  const categories = getCategories(pillars, riZhu);
  const ordered = categories.map(item => item.category);

  const hasLink = ordered.includes('官殺') && ordered.includes('印');
  if (!hasLink) return results;

  const consecutiveTriples = [];
  for (let index = 0; index <= categories.length - 3; index += 1) {
    consecutiveTriples.push(categories.slice(index, index + 3));
  }

  consecutiveTriples.forEach(triple => {
    const cats = triple.map(item => item.category);
    if (cats.includes('官殺') && cats.includes('印') && (cats.includes('比劫') || cats.includes('日主'))) {
      results.push(
        buildStructure({
          family: '化用',
          subtype: '官殺化印',
          efficiency: 'High',
          desc: `官殺經由印星轉化為可用力量`,
          riZhu,
          members: triple.map(item => ({ pos: item.pos, char: item.gan, shishen: item.shishen })),
          actors: triple.map(item => item.gan),
          evidence: triple.map(item => `${item.pos}${item.gan}屬${item.shishen}`),
          tags: ['transform'],
        })
      );
    }
  });

  return dedupeStructures(results);
}

export function detectCombineStructures(pillars, riZhu, interactions) {
  return interactions
    .filter(interaction => interaction.type === '天干五合' && interaction.isDayZhu)
    .map(interaction => {
      const other = interaction.a.char === riZhu ? interaction.b : interaction.a;
      const shishen = getShiShen(riZhu, other.char);
      const category = getShiShenCat(shishen);
      const efficiency =
        category === '財' ? 'High' : category === '官殺' ? 'MediumHigh' : 'Medium';

      return buildStructure({
        family: '合用',
        subtype: `日干合${shishen}`,
        efficiency,
        desc: `日主與${shishen}${other.char}相合，形成合用`,
        riZhu,
        a: { pos: interaction.a.pos, char: interaction.a.char, shishen: getShiShen(riZhu, interaction.a.char) },
        b: { pos: interaction.b.pos, char: interaction.b.char, shishen: getShiShen(riZhu, interaction.b.char) },
        actors: [other.char],
        evidence: [
          `${interaction.a.pos}${interaction.a.char}與${interaction.b.pos}${interaction.b.char}成五合`,
          `${other.char}對日主屬${shishen}`,
        ],
        tags: ['combine'],
      });
    });
}

export function detectStorageStructures(pillars, riZhu, interactions) {
  const chongBranches = new Set(
    interactions
      .filter(interaction => interaction.type === '六沖')
      .flatMap(interaction => [interaction.a?.char, interaction.b?.char])
      .filter(Boolean)
  );

  const results = [];

  pillars.forEach(pillar => {
    const storageInfo = STORAGE_BRANCHES[pillar.zhi];
    if (!storageInfo) return;

    storageInfo.forEach(({ wx, type }) => {
      const isDayMaster = GAN_WUXING[riZhu] === wx;
      results.push(
        buildStructure({
          family: '墓用',
          subtype: `${pillar.zhi}${type}${wx}`,
          efficiency: chongBranches.has(pillar.zhi)
            ? type === '庫'
              ? 'Explosive'
              : 'Negative'
            : type === '庫'
              ? 'Low'
              : 'Negative',
          desc: `${pillar.pos}${pillar.zhi}承載${wx}${type}訊號`,
          riZhu,
          members: [{ pos: pillar.pos, char: pillar.zhi, shishen: type }],
          actors: [pillar.zhi],
          evidence: [
            `${pillar.zhi}屬${wx}${type}`,
            chongBranches.has(pillar.zhi) ? `${pillar.zhi}同時被沖動` : `${pillar.zhi}尚未被沖開`,
            isDayMaster ? '涉及日主本氣' : '非日主本氣',
          ],
          tags: ['storage', type === '庫' ? 'storage-open' : 'tomb'],
        })
      );
    });
  });

  return dedupeStructures(results);
}

export function detectGenerateStructures(pillars, riZhu) {
  const results = [];
  const categories = getCategories(pillars, riZhu);
  const shiShang = categories.filter(item => item.category === '食傷');
  const cai = categories.filter(item => item.category === '財');

  if (shiShang.length && cai.length) {
    results.push(
      buildStructure({
        family: '生用',
        subtype: '食傷生財',
        efficiency: 'MediumHigh',
        desc: '食傷輸出轉為財星承接',
        riZhu,
        members: [...shiShang, ...cai].map(item => ({ pos: item.pos, char: item.gan, shishen: item.shishen })),
        actors: [...shiShang, ...cai].map(item => item.gan),
        evidence: [
          `局中有食傷 ${shiShang.map(item => item.gan).join('、')}`,
          `局中有財 ${cai.map(item => item.gan).join('、')}`,
        ],
        tags: ['generate', 'wealth'],
      })
    );
  } else if (shiShang.length) {
    results.push(
      buildStructure({
        family: '生用',
        subtype: '食傷洩秀',
        efficiency: 'Medium',
        desc: '食傷輸出明顯，但未見財星承接',
        riZhu,
        members: shiShang.map(item => ({ pos: item.pos, char: item.gan, shishen: item.shishen })),
        actors: shiShang.map(item => item.gan),
        evidence: [`局中有食傷 ${shiShang.map(item => item.gan).join('、')}`, '未見明顯財星承接'],
        tags: ['generate', 'output'],
      })
    );
  }

  return dedupeStructures(results);
}

export function analyzeAllGongFu(pillars, riZhu, qishi, interactions) {
  return dedupeStructures([
    ...detectControlStructures(pillars, riZhu, qishi, interactions),
    ...detectTransformStructures(pillars, riZhu),
    ...detectCombineStructures(pillars, riZhu, interactions),
    ...detectStorageStructures(pillars, riZhu, interactions),
    ...detectGenerateStructures(pillars, riZhu),
  ]);
}

export function rankGongFuMainLine(structures, riZhu, pillars) {
  const dayPos = pillars.find(pillar => pillar.gan === riZhu && pillar.isRiZhu)?.pos
    ?? pillars.find(pillar => pillar.gan === riZhu)?.pos
    ?? pillars[2]?.pos;
  const dayZhi = pillars.find(pillar => pillar.pos === dayPos)?.zhi;

  const scored = structures.map(structure => {
    let score = EFFICIENCY[structure.efficiency]?.score ?? 0;
    if (score < 0) return { ...structure, mainScore: score, isMain: false };

    if (structure.a?.pos === dayPos || structure.b?.pos === dayPos) score += 3;
    if (
      structure.members?.some(member => member.pos === dayPos) ||
      structure.zhi === dayZhi
    ) {
      score += 2;
    }

    score += FAMILY_WEIGHT[structure.family] ?? 0;

    if ((structure.actors ?? []).includes('大運')) score += 1;

    return { ...structure, mainScore: score };
  });

  const positive = scored.filter(structure => structure.mainScore > 0).sort((left, right) => right.mainScore - left.mainScore);
  const negative = scored.filter(structure => structure.mainScore <= 0);
  const mainLine = positive.slice(0, 2);
  const auxiliary = positive.slice(2);

  return {
    mainLine: mainLine.map(structure => ({ ...structure, isMain: true })),
    auxiliary: auxiliary.map(structure => ({ ...structure, isMain: false })),
    negative: negative.map(structure => ({ ...structure, isMain: false })),
    topStructure: mainLine[0] ?? null,
  };
}

export const ZHI_FA_ORDER = ['合制', '衝制', '穿制', '克制'];

export function sortByZhiFa(structures) {
  return [...structures].sort((left, right) => {
    const getOrder = structure => {
      if (structure.family === '合用') return 0;
      if (structure.family === '制用' && structure.subtype?.includes('沖')) return 1;
      if (structure.family === '制用' && structure.subtype?.includes('穿')) return 2;
      return 3;
    };

    return getOrder(left) - getOrder(right);
  });
}

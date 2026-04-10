import test from 'node:test';
import assert from 'node:assert/strict';
import { calcBaZi, calcDaYun } from '../src/lib/calendar.js';
import {
  expandBaZi,
  scanGanHe,
  scanZhiInteractions,
  judgeQiShi,
  judgeCatcher,
} from '../src/lib/engine.js';
import { analyzeAllGongFu, rankGongFuMainLine } from '../src/lib/analysis.js';
import { analyzeGongShenProfile } from '../src/lib/gongshen.js';
import { judgeYingQiWithDayun } from '../src/lib/dayun.js';

function buildEngineSnapshot(input) {
  const bazi = calcBaZi(input.year, input.month, input.day, input.hour);
  const pillars = expandBaZi(bazi);
  const riZhu = bazi.riZhu;
  const interactions = [...scanGanHe(pillars), ...scanZhiInteractions(pillars)];
  const qishi = judgeQiShi(pillars, riZhu);
  const catcher = judgeCatcher(qishi, pillars);
  const structures = analyzeAllGongFu(pillars, riZhu, qishi, interactions);
  const ranked = rankGongFuMainLine(structures, riZhu, pillars);
  const gongShenProfile = analyzeGongShenProfile(ranked);
  const dayuns = calcDaYun(
    input.gender,
    bazi,
    input.year,
    input.month,
    input.day,
    input.hour
  ).dayuns;

  return {
    riZhu,
    qishi,
    catcher,
    structures,
    ranked,
    gongShenProfile,
    dayuns,
    pillars,
  };
}

test('1993/4/23 10時 男 regression snapshot', () => {
  const snapshot = buildEngineSnapshot({
    year: 1993,
    month: 4,
    day: 23,
    hour: 10,
    gender: 'male',
  });

  assert.equal(snapshot.riZhu, '甲');
  assert.equal(snapshot.qishi.verdict, '成勢');
  assert.equal(snapshot.qishi.host, '土+火');
  assert.equal(snapshot.catcher.verdict, '體弱從勢');
  assert.equal(snapshot.ranked.topStructure?.family, '制用');
  assert.equal(snapshot.ranked.topStructure?.subtype, '比劫制財');
  assert.deepEqual(snapshot.gongShenProfile.mainExecutors, ['甲']);

  const firstDayun = snapshot.dayuns[0];
  const yingqi = judgeYingQiWithDayun(
    firstDayun.gan,
    firstDayun.zhi,
    snapshot.riZhu,
    snapshot.qishi,
    snapshot.structures,
    snapshot.pillars
  );

  assert.equal(`${firstDayun.gan}${firstDayun.zhi}`, '乙卯');
  assert.equal(yingqi.mode, '反客為主');
  assert.equal(yingqi.ruleCode, 'YQ-003');
});

test('1974/4/8 10時 男 should produce stable engine outputs', () => {
  const snapshot = buildEngineSnapshot({
    year: 1974,
    month: 4,
    day: 8,
    hour: 10,
    gender: 'male',
  });

  assert.ok(snapshot.riZhu);
  assert.ok(snapshot.qishi.verdict);
  assert.ok(snapshot.catcher.verdict);
  assert.ok(snapshot.ranked.topStructure?.family);
  assert.ok(snapshot.dayuns.length >= 8);

  const targetDayun = snapshot.dayuns.find(dayun => `${dayun.gan}${dayun.zhi}` === '癸酉');
  assert.ok(targetDayun, 'expected 癸酉 dayun to exist');

  const yingqi = judgeYingQiWithDayun(
    targetDayun.gan,
    targetDayun.zhi,
    snapshot.riZhu,
    snapshot.qishi,
    snapshot.structures,
    snapshot.pillars
  );

  assert.ok(['平穩', '找藥', '找病', '反客為主'].includes(yingqi.mode));
  assert.ok(Array.isArray(yingqi.evidence));
  assert.ok(yingqi.evidence.length > 0);
});

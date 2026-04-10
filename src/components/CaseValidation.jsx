import { useMemo } from 'react';
import { calcBaZi, calcDaYun } from '../lib/calendar.js';
import {
  expandBaZi,
  scanGanHe,
  scanZhiInteractions,
  judgeQiShi,
  judgeCatcher,
} from '../lib/engine.js';
import { analyzeAllGongFu, rankGongFuMainLine } from '../lib/analysis.js';
import { analyzeGongShenProfile } from '../lib/gongshen.js';
import { judgeYingQiWithDayun } from '../lib/dayun.js';
import { ENGINE_RULE_VERSION } from '../lib/rulebook.js';

const CASES = [
  {
    id: 'case-1993-0423-10-m',
    title: '1993/4/23 10時 男',
    input: { year: 1993, month: 4, day: 23, hour: 10, gender: 'male', name: '' },
    expected: [
      { label: '氣勢應為成勢', actual: snapshot => snapshot.qishi.verdict, expected: '成勢' },
      { label: '賊捕不應為賊神橫行', actual: snapshot => snapshot.catcher.verdict, expected: '體弱從勢' },
      { label: '主線家族應為制用', actual: snapshot => snapshot.ranked.topStructure?.family, expected: '制用' },
      { label: '主線子類應為比劫制財', actual: snapshot => snapshot.ranked.topStructure?.subtype, expected: '比劫制財' },
      {
        label: '首步大運應為乙卯',
        actual: snapshot => `${snapshot.dayuns[0]?.gan ?? ''}${snapshot.dayuns[0]?.zhi ?? ''}`,
        expected: '乙卯',
      },
      {
        label: '首步大運應期應為反客為主',
        actual: snapshot => snapshot.dayunModes[0]?.mode,
        expected: '反客為主',
      },
    ],
  },
  {
    id: 'case-1974-0408-10-m',
    title: '1974/4/8 10時 男',
    input: { year: 1974, month: 4, day: 8, hour: 10, gender: 'male', name: '' },
    expected: [
      { label: '必須算出日主', actual: snapshot => snapshot.riZhu, expected: value => Boolean(value) },
      { label: '必須算出氣勢', actual: snapshot => snapshot.qishi.verdict, expected: value => Boolean(value) },
      { label: '必須算出賊捕', actual: snapshot => snapshot.catcher.verdict, expected: value => Boolean(value) },
      {
        label: '大運中應含癸酉',
        actual: snapshot => snapshot.dayuns.some(dayun => `${dayun.gan}${dayun.zhi}` === '癸酉'),
        expected: true,
      },
      {
        label: '癸酉運應有應期依據',
        actual: snapshot => {
          const target = snapshot.dayunModes.find(item => item.ganzhi === '癸酉');
          return (target?.evidence?.length ?? 0) > 0;
        },
        expected: true,
      },
    ],
  },
];

function buildSnapshot(input) {
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

  const dayunModes = dayuns.map(dayun => ({
    ganzhi: `${dayun.gan}${dayun.zhi}`,
    startYear: dayun.startYear,
    endYear: dayun.endYear,
    ...judgeYingQiWithDayun(dayun.gan, dayun.zhi, riZhu, qishi, structures, pillars),
  }));

  return {
    input,
    riZhu,
    qishi,
    catcher,
    structures,
    ranked,
    gongShenProfile,
    dayuns,
    dayunModes,
    ruleVersion: ENGINE_RULE_VERSION,
  };
}

function evaluateExpectation(snapshot, rule) {
  const value = typeof rule.actual === 'function' ? rule.actual(snapshot) : undefined;

  if (typeof rule.expected === 'function') {
    return { pass: Boolean(rule.expected(value)), value, expected: '符合條件' };
  }

  return { pass: value === rule.expected, value, expected: rule.expected };
}

function formatInput(input) {
  return `${input.year}/${input.month}/${input.day} ${input.hour}時 ${input.gender === 'male' ? '男' : '女'}`;
}

export default function CaseValidation({ currentInput, currentComputed, onApplyCase }) {
  const snapshots = useMemo(
    () =>
      CASES.map(item => ({
        ...item,
        snapshot: buildSnapshot(item.input),
      })),
    []
  );

  const activeSummary = {
    ganzhi: `${currentComputed.currentDayun?.gan ?? ''}${currentComputed.currentDayun?.zhi ?? ''}`,
    mode:
      currentComputed.yingqi?.find(
        item =>
          item.gan === currentComputed.currentDayun?.gan &&
          item.zhi === currentComputed.currentDayun?.zhi
      )?.mode?.mode ?? '未判定',
  };

  return (
    <div className="tab-content">
      <section className="section-card">
        <div className="section-title">目前輸入快照</div>
        <div className="case-current-grid">
          <div className="case-metric">
            <span className="case-metric-label">輸入</span>
            <strong>{formatInput(currentInput)}</strong>
          </div>
          <div className="case-metric">
            <span className="case-metric-label">日主</span>
            <strong>{currentComputed.riZhu}</strong>
          </div>
          <div className="case-metric">
            <span className="case-metric-label">氣勢</span>
            <strong>{currentComputed.qishi?.verdict}</strong>
          </div>
          <div className="case-metric">
            <span className="case-metric-label">賊捕</span>
            <strong>{currentComputed.catcher?.verdict}</strong>
          </div>
          <div className="case-metric">
            <span className="case-metric-label">主線</span>
            <strong>
              {currentComputed.ranked?.topStructure
                ? `${currentComputed.ranked.topStructure.type} / ${currentComputed.ranked.topStructure.subtype}`
                : '未判定'}
            </strong>
          </div>
          <div className="case-metric">
            <span className="case-metric-label">目前大運</span>
            <strong>
              {activeSummary.ganzhi} / {activeSummary.mode}
            </strong>
          </div>
        </div>
      </section>

      <section className="section-card">
        <div className="section-title">固定案例驗收</div>
        <div className="case-board">
          {snapshots.map(({ id, title, input, expected, snapshot }) => {
            const checks = expected.map(rule => ({
              label: rule.label,
              ...evaluateExpectation(snapshot, rule),
            }));
            const passCount = checks.filter(check => check.pass).length;

            return (
              <article key={id} className="case-card">
                <div className="case-card-head">
                  <div>
                    <div className="case-title">{title}</div>
                    <div className="case-subtitle">規則版 {snapshot.ruleVersion}</div>
                  </div>
                  <button className="btn-ghost small" onClick={() => onApplyCase(input)}>
                    套用案例
                  </button>
                </div>

                <div className="case-summary-grid">
                  <div className="case-mini">
                    <span>日主</span>
                    <strong>{snapshot.riZhu}</strong>
                  </div>
                  <div className="case-mini">
                    <span>氣勢</span>
                    <strong>{snapshot.qishi.verdict}</strong>
                  </div>
                  <div className="case-mini">
                    <span>賊捕</span>
                    <strong>{snapshot.catcher.verdict}</strong>
                  </div>
                  <div className="case-mini">
                    <span>主線</span>
                    <strong>{snapshot.ranked.topStructure?.subtype ?? '未判定'}</strong>
                  </div>
                </div>

                <div className="case-passline">
                  驗收結果：<b>{passCount}</b> / {checks.length} 通過
                </div>

                <div className="case-checks">
                  {checks.map(check => (
                    <div
                      key={`${id}-${check.label}`}
                      className={`case-check ${check.pass ? 'pass' : 'fail'}`}
                    >
                      <div className="case-check-title">{check.label}</div>
                      <div className="case-check-body">
                        <span>實際：{String(check.value)}</span>
                        <span>預期：{String(check.expected)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="case-dayun-preview">
                  {snapshot.dayunModes.slice(0, 4).map(item => (
                    <div key={`${id}-${item.ganzhi}`} className="case-dayun-chip">
                      <span>{item.ganzhi}</span>
                      <b>{item.mode}</b>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

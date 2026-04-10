import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { calcBaZi, calcDaYun } from './lib/calendar.js';
import {
  expandBaZi,
  scanGanHe,
  scanZhiInteractions,
  judgeQiShi,
  genDaiXiang,
  judgeCatcher,
  checkLu,
} from './lib/engine.js';
import { analyzeAllGongFu, rankGongFuMainLine } from './lib/analysis.js';
import { judgeYingQiWithDayun } from './lib/dayun.js';
import { analyzeGongShenProfile } from './lib/gongshen.js';
import { ENGINE_RULE_VERSION } from './lib/rulebook.js';
import {
  explainQiShi,
  explainCatcher,
  explainMainLine,
  explainGongShenProfile,
} from './lib/diagnostics.js';
import { generateLifeScript } from './lib/claude.js';
import BirthForm from './components/BirthForm.jsx';
import PillarCards from './components/PillarCards.jsx';
import TopologyGraph from './components/TopologyGraph.jsx';
import DayunTimeline from './components/DayunTimeline.jsx';
import CaseValidation from './components/CaseValidation.jsx';
import './App.css';

const TABS = [
  { id: 'pillars', label: '命盤取象' },
  { id: 'topology', label: '做功拓撲' },
  { id: 'timeline', label: '大運時間軸' },
  { id: 'cases', label: '案例驗收' },
];

const DEFAULT_INPUT = {
  year: 2026,
  month: 4,
  day: 8,
  hour: 9,
  gender: 'male',
  name: '',
};

function buildComputedState(input, currentYear) {
  const bazi = calcBaZi(input.year, input.month, input.day, input.hour);
  const pillars = expandBaZi(bazi);
  const riZhu = bazi.riZhu;

  const ganHe = scanGanHe(pillars);
  const zhiInter = scanZhiInteractions(pillars);
  const interactions = [...ganHe, ...zhiInter];

  const qishi = judgeQiShi(pillars, riZhu);
  const daiXiang = genDaiXiang(pillars);
  const lu = checkLu(riZhu, pillars);
  const catcher = judgeCatcher(qishi, pillars);

  const allGongFu = analyzeAllGongFu(pillars, riZhu, qishi, interactions);
  const ranked = rankGongFuMainLine(allGongFu, riZhu, pillars);
  const gongShenProfile = analyzeGongShenProfile(ranked);

  const qishiMeta = explainQiShi(qishi);
  const catcherMeta = explainCatcher(qishi, pillars, catcher);
  const mainLineMeta = explainMainLine(ranked);
  const gongShenMeta = explainGongShenProfile(gongShenProfile);

  const daYunResult = calcDaYun(
    input.gender,
    bazi,
    input.year,
    input.month,
    input.day,
    input.hour
  );

  const { dayuns, qiYunYears, qiYunMonths, jieName, jieDate, isForward } = daYunResult;
  const currentDayun =
    dayuns.find(dayun => currentYear >= dayun.startYear && currentYear < dayun.endYear) ??
    dayuns[0];

  const yingqi = dayuns.map(dayun => ({
    ...dayun,
    mode: judgeYingQiWithDayun(dayun.gan, dayun.zhi, riZhu, qishi, allGongFu, pillars),
  }));

  return {
    bazi,
    pillars,
    riZhu,
    interactions,
    qishi,
    daiXiang,
    lu,
    catcher,
    qishiMeta,
    catcherMeta,
    mainLineMeta,
    gongShenProfile,
    gongShenMeta,
    allGongFu,
    ranked,
    dayuns,
    currentDayun,
    yingqi,
    ruleVersion: ENGINE_RULE_VERSION,
    qiYunYears,
    qiYunMonths,
    jieName,
    jieDate,
    isForward,
  };
}

export default function App() {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [activeTab, setActiveTab] = useState('pillars');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('mp_apikey') ?? '');
  const [showSettings, setShowSettings] = useState(false);
  const [lifeScript, setLifeScript] = useState('');
  const [scriptLoading, setScriptLoading] = useState(false);
  const [scriptError, setScriptError] = useState('');
  const [currentYear, setCurrentYear] = useState(2026);
  const mainRef = useRef(null);

  // 切換 Tab 時滾回頂部
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  const computed = useMemo(() => {
    try {
      return buildComputedState(input, currentYear);
    } catch (error) {
      console.error(error);
      return { error: error.message };
    }
  }, [input, currentYear]);

  const handleGenerateScript = useCallback(async () => {
    if (!apiKey) {
      setScriptError('請先輸入 Anthropic API Key。');
      return;
    }

    setScriptLoading(true);
    setScriptError('');
    setLifeScript('');

    try {
      await generateLifeScript(
        apiKey,
        {
          pillars: computed.pillars,
          riZhu: computed.riZhu,
          qishi: computed.qishi,
          mainLine: computed.ranked,
          interactions: computed.interactions,
          dayuns: computed.dayuns,
          currentDayun: computed.currentDayun,
        },
        chunk => setLifeScript(prev => prev + chunk)
      );
    } catch (error) {
      setScriptError(error.message);
    } finally {
      setScriptLoading(false);
    }
  }, [apiKey, computed]);

  const handleSaveApiKey = key => {
    setApiKey(key);
    localStorage.setItem('mp_apikey', key);
    setShowSettings(false);
  };

  const handleApplyCase = useCallback(caseInput => {
    setInput(prev => ({ ...prev, ...caseInput }));
    setCurrentYear(caseInput.year);
    setActiveTab('timeline');
  }, []);

  if (computed.error) {
    return (
      <div style={{ color: '#ef4444', padding: '2rem', textAlign: 'center' }}>
        命盤計算失敗：{computed.error}
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <span className="logo-char">命</span>
          <div>
            <div className="app-title">盲派斷命引擎</div>
            <div className="app-subtitle">浩群數位科技 · MingPan Engine v3.2</div>
          </div>
        </div>
        <button className="icon-btn" onClick={() => setShowSettings(true)} title="設定">
          設
        </button>
      </header>

      <BirthForm input={input} onChange={setInput} />

      <nav className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="main-content" ref={mainRef}>
        {/* 精要摘要條：所有 Tab 共用，僅一行高，切換不影響 */}
        {computed.riZhu && (
          <div className="info-bar">
            <span className="info-chip">
              日主 <b>{computed.riZhu}</b>
            </span>
            <span className="info-chip">
              祿位 <b>{computed.lu?.lu}</b>
              <span style={{ color: computed.lu?.inLocal ? '#22c55e' : '#6b7280' }}>
                {computed.lu?.inLocal ? ' 在原局' : ' 不在原局'}
              </span>
            </span>
            <span className="info-chip">
              氣勢 <b>{computed.qishi?.verdict}</b>
            </span>
            <span className="info-chip">
              賊捕 <b>{computed.catcher?.verdict}</b>
            </span>
            <span className="info-chip">
              規則版 <b>{computed.ruleVersion}</b>
            </span>
          </div>
        )}

        {activeTab === 'pillars' && (
          <>
            {/* 詳細推理卡只在命盤取象 Tab 顯示，不阻擋其他 Tab */}
            {computed.riZhu && (
              <div className="explain-grid">
                <ExplainCard
                  title="氣勢判定"
                  verdict={computed.qishiMeta?.verdict}
                  summary={computed.qishiMeta?.summary}
                  evidence={computed.qishiMeta?.evidence}
                />
                <ExplainCard
                  title="賊捕判定"
                  verdict={computed.catcherMeta?.verdict}
                  summary={computed.catcherMeta?.summary}
                  evidence={computed.catcherMeta?.evidence}
                />
                <ExplainCard
                  title="做功主線"
                  verdict={computed.mainLineMeta?.verdict}
                  summary={computed.mainLineMeta?.summary}
                  evidence={computed.mainLineMeta?.evidence}
                />
                <ExplainCard
                  title="功神風險"
                  verdict={computed.gongShenMeta?.verdict}
                  summary={computed.gongShenMeta?.summary}
                  evidence={computed.gongShenMeta?.evidence}
                />
              </div>
            )}
            <PillarCards
              pillars={computed.pillars}
              riZhu={computed.riZhu}
              qishi={computed.qishi}
              daiXiang={computed.daiXiang}
              interactions={computed.interactions}
              lu={computed.lu}
            />
          </>
        )}

        {activeTab === 'topology' && (
          <TopologyGraph
            pillars={computed.pillars}
            riZhu={computed.riZhu}
            interactions={computed.interactions}
            ranked={computed.ranked}
            qishi={computed.qishi}
          />
        )}

        {activeTab === 'timeline' && (
          <DayunTimeline
            dayuns={computed.dayuns}
            yingqi={computed.yingqi}
            currentDayun={computed.currentDayun}
            ruleVersion={computed.ruleVersion}
            birthYear={input.year}
            currentYear={currentYear}
            onYearChange={setCurrentYear}
            riZhu={computed.riZhu}
            qishi={computed.qishi}
            qiYunYears={computed.qiYunYears}
            qiYunMonths={computed.qiYunMonths}
            jieName={computed.jieName}
            isForward={computed.isForward}
          />
        )}

        {activeTab === 'cases' && (
          <CaseValidation
            currentInput={input}
            currentComputed={computed}
            onApplyCase={handleApplyCase}
          />
        )}

        {activeTab === 'script' && (
          <section className="section-card">
            <div className="section-title">典籍敘事草稿</div>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <button className="btn-primary" onClick={handleGenerateScript} disabled={scriptLoading}>
                {scriptLoading ? '生成中...' : '生成典籍敘事'}
              </button>
              {scriptError && <span style={{ color: '#ef4444' }}>{scriptError}</span>}
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', color: '#d1d5db' }}>{lifeScript}</pre>
          </section>
        )}
      </main>

      <footer className="app-footer">© 2026 浩群數位科技</footer>

      {showSettings && (
        <SettingsPanel
          apiKey={apiKey}
          onSave={handleSaveApiKey}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

function ExplainCard({ title, verdict, summary, evidence = [] }) {
  return (
    <div className="explain-card">
      <div className="explain-title">{title}</div>
      <div className="explain-verdict">{verdict}</div>
      <div className="explain-summary">{summary}</div>
      <ul className="explain-list">
        {evidence.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function SettingsPanel({ apiKey, onSave, onClose }) {
  const [key, setKey] = useState(apiKey);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={event => event.stopPropagation()}>
        <h3 style={{ color: '#f1c40f', marginTop: 0 }}>設定</h3>
        <p className="field-label">Anthropic API Key</p>
        <input
          className="text-input full-width"
          type="password"
          value={key}
          onChange={event => setKey(event.target.value)}
          placeholder="sk-ant-api03-..."
        />
        <p style={{ color: '#6b7280', fontSize: '0.75rem', margin: '0.5rem 0 1rem' }}>
          API Key 只會儲存在本機瀏覽器的 localStorage。
        </p>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>
            取消
          </button>
          <button className="btn-primary" onClick={() => onSave(key)}>
            儲存
          </button>
        </div>
      </div>
    </div>
  );
}

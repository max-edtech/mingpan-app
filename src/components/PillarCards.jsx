import { WUXING_GRADIENT, WUXING_COLOR, ZHI_EMOJI, WUXING_SCENE } from '../constants/bazi.js';
import { getNaYin } from '../lib/engine.js';

const INTERACTION_LABELS = {
  天干五合: '天干五合',
  地支六合: '地支六合',
  地支六沖: '地支六沖',
  地支穿害: '地支穿害',
  暗合: '暗合',
  破: '地支相破',
  自刑: '自刑',
  三刑: '三刑',
  墓: '入墓',
  '憭拙僕鈭?': '天干五合',
  '?唳?剖?': '地支六合',
  '?唳?剜?': '地支六沖',
  '?唳蝛踹拿': '地支穿害',
  '??': '暗合',
  '銝?撅': '地支相破',
  '??': '自刑',
  '銝?': '三刑',
  '?貊': '入墓',
};

function normalizeInteractionType(type) {
  return INTERACTION_LABELS[type] ?? type;
}

function formatInteractionArrow(type) {
  const normalized = normalizeInteractionType(type);
  if (normalized === '地支六沖') return '沖';
  if (normalized === '地支穿害') return '穿';
  if (normalized === '暗合') return '暗合';
  if (normalized === '地支六合' || normalized === '天干五合') return '合';
  return '對';
}

function formatInteraction(interaction) {
  const left = `${interaction.a?.char ?? ''}${interaction.a?.pos ? `(${interaction.a.pos})` : ''}`;
  const right = `${interaction.b?.char ?? ''}${interaction.b?.pos ? `(${interaction.b.pos})` : ''}`;
  const label = normalizeInteractionType(interaction.type);
  const hua = interaction.hua ? `，化 ${interaction.hua}` : '';
  return `${left} ${formatInteractionArrow(interaction.type)} ${right}，${label}${hua}`;
}

function formatDaiXiangType(type) {
  const map = {
    蓋頭: '蓋頭',
    截腳: '截腳',
    干生支: '干生支',
    支生干: '支生干',
    比和: '比和',
    '?': '蓋頭',
    '?芾': '截腳',
    '撟脩???': '干生支',
    '?舐?撟?': '支生干',
    '瘥?': '比和',
  };

  return map[type] ?? type;
}

function formatCangRole(index) {
  return ['本氣', '中氣', '餘氣'][index] ?? '藏干';
}

export default function PillarCards({ pillars, riZhu, qishi, daiXiang, interactions, lu }) {
  if (!pillars?.length) return null;

  const interactionTypes = [
    '天干五合',
    '地支六合',
    '地支六沖',
    '地支穿害',
    '暗合',
    '地支相破',
    '自刑',
    '三刑',
    '入墓',
  ];

  return (
    <div className="tab-content">
      <div className="pillars-grid">
        {pillars.map(pillar => (
          <PillarCard key={pillar.pos} pillar={pillar} />
        ))}
      </div>

      {qishi && <QiShiPanel qishi={qishi} />}

      <Section title="帶象總覽">
        <div className="daixiang-grid">
          {daiXiang?.map(item => (
            <div key={item.pos} className="daixiang-card">
              <span className="pos-badge">{item.pos}柱</span>
              <span className="daixiang-type">{formatDaiXiangType(item.type)}</span>
              <span className="daixiang-desc">{item.desc}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title={`干支互動（共 ${interactions?.length ?? 0} 組）`}>
        <div className="interactions-list">
          {interactionTypes.map(type => {
            const group =
              interactions?.filter(interaction => normalizeInteractionType(interaction.type) === type) ?? [];
            if (!group.length) return null;

            return (
              <div key={type} className="interaction-group">
                <span className="inter-type-label">{type}</span>
                <div className="inter-items">
                  {group.map((interaction, index) => (
                    <div key={`${type}-${index}`} className="inter-item">
                      {formatInteraction(interaction)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="祿位資訊">
        <div className="lu-info">
          <span>
            日主 <b>{riZhu}</b> 的祿位在 <b style={{ color: '#f1c40f' }}>{lu?.lu}</b>
          </span>
          <span style={{ color: lu?.inLocal ? '#22c55e' : '#6b7280', marginLeft: '0.5rem' }}>
            {lu?.inLocal ? `落在原局：${lu.positions.join('、')}` : '原局未見祿位'}
          </span>
        </div>
      </Section>
    </div>
  );
}

function PillarCard({ pillar }) {
  const gradient = WUXING_GRADIENT[pillar.ganWuxing] ?? 'linear-gradient(135deg,#1a1a2e,#16213e)';
  const color = WUXING_COLOR[pillar.ganWuxing] ?? '#f1c40f';

  return (
    <div className="pillar-card" style={{ background: gradient }}>
      <div className="pillar-pos">{pillar.pos}柱</div>
      {pillar.isRiZhu && <div className="rizhu-badge">日主</div>}
      <div className="pillar-gan" style={{ color }}>
        {pillar.gan}
      </div>
      <div className="pillar-divider" />
      <div className="pillar-zhi-emoji">{ZHI_EMOJI[pillar.zhi]}</div>
      <div className="pillar-zhi">{pillar.zhi}</div>
      <div className="pillar-scene">{WUXING_SCENE[pillar.ganWuxing]}</div>

      {!pillar.isRiZhu && <div className="pillar-shishen">{pillar.ganShishen}</div>}

      <div className="nayin-badge">{getNaYin(pillar.gan, pillar.zhi)}</div>

      <div className="cang-gan">
        {pillar.cangGan?.map((cangGan, index) => (
          <span
            key={cangGan.gan}
            className="cang-item"
            style={{ color: WUXING_COLOR[cangGan.wuxing] }}
          >
            <small className="cang-role">{formatCangRole(index)}</small>
            {cangGan.gan}
            <small>{cangGan.shishen}</small>
          </span>
        ))}
      </div>
    </div>
  );
}

function QiShiPanel({ qishi }) {
  const maxForce = Math.max(...Object.values(qishi.force));

  return (
    <Section title={`氣勢判定：${qishi.verdict}`}>
      <div className="qishi-verdict">
        <span>
          主勢 <b style={{ color: '#f1c40f' }}>{qishi.host}</b>
        </span>
        {qishi.guest && (
          <span style={{ marginLeft: '1rem' }}>
            客勢 <b style={{ color: '#9ca3af' }}>{qishi.guest}</b>
          </span>
        )}
        {qishi.riZhuIsHost ? (
          <span className="badge-green" style={{ marginLeft: '1rem' }}>
            日主仍在主勢內
          </span>
        ) : (
          <span className="badge-red" style={{ marginLeft: '1rem' }}>
            日主已脫離主勢
          </span>
        )}
      </div>

      <div className="wuxing-bars">
        {qishi.ranked?.map(({ wx, f }) => (
          <div key={wx} className="wuxing-bar-row">
            <span className="wx-label" style={{ color: WUXING_COLOR[wx] }}>
              {wx}
            </span>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${(f / maxForce) * 100}%`,
                  background: WUXING_COLOR[wx],
                }}
              />
            </div>
            <span className="wx-val">{f.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Section({ title, children }) {
  return (
    <div className="section-card">
      <div className="section-title">{title}</div>
      {children}
    </div>
  );
}

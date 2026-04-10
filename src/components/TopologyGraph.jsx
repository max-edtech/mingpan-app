import { WUXING_COLOR } from '../constants/bazi.js';
import { EFFICIENCY } from '../lib/analysis.js';

const W = 360;
const H = 300;
const GAN_Y = 80;
const ZHI_Y = 200;
const POSITIONS = [60, 140, 220, 300];

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

function normalizeType(type) {
  return INTERACTION_LABELS[type] ?? type;
}

function buildColor(type, isMain) {
  const normalized = normalizeType(type);
  if (isMain) return { stroke: '#f1c40f', dash: '', glow: '#f1c40f' };
  if (normalized === '天干五合') return { stroke: '#f1c40f', dash: '', glow: '#f1c40f' };
  if (normalized === '地支六合') return { stroke: '#22c55e', dash: '', glow: '#22c55e' };
  if (normalized === '地支六沖') return { stroke: '#ef4444', dash: '4', glow: '#ef4444' };
  if (normalized === '地支穿害') return { stroke: '#f59e0b', dash: '2', glow: '#f59e0b' };
  if (normalized === '暗合') return { stroke: '#8b5cf6', dash: '6 2', glow: '#8b5cf6' };
  return { stroke: '#64748b', dash: '', glow: '#64748b' };
}

export default function TopologyGraph({ pillars, interactions, ranked }) {
  if (!pillars?.length) return null;

  const { mainLine = [], auxiliary = [], topStructure } = ranked ?? {};
  const activeActors = new Set(mainLine.flatMap(structure => structure.actors ?? []));

  const ganNodes = pillars.map((pillar, index) => ({
    id: `gan_${index}`,
    pos: pillar.pos,
    char: pillar.gan,
    wx: pillar.ganWuxing,
    x: POSITIONS[index],
    y: GAN_Y,
    isDay: pillar.isRiZhu,
    isActive: activeActors.has(pillar.gan),
  }));

  const zhiNodes = pillars.map((pillar, index) => ({
    id: `zhi_${index}`,
    pos: pillar.pos,
    char: pillar.zhi,
    wx: pillar.zhiWuxing,
    x: POSITIONS[index],
    y: ZHI_Y,
    isDay: pillar.isRiZhu,
    isActive: activeActors.has(pillar.zhi),
  }));

  const mainLinePositions = new Set(
    mainLine.flatMap(structure => {
      if (structure.a?.pos && structure.b?.pos) {
        return [`${structure.a.pos}-${structure.b.pos}`, `${structure.b.pos}-${structure.a.pos}`];
      }

      return [];
    })
  );

  const lines = [];

  interactions?.forEach((interaction, index) => {
    if (!interaction.a?.char || !interaction.b?.char) return;

    const normalized = normalizeType(interaction.type);
    const isGanInteraction = normalized === '天干五合';
    const nodeA = (isGanInteraction ? ganNodes : zhiNodes).find(node => node.char === interaction.a.char);
    const nodeB = (isGanInteraction ? ganNodes : zhiNodes).find(node => node.char === interaction.b.char);

    if (!nodeA || !nodeB) return;

    const posKey = `${interaction.a.pos}-${interaction.b.pos}`;
    const isMain = mainLinePositions.has(posKey);
    const visual = buildColor(interaction.type, isMain);
    const mx = (nodeA.x + nodeB.x) / 2;
    // 弧度隨跨度縮放：跨越愈多柱，曲線彎曲愈深，避免標籤落在中間節點位置造成誤讀
    const span = Math.abs(nodeB.x - nodeA.x);
    const curveDepth = 28 + span * 0.14;
    const my = isGanInteraction ? GAN_Y - curveDepth : ZHI_Y + curveDepth;
    const path = `M ${nodeA.x} ${nodeA.y} Q ${mx} ${my} ${nodeB.x} ${nodeB.y}`;

    lines.push({
      key: `line_${index}`,
      nodeA,
      nodeB,
      mx,
      my,
      path,
      label: normalized,
      isMain,
      ...visual,
    });
  });

  const ambientDots = [
    { cx: 36, cy: 36, delay: '0s' },
    { cx: 82, cy: 220, delay: '0.7s' },
    { cx: 156, cy: 42, delay: '1.6s' },
    { cx: 218, cy: 248, delay: '2.1s' },
    { cx: 320, cy: 68, delay: '0.9s' },
    { cx: 288, cy: 186, delay: '2.8s' },
  ];

  const stemLines = pillars.map((_, index) => ({
    key: `stem_${index}`,
    x: POSITIONS[index],
    y1: GAN_Y + 18,
    y2: ZHI_Y - 18,
  }));

  return (
    <div className="tab-content">
      <div className="topology-wrap topology-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="topology-svg">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="topologyBeam" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.55)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>

          <rect className="topology-grid-pulse" x="0" y="0" width={W} height={H} rx="12" />

          {ambientDots.map(dot => (
            <circle
              key={`${dot.cx}-${dot.cy}`}
              className="topology-ambient-dot"
              cx={dot.cx}
              cy={dot.cy}
              r="2.2"
              style={{ animationDelay: dot.delay }}
            />
          ))}

          {stemLines.map(line => (
            <line
              key={line.key}
              x1={line.x}
              y1={line.y1}
              x2={line.x}
              y2={line.y2}
              className="topology-pillar-link"
            />
          ))}

          {lines.map(line => {
            const isGan = line.nodeA.y < 150;
            const labelY = isGan ? line.my + 10 : line.my - 6;
            const dotA = {
              x: line.nodeA.x + (line.nodeB.x - line.nodeA.x) * 0.34,
              y: line.nodeA.y + (line.nodeB.y - line.nodeA.y) * 0.34,
            };
            const dotB = {
              x: line.nodeA.x + (line.nodeB.x - line.nodeA.x) * 0.68,
              y: line.nodeA.y + (line.nodeB.y - line.nodeA.y) * 0.68,
            };

            return (
              <g key={line.key}>
                {line.isMain && (
                  <path d={line.path} fill="none" stroke={line.glow} strokeWidth="7" opacity="0.14" />
                )}
                <path
                  d={line.path}
                  fill="none"
                  stroke={line.stroke}
                  strokeWidth={line.isMain ? 2.6 : 1.5}
                  strokeDasharray={line.dash}
                  opacity={line.isMain ? 1 : 0.68}
                  className={line.isMain ? 'topology-main-link' : 'topology-link'}
                />
                {line.isMain && (
                  <path
                    d={line.path}
                    fill="none"
                    stroke="url(#topologyBeam)"
                    strokeWidth="3"
                    className="topology-main-beam"
                  />
                )}
                <text
                  x={line.mx}
                  y={labelY}
                  textAnchor="middle"
                  fill={line.stroke}
                  fontSize="8"
                  opacity="0.88"
                  style={{ pointerEvents: 'none' }}
                >
                  {line.label}
                </text>
                <circle
                  cx={dotA.x}
                  cy={dotA.y}
                  r={line.isMain ? 3.5 : 2.4}
                  fill={line.stroke}
                  filter="url(#glow)"
                  className={line.isMain ? 'topology-hotspot topology-hotspot-main' : 'topology-hotspot'}
                />
                <circle
                  cx={dotB.x}
                  cy={dotB.y}
                  r={line.isMain ? 2.8 : 2}
                  fill={line.stroke}
                  filter="url(#glow)"
                  className="topology-hotspot topology-hotspot-late"
                />
              </g>
            );
          })}

          {ganNodes.map(node => (
            <g key={node.id} className={node.isActive ? 'topology-node-active' : ''}>
              {node.isActive && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="26"
                  className="topology-node-ring"
                  style={{ stroke: WUXING_COLOR[node.wx] ?? '#f1c40f' }}
                />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r="18"
                fill={node.isDay ? '#1a1a2e' : '#111827'}
                stroke={WUXING_COLOR[node.wx] ?? '#374151'}
                strokeWidth={node.isDay ? 2.5 : 1.5}
                filter={node.isDay || node.isActive ? 'url(#glow)' : ''}
              />
              {node.isActive && (
                <circle
                  cx={node.x + 18}
                  cy={node.y}
                  r="3.2"
                  fill={WUXING_COLOR[node.wx] ?? '#f1c40f'}
                  className="topology-orbit-dot"
                />
              )}
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={WUXING_COLOR[node.wx] ?? '#f1c40f'}
                fontSize={node.isDay ? '16' : '14'}
                fontFamily="Noto Serif TC, serif"
              >
                {node.char}
              </text>
              <text x={node.x} y={node.y + 30} textAnchor="middle" fill="#6b7280" fontSize="10">
                {node.pos}
              </text>
            </g>
          ))}

          {zhiNodes.map(node => (
            <g key={node.id} className={node.isActive ? 'topology-node-active' : ''}>
              {node.isActive && (
                <rect
                  x={node.x - 25}
                  y={node.y - 25}
                  width="50"
                  height="50"
                  rx="10"
                  className="topology-node-ring"
                  style={{ stroke: WUXING_COLOR[node.wx] ?? '#f1c40f' }}
                />
              )}
              <rect
                x={node.x - 18}
                y={node.y - 18}
                width="36"
                height="36"
                rx="4"
                fill={node.isDay ? '#1a1a2e' : '#111827'}
                stroke={WUXING_COLOR[node.wx] ?? '#374151'}
                strokeWidth={node.isDay ? 2.5 : 1.5}
                filter={node.isDay || node.isActive ? 'url(#glow)' : ''}
              />
              {node.isActive && (
                <circle
                  cx={node.x + 18}
                  cy={node.y}
                  r="3.2"
                  fill={WUXING_COLOR[node.wx] ?? '#f1c40f'}
                  className="topology-orbit-dot"
                />
              )}
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={WUXING_COLOR[node.wx] ?? '#e5e7eb'}
                fontSize="14"
                fontFamily="Noto Serif TC, serif"
              >
                {node.char}
              </text>
            </g>
          ))}

          <text x="10" y="25" fill="#6b7280" fontSize="10">
            天干
          </text>
          <text x="10" y="215" fill="#6b7280" fontSize="10">
            地支
          </text>
        </svg>
      </div>

      <div className="section-card">
        <div className="section-title">做功主線</div>
        {topStructure ? (
          <div className="main-structure main-structure-highlight">
            <span className="main-badge">主線</span>
            <span className="struct-type">{topStructure.type}</span>
            <span className="struct-sub">子類 {topStructure.subtype}</span>
            <span
              className="eff-badge"
              style={{
                background: `${EFFICIENCY[topStructure.efficiency]?.color}22`,
                color: EFFICIENCY[topStructure.efficiency]?.color,
                border: `1px solid ${EFFICIENCY[topStructure.efficiency]?.color}`,
              }}
            >
              {EFFICIENCY[topStructure.efficiency]?.label}
            </span>
            <p className="struct-desc">{topStructure.desc}</p>
          </div>
        ) : (
          <p style={{ color: '#6b7280' }}>目前尚未選出明確主線。</p>
        )}

        {mainLine.slice(1).map((structure, index) => (
          <div key={index} className="main-structure" style={{ opacity: 0.82 }}>
            <span className="main-badge" style={{ background: '#374151' }}>
              次主線
            </span>
            <span className="struct-type">{structure.type}</span>
            <span className="struct-sub">子類 {structure.subtype}</span>
            <span
              className="eff-badge"
              style={{
                background: `${EFFICIENCY[structure.efficiency]?.color}22`,
                color: EFFICIENCY[structure.efficiency]?.color,
                border: `1px solid ${EFFICIENCY[structure.efficiency]?.color}`,
              }}
            >
              {EFFICIENCY[structure.efficiency]?.label}
            </span>
            <p className="struct-desc">{structure.desc}</p>
          </div>
        ))}
      </div>

      {auxiliary.length > 0 && (
        <div className="section-card">
          <div className="section-title">輔助結構</div>
          <div className="aux-list">
            {auxiliary.map((structure, index) => (
              <div key={index} className="aux-item">
                <span className="struct-type-sm">
                  {structure.type} / {structure.subtype}
                </span>
                <span className="eff-sm" style={{ color: EFFICIENCY[structure.efficiency]?.color }}>
                  {EFFICIENCY[structure.efficiency]?.label}
                </span>
                <span className="aux-desc">{structure.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  WUXING_COLOR,
  ZHI_EMOJI,
  GAN_WUXING,
  ZHI_WUXING,
  TIAN_GAN,
  DI_ZHI,
  WUXING_KE,
  WUXING_SHENG,
} from '../constants/bazi.js';

function getLiuNianGanZhi(year) {
  const ganIndex = ((year - 4) % 10 + 10) % 10;
  const zhiIndex = ((year - 4) % 12 + 12) % 12;
  return { gan: TIAN_GAN[ganIndex], zhi: DI_ZHI[zhiIndex] };
}

const ZHI_SEASON = {
  寅: '春風拂面',
  卯: '春風拂面',
  辰: '厚土轉換',
  巳: '暑氣蒸騰',
  午: '暑氣蒸騰',
  未: '厚土轉換',
  申: '秋意蕭瑟',
  酉: '秋意蕭瑟',
  戌: '厚土轉換',
  亥: '寒氣凜冽',
  子: '寒氣凜冽',
  丑: '厚土轉換',
};

const ZHI_SEASON_CLASS = {
  寅: 'spring',
  卯: 'spring',
  辰: 'earth',
  巳: 'summer',
  午: 'summer',
  未: 'earth',
  申: 'autumn',
  酉: 'autumn',
  戌: 'earth',
  亥: 'winter',
  子: 'winter',
  丑: 'earth',
};

const WX_CLASS = {
  木: 'mu',
  火: 'huo',
  土: 'tu',
  金: 'jin',
  水: 'shui',
};

const MODE_COLOR = {
  平穩: '#22c55e',
  找藥: '#3b82f6',
  找病: '#ef4444',
  反客為主: '#f1c40f',
};

const MODE_DESC = {
  平穩: '節奏穩定',
  找藥: '外力補足',
  找病: '病點引動',
  反客為主: '賓主翻轉',
};

const STEM_SCENE_BASE = {
  甲: '巨木參天',
  乙: '藤蔓攀援',
  丙: '烈日當空',
  丁: '燈火搖曳',
  戊: '高山巍峨',
  己: '田園沃土',
  庚: '刀劍出鞘',
  辛: '珠玉瑩潤',
  壬: '大海奔湧',
  癸: '雲霧瀰漫',
};

const DAIX_SCENE_SUFFIX = {
  gaitou: '壓抑受制',
  jiejiao: '根基動搖',
  gansheng: '能量下注',
  zhisheng: '根基上托',
  bihe: '力量集中',
};

const ELEMENT_THEME = {
  木: {
    primary: '#0a2512',
    secondary: '#06110a',
    highlight: 'rgba(114, 227, 145, 0.16)',
    branch: 'rgba(61, 132, 73, 0.30)',
    haze: 'rgba(183, 255, 203, 0.08)',
  },
  火: {
    primary: '#42110a',
    secondary: '#150605',
    highlight: 'rgba(255, 182, 70, 0.18)',
    branch: 'rgba(237, 104, 52, 0.30)',
    haze: 'rgba(255, 216, 138, 0.10)',
  },
  土: {
    primary: '#372013',
    secondary: '#140c07',
    highlight: 'rgba(232, 184, 115, 0.14)',
    branch: 'rgba(152, 105, 61, 0.32)',
    haze: 'rgba(255, 231, 181, 0.08)',
  },
  金: {
    primary: '#2d2e38',
    secondary: '#101116',
    highlight: 'rgba(255, 226, 156, 0.16)',
    branch: 'rgba(205, 173, 92, 0.30)',
    haze: 'rgba(255, 247, 213, 0.12)',
  },
  水: {
    primary: '#0b1d44',
    secondary: '#020a17',
    highlight: 'rgba(92, 156, 255, 0.16)',
    branch: 'rgba(46, 88, 163, 0.30)',
    haze: 'rgba(177, 214, 255, 0.10)',
  },
};

const PARTICLE_LAYOUTS = {
  mu: [
    { left: '12%', top: '10%', size: '10px', dx: '-18px', dy: '122px', duration: '10s', delay: '0s', rotate: '-180deg' },
    { left: '28%', top: '2%', size: '8px', dx: '14px', dy: '116px', duration: '9s', delay: '1.2s', rotate: '160deg' },
    { left: '41%', top: '16%', size: '9px', dx: '-12px', dy: '112px', duration: '10.8s', delay: '2.4s', rotate: '-140deg' },
    { left: '57%', top: '6%', size: '11px', dx: '16px', dy: '126px', duration: '9.6s', delay: '0.8s', rotate: '190deg' },
    { left: '74%', top: '14%', size: '8px', dx: '-14px', dy: '118px', duration: '11s', delay: '1.8s', rotate: '-210deg' },
    { left: '86%', top: '4%', size: '9px', dx: '12px', dy: '124px', duration: '10.4s', delay: '3s', rotate: '170deg' },
  ],
  huo: [
    { left: '16%', top: '74%', size: '5px', dx: '-6px', dy: '-92px', duration: '4.2s', delay: '0s', rotate: '0deg' },
    { left: '29%', top: '68%', size: '6px', dx: '8px', dy: '-88px', duration: '4.8s', delay: '0.9s', rotate: '0deg' },
    { left: '43%', top: '78%', size: '4px', dx: '-8px', dy: '-96px', duration: '4.1s', delay: '1.7s', rotate: '0deg' },
    { left: '57%', top: '70%', size: '6px', dx: '10px', dy: '-90px', duration: '5s', delay: '0.4s', rotate: '0deg' },
    { left: '72%', top: '76%', size: '5px', dx: '-7px', dy: '-98px', duration: '4.5s', delay: '1.4s', rotate: '0deg' },
    { left: '84%', top: '66%', size: '4px', dx: '7px', dy: '-82px', duration: '4.4s', delay: '2.1s', rotate: '0deg' },
  ],
  tu: [
    { left: '14%', top: '28%', size: '4px', dx: '10px', dy: '-8px', duration: '7.4s', delay: '0s', rotate: '0deg' },
    { left: '24%', top: '42%', size: '5px', dx: '-12px', dy: '6px', duration: '8.6s', delay: '1.1s', rotate: '0deg' },
    { left: '38%', top: '24%', size: '3px', dx: '8px', dy: '4px', duration: '7.9s', delay: '2.2s', rotate: '0deg' },
    { left: '52%', top: '36%', size: '4px', dx: '-10px', dy: '-5px', duration: '8.8s', delay: '0.6s', rotate: '0deg' },
    { left: '66%', top: '20%', size: '5px', dx: '12px', dy: '8px', duration: '7.7s', delay: '1.9s', rotate: '0deg' },
    { left: '80%', top: '34%', size: '3px', dx: '-8px', dy: '6px', duration: '8.2s', delay: '2.8s', rotate: '0deg' },
  ],
  jin: [
    { left: '12%', top: '18%', size: '7px', dx: '4px', dy: '-18px', duration: '5.6s', delay: '0s', rotate: '45deg' },
    { left: '24%', top: '12%', size: '5px', dx: '-4px', dy: '16px', duration: '6.2s', delay: '0.8s', rotate: '45deg' },
    { left: '38%', top: '24%', size: '6px', dx: '6px', dy: '-14px', duration: '5.4s', delay: '1.7s', rotate: '45deg' },
    { left: '51%', top: '10%', size: '7px', dx: '-5px', dy: '18px', duration: '6.5s', delay: '0.5s', rotate: '45deg' },
    { left: '64%', top: '26%', size: '5px', dx: '5px', dy: '-16px', duration: '5.8s', delay: '1.5s', rotate: '45deg' },
    { left: '78%', top: '14%', size: '6px', dx: '-4px', dy: '14px', duration: '6.1s', delay: '2.4s', rotate: '45deg' },
  ],
  shui: [
    { left: '14%', top: '84%', size: '8px', dx: '-6px', dy: '-88px', duration: '7.2s', delay: '0s', rotate: '0deg' },
    { left: '26%', top: '78%', size: '6px', dx: '5px', dy: '-80px', duration: '6.6s', delay: '1s', rotate: '0deg' },
    { left: '41%', top: '86%', size: '9px', dx: '-4px', dy: '-92px', duration: '7.8s', delay: '1.9s', rotate: '0deg' },
    { left: '56%', top: '80%', size: '7px', dx: '6px', dy: '-86px', duration: '7s', delay: '0.7s', rotate: '0deg' },
    { left: '69%', top: '88%', size: '8px', dx: '-5px', dy: '-94px', duration: '7.4s', delay: '1.6s', rotate: '0deg' },
    { left: '83%', top: '82%', size: '6px', dx: '4px', dy: '-84px', duration: '6.8s', delay: '2.7s', rotate: '0deg' },
  ],
};

function getDaiXiangType(gan, zhi) {
  const ganWx = GAN_WUXING[gan] ?? '';
  const zhiWx = ZHI_WUXING[zhi] ?? '';

  if (WUXING_KE[ganWx] === zhiWx) return 'gaitou';
  if (WUXING_KE[zhiWx] === ganWx) return 'jiejiao';
  if (WUXING_SHENG[ganWx] === zhiWx) return 'gansheng';
  if (WUXING_SHENG[zhiWx] === ganWx) return 'zhisheng';
  return 'bihe';
}

function buildSceneStyle(ganWx, zhiWx) {
  const primary = ELEMENT_THEME[ganWx] ?? ELEMENT_THEME.土;
  const branch = ELEMENT_THEME[zhiWx] ?? primary;

  return {
    '--scene-primary': primary.primary,
    '--scene-secondary': primary.secondary,
    '--scene-highlight': primary.highlight,
    '--scene-branch': branch.branch,
    '--scene-haze': branch.haze,
  };
}

function buildSceneCopy(gan, zhi, daiXiang) {
  const base = STEM_SCENE_BASE[gan] ?? '氣象未明';
  const season = ZHI_SEASON[zhi] ?? '四時交替';
  const modifier = DAIX_SCENE_SUFFIX[daiXiang] ?? '氣場變化';
  return `${base}，${season}，${modifier}`;
}

function SceneMu({ season }) {
  const isSpring = season === 'spring';

  return (
    <svg className="scene-svg" viewBox="0 0 360 120" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="gMuSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06170c" />
          <stop offset="55%" stopColor="#0b2b16" />
          <stop offset="100%" stopColor="#071109" />
        </linearGradient>
      </defs>
      <rect width="360" height="120" fill="url(#gMuSky)" />
      <ellipse cx="270" cy="20" rx="56" ry="24" fill="#8de78e" opacity="0.08" />
      {isSpring && <circle cx="298" cy="18" r="10" fill="#d9f99d" opacity="0.16" />}

      {/* 左樹 — 絕對座標，trunk 底在 y=120，CSS transform-box:fill-box 可正確以樹根為軸 */}
      <g className="scene-tree tree-l">
        <polygon points="68,58 50,94 86,94" fill="#1b4d2a" opacity="0.80" />
        <polygon points="68,78 54,108 82,108" fill="#1e5c30" opacity="0.90" />
        <rect x="64" y="109" width="8" height="11" fill="#152b18" opacity="0.74" />
      </g>

      {/* 中樹 — 最高 */}
      <g className="scene-tree tree-m">
        <polygon points="175,32 149,86 201,86" fill="#164022" opacity="0.84" />
        <polygon points="175,62 155,104 195,104" fill="#1b5229" opacity="0.93" />
        <rect x="169" y="106" width="12" height="14" fill="#102018" opacity="0.80" />
      </g>

      {/* 右樹 — 中等高度 */}
      <g className="scene-tree tree-r">
        <polygon points="292,48 271,91 313,91" fill="#1a4d26" opacity="0.78" />
        <polygon points="292,70 276,107 308,107" fill="#1e5c2e" opacity="0.88" />
        <rect x="288" y="109" width="8" height="11" fill="#142618" opacity="0.72" />
      </g>

      {isSpring && (
        <>
          <circle cx="58" cy="94" r="5" fill="#d9f99d" opacity="0.14" />
          <circle cx="182" cy="88" r="7" fill="#bbf7d0" opacity="0.11" />
          <circle cx="304" cy="92" r="4" fill="#d9f99d" opacity="0.13" />
        </>
      )}
    </svg>
  );
}

function SceneHuo({ season }) {
  const isSummer = season === 'summer';
  const sunY = 18;
  const sunR = 13;
  const sunColor = isSummer ? '#fcd34d' : '#fb923c';
  const rayColor = isSummer ? '#fdba74' : '#f59e0b';
  const rayLen = 44;
  const rays = Array.from({ length: 12 }, (_, index) => {
    const angle = ((index * 30 - 90) * Math.PI) / 180;
    return { x: Math.cos(angle) * rayLen, y: Math.sin(angle) * rayLen };
  });

  return (
    <svg className="scene-svg" viewBox="0 0 360 120" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="gHuoSky" cx="50%" cy="18%" r="78%">
          <stop offset="0%" stopColor={isSummer ? '#6a1f09' : '#58110c'} />
          <stop offset="60%" stopColor="#240707" />
          <stop offset="100%" stopColor="#100404" />
        </radialGradient>
      </defs>
      <rect width="360" height="120" fill="url(#gHuoSky)" />
      <circle cx="180" cy={sunY} r="40" fill={sunColor} opacity="0.08" />
      <circle cx="180" cy={sunY} r="28" fill={sunColor} opacity="0.12" />
      <g transform={`translate(180,${sunY})`} className="sun-rays-g">
        {rays.map(({ x, y }, index) => (
          <line
            key={index}
            x1="0"
            y1="0"
            x2={x}
            y2={y}
            stroke={rayColor}
            strokeWidth="1.4"
            opacity="0.48"
          />
        ))}
      </g>
      <circle className="sun-core-c" cx="180" cy={sunY} r={sunR} fill={sunColor} opacity="0.95" />
    </svg>
  );
}

function SceneTu() {
  return (
    <svg className="scene-svg" viewBox="0 0 360 120" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="gTuSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#140c07" />
          <stop offset="54%" stopColor="#2f1b11" />
          <stop offset="100%" stopColor="#4b2d19" />
        </linearGradient>
      </defs>
      <rect width="360" height="120" fill="url(#gTuSky)" />
      <ellipse cx="130" cy="42" rx="90" ry="22" fill="#ffdf9b" opacity="0.06" />
      <rect className="tu-mist" x="-20" y="56" width="400" height="22" fill="#d6b37a" opacity="0.08" rx="10" />
    </svg>
  );
}

function SceneJin() {
  return (
    <svg className="scene-svg" viewBox="0 0 360 120" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="gJinSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#11131b" />
          <stop offset="50%" stopColor="#1c2029" />
          <stop offset="100%" stopColor="#0c0d13" />
        </linearGradient>
        <linearGradient id="gJinSheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff7d1" stopOpacity="0" />
          <stop offset="50%" stopColor="#fff7d1" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fff7d1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="360" height="120" fill="url(#gJinSky)" />
      {[18, 36, 54, 72, 90, 108].map(y => (
        <line key={y} x1="0" y1={y} x2="360" y2={y} stroke="#7c8594" strokeWidth="0.45" opacity="0.16" />
      ))}
      {[60, 120, 180, 240, 300].map(x => (
        <line key={x} x1={x} y1="0" x2={x} y2="120" stroke="#7c8594" strokeWidth="0.35" opacity="0.09" />
      ))}
      <rect className="jin-sheen" x="-220" y="0" width="220" height="120" fill="url(#gJinSheen)" />
    </svg>
  );
}

function SceneShui() {
  const wavePath1 = offset =>
    `M${offset} 80 Q${offset + 45} 64 ${offset + 90} 80 Q${offset + 135} 96 ${offset + 180} 80 Q${offset + 225} 64 ${offset + 270} 80 Q${offset + 315} 96 ${offset + 360} 80 L${offset + 360} 120 L${offset} 120 Z`;
  const wavePath2 = offset =>
    `M${offset} 92 Q${offset + 45} 80 ${offset + 90} 92 Q${offset + 135} 104 ${offset + 180} 92 Q${offset + 225} 80 ${offset + 270} 92 Q${offset + 315} 104 ${offset + 360} 92 L${offset + 360} 120 L${offset} 120 Z`;

  return (
    <div className="scene-wave-host">
      <svg className="wave-wrap" viewBox="0 0 720 120">
        <defs>
          <linearGradient id="gShuiSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#020c1f" />
            <stop offset="55%" stopColor="#061531" />
            <stop offset="100%" stopColor="#081e47" />
          </linearGradient>
        </defs>
        <rect width="720" height="120" fill="url(#gShuiSky)" />
        <ellipse cx="180" cy="22" rx="84" ry="22" fill="#7fb2ff" opacity="0.08" />
        <ellipse cx="540" cy="20" rx="70" ry="20" fill="#7fb2ff" opacity="0.06" />
        <path d={wavePath1(0)} fill="#2357b8" opacity="0.5" />
        <path d={wavePath1(360)} fill="#2357b8" opacity="0.5" />
        <path d={wavePath2(0)} fill="#183269" opacity="0.66" />
        <path d={wavePath2(360)} fill="#183269" opacity="0.66" />
      </svg>
    </div>
  );
}

function SceneLayer({ ganWx, season }) {
  return (
    <div className="scene-svg-layer">
      {ganWx === '木' && <SceneMu season={season} />}
      {ganWx === '火' && <SceneHuo season={season} />}
      {ganWx === '土' && <SceneTu />}
      {ganWx === '金' && <SceneJin />}
      {ganWx === '水' && <SceneShui />}
    </div>
  );
}

function SceneParticles({ wuxing, count }) {
  const elementClass = WX_CLASS[wuxing];
  const particles = (PARTICLE_LAYOUTS[elementClass] ?? []).slice(0, count);
  if (!elementClass || !particles.length) return null;

  return (
    <div className={`scene-particles particles-${elementClass}`}>
      {particles.map((particle, index) => (
        <span
          key={`${elementClass}-${index}`}
          className={`scene-particle particle-${elementClass}`}
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            '--drift-x': particle.dx,
            '--drift-y': particle.dy,
            '--duration': particle.duration,
            '--delay': particle.delay,
            '--rotate-end': particle.rotate,
          }}
        />
      ))}
    </div>
  );
}

function getModeMeta(mode) {
  const label = mode?.mode ?? '平穩';
  return {
    label,
    color: MODE_COLOR[label] ?? '#22c55e',
    desc: mode?.desc ?? MODE_DESC[label] ?? '節奏穩定',
  };
}

export default function DayunTimeline({
  dayuns,
  yingqi,
  currentDayun,
  ruleVersion,
  birthYear,
  currentYear,
  onYearChange,
  qiYunYears,
  qiYunMonths,
  jieName,
  isForward,
}) {
  const [viewStartYear, setViewStartYear] = useState(null);
  // localYear 供滑桿即時顯示用，不觸發全域重算
  const [localYear, setLocalYear] = useState(currentYear);

  // 當外部 currentYear 更新（點擊大運步驟等），同步 localYear
  useEffect(() => {
    setLocalYear(currentYear);
  }, [currentYear]);

  const activeDayun = useMemo(() => {
    if (!yingqi?.length) return null;
    return (
      yingqi.find(dayun => dayun.startYear === (viewStartYear ?? currentDayun?.startYear)) ?? yingqi[0]
    );
  }, [currentDayun?.startYear, viewStartYear, yingqi]);

  if (!dayuns?.length || !activeDayun) return null;

  const clampYearToDayun = (year, dayun) => Math.min(dayun.endYear - 1, Math.max(dayun.startYear, year));
  const currentAge = currentYear - birthYear;
  const ganWx = GAN_WUXING[activeDayun.gan];
  const zhiWx = ZHI_WUXING[activeDayun.zhi];
  const season = ZHI_SEASON[activeDayun.zhi] ?? '四時交替';
  const seasonClass = ZHI_SEASON_CLASS[activeDayun.zhi] ?? 'earth';
  const daiXiang = getDaiXiangType(activeDayun.gan, activeDayun.zhi);
  const particleCount = Math.min(daiXiang === 'bihe' ? 10 : 6, 10);
  const sceneStyle = buildSceneStyle(ganWx, zhiWx);
  const sceneCopy = buildSceneCopy(activeDayun.gan, activeDayun.zhi, daiXiang);
  const liuNian = getLiuNianGanZhi(currentYear);
  const liuNianGanWx = GAN_WUXING[liuNian.gan];
  const liuNianZhiWx = ZHI_WUXING[liuNian.zhi];
  const qiYunXAge = qiYunYears + 1;
  const qiYunYear = birthYear + qiYunYears;
  const isViewingOther = viewStartYear && viewStartYear !== currentDayun?.startYear;
  const ganClass = WX_CLASS[ganWx] ?? 'tu';
  const zhiClass = WX_CLASS[zhiWx] ?? 'tu';
  const activeMode = activeDayun.mode ?? null;
  const activeEvidence = activeMode?.evidence ?? activeMode?.basis ?? [];
  const confidenceText = activeMode?.confidence ? `${Math.round(activeMode.confidence * 100)}%` : null;
  const currentOffset = currentDayun ? Math.max(0, Math.min(9, currentYear - currentDayun.startYear)) : 0;
  const modeMeta = getModeMeta(activeMode);

  // onChange：只更新本地顯示，不觸發全域重算
  const handleYearSliderChange = useCallback(year => {
    setLocalYear(year);
    const matchingDayun = yingqi.find(dayun => year >= dayun.startYear && year < dayun.endYear);
    setViewStartYear(matchingDayun?.startYear ?? null);
  }, [yingqi]);

  // onMouseUp/onTouchEnd：釋放時才觸發全域重算（一次）
  const handleYearSliderCommit = useCallback(() => {
    onYearChange(localYear);
  }, [onYearChange, localYear]);

  const handleSelectDayun = dayun => {
    const offsetWithinTarget =
      currentYear >= dayun.startYear && currentYear < dayun.endYear
        ? currentYear - dayun.startYear
        : currentOffset;
    const nextYear = clampYearToDayun(dayun.startYear + offsetWithinTarget, dayun);
    setViewStartYear(dayun.startYear);
    onYearChange(nextYear);
  };

  return (
    <div className="tab-content">
      <div className="qiyun-bar">
        <span className="qiyun-label">起運資訊</span>
        <span className="qiyun-age">{qiYunXAge} 歲起運</span>
        <span className="qiyun-year">起運年份 {qiYunYear} 年</span>
        <span className="qiyun-detail">
          起運差 {qiYunYears} 年 {qiYunMonths} 個月
        </span>
        <span className="qiyun-jie">
          {isForward ? '順排' : '逆排'} · 節氣 {jieName}
        </span>
      </div>

      <div
        className={`current-dayun-card scene-bg-${ganClass} scene-branch-${zhiClass} daix-${daiXiang} season-${seasonClass}`}
        style={sceneStyle}
      >
        <SceneLayer ganWx={ganWx} season={seasonClass} />
        <div className={`scene-branch-aura scene-branch-${zhiClass}`} />
        <div className={`scene-silhouette silhouette-${ganClass}`} />
        <SceneParticles wuxing={ganWx} count={particleCount} />

        <div className="scene-content">
          <div className="cd-label">
            {isViewingOther ? '檢視大運' : '目前大運'}
            <span className="cd-season">
              · {season} · {ganWx}+{zhiWx}
            </span>
          </div>

          <div className="cd-ganZhi">
            <span style={{ color: WUXING_COLOR[ganWx] }}>{activeDayun.gan}</span>
            <span style={{ color: WUXING_COLOR[zhiWx] }}>{activeDayun.zhi}</span>
            <span className="cd-emoji">{ZHI_EMOJI[activeDayun.zhi]}</span>
          </div>

          <div className="cd-age">
            {activeDayun.xAge} 歲至 {activeDayun.xAge + 9} 歲 · {activeDayun.startYear} 年至{' '}
            {activeDayun.endYear - 1} 年
          </div>

          <div className="cd-scene">
            {sceneCopy}
            {zhiWx !== ganWx && <span className="cd-subscene"> · 支氣偏向 {zhiWx}</span>}
          </div>

          <div className="cd-mode" style={{ color: modeMeta.color }}>
            {modeMeta.label} · {modeMeta.desc}
          </div>

          <div className="cd-rule-meta">
            <span>規則版 {activeMode?.ruleVersion ?? ruleVersion}</span>
            {activeMode?.ruleCode && <span>規則 {activeMode.ruleCode}</span>}
            {activeMode?.ruleTier && <span>層級 {activeMode.ruleTier}</span>}
            {confidenceText && <span>信心 {confidenceText}</span>}
          </div>

          {!!activeEvidence.length && (
            <div className="cd-evidence">
              <div className="cd-evidence-title">判定依據</div>
              <ul className="cd-evidence-list">
                {activeEvidence.map((item, index) => (
                  <li key={`${activeDayun.startYear}-evidence-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">流年切換</div>
        <div className="year-slider-row">
          <span>{birthYear}</span>
          <input
            type="range"
            className="year-slider"
            min={birthYear}
            max={birthYear + 100}
            value={localYear}
            onChange={event => handleYearSliderChange(parseInt(event.target.value, 10))}
            onMouseUp={handleYearSliderCommit}
            onTouchEnd={handleYearSliderCommit}
          />
          <span>{birthYear + 100}</span>
        </div>

        <div className="year-display">
          <span className="year-big">{localYear} 年</span>
          <span className="age-badge">實歲 {localYear - birthYear} · 虛歲 {Math.max(localYear - birthYear + 1, 1)}</span>
        </div>

        <div className="liunian-row">
          <span className="liunian-label">流年</span>
          <span className="liunian-gz">
            <span style={{ color: WUXING_COLOR[liuNianGanWx] }}>{liuNian.gan}</span>
            <span style={{ color: WUXING_COLOR[liuNianZhiWx] }}>{liuNian.zhi}</span>
            <span className="liunian-emoji">{ZHI_EMOJI[liuNian.zhi]}</span>
          </span>
          <span className="liunian-wx">
            {liuNianGanWx}+{liuNianZhiWx}
          </span>
          <span className="liunian-season">{ZHI_SEASON[liuNian.zhi]}</span>
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">十步大運（{qiYunXAge} 歲起）</div>
        <div className="dayun-steps">
          {yingqi.map(dayun => {
            const isCurrent = dayun.startYear === currentDayun?.startYear;
            const isViewing = dayun.startYear === (viewStartYear ?? currentDayun?.startYear);
            const meta = getModeMeta(dayun.mode);
            const dayunGanWx = GAN_WUXING[dayun.gan];
            const dayunZhiWx = ZHI_WUXING[dayun.zhi];

            return (
              <div
                key={dayun.startYear}
                className={`dayun-step ${isCurrent ? 'active' : ''} ${isViewing ? 'viewing' : ''}`}
                style={{
                  borderColor: isViewing ? meta.color : isCurrent ? `${meta.color}88` : '#1f2937',
                  cursor: 'pointer',
                }}
                onClick={() => handleSelectDayun(dayun)}
              >
                <div className="step-age">{dayun.xAge} 歲</div>
                <div className="step-year" style={{ color: '#6b7280' }}>
                  {dayun.startYear} 年
                </div>
                <div className="step-ganzhi">
                  <span style={{ color: WUXING_COLOR[dayunGanWx] }}>{dayun.gan}</span>
                  <span style={{ color: WUXING_COLOR[dayunZhiWx] }}>{dayun.zhi}</span>
                </div>
                <div className="step-emoji">{ZHI_EMOJI[dayun.zhi]}</div>
                <div className="step-mode" style={{ color: meta.color, fontSize: '0.65rem' }}>
                  {MODE_DESC[meta.label] ?? meta.label}
                </div>
                {isCurrent && <div className="current-dot" style={{ background: meta.color }} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

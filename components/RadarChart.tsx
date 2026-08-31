'use client';

import { motion } from 'framer-motion';

interface RadarDimension {
  label: string;
  score: number; // 0–100
  color: string;
}

interface RadarChartProps {
  dimensions: RadarDimension[];
  size?: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

const LEVELS = 5;
const START_ANGLE = -Math.PI / 2; // top

export default function RadarChart({ dimensions, size = 320 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.38;
  const n = dimensions.length;

  const angleStep = (2 * Math.PI) / n;

  // Grid polygon points for each level
  const gridPolygons = Array.from({ length: LEVELS }, (_, lvl) => {
    const r = (outerR * (lvl + 1)) / LEVELS;
    const pts = Array.from({ length: n }, (_, i) => {
      const angle = START_ANGLE + i * angleStep;
      const { x, y } = polarToCartesian(cx, cy, r, angle);
      return `${x},${y}`;
    }).join(' ');
    return pts;
  });

  // Axis lines from center to outer vertex
  const axisLines = Array.from({ length: n }, (_, i) => {
    const angle = START_ANGLE + i * angleStep;
    return polarToCartesian(cx, cy, outerR, angle);
  });

  // Data polygon
  const dataPoints = dimensions.map((d, i) => {
    const angle = START_ANGLE + i * angleStep;
    const r = (d.score / 100) * outerR;
    return polarToCartesian(cx, cy, r, angle);
  });
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  // Animated version: start collapsed then expand
  const collapsedPolygon = Array.from({ length: n }, () => `${cx},${cy}`).join(' ');

  // Label positions — push outward beyond outer ring
  const labelPositions = Array.from({ length: n }, (_, i) => {
    const angle = START_ANGLE + i * angleStep;
    const r = outerR + 28;
    return { ...polarToCartesian(cx, cy, r, angle), angle };
  });

  // Score label positions (on the data point)
  const scorePositions = dataPoints.map((p, i) => {
    const angle = START_ANGLE + i * angleStep;
    const offset = 14;
    return {
      x: p.x + offset * Math.cos(angle),
      y: p.y + offset * Math.sin(angle),
      score: dimensions[i].score,
      color: dimensions[i].color,
    };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="overflow-visible"
      aria-label="Prompt quality radar chart"
    >
      <defs>
        <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3a80ff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#22e8f5" stopOpacity="0.08" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid rings */}
      {gridPolygons.map((pts, lvl) => (
        <polygon
          key={lvl}
          points={pts}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}

      {/* Axis lines */}
      {axisLines.map((pt, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={pt.x}
          y2={pt.y}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      ))}

      {/* Ring level labels (20, 40, 60, 80, 100) */}
      {Array.from({ length: LEVELS }, (_, lvl) => {
        const r = (outerR * (lvl + 1)) / LEVELS;
        const { x, y } = polarToCartesian(cx, cy, r, START_ANGLE + 0.08);
        return (
          <text
            key={lvl}
            x={x + 3}
            y={y - 2}
            fontSize="8"
            fill="rgba(255,255,255,0.2)"
            fontFamily="Inter, sans-serif"
          >
            {(lvl + 1) * 20}
          </text>
        );
      })}

      {/* Data polygon — animated */}
      <motion.polygon
        points={collapsedPolygon}
        animate={{ points: dataPolygon }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        fill="url(#radarFill)"
        stroke="url(#radarStroke)"
        strokeWidth="2"
        filter="url(#glow)"
      />

      {/* Stroke gradient hack via linearGradient */}
      <defs>
        <linearGradient id="radarStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3a80ff" />
          <stop offset="100%" stopColor="#22e8f5" />
        </linearGradient>
      </defs>

      {/* Data polygon stroke */}
      <motion.polygon
        points={collapsedPolygon}
        animate={{ points: dataPolygon }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        fill="none"
        stroke="url(#radarStroke)"
        strokeWidth="2"
        filter="url(#glow)"
      />

      {/* Data point dots */}
      {dataPoints.map((pt, i) => (
        <motion.circle
          key={i}
          cx={cx}
          cy={cy}
          r={4}
          animate={{ cx: pt.x, cy: pt.y }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.05 * i }}
          fill={dimensions[i].color}
          stroke="rgba(0,0,0,0.6)"
          strokeWidth="1.5"
          filter="url(#glow)"
        />
      ))}

      {/* Score values near dots */}
      {scorePositions.map((sp, i) => (
        <motion.text
          key={i}
          x={cx}
          y={cy}
          animate={{ x: sp.x, y: sp.y }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          fontSize="9"
          fontWeight="700"
          fill={sp.color}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="Inter, sans-serif"
        >
          {sp.score}
        </motion.text>
      ))}

      {/* Axis labels */}
      {labelPositions.map((lp, i) => {
        const label = dimensions[i].label;
        const short = label.split(' ');
        const anchor = lp.x < cx - 10 ? 'end' : lp.x > cx + 10 ? 'start' : 'middle';
        return (
          <text
            key={i}
            x={lp.x}
            y={lp.y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="600"
            fill="rgba(255,255,255,0.65)"
            fontFamily="Inter, sans-serif"
          >
            {short.length > 1 ? (
              <>
                <tspan x={lp.x} dy="-6">{short[0]}</tspan>
                <tspan x={lp.x} dy="13">{short.slice(1).join(' ')}</tspan>
              </>
            ) : label}
          </text>
        );
      })}
    </svg>
  );
}

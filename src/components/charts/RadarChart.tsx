import React, { memo } from 'react';

interface RadarChartDataset {
  label: string;
  color: string;
  stats: { name: string; value: number }[];
}

interface RadarChartProps {
  datasets: RadarChartDataset[];
  maxValue?: number;
  width?: number;
  height?: number;
  theme?: 'dark' | 'light';
}

const RadarChart: React.FC<RadarChartProps> = ({
  datasets,
  maxValue = 255,
  width = 300,
  height = 300,
  theme = 'dark',
}) => {
  const size = Math.min(width, height);
  const center = size / 2;
  const radius = size / 2 - 40; // More padding for labels

  if (datasets.length === 0) return null;

  // Assuming all datasets have the same stats structure, use the first one for axes
  const statNames = datasets[0].stats.map((s) => s.name);
  const numSides = statNames.length;

  const textColor = theme === 'dark' ? '#cbd5e1' : '#475569'; // slate-300 : slate-600
  const lineColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  // Calculate polygon points for a dataset
  const getPolygonPoints = (stats: { value: number }[]) => {
    return stats.map((stat, i) => {
      const angle = (Math.PI * 2 * i) / numSides - Math.PI / 2;
      const value = (Math.min(stat.value, maxValue) / maxValue) * radius;
      return {
        x: center + value * Math.cos(angle),
        y: center + value * Math.sin(angle),
      };
    });
  };

  // Background web circles
  const backgroundCircles = [0.25, 0.5, 0.75, 1].map((scale) => {
    const webPoints = Array.from({ length: numSides }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / numSides - Math.PI / 2;
      const r = radius * scale;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
      };
    });
    return webPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  });

  // Background lines from center to each vertex
  const backgroundLines = Array.from({ length: numSides }).map((_, i) => {
    const angle = (Math.PI * 2 * i) / numSides - Math.PI / 2;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  });

  // Axis Labels
  const labels = statNames.map((name, i) => {
    const angle = (Math.PI * 2 * i) / numSides - Math.PI / 2;
    const labelRadius = radius + 25;
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle),
      name: name,
    };
  });

  // Accessible description
  const chartDescription = datasets
    .map((d) => {
      const statsStr = d.stats.map((s) => `${s.name}: ${s.value}`).join(', ');
      return `${d.label} stats: ${statsStr}`;
    })
    .join('. ');

  const chartLabel = `Radar chart showing ${datasets.map((d) => d.label).join(', ')}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto select-none"
      role="img"
      aria-label={chartLabel}
    >
      <desc>{chartDescription}</desc>

      {/* Background web */}
      {backgroundCircles.map((path, i) => (
        <path key={`web-${i}`} d={path} fill="none" stroke={lineColor} strokeWidth="1" />
      ))}

      {/* Background lines */}
      {backgroundLines.map((point, i) => (
        <line
          key={`line-${i}`}
          x1={center}
          y1={center}
          x2={point.x}
          y2={point.y}
          stroke={lineColor}
          strokeWidth="1"
        />
      ))}

      {/* Datasets */}
      {datasets.map((dataset, idx) => {
        const points = getPolygonPoints(dataset.stats);
        const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

        return (
          <g key={`dataset-${idx}`}>
            <path
              d={path}
              fill={dataset.color}
              fillOpacity="0.2"
              stroke={dataset.color}
              strokeWidth="2"
            />
            {points.map((p, i) => (
              <circle key={`pt-${idx}-${i}`} cx={p.x} cy={p.y} r="3" fill={dataset.color} />
            ))}
          </g>
        );
      })}

      {/* Labels */}
      {labels.map((label, i) => (
        <text
          key={`label-${i}`}
          x={label.x}
          y={label.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[10px] font-bold uppercase tracking-wider"
          fill={textColor}
        >
          {label.name.replace('special-', 'sp. ')}
        </text>
      ))}
    </svg>
  );
};

export default memo(RadarChart);

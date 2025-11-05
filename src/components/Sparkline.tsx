interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  showArea?: boolean;
}

export default function Sparkline({
  values,
  width = 100,
  height = 30,
  color = '#3B82F6',
  fillColor = 'rgba(59, 130, 246, 0.1)',
  showArea = true,
}: SparklineProps) {
  if (values.length === 0) {
    return null;
  }

  // Normalize values to fit in height
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // Avoid division by zero

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  });

  // Create path for line
  const linePath = points
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }
      return `L ${point.x} ${point.y}`;
    })
    .join(' ');

  // Create path for area (if showArea)
  const areaPath = showArea
    ? `${linePath} L ${width} ${height} L 0 ${height} Z`
    : '';

  return (
    <svg
      width={width}
      height={height}
      className="inline-block"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {showArea && (
        <path
          d={areaPath}
          fill={fillColor}
          stroke="none"
        />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

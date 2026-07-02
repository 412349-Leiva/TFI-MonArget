import React from 'react';

function shadeColor(color, percent) {
  if (!color || color.startsWith('url(')) return color;
  const hex = color.replace('#', '');
  if (hex.length !== 6) return color;
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export default function Bar3DShape(props) {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    fill = '#F5C542',
  } = props;

  if (!height || height <= 0 || width <= 0) return null;

  const depth = Math.min(width * 0.32, 11);
  const skew = depth * 0.55;
  const radius = Math.min(7, width / 3);
  const baseY = y + height;
  const frontFill = fill;
  const topFill = shadeColor(fill.startsWith('url') ? '#FFF3B0' : fill, 28);
  const sideFill = shadeColor(fill.startsWith('url') ? '#A67C00' : fill, -35);

  return (
    <g>
      <path
        d={`M ${x + width} ${y + radius}
           L ${x + width + depth} ${y + radius - skew}
           L ${x + width + depth} ${baseY - skew}
           L ${x + width} ${baseY}
           Z`}
        fill={sideFill}
      />
      <path
        d={`M ${x + radius} ${y}
           L ${x + width - radius} ${y}
           L ${x + width - radius + depth} ${y - skew}
           L ${x + radius + depth} ${y - skew}
           Z`}
        fill={topFill}
      />
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={frontFill}
        rx={radius}
        ry={radius}
      />
    </g>
  );
}

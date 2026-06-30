const FACES = {
  ANGRY: { stroke: '#7f1d3d', mouth: 'angry' },
  SAD: { stroke: '#ef4444', mouth: 'sad' },
  YELLOW: { stroke: '#E8B923', mouth: 'flat' },
  OK: { stroke: '#4ade80', mouth: 'smile' },
  HAPPY: { stroke: '#15803d', mouth: 'grin' },
};

function Mouth({ type, stroke }) {
  if (type === 'angry') {
    return <path d="M8 21 Q16 14 24 21" fill={stroke} stroke="none" />;
  }
  if (type === 'sad') {
    return <path d="M9 21 Q16 17 23 21" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />;
  }
  if (type === 'flat') {
    return <path d="M10 20 H22" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />;
  }
  if (type === 'grin') {
    return <path d="M7 18 Q16 28 25 18" fill={stroke} stroke="none" />;
  }
  return <path d="M9 19 Q16 24 23 19" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />;
}

export default function MoodFaceIcon({ level = 'OK', size = 36, className = '' }) {
  const face = FACES[level] || FACES.OK;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <circle cx="16" cy="16" r="14" fill="none" stroke={face.stroke} strokeWidth="2.5" />
      <circle cx="11" cy="13" r="2" fill={face.stroke} />
      <circle cx="21" cy="13" r="2" fill={face.stroke} />
      <Mouth type={face.mouth} stroke={face.stroke} />
    </svg>
  );
}

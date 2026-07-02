import React, {
  Suspense,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas } from '@react-three/fiber';
import { formatPeso } from '../../utils/format';
import { pickChartColor, BAR_3D_PALETTE } from '../../utils/chart3dPalette';
import { getFrontBarIndex } from '../../utils/chart3dGeometry';
import BarChart3DScene from './BarChart3DScene';

const BAR_SPACING = 1.15;

function FocusDetail({ item, hint = 'Arrastrá para girar' }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 px-3 pb-1">
      <div className="rounded-2xl border border-amber-400/30 bg-[#0a1525]/90 px-4 py-3 text-center backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span
            className="inline-block h-3 w-3 rounded-full shadow-[0_0_10px_currentColor]"
            style={{ backgroundColor: item.color, color: item.color }}
          />
          <p className="text-sm font-semibold text-amber-300 truncate">{item.label}</p>
        </div>
        <p className="text-lg font-bold text-white">{formatPeso(item.value)}</p>
      </div>
      <p className="mt-2 text-center text-[10px] text-slate-500">{hint}</p>
    </div>
  );
}

export default function InteractiveBarChart3D({ data = [], className = 'h-full w-full' }) {
  const dragRef = useRef({ active: false, lastX: 0, pointerId: null });
  const [rotation, setRotation] = useState(0);

  const items = useMemo(
    () => data.map((row, index) => ({
      label: row.label || row.name,
      value: Number(row.total ?? row.value ?? 0),
      color: pickChartColor(index, BAR_3D_PALETTE, row.color),
    })),
    [data],
  );

  const frontIndex = useMemo(
    () => getFrontBarIndex(items.length, BAR_SPACING, rotation),
    [items.length, rotation],
  );
  const focused = items[frontIndex] || items[0];

  const handlePointerDown = useCallback((event) => {
    dragRef.current = {
      active: true,
      lastX: event.clientX,
      pointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const handlePointerMove = useCallback((event) => {
    if (!dragRef.current.active || dragRef.current.pointerId !== event.pointerId) return;
    const delta = event.clientX - dragRef.current.lastX;
    dragRef.current.lastX = event.clientX;
    setRotation((current) => current + delta * 0.012);
  }, []);

  const stopDrag = useCallback((event) => {
    if (dragRef.current.pointerId === event.pointerId) {
      dragRef.current.active = false;
      dragRef.current.pointerId = null;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  if (!items.length) return null;

  return (
    <div
      className={`relative touch-none select-none cursor-grab active:cursor-grabbing min-h-[280px] ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
      onPointerLeave={stopDrag}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 4.5, 7.2], fov: 40 }}
        gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <BarChart3DScene items={items} rotation={rotation} frontIndex={frontIndex} />
        </Suspense>
      </Canvas>

      {focused && <FocusDetail item={focused} />}
    </div>
  );
}

import React, {
  Suspense,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas } from '@react-three/fiber';
import { formatPeso } from '../../utils/format';
import { pickChartColor, PIE_3D_PALETTE } from '../../utils/chart3dPalette';
import { buildPieSlices, getFrontPieIndex, getPieSceneLayout } from '../../utils/chart3dGeometry';
import PieChart3DScene from './PieChart3DScene';

function FocusDetail({ item, total }) {
  const percent = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';

  return (
    <div className="pointer-events-none absolute bottom-2 right-3 text-right max-w-[46%]">
      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 truncate">{item.name}</p>
      <p className="text-xl font-bold leading-tight" style={{ color: item.color }}>
        {percent}
        <span className="text-sm font-semibold">%</span>
      </p>
      <p className="text-[11px] text-slate-400">{formatPeso(item.value)}</p>
    </div>
  );
}

export default function InteractivePieChart3D({ data = [], className = 'h-full w-full' }) {
  const dragRef = useRef({ active: false, lastX: 0, pointerId: null });
  const [rotation, setRotation] = useState(0);

  const coloredData = useMemo(
    () => data.map((item, index) => ({
      ...item,
      color: pickChartColor(index, PIE_3D_PALETTE, item.color),
    })),
    [data],
  );

  const slices = useMemo(() => buildPieSlices(coloredData), [coloredData]);
  const total = useMemo(
    () => coloredData.reduce((sum, item) => sum + item.value, 0),
    [coloredData],
  );
  const layout = useMemo(() => getPieSceneLayout(slices.length), [slices.length]);
  const frontIndex = useMemo(
    () => getFrontPieIndex(slices, rotation, layout.camera.position),
    [slices, rotation, layout.camera.position],
  );
  const focused = coloredData[frontIndex] || coloredData[0];

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

  if (!coloredData.length) return null;

  return (
    <div
      className={`relative touch-none select-none cursor-grab active:cursor-grabbing w-full overflow-hidden ${className}`}
      style={{ height: 300, minHeight: 300, maxHeight: 300 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
      onPointerLeave={stopDrag}
    >
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: layout.camera.position, fov: layout.camera.fov }}
        gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <PieChart3DScene slices={slices} rotation={rotation} frontIndex={frontIndex} />
        </Suspense>
      </Canvas>

      {focused && <FocusDetail item={focused} total={total} />}
    </div>
  );
}

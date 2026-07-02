import React, { lazy, Suspense, useMemo } from 'react';
import PieChart2DFallback from './PieChart2DFallback';
import BarChart2DFallback from './BarChart2DFallback';

const InteractivePieChart3D = lazy(() => import('./InteractivePieChart3D'));
const InteractiveBarChart3D = lazy(() => import('./InteractiveBarChart3D'));

function supportsWebGL() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    ));
  } catch {
    return false;
  }
}

function ChartLoader() {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-slate-400">
      Cargando gráfico 3D…
    </div>
  );
}

export function Chart3DPie(props) {
  const webglReady = useMemo(() => supportsWebGL(), []);
  if (!webglReady) {
    return <PieChart2DFallback {...props} />;
  }
  return (
    <Suspense fallback={<ChartLoader />}>
      <InteractivePieChart3D {...props} />
    </Suspense>
  );
}

export function Chart3DBar(props) {
  const webglReady = useMemo(() => supportsWebGL(), []);
  if (!webglReady) {
    return <BarChart2DFallback {...props} />;
  }
  return (
    <Suspense fallback={<ChartLoader />}>
      <InteractiveBarChart3D {...props} />
    </Suspense>
  );
}

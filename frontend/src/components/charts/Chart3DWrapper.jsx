import React, { lazy, Suspense } from 'react';
import PieChart2DFallback from './PieChart2DFallback';
import BarChart2DFallback from './BarChart2DFallback';

const InteractivePieChart3D = lazy(() => import('./InteractivePieChart3D'));
const InteractiveBarChart3D = lazy(() => import('./InteractiveBarChart3D'));

function ChartLoader() {
  return (
    <div className="flex h-[300px] w-full items-center justify-center text-sm text-slate-400">
      Cargando gráfico 3D…
    </div>
  );
}

export class Chart3DErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      if (this.props.variant === 'bar') {
        return <BarChart2DFallback {...this.props} />;
      }
      return <PieChart2DFallback {...this.props} />;
    }
    return this.props.children;
  }
}

export function Chart3DPie(props) {
  return (
    <Chart3DErrorBoundary variant="pie" {...props}>
      <Suspense fallback={<ChartLoader />}>
        <InteractivePieChart3D {...props} />
      </Suspense>
    </Chart3DErrorBoundary>
  );
}

export function Chart3DBar(props) {
  return (
    <Chart3DErrorBoundary variant="bar" {...props}>
      <Suspense fallback={<ChartLoader />}>
        <InteractiveBarChart3D {...props} />
      </Suspense>
    </Chart3DErrorBoundary>
  );
}

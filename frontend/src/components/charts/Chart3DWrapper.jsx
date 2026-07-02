import React from 'react';
import PieChart2DFallback from './PieChart2DFallback';
import BarChart2DFallback from './BarChart2DFallback';
import InteractivePieChart3D from './InteractivePieChart3D';
import InteractiveBarChart3D from './InteractiveBarChart3D';

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
      <InteractivePieChart3D {...props} />
    </Chart3DErrorBoundary>
  );
}

export function Chart3DBar(props) {
  return (
    <Chart3DErrorBoundary variant="bar" {...props}>
      <InteractiveBarChart3D {...props} />
    </Chart3DErrorBoundary>
  );
}

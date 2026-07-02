import * as THREE from 'three';

const SLICE_GAP = 0.028;
const MIN_SLICE_HEIGHT = 0.18;
const MAX_SLICE_HEIGHT = 1.05;

export function buildPieSlices(data) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return [];

  const maxValue = Math.max(...data.map((item) => item.value));
  let cursor = -Math.PI / 2;

  return data.map((item) => {
    const angle = (item.value / total) * (2 * Math.PI - SLICE_GAP * data.length);
    const start = cursor;
    const end = cursor + angle;
    const mid = start + angle / 2;
    const ratio = maxValue > 0 ? item.value / maxValue : 0;
    const height = MIN_SLICE_HEIGHT + ratio * (MAX_SLICE_HEIGHT - MIN_SLICE_HEIGHT);
    cursor = end + SLICE_GAP;

    return {
      ...item,
      start,
      end,
      mid,
      height,
      ratio,
    };
  });
}

export function createWedgeGeometry(innerRadius, outerRadius, startAngle, endAngle, height) {
  const shape = new THREE.Shape();
  const cosStart = Math.cos(startAngle);
  const sinStart = Math.sin(startAngle);
  const cosEnd = Math.cos(endAngle);
  const sinEnd = Math.sin(endAngle);

  shape.moveTo(innerRadius * cosStart, innerRadius * sinStart);
  shape.lineTo(outerRadius * cosStart, outerRadius * sinStart);
  shape.absarc(0, 0, outerRadius, startAngle, endAngle, false);
  shape.lineTo(innerRadius * cosEnd, innerRadius * sinEnd);
  shape.absarc(0, 0, innerRadius, endAngle, startAngle, true);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: Math.min(0.04, height * 0.08),
    bevelSize: Math.min(0.03, height * 0.06),
    bevelSegments: 2,
    curveSegments: 24,
  });

  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, height / 2, 0);
  geometry.computeVertexNormals();

  return geometry;
}

export function getFrontPieIndex(slices, rotation) {
  let bestIndex = 0;
  let bestScore = -Infinity;

  slices.forEach((slice, index) => {
    // Cámara en +Z: el segmento al frente maximiza -sin(mid + rotación).
    const score = -Math.sin(slice.mid + rotation);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
}

export function getPieSceneLayout(sliceCount = 1) {
  const spread = Math.min(1, 0.72 + sliceCount * 0.06);
  return {
    innerRadius: 0.42 * spread,
    outerRadius: 1.02 * spread,
    groupScale: 0.78,
    camera: { position: [0, 2.35, 4.35], fov: 52 },
  };
}

export function getBarSceneLayout(barCount = 1) {
  const spacing = barCount > 8 ? 0.82 : barCount > 5 ? 0.95 : 1.05;
  const width = Math.max(barCount - 1, 1) * spacing + 1.2;
  const zoom = Math.min(1, 6.5 / width);
  return {
    spacing,
    groupScale: zoom * 0.82,
    camera: { position: [0, 2.6, 4.8 + barCount * 0.08], fov: 50 },
  };
}

export function getFrontBarIndex(count, spacing, rotation) {
  let bestIndex = 0;
  let bestScore = -Infinity;

  for (let index = 0; index < count; index += 1) {
    const x = (index - (count - 1) / 2) * spacing;
    const score = x * Math.sin(rotation);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  return bestIndex;
}

export function normalizeBarHeight(value, maxValue, minHeight = 0.28, maxHeight = 2.4) {
  if (maxValue <= 0) return minHeight;
  return minHeight + (value / maxValue) * (maxHeight - minHeight);
}

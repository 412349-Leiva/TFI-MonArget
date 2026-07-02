import * as THREE from 'three';

const SLICE_GAP = 0.045;
const PIE_DEPTH = 0.52;

export function buildPieSlices(data) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return [];

  let cursor = -Math.PI / 2;

  return data.map((item) => {
    const angle = (item.value / total) * (2 * Math.PI - SLICE_GAP * data.length);
    const start = cursor;
    const end = cursor + angle;
    const mid = start + angle / 2;
    cursor = end + SLICE_GAP;

    return {
      ...item,
      start,
      end,
      mid,
      height: PIE_DEPTH,
    };
  });
}

export function createWedgeGeometry(innerRadius, outerRadius, startAngle, endAngle, height) {
  const shape = new THREE.Shape();
  const cosStart = Math.cos(startAngle);
  const sinStart = Math.sin(startAngle);
  const cosEnd = Math.cos(endAngle);
  const sinEnd = Math.sin(endAngle);

  if (innerRadius <= 0.001) {
    shape.moveTo(0, 0);
    shape.lineTo(outerRadius * cosStart, outerRadius * sinStart);
    shape.absarc(0, 0, outerRadius, startAngle, endAngle, false);
    shape.lineTo(0, 0);
  } else {
    shape.moveTo(innerRadius * cosStart, innerRadius * sinStart);
    shape.lineTo(outerRadius * cosStart, outerRadius * sinStart);
    shape.absarc(0, 0, outerRadius, startAngle, endAngle, false);
    shape.lineTo(innerRadius * cosEnd, innerRadius * sinEnd);
    shape.absarc(0, 0, innerRadius, endAngle, startAngle, true);
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    curveSegments: 32,
  });

  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, height / 2, 0);
  geometry.computeVertexNormals();

  return geometry;
}

export function getFrontPieIndex(slices, rotation, cameraPosition = [3.2, 2.6, 3.2]) {
  const [cx, , cz] = cameraPosition;
  const len = Math.sqrt(cx * cx + cz * cz) || 1;
  const camX = cx / len;
  const camZ = cz / len;

  let bestIndex = 0;
  let bestScore = -Infinity;

  slices.forEach((slice, index) => {
    const angle = slice.mid + rotation;
    const nx = Math.cos(angle);
    const nz = -Math.sin(angle);
    const score = nx * camX + nz * camZ;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
}

export function getPieSceneLayout(sliceCount = 1) {
  const spread = Math.min(1, 0.8 + sliceCount * 0.04);
  return {
    innerRadius: 0,
    outerRadius: 1.08 * spread,
    groupScale: 0.84,
    explode: 0.07,
    activeExplode: 0.13,
    camera: { position: [3.2, 2.6, 3.2], fov: 36 },
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

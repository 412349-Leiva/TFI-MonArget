/* eslint-disable react/no-unknown-property */
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { darkenHexColor } from '../../utils/chart3dPalette';
import { createWedgeGeometry, getPieSceneLayout } from '../../utils/chart3dGeometry';

function PieSlice({
  slice,
  active,
  innerRadius,
  outerRadius,
  explode,
  activeExplode,
}) {
  const groupRef = useRef();
  const geometry = useMemo(
    () => createWedgeGeometry(innerRadius, outerRadius, slice.start, slice.end, slice.height),
    [innerRadius, outerRadius, slice.start, slice.end, slice.height],
  );

  const materials = useMemo(
    () => [
      new THREE.MeshLambertMaterial({ color: slice.color }),
      new THREE.MeshLambertMaterial({ color: darkenHexColor(slice.color, 0.58) }),
    ],
    [slice.color],
  );

  useFrame(() => {
    if (!groupRef.current) return;
    const dist = active ? activeExplode : explode;
    const targetX = Math.cos(slice.mid) * dist;
    const targetZ = -Math.sin(slice.mid) * dist;
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.14);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.14);
    const targetY = active ? 0.04 : 0;
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.14);
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} material={materials} castShadow receiveShadow />
    </group>
  );
}

export default function PieChart3DScene({ slices, rotation, frontIndex }) {
  const layout = useMemo(() => getPieSceneLayout(slices.length), [slices.length]);

  return (
    <>
      <color attach="background" args={['transparent']} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[5, 8, 6]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-3, 4, -2]} intensity={0.35} />

      <group scale={layout.groupScale} rotation={[0, rotation, 0]} position={[0, 0, 0]}>
        {slices.map((slice, index) => (
          <PieSlice
            key={slice.name}
            slice={slice}
            active={index === frontIndex}
            innerRadius={layout.innerRadius}
            outerRadius={layout.outerRadius}
            explode={layout.explode}
            activeExplode={layout.activeExplode}
          />
        ))}
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <circleGeometry args={[layout.outerRadius * layout.groupScale * 1.35, 48]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22} />
      </mesh>
    </>
  );
}

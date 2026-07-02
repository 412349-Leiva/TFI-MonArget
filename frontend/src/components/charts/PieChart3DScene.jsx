/* eslint-disable react/no-unknown-property */
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createWedgeGeometry, getPieSceneLayout } from '../../utils/chart3dGeometry';

function GlossyMaterial({ color, active }) {
  return (
    <meshPhysicalMaterial
      color={color}
      metalness={0.35}
      roughness={0.18}
      clearcoat={1}
      clearcoatRoughness={0.12}
      emissive={active ? color : '#000000'}
      emissiveIntensity={active ? 0.35 : 0}
    />
  );
}

function PieSlice({ slice, active, innerRadius, outerRadius }) {
  const meshRef = useRef();
  const geometry = useMemo(
    () => createWedgeGeometry(innerRadius, outerRadius, slice.start, slice.end, slice.height),
    [innerRadius, outerRadius, slice.start, slice.end, slice.height],
  );

  useFrame(() => {
    if (!meshRef.current) return;
    const targetScale = active ? 1.04 : 1;
    meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetScale, 0.12);
    const targetLift = active ? 0.05 : 0;
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetLift, 0.12);
  });

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <GlossyMaterial color={slice.color} active={active} />
    </mesh>
  );
}

export default function PieChart3DScene({ slices, rotation, frontIndex }) {
  const layout = useMemo(() => getPieSceneLayout(slices.length), [slices.length]);

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 10, 8]} intensity={1.35} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 6, -3]} intensity={0.45} />
      <pointLight position={[0, 8, 0]} intensity={0.35} />

      <group scale={layout.groupScale} rotation={[0, rotation, 0]} position={[0, -0.02, 0]}>
        {slices.map((slice, index) => (
          <PieSlice
            key={slice.name}
            slice={slice}
            active={index === frontIndex}
            innerRadius={layout.innerRadius}
            outerRadius={layout.outerRadius}
          />
        ))}
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[layout.outerRadius * layout.groupScale * 1.12, 48]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.32} />
      </mesh>
    </>
  );
}

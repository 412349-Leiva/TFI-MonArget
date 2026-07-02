/* eslint-disable react/no-unknown-property */
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { normalizeBarHeight, getBarSceneLayout } from '../../utils/chart3dGeometry';

function GlossyBar({ color, height, active }) {
  const meshRef = useRef();

  useFrame(() => {
    if (!meshRef.current) return;
    const targetScale = active ? 1.04 : 1;
    meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.12);
    meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, targetScale, 0.12);
    const targetY = height / 2 + (active ? 0.05 : 0);
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.12);
  });

  return (
    <RoundedBox
      ref={meshRef}
      args={[0.68, height, 0.68]}
      radius={0.08}
      smoothness={4}
      castShadow
      receiveShadow
    >
      <meshPhysicalMaterial
        color={color}
        metalness={0.42}
        roughness={0.16}
        clearcoat={1}
        clearcoatRoughness={0.1}
        emissive={active ? color : '#000000'}
        emissiveIntensity={active ? 0.32 : 0}
      />
    </RoundedBox>
  );
}

export default function BarChart3DScene({ items, rotation, frontIndex, spacing, groupScale }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  const bars = useMemo(
    () => items.map((item, index) => ({
      ...item,
      x: (index - (items.length - 1) / 2) * spacing,
      height: normalizeBarHeight(item.value, maxValue),
    })),
    [items, maxValue, spacing],
  );

  const shadowWidth = Math.max((items.length - 1) * spacing + 1.4, 2.2) * groupScale;

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 9, 7]} intensity={1.4} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-5, 4, -4]} intensity={0.4} />
      <pointLight position={[0, 7, 2]} intensity={0.35} />

      <group scale={groupScale} rotation={[0, rotation, 0]} position={[0, 0, 0]}>
        {bars.map((bar, index) => (
          <group key={bar.label || bar.name || index} position={[bar.x, 0, 0]}>
            <GlossyBar color={bar.color} height={bar.height} active={index === frontIndex} />
          </group>
        ))}
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[shadowWidth, 2.2 * groupScale]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </>
  );
}

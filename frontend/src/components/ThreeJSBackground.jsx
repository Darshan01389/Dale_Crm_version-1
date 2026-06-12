import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

const AnimatedMesh = () => {
  const meshRef = useRef(null);

  // Slowly rotate the mesh
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1.5, 64, 64]} scale={1.5}>
        <MeshDistortMaterial
          color="#6366f1" // Indigo
          attach="material"
          distort={0.5} // Amount of distortion
          speed={2} // Speed of distortion
          roughness={0.2}
          metalness={0.8}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </Sphere>
      {/* Add a secondary complementary shape */}
      <Sphere args={[1, 32, 32]} position={[-2, -1, -2]}>
        <MeshDistortMaterial
          color="#4F46E5" // Purple
          attach="material"
          distort={0.4}
          speed={1.5}
          roughness={0.3}
          metalness={0.5}
        />
      </Sphere>
    </Float>
  );
};

const ThreeJSBackground = () => {
  return (
    <div className="absolute inset-0 -z-10 bg-black overflow-hidden pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#ec4899" />
        
        <AnimatedMesh />
        
        {/* Adds realistic reflections */}
        <Environment preset="city" />
      </Canvas>
      
      {/* Overlay to ensure text remains readable */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
    </div>
  );
};

export default ThreeJSBackground;

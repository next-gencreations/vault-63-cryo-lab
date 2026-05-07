import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

// Generator room world position: X ∈ [22, 50], Z ∈ [-14, +14], center at (36, 0, 0)
const CX = 36;
const VT_YELLOW    = '#c8a000';
const VT_YELLOW_EM = '#ffd040';
const VT_ORANGE    = '#ff6600';
const VT_ORANGE_EM = '#ff8833';
const WALL_COLOR   = '#1a1208';
const FLOOR_COLOR  = '#120e06';
const CEIL_COLOR   = '#0e0a04';

function ReactorCore() {
  const glowRef  = useRef<THREE.PointLight>(null!);
  const ringRef  = useRef<THREE.Mesh>(null!);
  const ring2Ref = useRef<THREE.Mesh>(null!);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    const pulse = 0.5 + Math.sin(t.current * 1.8) * 0.25;
    if (glowRef.current) glowRef.current.intensity = 8 + pulse * 6;
    if (ringRef.current)  ringRef.current.rotation.y  = t.current * 0.6;
    if (ring2Ref.current) ring2Ref.current.rotation.x = t.current * 0.4;
  });

  return (
    <group position={[CX, 0, 0]}>
      {/* Core chamber base */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[2.2, 2.4, 0.16, 24]} />
        <meshStandardMaterial color="#1a1208" metalness={0.8} roughness={0.3} emissive="#331100" emissiveIntensity={0.25} />
      </mesh>
      {/* Warning ring on floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]}>
        <ringGeometry args={[2.5, 3.0, 32]} />
        <meshStandardMaterial color="#c8a000" emissive="#ffd040" emissiveIntensity={0.5} roughness={0.6} />
      </mesh>

      {/* Main reactor body */}
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[1.6, 1.8, 4.2, 20]} />
        <meshStandardMaterial color="#2a1e0a" metalness={0.85} roughness={0.25} emissive="#1a0800" emissiveIntensity={0.15} />
      </mesh>

      {/* Glowing core window */}
      <mesh position={[0, 2.8, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 0.5, 16]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff8800" emissiveIntensity={2.5} transparent opacity={0.85} roughness={0.05} />
      </mesh>

      {/* Orbital rings */}
      <mesh ref={ringRef} position={[0, 2.6, 0]}>
        <torusGeometry args={[1.3, 0.06, 8, 32]} />
        <meshStandardMaterial color="#ff9900" emissive="#ffaa00" emissiveIntensity={1.2} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh ref={ring2Ref} position={[0, 2.6, 0]}>
        <torusGeometry args={[1.0, 0.04, 8, 32]} />
        <meshStandardMaterial color="#ffcc33" emissive="#ffdd44" emissiveIntensity={1.0} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Top dome */}
      <mesh position={[0, 4.35, 0]}>
        <sphereGeometry args={[1.62, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#2a1e0a" metalness={0.88} roughness={0.22} />
      </mesh>
      {/* Vent pipe up top */}
      <mesh position={[0, 5.0, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 1.5, 8]} />
        <meshStandardMaterial color="#1a1208" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Pipe connections outward (4 directions) */}
      {[0, Math.PI / 2, Math.PI, 3 * Math.PI / 2].map((a, i) => (
        <group key={i} rotation={[0, a, 0]}>
          <mesh position={[2.5, 1.5, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.18, 0.18, 2.6, 7]} />
            <meshStandardMaterial color="#2a1a08" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[2.55, 1.5, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.19, 0.19, 2.8, 7]} />
            <meshStandardMaterial color="#1a1208" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Reactor glow light */}
      <pointLight ref={glowRef} position={[0, 2.6, 0]} color="#ff6600" distance={20} decay={2} />
      <pointLight position={[0, 2.6, 0]} color="#ffaa00" intensity={3} distance={12} decay={2} />
    </group>
  );
}

function CoolantTank({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh>
        <cylinderGeometry args={[0.5, 0.55, 2.8, 10]} />
        <meshStandardMaterial color="#1a1208" metalness={0.85} roughness={0.28} />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.56, 0.52, 0.14, 10]} />
        <meshStandardMaterial color="#c8a000" emissive="#ffd040" emissiveIntensity={0.4} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Coolant level sight glass */}
      <mesh position={[0.52, 0, 0]}>
        <boxGeometry args={[0.06, 1.6, 0.12]} />
        <meshStandardMaterial color="#00aaff" transparent opacity={0.55} roughness={0.05} emissive="#0044aa" emissiveIntensity={0.3} />
      </mesh>
      {/* Pressure gauge */}
      <mesh position={[0.53, 0.8, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.06, 10]} />
        <meshStandardMaterial color="#2a2010" metalness={0.7} roughness={0.4} />
      </mesh>
      <pointLight position={[0, 0, 0]} color="#0088ff" intensity={0.5} distance={4} decay={2} />
    </group>
  );
}

function HazardPanel({ pos, rot }: { pos: [number, number, number]; rot: [number, number, number] }) {
  return (
    <group position={pos} rotation={rot}>
      <mesh>
        <boxGeometry args={[2.4, 3.0, 0.09]} />
        <meshStandardMaterial color="#0e0800" emissive="#1a0800" emissiveIntensity={0.2} metalness={0.5} />
      </mesh>
      {/* Hazard chevron rows */}
      {[-1.0, -0.3, 0.4, 1.1].map((y, i) => (
        <mesh key={i} position={[0, y, 0.06]}>
          <boxGeometry args={[2.0, 0.22, 0.02]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#c8a000' : '#1a1208'}
            emissive={i % 2 === 0 ? '#ffd040' : '#000000'}
            emissiveIntensity={i % 2 === 0 ? 0.5 : 0}
          />
        </mesh>
      ))}
      <Text position={[0, 1.2, 0.06]} fontSize={0.24} color="#ff4400" anchorX="center" anchorY="middle" letterSpacing={0.1}>
        DANGER
      </Text>
      <Text position={[0, 0.85, 0.06]} fontSize={0.11} color="#ffaa00" anchorX="center" anchorY="middle" letterSpacing={0.07}>
        RADIATION ZONE
      </Text>
    </group>
  );
}

export function GeneratorRoom() {
  const wallMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: WALL_COLOR,  roughness: 0.72, metalness: 0.25 }), []);
  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({ color: FLOOR_COLOR, roughness: 0.82, metalness: 0.18 }), []);
  const ceilMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: CEIL_COLOR,  roughness: 0.9 }), []);
  const metalMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a1e0a', metalness: 0.82, roughness: 0.28 }), []);
  const pipeMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a1e0a', roughness: 0.4, metalness: 0.9 }), []);
  const vtYellowMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: VT_YELLOW, emissive: VT_YELLOW_EM, emissiveIntensity: 0.5, metalness: 0.65, roughness: 0.3,
  }), []);

  return (
    <group>
      {/* ── Lighting ── */}
      <ambientLight intensity={0.4} color="#1a1000" />
      <hemisphereLight args={['#221800', '#110c00', 0.6]} />
      {/* Overhead fluorescents — dim, industrial */}
      <pointLight position={[CX - 8, 5.3, -6]} color="#cc8800" intensity={4} distance={16} decay={2} />
      <pointLight position={[CX,     5.3, 0]}  color="#cc8800" intensity={4} distance={16} decay={2} />
      <pointLight position={[CX + 8, 5.3,  6]} color="#cc8800" intensity={4} distance={16} decay={2} />
      {/* Red emergency lights */}
      <pointLight position={[CX - 12, 1.2, -12]} color="#ff2200" intensity={2} distance={10} decay={2} />
      <pointLight position={[CX + 12, 1.2,  12]} color="#ff2200" intensity={2} distance={10} decay={2} />
      <pointLight position={[CX - 12, 1.2,  12]} color="#ff4400" intensity={1.5} distance={8} decay={2} />
      <pointLight position={[CX + 12, 1.2, -12]} color="#ff4400" intensity={1.5} distance={8} decay={2} />

      {/* ── Floor ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CX, 0.005, 0]}>
        <planeGeometry args={[28, 28]} />
        <primitive object={floorMat} />
      </mesh>
      {/* Hazard chevrons on floor around reactor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CX, 0.012, 0]}>
        <ringGeometry args={[2.6, 3.1, 32]} />
        <meshStandardMaterial color="#c8a000" emissive="#ffd040" emissiveIntensity={0.55} roughness={0.6} />
      </mesh>
      {/* Floor grid */}
      <gridHelper args={[28, 14, '#221800', '#150e00']} position={[CX, 0.014, 0]} />

      {/* ── Ceiling ── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[CX, 6, 0]}>
        <planeGeometry args={[28, 28]} />
        <primitive object={ceilMat} />
      </mesh>
      {/* Ceiling light fixtures — cage style */}
      {[[-8, -6], [0, 0], [8, 6]].map(([x, z], i) => (
        <group key={i} position={[CX + x, 5.9, z]}>
          <mesh>
            <boxGeometry args={[2.2, 0.07, 0.8]} />
            <meshStandardMaterial color="#cc6600" emissive="#dd7700" emissiveIntensity={1.8} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* ── Walls ── */}
      {/* West wall — with doorway opening at z=[-2.5, 2.5] */}
      <mesh position={[CX - 14, 3, -8.25]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[11.5, 6]} />
        <primitive object={wallMat} />
      </mesh>
      <mesh position={[CX - 14, 3, 8.25]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[11.5, 6]} />
        <primitive object={wallMat} />
      </mesh>
      <mesh position={[CX - 14, 5.7, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[5, 0.6]} />
        <primitive object={wallMat} />
      </mesh>
      {/* East wall */}
      <mesh position={[CX + 14, 3, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[28, 6]} />
        <primitive object={wallMat} />
      </mesh>
      {/* North wall */}
      <mesh position={[CX, 3, -14]}>
        <planeGeometry args={[28, 6]} />
        <primitive object={wallMat} />
      </mesh>
      {/* South wall */}
      <mesh position={[CX, 3, 14]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[28, 6]} />
        <primitive object={wallMat} />
      </mesh>

      {/* ── Main reactor ── */}
      <ReactorCore />

      {/* ── Coolant tanks along walls ── */}
      <CoolantTank pos={[CX - 12.5, 1.4, -10]} />
      <CoolantTank pos={[CX - 12.5, 1.4, -5]}  />
      <CoolantTank pos={[CX - 12.5, 1.4,  5]}  />
      <CoolantTank pos={[CX - 12.5, 1.4,  10]} />
      <CoolantTank pos={[CX + 12.5, 1.4, -10]} />
      <CoolantTank pos={[CX + 12.5, 1.4,  10]} />

      {/* ── Control panels on east wall ── */}
      <mesh position={[CX + 13.6, 2.4, -6]}>
        <boxGeometry args={[0.12, 2.6, 3.2]} />
        <meshStandardMaterial color="#1a1208" metalness={0.7} roughness={0.3} emissive="#0a0800" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[CX + 13.6, 2.4,  6]}>
        <boxGeometry args={[0.12, 2.6, 3.2]} />
        <meshStandardMaterial color="#1a1208" metalness={0.7} roughness={0.3} emissive="#0a0800" emissiveIntensity={0.2} />
      </mesh>
      {/* Panel indicator lights */}
      {[[-8, -5, -3, -1, 1, 3, 5, 8]].flat().map((z, i) => (
        <mesh key={i} position={[CX + 13.7, 2.4 + Math.sin(i * 1.7) * 0.5, z]}>
          <sphereGeometry args={[0.055, 6, 6]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? '#ff4400' : i % 3 === 1 ? '#ffaa00' : '#00ff44'}
            emissive={i % 3 === 0 ? '#ff3300' : i % 3 === 1 ? '#ff9900' : '#00ee33'}
            emissiveIntensity={0.9}
          />
        </mesh>
      ))}

      {/* ── Pipe runs along ceiling and walls ── */}
      {/* Main pipes north-south */}
      <mesh position={[CX - 8, 5.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 28, 7]} />
        <primitive object={pipeMat} />
      </mesh>
      <mesh position={[CX + 8, 5.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 28, 7]} />
        <primitive object={pipeMat} />
      </mesh>
      {/* East-west pipes */}
      <mesh position={[CX, 5.55, -10]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 28, 7]} />
        <primitive object={pipeMat} />
      </mesh>
      <mesh position={[CX, 5.55, 10]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 28, 7]} />
        <primitive object={pipeMat} />
      </mesh>

      {/* ── Hazard panels ── */}
      <HazardPanel pos={[CX, 2.4, -13.88]} rot={[0, 0, 0]} />
      <HazardPanel pos={[CX, 2.4,  13.88]} rot={[0, Math.PI, 0]} />

      {/* ── Yellow accent rail ── */}
      <mesh position={[CX, 1.0, -13.93]} material={vtYellowMat}>
        <boxGeometry args={[28, 0.05, 0.05]} />
      </mesh>
      <mesh position={[CX, 1.0, 13.93]} material={vtYellowMat}>
        <boxGeometry args={[28, 0.05, 0.05]} />
      </mesh>
      <mesh position={[CX + 13.93, 1.0, 0]} material={vtYellowMat}>
        <boxGeometry args={[0.05, 0.05, 28]} />
      </mesh>
      {/* West side split rail */}
      <mesh position={[CX - 13.93, 1.0, -8.25]} material={vtYellowMat}>
        <boxGeometry args={[0.05, 0.05, 11.5]} />
      </mesh>
      <mesh position={[CX - 13.93, 1.0, 8.25]} material={vtYellowMat}>
        <boxGeometry args={[0.05, 0.05, 11.5]} />
      </mesh>

      {/* ── Door frame for west opening ── */}
      <mesh position={[CX - 14, 3, -2.5]} material={metalMat}>
        <boxGeometry args={[0.18, 6, 0.18]} />
      </mesh>
      <mesh position={[CX - 14, 3, 2.5]} material={metalMat}>
        <boxGeometry args={[0.18, 6, 0.18]} />
      </mesh>
      <mesh position={[CX - 14, 5.55, 0]} material={metalMat}>
        <boxGeometry args={[0.18, 0.28, 5.36]} />
      </mesh>

      {/* ── Signage ── */}
      <mesh position={[CX, 5.1, -13.82]}>
        <boxGeometry args={[14, 0.78, 0.1]} />
        <meshStandardMaterial color="#1a0a00" emissive="#1a0800" emissiveIntensity={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[CX, 5.53, -13.81]} material={vtYellowMat}>
        <boxGeometry args={[14.1, 0.06, 0.08]} />
      </mesh>
      <mesh position={[CX, 4.69, -13.81]} material={vtYellowMat}>
        <boxGeometry args={[14.1, 0.06, 0.08]} />
      </mesh>
      <Text position={[CX, 5.1, -13.78]} fontSize={0.42} color={VT_ORANGE_EM}
        anchorX="center" anchorY="middle" letterSpacing={0.18}>
        VAULT 63  ·  REACTOR CORE  ·  LEVEL 1
      </Text>
      <Text position={[CX, 5.72, -13.8]} fontSize={0.17} color={VT_YELLOW_EM}
        anchorX="center" anchorY="middle" letterSpacing={0.25}>
        VAULT-TEC FUSION ENERGY DIVISION  ·  AUTHORISED PERSONNEL ONLY
      </Text>

      {/* Direction sign above west doorway */}
      <mesh position={[CX - 13.7, 4.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[3.2, 0.38, 0.06]} />
        <meshStandardMaterial color="#1a0800" emissive="#0a0400" emissiveIntensity={0.3} metalness={0.5} />
      </mesh>
      <Text position={[CX - 13.65, 4.5, 0]} rotation={[0, Math.PI / 2, 0]}
        fontSize={0.16} color={VT_ORANGE_EM} anchorX="center" anchorY="middle" letterSpacing={0.06}>
        ←  CRYO LAB
      </Text>
    </group>
  );
}

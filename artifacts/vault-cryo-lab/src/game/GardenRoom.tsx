import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

// Garden room world position: X ∈ [-50, -22], Z ∈ [-14, +14], center at (-36, 0, 0)
const CX = -36; // room center X
const VT_GREEN     = '#00cc66';
const VT_GREEN_EM  = '#00ff88';
const VT_YELLOW    = '#c8a000';
const VT_YELLOW_EM = '#ffd040';
const WALL_COLOR   = '#152218';
const FLOOR_COLOR  = '#0d180d';
const CEIL_COLOR   = '#0a120a';

function PlantCluster({ pos }: { pos: [number, number, number] }) {
  const t = useRef(Math.random() * Math.PI * 2);
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    t.current += delta * 0.3;
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(t.current * 0.4) * 0.06;
    }
  });
  return (
    <group position={pos}>
      {/* Stem */}
      <mesh ref={meshRef}>
        <cylinderGeometry args={[0.04, 0.06, 0.9, 6]} />
        <meshStandardMaterial color="#1a4a18" roughness={0.8} />
      </mesh>
      {/* Leaf cluster */}
      {[0, 1, 2, 3].map(i => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.22, 0.55 + Math.sin(i) * 0.08, Math.sin(a) * 0.22]}
            rotation={[0.4, a, 0.2]}>
            <sphereGeometry args={[0.18, 5, 5]} />
            <meshStandardMaterial color="#1e6618" roughness={0.75} />
          </mesh>
        );
      })}
      {/* Fruit / flower bud */}
      <mesh position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshStandardMaterial color="#cc4422" emissive="#aa2200" emissiveIntensity={0.3} roughness={0.5} />
      </mesh>
    </group>
  );
}

function HydroponicBed({ pos, rotation = 0 }: { pos: [number, number, number]; rotation?: number }) {
  const mat   = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a2a1a', roughness: 0.6, metalness: 0.4 }), []);
  const soil  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a1a0a', roughness: 0.95 }), []);
  const water = useMemo(() => new THREE.MeshStandardMaterial({ color: '#003348', transparent: true, opacity: 0.55, roughness: 0.05 }), []);

  const plantCount = 6;
  return (
    <group position={pos} rotation={[0, rotation, 0]}>
      {/* Tray frame */}
      <mesh material={mat}>
        <boxGeometry args={[6, 0.22, 1.2]} />
      </mesh>
      {/* Soil fill */}
      <mesh position={[0, 0.07, 0]} material={soil}>
        <boxGeometry args={[5.8, 0.1, 1.0]} />
      </mesh>
      {/* Thin water channel along tray edge */}
      <mesh position={[0, 0.12, -0.55]} material={water}>
        <boxGeometry args={[5.8, 0.04, 0.1]} />
      </mesh>
      {/* Plants */}
      {Array.from({ length: plantCount }).map((_, i) => (
        <PlantCluster key={i} pos={[(i - plantCount / 2 + 0.5) * 0.96, 0.15, 0] as [number, number, number]} />
      ))}
      {/* Drip tubes */}
      {Array.from({ length: plantCount }).map((_, i) => (
        <mesh key={`tube-${i}`} position={[(i - plantCount / 2 + 0.5) * 0.96, 0.4, -0.52]}>
          <cylinderGeometry args={[0.013, 0.013, 0.55, 5]} />
          <meshStandardMaterial color="#225522" roughness={0.6} />
        </mesh>
      ))}
      {/* Legs */}
      {[-2.8, 2.8].map((x, i) => [-0.5, 0.5].map((z, j) => (
        <mesh key={`leg-${i}-${j}`} position={[x, -0.55, z]}>
          <boxGeometry args={[0.06, 0.9, 0.06]} />
          <meshStandardMaterial color="#1a2a1a" metalness={0.7} roughness={0.35} />
        </mesh>
      )))}
    </group>
  );
}

function UVLight({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh>
        <boxGeometry args={[3.8, 0.06, 0.22]} />
        <meshStandardMaterial color="#3a006a" emissive="#9900ff" emissiveIntensity={2.2} roughness={0.3} />
      </mesh>
      <pointLight color="#bb44ff" intensity={4} distance={10} decay={2} />
    </group>
  );
}

function WaterTank({ pos }: { pos: [number, number, number] }) {
  const glassMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#aaddcc', transparent: true, opacity: 0.3, roughness: 0.05, metalness: 0.1, transmission: 0.6,
  }), []);
  return (
    <group position={pos}>
      <mesh>
        <cylinderGeometry args={[0.55, 0.6, 2.2, 10]} />
        <primitive object={glassMat} />
      </mesh>
      {/* Water level indicator */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.54, 0.54, 0.8, 10]} />
        <meshStandardMaterial color="#0088aa" transparent opacity={0.45} roughness={0.05} />
      </mesh>
      {/* Cap */}
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.62, 0.6, 0.12, 10]} />
        <meshStandardMaterial color="#2a3a30" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Valve pipe */}
      <mesh position={[0.55, -0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 6]} />
        <meshStandardMaterial color="#1a2a1a" metalness={0.8} roughness={0.3} />
      </mesh>
      <pointLight color="#00ddaa" intensity={0.8} distance={5} decay={2} />
    </group>
  );
}

export function GardenRoom() {
  const wallMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: WALL_COLOR,  roughness: 0.8, metalness: 0.15 }), []);
  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({ color: FLOOR_COLOR, roughness: 0.85, metalness: 0.1 }), []);
  const ceilMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: CEIL_COLOR,  roughness: 0.9 }), []);
  const metalMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a2a1a', metalness: 0.7, roughness: 0.35 }), []);
  const pipeMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1c2e1a', roughness: 0.5, metalness: 0.85 }), []);
  const vtGreenMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: VT_GREEN, emissive: VT_GREEN_EM, emissiveIntensity: 0.45, metalness: 0.6, roughness: 0.35,
  }), []);

  return (
    <group>
      {/* ── Lighting ── */}
      <ambientLight intensity={2.8} color="#334433" />
      <hemisphereLight args={['#446644', '#223322', 2.2]} />
      {/* UV grow lights along ceiling */}
      <pointLight position={[CX - 8, 5.2, -6]} color="#cc66ff" intensity={14} distance={20} decay={2} />
      <pointLight position={[CX,     5.2, -6]} color="#cc66ff" intensity={14} distance={20} decay={2} />
      <pointLight position={[CX + 8, 5.2, -6]} color="#cc66ff" intensity={14} distance={20} decay={2} />
      <pointLight position={[CX - 8, 5.2,  6]} color="#cc66ff" intensity={14} distance={20} decay={2} />
      <pointLight position={[CX,     5.2,  6]} color="#cc66ff" intensity={14} distance={20} decay={2} />
      <pointLight position={[CX + 8, 5.2,  6]} color="#cc66ff" intensity={14} distance={20} decay={2} />
      {/* White overhead fill lights */}
      <pointLight position={[CX - 8, 5.5, 0]} color="#ccffee" intensity={10} distance={22} decay={2} />
      <pointLight position={[CX,     5.5, 0]} color="#ccffee" intensity={10} distance={22} decay={2} />
      <pointLight position={[CX + 8, 5.5, 0]} color="#ccffee" intensity={10} distance={22} decay={2} />
      {/* Green ambient from plants */}
      <pointLight position={[CX, 1.5,  0]} color="#00ff44" intensity={5} distance={20} decay={2} />
      <pointLight position={[CX, 1.5, -8]} color="#00cc44" intensity={4} distance={16} decay={2} />
      <pointLight position={[CX, 1.5,  8]} color="#00cc44" intensity={4} distance={16} decay={2} />
      {/* Water tank glow */}
      <pointLight position={[CX - 12, 1.5, -12]} color="#00ddaa" intensity={3} distance={12} decay={2} />
      <pointLight position={[CX + 12, 1.5,  12]} color="#00ddaa" intensity={3} distance={12} decay={2} />

      {/* ── Floor ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CX, 0.005, 0]}>
        <planeGeometry args={[28, 28]} />
        <primitive object={floorMat} />
      </mesh>
      {/* Soil-stain floor detail */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CX, 0.01, 0]}>
        <planeGeometry args={[22, 20]} />
        <meshStandardMaterial color="#0a1408" roughness={0.95} />
      </mesh>
      <gridHelper args={[28, 14, '#162416', '#0e1a0e']} position={[CX, 0.012, 0]} />

      {/* ── Ceiling ── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[CX, 6, 0]}>
        <planeGeometry args={[28, 28]} />
        <primitive object={ceilMat} />
      </mesh>
      {/* UV light panels on ceiling (2 rows × 3 panels) */}
      <UVLight pos={[CX - 8, 5.92, -6]} />
      <UVLight pos={[CX,     5.92, -6]} />
      <UVLight pos={[CX + 8, 5.92, -6]} />
      <UVLight pos={[CX - 8, 5.92,  6]} />
      <UVLight pos={[CX,     5.92,  6]} />
      <UVLight pos={[CX + 8, 5.92,  6]} />

      {/* ── Walls ── */}
      {/* West wall (back wall) */}
      <mesh position={[CX - 14, 3, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[28, 6]} />
        <primitive object={wallMat} />
      </mesh>
      {/* East wall — with doorway opening at z=[-2.5, 2.5] */}
      <mesh position={[CX + 14, 3, -8.25]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[11.5, 6]} />
        <primitive object={wallMat} />
      </mesh>
      <mesh position={[CX + 14, 3, 8.25]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[11.5, 6]} />
        <primitive object={wallMat} />
      </mesh>
      <mesh position={[CX + 14, 5.7, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[5, 0.6]} />
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

      {/* ── Overhead pipe system (irrigation) ── */}
      {[-8, -2, 4].map((z, i) => (
        <mesh key={`hpipe-${i}`} position={[CX, 5.5, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.055, 0.055, 28, 6]} />
          <primitive object={pipeMat} />
        </mesh>
      ))}
      {/* Vertical drop pipes */}
      {[CX - 10, CX - 4, CX + 4, CX + 10].map((x, i) => [-8, -2, 4].map((z, j) => (
        <mesh key={`dpipe-${i}-${j}`} position={[x, 3.5, z]}>
          <cylinderGeometry args={[0.025, 0.025, 4, 5]} />
          <primitive object={pipeMat} />
        </mesh>
      )))}

      {/* ── Hydroponic beds (3 rows, 4 columns) ── */}
      {[-3, 0, 3].map((dz, row) =>
        [-9, -3, 3, 9].map((dx, col) => (
          <HydroponicBed
            key={`bed-${row}-${col}`}
            pos={[CX + dx, 0.95, dz] as [number, number, number]}
          />
        ))
      )}

      {/* ── Water storage tanks ── */}
      <WaterTank pos={[CX - 12.5, 1.1, -11]} />
      <WaterTank pos={[CX - 12.5, 1.1, -7]}  />
      <WaterTank pos={[CX + 12.5, 1.1,  11]} />
      <WaterTank pos={[CX + 12.5, 1.1,  7]}  />

      {/* ── Wall-mounted grow panels (south + north walls) ── */}
      {[-10, -4, 4, 10].map((x, i) => (
        <group key={`gpanel-${i}`} position={[CX + x, 3.0, -13.6]}>
          <mesh>
            <boxGeometry args={[2.8, 3.2, 0.12]} />
            <meshStandardMaterial color="#0a1a0a" roughness={0.6} />
          </mesh>
          {/* Shelves with small plants */}
          {[0, 0.9, 1.8].map((y, si) => (
            <group key={si}>
              <mesh position={[0, y - 1.2, 0.08]}>
                <boxGeometry args={[2.6, 0.05, 0.28]} />
                <primitive object={metalMat} />
              </mesh>
              {[-0.9, 0, 0.9].map((px, pi) => (
                <PlantCluster key={pi} pos={[px, y - 0.9, 0.1] as [number, number, number]} />
              ))}
            </group>
          ))}
          <pointLight position={[0, 1.5, 0.3]} color="#66ff66" intensity={1.5} distance={5} decay={2} />
        </group>
      ))}

      {/* ── Signage ── */}
      {/* Room header sign */}
      <mesh position={[CX, 5.1, -13.82]}>
        <boxGeometry args={[14, 0.78, 0.1]} />
        <meshStandardMaterial color="#081408" emissive="#002200" emissiveIntensity={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[CX, 5.53, -13.81]} material={vtGreenMat}>
        <boxGeometry args={[14.1, 0.06, 0.08]} />
      </mesh>
      <mesh position={[CX, 4.69, -13.81]} material={vtGreenMat}>
        <boxGeometry args={[14.1, 0.06, 0.08]} />
      </mesh>
      <Text position={[CX, 5.1, -13.77]} fontSize={0.42} color={VT_GREEN_EM}
        anchorX="center" anchorY="middle" letterSpacing={0.18}>
        VAULT 63  ·  HYDROPONICS BAY  ·  SECTOR G
      </Text>
      <Text position={[CX, 5.72, -13.8]} fontSize={0.17} color={VT_YELLOW_EM}
        anchorX="center" anchorY="middle" letterSpacing={0.25}>
        VAULT-TEC AGRI-SCIENCE DIVISION  ·  210 YEARS CONTINUOUS OPERATION
      </Text>

      {/* Warning: radiation-free zone */}
      <mesh position={[CX + 10, 3.4, -13.88]}>
        <boxGeometry args={[5, 0.34, 0.07]} />
        <meshStandardMaterial color="#082008" emissive="#003300" emissiveIntensity={0.35} />
      </mesh>
      <Text position={[CX + 10, 3.4, -13.84]} fontSize={0.14} color={VT_GREEN_EM}
        anchorX="center" anchorY="middle" letterSpacing={0.07}>
        RAD-FREE ZONE  ·  FOOD SAFE SECTOR
      </Text>

      {/* Yellow accent rail */}
      <mesh position={[CX, 1.0, -13.93]} material={vtGreenMat}>
        <boxGeometry args={[28, 0.05, 0.05]} />
      </mesh>
      <mesh position={[CX, 1.0, 13.93]} material={vtGreenMat}>
        <boxGeometry args={[28, 0.05, 0.05]} />
      </mesh>
      <mesh position={[CX - 13.93, 1.0, 0]} material={vtGreenMat}>
        <boxGeometry args={[0.05, 0.05, 28]} />
      </mesh>
      {/* East side: split rail for doorway */}
      <mesh position={[CX + 13.93, 1.0, -8.25]} material={vtGreenMat}>
        <boxGeometry args={[0.05, 0.05, 11.5]} />
      </mesh>
      <mesh position={[CX + 13.93, 1.0, 8.25]} material={vtGreenMat}>
        <boxGeometry args={[0.05, 0.05, 11.5]} />
      </mesh>

      {/* Door frame for east opening */}
      <mesh position={[CX + 14, 3, -2.5]}>
        <boxGeometry args={[0.18, 6, 0.18]} />
        <primitive object={metalMat} />
      </mesh>
      <mesh position={[CX + 14, 3, 2.5]}>
        <boxGeometry args={[0.18, 6, 0.18]} />
        <primitive object={metalMat} />
      </mesh>
      <mesh position={[CX + 14, 5.55, 0]}>
        <boxGeometry args={[0.18, 0.28, 5.36]} />
        <primitive object={metalMat} />
      </mesh>

      {/* Direction sign above doorway */}
      <mesh position={[CX + 13.7, 4.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[3.2, 0.38, 0.06]} />
        <meshStandardMaterial color="#0a2010" emissive="#002a00" emissiveIntensity={0.3} metalness={0.5} />
      </mesh>
      <Text position={[CX + 13.65, 4.5, 0]} rotation={[0, -Math.PI / 2, 0]}
        fontSize={0.16} color={VT_GREEN_EM} anchorX="center" anchorY="middle" letterSpacing={0.06}>
        →  CRYO LAB
      </Text>
    </group>
  );
}

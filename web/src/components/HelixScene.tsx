import { useMemo, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { computeHelix, ensureWasm } from '../wasm/dnaCore'
import { BASE_COLOR } from '../lib/colors'
import type { HelixData, SelectedBase } from '../lib/types'

const SCALE = 0.18
const SENSE_RADIUS = 1.4
const ANTISENSE_RADIUS = 1.05
const BASE_GEOMETRY = new THREE.SphereGeometry(1, 20, 16)
const BACKBONE_RADIUS = 0.18
const BACKBONE_SEGMENTS = 12

interface HelixMeshProps {
  helix: HelixData
  highlightIndex: number | null
  onSelectBase: (b: SelectedBase) => void
  autoRotate: boolean
}

function HelixMesh({ helix, highlightIndex, onSelectBase, autoRotate }: HelixMeshProps) {
  const groupRef = useRef<THREE.Group>(null)
  const senseRef = useRef<THREE.InstancedMesh>(null!)
  const antisenseRef = useRef<THREE.InstancedMesh>(null!)
  const ladderRef = useRef<THREE.InstancedMesh>(null!)

  const senseCount = helix.is_sense.filter((s) => s).length
  const antisenseCount = helix.length - senseCount
  const totalLadders = Math.min(senseCount, helix.length)

  useEffect(() => {
    if (!senseRef.current || !antisenseRef.current || !ladderRef.current) return
    const dummy = new THREE.Object3D()
    const colorSense = new THREE.Color()
    const colorAntisense = new THREE.Color()
    const colorLadder = new THREE.Color('#475569')
    const colorHighlight = new THREE.Color('#fde047')

    for (let i = 0; i < helix.positions.length; i += 3) {
      const idx = i / 3
      const x = helix.positions[i] * SCALE
      const y = helix.positions[i + 1] * SCALE
      const z = helix.positions[i + 2] * SCALE
      const isSense = helix.is_sense[idx]
      const baseCode = helix.bases[idx]
      const baseIdx = helix.indices[idx]
      const isHighlighted = highlightIndex === baseIdx

      dummy.position.set(x, y, z)
      dummy.updateMatrix()

      if (isSense) {
        senseRef.current.setMatrixAt(idx, dummy.matrix)
        const c = isHighlighted
          ? colorHighlight
          : colorSense.set(BASE_COLOR[baseCode as 0 | 1 | 2 | 3 | 4] ?? '#ef4444')
        senseRef.current.setColorAt(idx, c)
      } else {
        antisenseRef.current.setMatrixAt(idx, dummy.matrix)
        const c = isHighlighted
          ? colorHighlight
          : colorAntisense.set(BASE_COLOR[baseCode as 0 | 1 | 2 | 3 | 4] ?? '#ef4444')
        antisenseRef.current.setColorAt(idx, c)
      }
    }

    for (let i = 0; i < totalLadders; i++) {
      const senseIdx = i * 2
      const antisenseIdx = i * 2 + 1
      const sx = helix.positions[senseIdx * 3] * SCALE
      const sy = helix.positions[senseIdx * 3 + 1] * SCALE
      const sz = helix.positions[senseIdx * 3 + 2] * SCALE
      const ax = helix.positions[antisenseIdx * 3] * SCALE
      const ay = helix.positions[antisenseIdx * 3 + 1] * SCALE
      const az = helix.positions[antisenseIdx * 3 + 2] * SCALE
      const mx = (sx + ax) / 2
      const my = (sy + ay) / 2
      const mz = (sz + az) / 2
      const dx = ax - sx
      const dy = ay - sy
      const dz = az - sz
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz)

      dummy.position.set(mx, my, mz)
      dummy.rotation.set(0, 0, 0)
      dummy.lookAt(ax, ay, az)
      dummy.scale.set(1, 1, Math.max(len, 0.1))
      dummy.updateMatrix()
      ladderRef.current.setMatrixAt(i, dummy.matrix)
      ladderRef.current.setColorAt(i, colorLadder)
    }

    senseRef.current.instanceMatrix.needsUpdate = true
    if (senseRef.current.instanceColor) senseRef.current.instanceColor.needsUpdate = true
    antisenseRef.current.instanceMatrix.needsUpdate = true
    if (antisenseRef.current.instanceColor) antisenseRef.current.instanceColor.needsUpdate = true
    ladderRef.current.instanceMatrix.needsUpdate = true
    if (ladderRef.current.instanceColor) ladderRef.current.instanceColor.needsUpdate = true
  }, [helix, highlightIndex, totalLadders])

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.18
    }
  })

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const instanceId = e.instanceId
    if (instanceId == null) return
    const isSense = helix.is_sense[instanceId]
    const baseCode = helix.bases[instanceId] as 0 | 1 | 2 | 3 | 4
    const index = helix.indices[instanceId]
    onSelectBase({ index, is_sense: isSense, base: baseCode })
  }

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={senseRef}
        args={[BASE_GEOMETRY, undefined, senseCount]}
        castShadow
        receiveShadow
        onClick={handleClick}
        scale={[SENSE_RADIUS, SENSE_RADIUS, SENSE_RADIUS]}
      >
        <meshStandardMaterial roughness={0.3} metalness={0.15} emissiveIntensity={0.5} />
      </instancedMesh>
      <instancedMesh
        ref={antisenseRef}
        args={[BASE_GEOMETRY, undefined, antisenseCount]}
        castShadow
        receiveShadow
        onClick={handleClick}
        scale={[ANTISENSE_RADIUS, ANTISENSE_RADIUS, ANTISENSE_RADIUS]}
      >
        <meshStandardMaterial roughness={0.35} metalness={0.1} emissiveIntensity={0.4} />
      </instancedMesh>
      <instancedMesh
        ref={ladderRef}
        args={[new THREE.CylinderGeometry(BACKBONE_RADIUS, BACKBONE_RADIUS, 1, BACKBONE_SEGMENTS), undefined, totalLadders]}
      >
        <meshStandardMaterial roughness={0.6} metalness={0.3} />
      </instancedMesh>
      <BackboneLines helix={helix} />
    </group>
  )
}

function BackboneLines({ helix }: { helix: HelixData }) {
  const geometry = useMemo(() => {
    const positions: number[] = []
    const colors: number[] = []
    const c1 = new THREE.Color('#a78bfa')
    const c2 = new THREE.Color('#22d3ee')
    for (let s = 0; s < 2; s++) {
      for (let i = 0; i + 1 < helix.length; i++) {
        const idx1 = i * 2 + (s === 0 ? 0 : 1)
        const idx2 = (i + 1) * 2 + (s === 0 ? 0 : 1)
        const x1 = helix.positions[idx1 * 3] * SCALE
        const y1 = helix.positions[idx1 * 3 + 1] * SCALE
        const z1 = helix.positions[idx1 * 3 + 2] * SCALE
        const x2 = helix.positions[idx2 * 3] * SCALE
        const y2 = helix.positions[idx2 * 3 + 1] * SCALE
        const z2 = helix.positions[idx2 * 3 + 2] * SCALE
        positions.push(x1, y1, z1, x2, y2, z2)
        const col = s === 0 ? c1 : c2
        colors.push(col.r, col.g, col.b, col.r, col.g, col.b)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    return g
  }, [helix])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial vertexColors linewidth={1} transparent opacity={0.55} />
    </lineSegments>
  )
}

function SceneContents({
  helix,
  highlightIndex,
  onSelectBase,
  autoRotate,
  showStars,
}: {
  helix: HelixData
  highlightIndex: number | null
  onSelectBase: (b: SelectedBase) => void
  autoRotate: boolean
  showStars: boolean
}) {
  const centerAndScale = useMemo(() => {
    if (!helix.length) return { cx: 0, cy: 0, cz: 0, span: 30 }
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    let minZ = Infinity, maxZ = -Infinity
    for (let i = 0; i < helix.positions.length; i += 3) {
      minX = Math.min(minX, helix.positions[i])
      maxX = Math.max(maxX, helix.positions[i])
      minY = Math.min(minY, helix.positions[i + 1])
      maxY = Math.max(maxY, helix.positions[i + 1])
      minZ = Math.min(minZ, helix.positions[i + 2])
      maxZ = Math.max(maxZ, helix.positions[i + 2])
    }
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    const cz = (minZ + maxZ) / 2
    const span = Math.max(maxX - minX, maxY - minY, maxZ - minZ) * SCALE
    return { cx, cy, cz, span }
  }, [helix])

  const cameraDistance = Math.max(centerAndScale.span * 1.4, 18)

  return (
    <>
      <color attach="background" args={['#06060c']} />
      <fog attach="fog" args={['#06060c', cameraDistance * 0.6, cameraDistance * 4]} />
      <ambientLight intensity={0.6} color="#a5b4fc" />
      <directionalLight
        position={[15, 15, 15]}
        intensity={1.3}
        color="#fef3c7"
      />
      <directionalLight position={[-10, -5, -10]} intensity={0.5} color="#22d3ee" />
      <pointLight position={[0, 0, 20]} intensity={0.4} color="#f472b6" />
      {showStars && <Stars radius={120} depth={50} count={2500} factor={4} fade speed={1} />}
      <gridHelper args={[80, 20, '#1e293b', '#0f172a']} position={[0, centerAndScale.cy * SCALE - 6, 0]} />
      <group position={[-centerAndScale.cx * SCALE, -centerAndScale.cy * SCALE, -centerAndScale.cz * SCALE]}>
        <HelixMesh
          helix={helix}
          highlightIndex={highlightIndex}
          onSelectBase={onSelectBase}
          autoRotate={autoRotate}
        />
      </group>
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={4}
        maxDistance={cameraDistance * 4}
        autoRotate={false}
      />
    </>
  )
}

interface HelixSceneProps {
  sequence: string
  highlightIndex: number | null
  onSelectBase: (b: SelectedBase) => void
  autoRotate: boolean
  showStars: boolean
}

export function HelixScene({
  sequence,
  highlightIndex,
  onSelectBase,
  autoRotate,
  showStars,
}: HelixSceneProps) {
  const [helix, setHelix] = useState<HelixData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sequence) {
      setHelix(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        await ensureWasm()
        if (cancelled) return
        const clean = sequence.replace(/[^ATGCatgc]/g, '').toUpperCase()
        if (!clean) {
          setHelix(null)
          return
        }
        const data = computeHelix(clean)
        setHelix(data)
        setError(null)
      } catch (e) {
        if (!cancelled) setError((e as Error).message ?? String(e))
        setHelix(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sequence])

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-rose-300">
        <div className="text-center">
          <p className="text-sm">Could not render helix</p>
          <p className="mt-2 font-mono text-xs text-rose-400/70">{error}</p>
        </div>
      </div>
    )
  }

  if (!helix) {
    return (
      <div className="flex h-full items-center justify-center text-ink-500">
        <p className="text-sm">Type a DNA sequence to render the helix…</p>
      </div>
    )
  }

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [25, 15, 35], fov: 50, near: 0.1, far: 2000 }}
      gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
    >
      <SceneContents
        helix={helix}
        highlightIndex={highlightIndex}
        onSelectBase={onSelectBase}
        autoRotate={autoRotate}
        showStars={showStars}
      />
    </Canvas>
  )
}

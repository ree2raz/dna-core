import { useMemo, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { computeHelix, ensureWasm } from '../wasm/dnaCore'
import { BASE_COLOR } from '../lib/colors'
import type { HelixData, SelectedBase } from '../lib/types'

const SCALE = 0.18
const TUBE_RADIUS = 0.32
const TUBE_RADIAL_SEGMENTS = 12
const RUNG_RADIUS = 0.14
const RUNG_RADIAL_SEGMENTS = 8
const BASE_MARKER_RADIUS = 0.42
const SENSE_BACKBONE_COLOR = '#cbd5e1'
const ANTISENSE_BACKBONE_COLOR = '#94a3b8'
const HIGHLIGHT_COLOR = '#fde047'

interface HelixMeshProps {
  helix: HelixData
  highlightIndex: number | null
  onSelectBase: (b: SelectedBase) => void
  autoRotate: boolean
}

function HelixMesh({ helix, highlightIndex, onSelectBase, autoRotate }: HelixMeshProps) {
  const groupRef = useRef<THREE.Group>(null)
  const rungRef = useRef<THREE.InstancedMesh>(null!)
  const senseMarkerRef = useRef<THREE.InstancedMesh>(null!)
  const antisenseMarkerRef = useRef<THREE.InstancedMesh>(null!)

  const senseCount = helix.is_sense.filter((s) => s).length
  const antisenseCount = helix.length - senseCount

  const sensePositions = useMemo(() => {
    const out: number[] = []
    for (let i = 0; i < helix.positions.length; i += 3) {
      if (helix.is_sense[i / 3]) {
        out.push(helix.positions[i] * SCALE, helix.positions[i + 1] * SCALE, helix.positions[i + 2] * SCALE)
      }
    }
    return out
  }, [helix])

  const antisensePositions = useMemo(() => {
    const out: number[] = []
    for (let i = 0; i < helix.positions.length; i += 3) {
      if (!helix.is_sense[i / 3]) {
        out.push(helix.positions[i] * SCALE, helix.positions[i + 1] * SCALE, helix.positions[i + 2] * SCALE)
      }
    }
    return out
  }, [helix])

  useEffect(() => {
    if (!rungRef.current || !senseMarkerRef.current || !antisenseMarkerRef.current) return
    const dummy = new THREE.Object3D()
    const colorRung = new THREE.Color()
    const colorMarker = new THREE.Color()

    const yAxis = new THREE.Vector3(0, 1, 0)
    const dir = new THREE.Vector3()
    const quat = new THREE.Quaternion()

    for (let i = 0; i < helix.length; i++) {
      const senseIdx = i * 2
      const asIdx = i * 2 + 1
      const sx = helix.positions[senseIdx * 3] * SCALE
      const sy = helix.positions[senseIdx * 3 + 1] * SCALE
      const sz = helix.positions[senseIdx * 3 + 2] * SCALE
      const ax = helix.positions[asIdx * 3] * SCALE
      const ay = helix.positions[asIdx * 3 + 1] * SCALE
      const az = helix.positions[asIdx * 3 + 2] * SCALE

      dir.set(ax - sx, ay - sy, az - sz)
      const len = dir.length()
      dir.normalize()
      quat.setFromUnitVectors(yAxis, dir)

      dummy.position.set((sx + ax) / 2, (sy + ay) / 2, (sz + az) / 2)
      dummy.quaternion.copy(quat)
      dummy.scale.set(1, Math.max(len, 0.01), 1)
      dummy.updateMatrix()
      rungRef.current.setMatrixAt(i, dummy.matrix)

      const senseBase = helix.bases[senseIdx] as 0 | 1 | 2 | 3
      const isHl = highlightIndex === i
      colorRung.set(isHl ? HIGHLIGHT_COLOR : BASE_COLOR[senseBase] ?? '#ef4444')
      rungRef.current.setColorAt(i, colorRung)
    }

    for (let i = 0; i < senseCount; i++) {
      const senseIdx = i * 2
      const x = helix.positions[senseIdx * 3] * SCALE
      const y = helix.positions[senseIdx * 3 + 1] * SCALE
      const z = helix.positions[senseIdx * 3 + 2] * SCALE
      const baseCode = helix.bases[senseIdx] as 0 | 1 | 2 | 3
      const baseIdx = helix.indices[senseIdx]
      const isHl = highlightIndex === baseIdx

      dummy.position.set(x, y, z)
      dummy.quaternion.identity()
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      senseMarkerRef.current.setMatrixAt(i, dummy.matrix)
      colorMarker.set(isHl ? HIGHLIGHT_COLOR : BASE_COLOR[baseCode] ?? '#ef4444')
      senseMarkerRef.current.setColorAt(i, colorMarker)
    }

    for (let i = 0; i < antisenseCount; i++) {
      const asIdx = i * 2 + 1
      const x = helix.positions[asIdx * 3] * SCALE
      const y = helix.positions[asIdx * 3 + 1] * SCALE
      const z = helix.positions[asIdx * 3 + 2] * SCALE
      const baseCode = helix.bases[asIdx] as 0 | 1 | 2 | 3
      const baseIdx = helix.indices[asIdx]
      const isHl = highlightIndex === baseIdx

      dummy.position.set(x, y, z)
      dummy.quaternion.identity()
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      antisenseMarkerRef.current.setMatrixAt(i, dummy.matrix)
      colorMarker.set(isHl ? HIGHLIGHT_COLOR : BASE_COLOR[baseCode] ?? '#ef4444')
      antisenseMarkerRef.current.setColorAt(i, colorMarker)
    }

    rungRef.current.instanceMatrix.needsUpdate = true
    if (rungRef.current.instanceColor) rungRef.current.instanceColor.needsUpdate = true
    senseMarkerRef.current.instanceMatrix.needsUpdate = true
    if (senseMarkerRef.current.instanceColor) senseMarkerRef.current.instanceColor.needsUpdate = true
    antisenseMarkerRef.current.instanceMatrix.needsUpdate = true
    if (antisenseMarkerRef.current.instanceColor) antisenseMarkerRef.current.instanceColor.needsUpdate = true
  }, [helix, highlightIndex, senseCount, antisenseCount])

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.18
    }
  })

  const handleRungClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const id = e.instanceId
    if (id == null) return
    const senseIdx = id * 2
    const baseCode = helix.bases[senseIdx] as 0 | 1 | 2 | 3
    onSelectBase({ index: helix.indices[senseIdx], is_sense: true, base: baseCode })
  }

  const handleSenseMarkerClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const id = e.instanceId
    if (id == null) return
    const senseIdx = id * 2
    const baseCode = helix.bases[senseIdx] as 0 | 1 | 2 | 3
    onSelectBase({ index: helix.indices[senseIdx], is_sense: true, base: baseCode })
  }

  const handleAntisenseMarkerClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const id = e.instanceId
    if (id == null) return
    const asIdx = id * 2 + 1
    const baseCode = helix.bases[asIdx] as 0 | 1 | 2 | 3
    onSelectBase({ index: helix.indices[asIdx], is_sense: false, base: baseCode })
  }

  return (
    <group ref={groupRef}>
      <BackboneTube positions={sensePositions} color={SENSE_BACKBONE_COLOR} />
      <BackboneTube positions={antisensePositions} color={ANTISENSE_BACKBONE_COLOR} />
      <instancedMesh
        ref={rungRef}
        args={[new THREE.CylinderGeometry(RUNG_RADIUS, RUNG_RADIUS, 1, RUNG_RADIAL_SEGMENTS), undefined, helix.length]}
        onClick={handleRungClick}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial roughness={0.4} metalness={0.3} />
      </instancedMesh>
      <instancedMesh
        ref={senseMarkerRef}
        args={[new THREE.SphereGeometry(BASE_MARKER_RADIUS, 18, 14), undefined, senseCount]}
        onClick={handleSenseMarkerClick}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial roughness={0.3} metalness={0.2} />
      </instancedMesh>
      <instancedMesh
        ref={antisenseMarkerRef}
        args={[new THREE.SphereGeometry(BASE_MARKER_RADIUS * 0.85, 18, 14), undefined, antisenseCount]}
        onClick={handleAntisenseMarkerClick}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial roughness={0.35} metalness={0.2} />
      </instancedMesh>
    </group>
  )
}

function BackboneTube({ positions, color }: { positions: number[]; color: string }) {
  const geometry = useMemo(() => {
    if (positions.length < 9) return null
    const pts: THREE.Vector3[] = []
    for (let i = 0; i < positions.length; i += 3) {
      pts.push(new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]))
    }
    if (pts.length < 2) return null
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5)
    const tubularSegments = Math.max(pts.length * 6, 80)
    return new THREE.TubeGeometry(curve, tubularSegments, TUBE_RADIUS, TUBE_RADIAL_SEGMENTS, false)
  }, [positions])

  if (!geometry) return null

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.45} metalness={0.25} />
    </mesh>
  )
}

interface SceneContentsProps {
  helix: HelixData
  highlightIndex: number | null
  onSelectBase: (b: SelectedBase) => void
  autoRotate: boolean
}

function SceneContents({ helix, highlightIndex, onSelectBase, autoRotate }: SceneContentsProps) {
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
      <color attach="background" args={['#0a0a14']} />
      <fog attach="fog" args={['#0a0a14', cameraDistance * 0.7, cameraDistance * 4]} />
      <ambientLight intensity={0.35} color="#a5b4fc" />
      <directionalLight position={[18, 22, 14]} intensity={1.4} color="#ffffff" castShadow />
      <directionalLight position={[-12, -8, -10]} intensity={0.45} color="#60a5fa" />
      <pointLight position={[0, 0, 18]} intensity={0.35} color="#f472b6" />
      <gridHelper
        args={[80, 20, '#1e293b', '#0f172a']}
        position={[0, centerAndScale.cy * SCALE - 8, 0]}
      />
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
      />
    </>
  )
}

interface HelixSceneProps {
  sequence: string
  highlightIndex: number | null
  onSelectBase: (b: SelectedBase) => void
  autoRotate: boolean
}

export function HelixScene({ sequence, highlightIndex, onSelectBase, autoRotate }: HelixSceneProps) {
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
      camera={{ position: [22, 12, 32], fov: 45, near: 0.1, far: 2000 }}
      gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
    >
      <SceneContents
        helix={helix}
        highlightIndex={highlightIndex}
        onSelectBase={onSelectBase}
        autoRotate={autoRotate}
      />
    </Canvas>
  )
}

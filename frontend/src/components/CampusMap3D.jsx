import React, { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, Text, Edges, Line, Html } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import gsap from 'gsap'
import { playHover, playSelect } from '../utils/audio'

// ─── Room Layout ───
const ROOMS_CFG = [
    { id: 'A101', pos: [-6, 0.5, -3] },
    { id: 'A202', pos: [-6, 0.5, 0] },
    { id: 'B101', pos: [-2, 0.5, -3] },
    { id: 'B203', pos: [-2, 0.5, 0] },
    { id: 'C101', pos: [2, 0.5, -3] },
    { id: 'C202', pos: [2, 0.5, 0] },
    { id: 'D101', pos: [6, 0.5, -3] },
    { id: 'D302', pos: [6, 0.5, 0] },
]

const HUB_POS = [0, 0.5, 5]

// Status → base color
const STATUS_COLOR = {
    occupied: '#00d68f',
    predicted_empty_soon: '#ffb300',
    empty: '#1e3a8a',
}

// ─── Power Core ───
function PowerCore({ hasPredictions }) {
    const ringsRef = useRef()
    const coreRef = useRef()
    const waveRef = useRef()
    const waveActive = useRef(false)

    useFrame((state, delta) => {
        if (ringsRef.current) ringsRef.current.rotation.y += delta * 0.5
        if (coreRef.current) {
            coreRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.1)
        }
        // Prediction-wave ring: tight small pulse around the hub
        if (waveRef.current && hasPredictions) {
            const t = state.clock.elapsedTime % 2.5  // faster 2.5s loop
            const s = 1 + t * 2.0                    // max scale 3x (was 7x)
            waveRef.current.scale.setScalar(s)
            waveRef.current.material.opacity = Math.max(0, 0.25 - t * 0.1) // much more subtle
        }
    })

    return (
        <group position={HUB_POS}>
            <mesh ref={coreRef}>
                <sphereGeometry args={[0.5, 32, 32]} />
                <meshBasicMaterial color={[0, 2, 3]} toneMapped={false} />
            </mesh>
            <group ref={ringsRef}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.8, 0.85, 32]} />
                    <meshBasicMaterial color={[0, 1.5, 2.5]} toneMapped={false} side={THREE.DoubleSide} />
                </mesh>
                <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
                    <ringGeometry args={[1, 1.05, 32]} />
                    <meshBasicMaterial color={[0, 1.5, 2.5]} toneMapped={false} side={THREE.DoubleSide} />
                </mesh>
            </group>

            {/* Expanding prediction wave ring */}
            {hasPredictions && (
                <mesh ref={waveRef} rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.9, 1.0, 48]} />
                    <meshBasicMaterial color={[2, 1.2, 0]} toneMapped={false} transparent side={THREE.DoubleSide} />
                </mesh>
            )}

            <Text position={[0, 2, 0]} fontSize={0.3} color="#00e5ff" anchorY="bottom" outlineWidth={0.02} outlineColor="#000">
                POWER HUB
            </Text>
        </group>
    )
}

// ─── Energy Stream (Hub → Building) ───
function EnergyStream({ start, end, room }) {
    const points = useMemo(() => {
        const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(...start),
            new THREE.Vector3(
                (start[0] + end[0]) / 2,
                Math.max(start[1], end[1]) + 2,
                (start[2] + end[2]) / 2
            ),
            new THREE.Vector3(...end)
        )
        return curve.getPoints(50)
    }, [start, end])

    const particleRef = useRef()
    const status = room?.status || 'empty'
    const isPredEmpty = status === 'predicted_empty_soon' && !room?.override_active
    const isActive = status === 'occupied' || isPredEmpty || room?.override_active

    // Speed: slow down when predicted empty
    const speed = isPredEmpty ? 0.25 : 1.0

    useFrame((state) => {
        if (!particleRef.current || !isActive) return
        const t = (state.clock.elapsedTime * speed) % 1
        const idx = Math.floor(t * 49)
        const p1 = points[idx]
        const p2 = points[idx + 1]
        if (p1 && p2) particleRef.current.position.lerpVectors(p1, p2, (t * 49) % 1)
    })

    const lineColor = isPredEmpty ? '#ffb300' : isActive ? '#00e5ff' : '#004466'
    const lineOpacity = isPredEmpty ? 0.25 : isActive ? 0.4 : 0.1

    return (
        <group>
            <Line points={points} color={lineColor} opacity={lineOpacity} transparent lineWidth={isPredEmpty ? 1 : 1.5} />
            {isActive && (
                <mesh ref={particleRef}>
                    <sphereGeometry args={[isPredEmpty ? 0.05 : 0.08, 8, 8]} />
                    <meshBasicMaterial
                        color={isPredEmpty ? [1.8, 0.9, 0] : [0, 2, 3]}
                        toneMapped={false}
                    />
                </mesh>
            )}
        </group>
    )
}

// ─── Prediction Pulse Ring (around building) ───
function PredictionPulse({ color }) {
    const ringRef = useRef()
    useFrame((state) => {
        if (!ringRef.current) return
        const t = (state.clock.elapsedTime * 0.7) % 1
        ringRef.current.scale.setScalar(1 + t * 1.2)
        ringRef.current.material.opacity = Math.max(0, 0.5 - t * 0.5)
    })
    return (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            <ringGeometry args={[1.8, 2.0, 32]} />
            <meshBasicMaterial color={color} transparent side={THREE.DoubleSide} />
        </mesh>
    )
}

// ─── Building Block ───
function Building({ data, room, pred, onClick, isSelected }) {
    const groupRef = useRef()
    const matRef = useRef()
    const edgesRef = useRef()
    const [hovered, setHover] = useState(false)

    const status = room?.status || 'empty'
    const isPredEmpty = status === 'predicted_empty_soon' && !room?.override_active
    const isOcc = status === 'occupied'
    const baseColor = STATUS_COLOR[status] || STATUS_COLOR.empty

    const glowColor = useMemo(() => {
        const c = new THREE.Color(baseColor)
        if (isOcc) c.multiplyScalar(2)
        else if (!isPredEmpty) c.multiplyScalar(0.7)
        return c
    }, [baseColor, isOcc, isPredEmpty])

    useFrame((state) => {
        if (!groupRef.current) return
        const t = state.clock.elapsedTime
        const off = data.pos[0] * 0.1
        groupRef.current.position.y = data.pos[1] + (hovered ? 0.4 : Math.sin(t * 2 + off) * 0.1)

        // Amber pulse for predicted-empty rooms
        if (matRef.current && isPredEmpty) {
            matRef.current.emissiveIntensity = 0.2 + Math.sin(t * 1.5) * 0.18
        }
    })

    const students = isOcc ? Math.min(10, Math.ceil((room?.student_count || 1) / 5)) : 0
    const emissiveIntensity = hovered ? 0.5 : (isOcc ? 0.3 : isPredEmpty ? 0.3 : 0.05)

    return (
        <group
            position={data.pos}
            ref={groupRef}
            onClick={onClick}
            onPointerOver={() => { setHover(true); playHover() }}
            onPointerOut={() => setHover(false)}
        >
            {/* Ground light pillar */}
            <mesh position={[0, -0.5, 0]}>
                <cylinderGeometry args={[1.5, 1.5, 1, 32]} />
                <meshBasicMaterial color={baseColor} transparent opacity={hovered ? 0.2 : 0.05} depthWrite={false} />
            </mesh>

            {/* Prediction pulse rings */}
            {isPredEmpty && <PredictionPulse color={baseColor} />}

            {/* Building body */}
            <mesh>
                <boxGeometry args={[3, 1.5, 2]} />
                <meshStandardMaterial
                    ref={matRef}
                    color={hovered ? baseColor : '#050a1f'}
                    emissive={baseColor}
                    emissiveIntensity={emissiveIntensity}
                    transparent
                    opacity={0.6}
                />
                <Edges linewidth={hovered || isSelected ? 3 : isPredEmpty ? 2 : 1} threshold={15} color={glowColor} />
            </mesh>

            {/* Student particles */}
            {students > 0 && Array.from({ length: students }).map((_, i) => (
                <mesh key={i} position={[-1 + (i % 4) * 0.6, 0, -0.5 + Math.floor(i / 4) * 0.5]}>
                    <sphereGeometry args={[0.06, 8, 8]} />
                    <meshBasicMaterial color={[1, 3, 2]} toneMapped={false} />
                </mesh>
            ))}

            {/* Static text labels */}
            <Text position={[0, 1.5, 0]} fontSize={0.3} color="#fff" outlineWidth={0.02} outlineColor={baseColor}>
                {data.id}
            </Text>
            <Text position={[0, 1.1, 0]} fontSize={0.2} color={isOcc ? '#00e5ff' : isPredEmpty ? '#ffb300' : '#888'} outlineWidth={0.01} outlineColor="#000">
                ⚡ {(room?.current_power_kw || 0).toFixed(1)} kW
            </Text>
            {isPredEmpty && pred?.predicted_empty_minutes != null && (
                <Text position={[0, 1.9, 0]} fontSize={0.22} color="#ffb300" outlineWidth={0.01} outlineColor="#000">
                    {`⚠ ~${pred.predicted_empty_minutes}min`}
                </Text>
            )}
            {room?.override_active && (
                <Text position={[0, 1.9, 0]} fontSize={0.25} color="#ff7043" outlineWidth={0.01} outlineColor="#000">
                    ⚠ OVERRIDE
                </Text>
            )}

            {/* Floating HTML HUD tag */}
            {(hovered || isSelected) && room && (
                <Html position={[0, 2.5, 0]} center zIndexRange={[100, 0]}>
                    <div className="holo-tag">
                        <div className="holo-tag__title">{data.id} — {room.status?.replace(/_/g, ' ')}</div>
                        <div className="holo-tag__stat">👤 {room.student_count} Students</div>
                        <div className="holo-tag__stat">⚡ {room.current_power_kw?.toFixed(1)} kW</div>
                        <div className="holo-tag__stat">📶 {room.wifi_devices} Devices</div>
                        {pred?.predicted_empty_minutes != null && (
                            <div className="holo-tag__stat holo-tag__warn">
                                ⚠ Power down in ~{pred.predicted_empty_minutes} min
                                ({Math.round((pred.prediction_probability ?? 0) * 100)}% confident)
                            </div>
                        )}
                    </div>
                </Html>
            )}
        </group>
    )
}

// ─── Camera Fly-To ───
function CameraController({ selectedRoom }) {
    const { camera } = useThree()
    const prevSelected = useRef(null)
    const controls = useThree(state => state.controls)

    useEffect(() => {
        if (!selectedRoom || selectedRoom === prevSelected.current || !controls) return
        prevSelected.current = selectedRoom
        const cfg = ROOMS_CFG.find(r => r.id === selectedRoom)
        if (!cfg) return
        playSelect()
        gsap.to(camera.position, { x: cfg.pos[0] + 3, y: cfg.pos[1] + 5, z: cfg.pos[2] + 6, duration: 1.2, ease: 'power2.inOut' })
        gsap.to(controls.target, { x: cfg.pos[0], y: cfg.pos[1] + 1, z: cfg.pos[2], duration: 1.2, ease: 'power2.inOut', onUpdate: () => controls.update() })
    }, [selectedRoom, camera, controls])

    return null
}

// ─── Day/Night Lighting ───
function EnvironmentController({ simHour }) {
    const { scene } = useThree()
    const sunHeight = Math.sin(((simHour - 6) / 24) * Math.PI * 2)
    const factor = Math.max(0, sunHeight)
    const targetBg = useMemo(() => new THREE.Color().lerpColors(
        new THREE.Color('#010204'),
        new THREE.Color('#05112a'),
        factor
    ), [factor])
    useFrame(() => {
        if (!scene.background) scene.background = new THREE.Color()
        scene.background.lerp(targetBg, 0.05)
    })
    return (
        <>
            <ambientLight intensity={0.5 + factor * 1.5} color="#224488" />
            <directionalLight position={[10, 10, 5]} intensity={0.3 + factor * 2.5} color="#00e5ff" />
            <spotLight position={[0, 15, 0]} angle={0.8} penumbra={1} intensity={5} color="#00d68f" />
        </>
    )
}

// ─── Main Scene ───
export default function CampusMap3D({ rooms, preds, onRoomClick, selectedRoom, simHour = 12 }) {
    const roomMap = Object.fromEntries(rooms.map(r => [r.id, r]))
    const predMap = Object.fromEntries(preds.map(p => [p.room, p]))

    const hasPredictions = preds.some(p => p.predicted_empty_minutes != null)

    return (
        <Canvas camera={{ position: [0, 8, 12], fov: 60 }} gl={{ antialias: false }}>
            <EnvironmentController simHour={simHour} />

            <Grid
                args={[100, 100]}
                cellSize={1} cellThickness={1} cellColor="#003355"
                sectionSize={5} sectionThickness={1.5} sectionColor="#0088ff"
                fadeDistance={40} fadeStrength={1.5}
                position={[0, 0, 0]}
            />

            <PowerCore hasPredictions={hasPredictions} />

            {ROOMS_CFG.map(cfg => {
                const room = roomMap[cfg.id]
                const pred = predMap[cfg.id]
                return (
                    <React.Fragment key={cfg.id}>
                        <Building
                            data={cfg}
                            room={room}
                            pred={pred}
                            isSelected={selectedRoom === cfg.id}
                            onClick={(e) => { e.stopPropagation(); onRoomClick?.(cfg.id) }}
                        />
                        <EnergyStream start={HUB_POS} end={cfg.pos} room={room} />
                    </React.Fragment>
                )
            })}

            <EffectComposer disableNormalPass>
                <Bloom luminanceThreshold={0.5} mipmapBlur luminanceSmoothing={0.9} intensity={1.5} />
            </EffectComposer>

            <CameraController selectedRoom={selectedRoom} />

            <OrbitControls
                makeDefault
                minPolarAngle={0}
                maxPolarAngle={Math.PI / 2.2}
                maxDistance={25}
                minDistance={5}
                target={[0, 0, 0]}
            />
        </Canvas>
    )
}

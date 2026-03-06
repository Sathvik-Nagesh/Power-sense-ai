import React, { useRef, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, Text, Edges, Line } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

// Defines building locations in 3D (X, Y, Z) (Y is up/down)
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

const getStatusColor = (status) => {
    if (status === 'occupied') return '#00d68f' // neon green
    if (status === 'predicted_empty_soon') return '#ffb300' // amber
    return '#1e3a8a' // deep blue for empty
}

// -------------------------------------------------------------
// The Central Power Core
function PowerCore() {
    const ringsRef = useRef()
    const coreRef = useRef()

    useFrame((state, delta) => {
        if (ringsRef.current) ringsRef.current.rotation.y += delta * 0.5
        if (coreRef.current) {
            coreRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.1)
        }
    })

    return (
        <group position={HUB_POS}>
            {/* Central Glowing Sphere */}
            <mesh ref={coreRef} position={[0, 0, 0]}>
                <sphereGeometry args={[0.5, 32, 32]} />
                <meshBasicMaterial color={[0, 2, 3]} toneMapped={false} />
            </mesh>

            {/* Rotating Rings */}
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

            {/* Hub Label */}
            <Text position={[0, 2, 0]} fontSize={0.3} color="#00e5ff" anchorY="bottom" outlineWidth={0.02} outlineColor="#000">
                POWER HUB
            </Text>
        </group>
    )
}

// -------------------------------------------------------------
// Animated Energy Streams Hub -> Building
function EnergyStream({ start, end, status }) {
    const points = useMemo(() => {
        // A classic bezier curve to make lines jump up nicely
        const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(...start),
            new THREE.Vector3((start[0] + end[0]) / 2, Math.max(start[1], end[1]) + 2, (start[2] + end[2]) / 2),
            new THREE.Vector3(...end)
        )
        return curve.getPoints(50)
    }, [start, end])

    const particleRef = useRef()

    const isActive = status === 'occupied' || status === 'predicted_empty_soon'
    const isWarn = status === 'predicted_empty_soon'

    // Set up particle travel
    useFrame((state) => {
        if (!particleRef.current || !isActive) return
        const time = state.clock.elapsedTime
        const speed = isWarn ? 0.3 : 1
        const t = (time * speed) % 1
        // interpolate along points
        const idx = Math.floor(t * 49)
        const p1 = points[idx]
        const p2 = points[idx + 1]
        if (p1 && p2) {
            particleRef.current.position.lerpVectors(p1, p2, (t * 49) % 1)
        }
    })

    // Stream colors depend on status
    let lineColor = '#004466'
    if (isActive) lineColor = '#00e5ff'
    if (isWarn) lineColor = '#ffb300'

    return (
        <group>
            {/* Background Line */}
            <Line
                points={points}
                color={lineColor}
                opacity={isActive ? 0.4 : 0.1}
                transparent
                lineWidth={1.5}
            />
            {/* Moving Energy Pulse */}
            {isActive && (
                <mesh ref={particleRef}>
                    <sphereGeometry args={[0.08, 8, 8]} />
                    <meshBasicMaterial color={isWarn ? [2, 1.5, 0] : [0, 2, 3]} toneMapped={false} />
                </mesh>
            )}
        </group>
    )
}

// -------------------------------------------------------------
// Individual Holographic Building
function Building({ data, room, pred, onClick, isSelected }) {
    const groupRef = useRef()
    const [hovered, setHover] = useState(false)

    const status = room?.status || 'empty'
    const baseColor = getStatusColor(status)

    // Create a glowing color for R3F bloom
    const glowColor = new THREE.Color(baseColor)
    if (status === 'occupied') glowColor.multiplyScalar(2) // extra bright
    else if (status === 'empty') glowColor.multiplyScalar(0.7) // dimmed

    useFrame((state) => {
        if (!groupRef.current) return
        // Floating motion
        const time = state.clock.elapsedTime
        // unique offset per building based on pos X to desync animation
        const offset = data.pos[0] * 0.1
        groupRef.current.position.y = data.pos[1] + (hovered ? 0.4 : Math.sin(time * 2 + offset) * 0.1)
    })

    // Students count (dots inside)
    const isOcc = status === 'occupied'
    const students = isOcc ? Math.min(10, Math.ceil((room?.student_count || 1) / 5)) : 0

    return (
        <group position={data.pos} ref={groupRef} onClick={onClick}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}>

            {/* Light Pillar connecting to floor */}
            <mesh position={[0, -0.5, 0]}>
                <cylinderGeometry args={[1.5, 1.5, 1, 32]} />
                <meshBasicMaterial color={baseColor} transparent opacity={hovered ? 0.2 : 0.05} depthWrite={false} />
            </mesh>

            {/* Main Building Block */}
            <mesh>
                <boxGeometry args={[3, 1.5, 2]} />
                <meshStandardMaterial
                    color={hovered ? baseColor : "#050a1f"}
                    emissive={baseColor}
                    emissiveIntensity={hovered ? 0.5 : (isOcc ? 0.3 : 0.05)}
                    transparent opacity={0.6}
                />
                {/* Holographic Wireframe Edges */}
                <Edges
                    linewidth={hovered || isSelected ? 3 : 1}
                    threshold={15}
                    color={glowColor}
                />
            </mesh>

            {/* Internal Student Particles */}
            {students > 0 && Array.from({ length: students }).map((_, i) => (
                <mesh key={i} position={[
                    -1 + (i % 4) * 0.6,
                    0,
                    -0.5 + Math.floor(i / 4) * 0.5
                ]}>
                    <sphereGeometry args={[0.06, 8, 8]} />
                    <meshBasicMaterial color={[1, 3, 2]} toneMapped={false} />
                </mesh>
            ))}

            {/* Label above building */}
            <Text position={[0, 1.5, 0]} fontSize={0.3} color="#fff" outlineWidth={0.02} outlineColor={baseColor}>
                {data.id}
            </Text>

            {/* Small floating power text */}
            <Text position={[0, 1.1, 0]} fontSize={0.2} color={isOcc ? "#00e5ff" : "#888"} outlineWidth={0.01} outlineColor="#000">
                ⚡ {(room?.current_power_kw || 0).toFixed(1)} kW
            </Text>

            {/* Overriden Warning */}
            {room?.override_active && (
                <Text position={[0, 1.9, 0]} fontSize={0.25} color="#ff7043" outlineWidth={0.01} outlineColor="#000">
                    ⚠ OVERRIDE
                </Text>
            )}
        </group>
    )
}

// -------------------------------------------------------------
// Main Exported Scene
export default function CampusMap3D({ rooms, preds, onRoomClick, selectedRoom }) {
    const roomMap = Object.fromEntries(rooms.map(r => [r.id, r]))
    const predMap = Object.fromEntries(preds.map(p => [p.room, p]))

    return (
        <Canvas camera={{ position: [0, 8, 12], fov: 60 }} gl={{ antialias: false }}>
            <color attach="background" args={['#03050c']} />

            {/* Lighting */}
            <ambientLight intensity={1.5} color="#224488" />
            <directionalLight position={[10, 10, 5]} intensity={2} color="#00e5ff" />
            <spotLight position={[0, 15, 0]} angle={0.8} penumbra={1} intensity={5} color="#00d68f" />

            {/* Holographic Floor Grid */}
            <Grid
                args={[100, 100]}
                cellSize={1} cellThickness={1} cellColor="#003355"
                sectionSize={5} sectionThickness={1.5} sectionColor="#0088ff"
                fadeDistance={40} fadeStrength={1.5}
                position={[0, 0, 0]}
            />

            <PowerCore />

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
                        <EnergyStream
                            start={HUB_POS}
                            end={cfg.pos}
                            status={room?.status}
                        />
                    </React.Fragment>
                )
            })}

            {/* Postprocessing / Bloom Effect for Hologram Neon */}
            <EffectComposer disableNormalPass>
                <Bloom luminanceThreshold={0.5} mipmapBlur luminanceSmoothing={0.9} intensity={1.5} />
            </EffectComposer>

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

import { useMemo } from 'react'

/**
 * SVG Campus Map with animated power grid wires.
 * Each building block color-codes by occupancy status.
 * Wire pulses glow when room is active, dim when empty.
 */
export default function CampusMap({ rooms = [], predictions = [], onRoomClick, selectedRoom }) {
    const roomPositions = {
        'A101': { x: 80, y: 60, w: 100, h: 70 },
        'A202': { x: 80, y: 160, w: 100, h: 70 },
        'B101': { x: 240, y: 60, w: 100, h: 70 },
        'B203': { x: 240, y: 160, w: 100, h: 70 },
        'C101': { x: 400, y: 60, w: 100, h: 70 },
        'C202': { x: 400, y: 160, w: 100, h: 70 },
        'D101': { x: 560, y: 60, w: 100, h: 70 },
        'D302': { x: 560, y: 160, w: 100, h: 70 },
    }

    const powerStation = { x: 340, y: 330 }

    const getStatusColor = (room) => {
        if (!room) return '#64748b'
        switch (room.status) {
            case 'occupied': return '#10b981'
            case 'empty': return '#ef4444'
            case 'predicted_empty_soon': return '#f59e0b'
            default: return '#64748b'
        }
    }

    const getGlowFilter = (status) => {
        switch (status) {
            case 'occupied': return 'url(#glow-green)'
            case 'empty': return 'none'
            case 'predicted_empty_soon': return 'url(#glow-yellow)'
            default: return 'none'
        }
    }

    const roomMap = useMemo(() => {
        const map = {}
        rooms.forEach(r => { map[r.id] = r })
        return map
    }, [rooms])

    return (
        <svg viewBox="0 0 720 400" className="campus-svg" style={{ width: '100%', height: '100%' }}>
            <defs>
                {/* Glow filters */}
                <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feFlood floodColor="#10b981" floodOpacity="0.6" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                    <feMerge>
                        <feMergeNode in="glow" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <filter id="glow-yellow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feFlood floodColor="#f59e0b" floodOpacity="0.6" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                    <feMerge>
                        <feMergeNode in="glow" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feFlood floodColor="#00f7ff" floodOpacity="0.7" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                    <feMerge>
                        <feMergeNode in="glow" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feFlood floodColor="#ef4444" floodOpacity="0.4" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                    <feMerge>
                        <feMergeNode in="glow" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                {/* Wire gradient */}
                <linearGradient id="wire-gradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00f7ff" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
                </linearGradient>

                {/* Building pattern */}
                <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                </pattern>
            </defs>

            {/* Background grid */}
            <rect width="720" height="400" fill="url(#grid-pattern)" />

            {/* Building labels */}
            <text x="130" y="42" fill="#94a3b8" fontSize="11" textAnchor="middle" fontWeight="600" fontFamily="Inter">BLOCK A</text>
            <text x="290" y="42" fill="#94a3b8" fontSize="11" textAnchor="middle" fontWeight="600" fontFamily="Inter">BLOCK B</text>
            <text x="450" y="42" fill="#94a3b8" fontSize="11" textAnchor="middle" fontWeight="600" fontFamily="Inter">BLOCK C</text>
            <text x="610" y="42" fill="#94a3b8" fontSize="11" textAnchor="middle" fontWeight="600" fontFamily="Inter">BLOCK D</text>

            {/* Power wires from station to each room */}
            {Object.entries(roomPositions).map(([roomId, pos]) => {
                const room = roomMap[roomId]
                const isActive = room?.status === 'occupied' || room?.status === 'predicted_empty_soon'
                const midX = pos.x + pos.w / 2
                const midY = pos.y + pos.h

                return (
                    <path
                        key={`wire-${roomId}`}
                        d={`M ${powerStation.x} ${powerStation.y} C ${powerStation.x} ${midY + 40} ${midX} ${midY + 40} ${midX} ${midY}`}
                        className={`wire-path ${isActive ? 'active' : 'inactive'}`}
                        style={isActive ? {
                            stroke: '#00f7ff',
                            filter: 'drop-shadow(0 0 6px #00f7ff)',
                            strokeDasharray: '8 4',
                            animation: `wire-flow ${1 / (room?.status === 'predicted_empty_soon' ? 0.5 : 1)}s linear infinite`,
                        } : {
                            stroke: '#64748b',
                            opacity: 0.15,
                            strokeDasharray: '4 4',
                        }}
                    />
                )
            })}

            {/* Building blocks */}
            {Object.entries(roomPositions).map(([roomId, pos]) => {
                const room = roomMap[roomId]
                const color = getStatusColor(room)
                const isSelected = selectedRoom === roomId
                const prediction = predictions.find(p => p.room === roomId)

                return (
                    <g
                        key={roomId}
                        className="building-block"
                        onClick={() => onRoomClick?.(roomId)}
                        style={{ cursor: 'pointer' }}
                    >
                        {/* Building shadow */}
                        <rect
                            x={pos.x + 3}
                            y={pos.y + 3}
                            width={pos.w}
                            height={pos.h}
                            rx={6}
                            fill="rgba(0,0,0,0.3)"
                        />

                        {/* Building block */}
                        <rect
                            x={pos.x}
                            y={pos.y}
                            width={pos.w}
                            height={pos.h}
                            rx={6}
                            fill={`${color}15`}
                            stroke={color}
                            strokeWidth={isSelected ? 2.5 : 1.5}
                            filter={getGlowFilter(room?.status)}
                            style={{
                                transition: 'all 0.5s ease',
                                opacity: room?.status === 'empty' ? 0.6 : 1,
                            }}
                        />

                        {/* Room light glow effect */}
                        {room?.status !== 'empty' && (
                            <rect
                                x={pos.x + 8}
                                y={pos.y + 8}
                                width={pos.w - 16}
                                height={pos.h - 16}
                                rx={3}
                                fill={color}
                                opacity={0.08}
                            >
                                <animate
                                    attributeName="opacity"
                                    values="0.05;0.12;0.05"
                                    dur="3s"
                                    repeatCount="indefinite"
                                />
                            </rect>
                        )}

                        {/* Room ID */}
                        <text
                            x={pos.x + pos.w / 2}
                            y={pos.y + 25}
                            fill={color}
                            fontSize="13"
                            textAnchor="middle"
                            fontWeight="700"
                            fontFamily="JetBrains Mono, monospace"
                        >
                            {roomId}
                        </text>

                        {/* Status indicator */}
                        <circle
                            cx={pos.x + pos.w - 12}
                            cy={pos.y + 14}
                            r={4}
                            fill={color}
                        >
                            {room?.status !== 'empty' && (
                                <animate
                                    attributeName="opacity"
                                    values="1;0.4;1"
                                    dur="2s"
                                    repeatCount="indefinite"
                                />
                            )}
                        </circle>

                        {/* Student icons */}
                        <text
                            x={pos.x + pos.w / 2}
                            y={pos.y + 44}
                            fill="#f1f5f9"
                            fontSize="10"
                            textAnchor="middle"
                            opacity={room?.is_occupied ? 1 : 0.2}
                            style={{ transition: 'opacity 0.8s ease' }}
                        >
                            {room?.is_occupied
                                ? '👤'.repeat(Math.min(5, Math.ceil((room?.student_count || 0) / (room?.capacity || 1) * 5)))
                                : '👤👤👤👤👤'}
                        </text>

                        {/* Power indicator */}
                        <text
                            x={pos.x + pos.w / 2}
                            y={pos.y + pos.h - 10}
                            fill={room?.status === 'empty' ? '#64748b' : '#00f7ff'}
                            fontSize="8"
                            textAnchor="middle"
                            fontFamily="JetBrains Mono, monospace"
                        >
                            ⚡ {room?.current_power_kw?.toFixed(1) || '0.0'} kW
                        </text>
                    </g>
                )
            })}

            {/* Central Power Station */}
            <g className="power-station">
                <rect
                    x={powerStation.x - 40}
                    y={powerStation.y - 20}
                    width={80}
                    height={40}
                    rx={8}
                    fill="rgba(0, 247, 255, 0.08)"
                    stroke="#00f7ff"
                    strokeWidth={2}
                    filter="url(#glow-cyan)"
                />
                <text
                    x={powerStation.x}
                    y={powerStation.y - 2}
                    fill="#00f7ff"
                    fontSize="10"
                    textAnchor="middle"
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                >
                    ⚡ MAIN GRID
                </text>
                <text
                    x={powerStation.x}
                    y={powerStation.y + 12}
                    fill="#94a3b8"
                    fontSize="8"
                    textAnchor="middle"
                    fontFamily="JetBrains Mono, monospace"
                >
                    Power Substation
                </text>
            </g>

            {/* Campus label */}
            <text x="360" y="390" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="Inter" letterSpacing="3">
                POWERSENSE AI — CAMPUS ENERGY GRID
            </text>
        </svg>
    )
}

import { useMemo } from 'react'

/**
 * Classroom detail card with student icon animations,
 * device toggle indicators, and manual override button.
 */
export default function ClassroomCard({ room, prediction, energy, isSelected, onSelect, onOverride }) {
    if (!room) return null

    const status = room.status || 'empty'
    const studentIcons = useMemo(() => {
        const maxIcons = 6
        const count = room.is_occupied
            ? Math.max(1, Math.ceil((room.student_count / room.capacity) * maxIcons))
            : 0
        return Array.from({ length: maxIcons }, (_, i) => ({
            visible: i < count,
            key: i,
        }))
    }, [room.is_occupied, room.student_count, room.capacity])

    const predText = prediction
        ? `${(prediction.predicted_occupancy * 100).toFixed(0)}%`
        : '--'

    const pred30Text = prediction
        ? `${(prediction.predicted_occupancy_30min * 100).toFixed(0)}%`
        : '--'

    return (
        <div
            className={`room-card ${status} ${isSelected ? 'selected' : ''}`}
            onClick={onSelect}
            style={isSelected ? {
                boxShadow: `0 0 20px ${status === 'occupied' ? 'rgba(16,185,129,0.15)' :
                    status === 'predicted_empty_soon' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'}`,
                borderColor: status === 'occupied' ? '#10b981' : status === 'predicted_empty_soon' ? '#f59e0b' : '#ef4444',
            } : {}}
        >
            <div className="room-card-header">
                <span className="room-id">{room.id}</span>
                <span className={`room-status-badge ${status}`}>
                    {status === 'predicted_empty_soon' ? '⚠ EMPTYING' :
                        status === 'occupied' ? '● ACTIVE' : '○ EMPTY'}
                </span>
            </div>

            <div className="room-name">
                {room.name} · {room.building} · Floor {room.floor}
            </div>

            {/* Student icons with fade animation */}
            <div className="room-students">
                {studentIcons.map(({ visible, key }) => (
                    <span
                        key={key}
                        className={`student-icon ${visible ? 'visible' : 'hidden'}`}
                        style={{
                            transitionDelay: `${key * 0.08}s`,
                        }}
                    >
                        👤
                    </span>
                ))}
                <span style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    marginLeft: '4px',
                    alignSelf: 'center',
                }}>
                    {room.student_count}/{room.capacity}
                </span>
            </div>

            {/* Device indicators */}
            <div className="room-devices">
                <span className={`device-indicator ${room.lights_on ? 'on' : 'off'}`}>
                    💡 {room.lights_on ? 'ON' : 'OFF'}
                </span>
                <span className={`device-indicator ${room.ac_on ? 'on' : 'off'}`}>
                    ❄️ {room.ac_on ? 'ON' : 'OFF'}
                </span>
                <span className={`device-indicator ${room.fans_on ? 'on' : 'off'}`}>
                    🌀 {room.fans_on ? 'ON' : 'OFF'}
                </span>
            </div>

            {/* Metrics */}
            <div className="room-meta">
                <span className="room-power">⚡ {room.current_power_kw?.toFixed(2)} kW</span>
                <span className="room-prediction">
                    Now: {predText} · 30min: {pred30Text}
                </span>
            </div>

            {/* Recommendation */}
            {prediction?.recommendation && prediction.recommendation !== 'keep_power_on' && (
                <div style={{
                    marginTop: '8px',
                    padding: '4px 8px',
                    background: prediction.recommendation === 'turn_off_all'
                        ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    borderRadius: '4px',
                    fontSize: '0.65rem',
                    color: prediction.recommendation === 'turn_off_all' ? '#ef4444' : '#f59e0b',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                }}>
                    🤖 AI: {prediction.recommendation.replace(/_/g, ' ')}
                </div>
            )}

            {/* Override button */}
            <button
                className={`override-btn ${room.override_active ? 'active' : ''}`}
                onClick={(e) => {
                    e.stopPropagation()
                    onOverride(room.id, !room.override_active)
                }}
            >
                {room.override_active ? '🔓 Remove Override' : '🔒 Faculty Override'}
            </button>

            {room.override_active && (
                <div style={{
                    marginTop: '4px',
                    fontSize: '0.6rem',
                    color: 'var(--accent-orange)',
                    textAlign: 'center',
                }}>
                    Manual override active — {room.override_by || 'Faculty'}
                </div>
            )}
        </div>
    )
}

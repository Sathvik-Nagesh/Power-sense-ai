/**
 * Simulation playback controls — play/pause, step, reset, speed selector.
 */
export default function SimulationControls({
    isPlaying,
    speed,
    onTogglePlay,
    onStep,
    onReset,
    onSpeedChange,
}) {
    return (
        <div className="sim-controls">
            <button
                className={`sim-btn primary ${isPlaying ? 'active' : ''}`}
                onClick={onTogglePlay}
            >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>

            <button className="sim-btn" onClick={onStep} disabled={isPlaying}>
                ⏭ Step
            </button>

            <button className="sim-btn" onClick={onReset}>
                🔄 Reset
            </button>

            <span className="speed-label">Speed:</span>
            <div className="speed-selector">
                {[1, 2, 4].map(s => (
                    <button
                        key={s}
                        className={`speed-btn ${speed === s ? 'active' : ''}`}
                        onClick={() => onSpeedChange(s)}
                    >
                        {s}x
                    </button>
                ))}
            </div>

            <div style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.7rem',
                color: isPlaying ? '#10b981' : '#64748b',
            }}>
                <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isPlaying ? '#10b981' : '#64748b',
                    animation: isPlaying ? 'pulse-dot 1.5s ease-in-out infinite' : 'none',
                }} />
                {isPlaying ? 'Simulating...' : 'Paused'}
            </div>
        </div>
    )
}

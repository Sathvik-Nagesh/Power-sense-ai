/**
 * Energy usage heatmap — shows campus rooms color-coded by efficiency.
 * Red = high energy consumption, Green = optimized/efficient.
 */
export default function EnergyHeatmap({ energyUsage = [] }) {
    const getHeatColor = (efficiency) => {
        if (efficiency > 70) return { bg: 'rgba(16, 185, 129, 0.2)', border: '#10b981', text: '#10b981' }
        if (efficiency > 40) return { bg: 'rgba(245, 158, 11, 0.2)', border: '#f59e0b', text: '#f59e0b' }
        if (efficiency > 15) return { bg: 'rgba(249, 115, 22, 0.2)', border: '#f97316', text: '#f97316' }
        return { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#ef4444' }
    }

    return (
        <div className="heatmap-grid">
            {energyUsage.map((room) => {
                const colors = getHeatColor(room.efficiency_pct || 0)
                return (
                    <div
                        key={room.room}
                        className="heatmap-cell"
                        style={{
                            background: colors.bg,
                            border: `1px solid ${colors.border}30`,
                            color: colors.text,
                        }}
                    >
                        <div className="heatmap-label">{room.room}</div>
                        <div className="heatmap-value">{room.current_power_kw?.toFixed(1)} kW</div>
                        <div className="heatmap-value" style={{ fontSize: '0.6rem' }}>
                            {room.efficiency_pct?.toFixed(0)}% saved
                        </div>
                        {room.override_active && (
                            <div style={{ fontSize: '0.55rem', color: '#f97316', marginTop: '2px' }}>
                                ⚠ OVERRIDE
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

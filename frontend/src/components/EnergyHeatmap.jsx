export default function EnergyHeatmap({ energyUsage = [] }) {
    const getColors = (eff) => {
        if (eff > 65) return { bg: 'rgba(0,214,143,.18)', border: 'rgba(0,214,143,.3)', text: '#00d68f' }
        if (eff > 40) return { bg: 'rgba(0,191,165,.15)', border: 'rgba(0,191,165,.25)', text: '#00bfa5' }
        if (eff > 20) return { bg: 'rgba(255,179,0,.15)', border: 'rgba(255,179,0,.25)', text: '#ffb300' }
        return { bg: 'rgba(255,71,87,.12)', border: 'rgba(255,71,87,.2)', text: '#ff4757' }
    }

    return (
        <div className="heatmap">
            {energyUsage.map(room => {
                const { bg, border, text } = getColors(room.efficiency_pct || 0)
                return (
                    <div key={room.room} className="hm-cell"
                        style={{ background: bg, borderColor: border, color: text }}>
                        <div className="hm-cell__id">{room.room}</div>
                        <div className="hm-cell__val">{room.current_power_kw?.toFixed(1)} kW</div>
                        <div className="hm-cell__val">💾 {room.efficiency_pct?.toFixed(0)}%</div>
                        {room.override_active && (
                            <div style={{ fontSize: '.55rem', color: '#ff7043', marginTop: '2px' }}>⚠ OVR</div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

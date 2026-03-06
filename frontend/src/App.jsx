import { useState, useEffect, useCallback, useRef } from 'react'
import './index.css'
import CampusMap3D from './components/CampusMap3D'
import ClassroomCard from './components/ClassroomCard'
import EnergyDashboard from './components/EnergyDashboard'
import EnergyHeatmap from './components/EnergyHeatmap'
import AlertTicker from './components/AlertTicker'
import AiForecastPanel from './components/AiForecastPanel'
import { playOverride, playPowerDown, playPowerUp, startAmbient, setMuteState } from './utils/audio'

const API = 'http://localhost:8000/api'

// Timetable per room
const TIMETABLES = {
  A101: [[8, 10], [11, 13], [14, 16]],
  A202: [[9, 11], [13, 15]],
  B101: [[8, 10], [10, 12], [14, 17]],
  B203: [[10, 12], [15, 17]],
  C101: [[9, 12], [14, 16]],
  C202: [[8, 10], [13, 16]],
  D101: [[9, 11], [11, 13], [15, 17]],
  D302: [[10, 12], [14, 16]],
}

function fmt(iso) {
  if (!iso) return '--:--'
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) +
    '  ·  ' + d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function App() {
  const [rooms, setRooms] = useState([])
  const [preds, setPreds] = useState([])
  const [energy, setEnergy] = useState([])
  const [stats, setStats] = useState(null)
  const [curTime, setCurTime] = useState('')
  const [simHour, setSimHour] = useState(7)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [expanded, setExpanded] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const timerRef = useRef(null)

  const fetchAll = useCallback(async () => {
    try {
      const [rRes, pRes, eRes, sRes] = await Promise.all([
        fetch(`${API}/rooms`),
        fetch(`${API}/predictions`),
        fetch(`${API}/energy-usage`),
        fetch(`${API}/stats`),
      ])
      const rD = await rRes.json()
      const pD = await pRes.json()
      const eD = await eRes.json()
      const sD = await sRes.json()
      setRooms(rD.rooms || [])
      setPreds(pD.predictions || [])
      setEnergy(eD.energy_usage || [])
      setStats(sD.stats || null)
      setCurTime(rD.current_time || '')
      if (rD.current_time) {
        setSimHour(new Date(rD.current_time).getHours())
      }
    } catch (e) { }
  }, [])

  const step = useCallback(async () => {
    try {
      await fetch(`${API}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'step', speed }),
      })
      fetchAll()
    } catch (e) { }
  }, [speed, fetchAll])

  const reset = useCallback(async () => {
    setIsPlaying(false)
    try {
      await fetch(`${API}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      })
      fetchAll()
    } catch (e) { }
  }, [fetchAll])

  const override = useCallback(async (id, active) => {
    playOverride()
    try {
      await fetch(`${API}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: id, active, override_by: 'Faculty' }),
      })
      fetchAll()
    } catch (e) { }
  }, [fetchAll])

  const setTime = useCallback(async (hours) => {
    try {
      await fetch(`${API}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_time', hour: hours }),
      })
      fetchAll()
    } catch (e) { }
  }, [fetchAll])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Start ambient audio on first click
  useEffect(() => {
    const initAudio = () => {
      startAmbient()
      window.removeEventListener('click', initAudio)
      window.removeEventListener('touchstart', initAudio)
    }
    window.addEventListener('click', initAudio)
    window.addEventListener('touchstart', initAudio)
    return () => {
      window.removeEventListener('click', initAudio)
      window.removeEventListener('touchstart', initAudio)
    }
  }, [])

  const toggleMute = useCallback(() => {
    const nm = !isMuted
    setIsMuted(nm)
    setMuteState(nm)
  }, [isMuted])

  const predMap = Object.fromEntries(preds.map(p => [p.room, p]))
  const energyMap = Object.fromEntries(energy.map(e => [e.room, e]))

  const exportCSV = useCallback(() => {
    const rows = [
      ["Room ID", "Status", "Student Count", "Power (kW)", "Efficiency (%)", "Mode"]
    ]
    rooms.forEach(r => {
      const eData = energyMap[r.id] || {}
      rows.push([
        r.id,
        r.status,
        r.student_count,
        r.current_power_kw,
        eData.efficiency_pct?.toFixed(1) || 0,
        r.override_active ? "Override" : "AI"
      ])
    })
    rows.push([])
    rows.push(["TOTALS", `Energy Saved: ${stats?.total_energy_saved_kwh?.toFixed(2)} kWh`, `CO2 Reduced: ${stats?.total_co2_reduced_kg?.toFixed(2)} kg`])

    const csvData = rows.map(e => e.join(",")).join("\n")
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `PowerSense_Audit_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }, [rooms, energyMap, stats])

  useEffect(() => {
    if (isPlaying) {
      const ms = Math.max(700, 3000 / speed)
      timerRef.current = setInterval(step, ms)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isPlaying, speed, step])



  const activeRooms = rooms.filter(r => r.is_occupied).length

  return (
    <div className="app-hologram">
      {/* 3D BACKGROUND (R3F) */}
      <div className="canvas-wrapper">
        <CampusMap3D
          rooms={rooms}
          preds={preds}
          onRoomClick={setExpanded}
          selectedRoom={expanded}
          simHour={simHour}
        />
      </div>

      {/* OVERLAY UI (React DOM) */}
      <div className="ui-overlay">
        <div className="ui-left">
          {/* TOP LEFT - Header & Controls */}
          <div className="ui-header flex-col">
            <div className="logo-wrap">
              <div className="logo-icon">⚡</div>
              <div className="logo-text">
                <h1>PowerSense AI</h1>
                <div className="tagline">Holographic Command Area</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <div className="ai-pill"><span className="blink" />AI Core Online</div>
              <div className="clock-pill">{fmt(curTime)}</div>
            </div>

            <div className="sim-bar glass-panel" style={{ marginTop: 16, width: 'fit-content' }}>
              <button className={`sim-bar__btn play ${isPlaying ? 'active' : ''}`} onClick={() => setIsPlaying(p => !p)}>
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <button className="sim-bar__btn" onClick={step} disabled={isPlaying}>⏭ Step</button>
              <button className="sim-bar__btn" onClick={reset}>↺ Reset</button>
              <div className="sim-bar__divider" />
              <span className="sim-bar__label">Speed</span>
              <div className="speed-group">
                {[1, 2, 4].map(s => (
                  <button key={s} className={`speed-btn ${speed === s ? 'active' : ''}`} onClick={() => setSpeed(s)}>
                    {s}×
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Timeline Scrubber */}
            <div className="glass-panel" style={{ marginTop: 12, padding: '10px 14px', width: 'fit-content' }}>
              <div className="scrubber-container">
                <span className="scrubber-label">Timeline</span>
                <input
                  type="range"
                  className="scrubber-track"
                  min="7" max="23" step="1"
                  value={simHour}
                  onChange={(e) => {
                    setSimHour(parseInt(e.target.value))
                    setTime(parseInt(e.target.value))
                  }}
                />
                <span className="scrubber-value">{simHour}:00</span>
              </div>
            </div>

            {/* Utility Bar */}
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button className="sim-bar__btn" onClick={toggleMute}>
                {isMuted ? '🔇 Unmute' : '🔊 Mute'}
              </button>
              <button className="sim-bar__btn" onClick={exportCSV} style={{ color: '#00d68f', borderColor: 'rgba(0,214,143,0.3)' }}>
                📥 Export CSV Audit
              </button>
            </div>
          </div>

          {/* Stats 2×2 Grid */}
          <div className="ui-stats-grid">
            <div className="stat-tile glass-panel s-energy">
              <div className="stat-tile__icon">🔋</div>
              <div className="stat-tile__label">Energy Saved</div>
              <div className="stat-tile__val">{stats?.total_energy_saved_kwh?.toFixed(1) ?? '0.0'}</div>
              <div className="stat-tile__sub">kWh today</div>
            </div>
            <div className="stat-tile glass-panel s-cost">
              <div className="stat-tile__icon">💰</div>
              <div className="stat-tile__label">Cost Saved</div>
              <div className="stat-tile__val">₹{stats?.total_cost_saved?.toFixed(0) ?? '0'}</div>
            </div>
            <div className="stat-tile glass-panel s-co2">
              <div className="stat-tile__icon">🌿</div>
              <div className="stat-tile__label">CO₂ Reduced</div>
              <div className="stat-tile__val">{stats?.total_co2_reduced_kg?.toFixed(1) ?? '0.0'}</div>
            </div>
            <div className="stat-tile glass-panel s-rooms">
              <div className="stat-tile__icon">🏫</div>
              <div className="stat-tile__label">Optimized</div>
              <div className="stat-tile__val">{stats?.rooms_optimized ?? 0}/8</div>
            </div>
          </div>

          {/* BOTTOM LEFT - Charts */}
          <div className="ui-charts">
            <div className="panel glass-panel">
              <div className="panel__head">
                <div className="panel__title"><span className="ico">📊</span>Live Consumption</div>
              </div>
              <div className="panel__body">
                <EnergyDashboard energyUsage={energy} />
              </div>
            </div>

            <div className="panel glass-panel" style={{ marginTop: 8 }}>
              <div className="panel__head">
                <div className="panel__title"><span className="ico">🌡️</span>Efficiency Heatmap</div>
              </div>
              <div className="panel__body">
                <EnergyHeatmap energyUsage={energy} />
              </div>
            </div>
          </div>
        </div>

        {/* AI FORECAST PANEL — floats above the right room column */}
        <AiForecastPanel preds={preds} simHour={simHour} />

        {/* RIGHT PANEL - Floating Room List */}
        <div className="ui-rooms panel glass-panel">
          <div className="panel__head">
            <div className="panel__title"><span className="ico">🏫</span>Campus Sectors</div>
            <div className="panel__badge green">{activeRooms} Active</div>
          </div>
          <div className="panel__body" style={{ paddingTop: 12, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="room-list holographic-scroll">
              {rooms.map(room => (
                <ClassroomCard
                  key={room.id}
                  room={room}
                  pred={predMap[room.id]}
                  energy={energyMap[room.id]}
                  timetable={TIMETABLES[room.id] || []}
                  simHour={simHour}
                  expanded={expanded === room.id}
                  onToggle={() => setExpanded(expanded === room.id ? null : room.id)}
                  onOverride={override}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Alert Ticker — bottom center */}
        <AlertTicker rooms={rooms} preds={preds} />

      </div>
    </div>
  )
}

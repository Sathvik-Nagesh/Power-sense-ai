import { useState, useEffect, useCallback, useRef } from 'react'
import './index.css'
import CampusMap from './components/CampusMap'
import ClassroomCard from './components/ClassroomCard'
import EnergyDashboard from './components/EnergyDashboard'
import EnergyHeatmap from './components/EnergyHeatmap'

const API = 'http://localhost:8000/api'

// Timetable per room — mirrors simulation.py schedules
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
    } catch (e) { /* silent */ }
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
    try {
      await fetch(`${API}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: id, active, override_by: 'Faculty' }),
      })
      fetchAll()
    } catch (e) { }
  }, [fetchAll])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    if (isPlaying) {
      const ms = Math.max(700, 3000 / speed)
      timerRef.current = setInterval(step, ms)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isPlaying, speed, step])

  const predMap = Object.fromEntries(preds.map(p => [p.room, p]))
  const energyMap = Object.fromEntries(energy.map(e => [e.room, e]))

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">
        <div className="logo-wrap">
          <div className="logo-icon">⚡</div>
          <div className="logo-text">
            <h1>PowerSense AI</h1>
            <div className="tagline">Smart Campus Energy System</div>
          </div>
        </div>
        <div className="header-right">
          <div className="ai-pill">
            <span className="blink" />
            AI Active · RandomForest
          </div>
          <div className="clock-pill">{fmt(curTime)}</div>
        </div>
      </header>

      {/* STATS */}
      <div className="stats-strip">
        <div className="stat-tile s-energy">
          <div className="stat-tile__icon">🔋</div>
          <div className="stat-tile__label">Energy Saved</div>
          <div className="stat-tile__val">{stats?.total_energy_saved_kwh?.toFixed(1) ?? '0.0'}</div>
          <div className="stat-tile__sub">kWh today</div>
        </div>
        <div className="stat-tile s-cost">
          <div className="stat-tile__icon">💰</div>
          <div className="stat-tile__label">Cost Saved</div>
          <div className="stat-tile__val">₹{stats?.total_cost_saved?.toFixed(0) ?? '0'}</div>
          <div className="stat-tile__sub">Indian Rupees</div>
        </div>
        <div className="stat-tile s-co2">
          <div className="stat-tile__icon">🌿</div>
          <div className="stat-tile__label">CO₂ Reduced</div>
          <div className="stat-tile__val">{stats?.total_co2_reduced_kg?.toFixed(1) ?? '0.0'}</div>
          <div className="stat-tile__sub">kg CO₂ (0.82 kg/kWh)</div>
        </div>
        <div className="stat-tile s-rooms">
          <div className="stat-tile__icon">🏫</div>
          <div className="stat-tile__label">Rooms Optimized</div>
          <div className="stat-tile__val">{stats?.rooms_optimized ?? 0}/{stats?.total_rooms ?? 8}</div>
          <div className="stat-tile__sub">auto-managed</div>
        </div>
      </div>

      {/* SIM CONTROLS */}
      <div className="sim-bar">
        <button className={`sim-bar__btn play ${isPlaying ? 'active' : ''}`}
          onClick={() => setIsPlaying(p => !p)}>
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button className="sim-bar__btn" onClick={step} disabled={isPlaying}>⏭ Step</button>
        <button className="sim-bar__btn" onClick={reset}>↺ Reset</button>

        <div className="sim-bar__divider" />
        <span className="sim-bar__label">Speed</span>
        <div className="speed-group">
          {[1, 2, 4].map(s => (
            <button key={s} className={`speed-btn ${speed === s ? 'active' : ''}`}
              onClick={() => setSpeed(s)}>{s}×</button>
          ))}
        </div>

        <div className={`sim-bar__status ${isPlaying ? 'running' : ''}`}>
          <span className="dot" />
          {isPlaying ? 'Simulating…' : 'Paused'}
        </div>
      </div>

      {/* BODY */}
      <div className="body-grid">

        {/* LEFT */}
        <div className="left-col">

          {/* Campus Map */}
          <div className="panel">
            <div className="panel__head">
              <div className="panel__title"><span className="ico">🗺️</span>Campus Power Grid</div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '.7rem', color: 'var(--t3)' }}>
                <span style={{ color: 'var(--c-green)' }}>● Occupied</span>
                <span style={{ color: 'var(--c-red)' }}>● Empty</span>
                <span style={{ color: 'var(--c-yellow)' }}>● Emptying</span>
              </div>
            </div>
            <div className="campus-wrap">
              <CampusMap rooms={rooms} preds={preds} simHour={simHour} />
            </div>
          </div>

          {/* Charts */}
          <div className="bottom-row">
            <div className="panel">
              <div className="panel__head">
                <div className="panel__title"><span className="ico">📊</span>Energy Consumption</div>
              </div>
              <div className="panel__body">
                <EnergyDashboard energyUsage={energy} />
              </div>
            </div>
            <div className="panel">
              <div className="panel__head">
                <div className="panel__title"><span className="ico">🌡️</span>Efficiency Heatmap</div>
              </div>
              <div className="panel__body">
                <EnergyHeatmap energyUsage={energy} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Room Cards */}
        <div className="right-col">
          <div className="panel" style={{ flex: 1 }}>
            <div className="panel__head">
              <div className="panel__title"><span className="ico">🏫</span>Classrooms</div>
              <div className="panel__badge green">
                {rooms.filter(r => r.is_occupied).length} active
              </div>
            </div>
            <div className="panel__body" style={{ paddingTop: 12 }}>
              <div className="room-list">
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
        </div>
      </div>
    </div>
  )
}

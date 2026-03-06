import { useState, useEffect, useCallback, useRef } from 'react'
import './index.css'
import CampusMap from './components/CampusMap'
import ClassroomCard from './components/ClassroomCard'
import EnergyDashboard from './components/EnergyDashboard'
import EnergyHeatmap from './components/EnergyHeatmap'
import SimulationControls from './components/SimulationControls'

const API_BASE = 'http://localhost:8000/api'

function App() {
  const [rooms, setRooms] = useState([])
  const [predictions, setPredictions] = useState([])
  const [energyUsage, setEnergyUsage] = useState([])
  const [stats, setStats] = useState(null)
  const [simState, setSimState] = useState(null)
  const [currentTime, setCurrentTime] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const intervalRef = useRef(null)

  const fetchAll = useCallback(async () => {
    try {
      const [roomsRes, predsRes, energyRes, statsRes, stateRes] = await Promise.all([
        fetch(`${API_BASE}/rooms`),
        fetch(`${API_BASE}/predictions`),
        fetch(`${API_BASE}/energy-usage`),
        fetch(`${API_BASE}/stats`),
        fetch(`${API_BASE}/simulation-state`),
      ])

      const roomsData = await roomsRes.json()
      const predsData = await predsRes.json()
      const energyData = await energyRes.json()
      const statsData = await statsRes.json()
      const stateData = await stateRes.json()

      setRooms(roomsData.rooms || [])
      setPredictions(predsData.predictions || [])
      setEnergyUsage(energyData.energy_usage || [])
      setStats(statsData.stats || null)
      setSimState(stateData)
      setCurrentTime(roomsData.current_time || '')
    } catch (err) {
      console.error('API fetch error:', err)
    }
  }, [])

  const stepSimulation = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'step', speed }),
      })
      await res.json()
      await fetchAll()
    } catch (err) {
      console.error('Simulation step error:', err)
    }
  }, [speed, fetchAll])

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev)
  }, [])

  const resetSimulation = useCallback(async () => {
    setIsPlaying(false)
    try {
      await fetch(`${API_BASE}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      })
      await fetchAll()
    } catch (err) {
      console.error('Reset error:', err)
    }
  }, [fetchAll])

  const handleOverride = useCallback(async (roomId, active) => {
    try {
      await fetch(`${API_BASE}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, active, override_by: 'Faculty' }),
      })
      await fetchAll()
    } catch (err) {
      console.error('Override error:', err)
    }
  }, [fetchAll])

  // Initial fetch
  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Auto-play interval
  useEffect(() => {
    if (isPlaying) {
      const interval = 3000 / speed
      intervalRef.current = setInterval(() => {
        stepSimulation()
      }, interval)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, speed, stepSimulation])

  const formatTime = (isoStr) => {
    if (!isoStr) return '--:--'
    const d = new Date(isoStr)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) +
      ' | ' + d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <svg viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="16" stroke="url(#hgrad)" strokeWidth="2" />
            <path d="M12 18L18 10L24 18L18 26Z" fill="url(#hgrad)" opacity="0.8" />
            <path d="M18 6V30M6 18H30" stroke="url(#hgrad)" strokeWidth="1" opacity="0.3" />
            <defs>
              <linearGradient id="hgrad" x1="0" y1="0" x2="36" y2="36">
                <stop stopColor="#00f7ff" />
                <stop offset="1" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          <div>
            <h1>PowerSense AI</h1>
            <div className="subtitle">Smart Campus Energy Control</div>
          </div>
        </div>
        <div className="header-time">
          <div className="model-badge">
            <span className="dot"></span>
            AI Model Active
          </div>
          <div className="sim-time">{formatTime(currentTime)}</div>
        </div>
      </header>

      {/* Stats Bar */}
      <div style={{ padding: '24px 32px 0' }}>
        <div className="stats-bar">
          <div className="stat-card energy">
            <div className="stat-label">Energy Saved</div>
            <div className="stat-value energy">{stats?.total_energy_saved_kwh?.toFixed(1) || '0.0'}</div>
            <div className="stat-unit">kWh today</div>
          </div>
          <div className="stat-card cost">
            <div className="stat-label">Cost Saved</div>
            <div className="stat-value cost">₹{stats?.total_cost_saved?.toFixed(0) || '0'}</div>
            <div className="stat-unit">Indian Rupees</div>
          </div>
          <div className="stat-card co2">
            <div className="stat-label">CO₂ Reduced</div>
            <div className="stat-value co2">{stats?.total_co2_reduced_kg?.toFixed(1) || '0.0'}</div>
            <div className="stat-unit">kg CO₂</div>
          </div>
          <div className="stat-card rooms">
            <div className="stat-label">Rooms Optimized</div>
            <div className="stat-value rooms">{stats?.rooms_optimized || 0}/{stats?.total_rooms || 8}</div>
            <div className="stat-unit">currently managed</div>
          </div>
        </div>
      </div>

      {/* Simulation Controls */}
      <div style={{ padding: '16px 32px 0' }}>
        <SimulationControls
          isPlaying={isPlaying}
          speed={speed}
          onTogglePlay={togglePlay}
          onStep={stepSimulation}
          onReset={resetSimulation}
          onSpeedChange={setSpeed}
        />
      </div>

      {/* Main Layout */}
      <div className="main-layout">
        <div className="left-panel">
          {/* Campus Map */}
          <div className="section campus-map-container">
            <div className="section-header">
              <div className="section-title">
                <span className="icon">🗺️</span> Campus Power Grid
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                🟢 Occupied · 🔴 Empty · 🟡 Empty Soon
              </div>
            </div>
            <div className="section-body">
              <CampusMap
                rooms={rooms}
                predictions={predictions}
                onRoomClick={setSelectedRoom}
                selectedRoom={selectedRoom}
              />
            </div>
          </div>

          {/* Energy Charts + Heatmap */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="section">
              <div className="section-header">
                <div className="section-title">
                  <span className="icon">📊</span> Energy Consumption
                </div>
              </div>
              <div className="section-body">
                <EnergyDashboard energyUsage={energyUsage} />
              </div>
            </div>
            <div className="section">
              <div className="section-header">
                <div className="section-title">
                  <span className="icon">🔥</span> Campus Heatmap
                </div>
              </div>
              <div className="section-body">
                <EnergyHeatmap energyUsage={energyUsage} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel — Room Cards */}
        <div className="right-panel">
          <div className="section" style={{ flex: 1 }}>
            <div className="section-header">
              <div className="section-title">
                <span className="icon">🏫</span> Classrooms
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {rooms.filter(r => r.is_occupied).length} active
              </div>
            </div>
            <div className="section-body">
              <div className="room-grid">
                {rooms.map(room => (
                  <ClassroomCard
                    key={room.id}
                    room={room}
                    prediction={predictions.find(p => p.room === room.id)}
                    energy={energyUsage.find(e => e.room === room.id)}
                    isSelected={selectedRoom === room.id}
                    onSelect={() => setSelectedRoom(room.id === selectedRoom ? null : room.id)}
                    onOverride={handleOverride}
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

export default App

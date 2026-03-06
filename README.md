# ⚡ PowerSense AI — Smart Campus Energy Optimization

> AI-powered campus electricity management using occupancy prediction with RandomForest ML model.

## 🎯 Features

- **AI Occupancy Prediction** — RandomForest model predicting classroom occupancy + 30-min lookahead
- **Energy Optimization** — Auto-controls lights, AC, fans based on AI predictions
- **Interactive Campus Map** — SVG campus with animated power grid wires & glow effects
- **Simulation Mode** — Time-accelerated demo with play/pause/speed controls
- **Energy Heatmap** — D3.js visualization of campus energy efficiency
- **CO₂ Dashboard** — Real-time energy savings, cost reduction, and carbon footprint metrics
- **Manual Override** — Faculty can override AI recommendations per classroom

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python FastAPI |
| AI Model | Scikit-learn RandomForest |
| Database | SQLite |
| Frontend | React + Vite |
| Charts | D3.js |
| Animations | SVG + CSS |

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python data_processor.py   # Process dataset & populate DB
python model.py            # Train AI model
python main.py             # Start API server on port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev                # Start dev server on port 5173
```

### 3. Open Dashboard

Visit **http://localhost:5173** and click **▶ Play** to start the simulation!

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rooms` | GET | All rooms with current status |
| `/api/predictions` | GET | AI occupancy predictions |
| `/api/energy-usage` | GET | Per-room energy consumption |
| `/api/stats` | GET | Aggregate savings stats |
| `/api/simulate` | POST | Step/play/pause simulation |
| `/api/simulation-state` | GET | Poll current state |
| `/api/override` | POST | Faculty manual override |
| `/api/model-info` | GET | AI model metadata |

## 🧠 AI Model

- **Algorithm**: RandomForestClassifier (100 estimators)
- **Features**: hour, day_of_week, scheduled_class, past_occupancy, wifi_devices
- **Target**: is_occupied (binary)
- **Energy Model**: base + lights(0.1kW) + fans(0.2kW) + AC(1.5kW)
- **CO₂ Factor**: 1 kWh ≈ 0.82 kg CO₂

## 📊 Dataset

Adapted from UCI Household Electric Power Consumption dataset, transformed into per-classroom energy profiles with synthetic occupancy labels.

---

Built for Hackathon 2026 🚀

# ⚡ PowerSense AI — Holographic Smart Campus Energy Optimizer

> An immersive, AI-driven smart energy system featuring a **React Three Fiber 3D holographic command table**, machine learning occupancy prediction, and a simulated temporal energy grid.

---

## 🚀 Key Features

### 1. 🖥️ Holographic 3D Command Table
- Fully interactive **3D Campus Map** built with `react-three-fiber` and `three.js`.
- Glowing neon wireframes, floating UI tags (`@react-three/drei` Html), and a cinematic bloom post-processing pipeline.
- Real-time animated **energy streams** (particles moving along bezier curves) connecting the central power nexus grid to each classroom block.

### 2. 🧠 AI Occupancy Prediction (Scikit-Learn)
- A highly accurate **RandomForest Classifier** predicts if a room is occupied based on the hour, day of the week, timetable schedule, and real-time WiFi devices active.
- Analyzes current occupancy + a **30-minute lookahead prediction**.
- Recommends one of three actions: `Keep Power On`, `Reduce Power` (AC/Fans OFF), or `Turn Off All`.

### 3. ⏳ Time-Scrubbing Energy Simulation
- A custom Python simulation engine acting as a live campus!
- **Interactive Scrubber**: The dashboard has an interactive timeline slider that lets administrators drag to "time travel" through the day.
- Fast-forward speed controls (1x, 2x, 4x) to simulate full-day energy cycles. 
- Real-time calculations of kWh saved, Cost saved, and **CO₂ Reduced (Green impact)**.

### 4. 🎛️ Tactical Data Overlays
- **Floating HUD Glass Panels**: Overlapping the R3F scene.
- **Neon LED Equalizer**: A cool CSS-based LED equalizer visualizing live power consumption per room against total capacity.
- **Historical Busy Heatmap**: Toggle between live efficiency maps and historical schedule grids for 12-hour block insights.
- **Faculty Override**: A manual toggle that forces the simulation to re-route energy back into a room, overriding the AI.

---

## 💻 Tech Stack
- **Frontend**: React, Vite, React Three Fiber, Three.js, GSAP, Postprocessing
- **Backend**: Python, FastAPI, Uvicorn 
- **AI/ML**: Scikit-Learn (RandomForest), Pandas, Numpy
- **Database**: SQLite
- **Styling**: Vanilla CSS with modern Glassmorphism & Cyberpunk Neon tokens

---

## 🛠️ Installation & Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # On Windows
pip install -r requirements.txt

# Run the backend API & AI Simulation Engine
python main.py
```
*The backend runs on `http://localhost:8000`*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*The frontend runs on `http://localhost:5173`*

---

## 📡 API Endpoints (FastAPI)
- `GET /api/rooms` - Live status of all 8 campus blocks.
- `GET /api/predictions` - Current & 30-min AI predictions + WiFi traffic.
- `GET /api/energy-usage` - Power consumption (kW), capacity, and efficiency.
- `GET /api/stats` - Total energy saved, costs, and carbon offset.
- `POST /api/simulate` - Advance or scrub time (`{"action": "set_time", "time_iso": "..."}`).
- `POST /api/override` - Manual faculty override.

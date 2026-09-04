# WebGIS FRA Monitoring System 🇮🇳
### AI-Powered Decision Support System for Forest Rights Act (FRA) 2006 Monitoring

An advanced, interactive WebGIS dashboard and AI-driven decision support system for monitoring Forest Rights Act (FRA) claim distributions, pendencies, and anomalies across India.

---

## 🌟 Key Features

- **Interactive Pan-India Administrative Map**:
  - Full vector map of India with all 36 States and Union Territories.
  - Interactive state capsule badges (`MP`, `MH`, `RJ`, `OR`, `CT`, `GJ`, `KL`, `AS`, etc.).
  - **State Isolation View**: Clicking any state isolates that state on the canvas, hides surrounding states, and displays state-level boundaries and claims. Clicking again returns to the normal full India map.
- **AI Anomaly Detection Engine**:
  - Highlights critical pendency anomalies (>3 years backlog) and abnormal rejection rate spikes in plain English.
  - Detects root causes (cadastral survey delays, SDLC quorum deficits, mining lease overlaps).
  - Provides actionable administrative recommendations for District Level Committees (DLCs) and State Nodal Officers.
- **Dual Map Viewing Modes**:
  - **Administrative Vector Map**: High-contrast, clean vector cartography matching official administrative boundaries.
  - **Satellite WebGIS Map**: React-Leaflet GIS engine with street, topological, and dark basemaps.
- **KPI Metrics & Progress Tracking**:
  - Total Claims, Approved Titles, Pending Reviews, and Delayed Anomalies.
  - Real-time Title Distribution Progress Bar.
  - Total Forest Area Titled (in Hectares).
- **Claims Drill-down Feed**:
  - Searchable list of Individual Forest Rights (IFR) and Community Forest Rights (CFR) claims.
  - Color-coded status markers: 🟢 Approved, 🟡 Pending, 🔴 Delayed/Anomaly.

---

## 🛠️ Tech Stack

- **Frontend**: React 19 (Functional components, Hooks)
- **Bundler & Dev Server**: Vite
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Geospatial & Vector Mapping**: React-Leaflet, Leaflet, Custom SVG Vector Engine, `svg-path-bounds`
- **Charts & Visualization**: Recharts
- **Icons**: Lucide-React

---

## 🚀 Quick Start

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Kartikey-3005/WebGIS-FRA-Monitoring-System.git
   cd WebGIS-FRA-Monitoring-System
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Locally**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Production Build**:
   ```bash
   npm run build
   ```

---

## 🏛️ Governance Context

Built aligned with the **Forest Rights Act (FRA) 2006** guidelines issued by the **Ministry of Tribal Affairs (MoTA)**, Government of India, supporting transparent, spatial, and timely title distribution to Scheduled Tribes and Other Traditional Forest Dwellers (OTFD).

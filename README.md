# TITAN FLEET COMMAND — Enterprise Logistics & Telematics OS

A modular fleet management web application engineered for long-haul and regional trucking operations. Titan Fleet Command integrates real-time GPS tracking, IoT fuel theft detection, driver payroll calculation, automated freight invoicing, and multi-channel truck CCTV streaming into an executive operations dashboard.

---

## 📁 Project Structure (Separated Files)

```
fleet-management-app/
├── public/
│   ├── index.html           # Main semantic HTML structure & modal dialogs
│   ├── css/
│   │   └── styles.css       # Complete design system, glassmorphism, responsive grid
│   └── js/
│       ├── data.js          # Central telemetry data store, truck fleet state & invoices
│       ├── map.js           # Live GPS vector map engine, waypoints, geofences & history scrubber
│       ├── fuel.js          # Circular SVG fuel gauge, telemetry metrics & theft detection
│       ├── drivers.js       # Driver roster, FMCSA HOS compliance dials & salary engine
│       ├── billing.js       # Freight invoices, DOE fuel surcharge formula & CSV export
│       ├── cctv.js          # Multi-channel CCTV feeds (ADAS road, DMS cabin, reefer, rear)
│       └── app.js           # Main app coordinator, tabs, toasts & real-time simulation loop
├── server.rb                # Ruby WEBrick server with mock REST API endpoints
├── start.sh                 # Executable launcher script (opens directly in browser)
└── README.md                # System documentation and operational reference
```

---

## 🚛 Core Modules & Capabilities

### 1. Real-Time GPS Tracking & Route History Playback (`js/map.js`)
* **Interactive Telematics Map**: High-performance canvas vector map displaying active Interstate highway corridors (I-80, I-55, I-75, I-10, etc.), live truck positions, and dynamic waypoint networks.
* **Vehicle Status HUD**: Real-time speed (MPH), engine RPM, heading angles, current route, and next geofence distance.
* **Interactive 24-Hour Route Scrubber**: Scrub backwards through past 24 hours of trip data, observe waypoint stops, and control playback speed (1x, 3x, 8x).
* **Automated Geofencing**: Configurable depot and hub boundaries with entry/exit alerts.

### 2. IoT-Based Live Fuel Gauge & Fuel Theft Guard (`js/fuel.js`)
* **Precision SVG Circular Gauge**: Smooth dynamic needle and percentage fill with color-coded safety thresholds (Optimal Emerald, Warning Amber, Critical Rose).
* **Dual-Tank Pneumatic Balance**: Monitors primary and auxiliary saddle tanks with ultrasonic liquid depth sensors.
* **Anti-Theft Siphoning Alarm**: Real-time anomaly detection algorithm flags rapid fuel drops (>5 gal/min while stationary), triggers cabin alarm, logs timestamp, and transmits coordinates to safety dispatch.
* **24-Hour Fuel Telemetry Chart**: Continuous trend analysis plotting refueling events, idle burn, and cruising consumption.

### 3. Driver Management & Automated Salary Calculator (`js/drivers.js`)
* **Driver Roster & Profiles**: Commercial Driver License (CDL-A) credentials, contact info, assigned equipment, and safety scores.
* **FMCSA ELD Hours of Service (HOS) Clocks**: Live timers tracking Driving Time (11h limit), Shift Duty (14h limit), 70-Hour Cycle, and mandatory 30-minute rest break.
* **Interactive Compensation Engine**:
  * Base mileage pay ($/mile × practical dispatched miles)
  * Hourly shipper detention pay ($28/hr after 2-hour dwell allowance)
  * Performance bonuses (Fuel economy tier + Clean DOT inspection bonus)
  * Deductions (Federal/state taxes, medical insurance, escrow transponder)
* **Printable Driver Settlement Stub**: One-click generation of formatted, printable pay statements with YTD deductions and direct deposit disbursements.

### 4. Automated Freight Billing & Invoicing Generator (`js/billing.js`)
* **Freight Load Management**: Itemized billing for major logistics shippers (Walmart, Amazon, Caterpillar, Target, Kroger).
* **EIA Fuel Surcharge (FSC) Formula**: Automatic indexing against weekly US Department of Energy national diesel averages ($3.89/gal).
* **Interactive Invoice Sheet**: Professional, print-ready Bill of Lading (BOL) compliant invoices with carrier DOT/MC credentials, accessorial fees, payment terms (Net 30), and ACH/Wire banking details.
* **CSV Export**: Instantly export accounts receivable records.

### 5. Multi-Channel Live Truck CCTV Streaming Interface (`js/cctv.js`)
* **Channel 1 — Forward Road Dashcam & ADAS**: Perspective highway dashcam with animated lane tracking, leading vehicle detection, and Forward Collision Warning (FCW).
* **Channel 2 — Cabin Driver Monitoring System (DMS)**: AI face tracking mesh evaluating eye closure percentage (PERCLOS), yawning, and distracted driving with audible cabin chimes.
* **Channel 3 — Cargo Bay / Reefer Unit**: Trailer interior view with real-time temperature telemetry (-10.4°F for frozen cargo), magnetic door lock integrity sensor, and motion detection.
* **Channel 4 — Rear Blindspot & Backing Radar**: 170° wide-angle fish-eye feed with dynamic trajectory guidelines and proximity radar alerts.
* **Stream Controls**: Infrared Night Vision toggle, snapshot capture to evidence vault, and low-latency encrypted WebRTC/H.265 simulation.

---

## 🚀 Quickstart & How to Run

### Method 1: Direct Run (Open in Default Browser)
```bash
/Users/kunalshasthan/.gemini/antigravity/scratch/fleet-management-app/start.sh
```
Or directly on macOS:
```bash
open /Users/kunalshasthan/.gemini/antigravity/scratch/fleet-management-app/public/index.html
```

### Method 2: Run with Ruby Local Server & REST API
```bash
ruby /Users/kunalshasthan/.gemini/antigravity/scratch/fleet-management-app/server.rb
```
Then visit: `http://localhost:8080` in your web browser.

#### Available REST API Endpoints:
* `GET /api/health` — System status and CAN-bus telemetry link health.
* `GET /api/vehicles` — JSON feed of all tracked fleet vehicles.
* `GET /api/salary/calculate?miles=4920&rate=0.65&detention=8&bonuses=400` — Dynamic payroll calculation.

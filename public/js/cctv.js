/**
 * TITAN FLEET COMMAND - Secure Multi-Channel Truck CCTV Streaming Interface
 */

const camRoad = document.getElementById('camRoadCanvas');
const camCabin = document.getElementById('camCabinCanvas');
const camCargo = document.getElementById('camCargoCanvas');
const camRear = document.getElementById('camRearCanvas');

let roadOffset = 0;
let cabinEyeState = 0; // 0 normal, 1 drowsy

function selectCctvTruck(truckId) {
  if (typeof selectTruck === 'function') {
    selectTruck(truckId);
  }
}

function renderCctvFeeds() {
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0] + " CDT";
  
  const t1 = document.getElementById('cctvTime1'); if (t1) t1.innerText = timeStr;
  const t2 = document.getElementById('cctvTime2'); if (t2) t2.innerText = timeStr;
  const t3 = document.getElementById('cctvTime3'); if (t3) t3.innerText = timeStr;
  const t4 = document.getElementById('cctvTime4'); if (t4) t4.innerText = timeStr;

  // 1. FORWARD HIGHWAY ROAD CAM
  drawRoadCamera();

  // 2. CABIN DMS FATIGUE CAM
  drawCabinCamera();

  // 3. REEFER CARGO BAY CAM
  drawCargoCamera();

  // 4. REAR BLINDSPOT ASSIST CAM
  drawRearCamera();

  requestAnimationFrame(renderCctvFeeds);
}

function drawRoadCamera() {
  if (!camRoad || !camRoad.parentElement) return;
  const ctx = camRoad.getContext('2d');
  const w = camRoad.width = camRoad.parentElement.clientWidth;
  const h = camRoad.height = camRoad.parentElement.clientHeight - 40;
  if (!w || !h) return;

  // Sky & Horizon
  ctx.fillStyle = nightVisionActive ? '#051b11' : '#0f172a';
  ctx.fillRect(0, 0, w, h);

  // Distant terrain silhouettes
  ctx.fillStyle = nightVisionActive ? '#0a3020' : '#1e293b';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.45);
  ctx.lineTo(w * 0.3, h * 0.40);
  ctx.lineTo(w * 0.7, h * 0.44);
  ctx.lineTo(w, h * 0.42);
  ctx.lineTo(w, h * 0.45);
  ctx.closePath();
  ctx.fill();

  // Road Surface Perspective
  ctx.fillStyle = nightVisionActive ? '#0f291e' : '#1e2330';
  ctx.beginPath();
  ctx.moveTo(w * 0.42, h * 0.45);
  ctx.lineTo(w * 0.58, h * 0.45);
  ctx.lineTo(w * 0.95, h);
  ctx.lineTo(w * 0.05, h);
  ctx.closePath();
  ctx.fill();

  // Moving Highway Dash Markings
  roadOffset = (roadOffset + (selectedTruck && selectedTruck.speed > 0 ? selectedTruck.speed * 0.15 : 0)) % 40;
  ctx.strokeStyle = nightVisionActive ? '#4ade80' : '#e2e8f0';
  ctx.lineWidth = 4;
  ctx.setLineDash([16, 24]);
  ctx.lineDashOffset = -roadOffset;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.45);
  ctx.lineTo(w * 0.5, h);
  ctx.stroke();
  ctx.setLineDash([]); // Reset line dash

  // Leading Vehicle Ahead (Radar Tracking Target)
  const leadX = w * 0.52;
  const leadY = h * 0.58;
  ctx.fillStyle = nightVisionActive ? '#15803d' : '#334155';
  ctx.fillRect(leadX - 22, leadY - 14, 44, 28);
  
  // Vehicle Taillights
  ctx.fillStyle = nightVisionActive ? '#86efac' : '#ef4444';
  ctx.fillRect(leadX - 18, leadY + 4, 8, 5);
  ctx.fillRect(leadX + 10, leadY + 4, 8, 5);

  // ADAS Forward Collision Warning (FCW) Box
  ctx.strokeStyle = nightVisionActive ? '#22c55e' : '#06b6d4';
  ctx.lineWidth = 2;
  ctx.strokeRect(leadX - 26, leadY - 18, 52, 36);
  ctx.fillStyle = nightVisionActive ? '#22c55e' : '#06b6d4';
  ctx.font = '10px monospace';
  ctx.fillText("TARGET: 142 FT", leadX - 26, leadY - 22);

  if (nightVisionActive) applyNightVisionScanlines(ctx, w, h);
}

function drawCabinCamera() {
  if (!camCabin || !camCabin.parentElement) return;
  const ctx = camCabin.getContext('2d');
  const w = camCabin.width = camCabin.parentElement.clientWidth;
  const h = camCabin.height = camCabin.parentElement.clientHeight - 40;
  if (!w || !h) return;

  // Cabin Interior
  ctx.fillStyle = nightVisionActive ? '#03140b' : '#090d16';
  ctx.fillRect(0, 0, w, h);

  // Steering Wheel Arc
  ctx.strokeStyle = nightVisionActive ? '#22c55e' : '#334155';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(w * 0.45, h * 1.1, w * 0.35, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();

  // Driver Silhouette
  const faceX = w * 0.48 + Math.sin(Date.now() / 2000) * 3;
  const faceY = h * 0.42;

  // Shoulders
  ctx.fillStyle = nightVisionActive ? '#0a301a' : '#1e293b';
  ctx.beginPath();
  ctx.ellipse(faceX, faceY + 70, 65, 45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = nightVisionActive ? '#15803d' : '#475569';
  ctx.beginPath();
  ctx.arc(faceX, faceY, 32, 0, Math.PI * 2);
  ctx.fill();

  // AI Facial Mesh Tracking Landmarks (DMS)
  ctx.strokeStyle = cabinEyeState === 1 ? '#ef4444' : (nightVisionActive ? '#4ade80' : '#10b981');
  ctx.lineWidth = 1.5;
  ctx.strokeRect(faceX - 35, faceY - 38, 70, 76);

  // Eye Closure (PERCLOS)
  const eyeOpen = cabinEyeState === 1 ? 1 : 4;
  ctx.fillStyle = cabinEyeState === 1 ? '#ef4444' : '#fff';
  ctx.fillRect(faceX - 14, faceY - 5, 8, eyeOpen);
  ctx.fillRect(faceX + 6, faceY - 5, 8, eyeOpen);

  // DMS AI Tag
  ctx.fillStyle = cabinEyeState === 1 ? '#ef4444' : (nightVisionActive ? '#4ade80' : '#10b981');
  ctx.font = '10px monospace';
  ctx.fillText(cabinEyeState === 1 ? "⚠️ WARNING: DROWSINESS (PERCLOS >80%)" : "DMS: ATTENTIVE (EYE: OPEN)", faceX - 45, faceY - 45);

  if (nightVisionActive) applyNightVisionScanlines(ctx, w, h);
}

function drawCargoCamera() {
  if (!camCargo || !camCargo.parentElement) return;
  const ctx = camCargo.getContext('2d');
  const w = camCargo.width = camCargo.parentElement.clientWidth;
  const h = camCargo.height = camCargo.parentElement.clientHeight - 40;
  if (!w || !h) return;

  ctx.fillStyle = nightVisionActive ? '#04170d' : '#080d1a';
  ctx.fillRect(0, 0, w, h);

  // Trailer Perspective Walls
  ctx.strokeStyle = nightVisionActive ? '#15803d' : '#1e293b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(w * 0.25, h * 0.2);
  ctx.moveTo(w, 0); ctx.lineTo(w * 0.75, h * 0.2);
  ctx.moveTo(0, h); ctx.lineTo(w * 0.25, h * 0.85);
  ctx.moveTo(w, h); ctx.lineTo(w * 0.75, h * 0.85);
  ctx.stroke();

  // Trailer Rear Bulkhead
  ctx.strokeRect(w * 0.25, h * 0.2, w * 0.5, h * 0.65);

  // Pallet Stacks
  ctx.fillStyle = nightVisionActive ? '#0c381e' : '#1e2942';
  ctx.fillRect(w * 0.28, h * 0.45, w * 0.18, h * 0.38);
  ctx.fillRect(w * 0.52, h * 0.45, w * 0.18, h * 0.38);

  ctx.strokeStyle = nightVisionActive ? '#4ade80' : '#3b82f6';
  ctx.strokeRect(w * 0.28, h * 0.45, w * 0.18, h * 0.38);
  ctx.strokeRect(w * 0.52, h * 0.45, w * 0.18, h * 0.38);

  // Cold vapor particle simulation
  ctx.fillStyle = nightVisionActive ? 'rgba(74, 222, 128, 0.08)' : 'rgba(56, 189, 248, 0.08)';
  ctx.beginPath();
  ctx.arc(w * 0.5 + Math.sin(Date.now() / 1500) * 15, h * 0.35, 40, 0, Math.PI * 2);
  ctx.fill();

  // Reefer Temperature Telemetry Overlay
  ctx.fillStyle = nightVisionActive ? '#86efac' : '#38bdf8';
  ctx.font = '11px monospace';
  ctx.fillText("REEFER SETPOINT: -10.0°F | AMBIENT: -10.4°F", 20, 30);

  if (nightVisionActive) applyNightVisionScanlines(ctx, w, h);
}

function drawRearCamera() {
  if (!camRear || !camRear.parentElement) return;
  const ctx = camRear.getContext('2d');
  const w = camRear.width = camRear.parentElement.clientWidth;
  const h = camRear.height = camRear.parentElement.clientHeight - 40;
  if (!w || !h) return;

  // Rear Road Scene
  ctx.fillStyle = nightVisionActive ? '#04170d' : '#0d1322';
  ctx.fillRect(0, 0, w, h);

  // Ground Plane
  ctx.fillStyle = nightVisionActive ? '#0b2618' : '#182030';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.5);
  ctx.lineTo(w, h * 0.5);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Rear Bumper Sill
  ctx.fillStyle = nightVisionActive ? '#15803d' : '#334155';
  ctx.fillRect(0, h - 22, w, 22);

  // Dynamic Backing Trajectory Guidelines
  if (showRearGuidelines) {
    ctx.strokeStyle = '#ef4444'; // Red zone (stop)
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w * 0.3, h - 30); ctx.lineTo(w * 0.7, h - 30);
    ctx.stroke();

    ctx.strokeStyle = '#f59e0b'; // Amber zone (caution)
    ctx.beginPath();
    ctx.moveTo(w * 0.34, h - 70); ctx.lineTo(w * 0.66, h - 70);
    ctx.stroke();

    ctx.strokeStyle = '#10b981'; // Green zone (clear)
    ctx.beginPath();
    ctx.moveTo(w * 0.38, h - 110); ctx.lineTo(w * 0.62, h - 110);
    ctx.stroke();

    // Guidance Rails
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(w * 0.25, h - 22); ctx.lineTo(w * 0.42, h * 0.52);
    ctx.moveTo(w * 0.75, h - 22); ctx.lineTo(w * 0.58, h * 0.52);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (nightVisionActive) applyNightVisionScanlines(ctx, w, h);
}

function applyNightVisionScanlines(ctx, w, h) {
  ctx.fillStyle = 'rgba(0, 255, 120, 0.04)';
  for (let y = 0; y < h; y += 4) {
    ctx.fillRect(0, y, w, 1);
  }
}

function toggleNightVision() {
  nightVisionActive = !nightVisionActive;
  if (typeof showToast === 'function') {
    showToast(`CCTV Night Vision Infrared Mode ${nightVisionActive ? 'ACTIVATED' : 'DEACTIVATED'}`, "info");
  }
}

function toggleRearGrid() {
  showRearGuidelines = !showRearGuidelines;
  if (typeof showToast === 'function') {
    showToast(`Rear dynamic parking guidelines ${showRearGuidelines ? 'ENABLED' : 'DISABLED'}`, "info");
  }
}

function captureCctvSnapshot() {
  if (typeof showToast === 'function') {
    showToast(`High-resolution CCTV snapshot stored in incident evidence vault [${selectedTruck ? selectedTruck.id : 'TRK'}_${Date.now()}.png]`, "success");
  }
}

function triggerADASAlert() {
  if (typeof showToast === 'function') {
    showToast("ADAS Collision Warning: Target vehicle distance delta alert tested successfully.", "info");
  }
}

function toggleSimulatedDrowsiness() {
  cabinEyeState = cabinEyeState === 0 ? 1 : 0;
  const statusEl = document.getElementById('cabinAiStatus');
  if (statusEl) {
    if (cabinEyeState === 1) {
      statusEl.innerHTML = '<span style="color:var(--accent-rose);">⚠️ ALERT: DRIVER DROWSINESS DETECTED (PERCLOS: 84%) - CABIN CHIME TRIGGERED</span>';
      if (typeof showToast === 'function') {
        showToast("⚠️ DMS FATIGUE DETECTED: Cabin audio alarm and vibration alert sent to driver", "alert");
      }
    } else {
      statusEl.innerHTML = '<span style="color:var(--accent-emerald);">AI: ALERT & ATTENTIVE • EYE CLOSURE: 2%</span>';
      if (typeof showToast === 'function') {
        showToast("DMS Status normalized: Driver gaze attentiveness verified", "success");
      }
    }
  }
}

function triggerCargoDoorAlert() {
  if (typeof showToast === 'function') {
    showToast("⚠️ SECURITY ALERT: Reefer cargo door magnetic latch trigger test complete (Status: LOCKED)", "alert");
  }
}

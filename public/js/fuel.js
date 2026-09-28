/**
 * TITAN FLEET COMMAND - IoT Live Fuel Gauge & Fuel Theft Guard
 */

function updateFuelGaugeDisplay() {
  if (!selectedTruck) return;

  const title = document.getElementById('fuelGaugeTitle');
  if (title) title.innerText = `${selectedTruck.id} Fuel Telemetry`;

  const pct = document.getElementById('fuelGaugePercentage');
  if (pct) pct.innerText = `${Math.round(selectedTruck.fuelLevel)}%`;
  
  const currentGallons = (selectedTruck.fuelLevel * selectedTruck.fuelCapacity / 100).toFixed(1);
  const gal = document.getElementById('fuelGaugeGallons');
  if (gal) gal.innerText = `${currentGallons} / ${selectedTruck.fuelCapacity} Gal`;
  
  const burn = document.getElementById('fuelBurnRate');
  if (burn) burn.innerHTML = `${selectedTruck.burnRateGph} <span>GPH</span>`;

  const estRange = Math.round((currentGallons / (selectedTruck.burnRateGph || 8)) * selectedTruck.speed);
  const rng = document.getElementById('fuelRange');
  if (rng) rng.innerHTML = `${Math.max(estRange, 80)} <span>mi</span>`;

  const temp = document.getElementById('fuelTemp');
  if (temp) temp.innerHTML = `${selectedTruck.tankTempF}°F <span>0.84 kg/L</span>`;

  // Dual tank balance
  const tank1 = (currentGallons * 0.505).toFixed(1);
  const tank2 = (currentGallons * 0.495).toFixed(1);
  const bal = document.getElementById('fuelTanksBalance');
  if (bal) bal.innerHTML = `${tank1} / ${tank2} <span>Gal</span>`;

  // Circular SVG Arc animation
  const circle = document.getElementById('fuelProgressCircle');
  if (circle) {
    const maxOffset = 377;
    const targetOffset = maxOffset - (selectedTruck.fuelLevel / 100) * 280;
    circle.style.strokeDashoffset = targetOffset;

    if (selectedTruck.fuelLevel > 50) circle.style.stroke = 'var(--accent-emerald)';
    else if (selectedTruck.fuelLevel > 20) circle.style.stroke = 'var(--accent-amber)';
    else circle.style.stroke = 'var(--accent-rose)';
  }

  // Needle Rotation (-135deg to +135deg)
  const deg = -135 + (selectedTruck.fuelLevel / 100) * 270;
  const needle = document.getElementById('fuelNeedleGroup');
  if (needle) needle.style.transform = `rotate(${deg}deg)`;
}

function triggerSimulatedTheftAlert() {
  if (!selectedTruck) return;
  selectedTruck.fuelTheftAlert = true;
  selectedTruck.fuelLevel = Math.max(12, selectedTruck.fuelLevel - 24);
  selectedTruck.burnRateGph = 18.5;

  const box = document.getElementById('theftAlertBox');
  if (box) {
    box.style.background = 'rgba(244, 63, 94, 0.25)';
    box.style.borderColor = 'var(--accent-rose)';
  }

  const statusTxt = document.getElementById('theftStatusText');
  if (statusTxt) statusTxt.innerHTML = '🚨 CRITICAL: RAPID FUEL DROP / THEFT IN PROGRESS';

  const riskBadge = document.getElementById('theftRiskBadge');
  if (riskBadge) {
    riskBadge.className = 'badge badge-alert';
    riskBadge.innerText = 'STATUS: BREACH DETECTED';
  }

  const logTxt = document.getElementById('theftLogText');
  if (logTxt) {
    logTxt.innerHTML = `
      <strong>Anomalous Drain Event:</strong> Sensor detected drop of -24.0 Gal in 120 seconds while vehicle was stationary near Mile Marker 184. Automated remote immobilizer alert dispatched to safety team.
    `;
  }

  updateFuelGaugeDisplay();
  if (typeof drawTelematicsMap === 'function') drawTelematicsMap();
  if (typeof renderTruckSidebar === 'function') renderTruckSidebar();

  if (typeof showToast === 'function') {
    showToast(`🚨 FUEL THEFT ALARM: ${selectedTruck.id} reported unauthorized siphoning (-24 Gal)`, "alert");
  }
}

function calibrateSensor() {
  if (!selectedTruck) return;
  selectedTruck.fuelTheftAlert = false;
  const box = document.getElementById('theftAlertBox');
  if (box) {
    box.style.background = 'rgba(244, 63, 94, 0.1)';
    box.style.borderColor = 'rgba(244, 63, 94, 0.3)';
  }

  const statusTxt = document.getElementById('theftStatusText');
  if (statusTxt) statusTxt.innerText = '🛡️ Anti-Theft Guard: ACTIVE';

  const riskBadge = document.getElementById('theftRiskBadge');
  if (riskBadge) {
    riskBadge.className = 'badge badge-paid';
    riskBadge.innerText = 'Risk: Normal';
  }

  const logTxt = document.getElementById('theftLogText');
  if (logTxt) logTxt.innerText = 'Sensors recalibrated against dual CAN-Bus floats. Delta tolerance reset to 0.2 Gal.';

  if (typeof renderTruckSidebar === 'function') renderTruckSidebar();
  if (typeof showToast === 'function') showToast(`Fuel tank telemetry recalibrated for ${selectedTruck.id}`, "success");
}

/* 24-Hour Fuel History Canvas Chart */
function drawFuelHistoryChart() {
  const canvas = document.getElementById('fuelHistoryCanvas');
  if (!canvas || !canvas.parentElement) return;
  const ctx = canvas.getContext('2d');
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  const w = canvas.width;
  const h = canvas.height;
  if (!w || !h) return;

  ctx.clearRect(0, 0, w, h);

  // Background grid
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let y = 30; y < h; y += 45) {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(w - 10, y);
    ctx.stroke();
  }

  // Simulated 24-point dataset
  const dataPoints = [92, 88, 85, 81, 77, 72, 68, 64, 59, 54, 48, 42, 38, 96, 94, 91, 88, 86, 84, 82, 80, 78, 82, selectedTruck.fuelLevel];
  const stepX = (w - 60) / (dataPoints.length - 1);

  ctx.beginPath();
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';
  ctx.shadowBlur = 8;

  dataPoints.forEach((val, i) => {
    const x = 45 + i * stepX;
    const y = h - 35 - (val / 100) * (h - 60);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Gradient under the trend curve
  ctx.lineTo(45 + (dataPoints.length - 1) * stepX, h - 30);
  ctx.lineTo(45, h - 30);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
  grad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Axis markers
  ctx.fillStyle = '#64748b';
  ctx.font = '10px monospace';
  ctx.fillText("100%", 10, 35);
  ctx.fillText("50%", 15, h / 2);
  ctx.fillText("0%", 20, h - 32);
  ctx.fillText("-24h", 45, h - 10);
  ctx.fillText("-12h", w / 2 - 10, h - 10);
  ctx.fillText("Now", w - 35, h - 10);
}

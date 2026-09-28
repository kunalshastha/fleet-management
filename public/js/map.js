/**
 * TITAN FLEET COMMAND - Real-Time GPS Tracking & Vector Map Engine
 */

const mapCanvas = document.getElementById('telematicsCanvas');
const mapCtx = mapCanvas ? mapCanvas.getContext('2d') : null;

function renderTruckSidebar() {
  const container = document.getElementById('truckListContainer');
  const searchInput = document.getElementById('truckSearchInput');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  if (!container) return;
  container.innerHTML = '';

  FLEET_DATA.forEach(truck => {
    if (currentTruckFilter !== 'all' && truck.status !== currentTruckFilter) {
      return;
    }

    const matchesSearch = truck.id.toLowerCase().includes(searchTerm) ||
                          truck.driver.toLowerCase().includes(searchTerm) ||
                          truck.routeTitle.toLowerCase().includes(searchTerm);
    if (!matchesSearch) return;

    const item = document.createElement('div');
    item.className = `truck-item ${truck.id === selectedTruck.id ? 'active' : ''}`;
    item.onclick = () => selectTruck(truck.id);

    let badgeClass = 'badge-transit';
    let badgeLabel = 'En Route';
    if (truck.status === 'idle') { badgeClass = 'badge-idle'; badgeLabel = 'Idling'; }
    if (truck.status === 'loading') { badgeClass = 'badge-loading'; badgeLabel = 'Docked / Loading'; }
    if (truck.fuelTheftAlert) { badgeClass = 'badge-alert'; badgeLabel = 'THEFT ALARM'; }

    item.innerHTML = `
      <div class="truck-header">
        <div class="truck-id">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          </svg>
          ${truck.id}
        </div>
        <span class="badge ${badgeClass}">${badgeLabel}</span>
      </div>
      <div class="truck-meta">
        <span><strong>Driver:</strong> ${truck.driver}</span>
        <span>${truck.speed} MPH</span>
      </div>
      <div style="font-size:0.75rem; color:var(--text-muted);">${truck.routeTitle}</div>
      <div class="truck-stats-row">
        <span>Fuel: <strong>${Math.round(truck.fuelLevel)}%</strong></span>
        <span>Burn: <strong>${truck.burnRateGph} GPH</strong></span>
        <span>RPM: <strong>${truck.rpm}</strong></span>
      </div>
    `;
    container.appendChild(item);
  });
}

function selectTruck(truckId) {
  const found = FLEET_DATA.find(t => t.id === truckId);
  if (!found) return;
  selectedTruck = found;
  renderTruckSidebar();
  updateHudOverlay();
  
  if (typeof updateFuelGaugeDisplay === 'function') updateFuelGaugeDisplay();
  if (typeof renderDriverSalaryBreakdown === 'function') renderDriverSalaryBreakdown();
  
  // Sync CCTV Truck Selector
  const cctvSel = document.getElementById('cctvTruckSelector');
  if (cctvSel) cctvSel.value = truckId;
  const cctvTitle = document.getElementById('cctvTruckTitle');
  if (cctvTitle) {
    cctvTitle.innerHTML = `${selectedTruck.id} &bull; 4-Channel Live Security Stream (${selectedTruck.driver})`;
  }
  
  if (typeof showToast === 'function') {
    showToast(`Switched tracking telemetry to ${selectedTruck.id} (${selectedTruck.driver})`, "info");
  }
}

function setTruckFilter(filter, chipEl) {
  currentTruckFilter = filter;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  chipEl.classList.add('active');
  renderTruckSidebar();
}

function filterTruckList() {
  renderTruckSidebar();
}

function updateHudOverlay() {
  const title = document.getElementById('currentMapFocusTitle');
  if (title) title.innerText = `${selectedTruck.id} • ${selectedTruck.model} • ${selectedTruck.driver}`;

  const hudTruck = document.getElementById('hudTruckId');
  if (hudTruck) hudTruck.innerText = `${selectedTruck.id} ${selectedTruck.model.split(' ')[0]}`;

  const hudDriver = document.getElementById('hudDriver');
  if (hudDriver) hudDriver.innerText = selectedTruck.driver;

  const hudSpeed = document.getElementById('hudSpeed');
  if (hudSpeed) hudSpeed.innerText = `${selectedTruck.speed} MPH (${selectedTruck.speed > 55 ? 'Cruise Active' : selectedTruck.speed === 0 ? 'Stationary' : 'City Transit'})`;

  const hudRoute = document.getElementById('hudRoute');
  if (hudRoute) hudRoute.innerText = selectedTruck.routeTitle;

  const hudRpm = document.getElementById('hudRpm');
  if (hudRpm) hudRpm.innerText = `${selectedTruck.rpm} RPM`;

  const hudFuel = document.getElementById('hudFuel');
  if (hudFuel) hudFuel.innerText = `${Math.round(selectedTruck.fuelLevel)}% (${Math.round(selectedTruck.fuelLevel * selectedTruck.fuelCapacity / 100)} Gal)`;

  const badge = document.getElementById('hudStatus');
  if (badge) {
    if (selectedTruck.status === 'transit') {
      badge.className = 'badge badge-transit';
      badge.innerText = 'En Route';
    } else if (selectedTruck.status === 'idle') {
      badge.className = 'badge badge-idle';
      badge.innerText = 'Idling';
    } else {
      badge.className = 'badge badge-loading';
      badge.innerText = 'Loading';
    }
  }
}

function resizeTelematicsCanvas() {
  if (!mapCanvas || !mapCanvas.parentElement) return;
  const rect = mapCanvas.parentElement.getBoundingClientRect();
  mapCanvas.width = rect.width;
  mapCanvas.height = Math.max(rect.height, 500);
  drawTelematicsMap();
}

function drawTelematicsMap() {
  if (!mapCanvas || !mapCtx) return;
  const w = mapCanvas.width;
  const h = mapCanvas.height;
  if (!w || !h) return;

  mapCtx.clearRect(0, 0, w, h);

  // 1. Radar Grid Background
  mapCtx.fillStyle = '#0a1020';
  mapCtx.fillRect(0, 0, w, h);

  mapCtx.strokeStyle = 'rgba(30, 41, 59, 0.6)';
  mapCtx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < w; x += gridSize) {
    mapCtx.beginPath();
    mapCtx.moveTo(x, 0);
    mapCtx.lineTo(x, h);
    mapCtx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    mapCtx.beginPath();
    mapCtx.moveTo(0, y);
    mapCtx.lineTo(w, y);
    mapCtx.stroke();
  }

  // 2. Simulated Highway Corridors
  const highways = [
    [ {x: 60, y: 120}, {x: 200, y: 160}, {x: 420, y: 140}, {x: 620, y: 180} ], // I-80
    [ {x: 420, y: 140}, {x: 380, y: 195}, {x: 340, y: 250}, {x: 230, y: 390}, {x: 220, y: 460} ], // I-55 / I-35
    [ {x: 480, y: 170}, {x: 520, y: 290}, {x: 550, y: 390}, {x: 610, y: 520} ], // I-75 / I-95
    [ {x: 60, y: 330}, {x: 150, y: 360}, {x: 230, y: 390}, {x: 360, y: 410} ]  // I-10
  ];

  highways.forEach(hw => {
    mapCtx.beginPath();
    mapCtx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    mapCtx.lineWidth = 3;
    hw.forEach((pt, i) => {
      const scaledX = (pt.x / 700) * w;
      const scaledY = (pt.y / 550) * h;
      if (i === 0) mapCtx.moveTo(scaledX, scaledY);
      else mapCtx.lineTo(scaledX, scaledY);
    });
    mapCtx.stroke();
  });

  // 3. Draw Selected Truck Route with Glowing Trail
  if (selectedTruck && selectedTruck.path) {
    const path = selectedTruck.path;

    // Projected path corridor
    mapCtx.beginPath();
    mapCtx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
    mapCtx.lineWidth = 5;
    path.forEach((pt, idx) => {
      const px = (pt.x / 700) * w;
      const py = (pt.y / 550) * h;
      if (idx === 0) mapCtx.moveTo(px, py);
      else mapCtx.lineTo(px, py);
    });
    mapCtx.stroke();

    // Completed Route Section (Glowing Cyan)
    const currentCoordX = (selectedTruck.coordinates.x / 700) * w;

    mapCtx.beginPath();
    mapCtx.strokeStyle = '#06b6d4';
    mapCtx.lineWidth = 4;
    mapCtx.shadowColor = '#06b6d4';
    mapCtx.shadowBlur = 10;
    path.forEach((pt, idx) => {
      const px = (pt.x / 700) * w;
      const py = (pt.y / 550) * h;
      if (idx === 0) mapCtx.moveTo(px, py);
      else if (px <= currentCoordX + 20) mapCtx.lineTo(px, py);
    });
    mapCtx.stroke();
    mapCtx.shadowBlur = 0;

    // Draw Waypoint Hub Nodes
    path.forEach((pt, idx) => {
      const px = (pt.x / 700) * w;
      const py = (pt.y / 550) * h;

      mapCtx.beginPath();
      mapCtx.arc(px, py, 6, 0, Math.PI * 2);
      mapCtx.fillStyle = idx === 0 ? '#10b981' : idx === path.length - 1 ? '#f59e0b' : '#3b82f6';
      mapCtx.fill();

      mapCtx.fillStyle = '#cbd5e1';
      mapCtx.font = '10px -apple-system, sans-serif';
      mapCtx.fillText(pt.name, px + 9, py + 3);
    });

    // Destination Geofence Boundary
    const destPt = path[path.length - 1];
    const destX = (destPt.x / 700) * w;
    const destY = (destPt.y / 550) * h;
    mapCtx.beginPath();
    mapCtx.arc(destX, destY, 45, 0, Math.PI * 2);
    mapCtx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
    mapCtx.lineWidth = 2;
    mapCtx.stroke();
    mapCtx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    mapCtx.fill();
    mapCtx.fillStyle = '#10b981';
    mapCtx.font = '9px monospace';
    mapCtx.fillText("GEOFENCE: " + destPt.name, destX - 40, destY - 50);
  }

  // 4. Draw Fleet Markers
  FLEET_DATA.forEach(truck => {
    const tx = (truck.coordinates.x / 700) * w;
    const ty = (truck.coordinates.y / 550) * h;
    const isSelected = truck.id === selectedTruck.id;

    if (isSelected || truck.fuelTheftAlert) {
      const pulseRadius = 14 + (Date.now() % 1200) / 1200 * 18;
      mapCtx.beginPath();
      mapCtx.arc(tx, ty, pulseRadius, 0, Math.PI * 2);
      mapCtx.strokeStyle = truck.fuelTheftAlert ? 'rgba(244, 63, 94, 0.6)' : 'rgba(59, 130, 246, 0.5)';
      mapCtx.lineWidth = 2;
      mapCtx.stroke();
    }

    mapCtx.beginPath();
    mapCtx.arc(tx, ty, isSelected ? 11 : 8, 0, Math.PI * 2);
    mapCtx.fillStyle = truck.fuelTheftAlert ? '#f43f5e' : (isSelected ? '#3b82f6' : '#64748b');
    mapCtx.fill();
    mapCtx.strokeStyle = '#ffffff';
    mapCtx.lineWidth = 2;
    mapCtx.stroke();

    // Heading indicator
    mapCtx.save();
    mapCtx.translate(tx, ty);
    mapCtx.rotate(Math.PI / 4);
    mapCtx.fillStyle = '#ffffff';
    mapCtx.beginPath();
    mapCtx.moveTo(0, -5);
    mapCtx.lineTo(4, 4);
    mapCtx.lineTo(-4, 4);
    mapCtx.closePath();
    mapCtx.fill();
    mapCtx.restore();

    mapCtx.fillStyle = isSelected ? '#38bdf8' : '#e2e8f0';
    mapCtx.font = `bold ${isSelected ? '12px' : '10px'} -apple-system, sans-serif`;
    mapCtx.fillText(`${truck.id} (${truck.speed}mph)`, tx + 14, ty - 6);
  });
}

function resetMapView() {
  if (typeof showToast === 'function') showToast("Centered map view on active fleet sector", "info");
  drawTelematicsMap();
}

function toggleGeofenceVisibility() {
  if (typeof showToast === 'function') showToast("Geofence boundary polygons active for 6 logistics hubs", "info");
}

/* Route History Playback Scrubber */
function toggleHistoryPlayback() {
  historyPlaying = !historyPlaying;
  const btn = document.getElementById('historyPlayBtn');
  if (btn) btn.innerText = historyPlaying ? '⏸' : '▶';
  if (historyPlaying && typeof showToast === 'function') {
    showToast("Historical GPS trail playback started", "info");
  }
}

function setPlaybackSpeed(multiplier) {
  playbackSpeedMultiplier = multiplier;
  const speedBadge = document.getElementById('historySpeedBadge');
  if (speedBadge) speedBadge.innerText = `Speed: ${multiplier}x`;
  if (typeof showToast === 'function') showToast(`Playback speed set to ${multiplier}x`, "info");
}

function onScrubberInput(val) {
  historyPlaybackProgress = val / 100;
  updatePlaybackTimeDisplay();
  
  if (selectedTruck && selectedTruck.path) {
    const path = selectedTruck.path;
    const totalSegments = path.length - 1;
    const currentSegmentFloat = historyPlaybackProgress * totalSegments;
    const segIdx = Math.min(Math.floor(currentSegmentFloat), totalSegments - 1);
    const segProgress = currentSegmentFloat - segIdx;

    const p1 = path[segIdx];
    const p2 = path[segIdx + 1];
    selectedTruck.coordinates.x = p1.x + (p2.x - p1.x) * segProgress;
    selectedTruck.coordinates.y = p1.y + (p2.y - p1.y) * segProgress;
  }
  drawTelematicsMap();
  updateHudOverlay();
}

function updatePlaybackTimeDisplay() {
  const totalMinutes = Math.floor(historyPlaybackProgress * 24 * 60);
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const mins = String(totalMinutes % 60).padStart(2, '0');
  const ts = document.getElementById('historyTimestamp');
  if (ts) ts.innerText = `${hours}:${mins}:00 CDT`;
}

window.addEventListener('resize', resizeTelematicsCanvas);

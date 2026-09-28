/**
 * TITAN FLEET COMMAND - Core Application Orchestrator & Telemetry Event Bus
 */

/* ========================================================
   TAB NAVIGATION
   ======================================================== */
function switchTab(tabKey) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
  
  const targetPanel = document.getElementById(`tab-${tabKey}`);
  if (targetPanel) {
    targetPanel.classList.add('active');
  }

  // Highlight active button
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(btn => {
    const attr = btn.getAttribute('onclick');
    if (attr && attr.includes(tabKey)) {
      btn.classList.add('active');
    }
  });

  // Re-render corresponding tab canvases
  if (tabKey === 'gps') {
    if (typeof resizeTelematicsCanvas === 'function') resizeTelematicsCanvas();
  } else if (tabKey === 'fuel') {
    if (typeof updateFuelGaugeDisplay === 'function') updateFuelGaugeDisplay();
    if (typeof drawFuelHistoryChart === 'function') drawFuelHistoryChart();
  }
}

/* ========================================================
   REAL-TIME EVENT BUS & TELEMETRY SIMULATION LOOP
   ======================================================== */
function toggleSimulation() {
  simulationRunning = !simulationRunning;
  const icon = document.getElementById('simIcon');
  const text = document.getElementById('simText');
  
  if (simulationRunning) {
    if (icon) icon.innerText = '⏸';
    if (text) text.innerText = 'Sim Running';
    showToast("Fleet real-time simulation resumed", "info");
  } else {
    if (icon) icon.innerText = '▶';
    if (text) text.innerText = 'Sim Paused';
    showToast("Simulation suspended", "info");
  }
}

setInterval(() => {
  if (!simulationRunning) return;

  // Tick fleet movement and telemetry metrics
  FLEET_DATA.forEach(truck => {
    if (truck.status === 'transit') {
      // Fluctuate speed slightly
      truck.speed = Math.max(55, Math.min(72, truck.speed + (Math.random() * 2 - 1)));
      truck.speed = Math.round(truck.speed);
      truck.rpm = Math.round(1100 + truck.speed * 3.5);

      // Realistically burn fuel
      truck.fuelLevel = Math.max(5, truck.fuelLevel - (truck.burnRateGph / 3600) * 0.4);

      // Move vehicle along its waypoint coordinates
      if (truck.path && truck.path.length > 1) {
        truck.progress = (truck.progress + 0.0008) % 1.0;
        const totalSegments = truck.path.length - 1;
        const currentSegFloat = truck.progress * totalSegments;
        const segIdx = Math.min(Math.floor(currentSegFloat), totalSegments - 1);
        const segProgress = currentSegFloat - segIdx;

        const p1 = truck.path[segIdx];
        const p2 = truck.path[segIdx + 1];
        truck.coordinates.x = p1.x + (p2.x - p1.x) * segProgress;
        truck.coordinates.y = p1.y + (p2.y - p1.y) * segProgress;
      }
    }
  });

  // Re-draw active telemetry views
  if (typeof drawTelematicsMap === 'function') drawTelematicsMap();
  if (typeof updateHudOverlay === 'function') updateHudOverlay();
  if (typeof updateFuelGaugeDisplay === 'function') updateFuelGaugeDisplay();
  if (typeof drawFuelHistoryChart === 'function') drawFuelHistoryChart();

}, 1500);

/* ========================================================
   TOAST NOTIFICATION CENTER
   ======================================================== */
function showToast(message, type = "info") {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = "ℹ️";
  if (type === "alert") icon = "🚨";
  if (type === "success") icon = "✅";

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

/* ========================================================
   APPLICATION BOOTSTRAPPER
   ======================================================== */
window.addEventListener('DOMContentLoaded', () => {
  if (typeof renderTruckSidebar === 'function') renderTruckSidebar();
  if (typeof resizeTelematicsCanvas === 'function') resizeTelematicsCanvas();
  if (typeof renderDriverList === 'function') renderDriverList();
  if (typeof renderDriverSalaryBreakdown === 'function') renderDriverSalaryBreakdown();
  if (typeof renderInvoiceTable === 'function') renderInvoiceTable();
  if (typeof updateFuelGaugeDisplay === 'function') updateFuelGaugeDisplay();
  if (typeof renderCctvFeeds === 'function') renderCctvFeeds();
  
  showToast("Titan Fleet Telematics OS v4.2 Connected to SAE J1939 CAN-Bus", "success");
});

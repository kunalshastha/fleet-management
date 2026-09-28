/**
 * TITAN FLEET COMMAND - Freight Billing & Invoice Generator Module
 */

function renderInvoiceTable() {
  const tbody = document.getElementById('invoiceTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  INVOICES.forEach(inv => {
    const tr = document.createElement('tr');
    let statusBadge = 'badge-paid';
    if (inv.status === 'Pending') statusBadge = 'badge-idle';
    if (inv.status === 'Overdue') statusBadge = 'badge-alert';

    tr.innerHTML = `
      <td><strong>${inv.id}</strong></td>
      <td>${inv.client}</td>
      <td><strong>${inv.truckId}</strong> (${inv.driver})</td>
      <td>${inv.route}</td>
      <td style="font-size:0.75rem; color:var(--text-muted);">${inv.commodity}</td>
      <td>$${inv.baseHaul.toFixed(2)} + <span style="color:var(--accent-cyan);">$${inv.fuelSurcharge.toFixed(2)}</span></td>
      <td style="font-family:var(--font-mono); font-weight:700;">$${inv.total.toFixed(2)}</td>
      <td><span class="badge ${statusBadge}">${inv.status}</span></td>
      <td>
        <button class="btn btn-secondary" style="padding:0.25rem 0.6rem; font-size:0.72rem;" onclick="viewInvoiceModal('${inv.id}')">View &amp; Print</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function viewInvoiceModal(invId) {
  const inv = INVOICES.find(i => i.id === invId) || INVOICES[0];
  
  const num = document.getElementById('sheetInvoiceNum');
  if (num) num.innerText = inv.id;

  const dateEl = document.getElementById('sheetDate');
  if (dateEl) dateEl.innerText = `Date: ${inv.date}`;

  const clientName = document.getElementById('sheetClientName');
  if (clientName) clientName.innerText = inv.client;

  const clientAddr = document.getElementById('sheetClientAddress');
  if (clientAddr) clientAddr.innerText = inv.clientAddress;

  const routeInfo = document.getElementById('sheetRouteInfo');
  if (routeInfo) routeInfo.innerText = inv.route;

  const truckDriver = document.getElementById('sheetTruckDriver');
  if (truckDriver) truckDriver.innerText = `Carrier Unit: ${inv.truckId} (Driver: ${inv.driver})`;

  const bol = document.getElementById('sheetBol');
  if (bol) bol.innerText = `Bill of Lading: ${inv.bol}`;

  const tbody = document.getElementById('sheetLineItems');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td><strong>Linehaul Freight Service</strong><br><small style="color:#64748b;">${inv.commodity}</small></td>
        <td>Flat Route Rate</td>
        <td>1 Load</td>
        <td style="text-align:right;">$${inv.baseHaul.toFixed(2)}</td>
      </tr>
      <tr>
        <td><strong>DOE Fuel Surcharge (FSC)</strong><br><small style="color:#64748b;">Indexed to US EIA National Diesel Index ($3.89/gal)</small></td>
        <td>Mileage Index</td>
        <td>1</td>
        <td style="text-align:right;">$${inv.fuelSurcharge.toFixed(2)}</td>
      </tr>
      <tr>
        <td><strong>Shipper Detention / Accessorial</strong><br><small style="color:#64748b;">Dwell time beyond 2-hr allowance</small></td>
        <td>Hourly / Fixed</td>
        <td>1</td>
        <td style="text-align:right;">$${inv.detention.toFixed(2)}</td>
      </tr>
    `;
  }

  const subtotal = document.getElementById('sheetSubtotal');
  if (subtotal) subtotal.innerText = `$${inv.baseHaul.toFixed(2)}`;

  const fsc = document.getElementById('sheetFuelSurcharge');
  if (fsc) fsc.innerText = `$${inv.fuelSurcharge.toFixed(2)}`;

  const acc = document.getElementById('sheetAccessorials');
  if (acc) acc.innerText = `$${inv.detention.toFixed(2)}`;

  const grand = document.getElementById('sheetGrandTotal');
  if (grand) grand.innerText = `$${inv.total.toFixed(2)}`;

  const modal = document.getElementById('invoiceModal');
  if (modal) modal.classList.add('show');
}

function closeInvoiceModal() {
  const modal = document.getElementById('invoiceModal');
  if (modal) modal.classList.remove('show');
}

function printInvoice() {
  window.print();
}

function openNewInvoiceModal() {
  const modal = document.getElementById('newInvoiceModal');
  if (modal) modal.classList.add('show');
}

function closeNewInvoiceModal() {
  const modal = document.getElementById('newInvoiceModal');
  if (modal) modal.classList.remove('show');
}

function saveNewInvoice() {
  const shipperInput = document.getElementById('newShipper');
  const shipper = (shipperInput && shipperInput.value) ? shipperInput.value : "Apex Global Logistics";
  
  const truckSelect = document.getElementById('newTruckSelect');
  const truckId = truckSelect ? truckSelect.value : "TRK-101";
  const truck = FLEET_DATA.find(t => t.id === truckId) || FLEET_DATA[0];

  const originInput = document.getElementById('newOrigin');
  const origin = (originInput && originInput.value) ? originInput.value : "Chicago, IL";

  const destInput = document.getElementById('newDestination');
  const dest = (destInput && destInput.value) ? destInput.value : "Dallas, TX";

  const baseInput = document.getElementById('newBaseRate');
  const baseRate = parseFloat(baseInput ? baseInput.value : 3000) || 3000;

  const fscInput = document.getElementById('newFscRate');
  const fscRate = parseFloat(fscInput ? fscInput.value : 450) || 450;

  const commInput = document.getElementById('newCommodity');
  const commodity = (commInput && commInput.value) ? commInput.value : "General Freight (40,000 lbs)";

  const bolInput = document.getElementById('newBol');
  const bol = (bolInput && bolInput.value) ? bolInput.value : `BOL-${Math.floor(10000 + Math.random() * 90000)}`;

  const newId = `INV-${Math.floor(85000 + Math.random() * 1000)}`;
  const newInv = {
    id: newId,
    client: shipper,
    clientAddress: "Corporate Freight Terminal",
    truckId: truck.id,
    driver: truck.driver,
    route: `${origin} → ${dest}`,
    commodity: commodity,
    bol: bol,
    baseHaul: baseRate,
    fuelSurcharge: fscRate,
    detention: 0.00,
    total: baseRate + fscRate,
    status: "Pending",
    date: new Date().toISOString().split('T')[0],
    dueDate: "Net 30"
  };

  INVOICES.unshift(newInv);
  renderInvoiceTable();
  closeNewInvoiceModal();
  
  if (typeof showToast === 'function') {
    showToast(`Generated & Dispatched Freight Invoice ${newId} for $${newInv.total.toFixed(2)}`, "success");
  }
}

function exportInvoicesCsv() {
  let csv = "InvoiceID,Client,TruckID,Driver,Route,TotalAmount,Status\n";
  INVOICES.forEach(i => {
    csv += `${i.id},"${i.client}",${i.truckId},"${i.driver}","${i.route}",${i.total},${i.status}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "titan_fleet_invoices.csv";
  a.click();
  
  if (typeof showToast === 'function') {
    showToast("Exported active freight invoices to CSV", "info");
  }
}

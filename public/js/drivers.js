/**
 * TITAN FLEET COMMAND - Driver Roster, FMCSA HOS & Salary Engine
 */

function renderDriverList() {
  const container = document.getElementById('driverListContainer');
  if (!container) return;
  container.innerHTML = '';

  FLEET_DATA.forEach(truck => {
    const row = document.createElement('div');
    row.className = `driver-row ${truck.id === selectedTruck.id ? 'active' : ''}`;
    row.onclick = () => selectTruck(truck.id);

    row.innerHTML = `
      <div class="driver-avatar">${truck.driverInitials}</div>
      <div class="driver-info">
        <div class="driver-name">${truck.driver}</div>
        <div class="driver-assigned">Unit: <strong>${truck.id}</strong> &bull; ${truck.cdl}</div>
        <div style="font-size:0.72rem; color:var(--accent-emerald);">HOS Compliant &bull; 99% Safety</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:0.85rem; font-weight:700; font-family:var(--font-mono); color:var(--text-main);">$${calculateDriverNetPayout(truck).toFixed(2)}</div>
        <div style="font-size:0.7rem; color:var(--text-muted);">Bi-Weekly Net</div>
      </div>
    `;
    container.appendChild(row);
  });
}

function calculateDriverNetPayout(truck) {
  const mileagePay = truck.totalMilesPeriod * truck.salaryRatePerMile;
  const detentionPay = truck.detentionHours * 28.00;
  const gross = mileagePay + detentionPay + truck.safetyBonus + truck.mpgBonus;
  const taxes = gross * 0.18; // 18% effective tax withholding
  const benefitDeductions = 140.00; // Medical & escrow
  return gross - taxes - benefitDeductions;
}

function renderDriverSalaryBreakdown() {
  if (!selectedTruck) return;

  const heroName = document.getElementById('heroDriverName');
  if (heroName) heroName.innerText = selectedTruck.driver;

  const heroAvatar = document.getElementById('heroDriverAvatar');
  if (heroAvatar) heroAvatar.innerText = selectedTruck.driverInitials;

  const heroCdl = document.getElementById('heroDriverCdl');
  if (heroCdl) heroCdl.innerText = `CDL-A #${selectedTruck.cdl}`;

  const heroTruck = document.getElementById('heroDriverTruck');
  if (heroTruck) heroTruck.innerText = `Assigned to ${selectedTruck.id} (${selectedTruck.model}) • Phone: ${selectedTruck.phone}`;

  const tbody = document.getElementById('salaryCalcBody');
  if (!tbody) return;

  const miles = selectedTruck.totalMilesPeriod;
  const rate = selectedTruck.salaryRatePerMile;
  const mileageSubtotal = miles * rate;
  const detentionHours = selectedTruck.detentionHours;
  const detentionSubtotal = detentionHours * 28.00;
  const gross = mileageSubtotal + detentionSubtotal + selectedTruck.safetyBonus + selectedTruck.mpgBonus;
  const taxes = gross * 0.18;
  const benefits = 140.00;
  const net = gross - taxes - benefits;

  tbody.innerHTML = `
    <tr>
      <td><strong>Dispatched Mileage Pay</strong><div style="font-size:0.72rem; color:var(--text-muted);">PC*Miler Practical Route Verified</div></td>
      <td>
        <input type="number" step="0.01" class="table-rate-input" value="${rate.toFixed(2)}" onchange="updateDriverRate(this.value)"> $/mi
      </td>
      <td>${miles.toLocaleString()} mi</td>
      <td><strong>$${mileageSubtotal.toFixed(2)}</strong></td>
    </tr>
    <tr>
      <td><strong>Detention &amp; Layover Pay</strong><div style="font-size:0.72rem; color:var(--text-muted);">$28/hr after 2-hour free dwell</div></td>
      <td>$28.00 / hr</td>
      <td>${detentionHours} hrs</td>
      <td><strong>$${detentionSubtotal.toFixed(2)}</strong></td>
    </tr>
    <tr>
      <td><strong>Fuel Economy Bonus</strong><div style="font-size:0.72rem; color:var(--text-muted);">&gt;7.4 MPG Fleet Target Tier</div></td>
      <td>Flat Bonus</td>
      <td>7.6 Avg MPG</td>
      <td style="color:var(--accent-emerald);"><strong>+$${selectedTruck.mpgBonus.toFixed(2)}</strong></td>
    </tr>
    <tr>
      <td><strong>Zero-Violation Safety Incentive</strong><div style="font-size:0.72rem; color:var(--text-muted);">Clean DOT Level 1 Inspection</div></td>
      <td>Flat Incentive</td>
      <td>Score 99.2%</td>
      <td style="color:var(--accent-emerald);"><strong>+$${selectedTruck.safetyBonus.toFixed(2)}</strong></td>
    </tr>
    <tr>
      <td colspan="3" style="text-align:right; font-weight:600; color:var(--text-muted);">Total Gross Earnings:</td>
      <td><strong>$${gross.toFixed(2)}</strong></td>
    </tr>
    <tr>
      <td><strong>Tax Withholdings</strong><div style="font-size:0.72rem; color:var(--text-muted);">Federal, FICA, State W-4</div></td>
      <td>18.0% Effective</td>
      <td>All Earnings</td>
      <td style="color:var(--accent-rose);">-$${taxes.toFixed(2)}</td>
    </tr>
    <tr>
      <td><strong>Benefit Deductions</strong><div style="font-size:0.72rem; color:var(--text-muted);">Health, Vision, Escrow transponder</div></td>
      <td>Fixed Weekly</td>
      <td>Bi-Weekly</td>
      <td style="color:var(--accent-rose);">-$${benefits.toFixed(2)}</td>
    </tr>
    <tr class="salary-total-row">
      <td colspan="3" style="font-size:1.05rem;"><strong>Net Direct Deposit Settlement:</strong></td>
      <td style="font-size:1.15rem; color:var(--accent-emerald); font-family:var(--font-mono); font-weight:800;">
        $${net.toFixed(2)}
      </td>
    </tr>
  `;
}

function updateDriverRate(newRate) {
  if (!selectedTruck) return;
  selectedTruck.salaryRatePerMile = parseFloat(newRate) || 0.65;
  renderDriverSalaryBreakdown();
  renderDriverList();
  if (typeof showToast === 'function') {
    showToast(`Updated per-mile rate for ${selectedTruck.driver} to $${selectedTruck.salaryRatePerMile.toFixed(2)}/mi`, "success");
  }
}

function generatePayStubModal() {
  if (!selectedTruck) return;
  
  const stubDriverName = document.getElementById('stubDriverName');
  if (stubDriverName) stubDriverName.innerText = selectedTruck.driver;

  const stubDriverId = document.getElementById('stubDriverId');
  if (stubDriverId) stubDriverId.innerText = `Employee ID: ${selectedTruck.driverId} • CDL: ${selectedTruck.cdl}`;

  const stubMilesTotal = document.getElementById('stubMilesTotal');
  if (stubMilesTotal) stubMilesTotal.innerText = `Dispatched Miles: ${selectedTruck.totalMilesPeriod.toLocaleString()} mi`;

  const miles = selectedTruck.totalMilesPeriod;
  const rate = selectedTruck.salaryRatePerMile;
  const mileageSub = miles * rate;
  const detentionSub = selectedTruck.detentionHours * 28.00;
  const gross = mileageSub + detentionSub + selectedTruck.safetyBonus + selectedTruck.mpgBonus;
  const taxes = gross * 0.18;
  const benefits = 140.00;
  const net = gross - taxes - benefits;

  const body = document.getElementById('stubEarningsBody');
  if (body) {
    body.innerHTML = `
      <tr>
        <td>Mileage Base Compensation</td>
        <td>$${rate.toFixed(2)} / mi</td>
        <td>${miles.toLocaleString()} mi</td>
        <td style="text-align:right;">$${mileageSub.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Detention &amp; Layover Pay</td>
        <td>$28.00 / hr</td>
        <td>${selectedTruck.detentionHours} hrs</td>
        <td style="text-align:right;">$${detentionSub.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Fuel Efficiency Tier 1 Bonus</td>
        <td>Incentive</td>
        <td>1</td>
        <td style="text-align:right;">$${selectedTruck.mpgBonus.toFixed(2)}</td>
      </tr>
      <tr>
        <td>DOT Safety Score Bonus</td>
        <td>Incentive</td>
        <td>1</td>
        <td style="text-align:right;">$${selectedTruck.safetyBonus.toFixed(2)}</td>
      </tr>
    `;
  }

  const stubGross = document.getElementById('stubGross');
  if (stubGross) stubGross.innerText = `$${gross.toFixed(2)}`;

  const stubTaxes = document.getElementById('stubTaxes');
  if (stubTaxes) stubTaxes.innerText = `-$${taxes.toFixed(2)}`;

  const stubDeductions = document.getElementById('stubDeductions');
  if (stubDeductions) stubDeductions.innerText = `-$${benefits.toFixed(2)}`;

  const stubNetPayout = document.getElementById('stubNetPayout');
  if (stubNetPayout) stubNetPayout.innerText = `$${net.toFixed(2)}`;

  const modal = document.getElementById('payStubModal');
  if (modal) modal.classList.add('show');
}

function closePayStubModal() {
  const modal = document.getElementById('payStubModal');
  if (modal) modal.classList.remove('show');
}

function printPayStub() {
  window.print();
}

function openAddDriverModal() {
  if (typeof showToast === 'function') {
    showToast("Add Driver Wizard: Upload CDL-A credentials, FMCSA medical card, and assign unit.", "info");
  }
}

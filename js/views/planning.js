import { REASONS, REASON_COLORS } from "../constants.js";
import { employeesOf, getAbsence, getState } from "../state.js";
import { isoWeekNumber, formatRange, dayName, formatDate } from "../utils/date.js";
import { formatNumber } from "../utils/number.js";
import { availableHours, currentWeekTotals } from "../calculations.js";

export function viewPlanning(days) {
  const { werkplaats } = getState();
  const employees = employeesOf(werkplaats);

  const headerRow = `
    <div class="row wrap" style="justify-content:space-between">
      <div class="bar">
        <button class="btn ghost" id="prevWeek" data-testid="btn-prev">← Vorige</button>
        <div class="pill">Week ${isoWeekNumber(days[0])} · ${formatRange(days)}</div>
        <button class="btn ghost" id="nextWeek" data-testid="btn-next">Volgende →</button>
      </div>
      <div class="bar">
        <button class="btn ghost" id="exportBtn">Export</button>
        <button class="btn warn" id="importBtn">Import</button>
      </div>
    </div>
  `;

  const table = `
    <table class="table">
      <thead>
        <tr>
          <th>Medewerker</th>
          ${days.map((day) => `<th>${dayName(day)}<div class="mini">${day.getDate()}-${day.getMonth() + 1}</div></th>`).join("")}
          <th>Beschikbare uren</th>
        </tr>
      </thead>
      <tbody>
        ${employees.map((employee) => renderEmployeeRow(employee, days)).join("")}
      </tbody>
    </table>
  `;

  const totals = currentWeekTotals(days);
  const totalsCard = `
    <div class="card row wrap" style="justify-content:space-between; align-items:center">
      <div class="mini">Totaal uren (week) — ${werkplaats}</div>
      <div class="legend">
        <span class="chip">Productief: <b>${formatNumber(totals.productive)}</b> u</span>
        <span class="chip">Indirect: <b>${formatNumber(totals.indirect)}</b> u</span>
        <span class="chip">Som: <b>${formatNumber(totals.productive + totals.indirect)}</b> u</span>
      </div>
    </div>
  `;

  return `
    <section class="stack">
      ${headerRow}
      <div class="card">${table}</div>
      ${totalsCard}
    </section>
  `;
}

function renderEmployeeRow(employee, days) {
  const cells = days.map((day) => renderDayCell(employee, day)).join("");
  const available = availableHours(employee, days);
  return `
    <tr>
      <td style="background:transparent; border:0; padding:0 8px 0 0">
        <div class="card" style="padding:10px 12px">
          <div style="font-weight:600">${employee.naam}</div>
          <div class="mini">${employee.rol} · ${employee.urenPerDag} u/dag</div>
        </div>
      </td>
      <td colspan="5">
        <div class="days rowbar">
          <div style="display:none"></div>
          ${cells}
          <div class="weekly mini">Beschikbaar: <b>${formatNumber(available)}</b> u</div>
        </div>
      </td>
      <td class="mini" style="text-align:right">${formatNumber(available)} u</td>
    </tr>
  `;
}

function renderDayCell(employee, day) {
  const dateStr = formatDate(day);
  const record = getAbsence(employee.id, dateStr) || { hours: 0, reasons: {} };
  const absentHours = +record.hours || 0;
  const present = Math.max(0, employee.urenPerDag - absentHours);
  const bar = renderReasonBar(record, employee.urenPerDag);
  return `
    <div class="daycell" data-emp="${employee.id}" data-date="${dateStr}" data-base="${employee.urenPerDag}">
      <div class="mini" style="margin-bottom:6px">Afwezig: <b>${formatNumber(absentHours)}</b> u · Anw.: <b>${formatNumber(present)}</b> u</div>
      <div class="absbar">${bar}</div>
    </div>
  `;
}

function renderReasonBar(record, baseHours) {
  const hours = +record?.hours || 0;
  if (hours <= 0) {
    return "";
  }
  const segments = [];
  let used = 0;
  for (const reason of REASONS) {
    const value = Math.max(0, +((record.reasons || {})[reason] || 0));
    if (value > 0) {
      used += value;
      const width = (value / baseHours) * 100;
      segments.push(`<span class="segm" style="width:${width}%; background:${REASON_COLORS[reason]}"></span>`);
    }
  }
  if (used < hours) {
    const width = ((hours - used) / baseHours) * 100;
    segments.push(`<span class="segm" style="width:${width}%; background:var(--r-afwezig)"></span>`);
  }
  return segments.join("");
}

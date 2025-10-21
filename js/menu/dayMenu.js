import { REASONS, REASON_COLORS } from "../constants.js";
import { getAbsence, getState, setAbsence } from "../state.js";
import { formatNumber, round1 } from "../utils/number.js";

let dialog;
let hoursInput;
let titleElement;
let presenceElement;
let reasonsList;
let submitCallback = () => {};

export function initDayMenu(onSubmit = () => {}) {
  dialog = document.getElementById("dayMenu");
  hoursInput = document.getElementById("dayHours");
  titleElement = document.getElementById("dayTitle");
  presenceElement = document.getElementById("dayPresence");
  reasonsList = document.getElementById("reasonsList");
  submitCallback = onSubmit;

  if (!dialog) {
    return;
  }

  dialog.addEventListener("close", handleClose);
}

export function openDayMenu(cell) {
  if (!dialog) {
    return;
  }
  const empId = cell.dataset.emp;
  const dateStr = cell.dataset.date;
  const base = Number(cell.dataset.base) || 8;
  const employee = getState().employees.find((item) => item.id === empId);
  const record = getAbsence(empId, dateStr) || { hours: 0, reasons: {} };

  dialog.dataset.empId = empId;
  dialog.dataset.dateStr = dateStr;
  dialog.dataset.base = String(base);

  titleElement.textContent = `${employee?.naam || "Medewerker"} • ${dateStr}`;
  hoursInput.max = base;
  hoursInput.value = record.hours || 0;

  reasonsList.innerHTML = "";
  for (const reason of REASONS) {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <span style="display:inline-block; width:16px; height:16px; border-radius:4px; background:${REASON_COLORS[reason]}"></span>
      <span style="width:120px; color:var(--muted); font-size:.9rem; text-transform:capitalize">${reason}</span>
      <input type="number" min="0" step="0.5" data-reason="${reason}" value="${record.reasons?.[reason] || 0}" style="max-width:100px">
    `;
    reasonsList.appendChild(row);
  }

  attachReasonListeners();
  attachHourListener();
  updatePresence();

  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "true");
  }
}

function attachReasonListeners() {
  const inputs = [...reasonsList.querySelectorAll("input[data-reason]")];
  inputs.forEach((input) => {
    input.addEventListener("input", enforceReasonCap);
  });
}

function attachHourListener() {
  if (!hoursInput) {
    return;
  }
  hoursInput.removeEventListener("input", onHoursChange);
  hoursInput.addEventListener("input", onHoursChange);
}

function onHoursChange() {
  const base = Number(dialog.dataset.base) || 8;
  const hours = Math.max(0, Math.min(base, Number(hoursInput.value) || 0));
  hoursInput.value = String(hours);
  enforceReasonCap();
  updatePresence();
}

function enforceReasonCap() {
  const base = Number(dialog.dataset.base) || 8;
  const hours = Math.max(0, Math.min(base, Number(hoursInput.value) || 0));
  const inputs = [...reasonsList.querySelectorAll("input[data-reason]")];
  let total = 0;
  inputs.forEach((input) => {
    total += Number(input.value) || 0;
  });
  if (total > hours) {
    const factor = hours / (total || 1);
    inputs.forEach((input) => {
      input.value = String(round1((Number(input.value) || 0) * factor));
    });
  }
  updatePresence();
}

function updatePresence() {
  if (!presenceElement) {
    return;
  }
  const base = Number(dialog?.dataset.base) || 8;
  const hours = Number(hoursInput?.value) || 0;
  presenceElement.textContent = `Aanwezig: ${formatNumber(Math.max(0, base - hours))} u`;
}

function handleClose() {
  if (dialog.returnValue !== "ok") {
    return;
  }
  const empId = dialog.dataset.empId;
  const dateStr = dialog.dataset.dateStr;
  const hours = Number(hoursInput.value) || 0;
  const inputs = [...reasonsList.querySelectorAll("input[data-reason]")];
  const reasons = {};
  let total = 0;
  inputs.forEach((input) => {
    const value = Number(input.value) || 0;
    if (value > 0) {
      reasons[input.dataset.reason] = value;
      total += value;
    }
  });
  if (total > hours) {
    const factor = hours / (total || 1);
    for (const key of Object.keys(reasons)) {
      reasons[key] = round1(reasons[key] * factor);
    }
  }
  setAbsence(empId, dateStr, { hours, reasons });
  submitCallback();
}

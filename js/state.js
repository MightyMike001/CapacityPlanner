import { ROLES, STORAGE_KEY } from "./constants.js";
import { round1 } from "./utils/number.js";

function generateIdValue() {
  return Math.random().toString(36).slice(2, 9);
}

function key(empId, dateStr) {
  return `${empId}|${dateStr}`;
}

export function defaultState() {
  return {
    werkplaats: "Almere",
    employees: [
      { id: generateIdValue(), naam: "Alex", rol: "Technicus", werkplaats: "Almere", urenPerDag: 8 },
      { id: generateIdValue(), naam: "Bianca", rol: "Teamleider", werkplaats: "Almere", urenPerDag: 8 },
      { id: generateIdValue(), naam: "Chris", rol: "Meewerkend voorman", werkplaats: "Venlo", urenPerDag: 8 },
      { id: generateIdValue(), naam: "Dana", rol: "Expeditie", werkplaats: "Zwijndrecht", urenPerDag: 8 },
    ],
    absences: {},
  };
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function load() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultState();
    }
    const parsed = JSON.parse(stored);
    return normalizeState(parsed);
  } catch (error) {
    return defaultState();
  }
}

let state = load();

export function getState() {
  return state;
}

export function replaceState(nextState) {
  state = normalizeState(nextState);
  save(state);
  return state;
}

export function resetState() {
  state = defaultState();
  save(state);
  return state;
}

export function saveState() {
  save(state);
}

export function setWerkplaats(werkplaats) {
  state.werkplaats = werkplaats;
  save(state);
}

export function employeesOf(werkplaats) {
  return state.employees.filter((employee) => employee.werkplaats === werkplaats);
}

export function generateId() {
  return generateIdValue();
}

export function addEmployee(employee) {
  state.employees.push(employee);
  save(state);
}

export function removeEmployee(employeeId) {
  state.employees = state.employees.filter((employee) => employee.id !== employeeId);
  save(state);
}

export function updateEmployee(employeeId, updates) {
  const employee = state.employees.find((item) => item.id === employeeId);
  if (!employee) {
    return;
  }
  Object.assign(employee, updates);
  save(state);
}

export function getAbsence(empId, dateStr) {
  return state.absences[key(empId, dateStr)];
}

export function setAbsence(empId, dateStr, record) {
  const baseHours = state.employees.find((employee) => employee.id === empId)?.urenPerDag || 8;
  const nextRecord = { ...(getAbsence(empId, dateStr) || {}), ...(record || {}) };
  if (typeof nextRecord.hours !== "number") {
    nextRecord.hours = 0;
  }
  if (!nextRecord.reasons) {
    nextRecord.reasons = {};
  }
  nextRecord.status = nextRecord.hours > 0 ? "afwezig" : "beschikbaar";

  let total = 0;
  Object.keys(nextRecord.reasons).forEach((reason) => {
    const value = +nextRecord.reasons[reason] || 0;
    if (value <= 0) {
      delete nextRecord.reasons[reason];
    } else {
      nextRecord.reasons[reason] = value;
      total += value;
    }
  });

  if (total > nextRecord.hours && nextRecord.hours > 0) {
    const factor = nextRecord.hours / (total || 1);
    Object.keys(nextRecord.reasons).forEach((reason) => {
      nextRecord.reasons[reason] = round1(nextRecord.reasons[reason] * factor);
    });
  }

  if (nextRecord.hours > 0 || Object.keys(nextRecord.reasons).length) {
    state.absences[key(empId, dateStr)] = nextRecord;
  } else {
    delete state.absences[key(empId, dateStr)];
  }

  save(state);
  return baseHours;
}

export function clearAbsences() {
  state.absences = {};
  save(state);
}

export function exportState(pretty = true) {
  return JSON.stringify(state, null, pretty ? 2 : 0);
}

export function importState(raw) {
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  replaceState(parsed);
}

function normalizeState(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== "object") {
    return base;
  }
  const normalized = {
    werkplaats: typeof raw.werkplaats === "string" ? raw.werkplaats : base.werkplaats,
    employees: Array.isArray(raw.employees) ? raw.employees.map(normalizeEmployee) : base.employees,
    absences: raw.absences && typeof raw.absences === "object" ? { ...raw.absences } : {},
  };
  return normalized;
}

function normalizeEmployee(employee, index) {
  if (!employee || typeof employee !== "object") {
    return {
      id: generateIdValue(),
      naam: `Medewerker ${index + 1}`,
      rol: Object.keys(ROLES)[0],
      werkplaats: "Almere",
      urenPerDag: 8,
    };
  }
  return {
    id: employee.id || generateIdValue(),
    naam: employee.naam || `Medewerker ${index + 1}`,
    rol: employee.rol || Object.keys(ROLES)[0],
    werkplaats: employee.werkplaats || "Almere",
    urenPerDag: typeof employee.urenPerDag === "number" ? employee.urenPerDag : 8,
  };
}

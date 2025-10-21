import { ROLES } from "./constants.js";
import { getAbsence, employeesOf, getState } from "./state.js";
import { formatDate, weekDays, mondayOfIsoWeek } from "./utils/date.js";

export function availableHours(employee, days) {
  let total = 0;
  for (const day of days) {
    const dateStr = formatDate(day);
    const base = employee.urenPerDag;
    const record = getAbsence(employee.id, dateStr);
    const blocked = record ? record.hours || base : 0;
    const isBusy = record ? (typeof record.hours === "number" ? record.hours > 0 : record.status !== "beschikbaar") : false;
    total += Math.max(0, base - (isBusy ? blocked : 0));
  }
  return total;
}

export function calcTotals(days, werkplaats) {
  const employees = employeesOf(werkplaats);
  let productive = 0;
  let indirect = 0;
  for (const employee of employees) {
    const available = availableHours(employee, days);
    const productivity = ROLES[employee.rol]?.productive ?? 0;
    productive += available * productivity;
    indirect += available * (1 - productivity);
  }
  return { productive, indirect };
}

export function calcWeekTotals(werkplaats, year, isoWeek) {
  const start = mondayOfIsoWeek(isoWeek, year);
  const days = weekDays(start);
  return calcTotals(days, werkplaats);
}

export function currentWeekTotals(days) {
  const { werkplaats } = getState();
  return calcTotals(days, werkplaats);
}

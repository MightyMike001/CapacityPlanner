export function isoMonday(date) {
  const value = new Date(date);
  const day = (value.getDay() + 6) % 7;
  value.setDate(value.getDate() - day);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function formatDate(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function weekDays(baseDate) {
  const monday = isoMonday(baseDate);
  const days = [];
  for (let index = 0; index < 5; index += 1) {
    days.push(addDays(monday, index));
  }
  return days;
}

export function formatRange(days) {
  const start = days[0];
  const end = days[days.length - 1];
  return `${start.getDate()}-${start.getMonth() + 1} t/m ${end.getDate()}-${end.getMonth() + 1}`;
}

export function dayName(date) {
  const names = ["Ma", "Di", "Wo", "Do", "Vr"];
  const index = (date.getDay() + 6) % 7;
  return names[index] || "";
}

export function isoWeekNumber(date) {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  return Math.ceil(((utcDate - yearStart) / 86400000 + 1) / 7);
}

export function mondayOfIsoWeek(week, year) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dayOfWeek = simple.getDay();
  const isoWeekStart = new Date(simple);
  const diff = (dayOfWeek <= 4 ? 1 : 8) - dayOfWeek;
  isoWeekStart.setDate(simple.getDate() + diff);
  isoWeekStart.setHours(0, 0, 0, 0);
  return isoWeekStart;
}

export function isoWeeksInYear(year) {
  let weeks = isoWeekNumber(new Date(year, 11, 31));
  if (weeks === 1) {
    weeks = isoWeekNumber(new Date(year, 11, 28));
  }
  return weeks;
}

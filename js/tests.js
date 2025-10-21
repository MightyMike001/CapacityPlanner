import { availableHours, calcTotals } from "./calculations.js";
import { getState, replaceState, setAbsence } from "./state.js";
import { isoWeekNumber, isoWeeksInYear, mondayOfIsoWeek, isoMonday, weekDays, formatDate } from "./utils/date.js";

function assert(name, condition) {
  if (!condition) {
    console.error("❌ Test faalde:", name);
    throw new Error(`Test: ${name}`);
  }
  console.log("✅", name);
}

export function runTests() {
  const backup = JSON.parse(JSON.stringify(getState()));
  try {
    assert("isoWeekNumber(2020-12-31) == 53", isoWeekNumber(new Date("2020-12-31")) === 53);
    assert("isoWeeksInYear(2015) == 53", isoWeeksInYear(2015) === 53);
    assert("isoWeeksInYear(2020) == 53", isoWeeksInYear(2020) === 53);
    assert("isoWeeksInYear(2021) == 52", isoWeeksInYear(2021) === 52);
    assert(
      "mondayOfIsoWeek(53,2020) == 2020-12-28",
      formatDate(mondayOfIsoWeek(53, 2020)) === "2020-12-28",
    );
    const monday = mondayOfIsoWeek(1, 2021);
    assert("mondayOfIsoWeek returns Monday", monday.getDay() === 1);

    const werkplaats = backup.werkplaats;
    const employee = { id: "t1", naam: "Test", rol: "Technicus", werkplaats, urenPerDag: 8 };
    replaceState({ werkplaats, employees: [employee], absences: {} });

    let baseMonday = isoMonday(new Date("2024-01-03"));
    let days = weekDays(baseMonday);
    assert("availableHours 40h baseline", availableHours(employee, days) === 40);
    setAbsence("t1", formatDate(days[0]), { hours: 8 });
    assert("availableHours 32h with full-day absence", availableHours(employee, days) === 32);

    replaceState({ werkplaats, employees: [employee], absences: {} });
    setAbsence("t1", formatDate(days[1]), { hours: 4 });
    assert("availableHours 36h with half-day absence", availableHours(employee, days) === 36);
    setAbsence("t1", formatDate(days[0]), { hours: 8 });
    assert("availableHours 28h with full-day+half-day", availableHours(employee, days) === 28);

    const voorman = { id: "m", naam: "Mees", rol: "Meewerkend voorman", werkplaats, urenPerDag: 8 };
    replaceState({ werkplaats, employees: [voorman], absences: {} });
    days = weekDays(isoMonday(new Date("2024-05-15")));
    const totals = calcTotals(days, werkplaats);
    assert("calcTotals voorman productief 20h", Math.abs(totals.productive - 20) < 1e-9);
    assert("calcTotals voorman indirect 20h", Math.abs(totals.indirect - 20) < 1e-9);

    console.log("🧪 Alle tests geslaagd.");
  } finally {
    replaceState(backup);
  }
}

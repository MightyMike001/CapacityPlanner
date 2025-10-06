import {
  state,
  LEAVE_TYPES,
  MONTH_LABELS,
  WEEKDAY_LABELS,
  NUMBER_FORMATTER,
} from "./state.js";
import {
  workdayHours,
  normaliseLeaveEntry,
  formatHoursValue,
  leaveTypeLabel,
  buildLeaveReasonOptions,
  leaveCodeForType,
  clampHours,
  parseISODate,
  isoWeek,
  todayUtc,
  formatISODate,
  safeHours,
  startOfISOWeek,
  totalCapacity,
} from "./utils.js";
import { getTasksForChart } from "./data.js";

export function renderLeaveMatrix() {
  const host = document.getElementById("leave-matrix");
  const matrix = state.leaveMatrix || {};
  const availableYears = Array.isArray(matrix.years) && matrix.years.length ? [...matrix.years].sort((a, b) => a - b) : [];
  let year = Number(state.currentLeaveYear);
  const fallback = availableYears.length ? availableYears[availableYears.length - 1] : todayUtc().getUTCFullYear();
  if (!Number.isFinite(year) || (availableYears.length && !availableYears.includes(year))) {
    year = fallback;
    if (state.currentLeaveYear !== year) {
      state.currentLeaveYear = year;
      state.leaveMatrixScrollYear = null;
    }
  }

  const yearSelect = document.getElementById("f-year");
  if (yearSelect && yearSelect.value !== String(year)) {
    yearSelect.value = String(year);
  }

  renderCapacityChart(year);

  if (!host) return;

  const days = buildLeaveDays(year);
  const employees = Array.isArray(matrix.employees) ? matrix.employees : [];
  host.innerHTML = "";

  if (!days.length || !employees.length) {
    host.textContent = "Geen verlofdata beschikbaar.";
    return;
  }

  const table = document.createElement("table");
  table.className = "leave-matrix";
  const caption = document.createElement("caption");
  caption.textContent = `Volledig jaar ${year} (1 januari – 31 december)`;
  table.appendChild(caption);

  const thead = document.createElement("thead");
  const headerRows = buildMatrixHeader(days, year);
  headerRows.forEach((row) => thead.appendChild(row));
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  employees.forEach((emp, empIndex) => {
    const tr = document.createElement("tr");
    const rowTh = document.createElement("th");
    rowTh.innerHTML = `${escapeName(emp.name)}<span class="meta">${escapeName(emp.role || "")}</span>`;
    tr.appendChild(rowTh);

    const teamCell = document.createElement("td");
    teamCell.className = "team";
    teamCell.textContent = emp.team || "–";
    tr.appendChild(teamCell);

    const entries = emp.entries || {};
    days.forEach((day) => {
      const td = document.createElement("td");
      td.dataset.date = day.date;
      const entry = entries[day.date];
      const stack = document.createElement("div");
      stack.className = "cell-stack";

      const input = document.createElement("input");
      input.type = "number";
      input.inputMode = "decimal";
      input.className = "leave-input";
      input.placeholder = "0";
      input.min = "0";
      const maxHours = workdayHours(emp);
      input.max = String(maxHours);
      input.step = "0.25";
      input.dataset.emp = String(empIndex);
      input.dataset.date = day.date;
      const readableDate = `${day.label} ${day.monthLabel ? day.monthLabel : ""} ${year}`.trim();
      input.setAttribute("aria-label", `${emp.name} – ${readableDate}`);

      let hasAbsence = false;
      let typeClass = "";
      if (entry) {
        normaliseLeaveEntry(entry, emp);
        const hoursValue = Number(entry.hours);
        if (entry.label) {
          td.title = entry.label;
        }
        if (Number.isFinite(hoursValue) && hoursValue > 0) {
          hasAbsence = true;
          const formatted = formatHoursValue(hoursValue);
          input.value = formatted;
          const reasonLabel = leaveTypeLabel(entry.type);
          input.title = `${formatted} uur afwezig (${reasonLabel})`;
          typeClass = String(entry.type || "verlof").toLowerCase().replace(/[^a-z0-9]+/g, "-");
        } else {
          input.value = "";
        }
      } else {
        input.value = "";
      }
      if (!input.value) {
        input.removeAttribute("title");
        td.removeAttribute("title");
      }
      stack.appendChild(input);

      const reasonSelect = document.createElement("select");
      reasonSelect.className = "leave-reason";
      reasonSelect.dataset.emp = String(empIndex);
      reasonSelect.dataset.date = day.date;
      reasonSelect.setAttribute("aria-label", `Reden afwezigheid ${emp.name} – ${readableDate}`);
      const reasonOptions = buildLeaveReasonOptions(entry);
      reasonSelect.innerHTML = reasonOptions
        .map((opt) => `<option value="${opt.value}">${opt.label}</option>`)
        .join("");
      const selectedType = entry && entry.type && reasonOptions.some((opt) => opt.value === entry.type)
        ? entry.type
        : reasonOptions[0]
        ? reasonOptions[0].value
        : "";
      if (selectedType) {
        reasonSelect.value = selectedType;
      }
      if (hasAbsence) {
        reasonSelect.disabled = false;
      } else {
        reasonSelect.disabled = true;
        reasonSelect.classList.add("is-hidden");
      }
      stack.appendChild(reasonSelect);

      if (hasAbsence) {
        td.classList.add("has-absence");
        if (typeClass) {
          td.classList.add(`absence--${typeClass}`);
        }
      } else {
        td.classList.add("empty");
      }
      if (day.weekend) td.classList.add("is-weekend");
      td.appendChild(stack);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  host.appendChild(table);

  if (state.leaveMatrixScrollYear !== year) {
    const wrap = host.closest(".leave-matrix-wrap");
    const scrollToWeeks = () => {
      if (wrap) scrollLeaveMatrixToCurrentWeeks(wrap, table);
    };
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(scrollToWeeks);
    } else {
      setTimeout(scrollToWeeks, 0);
    }
    state.leaveMatrixScrollYear = year;
  }
}

function buildMatrixHeader(days, year) {
  const rows = [document.createElement("tr"), document.createElement("tr"), document.createElement("tr")];

  const nameTh = document.createElement("th");
  nameTh.textContent = "Naam";
  nameTh.rowSpan = 3;
  rows[0].appendChild(nameTh);

  const teamTh = document.createElement("th");
  teamTh.textContent = "Team";
  teamTh.rowSpan = 3;
  rows[0].appendChild(teamTh);

  const monthGroups = groupBy(days, (day) => day.month);
  monthGroups.forEach((group) => {
    const monthTh = document.createElement("th");
    monthTh.className = "month-group";
    monthTh.colSpan = group.items.length;
    monthTh.textContent = `${MONTH_LABELS[group.key] || ""} ${year}`;
    rows[0].appendChild(monthTh);
  });

  monthGroups.forEach((group) => {
    const weekGroups = groupBy(group.items, (day) => `${day.isoYear}-${day.week}`);
    weekGroups.forEach((weekGroup) => {
      const weekTh = document.createElement("th");
      weekTh.colSpan = weekGroup.items.length;
      const label = `Week ${String(weekGroup.items[0].week).padStart(2, "0")}`;
      weekTh.textContent = weekGroup.items.some((d) => d.isoYear !== year)
        ? `${label} (${String(weekGroup.items[0].isoYear).slice(-2)})`
        : label;
      rows[1].appendChild(weekTh);
    });
  });

  days.forEach((day) => {
    const dayTh = document.createElement("th");
    dayTh.dataset.date = day.date;
    dayTh.textContent = `${day.weekday.toUpperCase()} ${day.label}`;
    if (day.weekend) dayTh.classList.add("is-weekend");
    rows[2].appendChild(dayTh);
  });

  return rows;
}

function groupBy(items, fn) {
  const map = new Map();
  items.forEach((item) => {
    const key = fn(item);
    let group = map.get(key);
    if (!group) {
      group = { key, items: [] };
      map.set(key, group);
    }
    group.items.push(item);
  });
  return Array.from(map.values());
}

export function handleLeaveMatrixInput(event) {
  const target = event.target;
  if (!target || !target.classList) return;
  if (target.classList.contains("leave-input")) {
    const raw = String(target.value || "");
    const hasValue = raw.trim() !== "" && Number(raw) > 0;
    const reason = target.parentElement ? target.parentElement.querySelector(".leave-reason") : null;
    if (reason) {
      reason.disabled = !hasValue;
      reason.classList.toggle("is-hidden", !hasValue);
    }
  }
}

export function handleLeaveMatrixChange(event) {
  const target = event.target;
  if (!target || !target.classList) return;
  if (target.classList.contains("leave-input")) {
    onLeaveHoursChange(target);
  } else if (target.classList.contains("leave-reason")) {
    onLeaveReasonChange(target);
  }
}

function onLeaveHoursChange(input) {
  const empIndex = Number(input.dataset.emp);
  const date = input.dataset.date;
  if (!Number.isFinite(empIndex) || !date) return;
  const employee = getEmployeeByIndex(empIndex);
  if (!employee) return;
  if (!employee.entries) employee.entries = {};
  const entries = employee.entries;
  const raw = String(input.value || "").trim();
  if (!raw) {
    delete entries[date];
    renderLeaveMatrix();
    return;
  }
  let hours = Number(raw);
  if (!Number.isFinite(hours) || hours <= 0) {
    delete entries[date];
    renderLeaveMatrix();
    return;
  }
  hours = clampHours(employee, hours);
  let entry = entries[date];
  if (!entry) entry = {};
  entry.hours = hours;
  const reasonSelect = input.parentElement ? input.parentElement.querySelector(".leave-reason") : null;
  const reasonValue = reasonSelect ? reasonSelect.value : "";
  if (reasonValue) {
    entry.type = reasonValue;
  } else if (!entry.type) {
    entry.type = LEAVE_TYPES[0].value;
  }
  entry.code = leaveCodeForType(entry.type);
  entries[date] = entry;
  renderLeaveMatrix();
}

function onLeaveReasonChange(select) {
  const empIndex = Number(select.dataset.emp);
  const date = select.dataset.date;
  if (!Number.isFinite(empIndex) || !date) return;
  const employee = getEmployeeByIndex(empIndex);
  if (!employee) return;
  if (!employee.entries) employee.entries = {};
  const entries = employee.entries;
  let entry = entries[date];
  const input = select.parentElement ? select.parentElement.querySelector(".leave-input") : null;
  const hours = input ? Number(input.value) : NaN;
  if (!entry) {
    if (Number.isFinite(hours) && hours > 0) {
      entry = { hours: clampHours(employee, hours) };
      entries[date] = entry;
    } else {
      return;
    }
  }
  entry.type = select.value || entry.type || LEAVE_TYPES[0].value;
  entry.code = leaveCodeForType(entry.type);
  if (Number.isFinite(hours) && hours > 0) {
    entry.hours = clampHours(employee, hours);
  }
  renderLeaveMatrix();
}

function getEmployeeByIndex(index) {
  const employees = state.leaveMatrix && Array.isArray(state.leaveMatrix.employees) ? state.leaveMatrix.employees : null;
  if (!employees) return null;
  return employees[index] || null;
}

function scrollLeaveMatrixToCurrentWeeks(container, table) {
  const headerRow = table.querySelector("thead tr:nth-child(3)");
  if (!headerRow) return;
  const headers = Array.from(headerRow.querySelectorAll("th[data-date]"));
  if (!headers.length) return;

  const today = todayUtc();
  const start = startOfISOWeek(today);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 13);

  const startKey = formatISODate(start);
  let startCell = headers.find((th) => th.dataset.date === startKey);
  if (!startCell) {
    const startTime = start.getTime();
    startCell = headers.find((th) => {
      const date = parseISODate(th.dataset.date);
      return date && date.getTime() >= startTime;
    });
  }
  if (!startCell) startCell = headers[0];

  const startIndex = headers.indexOf(startCell);
  const endKey = formatISODate(end);
  let endCell = headers.find((th) => th.dataset.date === endKey);
  if (!endCell) {
    const endTime = end.getTime();
    endCell = headers.find((th) => {
      const date = parseISODate(th.dataset.date);
      return date && date.getTime() > start.getTime() && date.getTime() <= endTime;
    });
  }
  if (!endCell) {
    const fallbackIndex = startIndex >= 0 ? Math.min(startIndex + 13, headers.length - 1) : headers.length - 1;
    endCell = headers[Math.max(0, fallbackIndex)];
  }

  const startLeft = startCell.offsetLeft;
  const endRight = endCell.offsetLeft + endCell.offsetWidth;
  const visibleWidth = container.clientWidth;
  const desiredWidth = endRight - startLeft;
  const margin = 20;
  let target = Math.max(0, startLeft - margin);

  if (desiredWidth > visibleWidth) {
    target = Math.max(0, Math.min(startLeft, endRight - visibleWidth + margin));
  }

  container.scrollLeft = target;
}

export function renderCapacityChart(yearOverride) {
  const host = document.getElementById("capacity-chart");
  if (!host) return;
  const year = Number.isFinite(Number(yearOverride)) ? Number(yearOverride) : Number(state.currentLeaveYear) || todayUtc().getUTCFullYear();
  if (!Number.isFinite(year)) {
    host.innerHTML = `<div class="capacity-chart__empty">Geen data beschikbaar.</div>`;
    host.removeAttribute("role");
    host.removeAttribute("aria-label");
    return;
  }

  const series = buildWeeklyCapacitySeries(year);
  if (!series.length) {
    host.innerHTML = `<div class="capacity-chart__empty">Geen data voor ${year}.</div>`;
    host.setAttribute("role", "img");
    host.setAttribute("aria-label", `Geen capaciteit of werkaanbod geregistreerd in ${year}.`);
    return;
  }

  const maxValue = Math.max(...series.map((item) => Math.max(item.capacity, item.workload)));
  if (!(maxValue > 0)) {
    host.innerHTML = `<div class="capacity-chart__empty">Geen geregistreerde uren voor ${year}.</div>`;
    host.setAttribute("role", "img");
    host.setAttribute("aria-label", `Geen geregistreerde uren voor ${year}.`);
    return;
  }

  host.innerHTML = buildCapacitySvg(series, maxValue);
  host.setAttribute("role", "img");
  host.setAttribute("aria-label", `Capaciteit en werkaanbod per week voor ${year}.`);
}

function buildLeaveDays(year) {
  if (!Number.isFinite(year)) return [];
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));
  const days = [];
  const cursor = new Date(start);
  while (cursor < end) {
    const current = new Date(cursor);
    const info = isoWeek(current);
    const weekdayIndex = current.getUTCDay();
    const monthIndex = current.getUTCMonth();
    days.push({
      date: formatISODate(current),
      label: String(current.getUTCDate()).padStart(2, "0"),
      weekday: WEEKDAY_LABELS[weekdayIndex] || "",
      week: info.week,
      isoYear: info.year,
      weekend: weekdayIndex === 0 || weekdayIndex === 6,
      month: monthIndex,
      monthLabel: MONTH_LABELS[monthIndex] || "",
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

function buildWeeklyCapacitySeries(year) {
  if (!Number.isFinite(year)) return [];
  const weekly = new Map();
  const leaveState = state.leaveMatrix || {};
  const employees = Array.isArray(leaveState.employees) ? leaveState.employees : [];
  const totalDailyCapacity = employees.reduce((sum, emp) => sum + workdayHours(emp), 0);
  const ensureEntry = (isoYear, week) => {
    const key = `${isoYear}-W${String(week).padStart(2, "0")}`;
    let entry = weekly.get(key);
    if (!entry) {
      entry = { week, year: isoYear, capacity: 0, workload: 0 };
      weekly.set(key, entry);
    }
    return entry;
  };

  const days = buildLeaveDays(year);
  days.forEach((day) => {
    const entry = ensureEntry(day.isoYear, day.week);
    if (!day.weekend && totalDailyCapacity > 0) {
      entry.capacity += totalDailyCapacity;
    }
    if (employees.length) {
      employees.forEach((emp) => {
        const entries = emp && emp.entries ? emp.entries : null;
        if (!entries) return;
        const original = entries[day.date];
        if (!original) return;
        const clone = { ...original };
        normaliseLeaveEntry(clone, emp);
        const hours = Number(clone.hours);
        if (Number.isFinite(hours) && hours > 0) {
          entry.capacity -= hours;
        }
      });
    }
  });

  const tasks = getTasksForChart();
  tasks.forEach((task) => {
    const dueDate = parseISODate(task.due_date);
    if (!dueDate) return;
    if (dueDate.getUTCFullYear() !== year) return;
    const info = isoWeek(dueDate);
    const entry = ensureEntry(info.year, info.week);
    const rawHours = Number.isFinite(task.safeHours) ? Number(task.safeHours) : safeHours(task.hours);
    if (rawHours > 0) {
      entry.workload += rawHours;
    }
  });

  const multiplier = chartCapacityMultiplier(totalDailyCapacity);
  return Array.from(weekly.values()).map((item) => {
    const scaledCapacity = Math.max(0, Math.round(Math.max(0, item.capacity) * multiplier * 4) / 4);
    const workloadValue = Math.max(0, Math.round(Math.max(0, item.workload) * 4) / 4);
    const baseLabel = `W${String(item.week).padStart(2, "0")}`;
    const label = item.year === year ? baseLabel : `${baseLabel} (${String(item.year).slice(-2)})`;
    return {
      week: item.week,
      year: item.year,
      capacity: scaledCapacity,
      workload: workloadValue,
      label,
    };
  });
}

function chartCapacityMultiplier(totalDailyCapacity) {
  const map = state.capacityByWorkshop || {};
  const configuredTotal = totalCapacity(map) || (Number.isFinite(state.defaultCapacity) ? Number(state.defaultCapacity) : 0);
  const baselineWeekly = totalDailyCapacity * 5;
  let baseScale = 1;
  if (baselineWeekly > 0 && configuredTotal > 0) {
    baseScale = configuredTotal / baselineWeekly;
  }
  let share = 1;
  const workshopFilter = state.filters && state.filters.workshop_id ? Number(state.filters.workshop_id) : NaN;
  if (Number.isFinite(workshopFilter) && configuredTotal > 0) {
    const value = Number(map[workshopFilter]);
    if (Number.isFinite(value) && value > 0) {
      share = value / configuredTotal;
    }
  }
  return baseScale * share;
}

function buildCapacitySvg(series, maxValue) {
  const viewWidth = 860;
  const viewHeight = 280;
  const padding = { top: 18, right: 24, bottom: 36, left: 56 };
  const innerWidth = Math.max(0, viewWidth - padding.left - padding.right);
  const innerHeight = Math.max(0, viewHeight - padding.top - padding.bottom);
  const step = series.length > 1 ? innerWidth / (series.length - 1) : 0;
  const baseY = padding.top + innerHeight;
  const pointX = (index) => {
    if (series.length <= 1) {
      return padding.left + innerWidth / 2;
    }
    return padding.left + step * index;
  };
  const pointY = (value) => {
    if (!(maxValue > 0)) return baseY;
    const ratio = Math.min(Math.max(value / maxValue, 0), 1);
    return padding.top + (1 - ratio) * innerHeight;
  };

  let workloadArea = "";
  let workloadLine = "";
  series.forEach((entry, index) => {
    const x = pointX(index);
    const y = pointY(entry.workload);
    if (index === 0) {
      workloadArea = `M ${x} ${y}`;
      workloadLine = `M ${x} ${y}`;
    } else {
      workloadArea += ` L ${x} ${y}`;
      workloadLine += ` L ${x} ${y}`;
    }
  });
  if (workloadArea) {
    const lastX = pointX(series.length - 1);
    const firstX = pointX(0);
    workloadArea += ` L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  }

  let capacityLine = "";
  series.forEach((entry, index) => {
    const x = pointX(index);
    const y = pointY(entry.capacity);
    capacityLine += index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });

  const ticks = buildYTicks(maxValue);
  const gridLines = ticks
    .map((tick) => {
      const y = pointY(tick);
      return `<line x1="${padding.left}" y1="${y}" x2="${padding.left + innerWidth}" y2="${y}" class="capacity-chart__grid" />`;
    })
    .join("\n");
  const yLabels = ticks
    .map((tick) => {
      const y = pointY(tick);
      return `<text x="${padding.left - 10}" y="${y + 4}" class="capacity-chart__tick" text-anchor="end">${formatChartNumber(tick)}</text>`;
    })
    .join("\n");

  const labelEvery = Math.max(1, Math.round(series.length / 8));
  const xLabels = series
    .map((entry, index) => {
      if (index !== 0 && index !== series.length - 1 && index % labelEvery !== 0) return "";
      const x = pointX(index);
      return `<text x="${x}" y="${baseY + 18}" class="capacity-chart__tick" text-anchor="middle">${entry.label}</text>`;
    })
    .filter(Boolean)
    .join("\n");

  const markers = series
    .map((entry, index) => {
      const x = pointX(index);
      const workloadY = pointY(entry.workload);
      const capacityY = pointY(entry.capacity);
      return `<circle cx="${x}" cy="${workloadY}" r="2.8" class="capacity-chart__dot workload" />\n      <circle cx="${x}" cy="${capacityY}" r="2.8" class="capacity-chart__dot capacity" />`;
    })
    .join("\n      ");

  return `<svg viewBox="0 0 ${viewWidth} ${viewHeight}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="chart-workload-fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--ok)" stop-opacity="0.35" />
      <stop offset="100%" stop-color="var(--ok)" stop-opacity="0" />
    </linearGradient>
  </defs>
  <g>
${gridLines}
  </g>
  <path d="${workloadArea}" fill="url(#chart-workload-fill)" />
  <path d="${workloadLine}" fill="none" stroke="var(--ok)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
  <path d="${capacityLine}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
  <g>
${markers}
  </g>
  <line x1="${padding.left}" y1="${baseY}" x2="${padding.left + innerWidth}" y2="${baseY}" stroke="var(--stroke)" stroke-width="1" />
  <g>
${yLabels}
${xLabels}
  </g>
</svg>`;
}

function buildYTicks(maxValue) {
  if (!(maxValue > 0)) return [];
  const roughStep = maxValue / 4;
  const step = niceStep(roughStep);
  if (!(step > 0)) return [];
  const ticks = [];
  for (let value = 0; value <= maxValue + step * 0.5; value += step) {
    ticks.push(Math.round(value));
  }
  return [...new Set(ticks)].filter((val) => val >= 0).sort((a, b) => a - b);
}

function niceStep(value) {
  if (!(value > 0)) return 0;
  const exponent = Math.floor(Math.log10(value));
  const base = Math.pow(10, exponent);
  const fraction = value / base;
  let niceFraction;
  if (fraction <= 1) niceFraction = 1;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 5) niceFraction = 5;
  else niceFraction = 10;
  return niceFraction * base;
}

function formatChartNumber(value) {
  return NUMBER_FORMATTER.format(Math.round(value));
}

function escapeName(value) {
  return String(value || "").replace(/[&<>]/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
  }[c]));
}

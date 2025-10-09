import { state } from "./state.js";
import { getFilteredTasks } from "./data.js";
import { renderLeaveMatrix } from "./leave.js";
import {
  escapeHtml,
  formatHoursValue,
  safeHours,
  isDone,
  currentCapacity,
  todayUtc,
  parseISODate,
  formatWeekLabel,
  workshopName,
  debounce,
} from "./utils.js";

export function fillFilters() {
  const workshopSelect = document.getElementById("f-workshop");
  if (workshopSelect) {
    workshopSelect.innerHTML = '<option value="">Alle vestigingen</option>' +
      state.workshops.map((w) => `<option value="${w.id}">${escapeHtml(w.name)}</option>`).join('');
    workshopSelect.addEventListener("change", (event) => {
      state.filters.workshop_id = event.target.value;
      renderAll();
    });
  }

  const weekInput = document.getElementById("f-week");
  if (weekInput) {
    weekInput.addEventListener("change", (event) => {
      state.filters.week = event.target.value;
      renderAll();
    });
  }

  const skillInput = document.getElementById("f-skill");
  if (skillInput) {
    const handleSkillChange = debounce((value) => {
      state.filters.skill = value;
      renderAll();
    }, 200);
    skillInput.addEventListener("input", (event) => {
      handleSkillChange(event.target.value);
    });
  }

  const yearSelect = document.getElementById("f-year");
  if (yearSelect) {
    const years = Array.isArray(state.leaveMatrix?.years) ? [...state.leaveMatrix.years].sort((a, b) => a - b) : [];
    const fallbackYear = todayUtc().getUTCFullYear();
    const options = years.length ? years : [fallbackYear];
    yearSelect.innerHTML = options.map((y) => `<option value="${y}">${y}</option>`).join('');
    const currentYear = options.includes(state.currentLeaveYear) ? state.currentLeaveYear : options[options.length - 1];
    state.currentLeaveYear = currentYear;
    state.leaveMatrixScrollYear = null;
    yearSelect.value = String(currentYear);
    yearSelect.addEventListener("change", (event) => {
      const value = Number(event.target.value);
      if (Number.isFinite(value)) {
        state.currentLeaveYear = value;
        state.leaveMatrixScrollYear = null;
        renderLeaveMatrix();
      }
    });
  }

  const drawerSelect = document.getElementById("t-ws");
  if (drawerSelect) {
    drawerSelect.innerHTML = state.workshops.map((w) => `<option value="${w.id}">${escapeHtml(w.name)}</option>`).join('');
  }
}

export function renderAll() {
  const tasks = getFilteredTasks();
  renderChips();
  renderKPIs(tasks);
  renderHeroStats(tasks);
  renderBoard(tasks);
  renderTable(tasks);
  renderLeaveMatrix();
  setTab(state.tab);
}

export function setTab(tab) {
  state.tab = tab;
  document.querySelectorAll(".tab").forEach((element) => {
    const isActive = element.dataset.tab === tab;
    element.classList.toggle("active", isActive);
    element.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  const board = document.getElementById("view-board");
  const table = document.getElementById("view-table");
  const insights = document.getElementById("view-insights");
  if (board) board.hidden = tab !== "board";
  if (table) table.hidden = tab !== "table";
  if (insights) insights.hidden = tab !== "insights";
}

function renderChips() {
  const container = document.getElementById("chips");
  if (!container) return;
  const chips = [];
  if (state.filters.workshop_id) {
    const workshop = state.workshops.find((item) => item.id === Number(state.filters.workshop_id));
    chips.push(createChip(`Vestiging: ${workshop?.name || "?"}`, () => {
      state.filters.workshop_id = "";
      const select = document.getElementById("f-workshop");
      if (select) select.value = "";
      renderAll();
    }));
  }
  if (state.filters.week) {
    chips.push(createChip(`Week: ${formatWeekLabel(state.filters.week)}`, () => {
      state.filters.week = "";
      const input = document.getElementById("f-week");
      if (input) input.value = "";
      renderAll();
    }));
  }
  const skillFilter = state.filters.skill ? state.filters.skill.trim() : "";
  if (skillFilter) {
    chips.push(createChip(`Skill: ${skillFilter}`, () => {
      state.filters.skill = "";
      const input = document.getElementById("f-skill");
      if (input) input.value = "";
      renderAll();
    }));
  }
  container.innerHTML = "";
  chips.forEach((chipElement) => container.appendChild(chipElement));
}

function createChip(text, onClose) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chip";
  button.innerHTML = `<span class="chip-label">${escapeHtml(text)}</span><span aria-hidden="true">✕</span>`;
  button.setAttribute("aria-label", `${text} verwijderen`);
  button.addEventListener("click", onClose);
  return button;
}

function renderKPIs(tasks) {
  const capacity = currentCapacity();
  const totalHours = tasks.reduce((sum, task) => {
    const value = Number.isFinite(task.safeHours) ? task.safeHours : safeHours(task.hours);
    return sum + value;
  }, 0);
  const plannedHours = tasks.reduce((sum, task) => {
    if (isDone(task.status)) return sum;
    const value = Number.isFinite(task.safeHours) ? task.safeHours : safeHours(task.hours);
    return sum + value;
  }, 0);
  const utilisation = capacity > 0 ? Math.min(100, Math.round((plannedHours / capacity) * 100)) : 0;
  const backlog = capacity > 0 ? Math.max(0, totalHours - capacity) : totalHours;

  setText("kpi-cap", capacity);
  setText("kpi-load", plannedHours);
  setText("kpi-util", `${utilisation}%`);
  setText("kpi-backlog", backlog);
}

function renderHeroStats(tasks) {
  const today = todayUtc();
  const info = tasks.reduce((acc, task) => {
    const due = task.dueDate || parseISODate(task.due_date);
    const done = isDone(task.status);
    const hasCoreData = Boolean(task.title && due && task.skill);
    if (hasCoreData) acc.completeData += 1;
    if (!done) acc.open += 1;
    if (!done && due) {
      const delta = Math.ceil((due - today) / (24 * 60 * 60 * 1000));
      if (delta < 0) acc.overdue += 1;
      if (delta >= 0 && delta <= 7) acc.atRisk += 1;
    }
    return acc;
  }, { open: 0, overdue: 0, atRisk: 0, completeData: 0 });
  const quality = tasks.length ? Math.round(Math.min(1, info.completeData / tasks.length) * 100) : 100;

  setText("kpi-ok", `${quality}%`);
  setText("kpi-sla", info.atRisk);
  setText("kpi-open", info.open);
  setText("kpi-late", info.overdue);
}

function renderBoard(tasks) {
  const container = document.getElementById("board-grid");
  if (!container) return;
  container.innerHTML = "";
  tasks.forEach((task) => {
    const hoursLabel = formatHoursValue(Number.isFinite(task.safeHours) ? task.safeHours : safeHours(task.hours));
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="top">
        <span class="badge prio">${escapeHtml(task.priority)}</span>
        <span class="badge skill">${escapeHtml(task.skill || "—")}</span>
        <span class="badge hours">${escapeHtml(hoursLabel || "0")}h</span>
      </div>
      <h4>${escapeHtml(task.title)}</h4>
      <div class="sub">Due ${escapeHtml(task.due_date || "—")} • ${escapeHtml(workshopName(task.workshop_id))}</div>
      <div class="row">
        <span class="badge">${escapeHtml(task.status || "Open")}</span>
        <div>
          <button class="btn small secondary" onclick="editTask('${task.id}')">Bewerk</button>
          <button class="btn small" onclick="toast('Gepland op beste lane (demo)')">Plan</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderTable(tasks) {
  const tbody = document.getElementById("tbody");
  if (!tbody) return;
  tbody.innerHTML = tasks
    .map((task) => {
      const hoursLabel = formatHoursValue(Number.isFinite(task.safeHours) ? task.safeHours : safeHours(task.hours));
      const cells = [
        { label: "Order", value: escapeHtml(String(task.id)) },
        { label: "Taak", value: escapeHtml(task.title || "—") },
        { label: "Vestiging", value: escapeHtml(workshopName(task.workshop_id)) },
        { label: "Skill", value: escapeHtml(task.skill || "—") },
        { label: "Uren", value: escapeHtml(hoursLabel || "0") },
        { label: "Deadline", value: escapeHtml(task.due_date || "—") },
        { label: "Prioriteit", value: escapeHtml(task.priority || "—") },
        { label: "Status", value: escapeHtml(task.status || "—") },
      ];
      return `
        <tr>
          ${cells.map((cell) => `<td data-label="${cell.label}">${cell.value}</td>`).join("")}
        </tr>
      `;
    })
    .join('');
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

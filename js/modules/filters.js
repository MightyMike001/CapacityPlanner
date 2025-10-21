import { state } from "../state.js";
import {
  escapeHtml,
  formatWeekLabel,
  todayUtc,
  debounce,
} from "../utils.js";

function handleFiltersChange(callback) {
  if (typeof callback === "function") {
    callback();
  }
}

export function setupFilters({ onFiltersChange, onYearChange }) {
  const workshopSelect = document.getElementById("f-workshop");
  if (workshopSelect) {
    workshopSelect.innerHTML =
      '<option value="">Alle vestigingen</option>' +
      state.workshops
        .map((workshop) => `<option value="${workshop.id}">${escapeHtml(workshop.name)}</option>`)
        .join("");
    workshopSelect.addEventListener("change", (event) => {
      state.filters.workshop_id = event.target.value;
      handleFiltersChange(onFiltersChange);
    });
  }

  const weekInput = document.getElementById("f-week");
  if (weekInput) {
    weekInput.addEventListener("change", (event) => {
      state.filters.week = event.target.value;
      handleFiltersChange(onFiltersChange);
    });
  }

  const skillInput = document.getElementById("f-skill");
  if (skillInput) {
    const handleSkillChange = debounce((value) => {
      state.filters.skill = value;
      handleFiltersChange(onFiltersChange);
    }, 200);
    skillInput.addEventListener("input", (event) => {
      handleSkillChange(event.target.value);
    });
  }

  const yearSelect = document.getElementById("f-year");
  if (yearSelect) {
    const matrix = state.leaveMatrix || {};
    const years = Array.isArray(matrix.years) ? [...matrix.years].sort((a, b) => a - b) : [];
    const fallbackYear = todayUtc().getUTCFullYear();
    const options = years.length ? years : [fallbackYear];
    yearSelect.innerHTML = options.map((year) => `<option value="${year}">${year}</option>`).join("");

    const initialYear = options.includes(state.currentLeaveYear)
      ? state.currentLeaveYear
      : options[options.length - 1];
    state.currentLeaveYear = initialYear;
    state.leaveMatrixScrollYear = null;
    yearSelect.value = String(initialYear);

    yearSelect.addEventListener("change", (event) => {
      const value = Number(event.target.value);
      if (Number.isFinite(value)) {
        state.currentLeaveYear = value;
        state.leaveMatrixScrollYear = null;
        if (typeof onYearChange === "function") {
          onYearChange(value);
        }
      }
    });
  }

  const drawerSelect = document.getElementById("t-ws");
  if (drawerSelect) {
    drawerSelect.innerHTML = state.workshops
      .map((workshop) => `<option value="${workshop.id}">${escapeHtml(workshop.name)}</option>`)
      .join("");
  }
}

export function renderFilterChips(onFiltersChange) {
  const container = document.getElementById("chips");
  if (!container) return;

  const chips = [];
  if (state.filters.workshop_id) {
    const workshopId = Number(state.filters.workshop_id);
    const workshop = state.workshops.find((item) => item.id === workshopId);
    chips.push(
      createChip(`Vestiging: ${workshop?.name || "?"}`, () => {
        state.filters.workshop_id = "";
        const select = document.getElementById("f-workshop");
        if (select) select.value = "";
        handleFiltersChange(onFiltersChange);
      })
    );
  }

  if (state.filters.week) {
    chips.push(
      createChip(`Week: ${formatWeekLabel(state.filters.week)}`, () => {
        state.filters.week = "";
        const input = document.getElementById("f-week");
        if (input) input.value = "";
        handleFiltersChange(onFiltersChange);
      })
    );
  }

  const skillFilter = state.filters.skill ? state.filters.skill.trim() : "";
  if (skillFilter) {
    chips.push(
      createChip(`Skill: ${skillFilter}`, () => {
        state.filters.skill = "";
        const input = document.getElementById("f-skill");
        if (input) input.value = "";
        handleFiltersChange(onFiltersChange);
      })
    );
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
  button.addEventListener("click", () => {
    if (typeof onClose === "function") onClose();
  });
  return button;
}

import { state } from "./state.js";
import { getFilteredTasks } from "./data.js";
import { renderLeaveMatrix } from "./leave.js";
import { setupFilters, renderFilterChips } from "./modules/filters.js";
import { renderDashboard } from "./modules/dashboard.js";
import { renderBoard } from "./modules/board.js";
import { renderTable } from "./modules/table.js";
import { setActiveTab } from "./modules/tabs.js";

export function fillFilters() {
  setupFilters({
    onFiltersChange: renderAll,
    onYearChange: () => renderLeaveMatrix(),
  });
}

export function renderAll() {
  const tasks = getFilteredTasks();
  renderFilterChips(renderAll);
  renderDashboard(tasks);
  renderBoard(tasks);
  renderTable(tasks);
  renderLeaveMatrix();
  setActiveTab(state.tab);
}

export function setTab(tab) {
  setActiveTab(tab);
}

import { state } from "../state.js";

export function setActiveTab(tab) {
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

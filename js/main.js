import { fillFilters, renderAll, setTab } from "./render.js";
import {
  handleLeaveMatrixChange,
  handleLeaveMatrixInput,
} from "./leave.js";
import {
  openDrawer,
  closeDrawer,
  openModal,
  closeModal,
  toast,
  saveTask,
  clearTask,
  editTask,
  exportCSV,
  handleImport,
  resetFilters,
} from "./actions.js";

window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;
window.openModal = openModal;
window.closeModal = closeModal;
window.toast = toast;
window.saveTask = saveTask;
window.clearTask = clearTask;
window.editTask = editTask;
window.setTab = setTab;

const THEME_KEY = "planner-theme";

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", theme);

  const button = document.getElementById("btn-theme");
  if (button) {
    const icon = button.querySelector(".icon");
    const label = button.querySelector(".label");
    if (icon) icon.textContent = nextTheme === "light" ? "☀️" : "🌙";
    if (label) label.textContent = `${nextTheme === "light" ? "Licht" : "Donker"} thema`;
    button.setAttribute(
      "aria-label",
      `Schakel naar ${nextTheme === "light" ? "licht" : "donker"} thema`
    );
  }
}

function initThemeToggle() {
  let storedTheme = null;
  try {
    storedTheme = localStorage.getItem(THEME_KEY);
  } catch (error) {
    console.warn("Kon thema voorkeur niet laden", error);
  }
  const safeStoredTheme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : null;
  const prefersLight = window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: light)").matches
    : false;
  const initialTheme = safeStoredTheme ?? (prefersLight ? "light" : "dark");
  applyTheme(initialTheme);

  const button = document.getElementById("btn-theme");
  if (!button) return;

  button.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (error) {
      console.warn("Kon thema niet opslaan", error);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  fillFilters();
  renderAll();

  initThemeToggle();

  const resetButton = document.getElementById("btn-reset");
  if (resetButton) resetButton.addEventListener("click", resetFilters);

  const exportButton = document.getElementById("btn-export");
  if (exportButton) exportButton.addEventListener("click", exportCSV);

  const importButton = document.getElementById("btn-import");
  if (importButton) {
    importButton.addEventListener("click", () => {
      const fileInput = document.getElementById("file");
      fileInput?.click();
    });
  }

  const fileInput = document.getElementById("file");
  if (fileInput) fileInput.addEventListener("change", handleImport);

  const leaveHost = document.getElementById("leave-matrix");
  if (leaveHost) {
    leaveHost.addEventListener("change", handleLeaveMatrixChange);
    leaveHost.addEventListener("input", handleLeaveMatrixInput);
  }
});

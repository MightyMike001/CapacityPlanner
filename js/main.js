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

document.addEventListener("DOMContentLoaded", () => {
  fillFilters();
  renderAll();

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

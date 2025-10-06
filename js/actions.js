import {
  state,
  invalidateFilteredTasks,
} from "./state.js";
import { renderAll } from "./render.js";
import { getFilteredTasks } from "./data.js";
import { workshopName } from "./utils.js";

export function openDrawer() {
  const drawer = document.getElementById("drawer");
  if (drawer) drawer.classList.add("open");
}

export function closeDrawer() {
  const drawer = document.getElementById("drawer");
  if (drawer) drawer.classList.remove("open");
}

export function openModal(id) {
  const modal = document.getElementById(`modal-${id}`);
  if (modal) modal.classList.add("show");
}

export function closeModal(id) {
  const modal = document.getElementById(`modal-${id}`);
  if (modal) modal.classList.remove("show");
}

export function toast(message) {
  const element = document.getElementById("toast");
  if (!element) return;
  element.textContent = message;
  element.classList.add("show");
  setTimeout(() => element.classList.remove("show"), 1600);
}

export function saveTask() {
  const task = {
    id: "O-" + Math.floor(10000 + Math.random() * 90000),
    title: (document.getElementById("t-title")?.value || "").trim() || "Nieuwe taak",
    workshop_id: Number(document.getElementById("t-ws")?.value || 1),
    skill: (document.getElementById("t-skill")?.value || "").trim(),
    hours: Number(document.getElementById("t-hours")?.value || 0),
    due_date: document.getElementById("t-due")?.value || "",
    priority: document.getElementById("t-prio")?.value || "Normaal",
    status: document.getElementById("t-status")?.value || "Open",
  };
  state.tasks.unshift(task);
  state.tasksVersion += 1;
  invalidateFilteredTasks();
  renderAll();
  closeDrawer();
  toast("Taak opgeslagen");
  clearTask();
}

export function clearTask() {
  ["t-title", "t-skill", "t-hours", "t-due"].forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.value = "";
  });
  const prio = document.getElementById("t-prio");
  if (prio) prio.value = "Normaal";
  const status = document.getElementById("t-status");
  if (status) status.value = "Open";
  const workshop = document.getElementById("t-ws");
  if (workshop && state.workshops.length) {
    workshop.value = state.workshops[0].id;
  }
}

export function editTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;
  openDrawer();
  const title = document.getElementById("t-title");
  if (title) title.value = task.title;
  const workshop = document.getElementById("t-ws");
  if (workshop) workshop.value = task.workshop_id;
  const skill = document.getElementById("t-skill");
  if (skill) skill.value = task.skill || "";
  const hours = document.getElementById("t-hours");
  if (hours) hours.value = task.hours || 0;
  const due = document.getElementById("t-due");
  if (due) due.value = task.due_date || "";
  const prio = document.getElementById("t-prio");
  if (prio) prio.value = task.priority || "Normaal";
  const status = document.getElementById("t-status");
  if (status) status.value = task.status || "Open";
}

export function exportCSV() {
  const rows = [["Order", "Titel", "Vestiging", "Skill", "Uren", "Deadline", "Prioriteit", "Status"]];
  const tasks = getFilteredTasks();
  tasks.forEach((task) => {
    rows.push([
      task.id,
      task.title,
      workshopName(task.workshop_id),
      task.skill || "",
      (Number.isFinite(task.safeHours) ? task.safeHours : task.hours) || 0,
      task.due_date || "",
      task.priority || "",
      task.status || "",
    ]);
  });
  const csv = rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "planning_export.csv";
  anchor.click();
  URL.revokeObjectURL(url);
  toast("Export gereed");
}

export async function handleImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      state.tasks = data;
      state.tasksVersion += 1;
      invalidateFilteredTasks();
      renderAll();
      toast("JSON geïmporteerd");
      return;
    }
  } catch (error) {
    // ignore and show fallback toast below
  }
  toast("Ondersteund nu JSON array (taken). CSV/XLSX mapping kan worden toegevoegd.");
}

export function resetFilters() {
  state.filters = { workshop_id: "", week: "", skill: "" };
  const workshop = document.getElementById("f-workshop");
  if (workshop) workshop.value = "";
  const week = document.getElementById("f-week");
  if (week) week.value = "";
  const skill = document.getElementById("f-skill");
  if (skill) skill.value = "";
  renderAll();
}

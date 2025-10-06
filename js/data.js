import {
  state,
  filteredTasksCache,
  setFilteredTasksCache,
} from "./state.js";
import { parseISODate, isoWeek, safeHours } from "./utils.js";

export function getFilteredTasks() {
  const filters = state.filters || {};
  const skillTerm = filters.skill ? filters.skill.trim().toLowerCase() : "";
  const workshopFilter = filters.workshop_id ? Number(filters.workshop_id) : null;
  const useWorkshopFilter = Number.isFinite(workshopFilter);
  const signature = [
    state.tasksVersion,
    state.tasks.length,
    useWorkshopFilter ? workshopFilter : "",
    filters.week || "",
    skillTerm,
  ].join("|");
  if (filteredTasksCache.signature === signature) {
    return filteredTasksCache.value;
  }

  const selectedWeekDate = parseISODate(filters.week);
  const selectedWeekInfo = selectedWeekDate ? isoWeek(selectedWeekDate) : null;
  const items = [];

  for (const task of state.tasks) {
    if (useWorkshopFilter && Number(task.workshop_id) !== workshopFilter) continue;
    if (skillTerm) {
      const skillValue = String(task.skill || "").toLowerCase();
      if (!skillValue.includes(skillTerm)) continue;
    }
    const dueDate = parseISODate(task.due_date);
    if (selectedWeekInfo) {
      if (!dueDate) continue;
      const dueWeek = isoWeek(dueDate);
      if (dueWeek.year !== selectedWeekInfo.year || dueWeek.week !== selectedWeekInfo.week) continue;
    }
    const safe = safeHours(task.hours);
    items.push({
      ...task,
      dueDate,
      safeHours: safe,
    });
  }

  items.sort((a, b) => {
    const pr = prioRank(a.priority) - prioRank(b.priority);
    if (pr !== 0) return pr;
    if (a.dueDate && b.dueDate) {
      if (a.dueDate < b.dueDate) return -1;
      if (a.dueDate > b.dueDate) return 1;
    } else if (a.dueDate) {
      return -1;
    } else if (b.dueDate) {
      return 1;
    }
    const diff = b.safeHours - a.safeHours;
    if (diff !== 0) return diff;
    return String(a.title || "").localeCompare(String(b.title || ""), "nl", { sensitivity: "base" });
  });

  setFilteredTasksCache(signature, items);
  return items;
}

export function getTasksForChart() {
  const filters = state.filters || {};
  const skillTerm = filters.skill ? filters.skill.trim().toLowerCase() : "";
  const workshopFilter = filters.workshop_id ? Number(filters.workshop_id) : null;
  const useWorkshopFilter = Number.isFinite(workshopFilter);
  const items = [];
  for (const task of state.tasks) {
    if (useWorkshopFilter && Number(task.workshop_id) !== workshopFilter) continue;
    if (skillTerm) {
      const skillValue = String(task.skill || "").toLowerCase();
      if (!skillValue.includes(skillTerm)) continue;
    }
    items.push(task);
  }
  return items;
}

function prioRank(p) {
  return p === "Hoog" ? 0 : p === "Normaal" ? 1 : 2;
}

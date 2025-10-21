import { currentCapacity, safeHours, isDone, todayUtc, parseISODate } from "../utils.js";

export function renderDashboard(tasks) {
  renderKPIs(tasks);
  renderHeroStats(tasks);
}

function renderKPIs(tasks) {
  const capacity = currentCapacity();
  const totals = tasks.reduce(
    (acc, task) => {
      const value = Number.isFinite(task.safeHours) ? task.safeHours : safeHours(task.hours);
      acc.total += value;
      if (!isDone(task.status)) {
        acc.planned += value;
      }
      return acc;
    },
    { total: 0, planned: 0 }
  );

  const utilisation = capacity > 0 ? Math.min(100, Math.round((totals.planned / capacity) * 100)) : 0;
  const backlog = capacity > 0 ? Math.max(0, totals.total - capacity) : totals.total;

  setText("kpi-cap", capacity);
  setText("kpi-load", totals.planned);
  setText("kpi-util", `${utilisation}%`);
  setText("kpi-backlog", backlog);
}

function renderHeroStats(tasks) {
  const today = todayUtc();
  const info = tasks.reduce(
    (acc, task) => {
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
    },
    { open: 0, overdue: 0, atRisk: 0, completeData: 0 }
  );

  const quality = tasks.length ? Math.round(Math.min(1, info.completeData / tasks.length) * 100) : 100;

  setText("kpi-ok", `${quality}%`);
  setText("kpi-sla", info.atRisk);
  setText("kpi-open", info.open);
  setText("kpi-late", info.overdue);
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

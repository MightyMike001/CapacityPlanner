import { escapeHtml, formatHoursValue, safeHours, workshopName } from "../utils.js";

export function renderBoard(tasks) {
  const container = document.getElementById("board-grid");
  if (!container) return;

  container.innerHTML = "";
  tasks.forEach((task) => {
    const hoursValue = Number.isFinite(task.safeHours) ? task.safeHours : safeHours(task.hours);
    const hoursLabel = formatHoursValue(hoursValue);

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

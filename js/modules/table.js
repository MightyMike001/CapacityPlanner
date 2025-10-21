import { escapeHtml, formatHoursValue, safeHours, workshopName } from "../utils.js";

export function renderTable(tasks) {
  const tbody = document.getElementById("tbody");
  if (!tbody) return;

  tbody.innerHTML = tasks
    .map((task) => {
      const hoursValue = Number.isFinite(task.safeHours) ? task.safeHours : safeHours(task.hours);
      const hoursLabel = formatHoursValue(hoursValue);
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
    .join("");
}

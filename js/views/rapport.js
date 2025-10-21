import { getState } from "../state.js";
import { isoWeeksInYear } from "../utils/date.js";
import { average, formatNumber } from "../utils/number.js";
import { calcWeekTotals } from "../calculations.js";

let chartInstance;

export function viewRapport() {
  const { werkplaats } = getState();
  const year = new Date().getFullYear();
  const weeks = Array.from({ length: isoWeeksInYear(year) }, (_, index) => index + 1);
  const series = weeks.map((week) => calcWeekTotals(werkplaats, year, week));
  const productive = series.map((item) => item.productive);
  const indirect = series.map((item) => item.indirect);

  requestAnimationFrame(() => buildChart(weeks, productive, indirect));

  const header = `
    <div class="row wrap" style="justify-content:space-between; align-items:center">
      <h3>Beschikbare uren per week · ${werkplaats} · ${year}</h3>
      <button class="btn ghost" id="rebuildChart">Herladen</button>
    </div>
  `;

  const summary = `
    <div class="card legend">
      <span class="chip">Gem. productief: <b>${formatNumber(average(productive))}</b> u/week</span>
      <span class="chip">Gem. indirect: <b>${formatNumber(average(indirect))}</b> u/week</span>
      <span class="chip">Totaal gemiddeld: <b>${formatNumber(average(productive) + average(indirect))}</b> u/week</span>
    </div>
  `;

  return `
    <section class="stack">
      ${header}
      <div class="card"><canvas id="chart" height="120"></canvas></div>
      ${summary}
    </section>
  `;
}

export function buildChart(weeks, productive, indirect) {
  const canvas = document.getElementById("chart");
  if (!canvas || typeof Chart === "undefined") {
    return;
  }
  if (chartInstance) {
    chartInstance.destroy();
  }
  chartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels: weeks,
      datasets: [
        { label: "Productief (u)", data: productive, tension: 0.35 },
        { label: "Indirect (u)", data: indirect, tension: 0.35 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: "white" } } },
      scales: {
        x: { ticks: { color: "#cbd5e1" }, grid: { color: "rgba(255,255,255,.08)" } },
        y: {
          ticks: { color: "#cbd5e1" },
          grid: { color: "rgba(255,255,255,.08)" },
          beginAtZero: true,
        },
      },
    },
  });
}

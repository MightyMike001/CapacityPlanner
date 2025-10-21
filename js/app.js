import { addDays, isoMonday, weekDays } from "./utils/date.js";
import { download, uploadJSON } from "./utils/io.js";
import { viewPlanning } from "./views/planning.js";
import { viewTeam } from "./views/team.js";
import { viewRapport } from "./views/rapport.js";
import { initDayMenu, openDayMenu } from "./menu/dayMenu.js";
import { runTests } from "./tests.js";
import {
  addEmployee,
  exportState,
  generateId,
  getState,
  importState,
  removeEmployee,
  resetState,
  setWerkplaats,
  updateEmployee,
} from "./state.js";

let currentWeekBase = new Date();
const app = document.getElementById("app");
const tabs = document.querySelectorAll(".tab");
const werkplaatsSelect = document.getElementById("werkplaatsSelect");

initDayMenu(() => render());

if (werkplaatsSelect) {
  werkplaatsSelect.value = getState().werkplaats;
  werkplaatsSelect.addEventListener("change", (event) => {
    setWerkplaats(event.target.value);
    render();
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    if (tab.dataset.route) {
      location.hash = tab.dataset.route;
    }
  });
});

window.addEventListener("hashchange", render);

app.addEventListener("click", async (event) => {
  const target = event.target;
  if (target.id === "prevWeek") {
    currentWeekBase = addDays(isoMonday(currentWeekBase), -7);
    render();
  } else if (target.id === "nextWeek") {
    currentWeekBase = addDays(isoMonday(currentWeekBase), 7);
    render();
  } else if (target.id === "exportBtn") {
    download(`verlofplanner_${Date.now()}.json`, exportState());
  } else if (target.id === "importBtn") {
    await doImportFile();
  } else if (target.id === "exportBtn2") {
    const area = document.getElementById("ioArea");
    if (area) {
      area.value = exportState();
    }
  } else if (target.id === "importBtn2") {
    const area = document.getElementById("ioArea");
    if (area) {
      try {
        importState(area.value);
        render();
      } catch (error) {
        alert("JSON ongeldig");
      }
    }
  } else if (target.id === "resetBtn") {
    resetState();
    render();
  } else if (target.id === "addEmp") {
    const { werkplaats } = getState();
    addEmployee({ id: generateId(), naam: "Nieuwe medewerker", rol: "Technicus", werkplaats, urenPerDag: 8 });
    render();
  } else if (target.id === "rebuildChart") {
    render();
  } else if (target.dataset.action === "delEmp") {
    removeEmployee(target.dataset.id);
    render();
  } else {
    const cell = target.closest(".daycell");
    if (cell) {
      openDayMenu(cell);
    }
  }
});

app.addEventListener("change", (event) => {
  const target = event.target;
  if (target.matches("[data-field]")) {
    const employeeId = target.dataset.emp;
    const field = target.dataset.field;
    let value = target.value;
    if (field === "urenPerDag") {
      value = Number(value) || 8;
    }
    updateEmployee(employeeId, { [field]: value });
  }
});

async function doImportFile() {
  try {
    const text = await uploadJSON();
    importState(text);
    render();
  } catch (error) {
    if (error) {
      console.warn("Import geannuleerd of mislukt", error.message);
    }
  }
}

function render() {
  const state = getState();
  if (werkplaatsSelect && werkplaatsSelect.value !== state.werkplaats) {
    werkplaatsSelect.value = state.werkplaats;
  }
  const route = location.hash || "#planning";
  tabs.forEach((tab) => {
    tab.setAttribute("aria-selected", tab.dataset.route === route ? "true" : "false");
  });
  if (route === "#team") {
    app.innerHTML = viewTeam();
    return;
  }
  if (route === "#rapport") {
    app.innerHTML = viewRapport();
    return;
  }
  const days = weekDays(currentWeekBase);
  app.innerHTML = viewPlanning(days);
}

try {
  runTests();
} catch (error) {
  console.warn("Tests melden een probleem:", error.message);
}

render();

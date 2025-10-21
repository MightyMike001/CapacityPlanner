import { ROLES } from "../constants.js";
import { employeesOf, getState } from "../state.js";

export function viewTeam() {
  const { werkplaats } = getState();
  const employees = employeesOf(werkplaats);
  const roles = Object.keys(ROLES);

  return `
    <section class="grid cols-2">
      <div class="stack">
        <div class="row wrap" style="justify-content:space-between; align-items:center">
          <h3>Team · ${werkplaats}</h3>
          <button class="btn primary" id="addEmp">+ Medewerker</button>
        </div>
        <div class="card">
          <table class="table">
            <thead>
              <tr><th>Naam</th><th>Rol</th><th>Daguren</th><th></th></tr>
            </thead>
            <tbody>
              ${employees
                .map(
                  (employee) => `
                    <tr>
                      <td><input data-emp="${employee.id}" data-field="naam" value="${employee.naam}"></td>
                      <td>
                        <select data-emp="${employee.id}" data-field="rol">
                          ${roles
                            .map((role) => `<option ${employee.rol === role ? "selected" : ""}>${role}</option>`)
                            .join("")}
                        </select>
                      </td>
                      <td style="max-width:120px"><input type="number" min="1" max="12" step="0.5" data-emp="${employee.id}" data-field="urenPerDag" value="${employee.urenPerDag}"></td>
                      <td style="width:120px; text-align:right">
                        <button class="btn danger" data-action="delEmp" data-id="${employee.id}">Verwijder</button>
                      </td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
      <div class="stack">
        <h3>Data</h3>
        <div class="card stack">
          <div class="mini">Export/Import (JSON)</div>
          <div class="row wrap">
            <button class="btn ghost" id="exportBtn2">Export</button>
            <button class="btn warn" id="importBtn2">Import</button>
            <button class="btn" id="resetBtn">Reset demo</button>
          </div>
          <textarea id="ioArea" rows="10" placeholder="JSON hier…"></textarea>
        </div>
        <div class="card stack">
          <h4>Legenda productiviteit</h4>
          <div class="legend">
            ${Object.entries(ROLES)
              .map(([role, { productive }]) => `<span class="chip">${role}: ${productive * 100}% productief</span>`)
              .join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

"use strict";

const states = ["in_progress", "proposed", "pending", "blocked", "done"];
const stateLabels = {
  in_progress: "Sedang dikerjakan",
  proposed: "Diusulkan",
  pending: "Menunggu",
  blocked: "Terhambat",
  done: "Selesai",
};
const token = document.querySelector('meta[name="csrf-token"]').content;
const rows = document.querySelector("#task-rows");
const searchInput = document.querySelector("#task-search");
const stateFilter = document.querySelector("#state-filter");
const feedback = document.querySelector("#feedback");
const refreshButton = document.querySelector("#refresh-button");
let tasks = [];
let readyTaskIds = [];
let busy = false;

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function updateSummary() {
  document.querySelector("#count-total").textContent = String(tasks.length);
  for (const state of states) {
    const count = tasks.filter((task) => task.state === state).length;
    document.querySelector(`#count-${state}`).textContent = String(count);
  }
  document.querySelector("#count-ready").textContent = String(readyTaskIds.length);
}

function taskSearchText(task) {
  return [
    task.id,
    task.title,
    task.section,
    task.state,
    task.status_label,
    task.owner,
    task.acceptance_criteria,
    ...task.depends_on,
  ].join(" ").toLocaleLowerCase("id");
}

function makeStateSelect(task) {
  const label = makeElement("label", "state-control");
  const accessibleLabel = makeElement("span", "sr-only", `Ubah status ${task.id}`);
  const select = document.createElement("select");
  select.className = "state-select";
  select.dataset.taskId = task.id;
  select.disabled = busy;
  for (const state of states) {
    const option = document.createElement("option");
    option.value = state;
    option.textContent = stateLabels[state];
    option.selected = task.state === state;
    select.append(option);
  }
  select.addEventListener("change", () => void saveTaskState(task, select));
  label.append(accessibleLabel, select);
  return label;
}

function makeTaskDetails(task) {
  const details = document.createElement("details");
  details.className = "task-details";
  const summary = makeElement("summary", "task-title", task.title);
  const content = makeElement("div", "task-detail-content");
  content.append(makeElement("p", "section-name", task.section));
  content.append(makeElement("h3", "detail-label", "Kriteria penerimaan"));
  content.append(makeElement("p", "acceptance", task.acceptance_criteria));
  content.append(makeElement("p", "status-note", `Catatan status (dipertahankan): ${task.status_label}`));
  if (task.completed_at) {
    content.append(makeElement("p", "completion-date", `Selesai tercatat: ${task.completed_at}`));
  }
  details.append(summary, content);
  return details;
}

function makeDependencyCell(task) {
  const cell = makeElement("td", "dependency-cell");
  cell.dataset.label = "Dependensi";
  if (task.depends_on.length === 0) {
    cell.textContent = "—";
    return cell;
  }
  for (const dependencyId of task.depends_on) {
    const dependency = tasks.find((candidate) => candidate.id === dependencyId);
    const text = dependency
      ? `${dependencyId} · ${stateLabels[dependency.state]}`
      : `${dependencyId} · tidak ditemukan`;
    const item = makeElement("span", "dependency-item", text);
    cell.append(item);
  }
  return cell;
}

function renderTasks() {
  const query = searchInput.value.trim().toLocaleLowerCase("id");
  const selectedState = stateFilter.value;
  const filtered = tasks.filter((task) => {
    const matchesText = query.length === 0 || taskSearchText(task).includes(query);
    const matchesState = selectedState === "all" || task.state === selectedState;
    return matchesText && matchesState;
  });
  document.querySelector("#result-count").textContent =
    `${filtered.length} dari ${tasks.length} task`;
  rows.replaceChildren();
  if (filtered.length === 0) {
    const row = document.createElement("tr");
    row.append(makeElement("td", "table-message", "Tidak ada task yang cocok. Ubah kata pencarian atau filter status."));
    row.firstElementChild.colSpan = 5;
    rows.append(row);
    return;
  }

  for (const task of filtered) {
    const row = document.createElement("tr");
    row.dataset.state = task.state;
    const idCell = makeElement("td", "task-id", task.id);
    idCell.dataset.label = "ID";
    const detailsCell = document.createElement("td");
    detailsCell.className = "task-main";
    detailsCell.dataset.label = "Task dan kriteria";
    detailsCell.append(makeTaskDetails(task));
    const stateCell = document.createElement("td");
    stateCell.className = "task-state";
    stateCell.dataset.label = "Status";
    stateCell.append(makeStateSelect(task));
    const dependencyCell = makeDependencyCell(task);
    const ownerCell = makeElement("td", "owner-cell", task.owner);
    ownerCell.dataset.label = "Pemilik";
    row.append(idCell, detailsCell, stateCell, dependencyCell, ownerCell);
    rows.append(row);
  }
}

async function loadTasks() {
  busy = true;
  refreshButton.disabled = true;
  feedback.className = "feedback";
  feedback.textContent = "Memuat task...";
  try {
    const response = await fetch("/api/tasks", { headers: { Accept: "application/json" } });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || `Gagal memuat task (${response.status}).`);
    tasks = body.tasks;
    readyTaskIds = body.ready_task_ids;
    updateSummary();
    feedback.textContent = "";
    renderTasks();
  } catch (error) {
    feedback.className = "feedback is-error";
    feedback.textContent = error instanceof Error ? error.message : "Gagal memuat task.";
    rows.replaceChildren();
    const row = document.createElement("tr");
    row.append(makeElement("td", "table-message", "Periksa server dan muat ulang untuk mencoba lagi."));
    row.firstElementChild.colSpan = 5;
    rows.append(row);
  } finally {
    busy = false;
    refreshButton.disabled = false;
    for (const select of rows.querySelectorAll(".state-select")) select.disabled = false;
  }
}

async function saveTaskState(task, select) {
  const previousState = task.state;
  const nextState = select.value;
  if (!states.includes(nextState) || nextState === previousState) return;
  busy = true;
  for (const item of rows.querySelectorAll(".state-select")) item.disabled = true;
  feedback.className = "feedback";
  feedback.textContent = `Menyimpan ${task.id}...`;
  try {
    const response = await fetch(`/api/tasks/${encodeURIComponent(task.id)}/state`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Tracker-Token": token,
      },
      body: JSON.stringify({ state: nextState }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || `Gagal menyimpan (${response.status}).`);
    tasks = body.tasks;
    readyTaskIds = body.ready_task_ids;
    updateSummary();
    feedback.className = "feedback is-success";
    feedback.textContent = `${task.id} disimpan sebagai ${stateLabels[nextState]}.`;
    renderTasks();
    const updatedSelect = rows.querySelector(`select[data-task-id="${task.id}"]`);
    if (updatedSelect) updatedSelect.focus();
  } catch (error) {
    select.value = previousState;
    feedback.className = "feedback is-error";
    feedback.textContent = error instanceof Error
      ? `${error.message} Status lokal belum dikonfirmasi; muat ulang sebelum mencoba lagi.`
      : "Status gagal disimpan. Muat ulang sebelum mencoba lagi.";
  } finally {
    busy = false;
    refreshButton.disabled = false;
    for (const item of rows.querySelectorAll(".state-select")) item.disabled = false;
  }
}

searchInput.addEventListener("input", renderTasks);
stateFilter.addEventListener("change", renderTasks);
refreshButton.addEventListener("click", () => void loadTasks());
void loadTasks();

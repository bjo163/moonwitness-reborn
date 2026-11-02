"use strict";

const states = ["in_progress", "proposed", "pending", "blocked", "done"];
const stateLabels = {
  in_progress: "Sedang dikerjakan",
  proposed: "Diusulkan",
  pending: "Menunggu",
  blocked: "Terhambat",
  done: "Selesai",
};
const executionModeLabels = {
  autonomous: "AI dapat mengerjakan",
  decision_prep: "Persiapan keputusan saja",
  manual_verification: "Perlu verifikasi manusia",
  gated_implementation: "Terkunci sampai prasyarat selesai",
};
const token = document.querySelector('meta[name="csrf-token"]').content;
const rows = document.querySelector("#task-rows");
const searchInput = document.querySelector("#task-search");
const stateFilter = document.querySelector("#state-filter");
const feedback = document.querySelector("#feedback");
const refreshButton = document.querySelector("#refresh-button");
let tasks = [];
let readyTaskIds = [];
let aiReadyTaskIds = [];
let revision = null;

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function setFeedback(message, kind) {
  feedback.className = kind ? `feedback is-${kind}` : "feedback";
  feedback.textContent = message;
}

function taskById(taskId) {
  return tasks.find((task) => task.id === taskId);
}

function refreshSummary() {
  document.querySelector("#count-total").textContent = String(tasks.length);
  for (const state of states) {
    const count = tasks.filter((task) => task.state === state).length;
    document.querySelector(`#count-${state}`).textContent = String(count);
  }
  document.querySelector("#count-ready").textContent = String(readyTaskIds.length);
  document.querySelector("#count-ai-ready").textContent = String(aiReadyTaskIds.length);
}

function taskSearchText(task) {
  const packet = task.execution_packet;
  const packetText = packet
    ? [
        packet.mode,
        packet.scope,
        ...packet.non_goals,
        ...packet.spec_refs,
        ...packet.requirement_ids,
        ...packet.touchpoints,
        ...packet.checks,
        ...packet.stop_conditions,
      ]
    : [];
  return [
    task.id,
    task.title,
    task.section,
    task.state,
    task.status_label,
    task.owner,
    task.acceptance_criteria,
    task.evidence || "",
    ...task.depends_on,
    ...packetText,
  ].join(" ").toLocaleLowerCase("id");
}

function makeField(name, fieldName, placeholder) {
  const label = makeElement("label", "field");
  label.append(makeElement("span", "field-name", fieldName));
  const input = document.createElement("textarea");
  input.className = "field-input";
  input.name = name;
  input.rows = 3;
  input.placeholder = placeholder;
  label.append(input);
  return label;
}

function showField(field, shown) {
  field.hidden = !shown;
  field.querySelector("textarea").required = shown;
}

function makeStateForm(task) {
  const form = makeElement("form", "task-form");
  form.dataset.taskId = task.id;

  const stateLabel = makeElement("label", "state-control");
  stateLabel.append(makeElement("span", "sr-only", `Status ${task.id}`));
  const select = document.createElement("select");
  select.className = "state-select";
  select.name = "state";
  for (const state of states) {
    const option = document.createElement("option");
    option.value = state;
    option.textContent = stateLabels[state];
    option.selected = task.state === state;
    option.disabled = state !== task.state && !task.allowed_states.includes(state);
    select.append(option);
  }
  stateLabel.append(select);

  const reasonField = makeField(
    "status_label",
    "Alasan blocker atau reopen",
    "Kosongkan untuk mempertahankan catatan yang tersimpan."
  );
  const evidenceField = makeField(
    "evidence",
    "Bukti penyelesaian",
    "Perintah atau hasil yang menunjukkan task ini benar selesai."
  );
  const submit = makeElement("button", "button button-secondary", "Simpan perubahan");
  submit.type = "submit";

  function syncFields() {
    const target = select.value;
    showField(reasonField, target === "blocked" || (task.state === "done" && target !== "done"));
    showField(evidenceField, target === "done" && !task.evidence);
  }
  syncFields();
  select.addEventListener("change", syncFields);

  form.append(stateLabel, reasonField, evidenceField, submit);
  return form;
}

function makeTaskDetails(task) {
  const details = makeElement("details", "task-details");
  details.append(makeElement("summary", "task-title", task.title));
  const content = makeElement("div", "task-detail-content");
  content.append(makeElement("p", "section-name", task.section));
  content.append(makeElement("h3", "detail-label", "Kriteria penerimaan"));
  content.append(makeElement("p", "acceptance", task.acceptance_criteria));
  if (task.execution_packet) {
    const packet = task.execution_packet;
    content.append(makeElement("h3", "detail-label", "Paket eksekusi"));
    const modeLabel = executionModeLabels[packet.mode] || packet.mode;
    const readyLabel = aiReadyTaskIds.includes(task.id)
      ? " · Siap masuk antrean AI"
      : "";
    content.append(makeElement("p", "execution-mode", `${modeLabel}${readyLabel}`));
    content.append(makeElement("p", "packet-scope", packet.scope));
    for (const [field, label] of [
      ["non_goals", "Batasan"],
      ["spec_refs", "Referensi kanonis"],
      ["requirement_ids", "Requirement"],
      ["touchpoints", "Area terkait"],
      ["checks", "Pemeriksaan"],
      ["stop_conditions", "Kondisi berhenti"],
    ]) {
      if (!packet[field].length) continue;
      const list = document.createElement("ul");
      list.className = "packet-list";
      for (const item of packet[field]) list.append(makeElement("li", "", item));
      content.append(makeElement("h4", "packet-label", label), list);
    }
  }
  content.append(makeElement("p", "status-note", `Catatan status: ${task.status_label}`));
  if (task.evidence) {
    content.append(makeElement("p", "evidence-note", `Bukti: ${task.evidence}`));
  }
  if (task.completed_at) {
    content.append(makeElement("p", "completion-date", `Selesai tercatat: ${task.completed_at}`));
  }
  details.append(content);
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
    const dependency = taskById(dependencyId);
    const text = dependency
      ? `${dependencyId} · ${stateLabels[dependency.state]}`
      : `${dependencyId} · tidak ditemukan`;
    cell.append(makeElement("span", "dependency-item", text));
  }
  return cell;
}

function makeRow(task) {
  const row = makeElement("tr");
  row.dataset.taskId = task.id;
  row.dataset.state = task.state;

  const idCell = makeElement("td", "task-id", task.id);
  idCell.dataset.label = "ID";
  const mainCell = makeElement("td", "task-main");
  mainCell.dataset.label = "Task dan kriteria";
  mainCell.append(makeTaskDetails(task));
  const stateCell = makeElement("td", "task-state");
  stateCell.dataset.label = "Status";
  stateCell.append(makeStateForm(task));
  const ownerCell = makeElement("td", "owner-cell", task.owner);
  ownerCell.dataset.label = "Pemilik";

  row.append(idCell, mainCell, stateCell, makeDependencyCell(task), ownerCell);
  return row;
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
    const message = makeElement("td", "table-message", "Tidak ada task yang cocok. Ubah kata pencarian atau filter status.");
    message.colSpan = 5;
    row.append(message);
    rows.append(row);
    return;
  }
  for (const task of filtered) rows.append(makeRow(task));
}

function patchTaskRow(taskId) {
  const task = taskById(taskId);
  const row = rows.querySelector(`tr[data-task-id="${taskId}"]`);
  if (!task || !row) return;
  row.dataset.state = task.state;
  const mainCell = row.querySelector(".task-main");
  const wasOpen = mainCell.querySelector("details")?.open;
  mainCell.replaceChildren(makeTaskDetails(task));
  mainCell.querySelector("details").open = Boolean(wasOpen);
  row.querySelector(".task-state").replaceChildren(makeStateForm(task));
  row.querySelector(".owner-cell").textContent = task.owner;
  // A dependency column that still shows the old state of this task is a second,
  // contradicting copy of the same fact, so refresh every row that lists it.
  for (const dependent of tasks.filter((item) => item.depends_on.includes(taskId))) {
    const dependentRow = rows.querySelector(`tr[data-task-id="${dependent.id}"]`);
    if (dependentRow) dependentRow.querySelector(".dependency-cell")
      .replaceWith(makeDependencyCell(dependent));
  }
}

function adopt(payload) {
  tasks = payload.tasks;
  readyTaskIds = payload.ready_task_ids;
  aiReadyTaskIds = payload.ai_ready_task_ids;
  revision = payload.revision;
  refreshSummary();
}

async function loadTasks() {
  refreshButton.disabled = true;
  setFeedback("Memuat task...");
  try {
    const response = await fetch("/api/tasks", { headers: { Accept: "application/json" } });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || `Gagal memuat task (${response.status}).`);
    adopt(body);
    setFeedback("");
    renderTasks();
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : "Gagal memuat task.", "error");
    tasks = [];
    readyTaskIds = [];
    aiReadyTaskIds = [];
    revision = null;
    refreshSummary();
    const row = document.createElement("tr");
    const message = makeElement("td", "table-message", "Periksa server dan muat ulang untuk mencoba lagi.");
    message.colSpan = 5;
    row.append(message);
    rows.replaceChildren(row);
  } finally {
    refreshButton.disabled = false;
  }
}

async function submitTask(form) {
  const taskId = form.dataset.taskId;
  const task = taskById(taskId);
  if (!task) return;
  const body = { state: form.elements.state.value };
  const reason = form.elements.status_label.value.trim();
  const evidence = form.elements.evidence.value.trim();
  if (reason) body.status_label = reason;
  if (evidence) body.evidence = evidence;
  if (body.state === task.state && !reason && !evidence) {
    setFeedback(`${taskId}: tidak ada yang berubah, jadi tidak ada yang disimpan.`, "error");
    return;
  }

  for (const control of form.elements) control.disabled = true;
  setFeedback(`Menyimpan ${taskId}...`);
  try {
    const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/state`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Tracker-Token": token,
        ...(revision ? { "If-Match": `"${revision}"` } : {}),
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok) {
      if (response.status === 409) {
        adopt(payload);
        patchTaskRow(taskId);
        setFeedback(
          `${taskId} sudah diubah proses lain. Data terbaru sudah dimuat, perubahan Anda belum tersimpan.`,
          "error"
        );
        return;
      }
      throw new Error(payload.error || `Gagal menyimpan (${response.status}).`);
    }
    adopt(payload);
    patchTaskRow(taskId);
    setFeedback(`${taskId} tersimpan sebagai ${stateLabels[body.state]}.`, "success");
    rows.querySelector(`tr[data-task-id="${taskId}"] .state-select`)?.focus();
  } catch (error) {
    setFeedback(
      `${error instanceof Error ? error.message : "Status gagal disimpan."} Isian Anda masih ada di form.`,
      "error"
    );
  } finally {
    for (const control of form.elements) control.disabled = false;
  }
}

rows.addEventListener("submit", (event) => {
  const form = event.target.closest(".task-form");
  if (!form) return;
  event.preventDefault();
  void submitTask(form);
});
searchInput.addEventListener("input", renderTasks);
stateFilter.addEventListener("change", renderTasks);
refreshButton.addEventListener("click", () => void loadTasks());
void loadTasks();

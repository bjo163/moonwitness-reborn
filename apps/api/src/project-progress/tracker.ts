import { readFile } from "node:fs/promises";
import {
  type ProjectProgressSummaryDto,
  type ProjectTaskDto,
  type ProjectTaskStateDto,
} from "@moonwitness/moonclient";

const trackerUrl = new URL(
  "../../../../docs/governance/task-tracker.json",
  import.meta.url,
);
const taskStates: readonly ProjectTaskStateDto[] = [
  "done",
  "in_progress",
  "proposed",
  "blocked",
  "pending",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTaskState(value: unknown): value is ProjectTaskStateDto {
  return typeof value === "string" && taskStates.some((state) => state === value);
}

function isTaskIdList(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(
      (dependency) =>
        typeof dependency === "string" && /^MW-\d{4}$/.test(dependency),
    )
  );
}

function isCompletionTimestamp(value: unknown): value is string | null {
  return (
    value === null ||
    (typeof value === "string" &&
      value.includes("T") &&
      !Number.isNaN(Date.parse(value)))
  );
}

function parseTasks(value: unknown): ProjectTaskDto[] {
  if (
    !isRecord(value) ||
    value.schema_version !== 1 ||
    !Array.isArray(value.tasks)
  ) {
    throw new Error("Project task tracker has an unsupported structure.");
  }

  const tasks = value.tasks.map((task): ProjectTaskDto => {
    if (
      !isRecord(task) ||
      typeof task.id !== "string" ||
      !/^MW-\d{4}$/.test(task.id) ||
      typeof task.title !== "string" ||
      typeof task.section !== "string" ||
      !isTaskState(task.state) ||
      typeof task.status_label !== "string" ||
      typeof task.owner !== "string" ||
      !isTaskIdList(task.depends_on) ||
      typeof task.acceptance_criteria !== "string" ||
      !isCompletionTimestamp(task.completed_at)
    ) {
      throw new Error("Project task tracker contains an invalid task.");
    }

    return {
      id: task.id,
      title: task.title,
      section: task.section,
      state: task.state,
      statusLabel: task.status_label,
      owner: task.owner,
      dependsOn: task.depends_on,
      acceptanceCriteria: task.acceptance_criteria,
      completedAt: task.completed_at,
    };
  });
  const taskIds = new Set(tasks.map((task) => task.id));
  if (taskIds.size !== tasks.length) {
    throw new Error("Project task tracker contains duplicate task IDs.");
  }
  for (const task of tasks) {
    if (task.dependsOn.some((dependency) => !taskIds.has(dependency))) {
      throw new Error(`Project task ${task.id} has a missing dependency.`);
    }
  }
  return tasks;
}

export async function listProjectTasks(): Promise<ProjectTaskDto[]> {
  const source = await readFile(trackerUrl, "utf8");
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch (error) {
    throw new Error("Project task tracker is not valid JSON.", { cause: error });
  }
  return parseTasks(value);
}

export function projectProgressSummary(
  tasks: readonly ProjectTaskDto[],
): ProjectProgressSummaryDto {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const states: Record<ProjectTaskStateDto, number> = {
    done: 0,
    in_progress: 0,
    proposed: 0,
    blocked: 0,
    pending: 0,
  };
  for (const task of tasks) states[task.state] += 1;
  const readyCount = tasks.filter(
    (task) =>
      (task.state === "proposed" || task.state === "pending") &&
      task.dependsOn.every((dependency) => byId.get(dependency)?.state === "done"),
  ).length;
  return { total: tasks.length, readyCount, states };
}

export function readyProjectTaskIds(tasks: readonly ProjectTaskDto[]): string[] {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  return tasks
    .filter(
      (task) =>
        (task.state === "proposed" || task.state === "pending") &&
        task.dependsOn.every(
          (dependency) => byId.get(dependency)?.state === "done",
        ),
    )
    .map((task) => task.id);
}

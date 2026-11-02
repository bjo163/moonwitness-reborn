import {
  type ProjectProgressSummaryDto,
  type ProjectTaskDto,
  type ProjectTaskStateDto,
} from "@moonwitness/moonclient";

const ISSUE_API_URL =
  "https://api.github.com/repos/bjo163/moonwitness-reborn/issues";
const PAGE_SIZE = 100;
const MAX_ISSUE_PAGES = 100;
const CACHE_TTL_MS = 60_000;

let cachedTasks: { expiresAt: number; tasks: ProjectTaskDto[] } | undefined;
let refreshInFlight: Promise<ProjectTaskDto[]> | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
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

function parseTaskRecord(body: string): Record<string, unknown> {
  const records = [
    ...body.matchAll(
      /<!-- mw-task-record-start -->\s*```json\s*([\s\S]*?)\s*```\s*<!-- mw-task-record-end -->/g,
    ),
  ];
  if (records.length !== 1) {
    throw new Error("GitHub task Issue must contain exactly one task contract.");
  }

  let value: unknown;
  try {
    value = JSON.parse(records[0][1]);
  } catch (error) {
    throw new Error("GitHub task Issue contract is not valid JSON.", {
      cause: error,
    });
  }
  if (!isRecord(value)) {
    throw new Error("GitHub task Issue contract has an unsupported structure.");
  }
  return value;
}

function parseIssue(value: unknown): ProjectTaskDto | undefined {
  if (!isRecord(value) || !Array.isArray(value.labels)) {
    throw new Error("GitHub Issues response contains an invalid Issue.");
  }
  if ("pull_request" in value) return undefined;

  const labels = value.labels.map((label) => {
    if (!isRecord(label) || typeof label.name !== "string") {
      throw new Error("GitHub Issue contains an invalid label.");
    }
    return label.name;
  });
  if (!labels.includes("type:task")) return undefined;

  if (
    typeof value.title !== "string" ||
    typeof value.body !== "string" ||
    (value.state !== "open" && value.state !== "closed") ||
    !isCompletionTimestamp(value.closed_at)
  ) {
    throw new Error("GitHub task Issue is missing required fields.");
  }

  const titleMatch = value.title.match(/^\[(MW-\d{4})\]\s+(.+)$/);
  if (!titleMatch) {
    throw new Error("GitHub task Issue title has an invalid task ID.");
  }
  const contract = parseTaskRecord(value.body);
  if (
    contract.id !== titleMatch[1] ||
    typeof contract.title !== "string" ||
    contract.title !== titleMatch[2] ||
    typeof contract.section !== "string" ||
    typeof contract.owner !== "string" ||
    !isTaskIdList(contract.depends_on) ||
    typeof contract.acceptance_criteria !== "string" ||
    !contract.acceptance_criteria.trim()
  ) {
    throw new Error("GitHub task Issue contract contains invalid task fields.");
  }

  const statusLabels = labels.filter((label) => label.startsWith("status:"));
  let state: ProjectTaskStateDto;
  let statusLabel: string;
  let completedAt: string | null;
  if (value.state === "closed") {
    if (statusLabels.length > 0 || !value.closed_at) {
      throw new Error("Closed GitHub task Issue has inconsistent status data.");
    }
    state = "done";
    statusLabel = "done";
    completedAt = value.closed_at;
  } else {
    if (statusLabels.length !== 1) {
      throw new Error("Open GitHub task Issue must have exactly one status label.");
    }
    const statusMap: Record<string, ProjectTaskStateDto> = {
      "status:in-progress": "in_progress",
      "status:proposed": "proposed",
      "status:blocked": "blocked",
      "status:pending": "pending",
    };
    const mappedState = statusMap[statusLabels[0]];
    if (!mappedState) {
      throw new Error("Open GitHub task Issue has an unsupported status label.");
    }
    state = mappedState;
    statusLabel = statusLabels[0];
    completedAt = null;
  }

  return {
    id: titleMatch[1],
    title: contract.title,
    section: contract.section,
    state,
    statusLabel,
    owner: contract.owner,
    dependsOn: contract.depends_on,
    acceptanceCriteria: contract.acceptance_criteria,
    completedAt,
  };
}

function parseTasks(value: unknown): ProjectTaskDto[] {
  if (!isUnknownArray(value)) {
    throw new Error("GitHub Issues response must be an array.");
  }
  const tasks = value
    .map(parseIssue)
    .filter((task): task is ProjectTaskDto => task !== undefined);
  const taskIds = new Set(tasks.map((task) => task.id));
  if (taskIds.size !== tasks.length) {
    throw new Error("GitHub task Issues contain duplicate task IDs.");
  }
  for (const task of tasks) {
    if (task.dependsOn.some((dependency) => !taskIds.has(dependency))) {
      throw new Error(`GitHub task ${task.id} has a missing dependency.`);
    }
  }
  return tasks;
}

async function fetchProjectTasks(fetcher: typeof fetch): Promise<ProjectTaskDto[]> {
  const issues: unknown[] = [];
  for (let page = 1; page <= MAX_ISSUE_PAGES; page += 1) {
    const url = new URL(ISSUE_API_URL);
    url.searchParams.set("state", "all");
    url.searchParams.set("per_page", String(PAGE_SIZE));
    url.searchParams.set("page", String(page));

    const token = process.env.GITHUB_TOKEN;
    const response = await fetcher(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`GitHub Issues request failed with HTTP ${response.status}.`);
    }
    const pageIssues: unknown = await response.json();
    if (!isUnknownArray(pageIssues)) {
      throw new Error("GitHub Issues response must be an array.");
    }
    issues.push(...pageIssues);
    if (pageIssues.length < PAGE_SIZE) {
      return parseTasks(issues);
    }
  }
  throw new Error("GitHub task Issue inventory exceeds the supported page limit.");
}

export async function listProjectTasks(
  fetcher: typeof fetch = globalThis.fetch,
): Promise<ProjectTaskDto[]> {
  if (fetcher !== globalThis.fetch) return fetchProjectTasks(fetcher);
  if (cachedTasks && cachedTasks.expiresAt > Date.now()) {
    return cachedTasks.tasks;
  }
  if (!refreshInFlight) {
    refreshInFlight = fetchProjectTasks(fetcher)
      .then((tasks) => {
        cachedTasks = { tasks, expiresAt: Date.now() + CACHE_TTL_MS };
        return tasks;
      })
      .finally(() => {
        refreshInFlight = undefined;
      });
  }
  return refreshInFlight;
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

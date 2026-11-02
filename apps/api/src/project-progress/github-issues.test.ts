import assert from "node:assert/strict";
import { test } from "node:test";
import { listProjectTasks } from "./github-issues.js";

function taskIssue(
  id: string,
  title: string,
  options: {
    state?: "open" | "closed";
    statusLabel?: string;
    dependsOn?: string[];
    closedAt?: string | null;
  } = {},
) {
  const state = options.state ?? "open";
  const contract = {
    id,
    title,
    section: "Phase 0",
    owner: "Owner",
    depends_on: options.dependsOn ?? [],
    acceptance_criteria: "The task has verifiable acceptance criteria.",
  };
  return {
    title: `[${id}] ${title}`,
    body: `<!-- mw-task-record-start -->
\`\`\`json
${JSON.stringify(contract)}
\`\`\`
<!-- mw-task-record-end -->`,
    state,
    closed_at:
      options.closedAt ??
      (state === "closed" ? "2026-01-01T00:00:00Z" : null),
    labels: [
      { name: "type:task" },
      ...(state === "open" && options.statusLabel
        ? [{ name: options.statusLabel }]
        : []),
    ],
  };
}

function issueResponse(issues: unknown[]): Response {
  return new Response(JSON.stringify(issues), { status: 200 });
}

void test("maps Issue state and contracts while ignoring non-task Issues and PRs", async () => {
  const fetcher: typeof fetch = () =>
    Promise.resolve(
      issueResponse([
        taskIssue("MW-0001", "Finished task", { state: "closed" }),
        taskIssue("MW-0002", "Ready task", {
          statusLabel: "status:pending",
          dependsOn: ["MW-0001"],
        }),
        { title: "Not a task", labels: [] },
        { pull_request: {}, labels: [] },
      ]),
    );

  const tasks = await listProjectTasks(fetcher);
  assert.deepEqual(tasks, [
    {
      id: "MW-0001",
      title: "Finished task",
      section: "Phase 0",
      state: "done",
      statusLabel: "done",
      owner: "Owner",
      dependsOn: [],
      acceptanceCriteria: "The task has verifiable acceptance criteria.",
      completedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "MW-0002",
      title: "Ready task",
      section: "Phase 0",
      state: "pending",
      statusLabel: "status:pending",
      owner: "Owner",
      dependsOn: ["MW-0001"],
      acceptanceCriteria: "The task has verifiable acceptance criteria.",
      completedAt: null,
    },
  ]);
});

void test("rejects malformed task status and missing dependency records", async () => {
  const invalidStatus: typeof fetch = () =>
    Promise.resolve(
      issueResponse([
        taskIssue("MW-0001", "Invalid status", {
          statusLabel: "status:unknown",
        }),
      ]),
    );
  await assert.rejects(
    listProjectTasks(invalidStatus),
    /unsupported status label/,
  );

  const missingDependency: typeof fetch = () =>
    Promise.resolve(
      issueResponse([
        taskIssue("MW-0001", "Missing dependency", {
          statusLabel: "status:pending",
          dependsOn: ["MW-9999"],
        }),
      ]),
    );
  await assert.rejects(
    listProjectTasks(missingDependency),
    /missing dependency/,
  );
});

void test("paginates the GitHub Issue inventory and surfaces HTTP failures", async () => {
  const pages = Array.from({ length: 100 }, (_, index) =>
    taskIssue(
      `MW-${String(index).padStart(4, "0")}`,
      `Closed task ${index}`,
      { state: "closed" },
    ),
  );
  const requestedPages: string[] = [];
  const paginatedFetcher: typeof fetch = (input) => {
    const requestUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const url = new URL(requestUrl);
    const page = url.searchParams.get("page") ?? "";
    requestedPages.push(page);
    return Promise.resolve(issueResponse(page === "1" ? pages : []));
  };

  assert.equal((await listProjectTasks(paginatedFetcher)).length, 100);
  assert.deepEqual(requestedPages, ["1", "2"]);

  const failedFetcher: typeof fetch = () =>
    Promise.resolve(new Response("unavailable", { status: 503 }));
  await assert.rejects(listProjectTasks(failedFetcher), /HTTP 503/);
});

import * as core from "@actions/core";
import * as github from "@actions/github";
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";

type ClientType = ReturnType<typeof github.getOctokit>;

const MAX_ANNOTATIONS = 50;

export function getClient(token: string): ClientType {
  return github.getOctokit(token);
}

export type Output = {
  title: string;
  summary: string;
  annotations: Annotation[];
};

export type Annotation = {
  path: string;
  start_line: number;
  end_line: number;
  annotation_level: AnnotationLevel;
  message: string;
  title: string;
  raw_details: string;
};

export type AnnotationLevel = "notice" | "warning" | "failure";

export type Conclusion =
  | "failure"
  | "action_required"
  | "cancelled"
  | "neutral"
  | "success"
  | "skipped"
  | "stale"
  | "timed_out";

export async function createCheck(
  client: ClientType,
  name: string,
  annotations: Annotation[],
  conclusion: Conclusion,
): Promise<void> {
  const pullRequest = github.context.payload.pull_request;
  const head_sha = pullRequest?.head.sha ?? github.context.sha;
  const status = "completed";
  const title = `${annotations.length} result(s) found by grep`;
  const summary = "";

  const resp = await client.rest.checks.create({
    ...github.context.repo,
    name,
    head_sha,
    status,
    conclusion,
    output: {
      title,
      summary,
      annotations: annotations.slice(0, MAX_ANNOTATIONS),
    },
  });

  const check_run_id = resp.data.id;

  for (
    let i = MAX_ANNOTATIONS;
    i < annotations.length;
    i = i + MAX_ANNOTATIONS
  ) {
    const sliced = annotations.slice(i, i + MAX_ANNOTATIONS);
    core.info(`Updating Check with ${sliced.length} more annotation(s)`);
    await client.rest.checks.update({
      ...github.context.repo,
      check_run_id,
      output: {
        title,
        summary,
        annotations: annotations.slice(i, i + MAX_ANNOTATIONS),
      },
    });
  }
}

type ListFilesResponse =
  RestEndpointMethodTypes["pulls"]["listFiles"]["response"]["data"];

export async function listPullRequestFiles(
  client: ClientType,
): Promise<string[]> {
  const listFilesOptions = client.rest.pulls.listFiles.endpoint.merge({
    ...github.context.repo,
    pull_number: github.context.issue.number,
  });

  const listFilesResponse: ListFilesResponse =
    await client.paginate(listFilesOptions);

  return listFilesResponse.map((f) => f.filename);
}

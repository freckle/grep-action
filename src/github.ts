import * as core from "@actions/core";
import * as github from "@actions/github";
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";

type ClientType = ReturnType<typeof github.getOctokit>;

export function getClient(token: string): ClientType {
  return github.getOctokit(token);
}

export type Output = {
  title: string;
  summary: string;
  text: string | null;
  annotations: Annotation[] | null;
  //images
};

export type Annotation = {
  path: string;
  start_line: number;
  end_line: number;
  start_column: number | null;
  end_column: number | null;
  annotation_level: AnnotationLevel;
  message: string;
  title: string | null;
  raw_details: string | null;
};

export type AnnotationLevel = "notice" | "warning" | "failure";

export async function createCheck(
  client: ClientType,
  name: string,
  annotations: Annotation[]
): Promise<void> {
  const output = buildOutput(annotations);
  const pullRequest = github.context.payload.pull_request;
  const head_sha = (pullRequest && pullRequest.head.sha) || github.context.sha;
  const status = "completed";
  const failures = output.annotations.filter((a) => {
    return a.annotation_level === "failure";
  });
  const conclusion = failures.length > 0 ? "failure" : "success";

  await client.rest.checks.create({
    ...github.context.repo,
    name,
    head_sha,
    status,
    conclusion,
    output,
  });
}

function buildOutput(annotations: Annotation[]): Output {
  const annotationsCount = annotations !== null ? annotations.length : 0;
  const title = `${annotationsCount} result(s) found by grep`;
  const summary = "";

  if (annotationsCount > 50) {
    core.warning("Only 50 annotations will be added to Check");
  }

  return { title, summary, text: null, annotations: annotations.slice(0, 50) };
}

type ListFilesResponse =
  RestEndpointMethodTypes["pulls"]["listFiles"]["response"]["data"];

export async function listPullRequestFiles(
  client: ClientType
): Promise<string[]> {
  const listFilesOptions = client.rest.pulls.listFiles.endpoint.merge({
    ...github.context.repo,
    pull_number: github.context.issue.number,
  });

  const listFilesResponse: ListFilesResponse = await client.paginate(
    listFilesOptions
  );

  return listFilesResponse.map((f) => f.filename);
}

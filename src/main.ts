import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as glob from "@actions/glob";
import * as yaml from "js-yaml";
import { Minimatch } from "minimatch";

import type { Pattern } from "./config";
import * as config from "./config";
import type { Annotation } from "./github";
import * as github from "./github";
import type { GrepResult } from "./grep";
import { grep } from "./grep";

async function getFiles(
  onlyChanged: boolean,
  changedFiles: string[],
  pattern: Pattern
): Promise<string[]> {
  if (onlyChanged) {
    const matchers = pattern.paths.map((p) => new Minimatch(p));

    return changedFiles.filter((file) => {
      matchers.some((m) => m.match(file));
    });
  } else {
    const globber = await glob.create(pattern.paths.join("\n"));
    return await globber.glob();
  }
}

function toAnnotation(pattern: Pattern, result: GrepResult): Annotation {
  switch (result.tag) {
    case "match":
      return {
        path: result.path,
        start_line: result.line,
        end_line: result.line,
        start_column: null,
        end_column: null,
        annotation_level: pattern.level,
        message: pattern.message,
        title: pattern.title,
        raw_details: result.input,
      };
    case "nomatch":
      return {
        path: "unknown",
        start_line: 0,
        end_line: 0,
        start_column: null,
        end_column: null,
        annotation_level: "notice",
        message: `Grep output not parsable: ${result.message}`,
        title: null,
        raw_details: result.input,
      };
  }
}

async function run() {
  try {
    core.startGroup("Inputs");

    const token =
      core.getInput("token") ||
      core.getInput("github-token") ||
      process.env.GITHUB_TOKEN;

    const patterns = config.loadPatterns(
      core.getInput("patterns", { required: true })
    );

    const onlyChanged =
      core.getInput("only-changed", { required: true }).toUpperCase() == "TRUE";

    core.info(`patterns: ${patterns.map((p) => p.pattern).join(", ")}`);
    core.info(`only-changed: ${onlyChanged}`);
    core.endGroup();

    const client = github.getClient(token);
    const changedFiles = onlyChanged
      ? await github.listPullRequestFiles(client)
      : [];

    core.info(`Fetched ${changedFiles.length} changed file(s)`);

    let annotations = [];

    for (const pattern of patterns) {
      core.startGroup(pattern.pattern);
      const files = await getFiles(onlyChanged, changedFiles, pattern);
      const results = await grep(files);

      core.info(
        `Grepped ${files.length} file(s) => ${results.length} result(s)`
      );

      results.forEach((result) => {
        annotations.push(toAnnotation(pattern, result));
      });
      core.endGroup();
    }

    core.info(`Creating Check result with ${annotations.length} annotation(s)`);
    await github.createCheck(client, "Grep results", annotations);
  } catch (error) {
    if (error instanceof Error) {
      core.error(error);
      core.setFailed(error.message);
    } else if (typeof error === "string") {
      core.error(error);
      core.setFailed(error);
    } else {
      core.error("Non-Error exception");
      core.setFailed("Non-Error exception");
    }
  }
}

run();

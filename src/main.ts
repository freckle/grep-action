import { relative } from "path";

import * as core from "@actions/core";
import * as glob from "@actions/glob";

import { Reporter } from "./reporter";
import type { Pattern } from "./config";
import * as config from "./config";
import * as github from "./github";
import { grep } from "./grep";

async function getFiles(
  onlyChanged: boolean,
  changedFiles: string[],
  pattern: Pattern,
): Promise<string[]> {
  if (onlyChanged) {
    return changedFiles.filter((file) => {
      return config.matchesAny(pattern, file);
    });
  } else {
    const globber = await glob.create(pattern.paths.join("\n"));
    const paths = await globber.glob();
    return paths
      .map((p) => relative(process.cwd(), p))
      .filter((file) => {
        return config.matchesAny(pattern, file);
      });
  }
}

async function run() {
  try {
    core.startGroup("Inputs");

    const token = core.getInput("github-token", { required: true });
    const patterns = config.loadPatterns(
      core.getInput("patterns", { required: true }),
    );
    const onlyChanged = core.getBooleanInput("only-changed", {
      required: true,
    });
    const createNewCheck = core.getBooleanInput("create-new-check", {
      required: true,
    });

    core.info(
      `patterns: [${patterns.map((p) => p.pattern.toString()).join(", ")}]`,
    );
    core.info(`only-changed: ${onlyChanged}`);
    core.endGroup();

    const client = github.getClient(token);
    const changedFiles = onlyChanged
      ? await github.listPullRequestFiles(client)
      : [];

    if (onlyChanged) {
      // Don't print "0 changed files" when we've disabled the option
      core.info(`Fetched ${changedFiles.length} changed file(s)`);
    }

    const reporter = new Reporter(createNewCheck);

    for (const pattern of patterns) {
      const files = await getFiles(onlyChanged, changedFiles, pattern);

      if (files.length !== 0) {
        core.startGroup(`grep "${pattern.pattern}"`);
        const results = await grep(pattern.pattern, files, {
          syntax: pattern.syntax,
          binaryFiles: pattern.binaryFiles,
        });

        core.info(`${results.length} result(s)`);

        results.forEach((result) => {
          reporter.onResult(pattern, result);
        });
        core.endGroup();
      }
    }

    reporter.onFinish(client);
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

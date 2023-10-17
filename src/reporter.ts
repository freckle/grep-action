import * as core from "@actions/core";
import * as gh from "@actions/github";

import type { Annotation } from "./github";
import * as github from "./github";
import type { GrepResult } from "./grep";
import type { Pattern } from "./config";

type ClientType = ReturnType<typeof gh.getOctokit>;

export class Reporter {
  createNewCheck: boolean;
  annotations: Annotation[];
  conclusion: string;

  constructor(createNewCheck: boolean) {
    this.createNewCheck = createNewCheck;
    this.annotations = [];
    this.conclusion = "success";
  }

  onResult(pattern: Pattern, result: GrepResult): void {
    const annotation = {
      path: result.path,
      start_line: result.line,
      end_line: result.line,
      annotation_level: pattern.level,
      message: pattern.message || "Flagged in freckle/grep-action",
      title: pattern.title || "",
      raw_details: result.input,
    };

    if (annotation.annotation_level == "failure") {
      this.conclusion = "failure";
    }

    this.annotations.push(annotation);

    if (!this.createNewCheck) {
      const options = {
        title: annotation.title,
        file: annotation.path,
        startLine: annotation.start_line,
        endLine: annotation.end_line,
      };

      switch (annotation.annotation_level) {
        case "notice":
          core.notice(annotation.message, options);
          break;
        case "warning":
          core.warning(annotation.message, options);
          break;
        case "failure":
          core.error(annotation.message, options);
          break;
      }
    }
  }

  async onFinish(client: ClientType): Promise<void> {
    if (this.createNewCheck) {
      core.info(
        `Creating Check result with ${this.annotations.length} annotation(s)`
      );
      return await github.createCheck(
        client,
        "Grep results",
        this.annotations,
        this.conclusion
      );
    }

    if (this.conclusion === "failure") {
      core.setFailed("Failing due to grep results");
    }
  }
}

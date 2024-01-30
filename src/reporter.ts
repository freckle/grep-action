import * as core from "@actions/core";
import * as gh from "@actions/github";

import type { Annotation, AnnotationLevel, Conclusion } from "./github";
import * as github from "./github";
import type { GrepResult } from "./grep";
import type { Pattern } from "./config";

type ClientType = ReturnType<typeof gh.getOctokit>;

export class Reporter {
  createNewCheck: boolean;
  failureThreshold: AnnotationLevel;
  annotations: Annotation[];
  conclusion: Conclusion;

  constructor(createNewCheck: boolean, failureThreshold: AnnotationLevel) {
    this.createNewCheck = createNewCheck;
    this.failureThreshold = failureThreshold;
    this.annotations = [];
    this.conclusion = "success";
  }

  exceedsFailureThreshold(level: AnnotationLevel): boolean {
    const numericLevel = (l: AnnotationLevel): number => {
      switch (l) {
        case "notice":
          return 1;
        case "warning":
          return 2;
        case "failure":
          return 3;
      }
    };

    return numericLevel(level) >= numericLevel(this.failureThreshold);
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

    if (this.exceedsFailureThreshold(annotation.annotation_level)) {
      this.conclusion = "failure";
    }

    this.annotations.push(annotation);

    if (!this.createNewCheck) {
      // Report the annotation here and now
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
    if (!this.createNewCheck) {
      // Fail the Job if appropriate, and stop here
      if (this.conclusion === "failure") {
        core.setFailed("Failing due to grep results");
      }
      return;
    }

    core.info(
      `Creating Check result with ${this.annotations.length} annotation(s)`,
    );
    return await github.createCheck(
      client,
      "Grep results",
      this.annotations,
      this.conclusion,
    );
  }
}

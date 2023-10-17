import * as core from "@actions/core";
import * as gh from "@actions/github";

import type { Annotation } from "./github";
import * as github from "./github";
import type { GrepResult } from "./grep";
import type { Pattern } from "./config";

type ClientType = ReturnType<typeof gh.getOctokit>;

export class Reporter {
  annotations: Annotation[];
  conclusion: string;

  constructor() {
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
    }
  }

  async onFinish(client: ClientType): Promise<void> {
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
}

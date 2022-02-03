import * as yaml from "js-yaml";
import { Minimatch } from "minimatch";

import type { AnnotationLevel } from "./github";

export type Pattern = {
  pattern: string;
  paths: string[];
  level: AnnotationLevel;
  title: string;
  message: string | null;
};

function fromPatternYaml({ pattern, paths, level, title, message }): Pattern {
  return {
    pattern,
    paths: paths || ["**/*"],
    level: level || "notice",
    title,
    message: message === undefined ? null : message,
  };
}

type PatternYaml = {
  pattern: string;
  paths: string[] | null;
  level: AnnotationLevel | null;
  title: string;
  message: string | null;
};

export function loadPatterns(input: string): Pattern[] {
  const patternsYaml = yaml.load(input) as PatternYaml[];
  return patternsYaml.map(fromPatternYaml);
}

export function matchesAny(pattern: Pattern, file: string): boolean {
  const matchers = pattern.paths.map((p) => new Minimatch(p));
  return matchers.some((m) => m.match(file));
}

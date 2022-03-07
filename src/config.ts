import * as yaml from "js-yaml";
import { Minimatch } from "minimatch";

import type { AnnotationLevel } from "./github";
import type { GrepSyntax } from "./grep";

export type Pattern = {
  pattern: string;
  syntax: GrepSyntax;
  paths: string[];
  pathsIgnore: string[];
  level: AnnotationLevel;
  title: string;
  message: string | null;
};

function fromPatternYaml(patternYaml: PatternYaml): Pattern {
  const { pattern, syntax, paths, level, title, message } = patternYaml;
  const pathsIgnore = patternYaml["paths-ignore"];

  return {
    pattern,
    syntax: syntax || "basic",
    paths: paths || ["**/*"],
    pathsIgnore: pathsIgnore || [],
    level: level || "notice",
    title,
    message: message === undefined ? null : message,
  };
}

type PatternYaml = {
  pattern: string;
  syntax: GrepSyntax | null;
  paths: string[] | null;
  "paths-ignore": string[] | null;
  level: AnnotationLevel | null;
  title: string;
  message: string | null;
};

export function loadPatterns(input: string): Pattern[] {
  const patternsYaml = yaml.load(input) as PatternYaml[];
  return patternsYaml.map(fromPatternYaml);
}

export function matchesAny(pattern: Pattern, file: string): boolean {
  const keepMatchers = pattern.paths.map((p) => new Minimatch(p));
  const discardMatchers = pattern.pathsIgnore.map((p) => new Minimatch(p));
  return (
    keepMatchers.some((m) => m.match(file)) &&
    !discardMatchers.some((m) => m.match(file))
  );
}

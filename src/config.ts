import * as yaml from "js-yaml";
import { Minimatch } from "minimatch";

import type { AnnotationLevel } from "./github";
import type { GrepSyntax, GrepBinaryFiles } from "./grep";

export type Pattern = {
  pattern: string;
  syntax: GrepSyntax;
  binaryFiles: GrepBinaryFiles;
  paths: string[];
  pathsIgnore: string[];
  level: AnnotationLevel;
  title: string;
  message: string | null;
};

function fromPatternYaml(patternYaml: PatternYaml): Pattern {
  const { pattern, syntax, paths, level, title, message } =
    patternYaml;
  const pathsIgnore = patternYaml["paths-ignore"];
  const binaryFiles = patternYaml["binary-files"];

  return {
    pattern,
    syntax: syntax || "basic",
    binaryFiles: binaryFiles || "binary",
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
  "binary-files": GrepBinaryFiles | null;
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

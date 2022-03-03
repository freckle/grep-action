import type { Pattern } from "./config";
import * as config from "./config";
import type { AnnotationLevel } from "./github";
import type { GrepSyntax, GrepBinaryFiles } from "./grep";

test("Loads minimal Patterns", () => {
  const example = [
    "- pattern: abc",
    "  title: Found abc",
    "- pattern: xyz",
    "  title: Found xyz",
  ].join("\n");

  const results = config.loadPatterns(example);

  expect(results).toEqual([
    {
      pattern: "abc",
      syntax: "basic",
      binaryFiles: "binary",
      paths: ["**/*"],
      pathsIgnore: [],
      level: "notice",
      title: "Found abc",
      message: null,
    },
    {
      pattern: "xyz",
      syntax: "basic",
      binaryFiles: "binary",
      paths: ["**/*"],
      pathsIgnore: [],
      level: "notice",
      title: "Found xyz",
      message: null,
    },
  ]);
});

test("Respects paths", () => {
  const example = [
    "- pattern: abc",
    "  paths:",
    "    - '**/*.js'",
    "  title: Found abc",
  ].join("\n");

  const results = config.loadPatterns(example);

  expect(results.length).toBe(1);
  expect(results[0].paths).toEqual(["**/*.js"]);
});

test("Respects syntax", () => {
  const example = [
    "- pattern: abc",
    "  syntax: perl",
    "  title: Found abc",
  ].join("\n");

  const results = config.loadPatterns(example);

  expect(results.length).toBe(1);
  expect(results[0].syntax).toEqual("perl");
});

test("Respects paths-ignore", () => {
  const example = [
    "- pattern: abc",
    "  paths:",
    "    - '**/*.js'",
    "  paths-ignore:",
    "    - '**/*.test.js'",
    "  title: Found abc",
  ].join("\n");

  const results = config.loadPatterns(example);

  expect(results.length).toBe(1);
  expect(results[0].pathsIgnore).toEqual(["**/*.test.js"]);
});

test("Respects level", () => {
  const example = [
    "- pattern: abc",
    "  level: warning",
    "  title: Found abc",
  ].join("\n");

  const results = config.loadPatterns(example);

  expect(results.length).toBe(1);
  expect(results[0].level).toEqual("warning");
});

test("matchesAny", () => {
  const pattern = {
    pattern: "",
    syntax: "basic" as GrepSyntax,
    binaryFiles: "binary" as GrepBinaryFiles,
    paths: ["**/*.js", "**/README.md"],
    pathsIgnore: ["**/*.test.js", "test/**/*"],
    level: "notice" as AnnotationLevel,
    title: "xyz",
    message: null,
  };

  expect(config.matchesAny(pattern, "src/config.js")).toBe(true);
  expect(config.matchesAny(pattern, "src/config.test.js")).toBe(false);
  expect(config.matchesAny(pattern, "doc/README.md")).toBe(true);
  expect(config.matchesAny(pattern, "test/README.md")).toBe(false);
});

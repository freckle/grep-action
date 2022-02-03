import type { Pattern } from "./config";
import * as config from "./config";
import type { AnnotationLevel } from "./github";

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
      paths: ["**/*"],
      level: "notice",
      title: "Found abc",
      message: null,
    },
    {
      pattern: "xyz",
      paths: ["**/*"],
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
    paths: ["**/*.js", "**/README.md"],
    level: "notice" as AnnotationLevel,
    title: "xyz",
    message: null,
  };

  expect(config.matchesAny(pattern, "src/config.js")).toBe(true);
  expect(config.matchesAny(pattern, "doc/README.md")).toBe(true);
});

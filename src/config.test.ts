import type { Pattern } from "./config";
import * as config from "./config";

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
      paths: ["**"],
      level: "notice",
      title: "Found abc",
      message: null,
    },
    {
      pattern: "xyz",
      paths: ["**"],
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
    "    - '**.js'",
    "  title: Found abc",
  ].join("\n");

  const results = config.loadPatterns(example);

  expect(results.length).toBe(1);
  expect(results[0].paths).toEqual(["**.js"]);
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

import * as fs from "fs";

import type { GrepSyntax, GrepResult } from "./grep";
import { grep, parseGrep } from "./grep";

async function grepLines(
  syntax: GrepSyntax,
  pattern: string,
  lines: string[]
): Promise<number[]> {
  const file = "/tmp/grep-action-test-grep.txt";
  fs.writeFileSync(file, lines.join("\n"));
  const results = await grep(syntax, pattern, [file], true);
  return results.map((r) => r.line);
}

test("grep -E", async () => {
  const lines = await grepLines("extended", "\\bfoo( |$)", [
    "Here is a foo",
    "And a foobar",
    "Here is a foo there",
    "And a barfoo",
    "Here is a $foo there",
  ]);

  expect(lines).toEqual([1, 3, 5]);
});

test("grep -F", async () => {
  const lines = await grepLines("fixed", "$foo", [
    "Here is a foo",
    "Here is a $foo",
  ]);

  expect(lines).toEqual([2]);
});

test("grep -G", async () => {
  const lines = await grepLines("basic", "\\<foo\\>", [
    "Here is a foo",
    "And a foobar",
    "Here is a foo there",
    "And a barfoo",
    "Here is a $foo there",
  ]);

  expect(lines).toEqual([1, 3, 5]);
});

test("grep -P", async () => {
  const lines = await grepLines("perl", "[Ff]oo(?!bar)", [
    "Foobar",
    "Foobaz",
    "Foobar",
    "foobat",
  ]);

  expect(lines).toEqual([2, 4]);
});

test("Matches path and column", () => {
  const example = [
    "src/main.ts:32:      core.setFailed(error.message);",
    "src/main.ts:35:      core.setFailed(error);",
    'src/main.ts:38:      core.setFailed("Non-Error exception");',
    "",
  ].join("\n");

  const results = parseGrep(example);

  expect(results).toEqual([
    {
      input: "src/main.ts:32:      core.setFailed(error.message);",
      path: "src/main.ts",
      line: 32,
    },
    {
      input: "src/main.ts:35:      core.setFailed(error);",
      path: "src/main.ts",
      line: 35,
    },
    {
      input: 'src/main.ts:38:      core.setFailed("Non-Error exception");',
      path: "src/main.ts",
      line: 38,
    },
  ]);
});

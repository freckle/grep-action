import type { GrepResult } from "./grep";
import { parseGrep } from "./grep";

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
      tag: "match",
      input: "src/main.ts:32:      core.setFailed(error.message);",
      path: "src/main.ts",
      line: 32,
    },
    {
      tag: "match",
      input: "src/main.ts:35:      core.setFailed(error);",
      path: "src/main.ts",
      line: 35,
    },
    {
      tag: "match",
      input: 'src/main.ts:38:      core.setFailed("Non-Error exception");',
      path: "src/main.ts",
      line: 38,
    },
    { tag: "nomatch", input: "", message: '"" did not match' },
  ]);
});

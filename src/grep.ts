import * as exec from "@actions/exec";

export type GrepResult =
  | {
      tag: "match";
      input: string;
      path: string;
      line: number;
    }
  | { tag: "nomatch"; input: string; message: string };

export async function grep(args: string[]): Promise<GrepResult[]> {
  let stdout = "";

  // Always number lines and never use color
  const grepArgs = ["--line-number", "--color=never"].concat(args);

  // Tricks grep into always adding <file>: by ensuring more than one file arg
  files.push("/dev/null");

  await exec.exec("grep", grepArgs, {
    listeners: {
      stdout: (data: Buffer) => {
        stdout += data.toString();
      },
    },
    ignoreReturnCode: true,
  });

  return parseGrep(stdout);
}

// Exported for testing
export function parseGrep(stdout: string): GrepResult[] {
  // TODO Naive newline split (no Windows)
  return stdout.split("\n").map(parseGrepLine);
}

function parseGrepLine(input: string): GrepResult {
  const regex = /^(?<path>[^:]+):(?<line>[0-9]+):.*$/;
  const match = input.match(regex);

  if (match === null) {
    return {
      tag: "nomatch",
      input,
      message: `"${input}" did not match`,
    };
  }

  const path = match.groups.path;
  const line = parseInt(match.groups.line, 10);

  if (isNaN(line)) {
    return {
      tag: "nomatch",
      input,
      message: `Line (${match.groups.line}) did not parse as Integer`,
    };
  }

  return { tag: "match", input, path, line };
}

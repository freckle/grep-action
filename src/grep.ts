import * as exec from "@actions/exec";

export type GrepSyntax = "extended" | "fixed" | "basic" | "perl";

function grepSyntaxOption(syntax: GrepSyntax): string {
  switch (syntax) {
    case "extended":
      return "--extended-regexp";
    case "fixed":
      return "--fixed-strings";
    case "basic":
      return "--basic-regexp";
    case "perl":
      return "--perl-regexp";
  }
}

export type GrepResult =
  | {
      tag: "match";
      input: string;
      path: string;
      line: number;
    }
  | { tag: "nomatch"; input: string; message: string };

export async function grep(
  syntax: GrepSyntax,
  pattern: string,
  files: string[],
  silent?: boolean
): Promise<GrepResult[]> {
  let stdout = "";

  // Tricks grep into always adding <file>: by ensuring more than one file arg
  files.push("/dev/null");

  const grepArgs = [
    "--line-number",
    "--color=never",
    grepSyntaxOption(syntax),
    pattern,
  ].concat(files);

  await exec.exec("grep", grepArgs, {
    listeners: {
      stdout: (data: Buffer) => {
        stdout += data.toString();
      },
    },
    ignoreReturnCode: true,
    silent: silent || false,
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
    throw new Error(
      `Line number failed to parse. Input: ${input}, Line: ${match.groups.line}`
    );
  }

  return { tag: "match", input, path, line };
}

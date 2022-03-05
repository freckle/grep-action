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

export type GrepResult = {
  input: string;
  path: string;
  line: number;
};

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
  return stdout
    .split("\n")
    .map(parseGrepLine)
    .filter((x: GrepResult | null) => x !== null) as GrepResult[];
}

function parseGrepLine(input: string): GrepResult | null {
  const regex = /^(?<path>[^:]+):(?<line>[0-9]+):.*$/;
  const match = input.match(regex);

  if (match === null || match.groups === undefined) {
    return null;
  }

  const path = match.groups.path;
  const line = parseInt(match.groups.line, 10);

  if (isNaN(line)) {
    return null;
  }

  return { input, path, line };
}

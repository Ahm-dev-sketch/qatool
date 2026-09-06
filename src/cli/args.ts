// Hand-rolled arg parser — no third-party dependencies.
// Handles: --key=value, --key value, --flag forms.

export interface ParsedArgs {
  command: string;
  suite?: string;
  tags: string[];
  help: boolean;
  retries: number;
  parallel: number;
}

export function parseArgs(argv: string[]): ParsedArgs {
  // argv = process.argv.slice(2)
  const result: ParsedArgs = {
    command: "",
    suite: undefined,
    tags: [],
    help: false,
    retries: 0,
    parallel: 1,
  };

  let i = 0;

  // First positional is the command (e.g. "run")
  if (argv.length > 0 && !argv[0].startsWith("--")) {
    result.command = argv[0];
    i = 1;
  }

  while (i < argv.length) {
    const arg = argv[i];

    if (arg === "--help" || arg === "-h") {
      result.help = true;
      i++;
      continue;
    }

    // --key=value form
    if (arg.startsWith("--") && arg.includes("=")) {
      const [rawKey, ...rest] = arg.slice(2).split("=");
      const key = rawKey;
      const value = rest.join("=");
      applyFlag(result, key, value);
      i++;
      continue;
    }

    // --key value form
    if (arg.startsWith("--") && i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      applyFlag(result, key, value);
      i += 2;
      continue;
    }

    // bare --flag (boolean)
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      applyFlag(result, key, "true");
      i++;
      continue;
    }

    i++;
  }

  return result;
}

function applyFlag(args: ParsedArgs, key: string, value: string): void {
  switch (key) {
    case "suite":
      args.suite = value;
      break;
    case "tags":
      // comma-separated: --tags=smoke,regression
      args.tags = value.split(",").map((t) => t.trim()).filter(Boolean);
      break;
    case "help":
      args.help = value !== "false";
      break;
    case "retries":
      args.retries = Math.max(0, parseInt(value, 10) || 0);
      break;
    case "parallel":
      args.parallel = Math.max(1, parseInt(value, 10) || 1);
      break;
    default:
      // unknown flags silently ignored for forward-compatibility
      break;
  }
}
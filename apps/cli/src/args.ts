export interface ParsedArgs {
  command: string;
  subcommand?: string;
  suite?: string;
  tags: string[];
  help: boolean;
  retries: number;
  parallel: number;
  // Load testing args (Phase 2.6)
  url?: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  count: number;
  concurrency: number;
  // Test data generation args (Phase 4.5)
  format: "json" | "csv" | "table";
  fields?: string;
  // GitHub integration args (Phase 4.6)
  githubSync: boolean;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = {
    command: "",
    subcommand: undefined,
    suite: undefined,
    tags: [],
    help: false,
    retries: 0,
    parallel: 1,
    url: undefined,
    method: "GET",
    count: 20,
    concurrency: 5,
    format: "json",
    fields: undefined,
    githubSync: false,
  };

  let i = 0;

  // First positional is the primary command (e.g. "run", "load", "gen")
  if (argv.length > 0 && !argv[0].startsWith("--")) {
    result.command = argv[0];
    i = 1;

    // Second positional for subcommands (e.g. "gen users", "gen products")
    if (argv.length > 1 && !argv[1].startsWith("--")) {
      result.subcommand = argv[1];
      i = 2;
    }
  }

  while (i < argv.length) {
    const arg = argv[i];

    if (arg === "--help" || arg === "-h") {
      result.help = true;
      i++;
      continue;
    }

    if (arg.startsWith("--") && arg.includes("=")) {
      const [rawKey, ...rest] = arg.slice(2).split("=");
      const key = rawKey;
      const value = rest.join("=");
      applyFlag(result, key, value);
      i++;
      continue;
    }

    if (arg.startsWith("--") && i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      applyFlag(result, key, value);
      i += 2;
      continue;
    }

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
      args.tags = value.split(",").map((t) => t.trim()).filter(Boolean);
      break;
    case "retries":
      args.retries = Math.max(0, parseInt(value, 10) || 0);
      break;
    case "parallel":
      args.parallel = Math.max(1, parseInt(value, 10) || 1);
      break;
    case "url":
      args.url = value;
      break;
    case "method":
      args.method = value.toUpperCase() as any;
      break;
    case "count":
      args.count = Math.max(1, parseInt(value, 10) || 20);
      break;
    case "concurrency":
      args.concurrency = Math.max(1, parseInt(value, 10) || 5);
      break;
    case "format":
      args.format = (value.toLowerCase() as any) || "json";
      break;
    case "fields":
      args.fields = value;
      break;
    case "github-sync":
    case "auto-issue":
      args.githubSync = value !== "false";
      break;
    case "help":
      args.help = value !== "false";
      break;
    default:
      break;
  }
}

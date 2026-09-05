/**
 * Voice-guide agent as code.
 *
 *   npm run agent:push     push tools, link their ids into the agent, push the agent
 *   npm run agent:status   show what is tracked locally vs. on the platform
 *   npm run agent -- <any elevenlabs cli args>   pass-through, run inside ./agent
 *
 * Reads the API key from .env.local (ELEVENLABS_API_KEY) or the environment.
 * Config files under ./agent are the raw API bodies; ids are written back
 * into agents.json / tools.json by the CLI after a push.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const agentDir = path.join(root, "agent");

function loadEnvLocal() {
  const file = path.join(root, ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

function cli(args) {
  const result = spawnSync("elevenlabs", args, {
    cwd: agentDir,
    stdio: "inherit",
    env: process.env,
    shell: true,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function readJson(rel) {
  return JSON.parse(readFileSync(path.join(agentDir, rel), "utf8"));
}

function writeJson(rel, value) {
  writeFileSync(path.join(agentDir, rel), JSON.stringify(value, null, 2) + "\n");
}

function linkToolsIntoAgents() {
  const ids = readJson("tools.json").tools.map((t) => t.id).filter(Boolean);
  if (ids.length === 0) {
    console.error("No tool ids in agent/tools.json yet. Did `tools push` succeed?");
    process.exit(1);
  }
  for (const entry of readJson("agents.json").agents) {
    const config = readJson(entry.config);
    config.conversation_config.agent.prompt.tool_ids = ids;
    writeJson(entry.config, config);
    console.log(`Linked ${ids.length} tools into ${entry.config}`);
  }
}

loadEnvLocal();
const [, , command = "push", ...rest] = process.argv;

if (!process.env.ELEVENLABS_API_KEY) {
  console.error("Set ELEVENLABS_API_KEY in .env.local (or the environment) first.");
  process.exit(1);
}

if (command === "push") {
  cli(["tools", "push"]);
  linkToolsIntoAgents();
  cli(["agents", "push"]);
  for (const entry of readJson("agents.json").agents) {
    console.log(`\nAgent from ${entry.config}: ${entry.id ?? "(no id yet)"}`);
    if (entry.id) {
      console.log(`Put this in .env.local and on Vercel:\n  NEXT_PUBLIC_ELEVENLABS_AGENT_ID_EMPLOYEE=${entry.id}`);
    }
  }
} else if (command === "status") {
  cli(["tools", "status"]);
  cli(["agents", "status"]);
} else {
  cli([command, ...rest]);
}

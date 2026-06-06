#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

const APP_NAME = "qrcoding 스킬 설치";
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectRoot = process.cwd();
const skillsRoot = path.join(repoRoot, "skills");
const claudeDestDir = process.env.CLAUDE_SKILLS_DIR || path.join(os.homedir(), ".claude", "skills");
const codexDestDir = process.env.CODEX_SKILLS_DIR || path.join(os.homedir(), ".agents", "skills");
const projectSkillsDir = process.env.QRCODING_PROJECT_SKILLS_DIR || path.join(projectRoot, ".agents", "skills");

const setupOptions = {
  ops: {
    label: "운영용 (기본)",
    description: "운영 코어 + 빠른시작/디자인/분석 라우터 + 연결 스킬을 설치합니다.",
    skills: [
      "qrcoding-campaign-operator",
      "qrcoding-quickstart",
      "qrcoding-designer",
      "qrcoding-analytics",
      "qrcoding-connect",
    ],
  },
  dev: {
    label: "개발용",
    description: "API/MCP/plugin 연동 설계와 ChatGPT-Codex 브리지, 연결 스킬을 설치합니다.",
    skills: ["qrcoding-integration-architect", "qrcoding-chatgpt-codex-bridge", "qrcoding-connect"],
  },
  full: {
    label: "전체",
    description: "운영, 라우터, 연결, 연동 설계, ChatGPT-Codex 브리지 스킬을 모두 설치합니다.",
    skills: [
      "qrcoding-campaign-operator",
      "qrcoding-quickstart",
      "qrcoding-designer",
      "qrcoding-analytics",
      "qrcoding-connect",
      "qrcoding-integration-architect",
      "qrcoding-chatgpt-codex-bridge",
    ],
  },
};

const state = {
  target: "project",
  mode: "ops",
  dest: "",
  apiKey: process.env.QRCODING_API_KEY || "",
  skipKey: false,
};

function printUsage() {
  console.log(`사용법:
  bash install.sh
  bash install.sh --project --mode=full
  bash install.sh --codex --mode=ops
  bash install.sh --claude --mode=dev
  bash install.sh --both --mode=full
  bash install.sh --target=custom --dest=/path/to/skills --mode=full

옵션:
  --project         현재 프로젝트의 .agents/skills에 설치
  --claude          Claude Code 사용자 위치에 설치
  --codex           Codex 사용자 위치에 설치
  --both            Claude Code와 Codex 양쪽에 설치
  --target=<대상>   project, claude, codex, both, custom 중 하나
  --dest=<경로>      --target=custom일 때 사용할 스킬 설치 경로
  --mode=<구성>     dev, ops, full 중 하나
  --api-key=<키>     QRCODING_API_KEY로 저장할 API key
  --skip-key        API key 저장 단계를 건너뜀

환경변수:
  CLAUDE_SKILLS_DIR          Claude Code 스킬 설치 경로
  CODEX_SKILLS_DIR           Codex 스킬 설치 경로
  QRCODING_PROJECT_SKILLS_DIR 프로젝트 스킬 설치 경로
  QRCODING_API_KEY           설치 중 추가 입력 없이 현재 값을 사용`);
}

function parseArgs(args) {
  for (const arg of args) {
    switch (arg) {
      case "--project":
        state.target = "project";
        break;
      case "--claude":
        state.target = "claude";
        break;
      case "--codex":
        state.target = "codex";
        break;
      case "--both":
        state.target = "both";
        break;
      case "--skip-key":
        state.skipKey = true;
        break;
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
        break;
      default:
        if (arg.startsWith("--target=")) {
          const target = arg.slice("--target=".length);
          if (!["project", "claude", "codex", "both", "custom"].includes(target)) {
            throw new Error(`알 수 없는 설치 대상입니다: ${target}`);
          }
          state.target = target;
        } else if (arg.startsWith("--mode=")) {
          const mode = arg.slice("--mode=".length);
          if (!setupOptions[mode]) throw new Error(`알 수 없는 설치 구성입니다: ${mode}`);
          state.mode = mode;
        } else if (arg.startsWith("--dest=")) {
          state.dest = arg.slice("--dest=".length);
        } else if (arg.startsWith("--api-key=")) {
          state.apiKey = arg.slice("--api-key=".length);
        } else if (arg.startsWith("--")) {
          throw new Error(`알 수 없는 옵션입니다: ${arg}`);
        } else if (setupOptions[arg]) {
          state.mode = arg;
        } else {
          throw new Error(`알 수 없는 인자입니다: ${arg}`);
        }
    }
  }
}

function parseFrontmatterValue(content, key) {
  if (!content.startsWith("---\n")) return "";
  const end = content.indexOf("\n---", 4);
  if (end === -1) return "";
  const prefix = `${key}:`;
  for (const line of content.slice(4, end).split(/\r?\n/)) {
    if (!line.startsWith(prefix)) continue;
    return line.slice(prefix.length).trim().replace(/^["']|["']$/g, "");
  }
  return "";
}

function loadSkills() {
  const names = setupOptions[state.mode].skills;
  return names.map((name) => {
    const dir = path.join(skillsRoot, name);
    const skillFile = path.join(dir, "SKILL.md");
    if (!fs.existsSync(skillFile)) throw new Error(`스킬 파일을 찾지 못했습니다: ${skillFile}`);
    const content = fs.readFileSync(skillFile, "utf8");
    return {
      name: parseFrontmatterValue(content, "name") || name,
      description: parseFrontmatterValue(content, "description") || "",
      dir,
    };
  });
}

function copyDirectory(source, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(source, dest, { recursive: true });
}

function installSkillToDir(skill, destDir, label) {
  const target = path.join(destDir, skill.name);
  copyDirectory(skill.dir, target);
  console.log(`- ${label}: ${target}`);
}

function destinationDirs() {
  if (state.target === "project") return [["현재 프로젝트", projectSkillsDir]];
  if (state.target === "codex") return [["Codex", codexDestDir]];
  if (state.target === "claude") return [["Claude Code", claudeDestDir]];
  if (state.target === "both") return [["Codex", codexDestDir], ["Claude Code", claudeDestDir]];
  if (state.target === "custom") {
    if (!state.dest) throw new Error("--target=custom에는 --dest=<경로>가 필요합니다.");
    return [["직접 경로", path.resolve(state.dest.replace(/^~(?=$|\/|\\)/, os.homedir()))]];
  }
  throw new Error(`알 수 없는 설치 대상입니다: ${state.target}`);
}

function shellRcFile() {
  const shell = process.env.SHELL || "";
  if (shell.includes("zsh")) return path.join(os.homedir(), ".zshrc");
  if (shell.includes("bash")) return path.join(os.homedir(), ".bashrc");
  return path.join(os.homedir(), ".profile");
}

function exportLine(name, value) {
  return `export ${name}=${JSON.stringify(value)}`;
}

function writeManagedEnv(file, values) {
  const start = "# BEGIN qrcoding skills";
  const end = "# END qrcoding skills";
  const block = [
    start,
    ...Object.entries(values).map(([key, value]) => exportLine(key, value)),
    end,
  ].join("\n");

  let current = "";
  if (fs.existsSync(file)) current = fs.readFileSync(file, "utf8");
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
  const next = pattern.test(current)
    ? current.replace(pattern, block)
    : `${current}${current.endsWith("\n") || !current ? "" : "\n"}${block}\n`;
  fs.writeFileSync(file, next);
}

async function maybeAskForApiKey() {
  if (state.skipKey || state.apiKey) return;
  if (!process.stdin.isTTY || !process.stdout.isTTY) return;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question("QR Agent Studio API key(qras_...)를 입력하세요. 건너뛰려면 Enter: ");
    state.apiKey = answer.trim();
  } finally {
    rl.close();
  }
}

async function main() {
  parseArgs(process.argv.slice(2));
  await maybeAskForApiKey();

  const skills = loadSkills();
  const dirs = destinationDirs();

  console.log(`${APP_NAME}`);
  console.log(`구성: ${setupOptions[state.mode].label} - ${setupOptions[state.mode].description}`);
  console.log(`대상: ${state.target}`);
  console.log();

  for (const [label, dir] of dirs) {
    fs.mkdirSync(dir, { recursive: true });
    for (const skill of skills) installSkillToDir(skill, dir, label);
  }

  if (state.apiKey) {
    const file = shellRcFile();
    writeManagedEnv(file, {
      QRCODING_API_KEY: state.apiKey,
      QRCODING_MCP_URL: "https://qrcoding-skill-mcp.vercel.app/mcp",
    });
    console.log();
    console.log(`API key 환경변수 저장: ${file}`);
    console.log("새 터미널을 열거나 shell rc 파일을 source 하세요.");
  } else {
    console.log();
    console.log("API key 저장은 건너뛰었습니다. 필요하면 QRCODING_API_KEY를 직접 설정하세요.");
  }

  console.log();
  console.log("MCP 서버까지 설치하려면:");
  console.log("  curl -fsSL https://raw.githubusercontent.com/contentscoin/qrcoding-skill-mcp/main/install-mcp.sh | bash");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

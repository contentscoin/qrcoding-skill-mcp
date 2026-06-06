#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const SERVER_NAME = "qrcoding";
const SERVER_VERSION = "0.2.0";
const DEFAULT_MCP_URL = "https://qrcoding-skill-mcp.vercel.app/mcp";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiGuidePath = path.join(repoRoot, "skills", "qrcoding-integration-architect", "references", "public-api-guide.md");
const pluginGuidePath = path.join(repoRoot, "skills", "qrcoding-integration-architect", "references", "plugin-mcp-guide.md");

if (typeof fetch !== "function") {
  throw new Error("QR Coding MCP 서버는 Node.js 18 이상이 필요합니다.");
}

function mcpUrl() {
  return (process.env.QRCODING_MCP_URL || DEFAULT_MCP_URL).replace(/\/+$/, "");
}

function apiKey() {
  const key = (process.env.QRCODING_API_KEY || "").trim();
  if (!key) {
    throw new Error("QRCODING_API_KEY가 필요합니다. QR Agent Studio 대시보드의 Skills & MCP 패널에서 발급하세요.");
  }
  return key;
}

function textContent(text) {
  return { content: [{ type: "text", text }] };
}

function jsonText(data) {
  return textContent(JSON.stringify(data, null, 2));
}

async function remoteRpc(method, params = {}, { requireKey = false } = {}) {
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  };

  const key = (process.env.QRCODING_API_KEY || "").trim();
  if (key) headers["x-api-key"] = key;
  if (requireKey && !key) apiKey();

  const response = await fetch(mcpUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`MCP 응답을 JSON으로 파싱하지 못했습니다: ${text.slice(0, 300)}`);
  }

  if (!response.ok) {
    throw new Error(JSON.stringify({ status: response.status, error: payload }));
  }
  if (payload.error) {
    throw new Error(payload.error.message || JSON.stringify(payload.error));
  }
  return payload.result;
}

function readReference(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function listReferenceSections() {
  const docs = [
    ["public-api-guide.md", readReference(apiGuidePath)],
    ["plugin-mcp-guide.md", readReference(pluginGuidePath)],
  ];
  return docs.flatMap(([file, guide]) =>
    guide
      .split(/\r?\n/)
      .filter((line) => line.startsWith("## ") || line.startsWith("### "))
      .map((line) => ({ file, title: line.replace(/^#+\s*/, "").trim() })),
  );
}

function referenceSection(title, file = "") {
  const candidates = [
    ["public-api-guide.md", apiGuidePath],
    ["plugin-mcp-guide.md", pluginGuidePath],
  ].filter(([name]) => !file || name === file);

  for (const [name, filePath] of candidates) {
    const guide = readReference(filePath);
    const lines = guide.split(/\r?\n/);
    let start = -1;
    let startLevel = 0;

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (!line.startsWith("## ") && !line.startsWith("### ")) continue;
      const heading = line.replace(/^#+\s*/, "").trim();
      if (heading === title) {
        start = index;
        startLevel = line.match(/^#+/)?.[0].length || 0;
        break;
      }
    }

    if (start === -1) continue;

    let end = lines.length;
    for (let index = start + 1; index < lines.length; index += 1) {
      const line = lines[index];
      if (!line.startsWith("#")) continue;
      const level = line.match(/^#+/)?.[0].length || 0;
      if (level <= startLevel) {
        end = index;
        break;
      }
    }

    return `Source: ${name}\n\n${lines.slice(start, end).join("\n").trim()}`;
  }

  const available = listReferenceSections().map((item) => `${item.file}#${item.title}`).join(", ");
  throw new Error(`섹션을 찾지 못했습니다: ${title}. 사용 가능: ${available}`);
}

function objectSchema(properties, required = []) {
  const schema = {
    type: "object",
    properties,
    additionalProperties: false,
  };
  if (required.length) schema.required = required;
  return schema;
}

const DOC_TOOLS = [
  {
    name: "qrcoding_list_reference_sections",
    description: "QR Agent Studio API, Plugin, MCP reference 문서의 섹션 목록을 보여줍니다.",
    inputSchema: objectSchema({}),
  },
  {
    name: "qrcoding_get_reference_section",
    description: "QR Agent Studio reference 문서의 특정 섹션을 반환합니다.",
    inputSchema: objectSchema({
      title: { type: "string", description: "섹션 제목입니다. 예: Authentication, MCP Client Config" },
      file: { type: "string", description: "선택 사항. public-api-guide.md 또는 plugin-mcp-guide.md" },
    }, ["title"]),
  },
];

const FALLBACK_TOOLS = [
  {
    name: "get_capabilities",
    description:
      "Use this FIRST when unsure what QR Agent Studio can do. Returns supported QR content types, formats, design options, analytics fields, plan limits, and what is NOT supported yet. No API key required.",
    inputSchema: objectSchema({}),
  },
  {
    name: "list_qr_codes",
    description: "List QR codes in the current organization.",
    inputSchema: objectSchema({}),
  },
  {
    name: "create_qr_code",
    description: "Create a QR code. Provide payload (url/text) OR content (structured: wifi, vcard, email, sms, tel, geo, calendar). Dynamic QR needs a URL; structured/text content is static.",
    inputSchema: objectSchema({
      name: { type: "string" },
      type: { type: "string", enum: ["static", "dynamic"] },
      payload: { type: "object" },
      content: { type: "object" },
      destinationUrl: { type: "string" },
      design: { type: "object" },
    }),
  },
  {
    name: "create_qr_batch",
    description: "Create many QR codes at once for a campaign. items[] are create_qr_code inputs; optional projectId tags the batch and defaultDesign (e.g. a logo) applies to all. Returns per-item results.",
    inputSchema: objectSchema({
      projectId: { type: "string" },
      defaultDesign: { type: "object" },
      items: { type: "array", items: { type: "object" } },
    }, ["items"]),
  },
  {
    name: "import_qr_csv",
    description: "Create QR codes from a CSV (header row + name/url/text/type columns). url -> dynamic (or static) URL QR; text -> static text QR. Returns per-row results with source line numbers.",
    inputSchema: objectSchema({
      csv: { type: "string" },
      projectId: { type: "string" },
    }, ["csv"]),
  },
  {
    name: "upload_logo",
    description: "Validate a logo image (png/jpeg/webp base64, not SVG) and return a logoDataUri to pass as design.logoDataUri. Logos render in SVG and force error correction to H.",
    inputSchema: objectSchema({
      data: { type: "string" },
      mime: { type: "string", enum: ["image/png", "image/jpeg", "image/webp"] },
    }, ["data"]),
  },
  {
    name: "render_qr_code",
    description: "Regenerate SVG or PNG from a stored QR spec without storing generated images.",
    inputSchema: objectSchema({
      id: { type: "string" },
      format: { type: "string", enum: ["svg", "png", "pdf"] },
      size: { type: "number" },
      margin: { type: "number" },
    }, ["id"]),
  },
  {
    name: "update_qr_destination",
    description: "Update the destination URL of a dynamic QR code without changing the rendered QR image.",
    inputSchema: objectSchema({
      id: { type: "string" },
      destinationUrl: { type: "string" },
    }, ["id", "destinationUrl"]),
  },
  {
    name: "set_qr_routing",
    description: "Smart routing for a dynamic QR: send people to different URLs by device/country/language/schedule, A/B split, expire after a date, or gate behind a password. Pass routing (rules[], abVariants[], expiresAt, password) or null to clear. Affects all scanners — confirm first.",
    inputSchema: objectSchema({
      id: { type: "string" },
      routing: { type: "object" },
    }, ["id"]),
  },
  {
    name: "archive_qr_code",
    description: "Deactivate/retire a QR code and free a free-plan slot. Future scans see an inactive page. Confirm first.",
    inputSchema: objectSchema({ id: { type: "string" } }, ["id"]),
  },
  {
    name: "get_account_status",
    description: "Return plan and active QR usage for the current organization.",
    inputSchema: objectSchema({}),
  },
  {
    name: "search",
    description: "Search QR codes in the current organization by name or content.",
    inputSchema: objectSchema({ query: { type: "string" } }, ["query"]),
  },
  {
    name: "fetch",
    description: "Fetch full details for a QR code returned by search.",
    inputSchema: objectSchema({ id: { type: "string" } }, ["id"]),
  },
  {
    name: "prepare_qr_for_image",
    description: "Create (if needed) and render a QR code ready to place into a generated image.",
    inputSchema: objectSchema({
      name: { type: "string" },
      payload: { type: "object" },
      destinationUrl: { type: "string" },
      createIfMissing: { type: "boolean" },
    }, ["payload"]),
  },
  {
    name: "get_qr_spec",
    description: "Return the reproducible JSON spec for a QR code.",
    inputSchema: objectSchema({ id: { type: "string" } }, ["id"]),
  },
  {
    name: "compose_qr_overlay",
    description: "Generate AI image overlay instructions for placing a QR code into artwork.",
    inputSchema: objectSchema({ id: { type: "string" } }, ["id"]),
  },
  {
    name: "validate_qr_scanability",
    description: "Validate a QR code's scanability and return a score.",
    inputSchema: objectSchema({ id: { type: "string" } }, ["id"]),
  },
  {
    name: "get_qr_analytics",
    description: "Return scan analytics for one QR code (id) or the whole organization.",
    inputSchema: objectSchema({ id: { type: "string" } }),
  },
  {
    name: "get_qr_analytics_detail",
    description: "Return a scan breakdown (daily time-series, device, country, referrer) for one QR code (id) or the whole organization.",
    inputSchema: objectSchema({ id: { type: "string" }, days: { type: "number" } }),
  },
];

const PROMPTS = [
  {
    name: "qrcoding_campaign_operator",
    description: "QR 생성, 렌더, 검증, 목적지 변경을 수행합니다.",
    arguments: [],
  },
  {
    name: "qrcoding_integration_architect",
    description: "QR Agent Studio API key, MCP, OpenAPI plugin 연동 설계를 돕습니다.",
    arguments: [],
  },
];

async function listTools() {
  try {
    const result = await remoteRpc("tools/list");
    const remoteTools = Array.isArray(result?.tools) ? result.tools : [];
    const remoteNames = new Set(remoteTools.map((tool) => tool.name));
    return { tools: [...remoteTools, ...DOC_TOOLS.filter((tool) => !remoteNames.has(tool.name))] };
  } catch {
    return { tools: [...FALLBACK_TOOLS, ...DOC_TOOLS] };
  }
}

async function callTool(name, args = {}) {
  if (name === "qrcoding_list_reference_sections") return jsonText({ sections: listReferenceSections() });
  if (name === "qrcoding_get_reference_section") return textContent(referenceSection(args.title, args.file));
  // get_capabilities is a public discovery tool — answer it without an API key so
  // an agent can ask what the product can do before the user has connected.
  const requireKey = name !== "get_capabilities";
  return remoteRpc("tools/call", { name, arguments: args }, { requireKey });
}

async function handle(method, params = {}) {
  if (method === "initialize") {
    return {
      protocolVersion: params.protocolVersion || "2025-11-25",
      capabilities: {
        tools: {},
        prompts: {},
      },
      serverInfo: {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
    };
  }

  if (method === "tools/list") return listTools();
  if (method === "tools/call") return callTool(params.name || "", params.arguments || {});
  if (method === "prompts/list") return { prompts: PROMPTS };

  if (method === "prompts/get") {
    if (params.name === "qrcoding_campaign_operator") {
      return {
        description: "QR Coding 캠페인 운영",
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: "QR Coding MCP 도구로 QR 생성, 검색, 렌더, 검증, 동적 목적지 변경을 수행하세요. API key는 절대 출력하지 말고, 상태 변경 작업은 사용자 요청이 명확할 때만 실행하세요.",
          },
        }],
      };
    }

    if (params.name === "qrcoding_integration_architect") {
      return {
        description: "QR Coding API/MCP/Plugin 연동 설계",
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: "qrcoding_get_reference_section 도구로 필요한 API/MCP 섹션을 확인한 뒤 QR Agent Studio API key, MCP, OpenAPI plugin 연동 계획을 설계하세요. 구현 전에는 승인 게이트를 지키세요.",
          },
        }],
      };
    }

    throw new Error(`알 수 없는 prompt입니다: ${params.name}`);
  }

  if (method.startsWith("notifications/")) return null;
  throw new Error(`지원하지 않는 method입니다: ${method}`);
}

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

rl.on("line", async (line) => {
  if (!line.trim()) return;

  let request = {};
  try {
    request = JSON.parse(line);
    if (!("id" in request)) {
      await handle(request.method || "", request.params || {});
      return;
    }

    const result = await handle(request.method || "", request.params || {});
    if (result === null) return;
    send({ jsonrpc: "2.0", id: request.id, result });
  } catch (error) {
    if ("id" in request) {
      send({
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32000,
          message: error.message,
        },
      });
    }
  }
});

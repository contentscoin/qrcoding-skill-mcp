import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "node:http";
import { getQrcodingBaseUrl } from "./config.js";
import { digestSkill, skillMarkdown } from "./skill.js";

type RouteResponse = {
  statusCode: number;
  headers?: Record<string, string>;
  body?: string | Buffer;
};

type RequestLike = Pick<IncomingMessage, "url" | "method" | "headers"> & AsyncIterable<Buffer | string>;

function headerValue(headers: IncomingHttpHeaders, name: string): string | null {
  const value = headers[name];
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export function normalizeUrl(request: Pick<IncomingMessage, "url">): string {
  const originalUrl = request.url ?? "/";
  const parsed = new URL(originalUrl, "http://localhost");
  const rewrittenPath = parsed.searchParams.get("path");
  if (!rewrittenPath) return originalUrl;
  parsed.searchParams.delete("path");
  const query = parsed.searchParams.toString();
  return query ? `${rewrittenPath}${rewrittenPath.includes("?") ? "&" : "?"}${query}` : rewrittenPath;
}

export function getPublicBaseUrl(request: Pick<IncomingMessage, "headers">): string {
  const proto = headerValue(request.headers, "x-forwarded-proto") ?? "https";
  const host = headerValue(request.headers, "x-forwarded-host") ?? headerValue(request.headers, "host") ?? "localhost";
  return (process.env.PUBLIC_BASE_URL ?? `${proto}://${host}`).replace(/\/$/, "");
}

async function readBody(request: AsyncIterable<Buffer | string>): Promise<Buffer | undefined> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return chunks.length > 0 ? Buffer.concat(chunks) : undefined;
}

function json(statusCode: number, payload: unknown): RouteResponse {
  return {
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload)
  };
}

function text(statusCode: number, body: string, contentType = "text/plain; charset=utf-8"): RouteResponse {
  return {
    statusCode,
    headers: { "content-type": contentType },
    body
  };
}

function forwardedHeaders(request: Pick<IncomingMessage, "headers">): Headers {
  const headers = new Headers();
  const passThrough = ["authorization", "content-type", "accept", "x-api-key", "x-locale"];
  for (const name of passThrough) {
    const value = headerValue(request.headers, name);
    if (value) headers.set(name, value);
  }
  return headers;
}

async function proxy(request: RequestLike, targetPath: string): Promise<RouteResponse> {
  const targetUrl = `${getQrcodingBaseUrl()}${targetPath}`;
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await readBody(request);
  const response = await fetch(targetUrl, {
    method: request.method ?? "GET",
    headers: forwardedHeaders(request),
    body: body?.toString("utf8")
  });
  const proxiedBody = Buffer.from(await response.arrayBuffer());
  return {
    statusCode: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/octet-stream"
    },
    body: proxiedBody
  };
}

async function openApi(request: RequestLike): Promise<RouteResponse> {
  const target = await fetch(`${getQrcodingBaseUrl()}/openapi.json`);
  const payload = (await target.json()) as Record<string, unknown>;
  payload.servers = [{ url: getPublicBaseUrl(request) }];
  return json(target.ok ? 200 : target.status, payload);
}

function mcpServerCard(request: RequestLike): RouteResponse {
  const publicBaseUrl = getPublicBaseUrl(request);
  return json(200, {
    serverInfo: {
      name: "qrcoding-skill-mcp",
      title: "qrcoding Skill MCP",
      version: "0.1.0"
    },
    endpoint: `${publicBaseUrl}/mcp`,
    transports: [
      {
        type: "streamable-http",
        endpoint: `${publicBaseUrl}/mcp`
      }
    ],
    capabilities: {
      tools: { listChanged: false },
      resources: {},
      prompts: {}
    },
    authentication: {
      type: "apiKey",
      header: "x-api-key",
      note: "Send a QR Agent Studio API key that starts with qras_."
    },
    upstream: {
      url: getQrcodingBaseUrl()
    }
  });
}

function agentSkillsIndex(request: RequestLike): RouteResponse {
  const publicBaseUrl = getPublicBaseUrl(request);
  const markdown = skillMarkdown(publicBaseUrl, getQrcodingBaseUrl());
  return json(200, {
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: [
      {
        name: "qrcoding",
        type: "skill-md",
        description: "Use QR Agent Studio over MCP with an API key.",
        url: `${publicBaseUrl}/.well-known/agent-skills/qrcoding/SKILL.md`,
        digest: digestSkill(markdown)
      }
    ]
  });
}

export async function handleRequest(request: RequestLike): Promise<RouteResponse> {
  const normalized = normalizeUrl(request);
  const parsed = new URL(normalized, "http://localhost");
  const path = parsed.pathname;

  if (path === "/") {
    return json(200, {
      name: "qrcoding-skill-mcp",
      mcp: "/mcp",
      mcpServerCard: "/.well-known/mcp/server-card.json",
      agentSkills: "/.well-known/agent-skills/index.json",
      openapi: "/openapi.json",
      upstream: getQrcodingBaseUrl()
    });
  }
  if (path === "/health") {
    return json(200, { ok: true, service: "qrcoding-skill-mcp", upstream: getQrcodingBaseUrl() });
  }
  if (path === "/mcp") {
    if (request.method === "GET") {
      return json(200, {
        ok: true,
        transport: "streamable-http-json-rpc",
        endpoint: "/mcp",
        auth: { type: "apiKey", header: "x-api-key" },
        upstream: getQrcodingBaseUrl()
      });
    }
    return proxy(request, `/mcp${parsed.search}`);
  }
  if (path === "/openapi.json") return openApi(request);
  if (path === "/.well-known/mcp/server-card.json") return mcpServerCard(request);
  if (path === "/.well-known/agent-skills/index.json") return agentSkillsIndex(request);
  if (path === "/.well-known/agent-skills/qrcoding/SKILL.md") {
    return text(200, skillMarkdown(getPublicBaseUrl(request), getQrcodingBaseUrl()), "text/markdown; charset=utf-8");
  }
  if (path.startsWith("/v1/")) return proxy(request, `${path}${parsed.search}`);
  return json(404, { code: "not_found", message: "Route not found." });
}

export async function writeResponse(response: ServerResponse, result: RouteResponse): Promise<void> {
  response.statusCode = result.statusCode;
  for (const [key, value] of Object.entries(result.headers ?? {})) {
    response.setHeader(key, value);
  }
  response.end(result.body);
}

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  const result = await handleRequest(request);
  await writeResponse(response, result);
}

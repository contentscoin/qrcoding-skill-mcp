import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "node:http";
import { getQrcodingBaseUrl } from "./config.js";
import { digestSkill, skillArtifacts, skillMarkdown } from "./skill.js";

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

function forwardedHeaders(request: Pick<IncomingMessage, "headers">, apiKeyOverride?: string | null): Headers {
  const headers = new Headers();
  const passThrough = ["authorization", "content-type", "accept", "x-api-key", "x-locale"];
  for (const name of passThrough) {
    const value = headerValue(request.headers, name);
    if (value) headers.set(name, value);
  }
  if (apiKeyOverride) headers.set("x-api-key", apiKeyOverride);
  return headers;
}

async function proxy(request: RequestLike, targetPath: string, apiKeyOverride?: string | null): Promise<RouteResponse> {
  const targetUrl = `${getQrcodingBaseUrl()}${targetPath}`;
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await readBody(request);
  const response = await fetch(targetUrl, {
    method: request.method ?? "GET",
    headers: forwardedHeaders(request, apiKeyOverride),
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

function apiKeyFromEnv(): string | null {
  return process.env.QRCODING_API_KEY?.trim() || null;
}

// The gateway no longer accepts the API key as a URL query parameter — query
// strings leak into CDN/proxy/access logs and browser history. Keys come only
// from the x-api-key header (passed through) or the QRCODING_API_KEY env var on
// this private proxy. Any ?api_key=/?key= is still stripped before forwarding
// (defense-in-depth) but never used.
function apiKeyOverrideForRequest(request: Pick<IncomingMessage, "headers">): string | null {
  return headerValue(request.headers, "x-api-key") ? null : apiKeyFromEnv();
}

function targetPathWithoutQueryAuth(path: string, parsed: URL): string {
  const params = new URLSearchParams(parsed.searchParams);
  params.delete("api_key");
  params.delete("key");
  const query = params.toString();
  return query ? `${path}?${query}` : path;
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
      note: "For Secure MCP Tunnel, set QRCODING_API_KEY on the private MCP proxy so ChatGPT only connects by tunnel_id."
    },
    secureTunnel: {
      recommendedFor: "ChatGPT + Codex",
      environmentVariable: "QRCODING_API_KEY",
      note: "Do not paste qras_ keys or ?api_key= URLs into ChatGPT when using Secure MCP Tunnel."
    },
    upstream: {
      url: getQrcodingBaseUrl()
    }
  });
}

function agentSkillsIndex(request: RequestLike): RouteResponse {
  const publicBaseUrl = getPublicBaseUrl(request);
  const artifacts = skillArtifacts();
  return json(200, {
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: artifacts.map((artifact) => ({
      name: artifact.name,
      type: "skill-md",
      description: artifact.description,
      url: `${publicBaseUrl}/.well-known/agent-skills/${artifact.name}/SKILL.md`,
      digest: digestSkill(artifact.markdown)
    }))
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
      secureTunnel: {
        recommendedFor: "ChatGPT + Codex",
        environmentVariable: "QRCODING_API_KEY",
        note: "Run this gateway as a private MCP proxy behind OpenAI Secure MCP Tunnel."
      },
      upstream: getQrcodingBaseUrl()
    });
  }
  if (path === "/health") {
    return json(200, { ok: true, service: "qrcoding-skill-mcp", upstream: getQrcodingBaseUrl() });
  }
  if (path === "/mcp") {
    const apiKey = apiKeyOverrideForRequest(request);
    if (request.method === "GET") {
      return json(200, {
        ok: true,
        transport: "streamable-http-json-rpc",
        endpoint: "/mcp",
        auth: {
          type: "apiKey",
          header: "x-api-key",
          environmentVariable: "QRCODING_API_KEY",
          note:
            "Recommended for ChatGPT + Codex: use OpenAI Secure MCP Tunnel and keep QRCODING_API_KEY on this private proxy. Send the key via the x-api-key header or the env var — never in the URL (query strings leak into logs)."
        },
        upstream: getQrcodingBaseUrl()
      });
    }
    return proxy(request, targetPathWithoutQueryAuth("/mcp", parsed), apiKey);
  }
  if (path === "/openapi.json") return openApi(request);
  if (path === "/.well-known/mcp/server-card.json") return mcpServerCard(request);
  if (path === "/.well-known/agent-skills/index.json") return agentSkillsIndex(request);
  if (path.startsWith("/.well-known/agent-skills/") && path.endsWith("/SKILL.md")) {
    const name = decodeURIComponent(path.split("/").at(-2) ?? "");
    const artifactName = name === "qrcoding" ? "qrcoding-campaign-operator" : name;
    const artifacts = skillArtifacts();
    if (!artifacts.some((artifact) => artifact.name === artifactName)) {
      return json(404, { code: "not_found", message: "Skill not found." });
    }
    return text(200, skillMarkdown(artifactName), "text/markdown; charset=utf-8");
  }
  if (path.startsWith("/v1/")) {
    return proxy(request, targetPathWithoutQueryAuth(path, parsed), apiKeyOverrideForRequest(request));
  }
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

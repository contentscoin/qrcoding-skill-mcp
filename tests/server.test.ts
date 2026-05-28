import { describe, expect, it, vi } from "vitest";
import { handleRequest, normalizeUrl } from "../src/server";

function request(url: string, init: { method?: string; headers?: Record<string, string>; body?: string } = {}) {
  const chunks = init.body ? [Buffer.from(init.body)] : [];
  return {
    url,
    method: init.method ?? "GET",
    headers: init.headers ?? { host: "skill.example", "x-forwarded-proto": "https" },
    async *[Symbol.asyncIterator]() {
      for (const chunk of chunks) yield chunk;
    }
  };
}

describe("qrcoding skill mcp gateway", () => {
  it("normalizes Vercel path rewrites", () => {
    expect(normalizeUrl({ url: "/api?path=/.well-known/agent-skills/index.json" })).toBe(
      "/.well-known/agent-skills/index.json"
    );
  });

  it("serves MCP server card and Agent Skills discovery", async () => {
    const card = await handleRequest(request("/.well-known/mcp/server-card.json"));
    expect(card.statusCode).toBe(200);
    expect(JSON.parse(String(card.body))).toMatchObject({
      serverInfo: { name: "qrcoding-skill-mcp" },
      endpoint: "https://skill.example/mcp",
      authentication: { type: "apiKey", header: "x-api-key" }
    });

    const index = await handleRequest(request("/.well-known/agent-skills/index.json"));
    expect(index.statusCode).toBe(200);
    expect(JSON.parse(String(index.body)).skills).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "qrcoding-campaign-operator",
          type: "skill-md",
          url: "https://skill.example/.well-known/agent-skills/qrcoding-campaign-operator/SKILL.md"
        }),
        expect.objectContaining({
          name: "qrcoding-integration-architect",
          type: "skill-md",
          url: "https://skill.example/.well-known/agent-skills/qrcoding-integration-architect/SKILL.md"
        }),
        expect.objectContaining({
          name: "qrcoding-chatgpt-codex-bridge",
          type: "skill-md",
          url: "https://skill.example/.well-known/agent-skills/qrcoding-chatgpt-codex-bridge/SKILL.md"
        })
      ])
    );

    const skill = await handleRequest(request("/.well-known/agent-skills/qrcoding-campaign-operator/SKILL.md"));
    expect(String(skill.body)).toContain("x-api-key: <api-key>");
    expect(String(skill.body)).toContain("POST https://skill.example/mcp");

    const legacy = await handleRequest(request("/.well-known/agent-skills/qrcoding/SKILL.md"));
    expect(legacy.statusCode).toBe(200);
    expect(String(legacy.body)).toContain("qrcoding-campaign-operator");

    const bridge = await handleRequest(request("/.well-known/agent-skills/qrcoding-chatgpt-codex-bridge/SKILL.md"));
    expect(String(bridge.body)).toContain("ChatGPT -> Codex Handoff Prompt");
    expect(String(bridge.body)).toContain("Secure MCP Tunnel");
    expect(String(bridge.body)).toContain("QRCODING_API_KEY");
    expect(String(bridge.body)).toContain("<YOUR_QR_AGENT_STUDIO_API_KEY>");
    expect(String(bridge.body)).not.toContain("qras_your_key");
  });

  it("proxies MCP requests with API key headers", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: { tools: [] } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    const response = await handleRequest(
      request("/mcp", {
        method: "POST",
        headers: {
          host: "skill.example",
          "x-api-key": "qras_test",
          accept: "application/json, text/event-stream",
          "content-type": "application/json"
        },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" })
      })
    );

    expect(response.statusCode).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/mcp");
    expect((init?.headers as Headers).get("x-api-key")).toBe("qras_test");
    fetchMock.mockRestore();
  });

  it("accepts a ChatGPT-friendly API key query parameter", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: { tools: [] } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    const response = await handleRequest(
      request("/mcp?api_key=qras_query_secret&session=abc", {
        method: "POST",
        headers: {
          host: "skill.example",
          accept: "application/json, text/event-stream",
          "content-type": "application/json"
        },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" })
      })
    );

    expect(response.statusCode).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/mcp?session=abc");
    expect(String(url)).not.toContain("api_key");
    expect((init?.headers as Headers).get("x-api-key")).toBe("qras_query_secret");
    fetchMock.mockRestore();
  });

  it("uses QRCODING_API_KEY from the private proxy environment when no header or query key is provided", async () => {
    const previousApiKey = process.env.QRCODING_API_KEY;
    process.env.QRCODING_API_KEY = "qras_env_secret";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: { tools: [] } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    const response = await handleRequest(
      request("/mcp", {
        method: "POST",
        headers: {
          host: "skill.example",
          accept: "application/json, text/event-stream",
          "content-type": "application/json"
        },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" })
      })
    );

    expect(response.statusCode).toBe(200);
    const [, init] = fetchMock.mock.calls[0];
    expect((init?.headers as Headers).get("x-api-key")).toBe("qras_env_secret");
    fetchMock.mockRestore();
    if (previousApiKey === undefined) {
      delete process.env.QRCODING_API_KEY;
    } else {
      process.env.QRCODING_API_KEY = previousApiKey;
    }
  });
});

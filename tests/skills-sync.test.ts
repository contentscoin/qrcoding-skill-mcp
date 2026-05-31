import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { skillArtifacts } from "../src/skill";

const root = fileURLToPath(new URL("..", import.meta.url));

describe("skills single source of truth", () => {
  it("bundled markdown matches skills/<name>/SKILL.md (run `npm run bundle:skills` after editing a SKILL.md)", () => {
    for (const artifact of skillArtifacts()) {
      const onDisk = readFileSync(`${root}skills/${artifact.name}/SKILL.md`, "utf8");
      expect(artifact.markdown).toBe(onDisk);
    }
  });

  it("no skill hardcodes a non-gateway qrcoding upstream URL", () => {
    // The gateway (qrcoding-skill-mcp.vercel.app) proxies to the config-managed
    // upstream; skills must never bake in the upstream/preview host directly.
    const nonGatewayUpstream = /https:\/\/qrcoding-(?!skill-mcp\b)[a-z0-9-]+\.vercel\.app/i;
    for (const artifact of skillArtifacts()) {
      expect(artifact.markdown, `${artifact.name} hardcodes a non-gateway upstream URL`).not.toMatch(
        nonGatewayUpstream
      );
    }
  });
});

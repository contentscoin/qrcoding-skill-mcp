import { createHash } from "node:crypto";
import { SKILL_ARTIFACTS, type SkillArtifact } from "./skills.generated.js";

// Skill content has a single source of truth: skills/<name>/SKILL.md, bundled
// into skills.generated.ts by `npm run bundle:skills`. The hosted gateway and
// install.sh therefore serve identical content. URLs are baked into the SKILL.md
// files (the gateway has one canonical URL), so no per-request injection is done.
export type { SkillArtifact };

export function skillArtifacts(): SkillArtifact[] {
  return SKILL_ARTIFACTS;
}

export function skillMarkdown(name = "qrcoding-campaign-operator"): string {
  const artifact = SKILL_ARTIFACTS.find((item) => item.name === name) ?? SKILL_ARTIFACTS[0];
  return artifact.markdown;
}

export function digestSkill(markdown: string): string {
  return `sha256:${createHash("sha256").update(markdown).digest("hex")}`;
}

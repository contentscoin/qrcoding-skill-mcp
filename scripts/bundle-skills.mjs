// Bundles skills/<name>/SKILL.md into src/skills.generated.ts so the hosted
// gateway serves exactly the same skill content that install.sh copies to disk
// — a single source of truth. JSON.stringify handles all escaping, so backticks
// and ${...} in the markdown are preserved verbatim.
//
// Run `npm run bundle:skills` after editing any SKILL.md. A test fails if the
// committed bundle drifts from the SKILL.md files.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillsDir = join(root, "skills");

const names = readdirSync(skillsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const artifacts = names.map((name) => {
  const markdown = readFileSync(join(skillsDir, name, "SKILL.md"), "utf8");
  const frontmatterName = (markdown.match(/^name:\s*(.+)$/m) || [])[1]?.trim() ?? name;
  const description = (markdown.match(/^description:\s*(.+)$/m) || [])[1]?.trim() ?? "";
  return { name: frontmatterName, description, markdown };
});

const out =
  "// AUTO-GENERATED from skills/*/SKILL.md by scripts/bundle-skills.mjs.\n" +
  "// Do not edit by hand. Run `npm run bundle:skills` after editing any SKILL.md.\n\n" +
  "export type SkillArtifact = { name: string; description: string; markdown: string };\n\n" +
  `export const SKILL_ARTIFACTS: SkillArtifact[] = ${JSON.stringify(artifacts, null, 2)};\n`;

writeFileSync(join(root, "src", "skills.generated.ts"), out);
console.log(`Bundled ${artifacts.length} skills -> src/skills.generated.ts:`, names.join(", "));

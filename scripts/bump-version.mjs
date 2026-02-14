import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const BUMP_TYPES = ["patch", "minor", "major"];

const bumpType = process.argv[2];
if (!BUMP_TYPES.includes(bumpType)) {
  console.error(`Usage: node scripts/bump-version.mjs <${BUMP_TYPES.join("|")}>`);
  process.exit(1);
}

// 1. Read current version
const pkgPath = resolve(ROOT, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
const oldVersion = pkg.version;

// 2. Compute new version
const parts = oldVersion.split(".").map(Number);
const idx = BUMP_TYPES.length - 1 - BUMP_TYPES.indexOf(bumpType);
parts[idx] += 1;
for (let i = idx + 1; i < parts.length; i++) parts[i] = 0;
const newVersion = parts.join(".");

console.log(`Bumping version: ${oldVersion} → ${newVersion}\n`);

// 3. Update package.json
const pkgContent = readFileSync(pkgPath, "utf-8");
writeFileSync(pkgPath, pkgContent.replace(`"version": "${oldVersion}"`, `"version": "${newVersion}"`));
console.log("  ✓ package.json");

// 4. Update README.md
const readmePath = resolve(ROOT, "README.md");
const readmeContent = readFileSync(readmePath, "utf-8");
writeFileSync(readmePath, readmeContent.replaceAll(oldVersion, newVersion));
console.log("  ✓ README.md");

// 5. Update CHANGELOG.md
const changelogPath = resolve(ROOT, "CHANGELOG.md");
const changelogContent = readFileSync(changelogPath, "utf-8");
const today = new Date().toISOString().split("T")[0];

if (changelogContent.includes("## TBD")) {
  writeFileSync(changelogPath, changelogContent.replace("## TBD", `## ${newVersion} - ${today}`));
  console.log("  ✓ CHANGELOG.md");
} else {
  console.log("  ⚠ CHANGELOG.md — no '## TBD' section found, skipping");
}

// 6. Git commit + tag + push
console.log("");
execSync(`git add package.json README.md CHANGELOG.md`, { cwd: ROOT, stdio: "inherit" });
execSync(`git commit -m "chore: bump version to ${newVersion}"`, { cwd: ROOT, stdio: "inherit" });
execSync(`git tag ${newVersion}`, { cwd: ROOT, stdio: "inherit" });
execSync(`git push`, { cwd: ROOT, stdio: "inherit" });
execSync(`git push origin ${newVersion}`, { cwd: ROOT, stdio: "inherit" });

console.log(`\nDone! Version bumped to ${newVersion}, tagged, and pushed.`);

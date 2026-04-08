import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("src");
const BARREL_DIRS = new Set();
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function toImportPath(filePath) {
  const relativePath = path.relative(ROOT, filePath).replaceAll(path.sep, "/");
  return `@/${relativePath}`;
}

function toDirImportPath(dirPath) {
  const relativePath = path.relative(ROOT, dirPath).replaceAll(path.sep, "/");
  return relativePath ? `@/${relativePath}` : "@";
}

function collectBarrelDirs(files) {
  for (const filePath of files) {
    if (path.basename(filePath) !== "index.ts") continue;
    BARREL_DIRS.add(path.dirname(filePath));
  }
}

function getBarrelReplacement(importPath) {
  if (!importPath.startsWith("@/components/")) return null;

  const importTarget = importPath.slice(2);
  const segments = importTarget.split("/");
  if (segments.length < 2) return null;

  const fullTargetPath = path.join(ROOT, ...segments);
  if (BARREL_DIRS.has(fullTargetPath)) return null;

  const maybeFile = segments.at(-1) ?? "";
  const maybeDir = segments.slice(0, -1);
  if (!maybeFile || maybeFile === "index") return null;

  const targetDir = path.join(ROOT, ...maybeDir);
  if (!BARREL_DIRS.has(targetDir)) return null;

  return toDirImportPath(targetDir);
}

async function main() {
  const files = (await walk(ROOT)).filter((filePath) =>
    SOURCE_EXTENSIONS.has(path.extname(filePath)),
  );

  collectBarrelDirs(files);

  const violations = [];
  const importPattern =
    /from\s+["'](@\/[^"']+)["']|import\s+["'](@\/[^"']+)["']/g;

  for (const filePath of files) {
    const content = await readFile(filePath, "utf8");
    const relativeFilePath = path.relative(process.cwd(), filePath);

    for (const match of content.matchAll(importPattern)) {
      const importPath = match[1] ?? match[2];
      if (!importPath) continue;

      const replacement = getBarrelReplacement(importPath);
      if (!replacement) continue;

      violations.push(
        `${relativeFilePath}: use "${replacement}" instead of "${importPath}"`,
      );
    }
  }

  if (violations.length === 0) {
    console.log("Barrel import check passed.");
    return;
  }

  console.error("Found direct imports into folders that already expose a barrel:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exitCode = 1;
}

await main();

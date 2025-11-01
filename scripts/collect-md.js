// Collect all Markdown files into a folder, excluding README.md
// Also removes the legacy compiled-docs.md file
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, 'compiled-docs');
const LEGACY_FILE = path.join(ROOT, 'compiled-docs.md');
const EXCLUDE_DIRS = new Set(['node_modules', '.next', 'out', 'build', '.git', '.vercel']);
const EXCLUDE_FILES = new Set(['README.md']);

function* walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

function isMarkdown(filePath) {
  return filePath.toLowerCase().endsWith('.md');
}

function shouldInclude(filePath) {
  const base = path.basename(filePath);
  if (EXCLUDE_FILES.has(base)) return false;
  return isMarkdown(filePath);
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function main() {
  // Remove legacy compiled-docs.md if present
  try {
    if (fs.existsSync(LEGACY_FILE)) {
      fs.unlinkSync(LEGACY_FILE);
      console.log(`Removed legacy file: ${LEGACY_FILE}`);
    }
  } catch (e) {
    console.warn(`Could not remove legacy file: ${LEGACY_FILE}`, e.message);
  }

  // Prepare output directory (clean existing)
  if (fs.existsSync(OUTPUT_DIR)) {
    // Remove directory recursively
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  }
  ensureDir(OUTPUT_DIR);

  // Collect and copy markdown files, preserving relative structure
  let count = 0;
  for (const src of walk(ROOT)) {
    if (!shouldInclude(src)) continue;
    const rel = path.relative(ROOT, src);
    const dest = path.join(OUTPUT_DIR, rel);
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    count++;
  }
  console.log(`Collected ${count} Markdown file(s) into ${OUTPUT_DIR}`);
}

main();
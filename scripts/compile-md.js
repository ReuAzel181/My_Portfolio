// Simple script to concatenate all Markdown files into a single file, excluding README.md
// Usage: npm run compile:md
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const OUTPUT_FILE = path.join(ROOT, 'compiled-docs.md');
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

function compile() {
  const files = [];
  for (const f of walk(ROOT)) {
    if (shouldInclude(f)) files.push(f);
  }
  files.sort();

  const parts = [];
  for (const f of files) {
    const rel = path.relative(ROOT, f).replace(/\\/g, '/');
    const content = fs.readFileSync(f, 'utf8');
    parts.push(`# File: ${rel}\n\n${content.trim()}\n`);
  }

  const final = parts.join('\n\n---\n\n');
  fs.writeFileSync(OUTPUT_FILE, final, 'utf8');
  console.log(`Compiled ${files.length} Markdown file(s) into ${OUTPUT_FILE}`);
}

compile();
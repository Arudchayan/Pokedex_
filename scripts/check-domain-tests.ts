/**
 * Lightweight coverage gate: ensure each domain module is exercised by at least one test.
 * Full istanbul/v8 coverage is intentionally not wired (avoids extra CI deps).
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const domainDir = join(root, 'src/domain');
const modules = readdirSync(domainDir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));

function collectTestFiles(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      collectTestFiles(p, out);
    } else if (/\.test\.(ts|tsx)$/.test(entry.name)) {
      out.push(p);
    }
  }
  return out;
}

const testFiles = [
  ...collectTestFiles(join(root, 'src')),
  ...collectTestFiles(join(root, 'tests')),
];

const missing: string[] = [];
for (const file of modules) {
  const base = file.replace(/\.ts$/, '');
  const importNeedle = `domain/${base}`;
  const colocated = join(domainDir, `${base}.test.ts`);
  const covered =
    existsSync(colocated) ||
    testFiles.some((tf) => {
      const src = readFileSync(tf, 'utf8');
      return src.includes(importNeedle);
    });
  if (!covered) missing.push(file);
}

if (missing.length > 0) {
  console.error('Domain coverage gate failed — missing tests for:');
  for (const m of missing) console.error(`  - src/domain/${m}`);
  process.exit(1);
}

console.log(`Domain coverage gate: OK (${modules.length} modules)`);

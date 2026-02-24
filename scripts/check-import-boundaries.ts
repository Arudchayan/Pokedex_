import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

type Layer =
  | 'store'
  | 'domain'
  | 'context'
  | 'components'
  | 'app'
  | 'services'
  | 'utils'
  | 'types'
  | 'other';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(repoRoot, 'src');

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__snapshots__') continue;
      out.push(...walk(full));
      continue;
    }
    if (!e.isFile()) continue;
    if (!/\.(ts|tsx)$/.test(e.name)) continue;
    if (e.name.endsWith('.d.ts')) continue;
    out.push(full);
  }
  return out;
}

function layerForFile(absPath: string): Layer {
  const rel = path.relative(srcRoot, absPath).replace(/\\/g, '/');
  if (rel.startsWith('store/')) return 'store';
  if (rel.startsWith('domain/')) return 'domain';
  if (rel.startsWith('context/')) return 'context';
  if (rel.startsWith('components/')) return 'components';
  if (rel.startsWith('app/')) return 'app';
  if (rel.startsWith('services/')) return 'services';
  if (rel.startsWith('utils/')) return 'utils';
  if (rel.startsWith('types/')) return 'types';
  return 'other';
}

function resolveImport(fromFile: string, spec: string): string | null {
  // Alias '@/' -> 'src/'
  if (spec.startsWith('@/')) {
    return path.join(srcRoot, spec.slice(2));
  }
  // Bare imports: external modules
  if (!spec.startsWith('.') && !spec.startsWith('/')) return null;
  const base = spec.startsWith('/')
    ? path.join(repoRoot, spec.slice(1))
    : path.resolve(path.dirname(fromFile), spec);

  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
    path.join(base, 'index.js'),
    path.join(base, 'index.jsx'),
  ];

  for (const c of candidates) {
    try {
      const stat = fs.statSync(c);
      if (stat.isFile()) return c;
    } catch {
      // ignore
    }
  }
  return null;
}

const disallow: Record<Layer, Layer[]> = {
  // Store should be pure state + reducers, never UI/integration.
  store: ['components', 'app', 'context', 'services'],

  // Domain should be pure logic, no UI or integration.
  domain: ['components', 'app', 'context', 'services'],

  // Integration layers can depend on domain/store/etc.
  context: [],
  app: [],
  components: [],
  services: [],
  utils: [],
  types: [],
  other: [],
};

function collectModuleSpecifiers(sf: ts.SourceFile): string[] {
  const specs: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      const ms = node.moduleSpecifier;
      if (ms && ts.isStringLiteral(ms)) specs.push(ms.text);
    } else if (ts.isImportEqualsDeclaration(node)) {
      // import foo = require('bar')
      const ref = node.moduleReference;
      if (ts.isExternalModuleReference(ref) && ts.isStringLiteral(ref.expression)) {
        specs.push(ref.expression.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return specs;
}

function main() {
  const files = walk(srcRoot);
  const violations: Array<{
    file: string;
    spec: string;
    to: string;
    fromLayer: Layer;
    toLayer: Layer;
  }> = [];

  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    const sf = ts.createSourceFile(
      file,
      code,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
    const fromLayer = layerForFile(file);
    const disallowedTargets = disallow[fromLayer];
    if (!disallowedTargets.length) continue;

    for (const spec of collectModuleSpecifiers(sf)) {
      const resolved = resolveImport(file, spec);
      if (!resolved) continue;
      if (!resolved.startsWith(srcRoot)) continue;

      const toLayer = layerForFile(resolved);
      if (disallowedTargets.includes(toLayer)) {
        violations.push({
          file: path.relative(repoRoot, file),
          spec,
          to: path.relative(repoRoot, resolved),
          fromLayer,
          toLayer,
        });
      }
    }
  }

  if (violations.length) {
    console.error(`Import boundary violations: ${violations.length}`);
    for (const v of violations) {
      console.error(`- ${v.file}: imports ${v.toLayer} via "${v.spec}" -> ${v.to}`);
    }
    process.exit(1);
  }

  console.log('Import boundary check: OK');
}

main();

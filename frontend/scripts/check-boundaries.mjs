import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const normalize = (file) => file.split(path.sep).join('/');

function owner(file) {
  const parts = normalize(file).split('/');
  if (parts[0] === 'tests') return { layer: 'tests' };
  if (['App.tsx', 'main.ts', 'index.css'].includes(file) || parts[0] === 'app') return { layer: 'app' };
  if (parts[0] === 'features' && parts.length >= 4) {
    return { layer: 'feature', feature: parts[1], section: parts[2] };
  }
  if (['foundation', 'shared', 'utils', 'assets'].includes(parts[0])) return { layer: parts[0] };
  return { layer: 'unknown' };
}

export function boundaryError(source, target) {
  const from = owner(source);
  const to = owner(target);
  if (from.layer === 'tests') return null;
  if (from.layer === 'unknown' || to.layer === 'unknown') return 'Unclassified source location; use a documented layer.';
  if (to.layer === 'tests') return 'Production code cannot import test code.';
  if (from.layer === 'app') return null;
  if (['assets', 'utils'].includes(to.layer)) return null;
  if (from.layer === 'foundation' && to.layer === 'foundation') return null;
  if (from.layer === 'shared' && ['foundation', 'shared'].includes(to.layer)) return null;
  if (from.layer === 'feature') {
    if (['foundation', 'shared'].includes(to.layer)) return null;
    if (to.layer === 'feature' && from.feature === to.feature) {
      if (to.section === 'pages' && from.section !== 'pages') return 'Only pages and application orchestration may import pages.';
      if (['hooks', 'api', 'data', 'types'].includes(from.section) && to.section === 'components') {
        return 'Supporting game/feature logic must not depend on UI components; extract domain types.';
      }
      return null;
    }
  }
  return 'Import crosses an ownership boundary.';
}

export function moduleReferences(sourceFile) {
  const references = [];
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      references.push(node.moduleSpecifier);
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      references.push(node.argument.literal);
    } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
      if (node.moduleReference.expression) references.push(node.moduleReference.expression);
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
    ) {
      if (node.arguments[0]) references.push(node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return references;
}

export function checkProject(projectDir) {
  const srcDir = path.resolve(projectDir, 'src');
  const configPath = path.join(projectDir, 'tsconfig.app.json');
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, projectDir);
  if (parsed.errors.length)
    throw new Error(parsed.errors.map((e) => ts.flattenDiagnosticMessageText(e.messageText, '\n')).join('\n'));
  const files = ts.sys.readDirectory(srcDir, ['.ts', '.tsx', '.js', '.jsx', '.mts', '.mjs', '.cts', '.cjs']);
  const errors = [];
  for (const file of files) {
    const source = normalize(path.relative(srcDir, file));
    if (owner(source).layer === 'tests') continue;
    if (owner(source).layer === 'unknown') errors.push(`${source}: Unclassified source location; use a documented layer.`);
    const ast = ts.createSourceFile(file, ts.sys.readFile(file), ts.ScriptTarget.Latest, true);
    for (const node of moduleReferences(ast)) {
      const line = ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1;
      if (!ts.isStringLiteralLike(node)) {
        errors.push(`${source}:${line}: Module paths must be literals so ownership can be checked.`);
        continue;
      }
      const specifier = node.text.replace(/[?#].*$/, '');
      const resolved = ts.resolveModuleName(specifier, file, parsed.options, ts.sys).resolvedModule;
      const target =
        resolved?.resolvedFileName ?? (specifier.startsWith('.') ? path.resolve(path.dirname(file), specifier) : null);
      if (resolved?.isExternalLibraryImport) continue;
      if (!target) {
        // Bare specifiers must resolve to an installed dependency or a configured local alias.
        errors.push(`${source}:${line}: Cannot resolve module ${node.text}.`);
        continue;
      }
      if (!ts.sys.fileExists(target)) {
        errors.push(`${source}:${line}: Cannot resolve local module ${node.text}.`);
        continue;
      }
      const relativeTarget = normalize(path.relative(srcDir, target));
      const reason = boundaryError(source, relativeTarget);
      if (reason) errors.push(`${source}:${line} -> ${relativeTarget}: ${reason}`);
    }
  }
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = checkProject(path.resolve(fileURLToPath(new URL('..', import.meta.url))));
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('Feature ownership checks passed.');
  }
}

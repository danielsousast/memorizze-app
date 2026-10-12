import fs from "node:fs";
import path from "node:path";

import ts from "typescript";

/**
 * I18NS-03 guard: production code must not carry visible hardcoded text. User-visible
 * strings go through `t(...)` and the catalogs in `src/lib/i18n/locales`.
 */

const SRC = path.join(__dirname);
const EXCLUDED_DIRS = ["lib/i18n/locales", "db", "theme", "testing"];
const TEXT_PROPS = new Set([
  "title",
  "label",
  "subtitle",
  "placeholder",
  "accessibilityLabel",
  "accessibilityHint",
  "message",
  "name",
]);
// Entries are "<relative path>:<text>" for literals that are not user-visible.
const ALLOWLIST = new Set<string>([
  // Brand monogram "M" inside the logo mark; a glyph, not a translatable word.
  "features/profile/screens/welcome-screen.tsx:M",
  // Sample flashcard word in the decorative welcome illustration (hidden from accessibility).
  "features/profile/screens/welcome-screen.tsx:remember",
]);

const LETTERS = /\p{L}/u;
const PROSE = /\s|[^\x00-\x7f]/u;

export type Finding = { line: number; text: string; kind: string };

function stringValue(node: ts.Node | undefined): string | undefined {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isJsxExpression(node)) return stringValue(node.expression);
  return undefined;
}

// `name` also holds route and icon identifiers, so only prose-like values count for it.
function isVisible(prop: string, text: string) {
  if (!LETTERS.test(text)) return false;
  if (prop === "name") return PROSE.test(text.trim());
  return true;
}

export function scanSource(fileName: string, source: string): Finding[] {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const findings: Finding[] = [];
  const report = (node: ts.Node, text: string, kind: string) => {
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    findings.push({ line: line + 1, text, kind });
  };

  function visit(node: ts.Node) {
    if (ts.isJsxText(node)) {
      const text = node.text.trim();
      if (LETTERS.test(text)) report(node, text, "jsx-text");
    } else if (ts.isJsxAttribute(node)) {
      const prop = node.name.getText(sf);
      const text = stringValue(node.initializer);
      if (TEXT_PROPS.has(prop) && text !== undefined && isVisible(prop, text)) {
        report(node, text, `prop:${prop}`);
      }
    } else if (ts.isPropertyAssignment(node)) {
      const prop = node.name.getText(sf).replace(/^["']|["']$/g, "");
      const text = stringValue(node.initializer);
      if (TEXT_PROPS.has(prop) && text !== undefined && isVisible(prop, text)) {
        report(node, text, `key:${prop}`);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);

  for (const statement of sf.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    if (!(statement.declarationList.flags & ts.NodeFlags.Const)) continue;
    for (const decl of statement.declarationList.declarations) {
      const text = stringValue(decl.initializer);
      if (text !== undefined && LETTERS.test(text) && PROSE.test(text.trim())) {
        report(decl, text, "const-message");
      }
    }
  }
  return findings;
}

function productionFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    const rel = path.relative(SRC, full).split(path.sep).join("/");
    if (entry.isDirectory()) {
      return EXCLUDED_DIRS.includes(rel) ? [] : productionFiles(full);
    }
    if (!/\.tsx?$/.test(entry.name)) return [];
    if (/\.test\.tsx?$/.test(entry.name) || entry.name.endsWith(".d.ts")) return [];
    return [full];
  });
}

describe("hardcoded text guard (I18NS-03)", () => {
  it("finds no hardcoded visible text in production code", () => {
    const offenders = productionFiles(SRC).flatMap((file) => {
      const rel = path.relative(SRC, file).split(path.sep).join("/");
      return scanSource(rel, fs.readFileSync(file, "utf8"))
        .filter((f) => !ALLOWLIST.has(`${rel}:${f.text}`))
        .map((f) => `${rel}:${f.line} [${f.kind}] ${JSON.stringify(f.text)}`);
    });

    expect(offenders).toEqual([]);
  });

  it("reports direct JSX text", () => {
    expect(scanSource("f.tsx", "const a = <Text>Olá</Text>;")).toHaveLength(1);
  });

  it("reports literal text props", () => {
    expect(scanSource("f.tsx", 'const a = <Button title="Salvar" />;')).toHaveLength(1);
  });

  it("reports literal text keys and message constants", () => {
    const source = 'const ERR = "Algo deu errado";\nconst o = { label: "Salvar" };';
    expect(scanSource("f.ts", source)).toHaveLength(2);
  });

  it("does not report translated usage", () => {
    const source = 'const a = <Text>{t("x")}</Text>;\nconst b = <Button title={t("x")} testID="save" />;';
    expect(scanSource("f.tsx", source)).toEqual([]);
  });
});

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const root = path.resolve("src");
function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? files(full) : /\.tsx?$/.test(full) && !/\.test\.tsx?$/.test(full) ? [full] : [];
  });
}
function dependencies(file: string) {
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const specifiers: string[] = [];
  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && !node.importClause?.isTypeOnly) {
      const bindings = node.importClause?.namedBindings;
      if (!(bindings && ts.isNamedImports(bindings) && !node.importClause?.name && bindings.elements.every(e => e.isTypeOnly))) specifiers.push(node.moduleSpecifier.text);
    }
    if (ts.isExportDeclaration(node) && !node.isTypeOnly && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) specifiers.push(node.moduleSpecifier.text);
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || node.expression.getText(source) === "require") && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) specifiers.push(node.arguments[0].text);
    ts.forEachChild(node, visit);
  }
  visit(source);
  return specifiers.flatMap(specifier => {
    const target = specifier.startsWith("@/") ? path.join(root, specifier.slice(2)) : specifier.startsWith(".") ? path.resolve(path.dirname(file), specifier) : null;
    if (!target) return [];
    const resolved = [target + ".ts", target + ".tsx", path.join(target, "index.ts"), path.join(target, "index.tsx")].find(existsSync);
    if (!resolved) throw new Error(`Unresolved local module in ${path.relative(root, file)}`);
    return [resolved];
  });
}
describe("Student Portal architecture boundary", () => {
  it("has no frontend calls to retired auth endpoints", () => {
    const frontend = files(root).filter(file => !file.includes(`${path.sep}server${path.sep}`) && !file.includes(`${path.sep}api${path.sep}`));
    for (const file of frontend) expect(readFileSync(file, "utf8"), path.relative(root, file)).not.toMatch(/\/api\/srm\/auth\b/);
  });
  it("active login dependencies cannot initialize Academia or Supabase", () => {
    const pending = ["app/api/srm/login/route.ts", "app/api/srm/session/route.ts"].map(file => path.join(root, file));
    const seen = new Set<string>();
    while (pending.length) {
      const file = pending.pop()!;
      if (seen.has(file)) continue;
      seen.add(file);
      expect(file.replaceAll("\\", "/")).not.toMatch(/\/server\/srm\/|\/server\/env\.ts$|\/lib\/supabase\//);
      pending.push(...dependencies(file));
    }
    expect(seen.size).toBeGreaterThan(5);
  });
  it("retired endpoints return 410 rather than accepting credentials", async () => {
    const { POST } = await import("@/app/api/srm/auth/route");
    const r = POST();
    expect(r.status).toBe(410); expect((await r.json()).code).toBe("ENDPOINT_RETIRED");
  });
});

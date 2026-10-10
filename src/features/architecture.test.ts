import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = __dirname;
const features = readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const isTest = (file: string) => /\.test\.tsx?$/.test(file);
const isHook = (file: string) => /^use-.+\.ts$/.test(file);
const filesIn = (dir: string) =>
  readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);

function hookFiles(feature: string): string[] {
  const dir = join(root, feature);
  const usecases = join(dir, "usecases");
  const inRoot = filesIn(dir).filter(isHook).map((f) => join(dir, f));
  const inUsecases = existsSync(usecases)
    ? filesIn(usecases).filter(isHook).map((f) => join(usecases, f))
    : [];
  return [...inRoot, ...inUsecases];
}

const count = (source: string, pattern: RegExp) =>
  source.match(pattern)?.length ?? 0;

describe("feature architecture", () => {
  it("has at least one feature to check", () => {
    expect(features.length).toBeGreaterThan(0);
  });

  describe.each(features)("%s", (feature) => {
    const dir = join(root, feature);

    it("ARC-01 has interfaces and repository, and only allowed files at the root", () => {
      const files = filesIn(dir);
      expect(files).toEqual(expect.arrayContaining(["interfaces.ts", "repository.ts"]));
      const allowed = ["interfaces.ts", "adapters.ts", "repository.ts", "index.ts"];
      const unexpected = files.filter(
        (f) => !allowed.includes(f) && !isHook(f) && !isTest(f),
      );
      expect(unexpected).toEqual([]);
    });

    it("ARC-05 keeps a single use case at the root and several in usecases/", () => {
      const usecases = join(dir, "usecases");
      const rootHooks = filesIn(dir).filter(isHook);
      if (existsSync(usecases)) {
        expect(filesIn(usecases).filter(isHook).length).toBeGreaterThanOrEqual(2);
        expect(rootHooks).toEqual([]);
      } else {
        expect(rootHooks.length).toBeLessThanOrEqual(1);
      }
    });

    it("ARC-02 makes each hook call React Query once and one repository method", () => {
      const hooks = hookFiles(feature);
      expect(hooks.length).toBeGreaterThan(0);
      for (const file of hooks) {
        const source = readFileSync(file, "utf8");
        const name = file.slice(root.length + 1);
        expect({ name, queries: count(source, /\buse(Query|Mutation)(<[^(]*>)?\(/g) }).toEqual({
          name,
          queries: 1,
        });
        expect({ name, calls: count(source, /\brepository\.\w+\(/g) }).toEqual({
          name,
          calls: 1,
        });
      }
    });
  });
});

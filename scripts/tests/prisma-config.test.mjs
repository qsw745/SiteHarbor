import assert from "node:assert/strict";
import { mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import { loadConfigFromFile } from "@prisma/config";

// The security override changes Prisma's config merger across a major version.
test("Prisma loads nested file configuration with the patched merger", async () => {
  const directory = await realpath(await mkdtemp(path.join(tmpdir(), "siteharbor-prisma-config-")));
  try {
    await writeFile(path.join(directory, "prisma.config.mjs"),
      'export default { schema: "prisma/schema.prisma", migrations: { path: "prisma/migrations" } };\n');
    const result = await loadConfigFromFile({ configRoot: directory });
    assert.equal(result.error, undefined);
    assert.equal(result.config.schema, path.join(directory, "prisma/schema.prisma"));
    assert.equal(result.config.migrations.path, path.join(directory, "prisma/migrations"));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("Prisma's merger handles a circular object without stack exhaustion", () => {
  const prismaRequire = createRequire(import.meta.resolve("@prisma/config"));
  const { deepmerge } = prismaRequire("deepmerge-ts");
  const first = { label: "first" };
  first.self = first;
  const second = { label: "second" };
  second.self = second;
  const merged = deepmerge(first, second);
  assert.equal(merged.label, "second");
  assert.equal(merged.self, merged);
});

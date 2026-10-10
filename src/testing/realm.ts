import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Realm from "realm";

export function openTestRealm(
  schema: Realm.ObjectSchema | Realm.ObjectClass[],
): Realm {
  return new Realm({
    schema: Array.isArray(schema) ? schema : [schema],
    inMemory: true,
    path: join(tmpdir(), `memorizze-test-${randomUUID()}.realm`),
  });
}

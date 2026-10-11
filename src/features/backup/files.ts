import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

const EXPORT_DIR = "backups";

/** Writes the export to the cache, replacing the previous export (BKP-24). Returns its URI. */
export function writeBackupFile(name: string, json: string): string {
  const dir = new Directory(Paths.cache, EXPORT_DIR);
  if (dir.exists) dir.delete();
  dir.create();
  const file = new File(dir, name);
  file.create();
  file.write(json);
  return file.uri;
}

export function deleteBackupFile(uri: string): void {
  const file = new File(uri);
  if (file.exists) file.delete();
}

export async function shareBackupFile(uri: string): Promise<void> {
  await Sharing.shareAsync(uri, { mimeType: "application/json", UTI: "public.json" });
}

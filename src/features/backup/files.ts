import { Directory, File, Paths } from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";

import { MAX_BACKUP_BYTES } from "@/domain/backup";
import { AppError } from "@/domain/errors";

import type { BackupErrorCode } from "./interfaces";

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

/**
 * Opens the system picker and reads the chosen file. `null` means the user cancelled.
 * A file over the limit is refused by its reported size, before it is read (BKP-20).
 */
export async function pickBackupText(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (asset.size !== undefined && asset.size > MAX_BACKUP_BYTES) {
    throw new AppError<BackupErrorCode>("BACKUP_TOO_LARGE");
  }
  return new File(asset.uri).text();
}

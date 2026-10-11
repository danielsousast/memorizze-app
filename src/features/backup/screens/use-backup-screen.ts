import { router } from "expo-router";
import { useCallback } from "react";

import { useToast } from "@/components/toast-provider";
import {
  backupFileName,
  backupStatusLabel,
  formatCount,
  previousBackupLabel,
} from "@/domain/backup";

import { shareBackupFile } from "../files";
import { useBackupCounts } from "../usecases/use-backup-counts";
import { useExportBackup, type ExportedBackup } from "../usecases/use-export-backup";
import { useLastBackup } from "../usecases/use-last-backup";
import { useMarkBackedUp } from "../usecases/use-mark-backed-up";

const EXPORT_ERROR = "Não foi possível exportar.";
const EXPORTED = "Backup exportado";

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/settings");
}

export function useBackupScreen() {
  const counts = useBackupCounts().data;
  const last = useLastBackup().data;
  const exportBackup = useExportBackup();
  const markBackedUp = useMarkBackedUp();
  const toast = useToast();
  const now = new Date();

  const showExportError = useCallback(() => toast.show({ message: EXPORT_ERROR }), [toast]);

  const showExported = useCallback(
    (uri: string) => {
      const share = () => void shareBackupFile(uri).catch(showExportError);
      toast.show({ message: EXPORTED, action: { label: "Compartilhar", onPress: share } });
    },
    [toast, showExportError],
  );

  const recordExport = useCallback(
    ({ uri, at }: ExportedBackup) =>
      markBackedUp.mutate(at, { onSuccess: () => showExported(uri), onError: showExportError }),
    [markBackedUp, showExported, showExportError],
  );

  const onExport = useCallback(
    () => exportBackup.mutate(undefined, { onSuccess: recordExport, onError: showExportError }),
    [exportBackup, recordExport, showExportError],
  );

  // Import arrives with T4; both buttons stay disabled while any operation runs (BKP-22).
  const onImport = useCallback(() => undefined, []);

  return {
    statusLabel: backupStatusLabel(last?.last ?? null, now),
    previousLabel: previousBackupLabel(last?.previous ?? null),
    hasBackup: !!last?.last,
    stats: [
      { value: formatCount(counts?.decks ?? 0), label: "baralhos" },
      { value: formatCount(counts?.cards ?? 0), label: "cartões" },
      { value: formatCount(counts?.reviewLogs ?? 0), label: "revisões" },
    ],
    exportHint: `Gera o arquivo ${backupFileName(now)}`,
    busy: exportBackup.isPending || markBackedUp.isPending,
    onExport,
    onImport,
    goBack,
  };
}

import { router } from "expo-router";
import { useCallback } from "react";

import { useToast } from "@/components/toast-provider/toast-provider";
import {
  backupFileName,
  backupStatusLabel,
  formatCount,
  previousBackupLabel,
} from "@/domain/backup";

import { t } from "@/lib/i18n";

import { shareBackupFile } from "../files";
import { useImportFlow } from "./use-import-flow";
import { useBackupCounts } from "../usecases/use-backup-counts";
import { useExportBackup, type ExportedBackup } from "../usecases/use-export-backup";
import { useLastBackup } from "../usecases/use-last-backup";
import { useMarkBackedUp } from "../usecases/use-mark-backed-up";

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
  const importFlow = useImportFlow();
  const now = new Date();

  const showExportError = useCallback(() => toast.show({ message: t("backupScreen.exportError") }), [toast]);

  const showExported = useCallback(
    (uri: string) => {
      const share = () => void shareBackupFile(uri).catch(showExportError);
      toast.show({
        message: t("backupScreen.exported"),
        action: { label: t("backupScreen.share"), onPress: share },
      });
    },
    [toast, showExportError],
  );

  const recordExport = useCallback(
    ({ uri, at }: ExportedBackup) =>
      markBackedUp.mutate(at, { onSuccess: () => showExported(uri), onError: showExportError }),
    [markBackedUp, showExported, showExportError],
  );

  const { start: startImport } = importFlow;
  const onImport = useCallback(() => void startImport(), [startImport]);

  const onExport = useCallback(
    () => exportBackup.mutate(undefined, { onSuccess: recordExport, onError: showExportError }),
    [exportBackup, recordExport, showExportError],
  );

  return {
    statusLabel: backupStatusLabel(last?.last ?? null, now),
    previousLabel: previousBackupLabel(last?.previous ?? null),
    hasBackup: !!last?.last,
    stats: [
      { value: formatCount(counts?.decks ?? 0), label: t("backupScreen.statDecks") },
      { value: formatCount(counts?.cards ?? 0), label: t("backupScreen.statCards") },
      { value: formatCount(counts?.reviewLogs ?? 0), label: t("backupScreen.statReviews") },
    ],
    exportHint: t("backupScreen.exportHint", { name: backupFileName(now) }),
    busy: exportBackup.isPending || markBackedUp.isPending || importFlow.busy,
    onExport,
    onImport,
    importDialog: importFlow.dialog,
    goBack,
  };
}

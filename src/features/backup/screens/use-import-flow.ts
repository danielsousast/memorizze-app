import { useCallback, useRef, useState } from "react";

import { useToast } from "@/components/toast-provider/toast-provider";
import { parseBackup, replaceMessage, type BackupFile } from "@/domain/backup";
import { t } from "@/lib/i18n";

import { pickBackupText } from "../files";
import { useRestoreBackup } from "../usecases/use-restore-backup";

function invalidMessage(reason: string): string {
  return reason === "newer" ? t("backupScreen.newerFile") : t("backupScreen.invalidFile");
}

/**
 * Pick → validate → confirm → restore. The file is read and validated in full before the
 * dialog opens, so nothing is erased for a bad file (INV-05). Shared by the Backup screen
 * and the welcome screen.
 */
export function useImportFlow() {
  const restore = useRestoreBackup();
  const toast = useToast();
  const [picking, setPicking] = useState(false);
  const [pending, setPending] = useState<BackupFile>();
  const busy = useRef(false);

  const start = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setPicking(true);
    try {
      const text = await pickBackupText();
      if (text === null) return;
      const parsed = parseBackup(text);
      if (parsed.ok) setPending(parsed.backup);
      else toast.show({ message: invalidMessage(parsed.reason) });
    } catch {
      toast.show({ message: t("backupScreen.invalidFile") });
    } finally {
      busy.current = false;
      setPicking(false);
    }
  }, [toast]);

  const cancel = useCallback(() => setPending(undefined), []);

  // The dialog is a Modal that covers the toast, so it closes before `toast.show`.
  const confirm = useCallback(() => {
    if (!pending) return;
    setPending(undefined);
    restore.mutate(pending, {
      onSuccess: () => toast.show({ message: t("backupScreen.restored") }),
      onError: () => toast.show({ message: t("backupScreen.restoreFailed") }),
    });
  }, [pending, restore, toast]);

  return {
    start,
    busy: picking || restore.isPending,
    dialog: {
      visible: pending !== undefined,
      message: pending ? replaceMessage(pending) : "",
      onConfirm: confirm,
      onCancel: cancel,
    },
  };
}

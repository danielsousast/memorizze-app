import { useCallback, useRef, useState } from "react";

import { useToast } from "@/components/toast-provider";
import { parseBackup, replaceMessage, type BackupFile } from "@/domain/backup";

import { pickBackupText } from "../files";
import { useRestoreBackup } from "../usecases/use-restore-backup";

const INVALID_FILE = "Arquivo inválido. Escolha um backup do Memorizze.";
const NEWER_FILE = "Este backup é de uma versão mais nova do app.";
const RESTORE_FAILED = "Não foi possível restaurar. Seus dados não foram alterados.";
const RESTORED = "Backup restaurado";

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
      else toast.show({ message: parsed.reason === "newer" ? NEWER_FILE : INVALID_FILE });
    } catch {
      toast.show({ message: INVALID_FILE });
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
      onSuccess: () => toast.show({ message: RESTORED }),
      onError: () => toast.show({ message: RESTORE_FAILED }),
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

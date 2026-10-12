import { ConfirmDialog } from "@/components/confirm-dialog";
import { t } from "@/lib/i18n";

import type { useImportFlow } from "./use-import-flow";

type Props = { dialog: ReturnType<typeof useImportFlow>["dialog"] };

export function ImportConfirmDialog({ dialog }: Props) {
  return (
    <ConfirmDialog
      icon="download"
      tone="destructive"
      title={t("backupScreen.dialogTitle")}
      confirmLabel={t("backupScreen.dialogConfirm")}
      {...dialog}
    />
  );
}

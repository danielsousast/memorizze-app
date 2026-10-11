import { ConfirmDialog } from "@/components/confirm-dialog";

import type { useImportFlow } from "./use-import-flow";

type Props = { dialog: ReturnType<typeof useImportFlow>["dialog"] };

export function ImportConfirmDialog({ dialog }: Props) {
  return (
    <ConfirmDialog
      icon="download"
      tone="destructive"
      title="Importar backup?"
      confirmLabel="Substituir"
      {...dialog}
    />
  );
}

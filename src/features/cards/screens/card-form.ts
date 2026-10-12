import { router } from "expo-router";

import { AppError } from "@/domain/errors";
import { t } from "@/lib/i18n";

export type FieldErrors = { front?: string; back?: string };

export function closeEditor(fallbackHref: string) {
  if (router.canGoBack()) router.back();
  else router.replace(fallbackHref as never);
}

export function closeToHome() {
  closeEditor("/");
}

export function toFieldErrors(error: unknown): { errors?: FieldErrors; formError?: string } {
  if (error instanceof AppError && error.code === "CARD_FRONT_EMPTY") {
    return { errors: { front: t("card.frontEmpty") } };
  }
  if (error instanceof AppError && error.code === "CARD_BACK_EMPTY") {
    return { errors: { back: t("card.backEmpty") } };
  }
  return { formError: t("common.saveFailed") };
}

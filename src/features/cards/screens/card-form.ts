import { router } from "expo-router";

import { AppError } from "@/domain/errors";

export type FieldErrors = { front?: string; back?: string };

const GENERIC_ERROR = "Não foi possível salvar. Tente de novo.";

export function closeEditor(fallbackHref: string) {
  if (router.canGoBack()) router.back();
  else router.replace(fallbackHref as never);
}

export function closeToHome() {
  closeEditor("/");
}

export function toFieldErrors(error: unknown): { errors?: FieldErrors; formError?: string } {
  if (error instanceof AppError && error.code === "CARD_FRONT_EMPTY") {
    return { errors: { front: "Escreva a frente do cartão." } };
  }
  if (error instanceof AppError && error.code === "CARD_BACK_EMPTY") {
    return { errors: { back: "Escreva o verso do cartão." } };
  }
  return { formError: GENERIC_ERROR };
}

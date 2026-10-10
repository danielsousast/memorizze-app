import type { ProfileErrorCode } from "../interfaces";

export const NAME_ERRORS: Partial<Record<ProfileErrorCode, string>> = {
  PROFILE_NAME_EMPTY: "Digite seu nome.",
  PROFILE_NAME_TOO_LONG: "Use no máximo 30 caracteres.",
};

export const GENERIC_ERROR = "Não foi possível salvar. Tente de novo.";

/** Maps a thrown error to a field message, or `undefined` when it is not a name error. */
export function nameErrorMessage(error: unknown): string | undefined {
  const code = (error as { code?: ProfileErrorCode } | null)?.code;
  return code ? NAME_ERRORS[code] : undefined;
}

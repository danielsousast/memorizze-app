import { t } from "@/lib/i18n";

import type { ProfileErrorCode } from "../interfaces";

const NAME_ERROR_KEYS: Partial<Record<ProfileErrorCode, string>> = {
  PROFILE_NAME_EMPTY: "profile.nameEmpty",
  PROFILE_NAME_TOO_LONG: "profile.nameTooLong",
};

export function genericError(): string {
  return t("common.saveFailed");
}

/** Maps a thrown error to a field message, or `undefined` when it is not a name error. */
export function nameErrorMessage(error: unknown): string | undefined {
  const code = (error as { code?: ProfileErrorCode } | null)?.code;
  const key = code ? NAME_ERROR_KEYS[code] : undefined;
  return key ? t(key) : undefined;
}

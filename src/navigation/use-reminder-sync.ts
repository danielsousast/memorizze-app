import { useEffect } from "react";

import { useProfile } from "@/features/profile";
import { useSyncReminder } from "@/features/reminder";

/**
 * Keeps the scheduled reminder in line with the saved one: on open, and whenever the
 * profile changes under it (Sair, restore, a permission revoked in system settings).
 * Waits for the profile read so a slow start never cancels a good schedule.
 */
export function useReminderSync() {
  const { data: profile, isPending } = useProfile();
  const { mutate: sync } = useSyncReminder();
  const id = profile?.id;
  const enabled = profile?.reminderEnabled;
  const hour = profile?.reminderHour;

  useEffect(() => {
    if (!isPending) sync();
  }, [isPending, sync, id, enabled, hour]);
}

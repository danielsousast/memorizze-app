export type ReminderScheduler = {
  /** Creates the Android channel, then asks for permission when the system still allows it. */
  ensurePermission(): Promise<boolean>;
  /** Reads the permission without asking. */
  hasPermission(): Promise<boolean>;
  /** Replaces any scheduled reminder with a daily one at `hour`:00. */
  schedule(hour: number): Promise<void>;
  cancel(): Promise<void>;
};

export type ReminderInput = { enabled?: boolean; hour?: number };

/** `"denied"`: the system refused notifications, so nothing was scheduled or saved. */
export type ReminderOutcome = "saved" | "denied";

export type ReminderRepository = {
  apply(input: ReminderInput): Promise<ReminderOutcome>;
  /** Makes the scheduled reminder match the saved one. Resolves `true` when it changed the saved one. */
  sync(): Promise<boolean>;
};

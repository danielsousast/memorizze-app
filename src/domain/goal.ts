export const GOAL_MIN = 5;
export const GOAL_MAX = 200;
export const GOAL_STEP = 5;

// Next or previous multiple of GOAL_STEP, kept inside GOAL_MIN..GOAL_MAX.
export function stepGoal(goal: number, direction: 1 | -1): number {
  const aligned =
    direction === 1
      ? (Math.floor(goal / GOAL_STEP) + 1) * GOAL_STEP
      : (Math.ceil(goal / GOAL_STEP) - 1) * GOAL_STEP;
  return Math.min(GOAL_MAX, Math.max(GOAL_MIN, aligned));
}

export function canStep(goal: number, direction: 1 | -1): boolean {
  return direction === 1 ? goal < GOAL_MAX : goal > GOAL_MIN;
}

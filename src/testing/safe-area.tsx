import type { ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 34 },
};

/** Gives components that read safe-area insets a fixed 390×844 window in tests. */
export function SafeArea({ children }: { children: ReactNode }) {
  return <SafeAreaProvider initialMetrics={initialMetrics}>{children}</SafeAreaProvider>;
}

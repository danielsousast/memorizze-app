import { Stack } from "expo-router";

import { useProfile } from "@/features/profile";
import { useTheme } from "@/theme";

/**
 * Root navigator. Without a profile only the welcome route exists; with one the rest of
 * the app does (AD-004). It renders nothing until the profile read finishes (ENT-03).
 */
export function RootStack() {
  const { colors } = useTheme();
  const { data: profile, isPending } = useProfile();

  if (isPending) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Protected guard={!profile}>
        <Stack.Screen name="welcome" />
      </Stack.Protected>
      <Stack.Protected guard={!!profile}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="decks/new" options={{ presentation: "modal" }} />
        <Stack.Screen name="decks/[deckId]/edit" options={{ presentation: "modal" }} />
        <Stack.Screen name="decks/[deckId]/cards/new" options={{ presentation: "modal" }} />
        <Stack.Screen name="cards/[cardId]/edit" options={{ presentation: "modal" }} />
      </Stack.Protected>
    </Stack>
  );
}

import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { RealmProvider } from "@realm/react";
import { QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Text } from "react-native";

import { RealmErrorBoundary, realmConfig } from "@/db";
import { createQueryClient } from "@/lib/query-client";
import { RootStack } from "@/navigation/root-stack";

export const unstable_settings = { anchor: "(tabs)" };

SplashScreen.preventAutoHideAsync();

const queryClient = createQueryClient();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <RealmErrorBoundary>
      <RealmProvider
        {...realmConfig}
        fallback={() => <Text>Abrindo banco de dados…</Text>}
      >
        <QueryClientProvider client={queryClient}>
          <RootStack />
        </QueryClientProvider>
      </RealmProvider>
    </RealmErrorBoundary>
  );
}

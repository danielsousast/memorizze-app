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

import { ToastProvider } from "@/components/toast-provider";
import { RealmErrorBoundary, realmConfig } from "@/db";
import { t } from "@/lib/i18n";
import { useLocaleSync } from "@/lib/i18n/use-locale-sync";
import { configureNotificationHandler } from "@/lib/notifications";
import { createQueryClient } from "@/lib/query-client";
import { RootStack } from "@/navigation/root-stack";

export const unstable_settings = { anchor: "(tabs)" };

SplashScreen.preventAutoHideAsync();
configureNotificationHandler();

const queryClient = createQueryClient();

function DatabaseLoading() {
  return <Text>{t("navigation.loadingDb")}</Text>;
}

export default function RootLayout() {
  const locale = useLocaleSync();
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
        fallback={DatabaseLoading}
      >
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <RootStack key={locale} />
          </ToastProvider>
        </QueryClientProvider>
      </RealmProvider>
    </RealmErrorBoundary>
  );
}

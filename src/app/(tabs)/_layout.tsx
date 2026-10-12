import { Tabs } from "expo-router/js-tabs";

import { Icon } from "@/components/icon/icon";
import { t } from "@/lib/i18n";
import { fontFamily, useTheme } from "@/theme";

export const unstable_settings = { anchor: "index" };

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.text2,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fontFamily.semibold },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("navigation.tabHome"),
          tabBarIcon: ({ color, size }) => <Icon name="house" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("navigation.tabProfile"),
          tabBarIcon: ({ color, size }) => <Icon name="person" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

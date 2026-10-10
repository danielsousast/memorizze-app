import { Tabs } from "expo-router/js-tabs";

export const unstable_settings = { anchor: "index" };

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Início" }} />
    </Tabs>
  );
}

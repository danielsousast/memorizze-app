import { StyleSheet, Text } from "react-native";

import { Screen } from "@/components/screen";
import { screenMargin, typography, useTheme } from "@/theme";

export function ProfileScreen() {
  const { colors } = useTheme();
  return (
    <Screen testID="profile-screen" style={styles.body}>
      <Text accessibilityRole="header" style={[typography.title, { color: colors.text }]}>
        Perfil
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({ body: { paddingHorizontal: screenMargin } });

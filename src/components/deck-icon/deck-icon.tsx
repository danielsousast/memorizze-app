import { StyleSheet, Text, View } from "react-native";

import { initials } from "@/domain/text";
import { radii, sizes, typography, useTheme } from "@/theme";

export function DeckIcon({ name }: { name: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.box, { backgroundColor: colors.accentSoft }]}>
      <Text style={[typography.caption, { color: colors.accentInk }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: sizes.deckIcon,
    height: sizes.deckIcon,
    borderRadius: radii.icon,
    alignItems: "center",
    justifyContent: "center",
  },
});

import { StyleSheet, Text, View } from "react-native";

import { radii, sizes, typography, useTheme } from "@/theme";

// TEMPORARY: T1 owns `initials` in `@/domain/text`. At integration, replace this
// local copy with `import { initials } from "@/domain/text"`.
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "#";
  const letters = words.length === 1 ? Array.from(words[0]).slice(0, 2) : [Array.from(words[0])[0], Array.from(words[1])[0]];
  const text = letters.join("").toUpperCase();
  return /[\p{L}\p{N}]/u.test(text) ? text : "#";
}

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

import { SymbolView } from "expo-symbols";
import type { ColorValue } from "react-native";

const symbols = {
  plus: { ios: "plus", android: "add", web: "add" },
  "chevron-left": { ios: "chevron.left", android: "chevron_left", web: "chevron_left" },
  more: { ios: "ellipsis", android: "more_horiz", web: "more_horiz" },
  search: { ios: "magnifyingglass", android: "search", web: "search" },
  check: { ios: "checkmark", android: "check", web: "check" },
  close: { ios: "xmark", android: "close", web: "close" },
  calendar: { ios: "calendar", android: "calendar_today", web: "calendar_today" },
  flame: { ios: "flame", android: "local_fire_department", web: "local_fire_department" },
  house: { ios: "house", android: "home", web: "home" },
  person: { ios: "person", android: "person", web: "person" },
  minus: { ios: "minus", android: "remove", web: "remove" },
  bulb: { ios: "lightbulb", android: "lightbulb", web: "lightbulb" },
  trash: { ios: "trash", android: "delete", web: "delete" },
  "sign-out": {
    ios: "rectangle.portrait.and.arrow.right",
    android: "logout",
    web: "logout",
  },
} as const;

export type IconName = keyof typeof symbols;

type Props = { name: IconName; size?: number; color?: ColorValue };

export function Icon({ name, size = 20, color }: Props) {
  return (
    <SymbolView
      name={symbols[name]}
      size={size}
      tintColor={color}
      weight="semibold"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

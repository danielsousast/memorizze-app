import type { TextStyle } from "react-native";

export const fontFamily = {
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
} as const;

const style = (
  family: keyof typeof fontFamily,
  fontSize: number,
  lineHeight: number,
  extra: TextStyle = {},
): TextStyle => ({ fontFamily: fontFamily[family], fontSize, lineHeight, ...extra });

export const typography = {
  card: style("extrabold", 46, 54, { letterSpacing: -1 }),
  display: style("extrabold", 34, 40, { letterSpacing: -0.7 }),
  title: style("extrabold", 30, 38, { letterSpacing: -0.6 }),
  section: style("extrabold", 20, 26, { letterSpacing: -0.3 }),
  button: style("bold", 17, 24),
  body: style("medium", 16, 24),
  caption: style("semibold", 13, 20),
  label: style("extrabold", 12, 16, { letterSpacing: 1.2, textTransform: "uppercase" }),
} satisfies Record<string, TextStyle>;

export const tabularNums: TextStyle = { fontVariant: ["tabular-nums"] };

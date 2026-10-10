import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/theme";

type Props = ViewProps & { children: ReactNode; keyboardAvoiding?: boolean };

export function Screen({ children, keyboardAvoiding = false, style, ...rest }: Props) {
  const { colors } = useTheme();
  const body = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {children}
    </KeyboardAvoidingView>
  ) : (
    children
  );
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }, style]} {...rest}>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });

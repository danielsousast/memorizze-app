import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { TextField } from "@/components/text-field";
import { ImportConfirmDialog } from "@/features/backup";
import { radii, screenMargin, spacing, typography, useTheme } from "@/theme";

import { useWelcomeForm } from "./use-welcome-form";

const NAME_MAX = 30;

export function WelcomeScreen() {
  const { colors } = useTheme();
  const form = useWelcomeForm();

  return (
    <Screen keyboardAvoiding>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <View style={[styles.logo, { backgroundColor: colors.accent }]}>
            <Text style={[typography.section, { color: colors.onAccent }]}>M</Text>
          </View>
          <Text style={[typography.section, { color: colors.text }]}>Memorizze</Text>
        </View>

        <View
          testID="welcome-illustration"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[typography.label, { color: colors.text2 }]}>Frente</Text>
          <Text style={[typography.card, { color: colors.text }]}>remember</Text>
          <Text style={[typography.caption, { color: colors.accentInk }]}>Próxima revisão em 4 dias</Text>
        </View>

        <View style={styles.copy}>
          <Text accessibilityRole="header" style={[typography.display, { color: colors.text }]}>
            Lembre mais, estudando menos.
          </Text>
          <Text style={[typography.body, { color: colors.text2 }]}>
            Flashcards com repetição espaçada. Poucos minutos por dia, no seu ritmo.
          </Text>
        </View>

        <TextField
          label="Como podemos te chamar?"
          placeholder="Seu nome ou apelido"
          value={form.name}
          onChangeText={form.setName}
          maxLength={NAME_MAX}
          error={form.nameError}
          returnKeyType="done"
          onSubmitEditing={form.submit}
        />
        {form.formError ? (
          <Text accessibilityRole="alert" style={[typography.caption, { color: colors.grade.again.text }]}>
            {form.formError}
          </Text>
        ) : null}
        <Button label="Começar" disabled={form.pending} onPress={form.submit} />
        <Button
          label="Já tenho um backup"
          variant="text"
          disabled={form.pending || form.importBusy}
          onPress={form.importBackup}
        />
      </ScrollView>
      <ImportConfirmDialog dialog={form.importDialog} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: screenMargin, gap: spacing.xl },
  brand: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  logo: {
    width: 40,
    height: 40,
    borderRadius: radii.icon,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: radii.studyCard,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
  },
  copy: { gap: spacing.md, marginBottom: spacing.xl },
});

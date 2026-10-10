import { useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { TextField } from "@/components/text-field";
import { radii, screenMargin, spacing, typography, useTheme } from "@/theme";

import { useCreateProfile } from "../usecases/use-create-profile";
import { GENERIC_ERROR, nameErrorMessage } from "./name-errors";

const NAME_MAX = 30;

export function WelcomeScreen() {
  const { colors } = useTheme();
  const create = useCreateProfile();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const busy = useRef(false);

  async function start() {
    if (busy.current) return;
    busy.current = true;
    setNameError(undefined);
    setFormError(undefined);
    try {
      await create.mutateAsync(name);
    } catch (error) {
      const message = nameErrorMessage(error);
      if (message) setNameError(message);
      else setFormError(GENERIC_ERROR);
    } finally {
      busy.current = false;
    }
  }

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

        <View style={styles.badges}>
          <Badge text="100% offline" tone="outline" icon="check" />
          <Badge text="Sem login" tone="outline" icon="check" />
          <Badge text="Dados só no aparelho" tone="outline" icon="check" />
        </View>

        <TextField
          label="Como podemos te chamar?"
          placeholder="Seu nome ou apelido"
          value={name}
          onChangeText={setName}
          maxLength={NAME_MAX}
          error={nameError}
          returnKeyType="done"
          onSubmitEditing={start}
        />
        {formError ? (
          <Text accessibilityRole="alert" style={[typography.caption, { color: colors.grade.again.text }]}>
            {formError}
          </Text>
        ) : null}
        <Button label="Começar" disabled={create.isPending} onPress={start} />
      </ScrollView>
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
  copy: { gap: spacing.md },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});

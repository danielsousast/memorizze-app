import { router } from "expo-router";
import { useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { TextField } from "@/components/text-field";
import { screenMargin, spacing, typography, useTheme } from "@/theme";

import { useProfile } from "../usecases/use-profile";
import { useUpdateProfile } from "../usecases/use-update-profile";
import { GENERIC_ERROR, nameErrorMessage } from "./name-errors";

const NAME_MAX = 30;

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace("/profile");
}

export function EditNameScreen() {
  const { colors } = useTheme();
  const profile = useProfile().data;
  const update = useUpdateProfile();
  const [name, setName] = useState(profile?.name ?? "");
  const [nameError, setNameError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const busy = useRef(false);

  async function save() {
    if (busy.current) return;
    busy.current = true;
    setNameError(undefined);
    setFormError(undefined);
    try {
      await update.mutateAsync({ name });
      leave();
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
      <View style={styles.header}>
        <Button label="Cancelar" variant="text" onPress={leave} />
        <Text accessibilityRole="header" style={[typography.section, { color: colors.text }]}>
          Editar nome
        </Text>
        <Button label="Salvar" disabled={update.isPending} onPress={save} />
      </View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <TextField
          label="Nome"
          value={name}
          onChangeText={setName}
          maxLength={NAME_MAX}
          error={nameError}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={save}
        />
        {formError ? (
          <Text accessibilityRole="alert" style={[typography.caption, { color: colors.grade.again.text }]}>
            {formError}
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: screenMargin,
    paddingVertical: spacing.md,
  },
  body: { padding: screenMargin, gap: spacing.xl },
});

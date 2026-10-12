import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { TextField } from "@/components/text-field";
import { t } from "@/lib/i18n";
import { screenMargin, spacing, typography, useTheme } from "@/theme";

import { useEditNameForm } from "./use-edit-name-form";

const NAME_MAX = 30;

export function EditNameScreen() {
  const { colors } = useTheme();
  const form = useEditNameForm();

  return (
    <Screen keyboardAvoiding>
      <View style={styles.header}>
        <Button label={t("common.cancel")} variant="text" onPress={form.cancel} />
        <Text accessibilityRole="header" style={[typography.section, { color: colors.text }]}>
          {t("profile.editTitle")}
        </Text>
        <Button label={t("common.save")} disabled={form.pending} onPress={form.submit} />
      </View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <TextField
          label={t("profile.nameLabel")}
          value={form.name}
          onChangeText={form.setName}
          maxLength={NAME_MAX}
          error={form.nameError}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={form.submit}
        />
        {form.formError ? (
          <Text accessibilityRole="alert" style={[typography.caption, { color: colors.grade.again.text }]}>
            {form.formError}
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

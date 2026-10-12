import { act, fireEvent, screen, waitFor } from "expo-router/testing-library";
import { StyleSheet } from "react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { createStudyRepository } from "@/features/study/repository";
import { resetFakeScheduler } from "@/testing/notifications";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import app from "../../../../app.json";
import ProfileRoute from "../../../app/(tabs)/profile";
import SettingsRoute from "../../../app/settings";

import { openSystemSettings } from "@/lib/notifications";

// jest-expo exposes an empty expoConfig, so the app.json version is injected.
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: jest.requireActual("../../../../app.json").expo.version } },
}));

jest.mock("@/lib/notifications", () => jest.requireActual("@/testing/notifications").notificationsModuleMock);

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];
const routes = { profile: ProfileRoute, settings: SettingsRoute };

describe("SettingsScreen", () => {
  let realm: Realm;
  let fake: ReturnType<typeof resetFakeScheduler>;
  beforeEach(() => {
    realm = openTestRealm(models);
    fake = resetFakeScheduler({ permission: "granted" });
    realm.write(() => {
      realm.create(Profile, { name: "Ana", createdAt: new Date(2026, 2, 15) });
    });
  });
  afterEach(() => {
    jest.restoreAllMocks();
    realm.close();
  });

  const open = (url = "/settings") => renderRouterWithProviders(routes, realm, url);
  const stored = () => realm.objects(Profile)[0];

  it("SET-01 the gear opens Ajustes and the back link returns to Perfil", async () => {
    const rendered = await open("/profile");
    await fireEvent.press(await screen.findByRole("button", { name: "Configurações" }));
    expect(await screen.findByText("Ajustes")).toBeTruthy();
    expect(rendered).toHavePathname("/settings");

    await fireEvent.press(screen.getByRole("button", { name: "Perfil" }));
    await waitFor(() => expect(rendered).toHavePathname("/profile"));
    await rendered.unmount();
  });

  it("SET-01 shows the Aparência and Estudo sections", async () => {
    const rendered = await open();
    expect(await screen.findByText("Ajustes")).toBeTruthy();
    expect(screen.getByText("Aparência")).toBeTruthy();
    expect(screen.getByText("Estudo")).toBeTruthy();
    expect(screen.getByText("Tema")).toBeTruthy();
    expect(await screen.findByRole("button", { name: "Cartões novos por dia, 10" })).toBeTruthy();
    await rendered.unmount();
  });

  it("SET-02 shows the app version", async () => {
    const rendered = await open();
    expect(await screen.findByText(`Memorizze ${app.expo.version}`)).toBeTruthy();
    await rendered.unmount();
  });

  it("THM-01 THM-03 starts on Automático and explains it", async () => {
    const rendered = await open();
    expect(await screen.findByRole("radio", { name: "Automático", checked: true })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Claro", checked: false })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Escuro", checked: false })).toBeTruthy();
    expect(screen.getByText("Automático acompanha o tema do sistema.")).toBeTruthy();
    await rendered.unmount();
  });

  it("THM-02 choosing a theme persists it and selects it", async () => {
    const rendered = await open();
    await fireEvent.press(await screen.findByRole("radio", { name: "Escuro" }));
    await waitFor(() => expect(screen.getByRole("radio", { name: "Escuro", checked: true })).toBeTruthy());
    expect(stored().themePreference).toBe("dark");
    await rendered.unmount();
  });

  it("NEW-01 the row opens the sheet with the options and the current one selected", async () => {
    const rendered = await open();
    await fireEvent.press(await screen.findByRole("button", { name: "Cartões novos por dia, 10" }));
    const names = screen
      .getAllByRole("button")
      .map((b) => b.props.accessibilityLabel)
      .filter((n: string) => ["5", "10", "20", "30", "50", "Sem limite"].includes(n));
    expect(names).toEqual(["5", "10", "20", "30", "50", "Sem limite"]);
    expect(screen.getByRole("button", { name: "10", selected: true })).toBeTruthy();
    await rendered.unmount();
  });

  it("NEW-01 choosing an option saves it, closes the sheet and updates the row", async () => {
    const rendered = await open();
    await fireEvent.press(await screen.findByRole("button", { name: "Cartões novos por dia, 10" }));
    await fireEvent.press(screen.getByRole("button", { name: "20" }));
    expect(await screen.findByRole("button", { name: "Cartões novos por dia, 20" })).toBeTruthy();
    expect(stored().newCardsPerDay).toBe(20);
    expect(screen.queryByRole("button", { name: "Cancelar" })).toBeNull();
    await rendered.unmount();
  });

  it("NEW-01 Sem limite is stored as no limit", async () => {
    const rendered = await open();
    await fireEvent.press(await screen.findByRole("button", { name: "Cartões novos por dia, 10" }));
    await fireEvent.press(screen.getByRole("button", { name: "Sem limite" }));
    expect(await screen.findByRole("button", { name: "Cartões novos por dia, Sem limite" })).toBeTruthy();
    expect(stored().newCardsPerDay).toBe(0);
    await rendered.unmount();
  });

  it("NEW-06 the next queue follows the new limit", async () => {
    realm.write(() => {
      const deck = realm.create(Deck, { name: "D", createdAt: new Date(2026, 0, 1), cards: [] });
      for (let i = 0; i < 12; i++) {
        deck.cards.push(
          realm.create(Card, { front: `c${i}`, back: "b", dueDate: new Date(2020, 0, 1), createdAt: new Date(2026, 0, 1, 0, i) }),
        );
      }
    });
    expect(createStudyRepository(realm).queue()).toHaveLength(10);

    const rendered = await open();
    await fireEvent.press(await screen.findByRole("button", { name: "Cartões novos por dia, 10" }));
    await fireEvent.press(screen.getByRole("button", { name: "Sem limite" }));
    await screen.findByRole("button", { name: "Cartões novos por dia, Sem limite" });

    expect(createStudyRepository(realm).queue()).toHaveLength(12);
    await rendered.unmount();
  });

  it("SET-04 a failed save shows a toast and keeps the previous theme", async () => {
    const rendered = await open();
    const radio = await screen.findByRole("radio", { name: "Claro" });
    jest.spyOn(realm, "write").mockImplementation(() => {
      throw new Error("boom");
    });
    await fireEvent.press(radio);
    expect(await screen.findByText("Não foi possível salvar.")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Automático", checked: true })).toBeTruthy();
    expect(stored().themePreference).toBe("system");
    await rendered.unmount();
  });

  it("SET-04 a failed limit save shows a toast and keeps the previous value", async () => {
    const rendered = await open();
    await fireEvent.press(await screen.findByRole("button", { name: "Cartões novos por dia, 10" }));
    const option = screen.getByRole("button", { name: "30" });
    jest.spyOn(realm, "write").mockImplementation(() => {
      throw new Error("boom");
    });
    await fireEvent.press(option);
    expect(await screen.findByText("Não foi possível salvar.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cartões novos por dia, 10" })).toBeTruthy();
    await rendered.unmount();
  });

  it("keeps the back link at 44pt or more", async () => {
    const rendered = await open();
    const back = await screen.findByRole("button", { name: "Perfil" });
    expect(StyleSheet.flatten(back.props.style).minHeight).toBeGreaterThanOrEqual(44);
    await rendered.unmount();
  });

  describe("reminder", () => {
    const switchName = { name: "Lembrete diário" };
    // Horário is disabled until the profile loads with the reminder on.
    const openRow = () => screen.findByRole("button", { name: "Horário, 19:00", disabled: false });
    const enable = () =>
      realm.write(() => {
        stored().reminderEnabled = true;
      });

    it("REM-01 shows Lembrete diário, Horário and Cartões novos por dia in this order", async () => {
      const rendered = await open();
      await screen.findByText("Lembrete diário");
      expect(screen.getByText("Notificação local, funciona offline")).toBeTruthy();
      expect(screen.getByRole("switch", { ...switchName, checked: false })).toBeTruthy();
      const titles = ["Lembrete diário", "Horário", "Cartões novos por dia"];
      const order = screen
        .getAllByText(/^(Lembrete diário|Horário|Cartões novos por dia)$/)
        .map((node) => node.props.children);
      expect(order).toEqual(titles);
      expect(screen.getByRole("button", { name: /^Horário, 19:00$/ })).toBeTruthy();
      await rendered.unmount();
    });

    it("REM-03 with the reminder off Horário is disabled and does not open the sheet", async () => {
      const rendered = await open();
      const row = await screen.findByRole("button", { name: "Horário, 19:00", disabled: true });
      await fireEvent.press(row);
      expect(screen.queryByRole("button", { name: "06:00" })).toBeNull();
      await rendered.unmount();
    });

    it("REM-04 REM-05 turning the switch on asks, schedules at 19 and keeps it on", async () => {
      fake.setPermission("undetermined");
      const rendered = await open();
      await fireEvent(await screen.findByRole("switch", switchName), "valueChange", true);

      expect(await screen.findByRole("switch", { ...switchName, checked: true })).toBeTruthy();
      expect(fake.state.prompts).toBe(1);
      expect(fake.state.scheduledHour).toBe(19);
      expect(stored().reminderEnabled).toBe(true);
      expect(screen.getByRole("button", { name: "Horário, 19:00", disabled: false })).toBeTruthy();
      await rendered.unmount();
    });

    it("REM-06 turning the switch off cancels the notification", async () => {
      enable();
      const rendered = await open();
      await fake.scheduler.schedule(19);
      await fireEvent(await screen.findByRole("switch", { ...switchName, checked: true }), "valueChange", false);

      expect(await screen.findByRole("switch", { ...switchName, checked: false })).toBeTruthy();
      expect(fake.state.scheduledHour).toBeNull();
      expect(stored().reminderEnabled).toBe(false);
      await rendered.unmount();
    });

    it("REM-09 the sheet lists 06:00 to 22:00 with the current hour marked; picking one saves and closes", async () => {
      enable();
      const rendered = await open();
      await fireEvent.press(await openRow());
      const hours = screen
        .getAllByRole("button")
        .map((b) => b.props.accessibilityLabel)
        .filter((name: string) => /^\d\d:00$/.test(name));
      expect(hours).toEqual(
        Array.from({ length: 17 }, (_, i) => `${String(6 + i).padStart(2, "0")}:00`),
      );
      expect(screen.getByRole("button", { name: "19:00", selected: true })).toBeTruthy();

      await fireEvent.press(screen.getByRole("button", { name: "08:00" }));

      expect(await screen.findByRole("button", { name: "Horário, 08:00" })).toBeTruthy();
      expect(stored().reminderHour).toBe(8);
      expect(fake.state.scheduledHour).toBe(8);
      expect(screen.queryByRole("button", { name: "06:00" })).toBeNull();
      await rendered.unmount();
    });

    it("REM-15 a refused permission leaves the switch off and offers Abrir ajustes", async () => {
      fake.setPermission("blocked");
      const rendered = await open();
      await fireEvent(await screen.findByRole("switch", switchName), "valueChange", true);

      expect(
        await screen.findByText("Ative as notificações nas configurações do aparelho."),
      ).toBeTruthy();
      expect(screen.getByRole("switch", { ...switchName, checked: false })).toBeTruthy();
      expect(stored().reminderEnabled).toBe(false);

      await fireEvent.press(screen.getByRole("button", { name: "Abrir ajustes" }));
      expect(openSystemSettings).toHaveBeenCalledTimes(1);
      await rendered.unmount();
    });

    it("REM-17 a failed save puts the switch back and shows a toast", async () => {
      const rendered = await open();
      const toggle = await screen.findByRole("switch", switchName);
      fake.failNext("schedule");
      await fireEvent(toggle, "valueChange", true);

      expect(await screen.findByText("Não foi possível salvar.")).toBeTruthy();
      expect(screen.getByRole("switch", { ...switchName, checked: false })).toBeTruthy();
      expect(stored().reminderEnabled).toBe(false);
      await rendered.unmount();
    });

    it("REM-17 a failed hour change keeps the previous hour and shows a toast", async () => {
      enable();
      const rendered = await open();
      await fireEvent.press(await openRow());
      const option = screen.getByRole("button", { name: "07:00" });
      fake.failNext("schedule");
      await fireEvent.press(option);

      expect(await screen.findByText("Não foi possível salvar.")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Horário, 19:00" })).toBeTruthy();
      expect(stored().reminderHour).toBe(19);
      await rendered.unmount();
    });

    it("REM-19 ignores new taps on the switch and on Horário while a change is running", async () => {
      enable();
      const rendered = await open();
      const toggle = await screen.findByRole("switch", { ...switchName, checked: true });
      const release = fake.holdNext("cancel");
      await fireEvent(toggle, "valueChange", false);
      // React Query publishes the pending state on a timer (faked by the router test renderer).
      await act(async () => {
        await jest.advanceTimersByTimeAsync(10);
      });
      await fireEvent(toggle, "valueChange", false);
      await fireEvent.press(screen.getByRole("button", { name: "Horário, 19:00" }));
      expect(screen.queryByRole("button", { name: "06:00" })).toBeNull();

      release();
      await waitFor(() => expect(stored().reminderEnabled).toBe(false));
      expect(fake.state.scheduledHour).toBeNull();
      await rendered.unmount();
    });
  });
});

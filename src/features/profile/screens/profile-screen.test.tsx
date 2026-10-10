import { fireEvent, screen, waitFor } from "expo-router/testing-library";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import HomeRoute from "../../../app/(tabs)/index";
import TabsLayout from "../../../app/(tabs)/_layout";
import ProfileRoute from "../../../app/(tabs)/profile";

const models = [
  Profile,
  Deck,
  Card,
  ReviewLog,
] as unknown as Realm.ObjectClass[];
const routes = { profile: ProfileRoute };
const tabRoutes = {
  "(tabs)/_layout": TabsLayout,
  "(tabs)/index": HomeRoute,
  "(tabs)/profile": ProfileRoute,
};

describe("ProfileScreen", () => {
  let realm: Realm;
  beforeEach(() => {
    realm = openTestRealm(models);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    realm.close();
  });

  function seed(dailyGoal: number, reviewsToday: number) {
    realm.write(() => {
      realm.create(Profile, {
        name: "marina",
        dailyGoal,
        createdAt: new Date(2026, 2, 15),
      });
      for (let i = 0; i < reviewsToday; i++) {
        realm.create(ReviewLog, {
          cardId: new Realm.BSON.ObjectId(),
          deckId: new Realm.BSON.ObjectId(),
          grade: 2,
          reviewedAt: new Date(),
        });
      }
    });
  }

  const open = () => renderRouterWithProviders(routes, realm, "/profile");

  it("PRF-01 shows title, avatar initial, name and since date", async () => {
    seed(20, 0);
    const rendered = await open();
    expect(
      await screen.findByText("Estudando desde março de 2026"),
    ).toBeTruthy();
    expect(screen.getByText("Perfil")).toBeTruthy();
    expect(screen.getByText("M")).toBeTruthy();
    expect(screen.getByText("marina")).toBeTruthy();
    await rendered.unmount();
  });

  it("PRF-02 shows the goal card with value and reviews today", async () => {
    seed(30, 18);
    const rendered = await open();
    expect(await screen.findByText("18 de 30")).toBeTruthy();
    expect(screen.getByText("Meta diária")).toBeTruthy();
    expect(screen.getByText("revisões por dia")).toBeTruthy();
    expect(screen.getByText("30")).toBeTruthy();
    expect(screen.getByText("Revisões hoje")).toBeTruthy();
    await rendered.unmount();
  });

  it("PRF-03 the header is a button labelled with the name", async () => {
    seed(20, 0);
    const rendered = await open();
    expect(
      await screen.findByRole("button", { name: "Editar nome, marina" }),
    ).toBeTruthy();
    await rendered.unmount();
  });

  const goal = () => realm.objects(Profile)[0].dailyGoal;

  it("GOL-01 plus and minus step the goal by 5 and save it", async () => {
    seed(20, 0);
    const rendered = await open();
    await fireEvent.press(await screen.findByRole("button", { name: "Aumentar meta" }));
    expect(await screen.findByText("25")).toBeTruthy();
    expect(goal()).toBe(25);
    await fireEvent.press(screen.getByRole("button", { name: "Diminuir meta" }));
    expect(await screen.findByText("20")).toBeTruthy();
    expect(goal()).toBe(20);
    await rendered.unmount();
  });

  it("GOL-02 the buttons are disabled at the limits", async () => {
    seed(200, 0);
    const max = await open();
    expect(
      (await screen.findByRole("button", { name: "Aumentar meta" })).props.accessibilityState
        .disabled,
    ).toBe(true);
    expect(
      screen.getByRole("button", { name: "Diminuir meta" }).props.accessibilityState.disabled,
    ).toBe(false);
    await max.unmount();
    realm.write(() => {
      realm.objects(Profile)[0].dailyGoal = 5;
    });
    const min = await open();
    expect(
      (await screen.findByRole("button", { name: "Diminuir meta" })).props.accessibilityState
        .disabled,
    ).toBe(true);
    await min.unmount();
  });

  it("GOL-03 the buttons and the value have accessible labels", async () => {
    seed(30, 0);
    const rendered = await open();
    expect(await screen.findByRole("button", { name: "Aumentar meta" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Diminuir meta" })).toBeTruthy();
    expect(screen.getByLabelText("Meta diária, 30 revisões por dia")).toBeTruthy();
    await rendered.unmount();
  });

  it("GOL-04 the new goal shows on the home tab", async () => {
    seed(20, 0);
    const rendered = await renderRouterWithProviders(tabRoutes, realm, "/profile");
    await fireEvent.press(await screen.findByRole("button", { name: "Aumentar meta" }));
    await waitFor(() => expect(goal()).toBe(25));
    await fireEvent.press((await screen.findByLabelText(/^Início, tab/)));
    expect(await screen.findByText("0 de 25 revisões")).toBeTruthy();
    await rendered.unmount();
  });

  it("GOL-05 an off-step goal is shown as is and steps to the next multiple", async () => {
    seed(23, 0);
    const rendered = await open();
    expect(await screen.findByText("23")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Aumentar meta" }));
    expect(await screen.findByText("25")).toBeTruthy();
    expect(goal()).toBe(25);
    await rendered.unmount();
  });

  it("ERR-01 a failed save shows the error and keeps the old goal", async () => {
    seed(20, 0);
    const rendered = await open();
    const plus = await screen.findByRole("button", { name: "Aumentar meta" });
    jest.spyOn(realm, "write").mockImplementation(() => {
      throw new Error("boom");
    });
    await fireEvent.press(plus);
    expect(await screen.findByText("Não foi possível salvar. Tente de novo.")).toBeTruthy();
    expect(goal()).toBe(20);
    expect(screen.getByText("20")).toBeTruthy();
    await rendered.unmount();
  });

  it("HOM-07 reviews today refresh when the Perfil tab regains focus", async () => {
    seed(20, 0);
    const rendered = await renderRouterWithProviders(tabRoutes, realm, "/profile");
    expect(await screen.findByText("0 de 20")).toBeTruthy();
    await fireEvent.press((await screen.findByLabelText(/^Início, tab/)));
    await screen.findByTestId("home-screen");
    realm.write(() => {
      realm.create(ReviewLog, {
        cardId: new Realm.BSON.ObjectId(),
        deckId: new Realm.BSON.ObjectId(),
        grade: 2,
        reviewedAt: new Date(),
      });
    });
    await fireEvent.press((await screen.findByLabelText(/^Perfil, tab/)));
    expect(await screen.findByText("1 de 20")).toBeTruthy();
    await rendered.unmount();
  });
  function logs(count: number, grade: number, daysAgo = 0) {
    realm.write(() => {
      for (let i = 0; i < count; i++) {
        const reviewedAt = new Date();
        reviewedAt.setDate(reviewedAt.getDate() - daysAgo);
        realm.create(ReviewLog, {
          cardId: new Realm.BSON.ObjectId(),
          deckId: new Realm.BSON.ObjectId(),
          grade,
          reviewedAt,
        });
      }
    });
  }

  it("SEQ-01 shows the current streak, singular for one day", async () => {
    seed(20, 0);
    for (let d = 0; d < 12; d++) logs(1, 2, d);
    const rendered = await open();
    expect(await screen.findByLabelText("Sequência atual, 12 dias")).toBeTruthy();
    await rendered.unmount();
    realm.write(() => realm.delete(realm.objects(ReviewLog)));
    logs(1, 2);
    const again = await open();
    expect(await screen.findByLabelText("Sequência atual, 1 dia")).toBeTruthy();
    await again.unmount();
  });

  it("SEQ-02 shows the longest streak, 0 dias without reviews", async () => {
    seed(20, 0);
    for (let d = 10; d < 51; d++) logs(1, 2, d);
    const rendered = await open();
    expect(await screen.findByLabelText("Maior sequência, 41 dias")).toBeTruthy();
    expect(screen.getByText("41 dias")).toBeTruthy();
    await rendered.unmount();
    realm.write(() => realm.delete(realm.objects(ReviewLog)));
    const empty = await open();
    expect(await screen.findByLabelText("Maior sequência, 0 dias")).toBeTruthy();
    await empty.unmount();
  });

  it("ACC-01 ACC-02 show the accuracy per window", async () => {
    seed(20, 0);
    logs(87, 2);
    logs(13, 0);
    const rendered = await open();
    expect(await screen.findByLabelText("Acerto 7 dias, 87%")).toBeTruthy();
    expect(screen.getByLabelText("Acerto 30 dias, 87%")).toBeTruthy();
    await rendered.unmount();
    realm.write(() => realm.delete(realm.objects(ReviewLog)));
    logs(84, 2, 20);
    logs(16, 0, 20);
    const older = await open();
    expect(await screen.findByLabelText("Acerto 30 dias, 84%")).toBeTruthy();
    expect(screen.getByText("84%")).toBeTruthy();
    await older.unmount();
  });

  it("ACC-04 shows a dash without reviews", async () => {
    seed(20, 0);
    const rendered = await open();
    expect(await screen.findByLabelText("Acerto 7 dias, —")).toBeTruthy();
    expect(screen.getByLabelText("Acerto 30 dias, —")).toBeTruthy();
    await rendered.unmount();
  });

  it("ERR-01 a failed stats read replaces only the stats section", async () => {
    seed(20, 0);
    const objects = realm.objects.bind(realm);
    jest.spyOn(realm, "objects").mockImplementation(((type: unknown) => {
      if (type === Card) throw new Error("boom");
      return objects(type as never);
    }) as never);
    const rendered = await open();
    expect(
      await screen.findByText("Não foi possível carregar as estatísticas."),
    ).toBeTruthy();
    expect(screen.getByText("Meta diária")).toBeTruthy();
    expect(screen.queryByText("Maior sequência")).toBeNull();
    await rendered.unmount();
  });

  it("UPD-01 stats refresh when the Perfil tab regains focus", async () => {
    seed(20, 0);
    const rendered = await renderRouterWithProviders(tabRoutes, realm, "/profile");
    expect(await screen.findByLabelText("Sequência atual, 0 dias")).toBeTruthy();
    await fireEvent.press(await screen.findByLabelText(/^Início, tab/));
    await screen.findByTestId("home-screen");
    logs(4, 2);
    await fireEvent.press(await screen.findByLabelText(/^Perfil, tab/));
    expect(await screen.findByLabelText("Sequência atual, 1 dia")).toBeTruthy();
    expect(screen.getByLabelText("Acerto 7 dias, 100%")).toBeTruthy();
    await rendered.unmount();
  });
});

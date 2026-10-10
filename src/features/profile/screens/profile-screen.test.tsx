import { screen } from "expo-router/testing-library";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import ProfileRoute from "../../../app/(tabs)/profile";

const models = [
  Profile,
  Deck,
  Card,
  ReviewLog,
] as unknown as Realm.ObjectClass[];
const routes = { profile: ProfileRoute };

describe("ProfileScreen", () => {
  let realm: Realm;
  beforeEach(() => {
    realm = openTestRealm(models);
  });
  afterEach(() => {
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
});

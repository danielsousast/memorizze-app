import { fireEvent, screen, waitFor } from "expo-router/testing-library";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import HomeRoute from "../../../app/(tabs)/index";
import ProfileRoute from "../../../app/(tabs)/profile";
import EditNameRoute from "../../../app/edit-name";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];
const routes = { index: HomeRoute, profile: ProfileRoute, "edit-name": EditNameRoute };

describe("EditNameScreen", () => {
  let realm: Realm;
  beforeEach(() => {
    realm = openTestRealm(models);
    realm.write(() => {
      realm.create(Profile, { name: "Ana", dailyGoal: 20, createdAt: new Date(2026, 2, 15) });
    });
  });
  afterEach(() => {
    jest.restoreAllMocks();
    realm.close();
  });

  const storedName = () => realm.objects(Profile)[0].name;
  const open = (url = "/profile") => renderRouterWithProviders(routes, realm, url);

  it("PRF-04 tapping the header opens the modal with the current name", async () => {
    const rendered = await open();
    await fireEvent.press(await screen.findByRole("button", { name: "Editar nome, Ana" }));
    expect(await screen.findByText("Editar nome")).toBeTruthy();
    expect(rendered).toHavePathname("/edit-name");
    expect(screen.getByLabelText("Nome").props.value).toBe("Ana");
    await rendered.unmount();
  });

  it("PRF-05 saves the trimmed name, returns to the profile and greets on home", async () => {
    const rendered = await open();
    await fireEvent.press(await screen.findByRole("button", { name: "Editar nome, Ana" }));
    await fireEvent.changeText(await screen.findByLabelText("Nome"), "  Bia  ");
    await fireEvent.press(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(rendered).toHavePathname("/profile"));
    expect(await screen.findByRole("button", { name: "Editar nome, Bia" })).toBeTruthy();
    expect(storedName()).toBe("Bia");
    await fireEvent.press(screen.getByRole("button", { name: "Editar nome, Bia" }));
    await screen.findByLabelText("Nome");
    await rendered.unmount();

    const home = await open("/");
    expect(await screen.findByText("Olá, Bia")).toBeTruthy();
    await home.unmount();
  });

  it("PRF-05 an empty name shows the error and keeps the old name", async () => {
    const rendered = await open("/edit-name");
    await fireEvent.changeText(await screen.findByLabelText("Nome"), "   ");
    await fireEvent.press(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Digite seu nome.")).toBeTruthy();
    expect(storedName()).toBe("Ana");
    await rendered.unmount();
  });

  it("ERR-01 a generic failure shows the message, keeps the modal and the old name", async () => {
    const rendered = await open("/edit-name");
    jest.spyOn(realm, "write").mockImplementation(() => {
      throw new Error("boom");
    });
    await fireEvent.changeText(await screen.findByLabelText("Nome"), "Bia");
    await fireEvent.press(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Não foi possível salvar. Tente de novo.")).toBeTruthy();
    expect(rendered).toHavePathname("/edit-name");
    expect(storedName()).toBe("Ana");
    await rendered.unmount();
  });
});

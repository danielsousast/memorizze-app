import { fireEvent, screen } from "expo-router/testing-library";
import { useLocalSearchParams } from "expo-router";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { i18n } from "@/lib/i18n";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import { CardEditorScreen } from "./card-editor-screen";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];

function NewCardRoute() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  return <CardEditorScreen deckId={deckId} />;
}

const routes = { "decks/[deckId]/cards/new": NewCardRoute };

describe("CardEditorScreen per locale (I18NS-04, I18NS-11)", () => {
  let realm: Realm;
  let deckId: string;
  beforeEach(() => {
    realm = openTestRealm(models);
    const deck = realm.write(() =>
      realm.create(Deck, { name: "Inglês", createdAt: new Date(), cards: [] }),
    );
    deckId = deck._id.toHexString();
  });
  afterEach(() => {
    i18n.locale = "pt-BR";
    jest.restoreAllMocks();
    realm.close();
  });

  it.each([
    ["en", "New card", "Front", "Back", "Save and create another", "Write the front of the card."],
    ["es", "Nueva tarjeta", "Anverso", "Reverso", "Guardar y crear otra", "Escribe el anverso de la tarjeta."],
  ])("%s", async (locale, title, front, back, another, frontError) => {
    i18n.locale = locale;
    const rendered = await renderRouterWithProviders(routes, realm, `/decks/${deckId}/cards/new`);
    expect(await screen.findByText(title)).toBeTruthy();
    expect(screen.getByLabelText(front)).toBeTruthy();
    expect(screen.getByLabelText(back)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: another }));
    expect(await screen.findByText(frontError)).toBeTruthy();
    await rendered.unmount();
  });
});

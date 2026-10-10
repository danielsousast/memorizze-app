import Realm, { BSON } from "realm";
import { openTestRealm } from "../../testing/realm";
import { Card, Deck, Profile, ReviewLog } from "./index";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];
const now = () => new Date();

describe("realm schemas", () => {
  let realm: Realm;

  beforeEach(() => {
    realm = openTestRealm(models);
  });

  afterEach(() => {
    realm.close();
  });

  it("SCH-01 registers four models with objectId primary keys and typed fields", () => {
    const byName = Object.fromEntries(
      realm.schema.map((s) => [s.name, s]),
    );
    for (const name of ["Profile", "Deck", "Card", "ReviewLog"]) {
      expect(byName[name].primaryKey).toBe("_id");
      expect(byName[name].properties._id.type).toBe("objectId");
    }
    const types = (model: string, field: string) =>
      byName[model].properties[field].type;
    expect(types("Profile", "dailyGoal")).toBe("int");
    expect(types("Card", "easeFactor")).toBe("double");
    for (const f of ["intervalDays", "repetitions", "lapses"]) {
      expect(types("Card", f)).toBe("int");
    }
    expect(types("ReviewLog", "grade")).toBe("int");
    expect(types("Deck", "cards")).toBe("list");
    expect(byName.Deck.properties.cards.objectType).toBe("Card");
  });

  it("SCH-02 applies defaults on creation", () => {
    realm.write(() => {
      realm.create(Profile, { name: "Ana", createdAt: now() });
      realm.create(Card, {
        front: "f",
        back: "b",
        dueDate: now(),
        createdAt: now(),
      });
    });
    const profile = realm.objects(Profile)[0];
    const card = realm.objects(Card)[0];
    expect(profile._id).toBeInstanceOf(BSON.ObjectId);
    expect(profile.dailyGoal).toBe(20);
    expect(card._id).toBeInstanceOf(BSON.ObjectId);
    expect(card.easeFactor).toBe(2.5);
    expect(card.intervalDays).toBe(0);
    expect(card.repetitions).toBe(0);
    expect(card.lapses).toBe(0);
  });

  it("SCH-03 indexes Card.dueDate and ReviewLog.reviewedAt", () => {
    const byName = Object.fromEntries(realm.schema.map((s) => [s.name, s]));
    expect(byName.Card.properties.dueDate.indexed).toBe(true);
    expect(byName.ReviewLog.properties.reviewedAt.indexed).toBe(true);
  });

  it("SCH-04 makes Deck.description the only optional field and rejects missing required fields", () => {
    const optional = realm.schema.flatMap((s) =>
      Object.values(s.properties)
        .filter((p) => p.optional)
        .map((p) => `${s.name}.${p.name}`),
    );
    expect(optional).toEqual(["Deck.description"]);

    expect(() =>
      realm.write(() => {
        realm.create(Card, {
          back: "b",
          dueDate: now(),
          createdAt: now(),
        } as never);
      }),
    ).toThrow();
    expect(realm.objects(Card)).toHaveLength(0);
  });

  it("SCH-05 reads a card back from deck.cards as a Card instance", () => {
    realm.write(() => {
      const deck = realm.create(Deck, { name: "D", createdAt: now() });
      deck.cards.push(
        realm.create(Card, {
          front: "front",
          back: "back",
          dueDate: now(),
          createdAt: now(),
        }),
      );
    });
    const card = realm.objects(Deck)[0].cards[0];
    expect(card).toBeInstanceOf(Card);
    expect(card.front).toBe("front");
    expect(card.back).toBe("back");
    expect(card.easeFactor).toBe(2.5);
  });

  it("SCH-06 keeps the review log intact after the card is deleted", () => {
    const card = realm.write(() =>
      realm.create(Card, {
        front: "f",
        back: "b",
        dueDate: now(),
        createdAt: now(),
      }),
    );
    const cardId = card._id;
    const deckId = new BSON.ObjectId();
    realm.write(() => {
      realm.create(ReviewLog, { cardId, deckId, grade: 2, reviewedAt: now() });
    });
    realm.write(() => realm.delete(card));
    const log = realm.objects(ReviewLog)[0];
    expect(log.cardId.equals(cardId)).toBe(true);
    expect(log.deckId.equals(deckId)).toBe(true);
    expect(log.grade).toBe(2);
  });
});

import { i18n } from "@/lib/i18n";
import { deckSheetSubtitle, deleteDeckMessage } from "@/features/decks/screens/deck-messages";

import { replaceMessage, type BackupFile } from "./backup";
import {
  formatDayMonth,
  formatLongDate,
  formatMonthYear,
  formatWeekdayShort,
} from "./dates";
import { reviewsLabel, signOutMessage, streakTitle, tomorrowLabel } from "./labels";
import { gradeLabel } from "./schedule";
import { stageLabel } from "./stage";

type Locale = "pt-BR" | "en" | "es";

function inLocale(locale: Locale, run: () => void) {
  i18n.locale = locale;
  run();
}

afterEach(() => {
  i18n.locale = "pt-BR";
});

// 12/10/2026 is a Monday.
const MONDAY = new Date(2026, 9, 12);

describe("dates per locale (I18NS-07)", () => {
  const table: Record<Locale, [string, string, string, string]> = {
    "pt-BR": ["Segunda-feira, 12 de outubro", "12 de outubro", "outubro de 2026", "Seg"],
    en: ["Monday, October 12", "October 12", "October 2026", "Mon"],
    es: ["lunes, 12 de octubre", "12 de octubre", "octubre de 2026", "lun"],
  };

  it.each(Object.keys(table) as Locale[])("formats %s", (locale) => {
    inLocale(locale, () => {
      expect([
        formatLongDate(MONDAY),
        formatDayMonth(MONDAY),
        formatMonthYear(MONDAY),
        formatWeekdayShort(MONDAY),
      ]).toEqual(table[locale]);
    });
  });

  it("lists short weekdays from Sunday to Saturday", () => {
    const week = Array.from({ length: 7 }, (_, i) => new Date(2026, 9, 11 + i));
    const expected: Record<Locale, string[]> = {
      "pt-BR": ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
      en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      es: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
    };
    for (const locale of Object.keys(expected) as Locale[]) {
      inLocale(locale, () => {
        expect(week.map(formatWeekdayShort)).toEqual(expected[locale]);
      });
    }
  });
});

describe("plurals per locale (I18NS-06)", () => {
  it.each([
    ["pt-BR", "0 cartões", "1 cartão", "2 cartões"],
    ["en", "0 cards", "1 card", "2 cards"],
    ["es", "0 tarjetas", "1 tarjeta", "2 tarjetas"],
  ] as const)("signOutMessage in %s", (locale, zero, one, two) => {
    inLocale(locale, () => {
      expect(signOutMessage(0, 0)).toContain(zero);
      expect(signOutMessage(1, 1)).toContain(one);
      expect(signOutMessage(2, 2)).toContain(two);
    });
  });

  it.each([
    ["pt-BR", ["0 revisões", "1 revisão", "2 revisões"], ["0 dias seguidos", "1 dia seguido", "2 dias seguidos"]],
    ["en", ["0 reviews", "1 review", "2 reviews"], ["0 days in a row", "1 day in a row", "2 days in a row"]],
    ["es", ["0 repasos", "1 repaso", "2 repasos"], ["0 días seguidos", "1 día seguido", "2 días seguidos"]],
  ] as const)("reviewsLabel and streakTitle in %s", (locale, reviews, streaks) => {
    inLocale(locale, () => {
      expect([0, 1, 2].map(reviewsLabel)).toEqual(reviews);
      expect([0, 1, 2].map(streakTitle)).toEqual(streaks);
    });
  });

  it.each([
    ["pt-BR", ["Amanhã: nenhum cartão", "Amanhã: 1 cartão", "Amanhã: 2 cartões"]],
    ["en", ["Tomorrow: no cards", "Tomorrow: 1 card", "Tomorrow: 2 cards"]],
    ["es", ["Mañana: ninguna tarjeta", "Mañana: 1 tarjeta", "Mañana: 2 tarjetas"]],
  ] as const)("tomorrowLabel in %s", (locale, expected) => {
    inLocale(locale, () => {
      expect([0, 1, 2].map(tomorrowLabel)).toEqual(expected);
    });
  });

  it("deckSheetSubtitle in the three languages", () => {
    inLocale("pt-BR", () => {
      expect(deckSheetSubtitle(1, 0)).toBe("1 cartão");
      expect(deckSheetSubtitle(2, 1)).toBe("2 cartões · 1 para hoje");
    });
    inLocale("en", () => {
      expect(deckSheetSubtitle(1, 0)).toBe("1 card");
      expect(deckSheetSubtitle(2, 1)).toBe("2 cards · 1 due today");
    });
    inLocale("es", () => {
      expect(deckSheetSubtitle(1, 0)).toBe("1 tarjeta");
      expect(deckSheetSubtitle(2, 1)).toBe("2 tarjetas · 1 para hoy");
    });
  });
});

describe("interpolation (I18NS-05)", () => {
  it("deleteDeckMessage keeps the deck name untranslated", () => {
    expect(deleteDeckMessage("Inglês", 3)).toBe(
      "“Inglês” e seus 3 cartões serão apagados deste aparelho. Não dá para desfazer.",
    );
    inLocale("en", () => {
      expect(deleteDeckMessage("Inglês", 3)).toBe(
        "“Inglês” and its 3 cards will be erased from this device. This can't be undone.",
      );
      expect(deleteDeckMessage("Inglês", 1)).toContain("its only card");
    });
    inLocale("es", () => {
      expect(deleteDeckMessage("Inglês", 3)).toBe(
        "«Inglês» y sus 3 tarjetas se borrarán de este dispositivo. No se puede deshacer.",
      );
    });
  });

  it("replaceMessage formats counts with the locale separator", () => {
    const backup = {
      decks: new Array(1),
      cards: new Array(3418),
      reviewLogs: new Array(2),
    } as unknown as BackupFile;
    expect(replaceMessage(backup)).toBe(
      "Substituir 1 baralho, 3.418 cartões e 2 revisões pelos do arquivo?",
    );
    inLocale("en", () => {
      expect(replaceMessage(backup)).toBe(
        "Replace 1 deck, 3,418 cards and 2 reviews with the ones in the file?",
      );
    });
  });
});

describe("resolved at call time (I18NS-11)", () => {
  it("changes the text between two calls of the same function", () => {
    const first = tomorrowLabel(2);
    i18n.locale = "en";
    expect(tomorrowLabel(2)).not.toBe(first);
    expect(gradeLabel[0]).toBe("Again");
    expect(stageLabel.new).toBe("New");
    i18n.locale = "es";
    expect(gradeLabel[0]).toBe("Fallé");
    expect(stageLabel.new).toBe("Nueva");
  });
});

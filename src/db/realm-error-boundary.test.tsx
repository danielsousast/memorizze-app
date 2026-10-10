import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { RealmErrorBoundary } from "@/db/realm-error-boundary";

function Boom(): never {
  throw new Error("boom");
}

describe("RealmErrorBoundary", () => {
  it("shows the error text when a child throws", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    await render(
      <RealmErrorBoundary>
        <Boom />
      </RealmErrorBoundary>,
    );

    expect(
      screen.getByText("Não foi possível abrir o banco de dados."),
    ).toBeTruthy();
  });

  it("renders children when nothing throws", async () => {
    await render(
      <RealmErrorBoundary>
        <Text>ok</Text>
      </RealmErrorBoundary>,
    );

    expect(screen.getByText("ok")).toBeTruthy();
  });
});

import { render, screen } from "@testing-library/react-native";

import { Badge } from "./badge";

describe("Badge", () => {
  it.each(["accent", "neutral", "outline"] as const)("renders text in tone %s", async (tone) => {
    await render(<Badge text="2 hoje" tone={tone} />);
    expect(screen.getByText("2 hoje")).toBeTruthy();
  });

  it("renders with an icon", async () => {
    await render(<Badge text="Em dia" tone="neutral" icon="check" />);
    expect(screen.getByText("Em dia")).toBeTruthy();
  });
});

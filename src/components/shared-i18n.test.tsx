import { render, screen } from "@testing-library/react-native";

import { i18n } from "@/lib/i18n";

import { ConfirmDialog } from "./confirm-dialog";
import { GoalProgress } from "./goal-progress";
import { NotFound } from "./not-found";

afterEach(() => {
  i18n.locale = "pt-BR";
});

function renderDialog() {
  return render(
    <ConfirmDialog
      visible
      title="T"
      message="M"
      confirmLabel="OK"
      icon="trash"
      onConfirm={jest.fn()}
      onCancel={jest.fn()}
    />,
  );
}

describe("shared components per locale (I18NS-04)", () => {
  it.each([
    ["en", "Cancel", "Back", "Daily goal", "3 of 5 reviews"],
    ["es", "Cancelar", "Volver", "Meta diaria", "3 de 5 repasos"],
  ])("%s", async (locale, cancel, back, goal, progress) => {
    i18n.locale = locale;
    await renderDialog();
    expect(screen.getByRole("button", { name: cancel })).toBeTruthy();
    await render(<NotFound title="x" onAction={jest.fn()} />);
    expect(screen.getByRole("button", { name: back })).toBeTruthy();
    await render(<GoalProgress done={3} goal={5} />);
    expect(screen.getByText(goal)).toBeTruthy();
    expect(screen.getByText(progress)).toBeTruthy();
  });
});

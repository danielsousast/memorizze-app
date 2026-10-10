import { render } from "@testing-library/react-native";

import { Icon, type IconName } from "./icon";

describe("Icon", () => {
  it.each(["plus", "chevron-left", "more", "search", "check", "bulb", "close", "calendar", "flame", "house", "person", "minus", "trash", "gear", "sign-out", "pencil", "reset"] as IconName[])(
    "renders %s without throwing",
    async (name) => {
      await expect(render(<Icon name={name} />)).resolves.toBeDefined();
    },
  );
});

import { createQueryClient } from "@/lib/query-client";

describe("createQueryClient", () => {
  it("runs queries and mutations offline, without retries", () => {
    const { queries, mutations } = createQueryClient().getDefaultOptions();

    expect(queries).toEqual({
      networkMode: "always",
      retry: false,
      staleTime: Infinity,
    });
    expect(mutations).toEqual({ networkMode: "always", retry: false });
  });
});

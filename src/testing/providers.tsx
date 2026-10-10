import { RealmProvider } from "@realm/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";
import type Realm from "realm";

import { createQueryClient } from "@/lib/query-client";

export async function renderHookWithProviders<Result>(
  hook: () => Result,
  realm: Realm,
) {
  const queryClient = createQueryClient();
  // gcTime: Infinity keeps React Query from scheduling timers that hold Jest open.
  const { queries, mutations } = queryClient.getDefaultOptions();
  queryClient.setDefaultOptions({
    queries: { ...queries, gcTime: Infinity },
    mutations: { ...mutations, gcTime: Infinity },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <RealmProvider realm={realm}>{children}</RealmProvider>
      </QueryClientProvider>
    );
  }

  const rendered = await renderHook(hook, { wrapper: Wrapper });
  return {
    ...rendered,
    queryClient,
    unmount: async () => {
      await rendered.unmount();
      queryClient.clear();
    },
  };
}

import { RealmProvider } from "@realm/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderRouter } from "expo-router/testing-library";
import { Stack } from "expo-router";
import type { ComponentType, ReactElement } from "react";
import type Realm from "realm";

import { createQueryClient } from "@/lib/query-client";

type Routes = Record<string, ComponentType | (() => ReactElement | null)>;

/**
 * Renders file-system-like `routes` with real Expo Router navigation, an in-memory
 * Realm and a test QueryClient. Pass `_layout`-less route maps; a root layout with
 * providers and a `Stack` is injected. Assert navigation with
 * `expect(rendered).toHavePathname(...)` (not on the global `screen`).
 */
export async function renderRouterWithProviders(
  routes: Routes,
  realm: Realm,
  initialUrl = "/",
) {
  const queryClient = createQueryClient();
  // gcTime: Infinity keeps React Query from scheduling timers that hold Jest open.
  const { queries, mutations } = queryClient.getDefaultOptions();
  queryClient.setDefaultOptions({
    queries: { ...queries, gcTime: Infinity },
    mutations: { ...mutations, gcTime: Infinity },
  });

  function Layout() {
    return (
      <QueryClientProvider client={queryClient}>
        <RealmProvider realm={realm}>
          <Stack screenOptions={{ headerShown: false }} />
        </RealmProvider>
      </QueryClientProvider>
    );
  }

  // Testing Library v14 renders asynchronously, so renderRouter returns a promise that
  // carries the pathname getters (used by `toHavePathname`). Copy them onto the resolved
  // result so `expect(rendered).toHavePathname(...)` works after `await`.
  const pending = renderRouter({ ...routes, _layout: Layout }, { initialUrl });
  const rendered = Object.assign(await pending, {
    getPathname: pending.getPathname,
    getPathnameWithParams: pending.getPathnameWithParams,
    getSegments: pending.getSegments,
    getSearchParams: pending.getSearchParams,
    getRouterState: pending.getRouterState,
  });
  return {
    ...rendered,
    queryClient,
    unmount: async () => {
      await rendered.unmount();
      queryClient.clear();
    },
  };
}

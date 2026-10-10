import { QueryClient } from "@tanstack/react-query";

// Realm is local: never pause for connectivity, never retry a deterministic error.
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { networkMode: "always", retry: false, staleTime: Infinity },
      mutations: { networkMode: "always", retry: false },
    },
  });
}

import type { QueryClient } from '@tanstack/react-query';

const resourcesByClient: WeakMap<QueryClient, Set<() => void>> = new WeakMap();

export function registerSessionResource({
  queryClient,
  dispose,
}: {
  queryClient: QueryClient;
  dispose: () => void;
}): void {
  let resources: Set<() => void> | undefined =
    resourcesByClient.get(queryClient);
  if (!resources) {
    resources = new Set();
    resourcesByClient.set(queryClient, resources);
  }
  resources.add(dispose);
}

export function disposeSessionResources(queryClient: QueryClient): void {
  const resources: Set<() => void> | undefined =
    resourcesByClient.get(queryClient);
  resourcesByClient.delete(queryClient);
  resources?.forEach((dispose) => {
    dispose();
  });
}

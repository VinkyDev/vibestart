import {
  MutationCache,
  QueryCache,
  QueryClient,
  environmentManager,
} from "@tanstack/react-query";
import { toast } from "sonner";

const createQueryClient = () => {
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000 } },
    mutationCache: new MutationCache({
      onError: (error) => {
        toast.error(error.message);
      },
    }),
    queryCache: new QueryCache({
      onError: (error) => {
        toast.error(error.message, {
          action: {
            label: "Retry",
            onClick: () => {
              void queryClient.invalidateQueries();
            },
          },
        });
      },
    }),
  });

  return queryClient;
};

let browserQueryClient: QueryClient | undefined;

export const getQueryClient = () => {
  if (environmentManager.isServer()) {
    return createQueryClient();
  }
  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
};

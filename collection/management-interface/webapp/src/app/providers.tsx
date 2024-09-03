"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import { Theme } from "screenlife-shared";

export const queryClient = new QueryClient();

export default function Providers({ children }: PropsWithChildren) {
  return (
    <Theme>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Theme>
  );
}

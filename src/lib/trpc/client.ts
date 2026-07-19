"use client"

import { QueryClient } from "@tanstack/react-query"
import { httpBatchLink } from "@trpc/client"
import { createTRPCReact } from "@trpc/react-query"

import type { AppRouter } from "@/server/routers/_app"

export const trpc = createTRPCReact<AppRouter>()

let browserQueryClient: QueryClient | undefined

export function getQueryClient() {
  if (typeof window === "undefined") {
    return new QueryClient()
  }

  if (!browserQueryClient) {
    browserQueryClient = new QueryClient()
  }

  return browserQueryClient
}

export function getTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: "/api/trpc",
      }),
    ],
  })
}

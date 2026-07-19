import { createTRPCProxyClient, httpLink } from "@trpc/client"

import type { AppRouter } from "@/server/routers/_app"

function getBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL

  if (envUrl) {
    return envUrl
  }

  return "http://localhost:3000"
}

export const trpcServer = createTRPCProxyClient<AppRouter>({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
    }),
  ],
})

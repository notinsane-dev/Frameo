import { fetchRequestHandler } from "@trpc/server/adapters/fetch"

import { appRouter } from "@/server/routers/_app"
import { createContext } from "@/server/trpc"

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext({ req }),
    onError({ path, error }) {
      console.error(`[tRPC] ${path ?? "unknown"}:`, error.message, error.cause ?? "")
    },
  })

export { handler as GET, handler as POST }

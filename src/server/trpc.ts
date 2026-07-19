import { initTRPC, TRPCError } from "@trpc/server"
import * as Sentry from "@sentry/nextjs"
import { auth, type Session } from "@/lib/auth/auth"

export type Context = {
	session: Session | null
}

type CreateContextOptions = {
	req: Request
}

export async function createContext({ req }: CreateContextOptions): Promise<Context> {
	const session = (await auth.api.getSession({ headers: req.headers })) as Session | null
	return { session }
}

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure.use(async ({ next }) => {
	try {
		return await next()
	} catch (error) {
		Sentry.captureException(error)
		throw error
	}
})

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	try {
		if (!ctx.session) {
			throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in." })
		}

		return next({
			ctx: {
				...ctx,
				session: ctx.session,
			},
		})
	} catch (error) {
		Sentry.captureException(error)
		throw error
	}
})

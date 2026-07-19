import { friendsRouter } from "@/server/routers/friends"
import { moviesRouter } from "@/server/routers/movies"
import { recommendationsRouter } from "@/server/routers/recommendations"
import { userRouter } from "@/server/routers/user"
import { router } from "@/server/trpc"

export const appRouter = router({
	movies: moviesRouter,
	user: userRouter,
	friends: friendsRouter,
	recommendations: recommendationsRouter,
})

export type AppRouter = typeof appRouter

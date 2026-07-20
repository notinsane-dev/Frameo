import { diaryRouter } from "@/server/routers/diary"
import { friendsRouter } from "@/server/routers/friends"
import { moviesRouter } from "@/server/routers/movies"
import { recommendationsRouter } from "@/server/routers/recommendations"
import { reviewsRouter } from "@/server/routers/reviews"
import { tasteRouter } from "@/server/routers/taste"
import { userRouter } from "@/server/routers/user"
import { watchTogetherRouter } from "@/server/routers/watchTogether"
import { router } from "@/server/trpc"

export const appRouter = router({
	movies: moviesRouter,
	user: userRouter,
	friends: friendsRouter,
	recommendations: recommendationsRouter,
	diary: diaryRouter,
	taste: tasteRouter,
	watchTogether: watchTogetherRouter,
	reviews: reviewsRouter,
})

export type AppRouter = typeof appRouter

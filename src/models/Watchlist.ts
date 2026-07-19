import mongoose, { InferSchemaType, Schema } from "mongoose"

const WatchlistSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    movieId: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    poster: { type: String },
    overview: { type: String },
    voteAverage: { type: Number },
    releaseDate: { type: String },
    addedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
)

WatchlistSchema.index({ userId: 1, movieId: 1 }, { unique: true })

export type WatchlistDocument = InferSchemaType<typeof WatchlistSchema>

export default
  mongoose.models.Watchlist ||
  mongoose.model<WatchlistDocument>("Watchlist", WatchlistSchema)

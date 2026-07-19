import mongoose, { InferSchemaType, Schema } from "mongoose"

const ActivitySchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: [
        "rated_movie",
        "added_watchlist",
        "removed_watchlist",
        "became_friends",
        "created_list",
        "sent_request",
      ],
    },
    movieId: { type: Number },
    movieTitle: { type: String, trim: true },
    moviePoster: { type: String },
    rating: { type: Number },
    targetUserId: { type: String },
    targetUserName: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    versionKey: false,
  },
)

ActivitySchema.index({ userId: 1, createdAt: -1 })

export type ActivityDocument = InferSchemaType<typeof ActivitySchema>

export default
  mongoose.models.Activity ||
  mongoose.model<ActivityDocument>("Activity", ActivitySchema)

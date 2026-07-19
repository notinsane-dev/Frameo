import mongoose, { InferSchemaType, Schema } from "mongoose"

const RatingSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    movieId: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    poster: { type: String },
    rating: {
      type: Number,
      required: true,
      min: 0.5,
      max: 10,
      validate: {
        validator(value: number) {
          return Number.isFinite(value) && Math.round(value * 2) === value * 2
        },
        message: "Rating must be in 0.5 increments",
      },
    },
    review: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  {
    versionKey: false,
  },
)

RatingSchema.index({ userId: 1, movieId: 1 }, { unique: true })

export type RatingDocument = InferSchemaType<typeof RatingSchema>

export default
  mongoose.models.Rating || mongoose.model<RatingDocument>("Rating", RatingSchema)

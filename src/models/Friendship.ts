import mongoose, { InferSchemaType, Schema } from "mongoose"

const FriendshipSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    friendId: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
)

FriendshipSchema.index({ userId: 1, friendId: 1 }, { unique: true })

export type FriendshipDocument = InferSchemaType<typeof FriendshipSchema>

export default
  mongoose.models.Friendship ||
  mongoose.model<FriendshipDocument>("Friendship", FriendshipSchema)

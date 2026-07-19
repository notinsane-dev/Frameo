import mongoose, { InferSchemaType, Schema } from "mongoose"

const FriendRequestSchema = new Schema(
  {
    senderId: { type: String, required: true, index: true },
    receiverId: { type: String, required: true, index: true },
    senderName: { type: String },
    senderUsername: { type: String },
    senderImage: { type: String },
    receiverName: { type: String },
    receiverUsername: { type: String },
    receiverImage: { type: String },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
)

FriendRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true })

FriendRequestSchema.pre("save", function setUpdatedAt() {
  this.updatedAt = new Date()
})

export type FriendRequestDocument = InferSchemaType<typeof FriendRequestSchema>

export default
  mongoose.models.FriendRequest ||
  mongoose.model<FriendRequestDocument>("FriendRequest", FriendRequestSchema)

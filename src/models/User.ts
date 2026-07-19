import bcrypt from "bcryptjs"
import mongoose, { InferSchemaType, Schema } from "mongoose"

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [20, "Username must be at most 20 characters"],
      match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"],
    },
    password: { type: String },
    image: { type: String },
    imagePublicId: { type: String },
    avatarUpdatedAt: { type: Date },
    usernameIsTemporary: { type: Boolean, default: false },
    usernameUpdatedAt: { type: Date },
    bio: { type: String, maxlength: 200 },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpiry: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpiry: { type: Date },
    authProvider: { type: String, enum: ["email", "google"], default: "email" },
    isPublic: { type: Boolean, default: true },
    favoriteGenres: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  {
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

UserSchema.index({ username: 1 }, { unique: true })

UserSchema.virtual("id").get(function getId() {
  return this._id.toHexString()
})

UserSchema.pre("save", async function setUpdatedAt() {
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, 12)
  }

  this.updatedAt = new Date()
})

UserSchema.methods.comparePassword = async function comparePassword(candidatePassword: string) {
  if (!this.password) return false
  return bcrypt.compare(candidatePassword, this.password)
}

export type UserDocument = InferSchemaType<typeof UserSchema>

export default
  mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema)

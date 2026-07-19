import { NextResponse } from "next/server"

import { auth } from "@/lib/auth/auth"
import { uploadProfilePicture } from "@/lib/cloudinary/client"
import { connectDB } from "@/lib/db/mongoose"
import UserModel from "@/models/User"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE = 2 * 1024 * 1024

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("avatar") as File | null

  if (!file) {
    return NextResponse.json({ error: "Avatar file is required" }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, and WEBP are allowed" }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File size must be 2MB or less" }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  await connectDB()
  const userLookup = {
    $or: [
      { _id: session.user.id },
      { id: session.user.id },
      { email: session.user.email },
    ],
  }

  const existingUser = await UserModel.findOne(userLookup).select("_id imagePublicId").lean()
  if (!existingUser?._id) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const upload = await uploadProfilePicture(
    buffer,
    String(existingUser._id),
    existingUser?.imagePublicId || undefined,
  )

  await UserModel.findByIdAndUpdate(existingUser._id, {
    $set: {
      image: upload.url,
      imagePublicId: upload.publicId,
      avatarUpdatedAt: new Date(),
      updatedAt: new Date(),
    },
  })

  return NextResponse.json({ success: true, url: upload.url, publicId: upload.publicId })
}
